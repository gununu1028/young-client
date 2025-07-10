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
            if (action) {
                event.preventDefault();
                action();
            }
        },
        
        // ゲーム開始/停止切り替え
        toggleGame() {
            if (!this.gameStarted) {
                this.startGame();
            } else {
                this.pauseGame();
            }
        },
        
        // ゲーム開始
        startGame() {
            this.gameStarted = true;
            this.isPaused = false;
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, this.fieldSpeed);
        },
        
        // ゲーム一時停止
        pauseGame() {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                clearInterval(this.gameLoop);
            } else {
                this.gameLoop = setInterval(() => {
                    this.updateGame();
                }, this.fieldSpeed);
            }
        },
        
        // プレイヤー移動
        movePlayer(direction) {
            if (!this.gameStarted || this.isPaused) return;
            
            const newPosition = this.playerPosition + direction;
            if (newPosition >= 0 && newPosition < GAME_CONSTANTS.FIELD_WIDTH) {
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
            
            if (this.moveDistance >= GAME_CONSTANTS.BLOCK_SIZE) {
                this.moveDistance = 0;
                this.fieldOffset = 0;
                this.blocksMovedCount++;
                
                this.displayField.shift();
                const nextRowIndex = 12 + this.blocksMovedCount;
                const nextRow = nextRowIndex < this.fieldData.length 
                    ? [...this.fieldData[nextRowIndex]] 
                    : [0, 0, 0];
                this.displayField.push(nextRow);
            }
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
            switch (cellType) {
                case GAME_CONSTANTS.CELL_TYPES.OBSTACLE:
                    if (this.isInvincible) {
                        this.isInvincible = false;
                    } else {
                        this.endGame();
                    }
                    break;
                case GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM:
                    this.score += GAME_CONSTANTS.ITEM_SCORE;
                    break;
                case GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM:
                    this.isInvincible = true;
                    break;
            }
        },
        
        // スコア更新
        updateScore() {
            if (this.moveDistance === 0) {
                this.score += GAME_CONSTANTS.BLOCK_SCORE;
            }
        },
        
        // スピード上昇チェック
        checkSpeedIncrease() {
            if (this.blocksMovedCount > 0 && this.blocksMovedCount % GAME_CONSTANTS.SPEED_INCREASE_BLOCKS === 0) {
                this.fieldSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, this.fieldSpeed - 5);
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => {
                    this.updateGame();
                }, this.fieldSpeed);
            }
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
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
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