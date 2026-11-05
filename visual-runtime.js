/* Shared renderer for published visual edits and editor drafts. */
(() => {
  'use strict';
  const doc = document, clone = v => JSON.parse(JSON.stringify(v));
  let data = window.BCA_CONTENT?.visual || {version:1,pages:{}}, pending = 0, current = '', roots = new Map();
  const originals = new Map(), originalOrders = new Map();
  const css = doc.createElement('style'); css.id = 'bca-visual-styles'; doc.head.append(css);
  const customPage = doc.createElement('main'); customPage.className = 've-custom-page'; customPage.hidden = true;
  doc.querySelector('footer')?.before(customPage);
  if(!customPage.isConnected) doc.body.append(customPage);
  const pageKey = () => {
    const h = location.hash.slice(1);
    return /^(?:[ps]-|page-)/.test(h) || ['architecture','studio'].includes(h) ? h : 'home';
  };
  const safeURL = (v, media=false) => {
    v = String(v || '').trim();
    if(!v || /[\u0000-\u001f\u007f]/.test(v)) return '';
    if(media && /^(?:data:(?:image\/(?:png|jpeg|webp|gif|avif)|video\/(?:mp4|webm));base64,|blob:)/i.test(v)) return v;
    if(/^(?:https?:\/\/|\/|\.\/|\.\.\/|#)/i.test(v) || (!media && /^(?:mailto:|tel:)/i.test(v))) return v;
    if(!/[:\\]/.test(v)) return v;
    return '';
  };
  const length = v => /^(?:auto|0|(?:\d+(?:\.\d+)?)(?:px|%|rem|vh|vw|ch))$/.test(String(v)) ? String(v) : null;
  const color = v => /^(?:#[\da-f]{3,8}|transparent|currentColor|[a-z]{3,20})$/i.test(String(v)) ? String(v) : null;
  function declarations(styles={}) {
    const out = [];
    const dims = ['width','height','minHeight','maxWidth','paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','marginLeft','marginRight','gap','fontSize','borderRadius'];
    const names = k => k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
    dims.forEach(k=>{ const v=length(styles[k]); if(v!==null) out.push(`${names(k)}:${v}!important`); });
    ['color','backgroundColor'].forEach(k=>{const v=color(styles[k]);if(v)out.push(`${names(k)}:${v}!important`);});
    const enums = {textAlign:['left','center','right'],objectFit:['contain','cover'],display:['block','inline-block','flex','grid'],alignItems:['start','center','end','stretch'],justifyContent:['start','center','end','space-between'],fontWeight:['300','400','500','600','700'],flexDirection:['row','column']};
    Object.entries(enums).forEach(([k,values])=>{if(values.includes(String(styles[k])))out.push(`${names(k)}:${styles[k]}!important`);});
    if(Number(styles.lineHeight)>=.8 && Number(styles.lineHeight)<=3)out.push(`line-height:${Number(styles.lineHeight)}!important`);
    if(Number.isInteger(Number(styles.columns)) && styles.columns>=1 && styles.columns<=4)out.push(`display:grid!important;grid-template-columns:repeat(${Number(styles.columns)},minmax(0,1fr))!important`);
    if(styles.align==='center')out.push('margin-left:auto!important;margin-right:auto!important');
    if(styles.align==='left')out.push('margin-left:0!important;margin-right:auto!important');
    if(styles.align==='right')out.push('margin-left:auto!important;margin-right:0!important');
    return out.join(';');
  }
  function remember(e) {
    if(!originals.has(e)) originals.set(e,{attrs:{},html:null});
    return originals.get(e);
  }
  function attr(e,k,v) {
    const b=remember(e);if(!(k in b.attrs))b.attrs[k]=e.getAttribute(k);
    if(v==null)e.removeAttribute(k);else e.setAttribute(k,v);
  }
  function reset() {
    cancelAnimationFrame(pending); pending=0;
    originals.forEach((b,e)=>{ if(b.html!==null)e.innerHTML=b.html;Object.entries(b.attrs).forEach(([k,v])=>v===null?e.removeAttribute(k):e.setAttribute(k,v)); });
    originals.clear();
    doc.querySelectorAll('[data-ve-custom]').forEach(e=>e.remove());
    originalOrders.forEach((children,p)=>{children.forEach(e=>{if(e.parentElement===p)p.append(e);});});originalOrders.clear();
    css.textContent='';
  }
  const excluded = 'script,style,canvas,svg,svg *,[data-ve-ui],#px-bar,.topbar,.arch-float,.px-hud,.px-spots';
  const candidates = 'section,article,header,footer,div,h1,h2,h3,h4,p,span,b,strong,em,small,li,ul,ol,dl,dt,dd,figure,figcaption,img,video,a,button';
  function mark(root) {
    root.dataset.veKey='root';
    function walk(p,path) {
      [...p.children].filter(e=>!e.hasAttribute('data-ve-custom') && !e.matches('[data-ve-ui]')).forEach((e,i)=>{
        if(e.matches(excluded))return;
        const ownPath=path+'/'+e.tagName.toLowerCase()+i;
        // Keep keys through a reorder; recreated project nodes derive the same keys.
        if(e.matches(candidates)) e.dataset.veKey ||= e.id ? 'id:'+e.id : e.dataset.edit ? 'text:'+e.dataset.edit : 'el:'+ownPath;
        walk(e,ownPath);
      });
    }
    walk(root,'');
  }
  function rootFor(page) {
    if(page.startsWith('page-'))return customPage;
    return doc.getElementById(/^[ps]-/.test(page)?'v-project':'v-'+page);
  }
  const find = (key,root=rootFor(pageKey())) => key==='root'?root:root?.querySelector('[data-ve-key="'+CSS.escape(key)+'"]');
  function create(block,key) {
    const tags={section:'section',columns:'div',column:'div',text: ['h2','h3','p'].includes(block.tag)?block.tag:'p',image:'img',video:'video',link:'a'};
    if(!tags[block.type])return null;
    const e=doc.createElement(tags[block.type]);e.className='ve-'+block.type;e.dataset.veKey=key;e.dataset.veCustom='true';e.setAttribute('translate','no');
    if(block.type==='video'){e.controls=true;e.playsInline=true;e.preload='metadata';}
    if(block.type==='image'){e.loading='lazy';e.decoding='async';}
    return e;
  }
  function textable(e) {
    return !!e && (/^(H[1-6]|P|SPAN|B|STRONG|EM|SMALL|DT|DD|FIGCAPTION|BUTTON|A|LI)$/.test(e.tagName)) && !e.querySelector('img,video,canvas,svg,div,section,ul,ol,button');
  }
  function apply() {
    pending=0;
    reset();
    const page=pageKey();current=page;
    const pd=data.pages?.[page] || {}, root=rootFor(page);if(!root)return;
    if(page.startsWith('page-')){
      ['v-home','v-architecture','v-studio','v-project'].forEach(id=>{const e=doc.getElementById(id);if(e)e.hidden=true;});
      customPage.hidden=false;
      doc.documentElement.dataset.view='custom';doc.documentElement.dataset.tone='light';
      customPage.replaceChildren();
      const nav=doc.createElement('nav');nav.dataset.veUi='true';
      for(const [label,url] of [['BCA Studio','#home'],['Studio ↗','#studio']]){const a=doc.createElement('a');a.textContent=label;a.href=url;nav.append(a);}customPage.append(nav);
    }else customPage.hidden=true;
    root.dataset.vePage=page;
    mark(root);roots.set(page,root);
    const nodes=pd.nodes || {}, blocks=Object.entries(nodes).filter(([,n])=>n.type);
    // Resolve parents in passes, so nested columns do not depend on object insertion order.
    let remaining=blocks.slice();
    for(let pass=0;remaining.length && pass<12;pass++){
      const later=[];
      for(const [k,n] of remaining){const parent=find(n.parent || 'root',root);if(!parent){later.push([k,n]);continue;}const e=create(n,k);if(e)parent.append(e);}
      if(later.length===remaining.length)break;remaining=later;
    }
    const styleRules=[], mobileRules=[], en=new URLSearchParams(location.search).get('lang')==='en';
    Object.entries(nodes).forEach(([k,n])=>{
      const e=find(k,root);if(!e)return;
      const selector='[data-ve-page="'+CSS.escape(page)+'"] '+(k==='root'?'': '[data-ve-key="'+CSS.escape(k)+'"]');
      const sel=k==='root'?'[data-ve-page="'+CSS.escape(page)+'"]':selector;
      const text=en && typeof n.textEn==='string' ? n.textEn : n.text;
      if(typeof text==='string' && textable(e)){
        remember(e).html=e.innerHTML;attr(e,'translate','no');e.textContent=text;
      }
      if(typeof n.src==='string' && /^(IMG|VIDEO)$/.test(e.tagName)){
        const url=safeURL(n.src,true);attr(e,'src',url || null);attr(e,'srcset',null);attr(e,'sizes',null);
        // A native <source> must not override the editor's selected video.
        if(e.tagName==='VIDEO')e.querySelectorAll('source').forEach(s=>attr(s,'src',null));
      }
      if(n.alt!==undefined && e.tagName==='IMG')attr(e,'alt',n.alt);
      if(n.poster!==undefined && e.tagName==='VIDEO')attr(e,'poster',safeURL(n.poster,true));
      if(e.tagName==='VIDEO' && n.loop!==undefined)attr(e,'loop',n.loop?'':null);
      if(typeof n.href==='string' && e.tagName==='A'){attr(e,'href',safeURL(n.href));attr(e,'target',n.newTab?'_blank':null);attr(e,'rel',n.newTab?'noopener noreferrer':null);}
      if(n.type==='link' && n.text===undefined)e.textContent='Bağlantı →';
      const desktop=declarations(n.style),mobile=declarations(n.mobile);
      if(desktop)styleRules.push(sel+'{'+desktop+'}');
      if(mobile)mobileRules.push(sel+'{'+mobile+'}');
      if(n.hidden){styleRules.push(sel+'{display:none!important}');mobileRules.push(sel+'{display:none!important}');}
    });
    Object.entries(pd.orders || {}).forEach(([key,order])=>{
      const p=find(key,root);if(!p || !Array.isArray(order))return;
      originalOrders.set(p,[...p.children].filter(e=>!e.hasAttribute('data-ve-custom')));
      // Only sibling moves are accepted. Other DOM such as canvases keeps its place.
      const listed=order.map(k=>find(k,root)).filter(e=>e && e.parentElement===p);
      const all=[...p.children], slots=all.filter(e=>listed.includes(e));
      slots.forEach((e,i)=>{const marker=doc.createComment('ve-order');p.replaceChild(marker,e);slots[i]=marker;});
      slots.forEach((marker,i)=>marker.replaceWith(listed[i]));
    });
    css.textContent=styleRules.join('\n')+'\n@media(max-width:760px){'+mobileRules.join('\n')+'}';
    doc.dispatchEvent(new CustomEvent('bca-visual-render',{detail:{page}}));
  }
  const schedule = () => {cancelAnimationFrame(pending);pending=requestAnimationFrame(apply);};
  const names={root:'Sayfa',section:'Bölüm',columns:'Sütunlar',column:'Sütun',text:'Metin',image:'Görsel',video:'Video',link:'Bağlantı'};
  function describe(e) {
    if(!e)return null;
    const key=e.dataset.veKey, n=data.pages?.[pageKey()]?.nodes?.[key] || {};
    const kind=n.type || (e.tagName==='IMG'?'image':e.tagName==='VIDEO'?'video':e.tagName==='A'?'link':textable(e)?'text':key==='root'?'root':'section');
    const text=(e.textContent||'').replace(/\s+/g,' ').trim();
    const label=n.name || e.getAttribute('aria-label') || (kind==='image'?e.alt:'') || (textable(e)?text:e.querySelector('h1,h2,h3,.px-label,.eyebrow')?.textContent?.trim()) || names[kind];
    return {key,kind,label:String(label||names[kind]).slice(0,68),custom:!!n.type,hidden:!!n.hidden,tag:e.tagName,text:textable(e)?e.textContent:undefined,src:e.getAttribute('src')||'',href:e.getAttribute('href')||'',alt:e.getAttribute('alt')||'',parent:e.parentElement?.closest('[data-ve-key]')?.dataset.veKey||null};
  }
  const originalRefresh=window.BCA_SITE?.refresh;
  if(originalRefresh)window.BCA_SITE.refresh=function(content){reset();data=clone(content.visual||{version:1,pages:{}});originalRefresh(content);schedule();};
  window.BCA_VISUAL={
    get data(){return data;},get page(){return pageKey();},get root(){return rootFor(pageKey());},find,describe,textable,safeURL,
    setData(v){data=v || {version:1,pages:{}};apply();},render:schedule,beforeRender:reset,
    nodes(){const r=rootFor(pageKey());return r?[describe(r),...[...r.querySelectorAll('[data-ve-key]')].map(describe)]:[];}
  };
  addEventListener('hashchange',schedule);
  doc.addEventListener('bca-architecture-change',schedule);
  doc.addEventListener('click',e=>{const a=e.target.closest('a[href^="#page-"]');if(a && !e.defaultPrevented && !e.ctrlKey && !e.metaKey){e.preventDefault();e.stopPropagation();location.hash=a.getAttribute('href');}},true);
  // A separate draft tab resolves local assets from the same origin's private draft store.
  if(new URLSearchParams(location.search).has('draft') && window.BCA_ASSETS){
    BCA_ASSETS.all().then(files=>{
      if(!Object.keys(files).length)return;
      const content=JSON.parse(JSON.stringify(window.BCA_CONTENT).replace(/"((?:img|video)\/uploads\/[^"\n]+)"/g,(m,p)=>files[p]?JSON.stringify(files[p].dataUrl):m));
      window.BCA_SITE.refresh(content);
    }).catch(()=>{});
  }
  apply();
})();
