const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    {
        path: '/',
        component: TopScreen
    },
    {
        path: '/clear',
        component: ClearScreen
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const app = createApp({});
app.use(router);
app.mount('#app');
