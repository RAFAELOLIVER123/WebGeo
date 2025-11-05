(function(){
  function addExporting(on){
    try{ document.body.classList[on?'add':'remove']('exporting'); }catch(_){}
  }
  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  async function saveImage(){
    addExporting(true);
    await new Promise(r=>setTimeout(r,100));
    try{
      if(window.L && L.simpleMapScreenshoter && window.E && E.map){
        if(!window.__SS__) window.__SS__=L.simpleMapScreenshoter({ hideElementsWithSelectors:['#exportBar','#controls','#shapeToolbar','#hudStack','#pixCard','#toggleButton','.leaflet-control-container'] });
        if(!window.__SS__.map) window.__SS__.addTo(E.map);
        const blob = await window.__SS__.takeScreen('blob', { mimeType:'image/png', quality:1, scale:3 });
        downloadBlob(blob, 'agromap_'+Date.now()+'.png');
      }else if(window.domtoimage){
        const node = document.getElementById('map');
        const w=node.offsetWidth, h=node.offsetHeight, s=3;
        const blob = await window.domtoimage.toBlob(node, {width:w*s, height:h*s, style:{transform:'scale('+s+')', transformOrigin:'top left', width:w+'px', height:h+'px'}});
        downloadBlob(blob, 'agromap_'+Date.now()+'.png');
      }else{
        alert('Exportador indisponível no navegador.');
      }
    }catch(e){
      console.error(e);
      alert('Falha ao exportar imagem. Possível bloqueio de CORS/tainted canvas (tiles externos). Tente imprimir como PDF.');
    }finally{
      addExporting(false);
    }
  }
  function doPrint(){
    addExporting(true);
    setTimeout(()=>{ try{ window.print(); } finally { setTimeout(()=>addExporting(false), 250); } }, 80);
  }
  function wire(){
    const b1=document.getElementById('btnSavePngHiRes');
    const b2=document.getElementById('btnPrintPage');
    if(!b1 || !b2){ console.warn('ExportBar não carregou.'); return; }
    b1.addEventListener('click', saveImage);
    b2.addEventListener('click', doPrint);
    window.__AGRO_SAVE__ = saveImage;
    window.__AGRO_PRINT__ = doPrint;
  }
  if(document.readyState==='complete' || document.readyState==='interactive'){ setTimeout(wire,0); }
  else{ document.addEventListener('DOMContentLoaded', wire); }
})();


;


