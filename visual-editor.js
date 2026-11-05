/* A visual editor for the existing site: no external editor service or runtime dependency. */
(() => {
  'use strict';
  const E=window.BCA_EDITOR, frame=document.getElementById('frame'), stage=document.getElementById('stage');
  if(!E)return;
  const clone=v=>JSON.parse(JSON.stringify(v)), $=s=>document.querySelector(s);
  let selected=null, page='home', editing=true, device='desktop', bound=null, overlay=null, hover=null;
  let inline=null, drag=null, draggingKey=null, booted=false, busy=false, history=[], future=[], lastSnapshot='', checkpointKey='', checkpointTime=0, toastTimer=0;
  const expanded=new Set(['root']);
  const names={root:'Sayfa',section:'Bölüm',columns:'Sütunlar',column:'Sütun',text:'Metin',image:'Görsel',video:'Video',link:'Bağlantı'};
  const icons={root:'⌂',section:'▱',columns:'▥',column:'□',text:'T',image:'▧',video:'▷',link:'↗'};
  const V=()=>E.site()?.BCA_VISUAL;
  function h(tag,attrs={},...children){const e=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>{if(v==null)return;if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k==='class')e.className=v;else if(k==='value')e.value=v;else if(k==='checked')e.checked=v;else e.setAttribute(k,String(v));});children.flat(Infinity).forEach(c=>{if(c!=null)e.append(typeof c==='string'?document.createTextNode(c):c);});return e;}
  function btn(text,fn,attrs={}){return h('button',{type:'button',class:'ve-btn',onclick:fn,...attrs},text);}
  function toast(text){let t=$('.ve-toast');if(!t){t=h('div',{class:'ve-toast',role:'status'});document.body.append(t);}t.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.remove(),4000);}
  function record(){const v=E.state.visual ||= {version:1,pages:{}};v.pages ||= {};return v.pages[page] ||= {nodes:{},orders:{}};}
  function nodeRecord(key=selected){const r=record();r.nodes ||= {};return r.nodes[key] ||= {};}
  function checkpoint(key=''){
    const now=Date.now();
    if(key && key===checkpointKey && now-checkpointTime<900){checkpointTime=now;return;}
    history.push(clone(E.state));if(history.length>60)history.shift();future=[];checkpointKey=key;checkpointTime=now;updateHistory();
  }
  function commit(fn,{key='',redraw=false}={}){if(busy)return;checkpoint(key);fn();lastSnapshot=JSON.stringify(E.state);E.touch(true,true);updateHistory();if(redraw)setTimeout(draw,110);}
  function undo(){finishInline();if(!history.length)return;future.push(clone(E.state));const s=history.pop();lastSnapshot=JSON.stringify(s);checkpointKey='';E.setState(s);selected=null;updateHistory();setTimeout(draw,180);}
  function redo(){finishInline();if(!future.length)return;history.push(clone(E.state));const s=future.pop();lastSnapshot=JSON.stringify(s);checkpointKey='';E.setState(s);selected=null;updateHistory();setTimeout(draw,180);}
  function updateHistory(){undoButton.disabled=!history.length;redoButton.disabled=!future.length;}
  const tools=h('div',{class:'ve-tools','aria-label':'Ekleme ve düzenleme araçları'});
  const undoButton=btn('↶',undo,{class:'ve-btn ve-icon',title:'Geri al · Ctrl+Z','aria-label':'Geri al'}), redoButton=btn('↷',redo,{class:'ve-btn ve-icon',title:'Yinele · Ctrl+Shift+Z','aria-label':'Yinele'});
  for(const [type,label] of [['section','＋ Bölüm'],['text','T Metin'],['image','▧ Görsel'],['video','▷ Video'],['link','↗ Bağlantı'],['columns','▥ Sütunlar']])tools.append(btn(label,()=>{setEditing(true);if(['image','video'].includes(type))mediaDialog(type);else add(type);},{'data-add':type}));
  const editButton=btn('↖ Düzenle',()=>setEditing(!editing),{'aria-pressed':'true',title:'Düzenle / önizle'});
  tools.append(h('span',{class:'ve-divider'}),undoButton,redoButton,h('span',{class:'ve-spacer'}),editButton);
  $('.bar').after(tools);
  const side=$('.side'), legacyForm=$('#main'), legacyPicker=$('.picker');
  const tabs=h('div',{class:'ve-tabs'}), layersTab=btn('Katmanlar',()=>legacy(false),{'aria-pressed':'true'}), contentTab=btn('İçerik',()=>legacy(true),{'aria-pressed':'false'});
  tabs.append(layersTab,contentTab);side.prepend(tabs);
  const left=h('div',{class:'ve-left'}), pageSelect=h('select',{'aria-label':'Düzenlenen sayfa',onchange:e=>navigate(e.target.value)}), tree=h('div',{class:'ve-tree','aria-label':'Bölümler ve öğeler'});
  left.append(h('div',{class:'ve-page-picker'},pageSelect,btn('＋',newPage,{class:'ve-btn ve-icon',title:'Yeni sayfa','aria-label':'Yeni sayfa'})),h('div',{class:'ve-caption'},'BÖLÜMLER VE ÖĞELER'),tree);
  left.append(h('div',{class:'ve-local'},h('div',{class:'ve-local-actions'},btn('Yedek indir',exportDraft),btn('Yedek aç',importDraft)),btn('Bağlantı ayarı',()=>{legacy(true);E.go('settings');},{style:'width:100%;margin-top:6px'}),h('p',{},'Değişikliklerin bu tarayıcıya kaydolur. Yayınla ile herkes görür.')));
  side.append(left);
  const inspector=h('aside',{class:'ve-inspector','aria-label':'Seçili öğenin özellikleri'});$('.layout').append(inspector);
  const currentLabel=h('span',{class:'ve-current-page'});
  $('.pvbar').prepend(btn('☷',()=>document.body.classList.toggle('ve-show-layers'),{class:'ve-btn ve-icon ve-mobile-layers','aria-label':'Katmanları aç'}),currentLabel);
  $('.pvbar').append(btn('⚙',()=>document.body.classList.toggle('ve-show-props'),{class:'ve-btn ve-icon ve-mobile-props','aria-label':'Özellikleri aç'}));
  function legacy(on=true){document.body.classList.toggle('ve-legacy',on);left.hidden=on;legacyForm.hidden=!on;legacyPicker.hidden=!on;layersTab.setAttribute('aria-pressed',!on);contentTab.setAttribute('aria-pressed',on);fitPreview();}
  legacy(false);
  function pageOptions(){return [['home','Ana sayfa'],['architecture','Architecture'],['studio','Studio'],...E.state.projects.map(p=>[(p.studio?'s-':'p-')+p.code,p.name]),...Object.entries(E.state.visual?.pages||{}).filter(([k])=>k.startsWith('page-')).map(([k,p])=>[k,p.title||k.slice(5)])];}
  function syncPages(){pageSelect.replaceChildren(...pageOptions().map(([v,t])=>h('option',{value:v},t)));pageSelect.value=page;currentLabel.textContent=pageOptions().find(([k])=>k===page)?.[1]||page;}
  function navigate(next){finishInline();selected=null;page=next;expanded.clear();expanded.add('root');const w=E.site();if(w){w.location.hash='#'+next;w.scrollTo(0,0);V()?.render();}document.body.classList.remove('ve-show-layers','ve-show-props');syncPages();drawInspector();}
  function setEditing(on){finishInline();editing=on;editButton.textContent=on?'↖ Düzenle':'▷ Önizleme';editButton.setAttribute('aria-pressed',on);document.body.classList.toggle('ve-preview',!on);bound?.document.documentElement.classList.toggle('ve-editing',on);updateOutline();if(!on)toast('Önizleme açık. Sayfa bağlantıları ve etkileşimler çalışır.');}
  function visible(e){return !!e && (e===V()?.root || e.getClientRects().length>0);}
  function choose(key,scroll=false){finishInline();if(!V()?.find(key))return;selected=key;let e=V().find(key);while(e){const parent=e.parentElement?.closest('[data-ve-key]');if(parent)expanded.add(parent.dataset.veKey);e=parent;}drawTree();drawInspector();if(scroll)V().find(key)?.scrollIntoView({block:'center',behavior:'smooth'});updateOutline();}
  function drawTree(){
    if(!V()?.root)return;
    const list=V().nodes(), children=new Map();
    for(const item of list){if(item.key==='root')continue;const el=V().find(item.key);if(!visible(el) && !item.hidden && !E.state.visual?.pages?.[page]?.nodes?.[item.parent]?.hidden)continue;if(!children.has(item.parent))children.set(item.parent,[]);children.get(item.parent).push(item);}
    tree.replaceChildren();let count=0;
    function row(item,depth){if(++count>1200)return;const sub=children.get(item.key)||[];
      const r=h('div',{class:'ve-layer-row'+(selected===item.key?' selected':'')+(item.hidden?' ve-hidden':''),style:'padding-left:'+Math.min(depth*10,80)+'px','data-layer':item.key});
      const toggle=h('button',{type:'button',class:'ve-expand','aria-label':expanded.has(item.key)?'Daralt':'Genişlet',onclick:()=>{if(expanded.has(item.key))expanded.delete(item.key);else expanded.add(item.key);drawTree();}},sub.length?(expanded.has(item.key)?'⌄':'›'):'');toggle.disabled=!sub.length;
      r.append(toggle,h('button',{type:'button',class:'ve-layer',title:item.label,onclick:()=>choose(item.key,true)},h('span',{class:'ve-layer-icon'},icons[item.kind]||'□'),item.label));
      if(item.key!=='root'){
        r.draggable=true;r.addEventListener('dragstart',e=>{draggingKey=item.key;e.dataTransfer.setData('text/plain',item.key);e.dataTransfer.effectAllowed='move';});
        r.addEventListener('dragover',e=>{const a=V().find(draggingKey),b=V().find(item.key);if(!a||a===b||a.parentElement!==b.parentElement)return;e.preventDefault();r.classList.toggle('drop-after',e.clientY>r.getBoundingClientRect().top+r.offsetHeight/2);r.classList.toggle('drop-before',!r.classList.contains('drop-after'));});
        r.addEventListener('dragleave',()=>r.classList.remove('drop-after','drop-before'));
        r.addEventListener('drop',e=>{e.preventDefault();const after=r.classList.contains('drop-after');r.classList.remove('drop-after','drop-before');reorder(draggingKey,item.key,after);draggingKey=null;});
        r.addEventListener('dragend',()=>{draggingKey=null;tree.querySelectorAll('.drop-after,.drop-before').forEach(e=>e.classList.remove('drop-after','drop-before'));});
      }
      tree.append(r);if(expanded.has(item.key))sub.forEach(x=>row(x,depth+1));
    }
    const root=list[0];if(root)row({...root,label:'Sayfa bütünü'},0);
  }
  function reorder(from,to,after){const a=V().find(from),b=V().find(to);if(!a||!b||a===b||a.parentElement!==b.parentElement){toast('Sıralamak için aynı bölümdeki öğeleri taşı.');return;}const parent=a.parentElement.dataset.veKey;if(!parent)return;
    const keys=[...a.parentElement.children].map(e=>e.dataset.veKey).filter(Boolean).filter(k=>k!==from);keys.splice(keys.indexOf(to)+(after?1:0),0,from);commit(()=>{record().orders ||= {};record().orders[parent]=keys;},{redraw:true});
  }
  function moveBy(amount){const el=V().find(selected);if(!el)return;const peers=[...el.parentElement.children].filter(e=>e.dataset.veKey);const i=peers.indexOf(el),other=peers[i+amount];if(other)reorder(selected,other.dataset.veKey,amount>0);}
  function uid(){return 'block-'+crypto.randomUUID().slice(0,12);}
  function insertionParent(){let e=V()?.find(selected);if(!e)return'root';while(e&&e!==V().root){if(/^(SECTION|ARTICLE|DIV|FIGURE)$/.test(e.tagName)&&!e.closest('.px-hero,.thumb,#stage,.bimg')&&e.dataset.veKey)return e.dataset.veKey;e=e.parentElement;}return'root';}
  function add(type,props={},forcedParent){
    if(!V()?.root||busy)return;
    setEditing(true);const k=uid();let parent=forcedParent||insertionParent();
    if(type==='section')parent='root';
    const nodes={};
    if(parent==='root'&&type!=='section'){const s=uid();nodes[s]={type:'section',parent:'root',name:'Yeni bölüm'};parent=s;}
    nodes[k]={type,parent,...props};
    if(type==='section'){nodes[k].name='Yeni bölüm';nodes[uid()]={type:'text',tag:'h2',text:'Yeni bölüm',parent:k};nodes[uid()]={type:'text',text:'Bu alana çift tıklayarak metnini yazabilir, yeni görseller ve videolar ekleyebilirsin.',parent:k};}
    if(type==='text'&&props.text===undefined)nodes[k].text='Yeni metin';
    if(type==='link'){nodes[k].text=props.text||'Projeleri keşfet →';nodes[k].href=props.href||'#architecture';}
    if(type==='columns'){nodes[k].style={columns:2,gap:'28px'};nodes[k].mobile={columns:1};for(let i=0;i<2;i++)nodes[uid()]={type:'column',parent:k,name:(i+1)+'. sütun'};}
    const afterKey=selected;
    commit(()=>{Object.assign(record().nodes ||= {},nodes);const p=V().find(parent),after=V().find(afterKey);if(p&&after?.parentElement===p){const keys=[...p.children].map(e=>e.dataset.veKey).filter(Boolean);keys.splice(keys.indexOf(afterKey)+1,0,k);(record().orders ||= {})[parent]=keys;}},{redraw:true});
    expanded.add(parent);expanded.add(k);setTimeout(()=>{choose(k,true);drawTree();},140);return k;
  }
  function removeSelected(){if(!selected||selected==='root')return;const k=selected,n=record().nodes?.[k];commit(()=>{if(n?.type){const doomed=new Set([k]);let changed=true;while(changed){changed=false;Object.entries(record().nodes).forEach(([id,v])=>{if(doomed.has(v.parent)&&!doomed.has(id)){doomed.add(id);changed=true;}});}doomed.forEach(id=>delete record().nodes[id]);Object.keys(record().orders||{}).forEach(id=>{if(doomed.has(id))delete record().orders[id];else record().orders[id]=record().orders[id].filter(v=>!doomed.has(v));});}else nodeRecord(k).hidden=true;selected=null;},{redraw:true});toast('Öğe kaldırıldı. Geri al ile geri getirebilirsin.');}
  function changeProp(prop,value){const key=selected;commit(()=>{nodeRecord(key)[prop]=value;},{key:page+key+prop});}
  function changeStyle(prop,value){const key=selected,slot=device==='mobile'?'mobile':'style';commit(()=>{const s=nodeRecord(key)[slot] ||= {};if(value==='')delete s[prop];else s[prop]=value;},{key:page+key+slot+prop});}
  function field(label,control,wide=false){return h('label',{class:'ve-field'+(wide?' ve-wide':'')},h('span',{},label),control);}
  function textField(label,value,onchange,attrs={},wide=false){const c=h('input',{type:'text',value:value??'','aria-label':label,...attrs});c.addEventListener('change',()=>onchange(c.value));return field(label,c,wide);}
  function selectField(label,value,options,fn,wide=false){const c=h('select',{'aria-label':label},options.map(([v,t])=>h('option',{value:v},t)));c.value=value??'';c.addEventListener('change',()=>fn(c.value));return field(label,c,wide);}
  function section(label,children,open=true){const d=h('details',{},h('summary',{},label),h('div',{class:'ve-fields'},children));d.open=open;return d;}
  function drawInspector(){
    inspector.replaceChildren(btn('×',()=>document.body.classList.remove('ve-show-props'),{class:'ve-btn ve-icon ve-properties-close','aria-label':'Özellikleri kapat'}));
    const el=V()?.find(selected),info=V()?.describe(el);
    if(!info){inspector.append(h('div',{class:'ve-empty'},h('div',{class:'ve-cursor'},'↖'),h('h2',{},'Seç, düzenle, yerleştir.'),h('p',{},'Önizlemede bir öğeye tıkla. Metni değiştirmek için çift tıkla. Kenarlardaki tutamaçlardan boyutunu ayarla.'),h('p',{},'Üstteki düğmelerle yeni içerik ekle. Katmanları sürükleyerek sırala.')),h('div',{class:'ve-mode-note'},'Düzenle: öğeleri seçer. Önizleme: bağlantıları ve site etkileşimlerini çalıştırır.'));return;}
    const n=E.state.visual?.pages?.[page]?.nodes?.[selected]||{},s=n[device==='mobile'?'mobile':'style']||{},computed=bound.getComputedStyle(el);
    inspector.append(h('div',{class:'ve-kicker'},names[info.kind]),h('h2',{},info.label));
    if(info.parent)inspector.append(btn('↑ Üst bölümü seç',()=>choose(info.parent),{style:'font-size:11px;width:100%;margin-bottom:12px'}));
    inspector.append(h('div',{class:'ve-mode-note'},device==='mobile'?'Mobil ölçüler · Yalnızca 760 px ve altına uygulanır.':'Masaüstü ölçüler · Mobilde özel ayar yoksa korunur.'));
    if(info.hidden)inspector.append(btn('Öğeyi geri göster',()=>{commit(()=>delete nodeRecord().hidden,{redraw:true});},{style:'width:100%;margin-bottom:12px'}));
    const content=[];
    content.push(textField('Katman adı',n.name||'',v=>{changeProp('name',v);setTimeout(draw,120);},{placeholder:info.label},true));
    if(V().textable(el)){
      const p=E.lang==='en'?'textEn':'text', value=E.lang==='en'?(n.textEn??n.text??info.text):(n.text??info.text);
      const area=h('textarea',{'aria-label':E.lang==='en'?'İngilizce metin':'Metin'});area.value=value||'';area.addEventListener('input',()=>changeProp(p,area.value));content.push(field(E.lang==='en'?'İngilizce metin':'Metin',area,true));
      if(info.custom&&info.kind==='text')content.push(selectField('Metin türü',n.tag||'p',[['p','Paragraf'],['h2','Başlık'],['h3','Alt başlık']],v=>{changeProp('tag',v);setTimeout(draw,120);},true));
    }
    if(['image','video'].includes(info.kind)){
      content.push(textField('Medya adresi',n.src??info.src,v=>{if(v&&!V().safeURL(v,true)){toast('Geçerli bir görsel veya video adresi gir.');return;}changeProp('src',v);},{placeholder:'https://…'},true));
      content.push(h('div',{class:'ve-field ve-wide'},btn('Dosyayı değiştir',()=>pickMedia(info.kind,selected),{style:'width:100%'})));
      if(info.kind==='image')content.push(textField('Görsel açıklaması',n.alt??info.alt,v=>changeProp('alt',v),{},true));
      if(info.kind==='video'){content.push(textField('Kapak görseli adresi',n.poster||el.getAttribute('poster')||'',v=>changeProp('poster',v),{},true));const loop=h('input',{type:'checkbox',checked:n.loop??el.loop,onchange:e=>changeProp('loop',e.target.checked)});content.push(field('Döngüde oynat',loop));}
    }
    if(info.kind==='link'){
      content.push(textField('Bağlantı',n.href??info.href,v=>{if(v&&!V().safeURL(v)){toast('Geçerli bir bağlantı gir.');return;}changeProp('href',v);},{placeholder:'https://… veya #sayfa'},true));
      content.push(selectField('Site içindeki sayfa','',[['','Sayfa seç…'],...pageOptions().map(([v,t])=>['#'+v,t])],v=>{if(v){changeProp('href',v);setTimeout(drawInspector,120);}},true));
      content.push(field('Yeni sekmede aç',h('input',{type:'checkbox',checked:!!n.newTab,onchange:e=>changeProp('newTab',e.target.checked)})));
    }
    inspector.append(section('İçerik',content));
    function dim(label,key){return textField(label,s[key]||'',v=>{v=v.trim();if(/^\d+(\.\d+)?$/.test(v))v+='px';if(v&&!/^(auto|0|\d+(\.\d+)?(px|%|rem|vh|vw|ch))$/.test(v)){toast('Örn. 80%, 480px veya auto yaz.');return;}changeStyle(key,v);},{placeholder:computed[key]||'auto','data-style':key});}
    const layout=[dim('Genişlik','width'),dim('Yükseklik','height'),dim('En fazla genişlik','maxWidth'),dim('En az yükseklik','minHeight'),selectField('Yatay konum',s.align,[['','Mevcut'],['left','Sol'],['center','Orta'],['right','Sağ']],v=>changeStyle('align',v))];
    if(info.kind==='image'||info.kind==='video')layout.push(selectField('Görselin yerleşimi',s.objectFit,[['','Mevcut'],['contain','Tamamını sığdır'],['cover','Alanı doldur']],v=>changeStyle('objectFit',v)));
    if(['root','section','columns','column'].includes(info.kind)){
      layout.push(selectField('İçerik düzeni',s.display,[['','Mevcut'],['block','Alt alta'],['flex','Esnek sıra'],['grid','Izgara']],v=>changeStyle('display',v)));
      layout.push(selectField('Sütun sayısı',String(s.columns||''),[['','Mevcut'],['1','1 sütun'],['2','2 sütun'],['3','3 sütun'],['4','4 sütun']],v=>changeStyle('columns',v)),dim('Öğeler arası boşluk','gap'));
      layout.push(selectField('Esnek sıra yönü',s.flexDirection,[['','Mevcut'],['row','Yatay'],['column','Dikey']],v=>changeStyle('flexDirection',v)));
    }
    inspector.append(section('Boyut ve yerleşim',layout));
    inspector.append(section('Boşluklar',[dim('İç · Üst','paddingTop'),dim('İç · Alt','paddingBottom'),dim('İç · Sol','paddingLeft'),dim('İç · Sağ','paddingRight'),dim('Dış · Üst','marginTop'),dim('Dış · Alt','marginBottom'),dim('Dış · Sol','marginLeft'),dim('Dış · Sağ','marginRight')],false));
    const appearance=[textField('Arka plan',s.backgroundColor||'',v=>changeStyle('backgroundColor',v),{placeholder:'transparent'}),dim('Köşe yuvarlaklığı','borderRadius')];
    if(V().textable(el)||['root','section','columns','column'].includes(info.kind))appearance.push(dim('Yazı boyutu','fontSize'),textField('Yazı rengi',s.color||'',v=>changeStyle('color',v),{placeholder:'#1d1d1f'}),textField('Satır yüksekliği',s.lineHeight||'',v=>{if(v&&(Number(v)<.8||Number(v)>3||!Number.isFinite(Number(v)))){toast('0.8 ile 3 arasında bir değer gir.');return;}changeStyle('lineHeight',v);},{placeholder:'1.5'}),selectField('Yazı kalınlığı',s.fontWeight,[['','Mevcut'],['300','İnce'],['400','Normal'],['500','Orta'],['600','Kalın'],['700','Daha kalın']],v=>changeStyle('fontWeight',v)),selectField('Metin hizası',s.textAlign,[['','Mevcut'],['left','Sol'],['center','Orta'],['right','Sağ']],v=>changeStyle('textAlign',v)));
    inspector.append(section('Görünüm',appearance,false));
    if(info.custom&&info.parent){
      const descendants=new Set([selected]);let more=true;while(more){more=false;Object.entries(record().nodes||{}).forEach(([k,v])=>{if(descendants.has(v.parent)&&!descendants.has(k)){descendants.add(k);more=true;}});}
      const parents=V().nodes().filter(x=>!descendants.has(x.key)&&['section','columns','column','root'].includes(x.kind)&&visible(V().find(x.key))&&!V().find(x.key).closest('.px-hero,.thumb,#stage'));
      inspector.append(section('Başka bölüme taşı',[selectField('Yerleştirileceği bölüm',n.parent||'root',parents.map(p=>[p.key,p.label]),v=>{changeProp('parent',v);expanded.add(v);setTimeout(draw,120);},true)],false));
    }
    inspector.append(h('div',{class:'ve-actions'},btn('Ölçüleri sıfırla',()=>{commit(()=>delete nodeRecord()[device==='mobile'?'mobile':'style'],{redraw:true});})));
    if(selected!=='root')inspector.append(h('div',{class:'ve-actions'},btn('↑ Yukarı',()=>moveBy(-1)),btn('↓ Aşağı',()=>moveBy(1))),h('div',{class:'ve-actions'},btn('Öğeyi kaldır',removeSelected,{class:'ve-btn ve-danger'})));
    if(page.startsWith('page-')&&selected==='root')inspector.append(section('Sayfa',[textField('Sayfa adı',record().title||'',v=>{commit(()=>record().title=v);syncPages();},{},true)]),btn('Sayfayı kaldır',()=>{const k=page;commit(()=>delete E.state.visual.pages[k]);navigate('home');},{class:'ve-btn ve-danger'}));
    inspector.append(h('p',{},'Boş alanlar sitenin mevcut tasarımını kullanır. Ölçülerde px, %, rem veya auto yazabilirsin.'));
  }
  function draw(){if(!E.ready)return;syncPages();drawTree();drawInspector();updateOutline();updateHistory();}

  // Media, canvas interaction and page lifecycle are initialized below.
  function dialog(title,description){
    const d=h('dialog',{class:'ve-dialog'},h('h2',{},title),h('p',{},description));
    d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
    document.body.append(d);return d;
  }
  function newPage(){
    if(!E.ready)return;
    const d=dialog('Yeni sayfa','Sayfanı oluşturduktan sonra bağlantı düğmeleriyle sitenin istediğin yerine bağlayabilirsin.');
    const title=h('input',{type:'text','aria-label':'Sayfa adı',placeholder:'Örn. Tasarım sürecimiz',maxlength:80});
    const create=()=>{const name=title.value.trim();if(!name){title.focus();return;}
      const slug=name.toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ş/g,'s').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'yeni-sayfa';
      let key='page-'+slug,i=2;while(E.state.visual?.pages?.[key])key='page-'+slug+'-'+i++;
      const sectionKey=uid();
      commit(()=>{E.state.visual.pages[key]={title:name,nodes:{[sectionKey]:{type:'section',parent:'root',name},[uid()]:{type:'text',tag:'h2',parent:sectionKey,text:name},[uid()]:{type:'text',parent:sectionKey,text:'Bu sayfanın hikâyesini buraya yaz.'}},orders:{}};});
      d.close();navigate(key);setTimeout(()=>choose(sectionKey),180);
    };
    title.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();create();}});
    d.append(field('Sayfa adı',title,true),h('div',{class:'ve-actions'},btn('Vazgeç',()=>d.close()),btn('Sayfayı oluştur',create,{class:'ve-btn ve-primary'})));d.showModal();title.focus();
  }
  function mediaDialog(type){
    const label=type==='image'?'Görsel':'Video',d=dialog(label+' ekle',type==='image'?'Bilgisayarından görsel seç veya görselin doğrudan bağlantısını yapıştır.':'MP4 / WebM dosyası seç veya doğrudan video bağlantısı ekle. En fazla 45 MB.');
    const url=h('input',{type:'url','aria-label':label+' bağlantısı',placeholder:'https://…'}),error=h('p',{role:'alert',style:'color:#b33'});
    const use=()=>{if(!url.value.trim()||!V().safeURL(url.value,true)){error.textContent='Geçerli bir medya bağlantısı gir.';url.focus();return;}add(type,{src:url.value.trim(),alt:type==='image'?'Yeni görsel':undefined});d.close();};
    d.append(btn('Bilgisayardan seç',()=>{d.close();pickMedia(type);},{class:'ve-btn ve-primary',style:'width:100%'}),field('Veya bağlantı ile ekle',url,true),error,h('div',{class:'ve-actions'},btn('Vazgeç',()=>d.close()),btn('Bağlantıyı ekle',use)));d.showModal();
  }
  function pickMedia(type,replaceKey=null){
    const input=h('input',{type:'file',accept:type==='video'?'video/mp4,video/webm':'.jpg,.jpeg,.png,.webp,.avif,.gif',hidden:''});if(!replaceKey)input.multiple=true;
    document.body.append(input);input.addEventListener('cancel',()=>input.remove(),{once:true});
    input.addEventListener('change',async()=>{
      const files=[...input.files];input.remove();if(!files.length)return;
      const targetPage=page,parent=insertionParent(),oldSelected=selected,added=[];
      busy=true;$('.layout').inert=true;tools.inert=true;$('#publish').disabled=true;
      try{
        for(let i=0;i<files.length;i++){E.status(labelForMedia(type)+' hazırlanıyor '+(i+1)+'/'+files.length+'…');added.push({src:await E.addUpload(files[i],'visual'),alt:files[i].name.replace(/\.[^.]+$/,'')});}
        busy=false;
        if(page!==targetPage)navigate(targetPage);
        selected=oldSelected;
        if(replaceKey){commit(()=>{nodeRecord(replaceKey).src=added[0].src;},{redraw:true});}
        else {
          checkpoint();let target=parent;const nodes=record().nodes ||= {};
          if(target==='root'){target=uid();nodes[target]={type:'section',parent:'root',name:labelForMedia(type)+' bölümü'};}
          let last;
          for(const media of added){last=uid();nodes[last]={type,parent:target,...media};}
          expanded.add(target);lastSnapshot=JSON.stringify(E.state);E.touch(true,true);updateHistory();setTimeout(()=>choose(last,true),150);
        }
        toast(added.length+' '+labelForMedia(type).toLocaleLowerCase('tr')+' eklendi.');
      }catch(error){toast(error.message||'Dosya eklenemedi.');E.status('Dosya eklenemedi','err');}
      finally{busy=false;$('.layout').inert=false;tools.inert=false;E.touch(false,true);}
    },{once:true});input.click();
  }
  function labelForMedia(type){return type==='video'?'Video':'Görsel';}
  function exportDraft(){
    if(!E.ready)return;finishInline();
    const url=URL.createObjectURL(new Blob([JSON.stringify(E.exportDraft())],{type:'application/json'}));
    const a=h('a',{href:url,download:'bca-studio-taslak-'+new Date().toISOString().slice(0,10)+'.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Taslak ve eklediğin medya yedeklendi.');
  }
  function importDraft(){
    const input=h('input',{type:'file',accept:'.json,application/json',hidden:''});document.body.append(input);input.addEventListener('cancel',()=>input.remove(),{once:true});
    input.addEventListener('change',async()=>{const f=input.files[0];input.remove();if(!f)return;try{const v=JSON.parse(await f.text());if(v.format!=='bca-visual-draft'||v.version!==1||!Array.isArray(v.state?.projects)||!v.state?.visual?.pages)throw new Error('BCA editöründen indirilmiş bir taslak seç.');const previous=clone(E.state);lastSnapshot=JSON.stringify(v.state);await E.importDraft(v);history.push(previous);future=[];selected=null;setTimeout(draw,180);toast('Taslak açıldı. Yayınlamak için Yayınla düğmesini kullan.');}catch(e){lastSnapshot=JSON.stringify(E.state);toast(e.message||'Taslak okunamadı.');}}, {once:true});input.click();
  }
  function fitPreview(){
    const width=device==='mobile'?390:1280,scale=Math.min(1,Math.max(120,stage.clientWidth-32)/width),height=Math.max(200,(stage.clientHeight-32)/scale);
    Object.assign(frame.style,{width:width+'px',height:height+'px',left:Math.max(0,(stage.clientWidth-width*scale)/2)+'px',top:'16px',transform:'scale('+scale+')'});
    document.documentElement.style.setProperty('--ve-top',($('.bar').offsetHeight+tools.offsetHeight)+'px');
    requestAnimationFrame(updateOutline);
  }
  function updateOutline(){
    if(!overlay)return;
    const el=V()?.find(selected);overlay.hidden=!editing||!el||!visible(el)||!!inline;
    if(hover)hover.hidden=true;
    if(overlay.hidden)return;
    const r=el.getBoundingClientRect();Object.assign(overlay.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    const label=overlay.querySelector('.ve-selection-label');label.textContent=(V().describe(el).label||'Öğe').slice(0,34)+' · '+Math.round(r.width)+' × '+Math.round(r.height);
    label.style.top=r.top<26?'2px':'-26px';
    overlay.querySelector('[data-ve-drag="move"]').hidden=selected==='root';
  }
  function bindFrame(){
    const w=E.site();if(!w?.BCA_VISUAL||bound?.document===w.document)return false;
    bound={document:w.document,getComputedStyle:w.getComputedStyle.bind(w),window:w};const doc=w.document;
    const style=doc.createElement('style');style.dataset.veUi='true';style.textContent=`
      html.ve-editing [data-ve-key]{cursor:default!important}html.ve-editing a,html.ve-editing button{cursor:default!important}
      html.ve-editing .bca-hl,html.ve-editing .bca-hov{outline:none!important}html.ve-editing [contenteditable]{cursor:text!important;outline:2px solid #246bfe!important;outline-offset:4px;min-height:1em}
      .ve-selection,.ve-hover{position:fixed;box-sizing:border-box;pointer-events:none;border:2px solid #246bfe;z-index:2147483646;border-radius:1px;}
      .ve-hover{border:1px solid #246bfe88;z-index:2147483645}.ve-selection[hidden],.ve-hover[hidden]{display:none!important}
      .ve-selection-label{position:absolute;left:-2px;top:-26px;max-width:360px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;background:#246bfe;color:white;padding:4px 7px;font:11px/16px system-ui;border-radius:4px 4px 0 0;}
      .ve-handle{position:absolute;width:12px;height:12px;padding:0;border:2px solid #246bfe;background:white;pointer-events:auto;touch-action:none;border-radius:2px;}
      .ve-handle[data-ve-drag=e]{right:-7px;top:calc(50% - 6px);cursor:ew-resize}.ve-handle[data-ve-drag=s]{bottom:-7px;left:calc(50% - 6px);cursor:ns-resize}.ve-handle[data-ve-drag=se]{right:-7px;bottom:-7px;cursor:nwse-resize}
      .ve-handle[data-ve-drag=move]{width:28px;height:24px;top:4px;left:4px;cursor:move;color:#246bfe;font:16px/18px system-ui;background:#fff;border-width:1px}
    `;doc.head.append(style);
    overlay=doc.createElement('div');overlay.className='ve-selection';overlay.dataset.veUi='true';overlay.hidden=true;
    const label=doc.createElement('span');label.className='ve-selection-label';overlay.append(label);
    for(const [axis,name] of [['e','Genişliği ayarla'],['s','Yüksekliği ayarla'],['se','Boyutu ayarla'],['move','Öğeyi taşı']]){const b=doc.createElement('button');b.type='button';b.className='ve-handle';b.dataset.veDrag=axis;b.setAttribute('aria-label',name);b.title=name;if(axis==='move')b.textContent='✥';b.addEventListener('pointerdown',e=>startDrag(e,axis));overlay.append(b);}
    hover=doc.createElement('div');hover.className='ve-hover';hover.dataset.veUi='true';hover.hidden=true;doc.body.append(hover,overlay);
    doc.documentElement.classList.toggle('ve-editing',editing);
    const target=e=>{const node=e.target?.closest?.('[data-ve-key]');return node&&V()?.root?.contains(node)?node:null;};
    w.addEventListener('click',e=>{if(!editing||e.target?.closest?.('[data-ve-ui]')||inline?.el.contains(e.target))return;const el=target(e);if(!el)return;e.preventDefault();e.stopImmediatePropagation();choose(el.dataset.veKey);},true);
    w.addEventListener('dblclick',e=>{if(!editing||e.target?.closest?.('[data-ve-ui]'))return;const el=target(e);if(!el||!V().textable(el))return;e.preventDefault();e.stopImmediatePropagation();startInline(el);},true);
    w.addEventListener('pointerover',e=>{if(!editing||drag||inline||e.target?.closest?.('[data-ve-ui]'))return;const el=target(e);if(!el||el.dataset.veKey===selected){hover.hidden=true;return;}const r=el.getBoundingClientRect();Object.assign(hover.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});hover.hidden=false;},true);
    // Keep hover-only project transitions from covering the editable cover while selecting.
    w.addEventListener('mouseover',e=>{if(editing&&e.target?.closest?.('.thumb,.arch-row,.scard'))e.stopImmediatePropagation();},true);
    doc.addEventListener('bca-visual-render',()=>{const next=V().page;const changed=page!==next;page=next;if(changed)selected=null;syncPages();drawTree();updateOutline();if(changed)drawInspector();});
    w.addEventListener('scroll',updateOutline,{passive:true,capture:true});w.addEventListener('resize',updateOutline);doc.addEventListener('keydown',keyboard,true);
    doc.addEventListener('load',updateOutline,true);doc.addEventListener('transitionend',updateOutline,true);
    page=V().page;return true;
  }
  function startInline(el){
    finishInline();choose(el.dataset.veKey);
    inline={el,key:el.dataset.veKey,html:el.innerHTML,text:el.textContent,editable:el.getAttribute('contenteditable'),spellcheck:el.getAttribute('spellcheck')};
    el.setAttribute('contenteditable','plaintext-only');el.setAttribute('spellcheck','true');el.focus();
    const selection=bound.window.getSelection(),range=bound.document.createRange();range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);
    el.addEventListener('blur',()=>finishInline(),{once:true});updateOutline();
  }
  function finishInline(save=true){
    if(!inline)return;const saved=inline;inline=null;const text=saved.el.innerText;
    saved.el.innerHTML=saved.html;
    for(const [key,value] of [['contenteditable',saved.editable],['spellcheck',saved.spellcheck]])if(value===null)saved.el.removeAttribute(key);else saved.el.setAttribute(key,value);
    if(save&&text!==saved.text){commit(()=>{nodeRecord(saved.key)[E.lang==='en'?'textEn':'text']=text;},{key:page+saved.key+'inline'});setTimeout(drawInspector,110);}updateOutline();
  }
  function startDrag(event,axis){
    if(busy||!editing||event.button!==0)return;finishInline();event.preventDefault();event.stopPropagation();
    const el=V()?.find(selected);if(!el)return;const r=el.getBoundingClientRect(),cs=bound.getComputedStyle(el),handle=event.currentTarget;
    drag={el,key:selected,axis,x:event.clientX,y:event.clientY,width:r.width,height:r.height,ml:parseFloat(cs.marginLeft)||0,mt:parseFloat(cs.marginTop)||0,style:el.getAttribute('style'),values:null};
    handle.setPointerCapture(event.pointerId);
    const move=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,values={};
      if(axis==='move'){values.marginLeft=Math.max(0,Math.round(drag.ml+dx))+'px';values.marginTop=Math.max(0,Math.round(drag.mt+dy))+'px';}
      else {if(axis.includes('e'))values.width=Math.max(24,Math.round(drag.width+dx))+'px';if(axis.includes('s'))values.height=Math.max(24,Math.round(drag.height+dy))+'px';if(cs.display==='inline')values.display='inline-block';}
      Object.entries(values).forEach(([k,v])=>el.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important'));drag.values=values;updateOutline();
    };
    const end=e=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);if(!drag)return;const finished=drag;drag=null;if(finished.style===null)el.removeAttribute('style');else el.setAttribute('style',finished.style);if(e.type!=='pointercancel'&&finished.values)commit(()=>{Object.assign(nodeRecord(finished.key)[device==='mobile'?'mobile':'style'] ||= {},finished.values);},{redraw:true});updateOutline();};
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
  }
  function keyboard(e){
    if(busy||document.querySelector('dialog[open]'))return;
    const isInput=e.target?.closest?.('input,textarea,select,[contenteditable]');
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();finishInline();E.touch();toast('Taslak kaydedildi. Herkesin görmesi için Yayınla.');return;}
    if(e.key==='Escape'){if(inline){e.preventDefault();finishInline(false);}else{selected=null;document.body.classList.remove('ve-show-layers','ve-show-props');drawInspector();updateOutline();}return;}
    if(inline&&(e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();finishInline();return;}
    if(isInput)return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if(editing&&e.key==='Delete'&&selected){e.preventDefault();removeSelected();}
  }
  function boot(){
    if(!E.ready||!V())return false;bindFrame();
    if(!booted){booted=true;lastSnapshot=JSON.stringify(E.state);if(innerWidth<620){device='mobile';$('[data-dev="mobile"]').click();}}
    draw();fitPreview();return true;
  }
  let framePoll;
  function awaitFrame(){clearInterval(framePoll);let tries=0;framePoll=setInterval(()=>{if(boot()||++tries>200)clearInterval(framePoll);},100);}
  frame.addEventListener('load',awaitFrame);
  document.querySelectorAll('[data-dev]').forEach(b=>b.addEventListener('click',()=>{finishInline();device=b.dataset.dev;fitPreview();drawInspector();}));
  document.addEventListener('keydown',keyboard,true);
  addEventListener('bca-editor-ready',boot);
  addEventListener('bca-editor-change',e=>{if(!booted)return;const next=JSON.stringify(E.state);if(!e.detail?.visualOnly&&lastSnapshot&&next!==lastSnapshot){history.push(JSON.parse(lastSnapshot));if(history.length>60)history.shift();future=[];checkpointKey='';}lastSnapshot=next;syncPages();updateHistory();});
  new ResizeObserver(fitPreview).observe(stage);addEventListener('resize',fitPreview);
  window.BCA_EDITOR_UI={legacy,select:choose,navigate,add,setEditing};
  awaitFrame();
})();
