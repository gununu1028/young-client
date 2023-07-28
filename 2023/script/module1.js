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
    },
});

app.mount('#app');
