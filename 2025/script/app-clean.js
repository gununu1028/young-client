const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

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
        
        movePlayer(direction) {
            if (!this.gameStarted || this.isPaused) return;
            
            const newPosition = this.playerPosition + direction;
            const isValidPosition = newPosition >= 0 && newPosition < GAME_CONSTANTS.FIELD_WIDTH;
            
            if (isValidPosition) {
                this.playerPosition = newPosition;
            }
        },
        
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
        
        endGame() {
            this.gameOver = true;
            this.gameStarted = false;
            this.cleanupGame();
            
            localStorage.setItem('gameScore', this.score);
            
            setTimeout(() => {
                this.$router.push('/gameover');
            }, 1000);
        },
        
        cleanupGame() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },
        
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

const GameOverScreen = {
    template: '#gameover-template',
    
    data() {
        return {
            score: 0,
            scoreSubmitted: false,
            submittedScoreId: null,
            ranking: [],
            mockRanking: [
                { nickname: 'Player1', score: 15000 },
                { nickname: 'Player2', score: 12000 },
                { nickname: 'Player3', score: 10000 }
            ]
        };
    },
    
    computed: {
        scoreDisplay() {
            return this.formatScore(this.score);
        }
    },
    
    mounted() {
        this.loadScore();
        this.loadRanking();
    },
    
    methods: {
        loadScore() {
            const savedScore = localStorage.getItem('gameScore');
            this.score = savedScore ? parseInt(savedScore) : 0;
        },
        
        async loadRanking() {
            await this.loadRankingFromAPI();
        },
        
        formatScore(scoreValue) {
            return scoreValue.toString().padStart(8, '0');
        },
        
        async submitScore() {
            const nickname = prompt('ニックネームを入力してください:');
            if (!nickname) return;
            
            try {
                const response = await this.callAPI('/api/scores', 'POST', {
                    nickname: nickname,
                    score: this.score
                });
                
                if (response.ok) {
                    this.scoreSubmitted = true;
                    this.submittedScoreId = response.data?.id || Math.random().toString(36).substr(2, 9);
                    alert('スコアを投稿しました');
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'スコア投稿に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },
        
        async updateNickname() {
            const nickname = prompt('新しいニックネームを入力してください:');
            if (!nickname) return;
            
            try {
                const response = await this.callAPI(`/api/scores/${this.submittedScoreId}`, 'PUT', {
                    nickname: nickname
                });
                
                if (response.ok) {
                    alert('ニックネームを更新しました');
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'ニックネーム更新に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },
        
        async deleteScore() {
            if (!confirm('スコアを削除しますか？')) return;
            
            try {
                const response = await this.callAPI(`/api/scores/${this.submittedScoreId}`, 'DELETE');
                
                if (response.ok) {
                    alert('スコアを削除しました');
                    this.scoreSubmitted = false;
                    this.submittedScoreId = null;
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'スコア削除に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },
        
        async callAPI(url, method, data = null) {
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(url, options);
                const result = await response.json();
                
                return {
                    ok: response.ok,
                    status: response.status,
                    data: result,
                    message: result.message || result.error
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'ネットワークエラーが発生しました'
                };
            }
        },
        
        async loadRankingFromAPI() {
            try {
                const response = await this.callAPI('/api/scores', 'GET');
                
                if (response.ok && response.data) {
                    this.ranking = response.data
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3);
                } else {
                    this.ranking = [...this.mockRanking];
                }
            } catch (error) {
                this.ranking = [...this.mockRanking];
            }
        },
        
        replay() {
            localStorage.removeItem('gameScore');
            this.$router.push('/');
        }
    }
};

const routes = [
    {
        path: '/',
        component: GameScreen
    },
    {
        path: '/gameover',
        component: GameOverScreen
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const app = createApp({});
app.use(router);
app.mount('#app');