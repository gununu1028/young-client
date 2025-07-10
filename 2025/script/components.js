const { ref, computed, onMounted, onUnmounted } = Vue;

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
    template: `
        <div class="game-container">
            <div class="score-display">
                <h2>SCORE: {{ scoreDisplay }}</h2>
            </div>
            
            <div class="game-field" ref="gameField">
                <div class="field-content" :style="{ transform: \`translateY(\${fieldOffset}px)\` }">
                    <div v-for="(row, rowIndex) in displayField" :key="\`row-\${rowIndex}\`" class="field-row">
                        <div v-for="(cell, colIndex) in row" :key="\`cell-\${rowIndex}-\${colIndex}\`" 
                             class="field-cell"
                             :class="getCellClass(cell)">
                        </div>
                    </div>
                </div>
                
                <div class="player" :style="{ left: \`\${playerPosition * 64}px\` }"
                     :class="{ invincible: isInvincible }">
                </div>
            </div>
            
            <div class="game-controls">
                <p v-if="!gameStarted">スペースキーでゲームを開始</p>
                <p v-else-if="isPaused">一時停止中 - スペースキーで再開</p>
            </div>
        </div>
    `,
    
    setup() {
        const gameStarted = ref(false);
        const isPaused = ref(false);
        const gameOver = ref(false);
        const score = ref(0);
        const playerPosition = ref(1);
        const fieldOffset = ref(0);
        const fieldData = ref([]);
        const displayField = ref([]);
        const isInvincible = ref(false);
        const gameLoop = ref(null);
        const fieldSpeed = ref(GAME_CONSTANTS.INITIAL_SPEED);
        const moveDistance = ref(0);
        const blocksMovedCount = ref(0);
        
        const router = Vue.inject('$router') || window.gameRouter;
        
        const scoreDisplay = computed(() => {
            return score.value.toString().padStart(8, '0');
        });
        
        // 初期化関連
        const initializeGame = async () => {
            await loadFieldData();
            generateDisplayField();
        };
        
        const loadFieldData = async () => {
            try {
                const response = await fetch('/api/field');
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                fieldData.value = data;
            } catch (error) {
                console.warn('Error loading field data:', error);
                fieldData.value = [...SAMPLE_FIELD_DATA];
            }
        };
        
        const generateDisplayField = () => {
            const fieldHeight = 20;
            displayField.value = [];
            
            for (let i = 0; i < fieldHeight; i++) {
                const row = i < fieldData.value.length 
                    ? [...fieldData.value[i]] 
                    : [0, 0, 0];
                displayField.value.push(row);
            }
        };
        
        const setupEventListeners = () => {
            document.addEventListener('keydown', handleKeyDown);
        };
        
        // イベントハンドリング
        const handleKeyDown = (event) => {
            if (gameOver.value) return;
            
            const keyActions = {
                'Space': () => toggleGame(),
                'ArrowLeft': () => movePlayer(-1),
                'ArrowRight': () => movePlayer(1)
            };
            
            const action = keyActions[event.code];
            if (!action) return;
            
            event.preventDefault();
            action();
        };
        
        // ゲーム制御
        const toggleGame = () => {
            if (!gameStarted.value) {
                startGame();
                return;
            }
            
            pauseGame();
        };
        
        const startGame = () => {
            gameStarted.value = true;
            isPaused.value = false;
            startGameLoop();
        };
        
        const pauseGame = () => {
            isPaused.value = !isPaused.value;
            
            if (isPaused.value) {
                stopGameLoop();
                return;
            }
            
            startGameLoop();
        };
        
        const startGameLoop = () => {
            gameLoop.value = setInterval(() => {
                updateGame();
            }, fieldSpeed.value);
        };
        
        const stopGameLoop = () => {
            if (!gameLoop.value) return;
            
            clearInterval(gameLoop.value);
            gameLoop.value = null;
        };
        
        // プレイヤー制御
        const movePlayer = (direction) => {
            if (!gameStarted.value || isPaused.value) return;
            
            const newPosition = playerPosition.value + direction;
            const isValidPosition = newPosition >= 0 && newPosition < GAME_CONSTANTS.FIELD_WIDTH;
            
            if (isValidPosition) {
                playerPosition.value = newPosition;
            }
        };
        
        // ゲームロジック
        const updateGame = () => {
            moveField();
            checkCollisions();
            updateScore();
            checkSpeedIncrease();
        };
        
        const moveField = () => {
            fieldOffset.value += GAME_CONSTANTS.MOVE_STEP;
            moveDistance.value += GAME_CONSTANTS.MOVE_STEP;
            
            if (moveDistance.value < GAME_CONSTANTS.BLOCK_SIZE) return;
            
            processBlockMovement();
        };
        
        const processBlockMovement = () => {
            moveDistance.value = 0;
            fieldOffset.value = 0;
            blocksMovedCount.value++;
            
            displayField.value.shift();
            
            const nextRowIndex = 12 + blocksMovedCount.value;
            const nextRow = nextRowIndex < fieldData.value.length 
                ? [...fieldData.value[nextRowIndex]] 
                : [0, 0, 0];
            
            displayField.value.push(nextRow);
        };
        
        // 衝突判定
        const checkCollisions = () => {
            const playerRow = displayField.value[GAME_CONSTANTS.PLAYER_ROW];
            if (!playerRow) return;
            
            const currentCell = playerRow[playerPosition.value];
            if (currentCell === GAME_CONSTANTS.CELL_TYPES.RIVER) return;
            
            handleCollision(currentCell);
            playerRow[playerPosition.value] = GAME_CONSTANTS.CELL_TYPES.RIVER;
        };
        
        const handleCollision = (cellType) => {
            const collisionHandlers = {
                [GAME_CONSTANTS.CELL_TYPES.OBSTACLE]: () => handleObstacleCollision(),
                [GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM]: () => handleScoreItem(),
                [GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM]: () => handleInvincibleItem()
            };
            
            const handler = collisionHandlers[cellType];
            if (handler) {
                handler();
            }
        };
        
        const handleObstacleCollision = () => {
            if (isInvincible.value) {
                isInvincible.value = false;
                return;
            }
            
            endGame();
        };
        
        const handleScoreItem = () => {
            score.value += GAME_CONSTANTS.ITEM_SCORE;
        };
        
        const handleInvincibleItem = () => {
            isInvincible.value = true;
        };
        
        // スコア関連
        const updateScore = () => {
            if (moveDistance.value === 0) {
                score.value += GAME_CONSTANTS.BLOCK_SCORE;
            }
        };
        
        const checkSpeedIncrease = () => {
            const shouldIncrease = blocksMovedCount.value > 0 && 
                                 blocksMovedCount.value % GAME_CONSTANTS.SPEED_INCREASE_BLOCKS === 0;
            
            if (!shouldIncrease) return;
            
            fieldSpeed.value = Math.max(GAME_CONSTANTS.MIN_SPEED, fieldSpeed.value - 5);
            restartGameLoop();
        };
        
        const restartGameLoop = () => {
            if (!gameLoop.value) return;
            
            stopGameLoop();
            startGameLoop();
        };
        
        // ゲーム終了
        const endGame = () => {
            gameOver.value = true;
            gameStarted.value = false;
            cleanupGame();
            
            localStorage.setItem('gameScore', score.value);
            
            setTimeout(() => {
                router.push('/gameover');
            }, 1000);
        };
        
        const cleanupGame = () => {
            if (gameLoop.value) {
                clearInterval(gameLoop.value);
                gameLoop.value = null;
            }
        };
        
        // ユーティリティ
        const getCellClass = (cellValue) => {
            const cellClasses = {
                [GAME_CONSTANTS.CELL_TYPES.RIVER]: 'river',
                [GAME_CONSTANTS.CELL_TYPES.OBSTACLE]: 'obstacle',
                [GAME_CONSTANTS.CELL_TYPES.SCORE_ITEM]: 'score-item',
                [GAME_CONSTANTS.CELL_TYPES.INVINCIBLE_ITEM]: 'invincible-item'
            };
            
            return cellClasses[cellValue] || 'river';
        };
        
        onMounted(() => {
            initializeGame();
            setupEventListeners();
        });
        
        onUnmounted(() => {
            cleanupGame();
            document.removeEventListener('keydown', handleKeyDown);
        });
        
        return {
            gameStarted,
            isPaused,
            gameOver,
            score,
            playerPosition,
            fieldOffset,
            fieldData,
            displayField,
            isInvincible,
            scoreDisplay,
            getCellClass
        };
    }
};

