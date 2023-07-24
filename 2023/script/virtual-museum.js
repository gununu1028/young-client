app = Vue.createApp({
    data() {
        return {
            character_position: { x: 400, y: 350 },
            is_event: false,
            display_mode: "first"
        };
    },
    methods: {
        move_character(event) {
            if (this.is_event) return;

            switch (event.key) {
                case 'ArrowUp':
                    this.character_position.y -= 10;
                    break;
                case 'ArrowRight':
                    this.character_position.x += 10;
                    break;
                case 'ArrowDown':
                    this.character_position.y += 10;
                    break;
                case 'ArrowLeft':
                    this.character_position.x -= 10;
                    break;
            }

            this.character_position.x = Math.max(0, Math.min(this.character_position.x, 500));
            this.character_position.y = Math.max(0, Math.min(this.character_position.y, 500));

            this.check_collisions();
        },
        check_collisions() {
            staffs = ['staff_a', 'staff_b', 'staff_c', 'staff_d', 'staff_e'];
            for (staff_id of staffs) {
                staff = document.getElementById(staff_id);
                staff_position = staff.getBoundingClientRect();
                character_rect = character.getBoundingClientRect();

                if (
                    character_rect.left < staff_position.right &&
                    character_rect.right > staff_position.left &&
                    character_rect.top < staff_position.bottom &&
                    character_rect.bottom > staff_position.top
                ) {
                    this.is_event = true;
                    alert('セリフ開始！');
                    return;
                }
            }
        },
        show_scene(staff_id) {
            const scene_id = 'scene_' + staff_id.split('_')[1];
            this.current_scene = scene_id;
        },
        character_position_style() {
            return { 'left': this.character_position.x + 'px', 'top': this.character_position.y + 'px' }
        }
    },
    mounted() {
        window.addEventListener('keydown', this.move_character);
        // Load character position from localStorage
        if (localStorage.getItem('character_position')) {
            // app.character_position = JSON.parse(localStorage.getItem('character_position'));
        }
    }
});

app.mount('#app');
