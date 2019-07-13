// 新着情報を追加
async function postEvent() {
  // 入力内容を取得
  var form = document.forms.create_event;
  var body = {
    title: form.title.value,
    started_at: form.started_at.value,
    ended_at: form.ended_at.value,
    description: form.description.value
  };
  // ヘッダーを設定
  var headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  headers.append('Authorization', 'Bearer cf4bd65638b811e8840a1f128ca65a99');
  // APIを呼び出す
  var res = await fetch('https://young2019.herokuapp.com/api/events', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });
  // 登録できたかどうかをお知らせ
  var result = document.querySelector('#result');
  if (res.ok) {
    result.innerHTML = '登録しました。';
  } else {
    result.innerHTML = '失敗しました。';
  }
}

document.querySelector('#create_event button').onclick = function() {
  postEvent();
}
