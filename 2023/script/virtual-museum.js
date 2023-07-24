app = Vue.createApp({
    data() {
        return {
            character_position: { x: 400, y: 350 },
            display_mode: 'first',
            dialogs_json: null,
            order: null
        };
    },
    methods: {
        push_key(event) {
            if (this.starting_conversation()) {
                if (event.code == 'Space') {
                    if (this.order < this.target_dialogs_length('A')) {
                        this.order++;
                    } else {
                        this.display_mode = 'first';
                        this.character_position = { x: 400, y: 350 };
                    }
                }
            } else {
                switch (event.code) {
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
            }
        },
        check_collisions() {
            staffs = ['staff_a', 'staff_b', 'staff_c', 'staff_d', 'staff_e'];
            for (staff_id of staffs) {
                staff = document.getElementById(staff_id);
                staff_position = staff.getBoundingClientRect();
                character_rect = character.getBoundingClientRect();

                if (
                    character_rect.left <= staff_position.right &&
                    character_rect.right >= staff_position.left &&
                    character_rect.top <= staff_position.bottom &&
                    character_rect.bottom >= staff_position.top
                ) {
                    this.display_mode = staff_id;
                    this.order = 1;
                    return;
                }
            }
        },
        character_position_style() {
            return { 'left': this.character_position.x + 'px', 'top': this.character_position.y + 'px' }
        },
        starting_conversation() {
            return this.display_mode != 'first';
        },
        a_dialog_body() {
            target_dialog = this.dialogs_json.find(item => item.staff == 'A' && item.order == this.order);
            a = this.dialogs_json.filter(item => item.staff == 'A');
            if (this.order < a.length) {
                return target_dialog.body + '（Spaceキーで次へ）';
            } else {
                return target_dialog.body + '（Spaceキーでフィールドに戻る）'
            }
        },
        target_dialogs_length(staff) {
            target_dialogs = this.dialogs_json.filter(item => item.staff == staff)
            return target_dialogs.length;
        }
    },
    async mounted() {
        url = 'https://japanskills2023.m5a.jp/api/dialogs';
        response = await fetch(url);
        this.dialogs_json = await response.json();
        window.addEventListener('keydown', this.push_key);
    }
});

app.mount('#app');
