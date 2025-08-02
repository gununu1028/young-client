const TopScreen = {
    template: '#top-template',
    data() {
        return {
            score_list: [],
            game_started: false,
            block_list: [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 0]
            ],
            player_position_x: 1,
            player_position_y: 1,
        };
    },
    async mounted() {
        const response = await fetch('https://jya2025.m5a.jp/api/score/list');
        const data = await response.json();
        this.score_list = data.list;

        document.addEventListener('keydown', this.handleKeyDown);
    },
    methods: {
        handleKeyDown(event) {
            console.log(event.code);

            switch (event.code) {
                case 'Space':
                    this.game_started = true;
                    break;
                case 'KeyA':
                    if (this.game_started) {
                        this.$router.push('/clear');
                    }
                    break;
                case 'ArrowUp':
                    if (this.game_started) {
                        if (this.player_position_y > 0) {
                            this.player_position_y -= 1;
                        }
                        for (i = 0; i < 3; i++) {
                            for (j = 0; j < 3; j++) {
                                this.block_list[i][j] = 0;
                            }
                        }
                        this.block_list[this.player_position_y][this.player_position_x] = 1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.game_started) {
                        if (this.player_position_y < 2) {
                            this.player_position_y += 1;
                        }
                        for (i = 0; i < 3; i++) {
                            for (j = 0; j < 3; j++) {
                                this.block_list[i][j] = 0;
                            }
                        }
                        this.block_list[this.player_position_y][this.player_position_x] = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.game_started) {
                        if (this.player_position_x > 0) {
                            this.player_position_x -= 1;
                        }
                        for (i = 0; i < 3; i++) {
                            for (j = 0; j < 3; j++) {
                                this.block_list[i][j] = 0;
                            }
                        }
                        this.block_list[this.player_position_y][this.player_position_x] = 1;
                    }
                    break;
                case 'ArrowRight':
                    if (this.game_started) {
                        if (this.player_position_x < 2) {
                            this.player_position_x += 1;
                        }
                        for (i = 0; i < 3; i++) {
                            for (j = 0; j < 3; j++) {
                                this.block_list[i][j] = 0;
                            }
                        }
                        this.block_list[this.player_position_y][this.player_position_x] = 1;
                    }
                    break;
            }
        },
        getCellClass(row) {
            switch (row) {
                case 0:
                    return 'background-color: white;'
                case 1:
                    return 'background-color: blue;'
            }
        }
    }
}