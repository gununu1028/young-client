const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    {
        path: '/',
        name: 'Game',
        component: GameScreen
    },
    {
        path: '/gameover',
        name: 'GameOver',
        component: GameOverScreen
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

window.gameRouter = router;