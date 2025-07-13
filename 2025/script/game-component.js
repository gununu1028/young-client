// ゲーム画面コンポーネント
const GameScreen = {
    template: '#game-template',
    
    data() {
        return {
            gameStarted: false,
            isPaused: false,
            gameOver: false,
            score: 0,
            playerPosition: 1,
            fieldOffset: 0,
            fieldData: [],
            displayField: [],
            isInvincible: false,
            gameLoop: null,
            fieldSpeed: GAME_CONSTANTS.INITIAL_SPEED,
            moveDistance: 0,
            blocksMovedCount: 0
        };
    },
    
    computed: {
        scoreDisplay() {
            return this.score.toString().padStart(8, '0');
        },
        playerTopPosition() {
            return GAME_CONSTANTS.PLAYER_ROW * 64;
        }
    },
    
    mounted() {
        this.initializeGame();
        this.setupEventListeners();
    },
    
    beforeUnmount() {
        this.cleanupGame();
        document.removeEventListener('keydown', this.handleKeyDown);
    },
    
    methods: {
        // ゲーム初期化
        async initializeGame() {
            await this.loadFieldData();
            this.generateDisplayField();
        },
        
        // フィールドデータ読み込み
        async loadFieldData() {
            try {
                const response = await fetch('/api/field');
                if (!response.ok) throw new Error(`API error: ${response.status}`);
                this.fieldData = await response.json();
            } catch (error) {
                console.warn('Error loading field data:', error);
                this.fieldData = [...SAMPLE_FIELD_DATA];
            }
        },
        
        // 表示用フィールド生成
        generateDisplayField() {
            this.displayField = [];
            for (let i = 0; i < 20; i++) {
                const row = i < this.fieldData.length 
                    ? [...this.fieldData[i]] 
                    : [0, 0, 0];
                this.displayField.push(row);
            }
        },
        
        // キーボード入力設定
        setupEventListeners() {
            document.addEventListener('keydown', this.handleKeyDown);
        },
        
        // キー入力処理
        handleKeyDown(event) {
            if (this.gameOver) return;
            
            const keyActions = {
                'Space': () => this.toggleGame(),
                'ArrowLeft': () => this.movePlayer(-1),
                'ArrowRight': () => this.movePlayer(1)
            };
            
            const action = keyActions[event.code];
            if (!action) return;
            
            event.preventDefault();
            action();
        },
        
        // ゲーム開始/停止切り替え
        toggleGame() {
            if (!this.gameStarted) {
                this.startGame();
                return;
            }
            
            this.pauseGame();
        },
        
        // ゲーム開始
        startGame() {
            this.gameStarted = true;
            this.isPaused = false;
            this.startGameLoop();
        },
        
        // ゲーム一時停止
        pauseGame() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                this.stopGameLoop();
                return;
            }
            
            this.startGameLoop();
        },
        
        // ゲームループ開始
        startGameLoop() {
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, this.fieldSpeed);
        },
        
        // ゲームループ停止
        stopGameLoop() {
            if (!this.gameLoop) return;
            
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        },
        
        // プレイヤー移動
        movePlayer(direction) {
            if (!this.gameStarted || this.isPaused) return;
            
            const newPosition = this.playerPosition + direction;
            const isValidPosition = newPosition >= 0 && newPosition < GAME_CONSTANTS.FIELD_WIDTH;
            
            if (isValidPosition) {
                this.playerPosition = newPosition;
            }
        },
        
        // ゲーム更新（メインループ）
        updateGame() {
            this.moveField();
            this.checkCollisions();
            this.updateScore();
            this.checkSpeedIncrease();
        },
        
        // フィールド移動
        moveField() {
            this.fieldOffset += GAME_CONSTANTS.MOVE_STEP;
            this.moveDistance += GAME_CONSTANTS.MOVE_STEP;
            
            if (this.moveDistance < GAME_CONSTANTS.BLOCK_SIZE) return;
            
            this.processBlockMovement();
        },
        
        // ブロック移動処理
        processBlockMovement() {
            this.moveDistance = 0;
            this.fieldOffset = 0;
            this.blocksMovedCount++;
            
            this.addNewRow();
        },
        
        // 新しい行を追加
        addNewRow() {
            this.displayField.shift();
            
            const nextRowIndex = 19 + this.blocksMovedCount;
            const nextRow = this.createNextRow(nextRowIndex);
            
            this.displayField.push(nextRow);
        },
        
        // 次の行を作成
        createNextRow(rowIndex) {
            return rowIndex < this.fieldData.length 
                ? [...this.fieldData[rowIndex]] 
                : [0, 0, 0];
        },
        
        // 衝突判定
        checkCollisions() {
            const playerRow = this.displayField[GAME_CONSTANTS.PLAYER_ROW];
            if (!playerRow) return;
            
            const currentCell = playerRow[this.playerPosition];
            if (currentCell === GAME_CONSTANTS.CELL_TYPES.RIVER) return;
            
            this.handleCollision(currentCell);
            playerRow[this.playerPosition] = GAME_CONSTANTS.CELL_TYPES.RIVER;
        },
        
        // 衝突処理
        handleCollision(cellType) {
            const collisionHandlers = {
                [GAME_CONSTANTS.CELL_TYPES.OBSTACLE]: () => this.handleObstacle(),
                [GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM]: () => this.handleScoreItem(),
                [GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM]: () => this.handleInvincibleItem()
            };
            
            const handler = collisionHandlers[cellType];
            if (handler) {
                handler();
            }
        },
        
        // 障害物との衝突処理
        handleObstacle() {
            if (this.isInvincible) {
                this.isInvincible = false;
                return;
            }
            
            this.endGame();
        },
        
        // スコアアイテム処理
        handleScoreItem() {
            this.score += GAME_CONSTANTS.ITEM_SCORE;
        },
        
        // 無敵アイテム処理
        handleInvincibleItem() {
            this.isInvincible = true;
        },
        
        // スコア更新
        updateScore() {
            if (this.moveDistance === 0) {
                this.score += GAME_CONSTANTS.BLOCK_SCORE;
            }
        },
        
        // スピード上昇チェック
        checkSpeedIncrease() {
            const shouldIncrease = this.shouldIncreaseSpeed();
            if (!shouldIncrease) return;
            
            this.increaseSpeed();
        },
        
        // スピード上昇判定
        shouldIncreaseSpeed() {
            return this.blocksMovedCount > 0 && 
                   this.blocksMovedCount % GAME_CONSTANTS.SPEED_INCREASE_BLOCKS === 0;
        },
        
        // スピード上昇処理
        increaseSpeed() {
            this.fieldSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, this.fieldSpeed - 5);
            this.restartGameLoop();
        },
        
        // ゲームループ再開
        restartGameLoop() {
            this.stopGameLoop();
            this.startGameLoop();
        },
        
        // ゲーム終了
        endGame() {
            this.gameOver = true;
            this.gameStarted = false;
            this.cleanupGame();
            
            localStorage.setItem('gameScore', this.score);
            setTimeout(() => {
                this.$router.push('/gameover');
            }, 1000);
        },
        
        // ゲーム終了処理
        cleanupGame() {
            this.stopGameLoop();
        },
        
        // セルのCSSクラス取得
        getCellClass(cellValue) {
            const cellClasses = {
                [GAME_CONSTANTS.CELL_TYPES.RIVER]: 'river',
                [GAME_CONSTANTS.CELL_TYPES.OBSTACLE]: 'obstacle',
                [GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM]: 'score-item',
                [GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM]: 'invincible-item'
            };
            return cellClasses[cellValue] || 'river';
        }
    }
};