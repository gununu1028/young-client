// ゲーム画面コンポーネント
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
    
    mounted() {
        this.initGame();
        this.setupKeys();
    },
    
    beforeUnmount() {
        this.stopGame();
        document.removeEventListener('keydown', this.handleKeyDown);
    },
    
    methods: {
        // ゲーム初期化
        initGame() {
            // サンプルデータを使用
            this.fieldData = [...SAMPLE_FIELD_DATA];
            this.createDisplayField();
        },
        
        // キーボード設定
        setupKeys() {
            document.addEventListener('keydown', this.handleKeyDown);
        },
        
        // 表示用フィールドを作成
        createDisplayField() {
            this.displayField = [];
            for (let i = 0; i < 20; i++) {
                if (i < this.fieldData.length) {
                    this.displayField.push([...this.fieldData[i]]);
                } else {
                    this.displayField.push([0, 0, 0]);  // 空の行
                }
            }
        },
        
        // キー入力処理
        handleKeyDown(event) {
            if (this.gameOver) return;
            
            if (event.code === 'Space' && !this.gameStarted) {
                this.startGame();
            } else if (event.code === 'ArrowLeft') {
                this.movePlayer(-1);
            } else if (event.code === 'ArrowRight') {
                this.movePlayer(1);
            }
            
            event.preventDefault();
        },
        
        // ゲーム開始
        startGame() {
            this.gameStarted = true;
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, GAME_CONSTANTS.INITIAL_SPEED);
        },
        
        // ゲーム停止
        stopGame() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },
        
        // プレイヤー移動
        movePlayer(direction) {
            if (!this.gameStarted) return;
            
            const newPosition = this.playerPosition + direction;
            
            // 画面の端を超えないようにチェック
            if (newPosition >= 0 && newPosition < 3) {
                this.playerPosition = newPosition;
            }
        },
        
        // ゲーム更新（毎フレーム実行）
        updateGame() {
            this.moveField();
            this.checkCollisions();
            this.updateScore();
        },
        
        // フィールドを下に移動
        moveField() {
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
            // 一番上の行を削除
            this.displayField.shift();
            
            // 新しい行を下に追加
            const nextRowIndex = 19 + this.blocksMovedCount;
            if (nextRowIndex < this.fieldData.length) {
                this.displayField.push([...this.fieldData[nextRowIndex]]);
            } else {
                this.displayField.push([0, 0, 0]);  // 空の行
            }
        },
        
        // 衝突判定
        checkCollisions() {
            const playerRow = this.displayField[GAME_CONSTANTS.PLAYER_ROW];
            if (!playerRow) return;
            
            const cellType = playerRow[this.playerPosition];
            
            // 川（何もない）なら何もしない
            if (cellType === 0) return;
            
            // 衝突したセルを川に変更
            playerRow[this.playerPosition] = 0;
            
            // 障害物に当たったらゲームオーバー
            if (cellType === 1) {
                this.endGame();
            }
        },
        
        // スコア更新
        updateScore() {
            if (this.moveDistance === 0) {
                this.score += GAME_CONSTANTS.BLOCK_SCORE;
            }
        },
        
        // ゲーム終了
        endGame() {
            this.gameOver = true;
            this.gameStarted = false;
            this.stopGame();
            
            // スコアを保存
            localStorage.setItem('gameScore', this.score);
            
            // 1秒後にゲームオーバー画面へ
            setTimeout(() => {
                this.$router.push('/gameover');
            }, 1000);
        },
        
        // セルの見た目を決める
        getCellClass(cellValue) {
            if (cellValue === 0) return 'river';     // 川
            if (cellValue === 1) return 'obstacle';  // 障害物
            return 'river';
        }
    }
};