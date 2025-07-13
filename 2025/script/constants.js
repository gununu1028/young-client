// ゲームの設定値
const GAME_CONSTANTS = {
    FIELD_WIDTH: 3,
    FIELD_HEIGHT: 12,
    BLOCK_SIZE: 64,
    PLAYER_ROW: 1,
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

// サンプルフィールドデータ
const SAMPLE_FIELD_DATA = [
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 1, 0], [0, 0, 0], [1, 0, 1], [0, 2, 0],
    [0, 0, 0], [1, 0, 0], [0, 3, 0], [0, 0, 1], [2, 0, 0],
    [0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 0, 2], [0, 1, 0],
    [3, 0, 0], [0, 0, 0], [0, 0, 0], [1, 0, 1], [0, 2, 0]
];