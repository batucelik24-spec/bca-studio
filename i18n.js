/* BCA Studio — TR / EN
   Turkish is written in the page. In English the visible text, image
   descriptions and labels are swapped from the dictionary in i18n-en.js
   (plus any translations saved from the editor in content.js → en). */
(function(){
  const qs = new URLSearchParams(location.search);
  const editor = qs.has('editor');
  const store = {
    get(){ try{ return localStorage.getItem('bca-lang'); }catch(e){ return null; } },
    set(v){ try{ localStorage.setItem('bca-lang', v); }catch(e){} }
  };
  const bot = /bot|crawl|spider|slurp|lighthouse|facebookexternalhit|embedly|preview/i.test(navigator.userAgent);
  let lang = qs.get('lang');
  if(lang !== 'en' && lang !== 'tr') lang = null;
  if(!lang && !editor) lang = store.get();
  if(!lang && !editor && !bot){
    const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'tr'];
    lang = prefs.some(l=>/^tr\b/i.test(l)) ? 'tr' : 'en';
  }
  if(lang !== 'en') lang = 'tr';
  if(qs.get('lang') && !editor) store.set(lang);
  document.documentElement.lang = lang;

  const I = window.BCA_I18N = {lang, editor, start(){}, setContent(){}, retranslate(){}, t: s => s, known: () => true};
  if(lang !== 'en') return;
  I.start = start; I.setContent = setContent;

  /* hide the page for the moment between parsing and the first translation pass */
  document.documentElement.classList.add('i18n-wait');
  const hold = document.createElement('style');
  hold.textContent = 'html.i18n-wait body{opacity:0}';
  document.head.appendChild(hold);
  setTimeout(()=>document.documentElement.classList.remove('i18n-wait'), 2500);
  document.write('<script src="i18n-en.js?v=4"><\/script>');

  const norm = s => String(s).replace(/\s+/g,' ').trim();
  let extra = {}, htmlEN = {};
  /* longer statements written with line breaks and emphasis; used while the Turkish matches the built-in text */
  const HTML = {
    'home.statement': ['Tasarımı araştırıyor,<br><em>yeni üretim yolları</em> deniyoruz.', 'Researching design,<br><em>testing new ways</em> to make.'],
    'studio.intro.title': ['Fikirleri deneyerek<br>hayata geçiriyoruz.', 'We bring ideas to life<br>by testing them.']
  };
  const RULES = [
    [/^Büyüt: (.+)$/, (m,a)=>'Enlarge: '+(tr(a) ?? a)],
    [/^Profili aç: (.+)$/, (m,a)=>'Open profile: '+a],
    [/^(\d+) görsel$/, (m,a)=>a+(a==='1'?' image':' images')],
    [/^(\d+) PROJE$/, (m,a)=>a+(a==='01'||a==='1'?' PROJECT':' PROJECTS')],
    [/^Konut planı — portfolyo sırası (\d+)$/, (m,a)=>'Housing plan — portfolio sheet '+a],
    [/^Konut planı · (\d+)$/, (m,a)=>'Housing plan · '+a],
    [/^([\d.]+) m²$/, (m,a)=>a.replace(/\./g,',')+' m²'],
    [/^(.+) — proje detayları$/, (m,a)=>a+' — project details'],
    [/^(.+) detayları$/, (m,a)=>a+' details']
  ];
  function lookup(k){
    if(Object.prototype.hasOwnProperty.call(extra, k)) return extra[k];
    const D = window.BCA_EN || {};
    return Object.prototype.hasOwnProperty.call(D, k) ? D[k] : null;
  }
  /* returns the English for a Turkish string, or null when it has none */
  function tr(s){
    const k = norm(s); if(!k) return null;
    let v = lookup(k); if(v != null) return v;
    for(const [re, f] of RULES){ const m = k.match(re); if(m) return k.replace(re, f); }
    for(const sep of [' · ', ' — ', ' / ']){
      if(k.includes(sep)){
        let hit = false;
        const out = k.split(sep).map(part=>{ const e = tr(part); if(e != null){ hit = true; return e; } return part; });
        if(hit) return out.join(sep);
      }
    }
    return null;
  }
  I.t = s => tr(s) ?? s;
  I.known = s => tr(s) != null;

  const SKIP = {SCRIPT:1, STYLE:1, NOSCRIPT:1, TEXTAREA:1, CODE:1, PRE:1};
  const ATTRS = ['aria-label','alt','title','placeholder'];
  function textNode(n){
    const p = n.parentNode; if(!p || SKIP[p.nodeName] || (p.closest && p.closest('[translate="no"]'))) return;
    const raw = n.nodeValue; if(!raw || !raw.trim()) return;
    const v = tr(raw); if(v == null) return;
    const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    const out = (/^\s/.test(v) ? '' : lead) + v + (/\s$/.test(v) ? '' : trail);
    if(out !== raw) n.nodeValue = out;
  }
  function attrs(el){
    for(const a of ATTRS){ const raw = el.getAttribute(a); if(!raw) continue; const v = tr(raw); if(v != null && v !== raw) el.setAttribute(a, v); }
  }
  function block(el){
    const key = el.dataset.edit; let en = htmlEN[key];
    if(en == null && HTML[key] && norm(el.innerHTML) === norm(HTML[key][0])) en = HTML[key][1];
    if(en != null && norm(el.innerHTML) !== norm(en)) el.innerHTML = en;
  }
  function walk(root){
    if(root.nodeType === 3){ textNode(root); return; }
    if(root.nodeType !== 1 || SKIP[root.nodeName]) return;
    if(root.matches('[data-edit]')) block(root);
    root.querySelectorAll('[data-edit]').forEach(block);
    attrs(root); root.querySelectorAll('['+ATTRS.join('],[')+']').forEach(attrs);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while((n = it.nextNode())) textNode(n);
  }
  function head(){
    document.title = 'BCA Studio — Batuhan Çelik Architecture & Studio';
    const set = (sel, v) => { const m = document.querySelector(sel); if(m) m.setAttribute('content', v); };
    set('meta[name="description"]', 'BCA Studio: Batuhan Çelik Architecture and Studio. Public buildings, stadiums and competition projects, alongside apps, software and AI research.');
    set('meta[property="og:description"]', 'Architecture projects and experimental design, software and AI research.');
    set('meta[property="og:locale"]', 'en_US');
  }
  function setContent(content){
    const en = (content && content.en) || {};
    extra = {}; Object.entries(en.strings || {}).forEach(([k,v])=>{ if(v && String(v).trim()) extra[norm(k)] = v; });
    htmlEN = {}; Object.entries(en.texts || {}).forEach(([k,v])=>{ if(v && String(v).trim()) htmlEN[k] = v; });
  }
  I.retranslate = () => { if(document.body) walk(document.body); };
  function start(){
    setContent(window.BCA_CONTENT);
    head(); walk(document.body);
    new MutationObserver(list=>{
      for(const m of list){
        if(m.type === 'characterData') textNode(m.target);
        else if(m.type === 'attributes') attrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});
    document.documentElement.classList.remove('i18n-wait');
  }
})();

