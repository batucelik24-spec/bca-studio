/* Transparent diagram playback. RGB and its offline matte travel in one
 * H.264 stream; WebGL reconstructs actual canvas alpha on every frame.
 * This avoids relying on browser-specific alpha-video codec support. */
(() => {
  'use strict';
  class AlphaMotion extends HTMLElement {
    connectedCallback() {
      if(this.shadowRoot) return;
      this.attachShadow({mode:'open'});
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.userPaused = this.reduced.matches;
      this.visible = false; this.dead = false;
      const label = this.getAttribute('label') || 'Diyagram';
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;position:relative;width:100%;height:100%;min-height:0;isolation:isolate}
        img,canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
        canvas{visibility:hidden} :host([data-ready]) canvas{visibility:visible}
        :host([data-ready]) img{visibility:hidden}
        .controls{position:absolute;inset:auto 10px 10px;display:flex;justify-content:space-between;gap:8px}
        button{border:0;border-radius:3px;padding:7px 10px;font:500 11px/1.25 Arial,sans-serif;font-family:inherit;
          background:rgba(255,255,255,.9);color:#262b30;cursor:pointer;box-shadow:0 1px 8px #0000000d}
        button:focus-visible{outline:2px solid #2461e9;outline-offset:3px}
        video{display:none} :host([embedded]) .expand{display:none}
      </style><img alt=""><canvas aria-hidden="true"></canvas><div class="controls"><button type="button" class="play">Oynat</button><button type="button" class="expand">Büyüt ↗</button></div>`;
      this.poster=this.shadowRoot.querySelector('img');this.poster.src=this.getAttribute('poster');this.poster.alt=label;this.poster.loading='lazy';
      this.canvas=this.shadowRoot.querySelector('canvas');this.playButton=this.shadowRoot.querySelector('.play');
      const expand=this.shadowRoot.querySelector('.expand');expand.hidden=this.hasAttribute('expanded')||this.hasAttribute('embedded');expand.setAttribute('aria-label','Büyüt: '+label);
      expand.addEventListener('click',e=>{e.stopPropagation();if(!this.hasAttribute('embedded'))this.dispatchEvent(new CustomEvent('motion-open',{bubbles:true}));});
      this.playButton.setAttribute('aria-label','Animasyonu oynat: '+label);this.playButton.setAttribute('aria-pressed','false');
      this.playButton.addEventListener('click',e=>{e.stopPropagation();this.userPaused=!this.userPaused && !!this.video && !this.video.paused;if(this.userPaused)this.pause();else this.start();});
      this.onVisibility=()=>{if(document.hidden)this.pause();else if(this.visible&&!this.userPaused)this.start();};
      this.onReduced=()=>{if(this.reduced.matches){this.userPaused=true;this.pause();}};
      this.onOverlay=e=>{if(this.hasAttribute('expanded'))return;this.overlayBlocked=!!e.detail;if(this.overlayBlocked)this.pause();else if(this.visible&&!this.userPaused)this.start();};
      document.addEventListener('visibilitychange',this.onVisibility);this.reduced.addEventListener('change',this.onReduced);
      document.addEventListener('bca-motion-overlay',this.onOverlay);
      this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible&&!this.userPaused&&!document.hidden)this.start();else this.pause();},{threshold:.12});
      this.observer.observe(this);
    }
    setup() {
      const gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false});
      if(!gl) {this.setAttribute('data-fallback','poster');this.playButton.hidden=true;return false;}
      this.gl=gl;
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Diagram shader');return s;};
      const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){gl_Position=vec4(p,0.,1.);uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);}');
      const fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D frame; varying vec2 uv; void main(){vec3 rgb=texture2D(frame,vec2(uv.x,uv.y*.5)).rgb;float a=texture2D(frame,vec2(uv.x,.5+uv.y*.5)).r;a=clamp((a-.015)/.985,0.,1.);gl_FragColor=vec4(rgb,a);}');
      this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('Diagram program');
      gl.useProgram(this.program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      this.video=document.createElement('video');this.video.muted=true;this.video.defaultMuted=true;this.video.loop=true;this.video.playsInline=true;this.video.preload='metadata';this.video.setAttribute('playsinline','');this.video.setAttribute('muted','');this.video.src=this.getAttribute('src');
      this.shadowRoot.append(this.video);
      this.video.addEventListener('loadeddata',()=>this.draw());
      this.video.addEventListener('error',()=>{this.pause();this.removeAttribute('data-ready');this.setAttribute('data-fallback','poster');});
      return true;
    }
    async start() {
      if(this.dead||document.hidden||this.overlayBlocked) return;
      try {
        if(!this.video && !this.setup()) return;
        await this.video.play();
        if(this.dead||this.userPaused||!this.visible||document.hidden||this.overlayBlocked){this.pause();return;}
        this.setAttribute('data-playing','true');this.playButton.textContent='Duraklat';this.playButton.setAttribute('aria-label','Animasyonu duraklat: '+this.getAttribute('label'));this.playButton.setAttribute('aria-pressed','true');
        if(this.frameHandle==null)this.tick();
      } catch {this.pause();}
    }
    draw() {
      if(this.dead||!this.gl||!this.video||this.video.readyState<2)return;
      const gl=this.gl,w=this.video.videoWidth,h=this.video.videoHeight/2;
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;gl.viewport(0,0,w,h);}
      gl.useProgram(this.program);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.video);gl.drawArrays(gl.TRIANGLES,0,6);
      this.setAttribute('data-ready','');
    }
    tick() {
      this.frameHandle=null;
      if(this.dead||!this.video||this.video.paused)return;
      this.draw();
      const callback=()=>this.tick();
      this.frameHandle=this.video.requestVideoFrameCallback?this.video.requestVideoFrameCallback(callback):requestAnimationFrame(callback);
    }
    pause() {
      if(this.video){this.video.pause();if(this.frameHandle!=null){if(this.video.cancelVideoFrameCallback)this.video.cancelVideoFrameCallback(this.frameHandle);else cancelAnimationFrame(this.frameHandle);}}
      this.frameHandle=null;this.setAttribute('data-playing','false');
      if(this.playButton){this.playButton.textContent='Oynat';this.playButton.setAttribute('aria-label','Animasyonu oynat: '+this.getAttribute('label'));this.playButton.setAttribute('aria-pressed','false');}
    }
    disconnectedCallback() {
      this.dead=true;this.pause();this.observer?.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.reduced?.removeEventListener('change',this.onReduced);
      document.removeEventListener('bca-motion-overlay',this.onOverlay);
      if(this.video){this.video.removeAttribute('src');this.video.load();}
      if(this.gl){this.gl.deleteTexture(this.texture);this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext();}
    }
  }
  customElements.define('alpha-motion',AlphaMotion);
})();
