/* Urban Hub Pointer — content transcribed from Batuhan Çelik's MİM 402 sheets.
 * Drawing geometry and authored diagrams are preserved. Year/advisor were not supplied.
 */
(function () {
  'use strict';
  const asset = name => 'img/urban-hub/' + name + '.webp';
  const project = {
    code: 'HUB',
    name: 'Samsun Büyükşehir Belediyesi Projesi - Urban Hub Pointer',
    kind: 'Kamusal yapı · Bitirme projesi',
    img: asset('plaza'),
    facts: [
      ['Konum', 'İlkadım, Samsun'],
      ['Tür', 'Akademik bitirme projesi'],
      ['Tasarım', 'Batuhan Çelik'],
      ['Tasarım stüdyosu', 'MİM 402']
    ],
    line: 'Kentten yapıya, yönetimden ortak yaşama uzanan bir kamusal aks.',
    desc: [
      'Urban Hub Pointer, Samsun’un İlkadım ilçesinde belediye işlevlerini üretim, eğitim ve sosyal yaşamla buluşturan bir bitirme projesi. Öneri, yalnızca idari hizmet veren bir yapı yerine kentlinin gündelik yaşamına katılan, birlikte üretmeye ve buluşmaya alan açan bir kamu yapısı araştırıyor.',
      'Barış Bulvarı ile doğuda planlanan tramvay durağı arasında kurulan geçiş, projenin ana fikrini oluşturuyor. Pointer, mevcut kentsel odaklara yönelen bir bağlantı olarak ele alınıyor; ulaşım, meydan ve yapı arasındaki ilişkiyi güçlendiriyor.',
      'Kamusal dolaşım, zemin katta başlayıp merdivenler, rampalar ve teraslarla farklı kotlara taşınıyor. Uzun yapı kütlesinin içindeki boşluklar ve renkli geçişler, bu hareketi cephede görünür kılıyor.',
      'Kamusal kullanımlar ile kontrollü idari alanlar birlikte, fakat farklı erişim düzenleriyle ele alınıyor. Meydan, konferans alanları, kütüphane ve sosyal birimler; belediye birimleri ve meclis salonuyla aynı yerleşimin parçalarını oluşturuyor. Atölye ve hangar önerileri ise yerel üretimi bu gündelik akışa dahil ediyor.',
      'Yerleşim, kentsel bağlantıdan kat organizasyonuna uzanan bir bütün olarak okunuyor. Vaziyet ve kat planları açık alanları, farklı kotlardan girişleri ve birimler arasındaki ilişkileri; kesitler ise kütlenin arazi ve kamusal dolaşımla kurduğu bağı gösteriyor.',
      'Güneş panelleri, sensör verileriyle yönetilen ısıtma, soğutma ve aydınlatma sistemleri ile hareketli duvarlar, tasarımın enerji kullanımı ve esnekliğe yönelik önerileri. Bu stratejiler, esnek kullanım ve kaynakların daha verimli yönetilmesi amacıyla geliştiriliyor.'
    ],
    gallery: ['corner', 'facade', 'council-wide', 'council-overview', 'council-detail', 'council-seating'].map(asset),
    links: [{label: 'Çizim paftaları · PDF · 58 MB', url: 'downloads/urban-hub-drawings.pdf'}]
  };
  const drawing = (name, title, caption, options = {}) => Object.assign({src: asset(name), t: title, cap: caption, span: 6, frame: 'square', zoom: false}, options);
  const sheet = {
    info: [0, 1], concept: [2, 3], detail: [4, 5],
    sourceMark: {src: asset('pointer-poster'), alt: 'Pointer → Hub · MİM 402 proje afişi', caption: 'Pointer → Hub · MİM 402'},
    cdg: [
      drawing('urban-axis', 'Kentsel bağlantı', 'Barış Bulvarı ve tramvay aksı arasında yönlendiren bir geçiş.'),
      drawing('circulation', 'Farklı kotlardan erişim', 'Kamusal hareketi yapının içine taşıyan merdiven, rampa ve teraslar.'),
      drawing('public', 'Kamusal kullanım', 'Meydanla bütünleşen girişler ve kentliye açık alanlar.'),
      drawing('non-public', 'Kontrollü kullanım', 'İdari işleyişi destekleyen erişim ve dolaşım düzeni.'),
      drawing('program', 'Birimler ve katlara dağılım', 'Konferans, meclis, kütüphane ve idari birimlerin düşey organizasyonu.', {span: 12, frame: 'plate'})
    ],
    ddg: [
      drawing('context', 'Kentsel bağlam', 'Çevredeki yapı kullanımları, yeşil alanlar ve ulaşım ilişkileri.', {group: 'Vaziyet ve bağlam'}),
      drawing('site', 'Vaziyet planı', 'Yapı kütleleri, meydan ve çevre yollarının birlikte ele alındığı yerleşim.', {group: 'Vaziyet ve bağlam', zoom: true}),
      drawing('ground', 'Zemin kat planı', 'Meydan, konferans alanları ve ana girişlerin yerleşimi.', {group: 'Planlar', zoom: true}),
      drawing('basement', 'Bodrum kat planı', 'Konferans, servis ve destek birimlerinin alt kotta organizasyonu.', {group: 'Planlar', zoom: true}),
      drawing('intermediate', 'Ara kot planı · +2,70', 'Arazi kotları ve yapı içindeki geçişlerin ilişkisi.', {group: 'Planlar', zoom: true}),
      drawing('floor-1', '1. kat planı', 'İdari birimler, başkanlık, kütüphane ve meclis salonu ilişkisi.', {group: 'Planlar', zoom: true}),
      drawing('floor-2', '2. kat planı', 'İdari çalışma alanları, meclis ve grup toplantı birimleri.', {group: 'Planlar', zoom: true}),
      drawing('floor-3', '3. kat planı', 'Üst kattaki idari birimler ve ortak dolaşım.', {group: 'Planlar', zoom: true}),
      drawing('section-aa', 'A–A kesiti', 'Uzun kütle boyunca katlar, boşluklar ve taşıyıcı akslar.', {group: 'Kesit ve görünüş', span: 12, frame: 'panorama', zoom: true}),
      drawing('section-bb', 'B–B kesiti', 'Arazi, dış merdiven ve yapı arasındaki kot ilişkisi.', {group: 'Kesit ve görünüş', span: 12, frame: 'panorama', zoom: true}),
      drawing('elevation-1', 'Cephe görünüşü · 01', 'Yatay kat çizgileri, cephe panelleri ve renkli boşlukların ritmi.', {group: 'Kesit ve görünüş', span: 12, frame: 'panorama'}),
      drawing('elevation-2', 'Cephe görünüşü · 02', 'Kamusal merdivenin cephe boyunca izlenen hareketi.', {group: 'Kesit ve görünüş', span: 12, frame: 'panorama'}),
      drawing('construction-section', 'Sistem kesiti', 'Çatıdan temele uzanan yapı kesiti ve birleşim notları.', {group: 'Strüktür ve cephe', span: 12, frame: 'portrait', zoom: true})
    ]
  };
  window.BCAUrbanHub = {project, sheet, media: {"img/urban-hub/plaza.webp":{"width":3840,"height":2560,"caption":"Kamusal meydan ve kademeli giriş","variants":[["img/urban-hub/plaza-640.webp",640],["img/urban-hub/plaza-1280.webp",1280],["img/urban-hub/plaza-1920.webp",1920],["img/urban-hub/plaza-2400.webp",2400],["img/urban-hub/plaza.webp",3840]]},"img/urban-hub/corner.webp":{"width":3840,"height":2560,"caption":"Teraslar, kolonlar ve cephe köşesi","variants":[["img/urban-hub/corner-640.webp",640],["img/urban-hub/corner-1280.webp",1280],["img/urban-hub/corner-1920.webp",1920],["img/urban-hub/corner-2400.webp",2400],["img/urban-hub/corner.webp",3840]]},"img/urban-hub/facade.webp":{"width":3840,"height":2560,"caption":"Cephe boşlukları ve meydanla ilişki","variants":[["img/urban-hub/facade-640.webp",640],["img/urban-hub/facade-1280.webp",1280],["img/urban-hub/facade-1920.webp",1920],["img/urban-hub/facade-2400.webp",2400],["img/urban-hub/facade.webp",3840]]},"img/urban-hub/council-wide.webp":{"width":3840,"height":2560,"caption":"Meclis salonu · genel görünüş","variants":[["img/urban-hub/council-wide-640.webp",640],["img/urban-hub/council-wide-1280.webp",1280],["img/urban-hub/council-wide-1920.webp",1920],["img/urban-hub/council-wide-2400.webp",2400],["img/urban-hub/council-wide.webp",3840]]},"img/urban-hub/council-overview.webp":{"width":3840,"height":2560,"caption":"Meclis salonu · oturma düzeni","variants":[["img/urban-hub/council-overview-640.webp",640],["img/urban-hub/council-overview-1280.webp",1280],["img/urban-hub/council-overview-1920.webp",1920],["img/urban-hub/council-overview-2400.webp",2400],["img/urban-hub/council-overview.webp",3840]]},"img/urban-hub/council-detail.webp":{"width":3840,"height":2560,"caption":"Meclis salonu · malzeme ve masa detayı","variants":[["img/urban-hub/council-detail-640.webp",640],["img/urban-hub/council-detail-1280.webp",1280],["img/urban-hub/council-detail-1920.webp",1920],["img/urban-hub/council-detail-2400.webp",2400],["img/urban-hub/council-detail.webp",3840]]},"img/urban-hub/council-seating.webp":{"width":3840,"height":2560,"caption":"Meclis salonu · kademeli oturma","variants":[["img/urban-hub/council-seating-640.webp",640],["img/urban-hub/council-seating-1280.webp",1280],["img/urban-hub/council-seating-1920.webp",1920],["img/urban-hub/council-seating-2400.webp",2400],["img/urban-hub/council-seating.webp",3840]]},"img/urban-hub/public.webp":{"width":3000,"height":3000,"caption":"Kamusal kullanım","variants":[["img/urban-hub/public-640.webp",640],["img/urban-hub/public-1280.webp",1280],["img/urban-hub/public-1920.webp",1920],["img/urban-hub/public-2400.webp",2400],["img/urban-hub/public.webp",3000]]},"img/urban-hub/non-public.webp":{"width":3000,"height":3000,"caption":"Kontrollü kullanım","variants":[["img/urban-hub/non-public-640.webp",640],["img/urban-hub/non-public-1280.webp",1280],["img/urban-hub/non-public-1920.webp",1920],["img/urban-hub/non-public-2400.webp",2400],["img/urban-hub/non-public.webp",3000]]},"img/urban-hub/program.webp":{"width":3840,"height":3364,"caption":"Birimler ve katlara dağılım","variants":[["img/urban-hub/program-640.webp",640],["img/urban-hub/program-1280.webp",1280],["img/urban-hub/program-1920.webp",1920],["img/urban-hub/program-2400.webp",2400],["img/urban-hub/program.webp",3840]]},"img/urban-hub/urban-axis.webp":{"width":3000,"height":3000,"caption":"Barış Bulvarı ve tramvay aksı","variants":[["img/urban-hub/urban-axis-640.webp",640],["img/urban-hub/urban-axis-1280.webp",1280],["img/urban-hub/urban-axis-1920.webp",1920],["img/urban-hub/urban-axis-2400.webp",2400],["img/urban-hub/urban-axis.webp",3000]]},"img/urban-hub/circulation.webp":{"width":3000,"height":3000,"caption":"Farklı kotlardan kamusal erişim","variants":[["img/urban-hub/circulation-640.webp",640],["img/urban-hub/circulation-1280.webp",1280],["img/urban-hub/circulation-1920.webp",1920],["img/urban-hub/circulation-2400.webp",2400],["img/urban-hub/circulation.webp",3000]]},"img/urban-hub/pointer-poster.webp":{"width":1190,"height":1683,"caption":"Pointer → Hub · MİM 402","variants":[["img/urban-hub/pointer-poster-640.webp",640],["img/urban-hub/pointer-poster.webp",1190]]},"img/urban-hub/context.webp":{"width":1190,"height":1700,"caption":"Kent dokusu, yeşil alanlar ve ulaşım","variants":[["img/urban-hub/context-640.webp",640],["img/urban-hub/context.webp",1190]]},"img/urban-hub/site.webp":{"width":6000,"height":6000,"caption":"Vaziyet planı","variants":[["img/urban-hub/site-640.webp",640],["img/urban-hub/site-1280.webp",1280],["img/urban-hub/site-1920.webp",1920],["img/urban-hub/site-2400.webp",2400],["img/urban-hub/site.webp",6000]]},"img/urban-hub/basement.webp":{"width":4881,"height":5303,"caption":"Bodrum kat planı","variants":[["img/urban-hub/basement-640.webp",640],["img/urban-hub/basement-1280.webp",1280],["img/urban-hub/basement-1920.webp",1920],["img/urban-hub/basement-2400.webp",2400],["img/urban-hub/basement.webp",4881]]},"img/urban-hub/ground.webp":{"width":4243,"height":4238,"caption":"Zemin kat planı","variants":[["img/urban-hub/ground-640.webp",640],["img/urban-hub/ground-1280.webp",1280],["img/urban-hub/ground-1920.webp",1920],["img/urban-hub/ground-2400.webp",2400],["img/urban-hub/ground.webp",4243]]},"img/urban-hub/floor-1.webp":{"width":4240,"height":4238,"caption":"1. kat planı","variants":[["img/urban-hub/floor-1-640.webp",640],["img/urban-hub/floor-1-1280.webp",1280],["img/urban-hub/floor-1-1920.webp",1920],["img/urban-hub/floor-1-2400.webp",2400],["img/urban-hub/floor-1.webp",4240]]},"img/urban-hub/floor-2.webp":{"width":4238,"height":4240,"caption":"2. kat planı","variants":[["img/urban-hub/floor-2-640.webp",640],["img/urban-hub/floor-2-1280.webp",1280],["img/urban-hub/floor-2-1920.webp",1920],["img/urban-hub/floor-2-2400.webp",2400],["img/urban-hub/floor-2.webp",4238]]},"img/urban-hub/floor-3.webp":{"width":4238,"height":4240,"caption":"3. kat planı","variants":[["img/urban-hub/floor-3-640.webp",640],["img/urban-hub/floor-3-1280.webp",1280],["img/urban-hub/floor-3-1920.webp",1920],["img/urban-hub/floor-3-2400.webp",2400],["img/urban-hub/floor-3.webp",4238]]},"img/urban-hub/intermediate.webp":{"width":4243,"height":4238,"caption":"Ara kot planı · +2,70","variants":[["img/urban-hub/intermediate-640.webp",640],["img/urban-hub/intermediate-1280.webp",1280],["img/urban-hub/intermediate-1920.webp",1920],["img/urban-hub/intermediate-2400.webp",2400],["img/urban-hub/intermediate.webp",4243]]},"img/urban-hub/section-aa.webp":{"width":6000,"height":1304,"caption":"A–A kesiti","variants":[["img/urban-hub/section-aa-640.webp",640],["img/urban-hub/section-aa-1280.webp",1280],["img/urban-hub/section-aa-1920.webp",1920],["img/urban-hub/section-aa-2400.webp",2400],["img/urban-hub/section-aa.webp",6000]]},"img/urban-hub/section-bb.webp":{"width":6000,"height":1560,"caption":"B–B kesiti","variants":[["img/urban-hub/section-bb-640.webp",640],["img/urban-hub/section-bb-1280.webp",1280],["img/urban-hub/section-bb-1920.webp",1920],["img/urban-hub/section-bb-2400.webp",2400],["img/urban-hub/section-bb.webp",6000]]},"img/urban-hub/elevation-1.webp":{"width":6000,"height":615,"caption":"Cephe görünüşü · 01","variants":[["img/urban-hub/elevation-1-640.webp",640],["img/urban-hub/elevation-1-1280.webp",1280],["img/urban-hub/elevation-1-1920.webp",1920],["img/urban-hub/elevation-1-2400.webp",2400],["img/urban-hub/elevation-1.webp",6000]]},"img/urban-hub/elevation-2.webp":{"width":6000,"height":595,"caption":"Cephe görünüşü · 02","variants":[["img/urban-hub/elevation-2-640.webp",640],["img/urban-hub/elevation-2-1280.webp",1280],["img/urban-hub/elevation-2-1920.webp",1920],["img/urban-hub/elevation-2-2400.webp",2400],["img/urban-hub/elevation-2.webp",6000]]},"img/urban-hub/construction-section.webp":{"width":1585,"height":7000,"caption":"Sistem kesiti","variants":[["img/urban-hub/construction-section-640.webp",640],["img/urban-hub/construction-section-1280.webp",1280],["img/urban-hub/construction-section.webp",1585]]}}};
  Object.assign(window.BCA_EN = window.BCA_EN || {}, {
    'Samsun Büyükşehir Belediyesi Projesi - Urban Hub Pointer': 'Samsun Metropolitan Municipality Project - Urban Hub Pointer',
    'Kamusal yapı': 'Civic architecture', 'Bitirme projesi': 'Graduation project',
    'İlkadım, Samsun': 'İlkadım, Samsun', 'Akademik bitirme projesi': 'Academic graduation project',
    'Tasarım stüdyosu': 'Design studio',
    'Kentten yapıya, yönetimden ortak yaşama uzanan bir kamusal aks.': 'A public route connecting city, civic life and shared space.',
    'Çizim paftaları · PDF · 58 MB': 'Drawing sheets · PDF · 58 MB',
    'Pointer → Hub · MİM 402 proje afişi': 'Pointer → Hub · MİM 402 project poster',
    'Kentsel bağlantı': 'Urban connection', 'Farklı kotlardan erişim': 'Access across levels',
    'Kamusal kullanım': 'Public use', 'Kontrollü kullanım': 'Controlled access',
    'Birimler ve katlara dağılım': 'Programme across floors', 'Kentsel bağlam': 'Urban context',
    'Ara kot planı · +2,70': 'Intermediate level plan · +2.70',
    'Cephe görünüşü · 01': 'Elevation · 01', 'Cephe görünüşü · 02': 'Elevation · 02',
    'Sistem kesiti': 'Construction section',
    'Barış Bulvarı ve tramvay aksı arasında yönlendiren bir geçiş.': 'A guiding route between Barış Boulevard and the tram corridor.',
    'Kamusal hareketi yapının içine taşıyan merdiven, rampa ve teraslar.': 'Stairs, ramps and terraces extending public movement into the building.',
    'Meydanla bütünleşen girişler ve kentliye açık alanlar.': 'Entrances and public spaces integrated with the square.',
    'İdari işleyişi destekleyen erişim ve dolaşım düzeni.': 'Access and circulation supporting administrative functions.',
    'Konferans, meclis, kütüphane ve idari birimlerin düşey organizasyonu.': 'Vertical organisation of conference, council, library and administrative spaces.',
    'Çevredeki yapı kullanımları, yeşil alanlar ve ulaşım ilişkileri.': 'Surrounding land uses, green spaces and transport connections.',
    'Yapı kütleleri, meydan ve çevre yollarının birlikte ele alındığı yerleşim.': 'Buildings, public square and surrounding roads considered together.',
    'Meydan, konferans alanları ve ana girişlerin yerleşimi.': 'Arrangement of the square, conference spaces and main entrances.',
    'Konferans, servis ve destek birimlerinin alt kotta organizasyonu.': 'Conference, service and support functions on the lower level.',
    'Arazi kotları ve yapı içindeki geçişlerin ilişkisi.': 'Connections between site levels and circulation inside the building.',
    'İdari birimler, başkanlık, kütüphane ve meclis salonu ilişkisi.': 'Relationships between departments, mayoral offices, library and council chamber.',
    'İdari çalışma alanları, meclis ve grup toplantı birimleri.': 'Administrative workspaces, council and group meeting rooms.',
    'Üst kattaki idari birimler ve ortak dolaşım.': 'Upper-level administrative spaces and shared circulation.',
    'Uzun kütle boyunca katlar, boşluklar ve taşıyıcı akslar.': 'Floors, voids and structural axes along the linear building.',
    'Arazi, dış merdiven ve yapı arasındaki kot ilişkisi.': 'Level changes between the terrain, external stairs and building.',
    'Yatay kat çizgileri, cephe panelleri ve renkli boşlukların ritmi.': 'The rhythm of horizontal floor lines, facade panels and coloured voids.',
    'Kamusal merdivenin cephe boyunca izlenen hareketi.': 'The public stair traced along the facade.',
    'Çatıdan temele uzanan yapı kesiti ve birleşim notları.': 'Roof-to-foundation construction section and junction annotations.',
    'Kamusal meydan ve kademeli giriş': 'Public square and stepped entrance',
    'Teraslar, kolonlar ve cephe köşesi': 'Terraces, columns and facade corner',
    'Cephe boşlukları ve meydanla ilişki': 'Facade voids and the public square',
    'Meclis salonu': 'Council chamber', 'genel görünüş': 'overall view',
    'oturma düzeni': 'seating arrangement', 'malzeme ve masa detayı': 'material and desk detail', 'kademeli oturma': 'tiered seating'
  });
  const english = [
    'Urban Hub Pointer is a graduation project in İlkadım, Samsun, bringing municipal functions together with production, education and social life. The proposal explores a civic building that participates in everyday urban life and makes room for people to meet and create together.',
    'A passage between Barış Boulevard and the proposed tram stop to the east forms the central idea. Pointer is conceived as a connection towards existing urban hubs, strengthening the relationship between transport, the square and the building.',
    'Public circulation begins at ground level and continues through stairs, ramps and terraces. Voids and coloured passages within the long building make this movement visible on its facade.',
    'Public uses and controlled administrative areas are brought together with distinct access arrangements. The square, conference spaces, library and social facilities share the site with municipal departments and the council chamber. Proposed workshops and hangars introduce local production into this everyday flow.',
    'The design is read as a whole, from its urban connections to the organisation of each floor. Site and floor plans show open spaces, entrances at different levels and relationships between departments; sections explain how the building meets the terrain and public circulation.',
    'Solar panels, sensor-informed heating, cooling and lighting, and movable walls are proposed strategies for energy use and flexibility. These strategies explore flexible use and more efficient management of resources.'
  ];
  project.desc.forEach((text, i) => {window.BCA_EN[text] = english[i];});
})();
