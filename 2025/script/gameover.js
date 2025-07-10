const { createApp } = Vue;

createApp({
    data() {
        return {
            score: 0,
            scoreSubmitted: false,
            submittedScoreId: null,
            ranking: [],
            
            mockRanking: [
                { nickname: 'Player1', score: 15000 },
                { nickname: 'Player2', score: 12000 },
                { nickname: 'Player3', score: 10000 }
            ]
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
        loadScore() {
            const savedScore = localStorage.getItem('gameScore');
            this.score = savedScore ? parseInt(savedScore) : 0;
        },

        async loadRanking() {
            await this.loadRankingFromAPI();
        },

        formatScore(score) {
            return score.toString().padStart(8, '0');
        },

        async submitScore() {
            const nickname = prompt('ニックネームを入力してください:');
            if (!nickname) return;

            try {
                const response = await this.callAPI('/api/scores', 'POST', {
                    nickname: nickname,
                    score: this.score
                });

                if (response.ok) {
                    this.scoreSubmitted = true;
                    this.submittedScoreId = response.data?.id || Math.random().toString(36).substr(2, 9);
                    alert('スコアを投稿しました');
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'スコア投稿に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },

        async updateNickname() {
            const nickname = prompt('新しいニックネームを入力してください:');
            if (!nickname) return;

            try {
                const response = await this.callAPI(`/api/scores/${this.submittedScoreId}`, 'PUT', {
                    nickname: nickname
                });

                if (response.ok) {
                    alert('ニックネームを更新しました');
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'ニックネーム更新に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },

        async deleteScore() {
            if (!confirm('スコアを削除しますか？')) return;

            try {
                const response = await this.callAPI(`/api/scores/${this.submittedScoreId}`, 'DELETE');

                if (response.ok) {
                    alert('スコアを削除しました');
                    this.scoreSubmitted = false;
                    this.submittedScoreId = null;
                    this.loadRanking();
                } else {
                    throw new Error(response.message || 'スコア削除に失敗しました');
                }
            } catch (error) {
                alert(error.message);
            }
        },

        async callAPI(url, method, data = null) {
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };

                if (data) {
                    options.body = JSON.stringify(data);
                }

                const response = await fetch(url, options);
                const result = await response.json();

                return {
                    ok: response.ok,
                    status: response.status,
                    data: result,
                    message: result.message || result.error
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'ネットワークエラーが発生しました'
                };
            }
        },

        async loadRankingFromAPI() {
            try {
                const response = await this.callAPI('/api/scores', 'GET');
                
                if (response.ok && response.data) {
                    this.ranking = response.data
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3);
                } else {
                    this.ranking = [...this.mockRanking];
                }
            } catch (error) {
                this.ranking = [...this.mockRanking];
            }
        },

        replay() {
            localStorage.removeItem('gameScore');
            window.location.href = 'game.html';
        }
    }
}).mount('#app');