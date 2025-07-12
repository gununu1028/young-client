// Vue.jsライブラリから「createApp」という機能を取り出して使えるようにする
const { createApp } = Vue;

// Vueアプリケーションの設定を書く場所
const app = {
    // data: HTMLで使う変数を定義する場所
    data() {
        return {
            scores: []  // スコアのデータを入れる配列（最初は空）
        }
    },

    // created: ページが読み込まれた時に自動で実行される
    created() {
        this.fetchScores();  // スコアを取得する関数を呼び出す
    },

    // methods: ボタンを押した時などに実行される関数を書く場所
    methods: {
        // サーバーからスコアデータを取得する関数
        async fetchScores() {
            // サーバーにデータをもらいに行く
            const response = await fetch('https://jya2025.m5a.jp/api/score/list');
            // もらったデータをJavaScriptで使える形に変換
            const data = await response.json();
            // スコアが高い順に並び替えて、scoresに保存
            this.scores = data.list.sort((a, b) => b.score - a.score);
        }
    }
};

// アプリケーションを作って、HTMLの「#app」の部分に表示する
createApp(app).mount('#app');
