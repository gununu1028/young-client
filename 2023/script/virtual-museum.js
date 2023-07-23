// キャラクターの座標
character_position = { x: 400, y: 350 };
is_event = false; // 会話イベント中か否か

// ローカルストレージから座標を読み込む
if (localStorage.getItem('character_position')) {
    // character_position = JSON.parse(localStorage.getItem('character_position'));
}

character = document.getElementById('character');
character.style.left = `${character_position.x}px`;
character.style.top = `${character_position.y}px`;

// キーボードのキーが押されたとき
window.addEventListener('keydown', function (event) {
    if (is_event) return; // 会話イベント中は移動不可

    switch (event.key) {
        case 'ArrowUp':
            character_position.y -= 10;
            break;
        case 'ArrowRight':
            character_position.x += 10;
            break;
        case 'ArrowDown':
            character_position.y += 10;
            break;
        case 'ArrowLeft':
            character_position.x -= 10;
            break;
    }

    // 施設の範囲を超えないように制限
    character_position.x = Math.max(0, Math.min(character_position.x, 500));
    character_position.y = Math.max(0, Math.min(character_position.y, 500));

    // 座標を更新
    character.style.left = `${character_position.x}px`;
    character.style.top = `${character_position.y}px`;

    // 座標をローカルストレージに保存
    localStorage.setItem('character_position', JSON.stringify(character_position));

    // 会話イベントのチェック
    staffs = ['staff_a', 'staff_b', 'staff_c', 'staff_d', 'staff_e']; 
    for (i = 0; i < staffs.length; i++) {
        staff = document.getElementById(staffs[i]);
        staff_position = staff.getBoundingClientRect();
        character_rect = character.getBoundingClientRect();

        // 簡易的な衝突判定
        if (character_rect.left < staff_position.right &&
            character_rect.right > staff_position.left &&
            character_rect.top < staff_position.bottom &&
            character_rect.bottom > staff_position.top) {
            // 会話イベント開始
            is_event = true;
            // ここで会話イベントの処理を行う
        }
    }
});

// キーボードのキーが離れたとき
window.addEventListener('keyup', function (event) {
    if (is_event) {
        alert('セリフ開始！');
    }
});