(function(){
  // Ensure we have registry from previous patch
  const REG = (window.AGRO_LAYERS && window.AGRO_LAYERS._REG) ? window.AGRO_LAYERS._REG : new Map();
  const API = window.AGRO_LAYERS || (window.AGRO_LAYERS = { registerLayer(){}, removeById(){}, removeAll(){}, _REG: REG });
  const mapRef = ()=> window.__leafletMap;

  // Maintain layer ORDER (top of list = on top visually)
  let ORDER = [];

  function ensureOrderEntry(id){
    if(!ORDER.includes(id)) ORDER.unshift(id); // newest on top
  }

  // Hook into registerLayer to track order
  const _origRegister = API.registerLayer || function(layer, type, name){ return null; };
  API.registerLayer = function(layer, type, name){
    const id = _origRegister(layer, type, name);
    ensureOrderEntry(id);
    syncLayerUI();
    return id;
  };

  // UI Elements
  const $list = document.getElementById('agro-layer-list');
  const $toggle = document.getElementById('agro-layer-toggle');
  const $container = document.getElementById('agro-layer-container');

  $toggle.addEventListener('click', ()=>{
    const vis = $list.style.display !== 'none';
    $list.style.display = vis ? 'none' : 'grid';
    document.getElementById('agro-layer-hint').style.display = vis ? 'none' : 'block';
    $toggle.textContent = vis ? 'Mostrar' : 'Ocultar';
  });

  function rebuildZOrder(){
    // Re-add layers in ORDER sequence so the last added sits on top
    const map = mapRef();
    if(!map) return;
    const items = ORDER.map(id => [id, REG.get(id)]).filter(([,e])=> e && e.layer);
    // Remove all first (keeping REG), then add back in ascending order
    items.forEach(([,e])=> { try{ map.removeLayer(e.layer);}catch(_){}});
    items.forEach(([,e])=> { try{ e.layer.addTo(map); }catch(_){}});
  }

  function rowTemplate(id, entry, index){
    const name = entry?.name || ('Layer '+id);
    const visible = entry?.visible !== false;
    return `<div class="layer-row" data-id="${id}">
      <div class="name" title="${name}">${name}</div>
      <div class="controls">
        <button class="layer-btn eye" data-eye title="${visible?'Ocultar':'Mostrar'}">${visible?'👁':'🚫'}</button>
        <button class="layer-btn" data-up title="Subir">↑</button>
        <button class="layer-btn" data-down title="Descer">↓</button>
        <button class="layer-btn" data-del title="Excluir">✖</button></div>
    </div>`;
  }

  function syncLayerUI(){
    if(!$list) return;
    // purge missing ids from ORDER
    ORDER = ORDER.filter(id => REG.has(id));
    // render list
    $list.innerHTML = ORDER.map((id,i)=> rowTemplate(id, REG.get(id), i)).join('');
    // attach events
    $list.querySelectorAll('.layer-row').forEach(row => {
      const id = row.getAttribute('data-id');
      const entry = REG.get(id);
      if(!entry) return;

      row.querySelector('[data-eye]').addEventListener('click', ()=>{
        const map = mapRef();
        if(!map) return;
        entry.visible = !entry.visible;
        try {
          if(entry.visible){ entry.layer.addTo(map); }
          else { map.removeLayer(entry.layer); }
        } catch(_){}
        syncLayerUI();
      });
      row.querySelector('[data-up]').addEventListener('click', ()=>{
        const idx = ORDER.indexOf(id);
        if(idx>0){ const tmp=ORDER[idx-1]; ORDER[idx-1]=ORDER[idx]; ORDER[idx]=tmp; rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI(); }
      });
      row.querySelector('[data-down]').addEventListener('click', ()=>{
        const idx = ORDER.indexOf(id);
        if(idx>=0 && idx<ORDER.length-1){ const tmp=ORDER[idx+1]; ORDER[idx+1]=ORDER[idx]; ORDER[idx]=tmp; rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI(); }
      });
      row.querySelector('[data-del]').addEventListener('click', ()=>{
        const map = mapRef();
        try { window.AGRO_LAYERS.removeById(id, map); } catch(_){}
        ORDER = ORDER.filter(x=>x!==id);
        syncLayerUI();
      });
    });
  }

  // Expose a helper to register external layers with names
  window.AGRO_LAYERS_UI = {
    registerNamed(layer, type, name){
      const id = API.registerLayer(layer, type, name);
      ensureOrderEntry(id);
      syncLayerUI();
      return id;
    },
    sync: syncLayerUI
  };

  // Initial sync when map is discovered
  setTimeout(syncLayerUI, 800);

  // -------- 7MB limit for SHP/ZIP only (KML/KMZ ilimitado) --------
  // Intercept "file" input changes and block SHP/ZIP > 7MB
  document.addEventListener('change', function(ev){
    const el = ev.target;
    if(!el || el.tagName!=='INPUT' || el.type!=='file') return;
    const f = el.files && el.files[0];
    if(!f) return;
    const name = (f.name||'').toLowerCase();
    const isShp = name.endsWith('.shp');
    const isZip = name.endsWith('.zip');
    if((isShp || isZip) && f.size > 7*1024*1024){
      ev.stopImmediatePropagation();
      ev.preventDefault();
      if(window.__agroProgress){ window.__agroProgress.hide(); }
      if(window.__agroStatus && window.__agroStatus.show){
        window.__agroStatus.show('Shapefile acima do limite de 7MB. Use KML/KMZ/GeoJSON ou reduza/simplifique o SHP.', 5000);
      } else {
        alert('Shapefile acima do limite de 7MB. Use KML/KMZ/GeoJSON ou reduza/simplifique o SHP.');
      }
      try { el.value=''; }catch(_){}
    } else {
      // show a progress hint for any import
      if(window.__agroProgress){ window.__agroProgress.show('Importando…'); setTimeout(()=>{ if(window.__agroProgress) window.__agroProgress.tick(60); }, 200); }
    }
  }, true);

  // When layers finish loading (heuristics): listen to Leaflet layeradd
  document.addEventListener('DOMContentLoaded', function(){
    try {
      const m = mapRef();
      if(!m) return;
      m.on('layeradd', function(){
        if(window.__agroProgress){ setTimeout(()=> window.__agroProgress.hide(), 500); }
        if(window.AGRO_LAYERS_UI) window.AGRO_LAYERS_UI.sync();
      });
    } catch(_){}
  });
})();


