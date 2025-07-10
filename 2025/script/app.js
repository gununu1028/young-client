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