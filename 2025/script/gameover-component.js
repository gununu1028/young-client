// ゲームオーバー画面
const GameOverScreen = {
    template: '#gameover-template',

    data() {
        return {
            score: 0,
            scoreSubmitted: false,
            ranking: []
        };
    },

    computed: {
        scoreDisplay() {
            return this.formatScore(this.score);
        }
    },

    mounted() {
        this.loadScore();
        this.loadRanking();
    },

    methods: {
        // スコア読み込み
        loadScore() {
            const savedScore = localStorage.getItem('gameScore');
            this.score = savedScore ? parseInt(savedScore) : 0;
        },

        // ランキング読み込み
        async loadRanking() {
            const response = await fetch('https://jya2025.m5a.jp/api/score/list');
            const result = await response.json();

            this.ranking = result.list
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
        },

        // スコア表示フォーマット
        formatScore(scoreValue) {
            return scoreValue.toString().padStart(8, '0');
        },

        // スコア投稿
        async submitScore() {
            const nickname = prompt('ニックネームを入力してください:');
            if (!nickname) return;

            const response = await fetch('https://jya2025.m5a.jp/api/score/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    nickname: nickname,
                    score: this.score
                })
            });
            const result = await response.json();

            this.scoreSubmitted = true;
            alert('スコアを投稿しました');
            this.loadRanking();
        },

        // リプレイ
        replay() {
            localStorage.removeItem('gameScore');
            this.$router.push('/');
        }
    }
};