;


(function(){
  // Modal
  const M=document.createElement('div'); M.innerHTML="<div id=\"cropperModal\" role=\"dialog\" aria-modal=\"true\">  <div id=\"cropperCard\">    <div id=\"cropperHeader\">      <strong>Recortar Carta</strong>      <button id=\"cropperClose\" class=\"kbtn\">Fechar</button>    </div>    <div id=\"cropperBody\">      <div id=\"cropPreview\">        <canvas id=\"pdfCropCanvas\"></canvas>        <canvas id=\"selOverlay\"></canvas>        <div class=\"kdim\" id=\"kdim\">—</div>      </div>      <div style=\"display:grid;gap:10px\">        <button id=\"cropApplyMask\" class=\"kbtn primary\">Aplicar Corte ✂️</button>        <button id=\"cropSendMap\" class=\"kbtn\">Enviar ao mapa 🗺️</button>        <button id=\"btnShapeRect\" class=\"kbtn\">Retângulo</button>        <button id=\"cropReset\" class=\"kbtn\">Limpar Seleção 🧹</button>      </div>    </div>  </div></div>"; document.body.appendChild(M.firstElementChild);
  const pdfC=document.getElementById('pdfCropCanvas'); const ov=document.getElementById('selOverlay');
  const ctx=pdfC.getContext('2d'); const octx=ov.getContext('2d');
  const modal=document.getElementById('cropperModal'); const closeBtn=document.getElementById('cropperClose');
  const dimEl=document.getElementById('kdim'); const bMask=document.getElementById('cropApplyMask');
  const bReset=document.getElementById('cropReset'); const bSend=document.getElementById('cropSendMap'); const bShapeRect=document.getElementById('btnShapeRect'); const bShapeEllipse=document.getElementById('btnShapeEllipse'); const bShapePoly=document.getElementById('btnShapePoly');

  
  // modos de seleção
  S.shapeMode = S.shapeMode || 'rect';
  if(bShapeRect){ bShapeRect.onclick = ()=>{ S.shapeMode='rect'; }; }
  if(bShapeEllipse){ bShapeEllipse.onclick = ()=>{ S.shapeMode='ellipse'; }; }
  if(bShapePoly){ bShapePoly.onclick = ()=>{ S.shapeMode='poly'; S.poly=[]; }; }
const S={ srcURL:null, name:'PDF', cropRect:null, urlMask:null, imgW:0, imgH:0, scaleX:1, scaleY:1 };
  let __target=null; // overlay attach

  function openModal(){ modal.classList.add('open'); } function closeModal(){ modal.classList.remove('open'); }
  closeBtn.addEventListener('click', closeModal);

  function clearOverlay(){ octx.clearRect(0,0,ov.width,ov.height); S.cropRect=null; dimEl.textContent='—'; }
  function drawSelRect(r){ const {x,y,w,h}=r; octx.clearRect(0,0,ov.width,ov.height); octx.fillStyle='rgba(0,0,0,.45)'; octx.fillRect(0,0,ov.width,ov.height); octx.save(); octx.globalCompositeOperation='destination-out'; octx.fillStyle='#000'; octx.fillRect(x,y,w,h); octx.restore(); octx.strokeStyle='#7dc4ff'; octx.setLineDash([6,4]); octx.lineWidth=2; octx.strokeRect(x,y,w,h); dimEl.textContent=w+'×'+h+'px'; }

  (function(){ let down=false, start={x:0,y:0}; function toCanvas(evt){ const r=ov.getBoundingClientRect(); const sx=ov.width/r.width, sy=ov.height/r.height; return { x:Math.max(0,Math.min(ov.width,(evt.clientX-r.left)*sx)), y:Math.max(0,Math.min(ov.height,(evt.clientY-r.top)*sy)) }; }
    ov.addEventListener('mousedown',e=>{down=true; start=toCanvas(e);});
    ov.addEventListener('mousemove',e=>{ if(!down) return; const c=toCanvas(e); const rect={x:Math.min(start.x,c.x),y:Math.min(start.y,c.y),w:Math.abs(c.x-start.x),h:Math.abs(c.y-start.y)}; S.cropRect=rect; drawSelRect(rect); });
    window.addEventListener('mouseup',()=>down=false); ov.addEventListener('dblclick', clearOverlay);
  })();

  
  // --- Modos de forma para seleção ---
  // Substitui os botões "Baixar PNG" e "Limpar Seleção" por Retângulo/Elipse/Polígono.
  (function(){
    const btnRect = document.getElementById('btnShapeRect');
    const btnEllipse = document.getElementById('btnShapeEllipse');
    // cria botão polígono ao lado, se não existir
    let btnPoly = document.getElementById('btnShapePoly');
    if(!btnPoly){
      btnPoly = document.createElement('button');
      btnPoly.id = 'btnShapePoly';
      btnPoly.className = 'kbtn';
      btnPoly.textContent = 'Polígono';
      const side = (btnEllipse || btnRect)?.parentElement || document;
      if(side && btnEllipse){ side.insertBefore(btnPoly, btnEllipse.nextSibling); }
    }
    // estado
    S.shapeMode = S.shapeMode || 'rect'; // 'rect' | 'ellipse' | 'poly'
    S.poly = [];
    function setActive(b){
      [btnRect, btnEllipse, btnPoly].forEach(x=>{ if(!x) return; x.style.opacity = (x===b? '1':'0.72'); });
    }
    btnRect && (btnRect.onclick = ()=>{ S.shapeMode='rect'; S.poly=[]; setActive(btnRect); ov.clearRect(0,0,overlay.width,overlay.height); });
    btnEllipse && (btnEllipse.onclick = ()=>{ S.shapeMode='ellipse'; S.poly=[]; setActive(btnEllipse); ov.clearRect(0,0,overlay.width,overlay.height); });
    btnPoly && (btnPoly.onclick = ()=>{ S.shapeMode='poly'; S.poly=[]; setActive(btnPoly); ov.clearRect(0,0,overlay.width,overlay.height); });
    setActive(S.shapeMode==='rect'?btnRect:S.shapeMode==='ellipse'?btnEllipse:btnPoly);

    // sobrescreve handlers do overlay para dar suporte às formas
    (function(){
      let down=false,start={x:0,y:0};
      function p(e){
        const r=overlay.getBoundingClientRect();
        const x=Math.max(0, Math.min(overlay.width, (e.clientX-r.left) * overlay.width/r.width));
        const y=Math.max(0, Math.min(overlay.height,(e.clientY-r.top)  * overlay.height/r.height));
        return {x,y};
      }
      function drawRect(r){
        ov.clearRect(0,0,overlay.width,overlay.height);
        ov.fillStyle = 'rgba(0,0,0,.45)';
        ov.fillRect(0,0,overlay.width,overlay.height);
        ov.save(); ov.globalCompositeOperation='destination-out';
        if(S.shapeMode==='ellipse'){
          ov.beginPath();
          ov.ellipse(r.x + r.w/2, r.y + r.h/2, Math.abs(r.w/2), Math.abs(r.h/2), 0, 0, Math.PI*2);
          ov.fill();
          ov.restore();
          ov.strokeStyle='#7dc4ff'; ov.setLineDash([6,4]); ov.lineWidth=2;
          ov.beginPath();
          ov.ellipse(r.x + r.w/2, r.y + r.h/2, Math.abs(r.w/2), Math.abs(r.h/2), 0, 0, Math.PI*2);
          ov.stroke();
        } else {
          ov.fillStyle='#000'; ov.fillRect(r.x,r.y,r.w,r.h); ov.restore();
          ov.strokeStyle='#7dc4ff'; ov.setLineDash([6,4]); ov.lineWidth=2; ov.strokeRect(r.x,r.y,r.w,r.h);
        }
        dim.textContent = Math.round(r.w)+'×'+Math.round(r.h)+'px';
      }
      function drawPoly(points){
        ov.clearRect(0,0,overlay.width,overlay.height);
        ov.fillStyle = 'rgba(0,0,0,.45)';
        ov.fillRect(0,0,overlay.width,overlay.height);
        if(points.length<2) return;
        ov.save(); ov.globalCompositeOperation='destination-out';
        ov.beginPath();
        ov.moveTo(points[0].x, points[0].y);
        for(let i=1;i<points.length;i++) ov.lineTo(points[i].x, points[i].y);
        ov.closePath(); ov.fill(); ov.restore();
        ov.strokeStyle='#7dc4ff'; ov.setLineDash([6,4]); ov.lineWidth=2;
        ov.beginPath();
        ov.moveTo(points[0].x, points[0].y);
        for(let i=1;i<points.length;i++) ov.lineTo(points[i].x, points[i].y);
        ov.closePath(); ov.stroke();
        dim.textContent = points.length+' pts';
      }
      overlay.onmousedown = (e)=>{
        const pt = p(e);
        if(S.shapeMode==='poly'){
          S.poly.push(pt); drawPoly(S.poly); return;
        } else {
          down=true; start=pt; S.cropRect=null;
        }
      };
      overlay.onmouseup = ()=>{ down=false; };
      overlay.onmousemove = (e)=>{
        if(S.shapeMode==='poly'){ return; }
        if(!down) return;
        const c = p(e);
        const rect = { x:Math.min(start.x,c.x), y:Math.min(start.y,c.y), w:Math.abs(c.x-start.x), h:Math.abs(c.y-start.y) };
        S.cropRect = rect; drawRect(rect);
      };
      overlay.ondblclick = ()=>{ S.poly=[]; S.cropRect=null; ov.clearRect(0,0,overlay.width,overlay.height); dim.textContent='—'; };
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ S.poly=[]; S.cropRect=null; ov.clearRect(0,0,overlay.width,overlay.height); dim.textContent='—'; }});
      // expõe util
      window.__drawHelpers = { drawRect, drawPoly };
    })();
  })();
