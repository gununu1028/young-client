// ゲーム画面
const GameScreen = {
    template: '#game-template',

    data() {
        return {
            // ゲームの状態
            gameStarted: false,    // ゲームが開始されているか
            gameOver: false,       // ゲームオーバーか

            // プレイヤーとスコア
            score: 0,              // 現在のスコア
            playerPosition: 1,     // プレイヤーの横位置（0,1,2）

            // フィールド関連
            fieldOffset: 0,        // フィールドの縦スクロール位置
            fieldData: [],         // ゲームフィールドのデータ
            displayField: [],      // 画面に表示するフィールド

            // ゲームループ
            gameLoop: null,        // ゲームループのタイマー
            moveDistance: 0,       // 移動距離の計算用
            blocksMovedCount: 0    // 移動したブロック数
        };
    },

    computed: {
        // スコアを8桁で表示
        scoreDisplay() {
            return this.score.toString().padStart(8, '0');
        },
        // プレイヤーの縦位置を計算
        playerTopPosition() {
            return GAME_CONSTANTS.PLAYER_ROW * 64;
        }
    },

    async mounted() {
        // コンポーネントがマウントされた時の初期化処理
        await this.initGame();
        this.setupKeys();
    },

    beforeUnmount() {
        // 画面を離れる時の後始末（ゲーム停止とキーボードイベント削除）
        this.stopGame();
        document.removeEventListener('keydown', this.handleKeyDown);
    },

    methods: {
        // ゲーム初期化
        async initGame() {
            // APIからフィールドデータを取得
            const response = await fetch('https://jya2025.m5a.jp/api/field');
            const data = await response.json();
            this.fieldData = data.field_data;
            
            // 表示用フィールドを初期化（最初の20行を表示）
            this.displayField = [];
            for (let i = 0; i < 20; i++) {
                if (i < this.fieldData.length) {
                    this.displayField.push([...this.fieldData[i]]);
                } else {
                    this.displayField.push([0, 0, 0]);  // 空の行
                }
            }
        },

        // キーボード設定
        setupKeys() {
            // キーダウンイベントリスナーを登録
            document.addEventListener('keydown', this.handleKeyDown);
        },

        // キー入力処理
        handleKeyDown(event) {
            // ゲームオーバー中は何もしない
            if (this.gameOver) return;

            // スペースキーでゲーム開始
            if (event.code === 'Space' && !this.gameStarted) {
                this.startGame();
            // 左矢印キーで左に移動
            } else if (event.code === 'ArrowLeft') {
                this.movePlayer(-1);
            // 右矢印キーで右に移動
            } else if (event.code === 'ArrowRight') {
                this.movePlayer(1);
            }

            // デフォルトの動作を無効化
            event.preventDefault();
        },

        // ゲーム開始
        startGame() {
            this.gameStarted = true;
            // ゲームループを開始（一定間隔でupdateGameを実行）
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, GAME_CONSTANTS.INITIAL_SPEED);
        },

        // ゲーム停止
        stopGame() {
            // ゲームループが動いている場合は停止
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },

        // プレイヤー移動
        movePlayer(direction) {
            // ゲーム開始前は移動できない
            if (!this.gameStarted) return;

            const newPosition = this.playerPosition + direction;

            // 画面の端を超えないようにチェック（0, 1, 2の範囲内）
            if (newPosition >= 0 && newPosition < 3) {
                this.playerPosition = newPosition;
            }
        },

        // ゲーム更新（毎フレーム実行）
        updateGame() {
            this.moveField();       // フィールドを下にスクロール
            this.checkCollisions(); // プレイヤーとアイテム/障害物の衝突判定
            this.updateScore();     // スコア更新
        },

        // フィールドを下に移動
        moveField() {
            // フィールドのオフセットと移動距離を更新
            this.fieldOffset += GAME_CONSTANTS.MOVE_STEP;
            this.moveDistance += GAME_CONSTANTS.MOVE_STEP;

            // 1ブロック分移動したら新しい行を追加
            if (this.moveDistance >= GAME_CONSTANTS.BLOCK_SIZE) {
                this.addNewRow();
                this.moveDistance = 0;
                this.fieldOffset = 0;
                this.blocksMovedCount++;
            }
        },

        // 新しい行をフィールドに追加
        addNewRow() {
            // 一番上の行を削除（上に消える）
            this.displayField.shift();

            // 新しい行を下に追加
            const nextRowIndex = 19 + this.blocksMovedCount;
            if (nextRowIndex < this.fieldData.length) {
                // フィールドデータがある場合はそのデータを追加
                this.displayField.push([...this.fieldData[nextRowIndex]]);
            } else {
                // フィールドデータがない場合は空の行を追加
                this.displayField.push([0, 0, 0]);
            }
        },

        // 衝突判定
        checkCollisions() {
            // プレイヤーがいる行を取得
            const playerRow = this.displayField[GAME_CONSTANTS.PLAYER_ROW];
            if (!playerRow) return;

            // プレイヤーの位置にあるセルの種類を取得
            const cellType = playerRow[this.playerPosition];

            // 川（何もない）なら何もしない
            if (cellType === 0) return;

            // 衝突したセルを川に変更（取得済み）
            playerRow[this.playerPosition] = 0;

            // 障害物に当たったらゲームオーバー
            if (cellType === 1) {
                this.endGame();
            }
            // セルタイプ2,3のアイテム処理は今後実装予定
        },

        // スコア更新
        updateScore() {
            // 1ブロック分移動完了時にスコア加算
            if (this.moveDistance === 0) {
                this.score += GAME_CONSTANTS.BLOCK_SCORE;
            }
        },

        // ゲーム終了
        endGame() {
            // ゲーム状態を終了に変更
            this.gameOver = true;
            this.gameStarted = false;
            this.stopGame();

            // 最終スコアをローカルストレージに保存
            localStorage.setItem('gameScore', this.score);

            // 1秒後にゲームオーバー画面へ遷移
            setTimeout(() => {
                this.$router.push('/gameover');
            }, 1000);
        },

        // セルの見た目を決める
        getCellClass(cellValue) {
            if (cellValue === 0) return 'river';     // 川（何もない）
            if (cellValue === 1) return 'obstacle';  // 障害物
            return 'river';
        }
    }
};