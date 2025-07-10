const { createApp } = Vue;

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
            fieldSpeed: 100,
            moveDistance: 0,
            blocksMovedCount: 0,
            
            sampleFieldData: [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 0],
                [1, 0, 1],
                [0, 2, 0],
                [0, 0, 0],
                [1, 0, 0],
                [0, 3, 0],
                [0, 0, 1],
                [2, 0, 0],
                [0, 0, 0],
                [1, 1, 0],
                [0, 0, 0],
                [0, 0, 2],
                [0, 1, 0],
                [3, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [1, 0, 1],
                [0, 2, 0]
            ]
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

    methods: {
        async initializeGame() {
            await this.loadFieldData();
            this.generateDisplayField();
        },

        async loadFieldData() {
            try {
                const response = await fetch('/api/field');
                if (response.ok) {
                    const data = await response.json();
                    this.fieldData = data;
                } else {
                    console.warn('Failed to load field data from API, using sample data');
                    this.fieldData = this.sampleFieldData;
                }
            } catch (error) {
                console.warn('Error loading field data:', error);
                this.fieldData = this.sampleFieldData;
            }
        },

        generateDisplayField() {
            const fieldHeight = 20;
            this.displayField = [];
            
            for (let i = 0; i < fieldHeight; i++) {
                if (i < this.fieldData.length) {
                    this.displayField.push([...this.fieldData[i]]);
                } else {
                    this.displayField.push([0, 0, 0]);
                }
            }
        },

        setupEventListeners() {
            document.addEventListener('keydown', this.handleKeyDown);
        },

        handleKeyDown(event) {
            if (this.gameOver) return;

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    this.toggleGame();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.movePlayer(-1);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.movePlayer(1);
                    break;
            }
        },

        toggleGame() {
            if (!this.gameStarted) {
                this.startGame();
            } else {
                this.pauseGame();
            }
        },

        startGame() {
            this.gameStarted = true;
            this.isPaused = false;
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, this.fieldSpeed);
        },

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

        movePlayer(direction) {
            if (!this.gameStarted || this.isPaused) return;

            const newPosition = this.playerPosition + direction;
            if (newPosition >= 0 && newPosition < 3) {
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
            this.fieldOffset += 8;
            this.moveDistance += 8;

            if (this.moveDistance >= 64) {
                this.moveDistance = 0;
                this.fieldOffset = 0;
                this.blocksMovedCount++;
                
                this.displayField.shift();
                
                const nextRowIndex = 12 + this.blocksMovedCount;
                if (nextRowIndex < this.fieldData.length) {
                    this.displayField.push([...this.fieldData[nextRowIndex]]);
                } else {
                    this.displayField.push([0, 0, 0]);
                }
            }
        },

        checkCollisions() {
            const playerRow = 10;
            const currentCell = this.displayField[playerRow] ? this.displayField[playerRow][this.playerPosition] : 0;

            switch (currentCell) {
                case 1:
                    if (this.isInvincible) {
                        this.isInvincible = false;
                        this.displayField[playerRow][this.playerPosition] = 0;
                    } else {
                        this.endGame();
                    }
                    break;
                case 2:
                    this.score += 100;
                    this.displayField[playerRow][this.playerPosition] = 0;
                    break;
                case 3:
                    this.isInvincible = true;
                    this.displayField[playerRow][this.playerPosition] = 0;
                    break;
            }
        },

        updateScore() {
            if (this.moveDistance === 0) {
                this.score += 10;
            }
        },

        checkSpeedIncrease() {
            if (this.blocksMovedCount > 0 && this.blocksMovedCount % 5 === 0) {
                this.fieldSpeed = Math.max(50, this.fieldSpeed - 5);
                if (this.gameLoop) {
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => {
                        this.updateGame();
                    }, this.fieldSpeed);
                }
            }
        },

        endGame() {
            this.gameOver = true;
            this.gameStarted = false;
            clearInterval(this.gameLoop);
            
            localStorage.setItem('gameScore', this.score);
            
            setTimeout(() => {
                window.location.href = 'gameover.html';
            }, 1000);
        },

        getCellClass(cellValue) {
            switch (cellValue) {
                case 0: return 'river';
                case 1: return 'obstacle';
                case 2: return 'score-item';
                case 3: return 'invincible-item';
                default: return 'river';
            }
        }
    },

    beforeUnmount() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}).mount('#app');