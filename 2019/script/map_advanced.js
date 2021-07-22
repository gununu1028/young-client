// 地図を生成
var layer = new ol.layer.Tile({
  source: new ol.source.OSM({
    url: 'http://maps.skilljapan.info/osm/{z}/{x}/{y}.png'
  })
});

// 経度・緯度の順に値を入れる
var position = ol.proj.fromLonLat([130.3982027, 33.6043049]);

// 地図をHTML上で表現
var map = new ol.Map({
  target: 'map',
  layers: [layer],
  view: new ol.View({
    center: position,
    zoom: 15
  })
});

// マーカーを出す
var marker = new ol.Overlay({
  position: position,
  positioning: 'center-center',
  element: document.getElementById('marker')
});
map.addOverlay(marker);

// 会場名を出す
var place = new ol.Overlay({
  position: position,
  element: document.getElementById('place')
});
map.addOverlay(place);
