// 新着情報の全体データを取得
async function getEventAll() {
  // APIを呼び出す
  var res = await fetch('https://young2019.herokuapp.com/api/events');
  // 呼び出したAPIからデータを取得
  var data = await res.json();
  // 取得したデータを開始日時の新しい順に並び替え
  data.sort(function(a, b) {
    return (a.started_at < b.started_at ? 1 : -1);
  });
  // タイトルのみを5レコード表示
  for (i = 0; i < 5; i++) {
    var title = '<a href="#" id="' + data[i].id + '">' + data[i].title + '</a>';
    var html = '<li>' + title + '</li>';
    // <ul id="#events">に追加
    document.querySelector('#events').insertAdjacentHTML('beforeend', html);
  }
  // リンクをクリックしたときに詳細情報を表示
  var links = document.querySelectorAll('#events a');
  for (i = 0; i < links.length; i++) {
    links[i].onclick = function() {
      getEvent(this.id);
    }
  }
}

// 新着情報の個別データを取得
async function getEvent(id) {
  var res = await fetch('https://young2019.herokuapp.com/api/events/' + id);
  var data = await res.json();
  // 取得した情報を指定したエリアに表示
  document.querySelector('#event_detail h3').innerHTML = data.title;
  document.querySelector('#event_detail .description').innerHTML = data.description;
  document.querySelector('#event_detail .started_at').innerHTML = '開始日時：' + getDateTime(data.started_at);
  document.querySelector('#event_detail .ended_at').innerHTML = '終了日時：' + getDateTime(data.ended_at);
}

// 日時を分かりやすい形式に変換
function getDateTime(datetime) {
  var date = new Date(datetime);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// 関数を呼び出す必要がある
getEventAll();
