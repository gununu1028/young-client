const { createApp } = Vue;

const GAME_CONSTANTS = {
    FIELD_WIDTH: 3,
    FIELD_HEIGHT: 12,
    BLOCK_SIZE: 64,
    PLAYER_ROW: 10,
    INITIAL_SPEED: 100,
    MIN_SPEED: 50,
    SPEED_INCREASE_BLOCKS: 5,
    MOVE_STEP: 8,
    BLOCK_SCORE: 10,
    ITEM_SCORE: 100,
    CELL_TYPES: {
        RIVER: 0,
        OBSTACLE: 1,
        SCORE_ITEM: 2,
        INVINCIBLE_ITEM: 3
    }
};

const SAMPLE_FIELD_DATA = [
    [0, 0, 0], [0, 1, 0], [0, 0, 0], [1, 0, 1], [0, 2, 0],
    [0, 0, 0], [1, 0, 0], [0, 3, 0], [0, 0, 1], [2, 0, 0],
    [0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 0, 2], [0, 1, 0],
    [3, 0, 0], [0, 0, 0], [0, 0, 0], [1, 0, 1], [0, 2, 0]
];

createApp({
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
        // 初期化関連
        async initializeGame() {
            await this.loadFieldData();
            this.generateDisplayField();
        },

        async loadFieldData() {
            try {
                const response = await fetch('/api/field');
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                this.fieldData = data;
            } catch (error) {
                console.warn('Error loading field data:', error);
                this.fieldData = [...SAMPLE_FIELD_DATA];
            }
        },

        generateDisplayField() {
            const fieldHeight = 20;
            this.displayField = [];
            
            for (let i = 0; i < fieldHeight; i++) {
                const row = i < this.fieldData.length 
                    ? [...this.fieldData[i]] 
                    : [0, 0, 0];
                this.displayField.push(row);
            }
        },

        setupEventListeners() {
            document.addEventListener('keydown', this.handleKeyDown);
        },

        // イベントハンドリング
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

        // ゲーム制御
        toggleGame() {
            if (!this.gameStarted) {
                this.startGame();
                return;
            }
            
            this.pauseGame();
        },

        startGame() {
            this.gameStarted = true;
            this.isPaused = false;
            this.startGameLoop();
        },

        pauseGame() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                this.stopGameLoop();
                return;
            }
            
            this.startGameLoop();
        },

        startGameLoop() {
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, this.fieldSpeed);
        },

        stopGameLoop() {
            if (!this.gameLoop) return;
            
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        },

        // プレイヤー制御
        movePlayer(direction) {
            if (!this.gameStarted || this.isPaused) return;

            const newPosition = this.playerPosition + direction;
            const isValidPosition = newPosition >= 0 && newPosition < GAME_CONSTANTS.FIELD_WIDTH;
            
            if (isValidPosition) {
                this.playerPosition = newPosition;
            }
        },

        // ゲームロジック
        updateGame() {
            this.moveField();
            this.checkCollisions();
            this.updateScore();
            this.checkSpeedIncrease();
        },

        moveField() {
            this.fieldOffset += GAME_CONSTANTS.MOVE_STEP;
            this.moveDistance += GAME_CONSTANTS.MOVE_STEP;

            if (this.moveDistance < GAME_CONSTANTS.BLOCK_SIZE) return;

            this.processBlockMovement();
        },

        processBlockMovement() {
            this.moveDistance = 0;
            this.fieldOffset = 0;
            this.blocksMovedCount++;
            
            this.displayField.shift();
            
            const nextRowIndex = 12 + this.blocksMovedCount;
            const nextRow = nextRowIndex < this.fieldData.length 
                ? [...this.fieldData[nextRowIndex]] 
                : [0, 0, 0];
            
            this.displayField.push(nextRow);
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

        handleCollision(cellType) {
            const collisionHandlers = {
                [GAME_CONSTANTS.CELL_TYPES.OBSTACLE]: () => this.handleObstacleCollision(),
                [GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM]: () => this.handleScoreItem(),
                [GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM]: () => this.handleInvincibleItem()
            };

            const handler = collisionHandlers[cellType];
            if (handler) {
                handler();
            }
        },

        handleObstacleCollision() {
            if (this.isInvincible) {
                this.isInvincible = false;
                return;
            }
            
            this.endGame();
        },

        handleScoreItem() {
            this.score += GAME_CONSTANTS.ITEM_SCORE;
        },

        handleInvincibleItem() {
            this.isInvincible = true;
        },

        // スコア関連
        updateScore() {
            if (this.moveDistance === 0) {
                this.score += GAME_CONSTANTS.BLOCK_SCORE;
            }
        },

        checkSpeedIncrease() {
            const shouldIncrease = this.blocksMovedCount > 0 && 
                                 this.blocksMovedCount % GAME_CONSTANTS.SPEED_INCREASE_BLOCKS === 0;
            
            if (!shouldIncrease) return;

            this.fieldSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, this.fieldSpeed - 5);
            this.restartGameLoop();
        },

        restartGameLoop() {
            if (!this.gameLoop) return;
            
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
                window.location.href = 'gameover.html';
            }, 1000);
        },

        cleanupGame() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },

        // ユーティリティ
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
}).mount('#app');