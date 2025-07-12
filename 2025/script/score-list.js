// Vue.jsのアプリケーションを作成
const { createApp } = Vue;

createApp({
    // データ（アプリケーションの状態）
    data() {
        return {
            scores: []        // スコアのリスト
        }
    },
    
    // コンポーネントが作成されたときに実行される
    created() {
        // 初回のスコア取得
        this.fetchScores();
    },
    
    // メソッド（関数）
    methods: {
        // APIからスコアを取得する関数
        async fetchScores() {
            // APIにリクエストを送信
            const response = await fetch('https://jya2025.m5a.jp/api/score/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            // レスポンスをJSONとして解析
            const data = await response.json();
            
            // スコアを高い順にソート
            this.scores = data.list.sort((a, b) => b.score - a.score);
        }
    }
}).mount('#app'); // #appの要素にVueアプリケーションをマウント