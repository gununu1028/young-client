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


// Vue.jsアプリケーション初期化
const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// ルート設定
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

// ルーター作成
const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// アプリケーション作成・起動
const app = createApp({});
app.use(router);
app.mount('#app');