/* the TR · EN switch, shown in every page header */
(function(){
  const I = window.BCA_I18N;
  const realStart = I.start;
  I.start = function(){
    if(I.lang === 'en') realStart();
    if(I.editor) return;
    const make = () => {
      const box = document.createElement('div');
      box.className = 'lang-switch'; box.setAttribute('role','group'); box.setAttribute('aria-label','Dil / Language'); box.setAttribute('translate','no');
      ['tr','en'].forEach((l,i)=>{
        if(i){ const s = document.createElement('span'); s.textContent = '·'; s.setAttribute('aria-hidden','true'); box.append(s); }
        const a = document.createElement('a');
        a.href = '?lang='+l; a.hreflang = l; a.lang = l; a.textContent = l.toUpperCase();
        if(l === I.lang) a.setAttribute('aria-current','true');
        a.addEventListener('click', e=>{
          e.preventDefault(); if(l === I.lang) return;
          try{ localStorage.setItem('bca-lang', l); }catch(err){}
          const u = new URL(location.href); u.searchParams.set('lang', l);
          location.href = u.pathname + u.search + location.hash;
        });
        box.append(a);
      });
      return box;
    };
    document.querySelectorAll('header.topbar nav').forEach(nav=>nav.append(make()));
    const stage = document.getElementById('stage');
    if(stage){ const s = make(); s.classList.add('on-stage'); stage.append(s); }
  };
})();