function ensureSelection(){ if(S.shapeMode==='poly'){ if(!S.poly||S.poly.length<3){ alert('Desenhe um polígono com pelo menos 3 pontos.'); return false; } return true; } if(!S.cropRect||S.cropRect.w<4||S.cropRect.h<4){ alert('Selecione uma região válida.'); return false; } return true; }

  // Modo máscara: mantém tamanho e posição exatos; áreas fora ficam transparentes
  function applyMaskNow(){ if(!ensureSelection()) return; 
    const img=new Image(); img.onload=()=>{ 
      const sx=S.scaleX, sy=S.scaleY; 
      const out=document.createElement('canvas'); out.width=S.imgW; out.height=S.imgH;
      const c=out.getContext('2d'); c.imageSmoothingEnabled=true; c.clearRect(0,0,out.width,out.height);
      // 1) Desenha a imagem inteira
      c.drawImage(img, 0, 0);
      // 2) Máscara conforme forma
      c.globalCompositeOperation='destination-in';
      c.fillStyle='rgba(0,0,0,1)';
      if(S.shapeMode==='poly' && S.poly && S.poly.length>=3){
        c.beginPath();
        c.moveTo(Math.round(S.poly[0].x*sx), Math.round(S.poly[0].y*sy));
        for(let i=1;i<S.poly.length;i++) c.lineTo(Math.round(S.poly[i].x*sx), Math.round(S.poly[i].y*sy));
        c.closePath(); c.fill();
      } else if(S.shapeMode==='ellipse' && S.cropRect){
        const rx=Math.round(S.cropRect.x*sx), ry=Math.round(S.cropRect.y*sy);
        const rw=Math.round(S.cropRect.w*sx), rh=Math.round(S.cropRect.h*sy);
        c.save(); c.beginPath();
        c.ellipse(rx+rw/2, ry+rh/2, Math.abs(rw/2), Math.abs(rh/2), 0, 0, Math.PI*2); c.clip();
        c.clearRect(0,0,0,0); // noop to enforce clip
        c.restore();
        // draw a filled ellipse into destination-in mask
        c.beginPath(); c.ellipse(rx+rw/2, ry+rh/2, Math.abs(rw/2), Math.abs(rh/2), 0, 0, Math.PI*2); c.fill();
      } else if(S.cropRect){
        const rx=Math.round(S.cropRect.x*sx), ry=Math.round(S.cropRect.y*sy);
        const rw=Math.round(S.cropRect.w*sx), rh=Math.round(S.cropRect.h*sy);
        c.fillRect(rx, ry, rw, rh);
      }
      S.urlMask=out.toDataURL('image/png');
      alert('Recorte aplicado (máscara).');
    }; img.src=S.srcURL; 
   }
  bMask.addEventListener('click', ()=>{ applyMaskNow(); });
  
  bSend.addEventListener('click', ()=>{ 
    // Garante que teremos uma imagem para enviar: aplica máscara se houver seleção; senão usa a original
    if(!S.urlMask){
      if(S.cropRect){ 
        applyMaskNow(); // cria S.urlMask a partir do recorte atual
      } else {
        S.urlMask = S.srcURL || null;
      }
    }
    const dataURL = S.urlMask;
    if(!dataURL){ alert('Carregue um PDF antes.'); return; }
    // Resolve target: overlay anexado ou o overlay ativo do app
    let target = __target;
    if(!target && window.E && E.pdfLayers && E.activePdf && E.pdfLayers[E.activePdf]){ 
      const ov = E.pdfLayers[E.activePdf];
      target = { 
        set:function(url){ try{ ov.setUrl(url); }catch(e){} }, 
        getBounds:function(){ try{ return ov.getBounds(); }catch(e){ return null; } } 
      };
    }
    if(!target){ alert('Destino do mapa não anexado.'); return; }
    target.set(dataURL); // mantém bounds exatamente
  });