const GameOverScreen = {
    template: `
        <div class="gameover-container">
            <h1>GAME OVER</h1>
            
            <div class="score-result">
                <h2>YOUR SCORE</h2>
                <p class="final-score">{{ scoreDisplay }}</p>
            </div>
            
            <div class="score-actions">
                <button v-if="!scoreSubmitted" @click="submitScore" class="btn btn-primary">
                    スコア投稿
                </button>
                <button v-if="scoreSubmitted" @click="updateNickname" class="btn btn-secondary">
                    ニックネーム更新
                </button>
                <button v-if="scoreSubmitted" @click="deleteScore" class="btn btn-danger">
                    スコア削除
                </button>
            </div>
            
            <div v-if="ranking.length > 0" class="ranking-section">
                <h2>TOP 3 RANKING</h2>
                <ol class="ranking-list">
                    <li v-for="(entry, index) in ranking" :key="index" class="ranking-item">
                        <span class="rank">{{ index + 1 }}</span>
                        <span class="nickname">{{ entry.nickname }}</span>
                        <span class="score">{{ formatScore(entry.score) }}</span>
                    </li>
                </ol>
            </div>
            
            <div class="replay-section">
                <button @click="replay" class="btn btn-replay">
                    リプレイ
                </button>
            </div>
        </div>
    `,
    
    setup() {
        const score = ref(0);
        const scoreSubmitted = ref(false);
        const submittedScoreId = ref(null);
        const ranking = ref([]);
        const router = Vue.inject('$router') || window.gameRouter;
        
        const mockRanking = [
            { nickname: 'Player1', score: 15000 },
            { nickname: 'Player2', score: 12000 },
            { nickname: 'Player3', score: 10000 }
        ];
        
        const scoreDisplay = computed(() => {
            return formatScore(score.value);
        });
        
        const loadScore = () => {
            const savedScore = localStorage.getItem('gameScore');
            score.value = savedScore ? parseInt(savedScore) : 0;
        };
        
        const loadRanking = async () => {
            await loadRankingFromAPI();
        };
        
        const formatScore = (scoreValue) => {
            return scoreValue.toString().padStart(8, '0');
        };
        
        const submitScore = async () => {
            const nickname = prompt('ニックネームを入力してください:');
            if (!nickname) return;
            
            try {
                const response = await callAPI('/api/scores', 'POST', {
                    nickname: nickname,
                    score: score.value
                });
                
                if (response.ok) {
                    scoreSubmitted.value = true;
                    submittedScoreId.value = response.data?.id || Math.random().toString(36).substr(2, 9);
                    alert('スコアを投稿しました');
                    loadRanking();
                } else {
                    throw new Error(response.message || 'スコア投稿に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        };
        
        const updateNickname = async () => {
            const nickname = prompt('新しいニックネームを入力してください:');
            if (!nickname) return;
            
            try {
                const response = await callAPI(`/api/scores/${submittedScoreId.value}`, 'PUT', {
                    nickname: nickname
                });
                
                if (response.ok) {
                    alert('ニックネームを更新しました');
                    loadRanking();
                } else {
                    throw new Error(response.message || 'ニックネーム更新に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        };
        
        const deleteScore = async () => {
            if (!confirm('スコアを削除しますか？')) return;
            
            try {
                const response = await callAPI(`/api/scores/${submittedScoreId.value}`, 'DELETE');
                
                if (response.ok) {
                    alert('スコアを削除しました');
                    scoreSubmitted.value = false;
                    submittedScoreId.value = null;
                    loadRanking();
                } else {
                    throw new Error(response.message || 'スコア削除に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        };
        
        const callAPI = async (url, method, data = null) => {
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
        };
        
        const loadRankingFromAPI = async () => {
            try {
                const response = await callAPI('/api/scores', 'GET');
                
                if (response.ok && response.data) {
                    ranking.value = response.data
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3);
                } else {
                    ranking.value = [...mockRanking];
                }
            } catch (error) {
                ranking.value = [...mockRanking];
            }
        };
        
        const replay = () => {
            localStorage.removeItem('gameScore');
            router.push('/');
        };
        
        onMounted(() => {
            loadScore();
            loadRanking();
        });
        
        return {
            score,
            scoreSubmitted,
            submittedScoreId,
            ranking,
            scoreDisplay,
            formatScore,
            submitScore,
            updateNickname,
            deleteScore,
            replay
        };
    }
};