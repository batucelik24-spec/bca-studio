/* Ankara University laboratory test rig — supplied renders and animation.
 * No test results, capacities, date or individual credits were supplied.
 */
(function () {
  'use strict';
  const asset = name => 'img/lab-rig/' + name + '.webp';
  const captions = {
    overview: 'Deney düzeneği · genel perspektif',
    front: 'Deney düzeneği · karşı cephe',
    'sensors-context': 'Ölçüm elemanları ve numune tabanı',
    'load-head': 'Düşey yükleme başlığı ve yük aktarım detayı',
    sensors: 'Yer değiştirme ölçümü ve bağımsız ölçüm çerçevesi'
  };
  const project = {
    code: 'AUL', studio: true,
    name: 'Ankara Üniversitesi — Deney Düzeneği',
    kind: 'Deney düzeneği tasarımı · Ar-Ge',
    img: asset('overview'),
    facts: [
      ['Kurum', 'Ankara Üniversitesi'],
      ['Birim', 'İnşaat Mühendisliği Laboratuvarı'],
      ['Konum', 'Ankara, Türkiye'],
      ['Kapsam', 'Deney düzeneği tasarımı, 3B modelleme ve görselleştirme']
    ],
    line: 'Yükleme, ölçüm ve gözlemi tek bir deney kurgusunda birleştiren sistem.',
    desc: [
      'Ankara Üniversitesi İnşaat Mühendisliği Laboratuvarı için geliştirilen bu çalışma, bir duvar numunesi etrafında yükleme ve ölçüm bileşenlerini bir araya getiren deney düzeneğinin tasarımını ele alıyor. Çelik çerçeve, hidrolik yükleme elemanları, numune bağlantıları ve ölçüm noktaları; üç boyutlu model ve sunum animasyonu üzerinden birlikte okunuyor.',
      'İki kolon ve üst kirişten oluşan çelik çerçeve, deney alanını tanımlıyor. Üstteki düşey yükleme başlığı, numune üzerindeki dağıtıcı kirişle; yandaki yatay yükleme elemanı ise kolon ve numune arasındaki bağlantıyla ilişki kuruyor. Taban, birleşim levhaları ve rijitleştiriciler bu kurulumun parçalarını oluşturuyor.',
      'Yükün numuneye aktarıldığı birleşimler ile yer değiştirmeyi izleyen ölçüm elemanları, tasarımın iki temel detayını oluşturuyor. Görselleştirmeler, bu parçaların konumlarını ve birbirleriyle ilişkilerini görünür kılıyor.',
      'Numune çevresindeki bağımsız ölçüm çerçevesi, yatay ve düşey doğrultulardaki ölçüm elemanlarını taşıyor. Kamera, aydınlatma ve kontrol konsolu da deney alanının gözlem ve çalışma düzeniyle birlikte ele alınıyor.'
    ],
    gallery: ['front', 'load-head', 'sensors', 'sensors-context'].map(asset),
    video: {
      src: 'video/lab-rig.mp4', poster: asset('video-poster'),
      title: 'Düzeneğe yakından bakış',
      caption: 'Genel kurulumdan yükleme ve ölçüm detaylarına uzanan üç boyutlu sunum animasyonu.'
    }
  };
  const sheet = {
    info: [0], concept: [1], detail: [2, 3],
    cdg: [{src: asset('front'), t: 'Yükleme sistemi', cap: 'Çelik çerçeve içinde düşey ve yatay yükleme elemanlarının yerleşimi.', span: 12, frame: 'landscape', zoom: false}],
    ddg: [
      {src: asset('load-head'), t: 'Yük aktarımı', cap: 'Düşey yükleme başlığı, dağıtıcı kiriş ve numune üzerindeki silindirik aktarım elemanları.', group: 'Yükleme ve ölçüm', span: 6, frame: 'landscape', zoom: false},
      {src: asset('sensors'), t: 'Ölçüm yerleşimi', cap: 'Numune, taban ve bağımsız çerçeve arasında konumlanan yer değiştirme ölçüm elemanları.', group: 'Yükleme ve ölçüm', span: 6, frame: 'landscape', zoom: false}
    ]
  };
  const media = Object.fromEntries(Object.entries(captions).map(([name, caption]) => [asset(name), {
    width: 3840, height: 3005, caption,
    variants: [640, 1280, 1920, 2400, 3840].map(width => [asset(name + (width === 3840 ? '' : '-' + width)), width])
  }]));
  window.BCALabRig = {project, sheet, media};
  Object.assign(window.BCA_EN = window.BCA_EN || {}, {
    'Ankara Üniversitesi — Deney Düzeneği': 'Ankara University — Laboratory Test Rig',
    'Deney düzeneği tasarımı': 'Test rig design',
    'Deney düzeneği tasarımı · Ar-Ge': 'Test rig design · R&D',
    'Kurum': 'Institution', 'Birim': 'Department', 'Kapsam': 'Scope',
    'İnşaat Mühendisliği Laboratuvarı': 'Civil Engineering Laboratory',
    'Ankara, Türkiye': 'Ankara, Türkiye',
    'Deney düzeneği tasarımı, 3B modelleme ve görselleştirme': 'Test rig design, 3D modelling and visualisation',
    'Yükleme, ölçüm ve gözlemi tek bir deney kurgusunda birleştiren sistem.': 'Loading, measurement and observation brought together in one experimental setup.',
    [project.desc[0]]: 'Developed for the Civil Engineering Laboratory at Ankara University, this project explores a test rig that brings loading and measurement components together around a wall specimen. The steel frame, hydraulic loading elements, specimen connections and measurement points are presented together through a three-dimensional model and animation.',
    [project.desc[1]]: 'Two columns and an overhead beam define the test area. The vertical loading head connects to a spreader beam above the specimen, while the horizontal loading element sits between a column and the specimen. The base, connection plates and stiffeners complete the assembly.',
    [project.desc[2]]: 'The connections that transfer load to the specimen and the instruments that track displacement form two key details of the design. The visualisations make their positions and relationships legible.',
    [project.desc[3]]: 'An independent measurement frame around the specimen supports instruments along horizontal and vertical axes. The camera, lighting and control console are considered as part of the observation and working arrangement.',
    'Deney düzeneği · genel perspektif': 'Test rig · overall perspective',
    'Deney düzeneği · karşı cephe': 'Test rig · reverse elevation',
    'Ölçüm elemanları ve numune tabanı': 'Measuring instruments and specimen base',
    'Düşey yükleme başlığı ve yük aktarım detayı': 'Vertical loading head and load transfer detail',
    'Yer değiştirme ölçümü ve bağımsız ölçüm çerçevesi': 'Displacement measurement and independent frame',
    'Yükleme sistemi': 'Loading system',
    'Çelik çerçeve içinde düşey ve yatay yükleme elemanlarının yerleşimi.': 'Vertical and horizontal loading elements arranged within the steel frame.',
    'Yükleme ve ölçüm': 'Loading and measurement',
    'Yük aktarımı': 'Load transfer',
    'Düşey yükleme başlığı, dağıtıcı kiriş ve numune üzerindeki silindirik aktarım elemanları.': 'Vertical loading head, spreader beam and cylindrical transfer elements above the specimen.',
    'Ölçüm yerleşimi': 'Measurement layout',
    'Numune, taban ve bağımsız çerçeve arasında konumlanan yer değiştirme ölçüm elemanları.': 'Displacement instruments positioned between the specimen, base and independent frame.',
    'Sunum animasyonu': 'Presentation animation',
    'Düzeneğe yakından bakış': 'A closer look at the rig',
    [project.video.caption]: 'A three-dimensional walkthrough, from the complete assembly to loading and measurement details.',
    'Tarayıcınız bu videoyu oynatamıyor. Videoyu açın.': 'Your browser cannot play this video. Open the video.'
  });
})();
