app = Vue.createApp({
    data() {
        return {
            character_position: { x: 400, y: 350 },
            display_mode: 'first',
            dialogs_json: null,
            order: null,
            c_dialog_body: null,
            d_dialog_body: null,
            e_dialog_body: null,
        };
    },
    methods: {
        character_position_style() {
            return { 'left': this.character_position.x + 'px', 'top': this.character_position.y + 'px' }
        },
        push_key(event) {
            this.update_character_position(event.code);
        },
        update_character_position(code) {
            move_amount = 10;
            switch (code) {
                case 'ArrowUp':
                    this.character_position.y -= move_amount;
                    break;
                case 'ArrowRight':
                    this.character_position.x += move_amount;
                    break;
                case 'ArrowDown':
                    this.character_position.y += move_amount;
                    break;
                case 'ArrowLeft':
                    this.character_position.x -= move_amount;
                    break;
            }
            this.character_position.x = Math.max(0, Math.min(this.character_position.x, 1024 - 200));
            this.character_position.y = Math.max(0, Math.min(this.character_position.y, 768 - 50));
            localStorage.setItem('character_position_x', this.character_position.x);
            localStorage.setItem('character_position_y', this.character_position.y);
        },
    },
    async mounted() {
        window.addEventListener('keydown', this.push_key);
        url = 'https://api2024.m5a.jp/api/dialogs';
        response = await fetch(url);
        this.dialogs_json = await response.json();
    }
});

app.mount('#app');
