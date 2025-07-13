// ゲームオーバー画面
const GameOverScreen = {
    template: '#gameover-template',

    data() {
        return {
            score: 0,
            scoreSubmitted: false,
            submittedScoreId: null,
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
            // 下記のAPIドキュメントを参考に、スコア一覧を取得すること
            // https://jakunen.skilljapan.info/2025/api.html
            const response = await fetch('/api/score/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const result = await response.json();

            if (response.ok && result && result.list) {
                this.ranking = result.list
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3);
            } else {
                this.ranking = [];
            }
        },

        // スコア表示フォーマット
        formatScore(scoreValue) {
            return scoreValue.toString().padStart(8, '0');
        },

        // スコア投稿
        async submitScore() {
            const nickname = prompt('ニックネームを入力してください:');
            if (!nickname) return;

            const response = await fetch('/api/scores', {
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

            if (response.ok) {
                this.scoreSubmitted = true;
                this.submittedScoreId = result?.id || Math.random().toString(36).substr(2, 9);
                alert('スコアを投稿しました');
                this.loadRanking();
            } else {
                alert(result.message || result.error || 'スコア投稿に失敗しました');
            }
        },

        // ニックネーム更新
        async updateNickname() {
            const nickname = prompt('新しいニックネームを入力してください:');
            if (!nickname) return;

            const response = await fetch(`/api/scores/${this.submittedScoreId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    nickname: nickname
                })
            });
            const result = await response.json();

            if (response.ok) {
                alert('ニックネームを更新しました');
                this.loadRanking();
            } else {
                alert(result.message || result.error || 'ニックネーム更新に失敗しました');
            }
        },

        // スコア削除
        async deleteScore() {
            if (!confirm('スコアを削除しますか？')) return;

            const response = await fetch(`/api/scores/${this.submittedScoreId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const result = await response.json();

            if (response.ok) {
                alert('スコアを削除しました');
                this.scoreSubmitted = false;
                this.submittedScoreId = null;
                this.loadRanking();
            } else {
                alert(result.message || result.error || 'スコア削除に失敗しました');
            }
        },

        // リプレイ
        replay() {
            localStorage.removeItem('gameScore');
            this.$router.push('/');
        }
    }
};