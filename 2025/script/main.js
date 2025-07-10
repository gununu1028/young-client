const { createApp } = Vue;

const app = createApp({});

app.use(window.gameRouter);

app.mount('#app');