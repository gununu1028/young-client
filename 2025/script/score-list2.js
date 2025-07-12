// Vue.jsライブラリから「createApp」という機能を取り出して使えるようにする
const { createApp } = Vue;

// Vueアプリケーションの設定を書く場所
const app = {
    // data: HTMLで使う変数を定義する場所
    data() {
        return {
            scores: [],    // カンマを追記
            nickname: '',  // 追記
            score: null    // 追記
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
        },

        // ここを追記
        async submitScore() {
            // 入力チェック：ニックネームとスコアが入力されているか確認
            if (!this.nickname || this.score === null) {
                alert('ニックネームとスコアを入力してください');
                return;
            }

            // サーバーに送るデータを準備
            const postData = {
                nickname: this.nickname,
                score: parseInt(this.score)  // 文字列を数値に変換
            };

            // サーバーにデータを送信
            const response = await fetch('https://jya2025.m5a.jp/api/score/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            // 投稿が成功したら
            if (response.ok) {
                alert('スコアが投稿されました！');
                // 入力欄をクリア
                this.nickname = '';
                this.score = null;
                // 最新のスコア一覧を取得し直す
                this.fetchScores();
            } else {
                alert('投稿に失敗しました');
            }
        }
        // ここまで追記
    }
};

// アプリケーションを作って、HTMLの「#app」の部分に表示する
createApp(app).mount('#app');