bShapeRect.addEventListener('click', ()=>{ if(!S.urlMask){ alert('Nada para baixar.'); return; } const a=document.createElement('a'); a.href=S.urlMask; a.download='recorte.png'; a.click(); });

  // API pública
  window.__PDF_CROP_TOOL={ 
    open: function(dataURL, layerName){ 
      const img=new Image(); img.onload=()=>{ 
        S.srcURL=dataURL; S.name=layerName||'PDF'; S.imgW=img.naturalWidth; S.imgH=img.naturalHeight; 
        const scale=Math.min(940/img.width, 720/img.height, 1.0); 
        pdfC.width=Math.round(img.width*scale); pdfC.height=Math.round(img.height*scale); 
        ov.width=pdfC.width; ov.height=pdfC.height; 
        S.scaleX = img.width / pdfC.width; S.scaleY = img.height / pdfC.height;
        ctx.clearRect(0,0,pdfC.width,pdfC.height); ctx.drawImage(img,0,0,pdfC.width,pdfC.height); 
        clearOverlay(); openModal();
      }; img.src=dataURL; 
    },
    attachTarget: function(target){ __target=target; }
  };
})();


;


document.addEventListener('DOMContentLoaded', function() {
  if(!document.getElementById('cropperModal')) {
    const wrap = document.createElement('div'); wrap.innerHTML = '<div id="cropperModal" role="dialog" aria-modal="true">\n  <div id="cropperCard">\n    <div id="cropperHeader">\n      <strong>Recortar Carta</strong>\n      <button id="cropperClose" class="kbtn" style="width:auto">Fechar</button>\n    </div>\n    <div id="cropperBody" style="display:grid;grid-template-columns:1fr 320px;gap:14px;padding:14px">\n      <div id="cropPreview" style="position:relative;background:#0b1220;border:1px dashed rgba(148,163,184,.35);border-radius:10px;overflow:hidden;height:70vh;min-height:360px">\n        <canvas id="pdfCropCanvas"></canvas>\n        <canvas id="selOverlay" style="position:absolute;inset:0;pointer-events:auto"></canvas>\n        <div class="kdim" id="kdim" style="position:absolute;right:8px;bottom:8px;background:rgba(2,6,23,.6);padding:4px 8px;border-radius:8px;border:1px solid rgba(148,163,184,.25);font-size:12px">—</div>\n      </div>\n      <div style="display:grid;gap:10px">\n        <button id="cropApplyMask" class="kbtn primary">Aplicar Corte ✂️</button>\n        <button id="cropSendMap" class="kbtn">Enviar ao mapa 🗺️</button>\n        <button id="btnShapeRect" class="kbtn">Retângulo</button>\n        <button id="btnShapeEllipse" class="kbtn">Limpar Seleção 🧹</button> <button id="cropReset" class="kbtn">Restaurar</button>\n      </div>\n    </div>\n  </div>\n</div>'; document.body.appendChild(wrap.firstElementChild);
  }
  const modal=document.getElementById('cropperModal');
  const pdfC=document.getElementById('pdfCropCanvas'); const ov=document.getElementById('selOverlay');
  const ctx=pdfC.getContext('2d'); const octx=ov.getContext('2d');
  const closeBtn=document.getElementById('cropperClose'); const dimEl=document.getElementById('kdim');
  const bMask=document.getElementById('cropApplyMask'); const bSend=document.getElementById('cropSendMap');
  const bShapeRect=document.getElementById('btnShapeRect'); const bShapeEllipse=document.getElementById('btnShapeEllipse'); const bShapePoly=document.getElementById('btnShapePoly'); const bReset=document.getElementById('cropReset');
  function openModal(){ modal.classList.add('open'); } function closeModal(){ modal.classList.remove('open'); }
  closeBtn.addEventListener('click', closeModal);
  const S={ srcURL:null, originalURL:null, name:'PDF', cropRect:null, urlMask:null, imgW:0, imgH:0, scaleX:1, scaleY:1 };
  let __target=null;
  function clearOverlay(){ octx.clearRect(0,0,ov.width,ov.height); S.cropRect=null; dimEl.textContent='—'; }
  function drawSelRect(r){ const x=r.x,y=r.y,w=r.w,h=r.h; octx.clearRect(0,0,ov.width,ov.height); octx.fillStyle='rgba(0,0,0,.30)'; octx.fillRect(0,0,ov.width,ov.height); octx.save(); octx.globalCompositeOperation='destination-out'; octx.fillStyle='#000'; octx.fillRect(x,y,w,h); octx.restore(); octx.strokeStyle='#7dc4ff'; octx.setLineDash([3,2]); octx.lineWidth=1; octx.strokeRect(x,y,w,h); dimEl.textContent=w+'×'+h+'px'; }
  function toCanvas(evt){ const r=ov.getBoundingClientRect(); const dpr=window.devicePixelRatio||1; const sx=ov.width/(r.width*dpr), sy=ov.height/(r.height*dpr); return { x:Math.max(0,Math.min(ov.width,(evt.clientX-r.left)*dpr*sx)), y:Math.max(0,Math.min(ov.height,(evt.clientY-r.top)*dpr*sy)) }; }
  (function(){ let down=false, start={x:0,y:0}; ov.addEventListener('mousedown',e=>{down=true; start=toCanvas(e);}); ov.addEventListener('mousemove',e=>{ if(!down) return; const c=toCanvas(e); const rect={x:Math.min(start.x,c.x),y:Math.min(start.y,c.y),w:Math.abs(c.x-start.x),h:Math.abs(c.y-start.y)}; S.cropRect=rect; drawSelRect(rect); }); window.addEventListener('mouseup',()=>down=false); ov.addEventListener('dblclick', clearOverlay); })();
  function ensureSelection(){ if(S.shapeMode==='poly'){ if(!S.poly||S.poly.length<3){ alert('Desenhe um polígono com pelo menos 3 pontos.'); return false; } return true; } if(!S.cropRect||S.cropRect.w<4||S.cropRect.h<4){ alert('Selecione uma região válida.'); return false; } return true; }
async function applyMask(){ 
  return new Promise((resolve)=>{ 
    const img=new Image(); 
    img.onload=()=>{ 
      const rx=S.cropRect.x*S.scaleX, ry=S.cropRect.y*S.scaleY, rw=S.cropRect.w*S.scaleX, rh=S.cropRect.h*S.scaleY; 
      const out=document.createElement('canvas'); out.width=S.imgW; out.height=S.imgH; 
      const c=out.getContext('2d'); 
      c.fillStyle='#000'; c.fillRect(rx,ry,rw,rh); 
      c.globalCompositeOperation='source-in'; 
      c.drawImage(img,0,0); 
      S.urlMask=out.toDataURL('image/png'); 
      resolve(S.urlMask);
    }; 
    img.src=S.srcURL; 
  }); 
}
  bMask.addEventListener('click', ()=>{ if(!ensureSelection()) return; const img=new Image(); img.onload=()=>{ const rx=S.cropRect.x*S.scaleX, ry=S.cropRect.y*S.scaleY, rw=S.cropRect.w*S.scaleX, rh=S.cropRect.h*S.scaleY; const out=document.createElement('canvas'); out.width=S.imgW; out.height=S.imgH; const c=out.getContext('2d'); c.fillStyle='#000'; c.fillRect(rx,ry,rw,rh); c.globalCompositeOperation='source-in'; c.drawImage(img,0,0); S.urlMask=out.toDataURL('image/png'); alert('Recorte aplicado.'); }; img.src=S.srcURL; });
  bSend.addEventListener('click', async ()=>{ try{ if(!S.urlMask){ if(!ensureSelection()) return; await applyMask(); } let target = __target; if(!target && window.E && E.pdfLayers && E.activePdf && E.pdfLayers[E.activePdf]){ const ov = E.pdfLayers[E.activePdf]; target = { set:(u,newB)=>{ try{ ov.setUrl(u); if(newB) ov.setBounds(newB);}catch(e){} }, getBounds:()=>{ try{return ov.getBounds();}catch(e){return null;} } }; } if(!target){ alert('Destino do mapa não anexado.'); return; } target.set(S.urlMask); }catch(e){ console.warn(e); } });
  bShapeRect.addEventListener('click', ()=>{ if(!S.urlMask){ alert('Nada para baixar.'); return; } const a=document.createElement('a'); a.href=S.urlMask; a.download='recorte.png'; a.click(); });
  window.__PDF_CROP_TOOL = { open: function(dataURL, layerName){ const img=new Image(); img.onload=function(){ S.srcURL=dataURL; S.originalURL=dataURL; S.name=layerName||'PDF'; S.imgW=img.naturalWidth; S.imgH=img.naturalHeight; function renderPreview(initial){ const box=document.getElementById('cropPreview').getBoundingClientRect(); const maxW=Math.max(200, box.width-24), maxH=Math.max(200, box.height-24); const scale=Math.min(maxW/img.width, maxH/img.height, 1.0); const prevW=pdfC.width||0, prevH=pdfC.height||0; pdfC.width=Math.round(img.width*scale); pdfC.height=Math.round(img.height*scale); ov.width=pdfC.width; ov.height=pdfC.height; S.scaleX=img.width/pdfC.width; S.scaleY=img.height/pdfC.height; ctx.clearRect(0,0,pdfC.width,pdfC.height); ctx.drawImage(img,0,0,pdfC.width,pdfC.height); if(initial){ if(!S.cropRect){ let w=Math.round(pdfC.width*0.55), h=Math.round(pdfC.height*0.55); let x=Math.round((pdfC.width-w)/2), y=Math.round((pdfC.height-h)/2); S.cropRect={x,y,w,h}; } } else if(S.cropRect && prevW>0 && prevH>0){ const kx=pdfC.width/prevW, ky=pdfC.height/prevH; S.cropRect={ x:Math.round(S.cropRect.x*kx), y:Math.round(S.cropRect.y*ky), w:Math.round(S.cropRect.w*kx), h:Math.round(S.cropRect.h*ky) }; } drawSelRect(S.cropRect); } clearOverlay(); openModal(); renderPreview(true); window.addEventListener('resize', ()=>renderPreview(false)); }; img.src=dataURL; }, attachTarget:function(target){ __target=target; } };
});

// Globais para usar fora (painel/lateral)
window.__PDF_CROP_TOOL_GLOBAL = {
  reopenCurrent: function(){
    try{
      if(window.E && E.pdfLayers && E.activePdf && E.pdfLayers[E.activePdf]){
        const ov = E.pdfLayers[E.activePdf];
        window.__PDF_CROP_TOOL.open(ov.__originalUrl || ov._url, 'PDF');
      }
    }catch(e){ console.warn(e); }
  },
  restoreCurrent: function(){
    try{
      if(window.E && E.pdfLayers && E.activePdf && E.pdfLayers[E.activePdf]){
        const ov = E.pdfLayers[E.activePdf];
        ov.setUrl(ov.__originalUrl || ov._url);
      }
    }catch(e){ console.warn(e); }
  }
};
