// ===== AGRO Performance Patches (Leaflet) =====
(function(){
  if(!window.L) { return; }
  try {
    // Patch L.map to set performance-friendly defaults
    const _Lmap = L.map;
    if(!_Lmap.__agro_patched){
      L.map = function(id, opts){
        opts = Object.assign({
          preferCanvas: true,
          updateWhenZooming: false,
          updateWhenIdle: true,
          zoomAnimation: true,
          wheelDebounceTime: 40,
          zoomSnap: 0.25
        }, opts||{});
        const m = _Lmap.call(this, id, opts);
        // Global canvas renderer
        if(!window.__AGRO_RENDERER__){
          window.__AGRO_RENDERER__ = L.canvas({ padding: 0.3 });
        }
        return m;
      };
      _Lmap.__agro_patched = true;
    }
    // Patch L.geoJSON to inject renderer + smoothFactor by default
    const _geo = L.geoJSON;
    if(!_geo.__agro_patched){
      L.geoJSON = function(geojson, options){
        options = Object.assign({
          renderer: window.__AGRO_RENDERER__ || L.canvas({padding:0.3}),
          smoothFactor: 1.2,
          tolerance: 0.0 // keep geometry but draw smoother
        }, options||{});
        return _geo.call(this, geojson, options);
      };
      _geo.__agro_patched = true;
    }
    // Reduce marker reflows
    if(L.Marker && L.Marker.prototype){
      Object.assign(L.Marker.prototype.options, {
        keyboard:false, riseOnHover:false
      });
    }
  } catch(e){ console.warn('[AGRO PERF PATCH]', e); }
})();


;


    window.addEventListener('load', function(){
      try{
        (()=>{ 'use strict';

    const el = (id) => document.getElementById(id);
    const E = {
      map:null, drawn:null, editSession:null,
      toolbar:el('shapeToolbar'),
      pdfLayers:{}, activePdf:null, lastPdfBounds:null,
      kmlTexts:[],
      kmlLayers:{},
      shpLayers:{},
      routeLines:[], decorators:[], startMk:[], endMk:[],
      measure:{on:false,line:null,points:[],layer:L.layerGroup(),hasTemp:false},
      coord:{locked:false,fixed:null,cross:null}
    };
    const UI = {
      baseSelect:el('baseSelect'), chkLabels:el('chkLabels'), togglePanel:el('toggleButton'),
      searchBox:el('searchBox'), searchBtn:el('searchBtn'), gpsBtn:el('gpsBtn'), searchResults:el('searchResults'),
      pdfInput:el('pdfInput'), pdfControls:el('pdfControls'), pdfSelect:el('pdfSelect'),
      extW:el('extW'),extS:el('extS'),extE:el('extE'),extN:el('extN'),
      lockPdf:el('lockPdf'), btnAdjustPdf:el('btnAdjustPdf'), btnApplyPdf:el('btnApplyPdf'), btnCancelAdjust:el('btnCancelAdjust'), btnResetPdf:el('btnResetPdf'),
      kmlInput:el('kmlInput'), clearKML:el('clearKML'),
      shpInput:el('shpInput'), clearSHP:el('clearSHP'), shpList:el('shpList'),
      btnPoly:el('btnPoly'), btnRect:el('btnRect'), btnLine:el('btnLine'), btnCircle:el('btnCircle'), btnMarker:el('btnMarker'),
      strokeColor:el('strokeColor'), fillColor:el('fillColor'), strokeWeight:el('strokeWeight'), fillOpacity:el('fillOpacity'),
      strokeHex:el('strokeHex'), fillHex:el('fillHex'), strokeWeightOut:el('strokeWeightOut'), fillOpacityOut:el('fillOpacityOut'),
      labelText:el('labelText'), labelSize:el('labelSize'), labelSizeOut:el('labelSizeOut'),
      labelColor:el('labelColor'), labelFont:el('labelFont'), labelNoBg:el('labelNoBg'), labelBg:el('labelBgColor'),
      btnApplyLabel:el('btnApplyLabel'), btnAddFreeLabel:el('btnAddFreeLabel'),
      markerIcon:el('markerIcon'), btnAddPoint:el('btnAddPoint'), btnApplyIcon:el('btnApplyIcon'),
      btnEdit:el('btnEdit'), btnDelete:el('btnDelete'), btnSaveEdits:el('btnSaveEdits'), btnCloseToolbar:el('btnCloseToolbar'), openToolbarBtn:el('openToolbarBtn'),
      exportGeoJSON:el('exportGeoJSON'), geojsonInput:el('geojsonInput'),
      coordMain:el('coordMain'), coordZoom:el('coordZoom'), coordState:el('coordState'), lockBtn:el('lockBtn'), copyBtn:el('copyBtn'),
      rulerBtn:el('rulerBtn'), rulerValue:el('rulerValue'), rulerClear:el('rulerClear'),
      loading:el('loadingMessage'),
      pixCard:el('pixCard'), pixClose:el('pixClose'), pixQrBox:el('pixQrBox'), btnCopyPayload:el('btnCopyPayload'), btnCopyKey:el('btnCopyKey'),
      btnSaveProject:el('btnSaveProject'), projectInput:el('projectInput'),
      kmlList:el('kmlList'),
      fatal:el('fatalError')
    };
    const CONST = {
      ACRES_PER_M2:0.00024710538146717,
      START_ICON:L.icon({iconUrl:'https://img.icons8.com/emoji/48/000000/triangular-flag.png',iconSize:[24,24],iconAnchor:[12,24]}),
      END_ICON:L.icon({iconUrl:'https://img.icons8.com/emoji/48/000000/chequered-flag.png',iconSize:[24,24],iconAnchor:[12,24]}),
      PIX_PAYLOAD:'00020126580014BR.GOV.BCB.PIX013651aeff90-273f-4547-8d78-33d34059010c5204000053039865802BR5920Rafael Lima Oliveira6009SAO PAULO62140510EfGWzAFK6b6304B782',
      PIX_RANDOM_KEY:'51aeff90-273f-4547-8d78-33d34059010c'
    };
    const showLoading=(m='Carregando…')=>{UI.loading.textContent=m;UI.loading.style.display='block'};
    const hideLoading=()=>{UI.loading.style.display='none'};
    const fmtN=(n,d=2)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
    const escapeHTML = (s) => (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const toHex=(c)=>{if(!c)return'#000000';if(c[0]==='#')return c.toUpperCase();const ctx=document.createElement('canvas').getContext('2d');ctx.fillStyle=c;const m=ctx.fillStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);const h=n=>('0'+(+n).toString(16)).slice(-2);return m?`#${h(m[1])}${h(m[2])}${h(m[3])}`.toUpperCase():'#000000'};

    /* Base */
    const Base=(()=>{
      const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:23,attribution:'© OpenStreetMap'});
      const gStreets=L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom:23,subdomains:['mt0','mt1','mt2','mt3'],attribution:'© Google'});
      const gHybrid=L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:23,subdomains:['mt0','mt1','mt2','mt3'],attribution:'© Google'});
      const esriSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:23,attribution:'Tiles © Esri'});
      const esriLbls=L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}')
      ]);
      const osmHOT=L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:22,attribution:'© OpenStreetMap contributors, HOT'});
      const openTopo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenTopoMap (CC-BY-SA)'});
      const cartoLight=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:22,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'});
      const cartoDark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:22,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'});
      const cartoVoyager=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:22,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'});
      const esriTopo=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:22,attribution:'Tiles © Esri — World Topo Map'});
      const esriStreets=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:22,attribution:'Tiles © Esri — World Street Map'});
      const esriTerrain=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:13,attribution:'Tiles © Esri — Terrain Base'});
      const esriHillshade=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',{maxZoom:22,attribution:'Tiles © Esri — Hillshade'});
      const esriClarity=L.tileLayer('https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:22,attribution:'Tiles © Esri — Imagery (Clarity)'});

      const all=[osm,gStreets,gHybrid,esriSat,esriLbls,osmHOT,openTopo,cartoLight,cartoDark,cartoVoyager,esriTopo,esriStreets,esriTerrain,esriHillshade,esriClarity];
      function setBase(name){
        showLoading('Carregando mapa…');
        all.forEach(l=>{try{E.map.removeLayer(l);}catch{}});
        if(name==='osm')E.map.addLayer(osm);
        if(name==='gStreets')E.map.addLayer(gStreets);
        if(name==='gHybrid')E.map.addLayer(gHybrid);
        if(name==='esriSat')E.map.addLayer(esriSat);
        if(name==='osmHOT')E.map.addLayer(osmHOT);
        if(name==='openTopo')E.map.addLayer(openTopo);
        if(name==='cartoLight')E.map.addLayer(cartoLight);
        if(name==='cartoDark')E.map.addLayer(cartoDark);
        if(name==='cartoVoyager')E.map.addLayer(cartoVoyager);
        if(name==='esriTopo')E.map.addLayer(esriTopo);
        if(name==='esriStreets')E.map.addLayer(esriStreets);
        if(name==='esriTerrain')E.map.addLayer(esriTerrain);
        if(name==='esriHillshade')E.map.addLayer(esriHillshade);
        if(name==='esriImageryClarity')E.map.addLayer(esriClarity);
        if((name==='gHybrid'||name==='esriSat'||name==='esriImageryClarity')&&UI.chkLabels.checked)E.map.addLayer(esriLbls);
        setTimeout(hideLoading,300)
      }
      function init(){
        E.map=L.map('map',{maxZoom:23, zoomControl:false}).setView([-2.756,-48.930],12);
        L.control.scale({imperial:false,position:'bottomleft', pane:'agro-carta'}).addTo(E.map);
        osm.addTo(E.map);
        // Pane exclusivo para cartas
        (function(){
          try{
            const __pane = E.map.getPane('agro-carta') || E.map.createPane('agro-carta');
            __pane.style.zIndex = '2147483600';
            __pane.style.pointerEvents = 'auto';
          }catch(e){ console.warn(e); }
        })();
        UI.baseSelect.addEventListener('change',e=>setBase(e.target.value));
        UI.chkLabels.addEventListener('change',()=>setBase(UI.baseSelect.value));
        UI.togglePanel.addEventListener('click',()=>el('controls').classList.toggle('hidden'));
        setBase('gStreets')
      }
      return{init,setBase};
    })();

    /* Busca */
    const Search=(()=>{
      const parseLatLng=(t)=>{
        const s=t.trim().replace(';',',').replace(/\s+/g,'').replace(/−/g,'-');
        const m=s.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)\s*$/);
        if(!m)return null;
        const lat=parseFloat(m[1].replace(',','.'),10),lng=parseFloat(m[2].replace(',','.'),10);
        if(Number.isNaN(lat)||Number.isNaN(lng)||lat<-90||lat>90||lng<-180||lng>180)return null;
        return L.latLng(lat,lng);
      };
      const geocode=async(q)=>{
        const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=8`;
        const res=await fetch(url,{headers:{'Accept-Language':'pt-BR'}});return res.json();
      };
      const shortName=(s)=>(s||'').split(',')[0];

      async function doSearch(){
        const q=UI.searchBox.value.trim(); if(!q)return;
        const ll=parseLatLng(q);
        if(ll){E.map.setView(ll,Math.max(14,E.map.getZoom())); Coord.fixAt(ll); UI.searchResults.innerHTML=''; return;}
        UI.searchResults.textContent='Buscando…';
        try{
          const list=await geocode(q);
          if(!list.length){UI.searchResults.textContent='Nada encontrado.';return;}
          UI.searchResults.innerHTML=list.map(it=>`
            <div style="margin:6px 0">
              <a href="#" data-lat="${it.lat}" data-lon="${it.lon}" data-bbox="${(it.boundingbox||[]).join('|')}">
                <b>${shortName(it.display_name)}</b><br/><span class="coord-small">${it.display_name}</span>
              </a></div>`).join('');
        }catch{UI.searchResults.textContent='Falha na busca.'}
      }
      function bind(){
        UI.searchBtn.addEventListener('click',doSearch);
        UI.searchBox.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
        UI.searchResults.addEventListener('click',e=>{
          const a=e.target.closest('a[data-lat]'); if(!a)return; e.preventDefault();
          const lat=parseFloat(a.dataset.lat),lon=parseFloat(a.dataset.lon);
          const bbox=(a.dataset.bbox||'').split('|').map(Number);
          if(bbox.length===4&&bbox.every(x=>!Number.isNaN(x))){
            const b=L.latLngBounds([[bbox[0],bbox[2]],[bbox[1],bbox[3]]]);
            E.map.fitBounds(b,{padding:[16,16]});
          }else{E.map.setView([lat,lon],16);}
          Coord.fixAt(L.latLng(lat,lon)); UI.searchResults.innerHTML='';
        });
        UI.gpsBtn.addEventListener('click',()=>{
          if(!navigator.geolocation)return alert('Geolocalização não suportada');
          navigator.geolocation.getCurrentPosition(
            p=>{const ll=L.latLng(p.coords.latitude,p.coords.longitude);E.map.setView(ll,16);Coord.fixAt(ll);},
            ()=>alert('Não foi possível obter sua localização.'));
        });
      }
      return{bind};
    })();

    /* PDFs */
    const PDF=(()=>{
      let adjustRect=null,refRect=null,dragging=false,startLatLng=null,startBounds=null;
      const fmt6=(n)=>(+n).toFixed(6);
      const setInputsFromBounds=(b)=>{UI.extW.value=fmt6(b.getWest());UI.extS.value=fmt6(b.getSouth());UI.extE.value=fmt6(b.getEast());UI.extN.value=fmt6(b.getNorth());};
      const freeze=(on)=>{
        if(on){E.map.dragging.disable();E.map.scrollWheelZoom.disable();E.map.doubleClickZoom.disable();E.map.boxZoom.disable();E.map.touchZoom.disable();E.map.keyboard.disable();document.body.classList.add('adjust-mode');}
        else {E.map.dragging.enable();E.map.scrollWheelZoom.enable();E.map.doubleClickZoom.enable();E.map.boxZoom.enable();E.map.touchZoom.enable();E.map.keyboard.enable();document.body.classList.remove('adjust-mode');}
      };
      function refreshSelect(){
        UI.pdfSelect.innerHTML='';
        const names=Object.keys(E.pdfLayers);
        names.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;UI.pdfSelect.appendChild(o);});
        if(names.length){
          if(!E.activePdf||!E.pdfLayers[E.activePdf])E.activePdf=names[names.length-1];
          UI.pdfSelect.value=E.activePdf; updateInputs();
          document.getElementById('extentInfo').style.display='block';
        } else document.getElementById('extentInfo').style.display='none';
      }
      function updateInputs(){const lyr=E.pdfLayers[E.activePdf]; if(!lyr)return; setInputsFromBounds(lyr.getBounds());}
      function addOpacityControl(name){
        const wrap=UI.pdfControls; const row=document.createElement('div');
        row.style.cssText='display:grid;grid-template-columns: 3.2fr 56px auto;row-gap:4px;column-gap:8px;align-items:center;margin:6px 0';
        
row.innerHTML=`
  <div style="grid-column:1/-1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
  <input class="rng" type="range" min="0" max="1" step="0.01" value="${(E.pdfLayers[name]._opacity||1)}" style="grid-column:1/2;margin:0;width:100%">
  <div class="pct" style="grid-column:2/3;font-size:11px;justify-self:right">${Math.round((E.pdfLayers[name]._opacity||1)*100)}%</div>
  <div class="btns" style="grid-column:3/4;justify-self:end;display:flex;gap:6px">
    <button class="btn btn-ghost" data-edit title="Editar"><i class="fas fa-scissors"></i></button>
    <button class="btn btn-ghost" data-restore title="Restaurar"><i class="fas fa-rotate-left"></i></button>
    <button class="btn btn-danger" data-del title="Remover"><i class="fas fa-trash"></i></button>
  </div>`;

        
const range=row.querySelector('.rng'),
      pct=row.querySelector('.pct'),
      del=row.querySelector('[data-del]'),
      edit=row.querySelector('[data-edit]'),
      restore=row.querySelector('[data-restore]');
range.oninput=()=>{
  if(E.pdfLayers[name]){
    E.pdfLayers[name].setOpacity(parseFloat(range.value)); 
    E.pdfLayers[name]._opacity = parseFloat(range.value);
  }
  pct.textContent = Math.round(range.value*100)+'%';
};
del.onclick=()=>{
  cleanupAdjust();
  const lyr=E.pdfLayers[name];
  try{ if(lyr){ E.map.removeLayer(lyr); } }catch(_){}
  delete E.pdfLayers[name];
  row.remove();
  if(E.activePdf===name) E.activePdf=null;
  refreshSelect();
};
edit.onclick=()=>{
  try{
    const ov = E.pdfLayers[name];
    if(window.__PDF_CROP_TOOL && ov){
      // abre com a URL original se houver, senão a atual
      const src = ov.__originalUrl || ov._url;
      window.__PDF_CROP_TOOL.open(src, name);
    }
  }catch(_){}
};
restore.onclick=()=>{
  try{
    const ov=E.pdfLayers[name];
    if(ov && ov.__originalUrl){
      ov.setUrl(ov.__originalUrl);                 // volta à imagem original
      if(ov.setOpacity){ ov.setOpacity(1); }       // opacidade total
      ov._opacity = 1;
      if(range){ range.value = 1; }                // sync UI
      if(pct){ pct.textContent = '100%'; }
    }
  }catch(_){}
};
wrap.appendChild(row);
      }
      function cleanupAdjust(){
        if(adjustRect){
          const{onDown,onMove,onUp}=adjustRect._handlers||{};
          E.map.off('mousedown',onDown);E.map.off('mousemove',onMove);E.map.off('mouseup',onUp);
          E.map.removeLayer(adjustRect);adjustRect=null;
        }
        if(refRect){E.map.removeLayer(refRect);refRect=null;}
        dragging=false;startLatLng=null;startBounds=null;freeze(false);
      }
      function uniqueName(name){if(!E.pdfLayers[name])return name;let i=2;const base=name.replace(/(\.pdf)$/i,'');const ext=name.match(/\.pdf$/i)?'.pdf':'';while(E.pdfLayers[`${base} (${i})${ext}`])i++;return `${base} (${i})${ext}`;}
      function bind(){
        if(window.pdfjsLib){ pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.7.570/pdf.worker.min.js'; }
        UI.pdfInput.addEventListener('change',(e)=>{
          [...e.target.files].forEach(async(file)=>{
            if(file.type!=='application/pdf'){console.warn('PDF inválido:',file.name);return;}
            showLoading('Carregando MPS…');
            try{
              const buf=await file.arrayBuffer();
              const text=new TextDecoder('latin1').decode(new Uint8Array(buf));
              const m=/\/GPTS\s*\[\s*([^\]]+)\]/.exec(text);
              if(!m){console.warn('Nenhum /GPTS em',file.name);return;}
              const coords=Array.from(m[1].matchAll(/[-+]?\d+(?:\.\d+)?/g)).map(x=>+x[0]);
              const latLon=[]; for(let i=0;i+1<coords.length;i+=2)latLon.push([coords[i],coords[i+1]]);
              const lats=latLon.map(c=>c[0]),lons=latLon.map(c=>c[1]);
              const bounds=[[Math.min(...lats),Math.min(...lons)],[Math.max(...lats),Math.max(...lons)]];
              const name=uniqueName(file.name);

              const pdf=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;
              const page=await pdf.getPage(1);
              const viewport=page.getViewport({scale:3});
              const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
              canvas.height=viewport.height;canvas.width=viewport.width;
              await page.render({canvasContext:ctx,viewport}).promise;
              const url=canvas.toDataURL();

              

try{ if(window.__PDF_CROP_TOOL){ window.__PDF_CROP_TOOL.open(url, name); } }catch(e){}
if(window.__PDF_CROP_TOOL){ try{ window.__lastPdfDataURL=url; window.__PDF_CROP_TOOL.open(url, name); }catch(e){} }
if(E.pdfLayers[name])E.map.removeLayer(E.pdfLayers[name]);
              const ov=L.imageOverlay(url,bounds,{ pane:'agro-carta', opacity:1, pane:'agro-carta'}).addTo(E.map);
              



              try{ if(!ov.__originalBounds){ ov.__originalBounds = bounds; } }catch(_){}try{
  if(window.__PDF_CROP_TOOL){
    if(!ov.__originalUrl){ ov.__originalUrl = (typeof url!=='undefined'?url:(window.__lastPdfDataURL||ov._url)); }
    window.__PDF_CROP_TOOL.attachTarget({
      set:function(u,newBounds){ try{ ov.setUrl(u); if(newBounds) ov.setBounds(newBounds);}catch(e){} },
      getBounds:function(){ try{return ov.getBounds();}catch(e){return null;} }
    });
    if(!ov.__editControl){
      const EditCtl = L.Control.extend({
        onAdd: function(map){
          const c = L.DomUtil.create('div','leaflet-bar');
          c.style.background = '#0a1533'; c.style.border = '1px solid rgba(120,162,255,.35)'; c.style.borderRadius='8px'; c.style.overflow='hidden';
         
          L.DomEvent.on(b1,'click',function(e){ L.DomEvent.preventDefault(e); try{ window.__PDF_CROP_TOOL.open(ov.__originalUrl || ov._url, 'PDF'); }catch(err){} });
          L.DomEvent.on(b2,'click',function(e){ L.DomEvent.preventDefault(e); try{ if(ov.__originalUrl) ov.setUrl(ov.__originalUrl); if(ov.setOpacity){ov.setOpacity(1);} ov._opacity=1; }catch(err){} });
          return c;
        }, onRemove: function(map){}
      });
      ov.__editControl = new EditCtl({ position: 'topright' }).addTo(E.map);
    }
  }
}catch(e){};
try{ if(window.__PDF_CROP_TOOL){ window.__PDF_CROP_TOOL.attachTarget({ set:function(u){ try{ ov.setUrl(u); }catch(e){} } }); } }catch(e){}
if(window.__PDF_CROP_TOOL){ try{ window.__PDF_CROP_TOOL.attachTarget({ set:function(dataURL){ try{ ov.setUrl(dataURL); }catch(e){} }, getBounds:function(){ try{return ov.getBounds();}catch(e){return null;} } }); }catch(e){} }
ov._dataUrl=url; ov._opacity=1; E.pdfLayers[name]=ov; E.activePdf=name;
              addOpacityControl(name); refreshSelect();

              E.map.fitBounds(bounds,{padding:[16,16]}); E.toolbar.style.display='block';
            }catch(err){console.error('Falha PDF',file.name,err);}
            finally{hideLoading();cleanupAdjust();}
          });
        });

        UI.pdfSelect.addEventListener('change',()=>{cleanupAdjust();E.activePdf=UI.pdfSelect.value;updateInputs();});

        UI.btnAdjustPdf.addEventListener('click',()=>{
          if(UI.lockPdf.checked)return;
          const lyr=E.pdfLayers[E.activePdf]; if(!lyr||adjustRect)return;
          freeze(true);
          const b=lyr.getBounds();
          adjustRect=L.rectangle(b,{color:'#2563eb',weight:2,fillOpacity:.08,fillColor:'#60a5fa',dashArray:'6,6',interactive:false, pane:'agro-carta'}).addTo(E.map);
          refRect   =L.rectangle(b,{color:'#ef4444',weight:2,fillOpacity:0,dashArray:'4,6',interactive:false, pane:'agro-carta'}).addTo(E.map);
          dragging=false; startBounds=b;
          const onDown=(ev)=>{dragging=true;startLatLng=ev.latlng};
          const onMove=(ev)=>{
            if(!dragging||!adjustRect)return;
            const dLat=ev.latlng.lat-startLatLng.lat,dLng=ev.latlng.lng-startLatLng.lng;
            const nb=L.latLngBounds([[startBounds.getSouth()+dLat,startBounds.getWest()+dLng],[startBounds.getNorth()+dLat,startBounds.getEast()+dLng]]);
            adjustRect.setBounds(nb); lyr.setBounds(nb); setInputsFromBounds(nb);
          };
          const onUp=()=>{if(dragging){dragging=false;startBounds=adjustRect.getBounds();}};
          E.map.on('mousedown',onDown);E.map.on('mousemove',onMove);E.map.on('mouseup',onUp);
          adjustRect._handlers={onDown,onMove,onUp};
        });

        UI.btnApplyPdf.addEventListener('click',()=>{
          const lyr=E.pdfLayers[E.activePdf]; if(!lyr)return;
          const w=parseFloat(UI.extW.value),s=parseFloat(UI.extS.value),e=parseFloat(UI.extE.value),n=parseFloat(UI.extN.value);
          const b=(isFinite(w)&&isFinite(s)&&isFinite(e)&&isFinite(n))?L.latLngBounds([[s,w],[n,e]]):(adjustRect?adjustRect.getBounds():null); if(!b)return;
          lyr.setBounds(b); cleanupAdjust(); updateInputs();
        });
        UI.btnCancelAdjust.addEventListener('click',()=>{cleanupAdjust();updateInputs();});
      
        UI.btnResetPdf.addEventListener('click',()=>{
          const lyr = E.pdfLayers[E.activePdf]; if(!lyr)return;
          try{
            // Restaura bounds originais se disponíveis
            if(lyr.__originalBounds && lyr.setBounds){
              lyr.setBounds(lyr.__originalBounds);
              try{ if(E.map) E.map.fitBounds(lyr.__originalBounds); }catch(_){}
            }
            // Atualiza inputs do painel
            try{ if(typeof setInputsFromBounds==='function') setInputsFromBounds(lyr.getBounds()); }catch(_){}
          }catch(_){}
        });
}
      return{bind,addOpacityControl,refreshSelect};
    })();

    /* KML – EDITÁVEL + CAMADAS MULTI-ARQUIVO (com suporte a KMZ) */
    const KML=(()=>{
      function clear(){
        Object.values(E.kmlLayers).forEach(info=>{
          info.layers.forEach(l=>{
            try{ E.drawn.removeLayer(l); }catch{}
          });
        });
        E.routeLines.forEach(l=>{try{E.map.removeLayer(l);}catch{}});
        E.decorators.forEach(d=>{try{E.map.removeLayer(d);}catch{}});
        E.startMk.forEach(m=>{try{E.map.removeLayer(m);}catch{}});
        E.endMk.forEach(m=>{try{E.map.removeLayer(m);}catch{}});
        E.routeLines=[];E.decorators=[];E.startMk=[];E.endMk=[];
        E.kmlTexts=[];
        E.kmlLayers={};
        if(UI.kmlList) UI.kmlList.innerHTML='';
      }

      function renderKmlList(){
        if(!UI.kmlList) return;
        const names=Object.keys(E.kmlLayers);
        if(!names.length){ UI.kmlList.innerHTML=''; return; }
        UI.kmlList.innerHTML = names.map(n=>{
          const id='kml_vis_'+n.replace(/[^\w-]/g,'_');
          const visible=E.kmlLayers[n].visible!==false;
          return `
            <div style="display:flex;align-items:center;gap:6px;margin:4px 0">
              <input type="checkbox" id="${id}" ${visible?'checked':''} data-name="${escapeHTML(n)}" />
              <label for="${id}" style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHTML(n)}">${escapeHTML(n)}</label>
              <button class="btn btn-ghost" data-del="${escapeHTML(n)}" title="Remover camada"><i class="fas fa-trash"></i></button></div>`;
        }).join('');

        UI.kmlList.querySelectorAll('input[type=checkbox]').forEach(chk=>{
          chk.addEventListener('change',e=>{
            const name=e.target.dataset.name; setVisibility(name, e.target.checked);
          });
        });
        UI.kmlList.querySelectorAll('button[data-del]').forEach(btn=>{
          btn.addEventListener('click',e=>{
            const name=e.currentTarget.dataset.del; removeLayer(name);
          });
        });
      }

      function setVisibility(name, visible){
        const entry=E.kmlLayers[name]; if(!entry) return;
        entry.visible = !!visible;
        entry.layers.forEach(l=>{
          try{
            if(l.setStyle){ l.setStyle({opacity: visible? (l.options.opacity ?? 1) : 0, fillOpacity: visible? (l.options.fillOpacity ?? 0.25) : 0}); }
            if(l.setOpacity){ l.setOpacity(visible? (l.options.opacity ?? 1) : 0); }
            if(l._icon){ l._icon.style.display = visible? '' : 'none'; }
            if(l._path){ l._path.style.display = visible? '' : 'none'; }
          }catch{}
        });
      }

      function removeLayer(name){
        const entry=E.kmlLayers[name]; if(!entry) return;
        entry.layers.forEach(l=>{
          try{ E.drawn.removeLayer(l); }catch{}
        });
        delete E.kmlLayers[name];
        renderKmlList();
      }

      async function readKmlOrKmz(file){
        const isKmz = /\.kmz$/i.test(file.name) || /kmz|zip/.test(file.type||'');
        if(!isKmz){
          try{ return await file.text(); }
          catch{
            const buf = await file.arrayBuffer();
            return new TextDecoder('utf-8').decode(buf);
          }
        }
        const buf = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buf);
        let entry = zip.file(/(^|\/)doc\.kml$/i)[0] || zip.file(/\.kml$/i)[0];
        if(!entry) throw new Error('KMZ sem arquivo .kml interno');
        return await entry.async('string');
      }

      function bind(){
        UI.kmlInput.addEventListener('change', async(ev)=>{
          if(!ev.target.files?.length) return;
          showLoading('Carregando KML/KMZ…');
          try{
            const files=[...ev.target.files];
            let any=false,totalBounds=null;
            const extendSafe=(b)=>{ if(!b)return; totalBounds = totalBounds ? totalBounds.extend(b) : (b.getSouthWest? L.latLngBounds(b.getSouthWest(),b.getNorthEast()) : L.latLngBounds(b[0],b[1])); };

            for(const f of files){
              let text='';
              try{
                text = await readKmlOrKmz(f);
              }catch(e){
                console.error('Erro lendo arquivo:', f.name, e);
                alert('Falha ao ler '+f.name+': '+(e?.message||e));
                continue;
              }
              E.kmlTexts.push({name:f.name,text});

              const kml=new DOMParser().parseFromString(text,'text/xml');
              const gj=toGeoJSON.kml(kml);
              if(!gj.features.length){ console.warn('KML sem dados:',f.name); continue; }

              if(!E.kmlLayers[f.name]) E.kmlLayers[f.name] = {layers:[], visible:true};

              const layerGroup = L.geoJSON(gj,{
                pointToLayer:(ft,latlng)=> L.marker(latlng,{draggable:true}),
                style:(ft)=>({
                  color: (ft?.properties?.stroke) || '#c53030',
                  weight: (ft?.properties?.['stroke-width']) || 2,
                  fillColor: (ft?.properties?.fill) || '#60a5fa',
                  fillOpacity: Number.isFinite(+ft?.properties?.['fill-opacity']) ? +ft.properties['fill-opacity'] : 0.25,
                  opacity: Number.isFinite(+ft?.properties?.['stroke-opacity']) ? +ft.properties['stroke-opacity'] : 1
                }),
                onEachFeature:(ft,layer)=>{
                  E.kmlLayers[f.name].layers.push(layer);
                  E.drawn.addLayer(layer);
                  Draw.attach(layer);
                  Draw.showInfo(layer);
                  any=true;

                  try{ extendSafe(layer.getBounds()); }
                  catch{
                    if(layer.getLatLng){ extendSafe(L.latLngBounds([layer.getLatLng(),layer.getLatLng()])); }
                  }

                  if(ft.geometry?.type==='LineString' || ft.geometry?.type==='MultiLineString'){
                    try{
                      E.routeLines.push(layer);
                      const deco=L.polylineDecorator(layer,{patterns:[{offset:'3%',repeat:150,symbol:L.Symbol.arrowHead({pixelSize:10,polygon:true,pathOptions:{color:'#dd6b20',fillColor:'#dd6b20',fillOpacity:1,stroke:true}})}], pane:'agro-carta'}).addTo(E.map);
                      E.decorators.push(deco);
                      const coords = (ft.geometry.type==='LineString') ? ft.geometry.coordinates : (ft.geometry.coordinates?.[0]||[]);
                      if(coords?.length){
                        const s=L.marker([coords[0][1],coords[0][0]],{icon:CONST.START_ICON, pane:'agro-carta'}).addTo(E.map);
                        const last=coords[coords.length-1];
                        const e2=L.marker([last[1],last[0]],{icon:CONST.END_ICON, pane:'agro-carta'}).addTo(E.map);
                        E.startMk.push(s); E.endMk.push(e2);
                        extendSafe(L.latLngBounds([s.getLatLng(),s.getLatLng()]));
                        extendSafe(L.latLngBounds([e2.getLatLng(),e2.getLatLng()]));
                      }
                    }catch{}
                  }
                }
              });

              try{
                if(layerGroup && layerGroup.getLayers().length){
                  extendSafe(layerGroup.getBounds());
                }
              }catch{}
            }

            renderKmlList();
            if(any && totalBounds){ E.map.fitBounds(totalBounds,{padding:[16,16]}); }
          }catch(err){ console.error('Erro KML/KMZ:', err); alert('Falha na importação de KML/KMZ: '+(err?.message||err)); }
          finally{ hideLoading(); }
        });

        UI.clearKML.addEventListener('click', clear);
      }

      function loadFromTextList(list){
        if(!list || !list.length) return;
        const dt = new DataTransfer();
        list.forEach(({name,text})=>{
          const file = new File([text], name || 'arquivo.kml', {type:'application/vnd.google-earth.kml+xml'});
          dt.items.add(file);
        });
        UI.kmlInput.files = dt.files;
        UI.kmlInput.dispatchEvent(new Event('change'));
      }

      return{bind,loadFromTextList,clear,setVisibility,removeLayer};
    })();

    /* SHAPEFILE – usando shpjs (.zip recomendado) */
    const SHP=(()=>{
      function clear(){
        Object.values(E.shpLayers).forEach(arr=>{
          arr.forEach(l=>{ try{ E.drawn.removeLayer(l); }catch{} });
        });
        E.shpLayers={};
        if(UI.shpList) UI.shpList.innerHTML='';
      }

      function renderList(){
        if(!UI.shpList) return;
        const names=Object.keys(E.shpLayers);
        if(!names.length){ UI.shpList.innerHTML=''; return; }
        UI.shpList.innerHTML = names.map(n=>`
          <div style="display:flex;align-items:center;gap:6px;margin:4px 0">
            <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHTML(n)}">${escapeHTML(n)}</span>
            <button class="btn btn-ghost" data-del-shp="${escapeHTML(n)}" title="Remover camada"><i class="fas fa-trash"></i></button></div>
        `).join('');
        UI.shpList.querySelectorAll('button[data-del-shp]').forEach(btn=>{
          btn.addEventListener('click', e=>{
            const name=e.currentTarget.getAttribute('data-del-shp');
            removeLayer(name);
          });
        });
      }

      function removeLayer(name){
        const arr=E.shpLayers[name]; if(!arr) return;
        arr.forEach(l=>{ try{ E.drawn.removeLayer(l); }catch{} });
        delete E.shpLayers[name];
        renderList();
      }

      async function handleFile(f){
        try{
          const buf = await f.arrayBuffer();
          let gj = null;
          if(/\.zip$/i.test(f.name)){
            gj = await shp(buf);
          } else if(/\.shp$/i.test(f.name)){
            // Tentativa limitada: apenas .shp sozinho não traz atributos; melhor usar .zip.
            const geo = await shp.parseShp(buf);
            gj = { type:'FeatureCollection', features: (geo||[]).map(g=>({type:'Feature',geometry:g,properties:{}})) };
          } else {
            alert('Use um .zip (SHP + DBF + SHX). Arquivo: '+f.name);
            return;
          }

          const byName = (n)=>{ if(!E.shpLayers[n]) E.shpLayers[n]=[]; return E.shpLayers[n]; };
          let bounds=null, any=false;

          const pushFeatureCollection=(fc, name)=>{
            const store = byName(name);
            const layerGroup = L.geoJSON(fc,{
              pointToLayer:(ft,latlng)=> L.marker(latlng,{draggable:true}),
              style:()=>({color:'#0f766e',weight:2,fillColor:'#99f6e4',fillOpacity:.25})
            });
            layerGroup.eachLayer(l=>{
              E.drawn.addLayer(l);
              Draw.attach(l);
              Draw.showInfo(l);
              store.push(l);
              any=true;
            });
            try{ if(layerGroup.getLayers().length) bounds = bounds? bounds.extend(layerGroup.getBounds()) : layerGroup.getBounds(); }catch{}
          };

          if(Array.isArray(gj)){ // shpjs pode retornar array de FCs
            gj.forEach((fc,i)=> pushFeatureCollection(fc, f.name+(gj.length>1?` #${i+1}`:'')));
          } else if(gj && gj.type==='FeatureCollection'){
            pushFeatureCollection(gj, f.name);
          } else if(gj && gj.type && gj.geometries){ // GeometryCollection
            pushFeatureCollection({type:'FeatureCollection',features:gj.geometries.map(g=>({type:'Feature',geometry:g,properties:{}}))}, f.name);
          }

          renderList();
          if(any && bounds){ E.map.fitBounds(bounds,{padding:[16,16]}); }
        }catch(e){
          console.error('Erro ao importar SHP', f.name, e);
          alert('Falha ao importar Shapefile: '+f.name+' — '+(e?.message||e));
        }
      }

      function bind(){
        UI.shpInput.addEventListener('change', async(ev)=>{
          const files=[...(ev.target.files||[])]; if(!files.length) return;
          showLoading('Carregando Shapefile…');
          try{
            for(const f of files){ await handleFile(f); }
          }finally{
            hideLoading();
          }
        });
        UI.clearSHP.addEventListener('click', clear);
      }
      return{bind,clear};
    })();

    /* Draw / Etiquetas / Emojis */
    const Draw=(()=>{
      let selected=null;
      let activeHandler=null;

      function isLabel(layer){
        return layer instanceof L.Marker && layer.options?.icon?.options?.className==='label-marker';
      }
      function buildLabelIcon(text,opts){
        const style=[
          `font-size:${opts.size}px`,`color:${opts.color}`,`font-family:${opts.font}`,`white-space:nowrap`,`line-height:1.15`,
          opts.noBg ? 'background:transparent;border:0;box-shadow:none;padding:0'
                    : `background:${opts.bgColor};border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,.08);padding:4px 6px`
        ].join(';');
        return L.divIcon({className:'label-marker',html:`<div class="bubble" style="${style}">${escapeHTML(text||'')}</div>`,iconSize:null,iconAnchor:[0,0]});
      }
      const currentLabelOpts = ()=>({size:+UI.labelSize.value||12,color:UI.labelColor.value||'#111827',font:UI.labelFont.value||"system-ui,-apple-system,Segoe UI,Roboto,Ubuntu",noBg:!!UI.labelNoBg.checked,bgColor:UI.labelBg.value||'#ffffff'});
      const scaledSize=(base,refZoom)=>{const z=E.map.getZoom();const factor=Math.pow(2, z-(refZoom??z));return Math.max(6, Math.min(120, base*factor));};
      const iconFor=(key,sizePx=22)=>{const mapx={pin:'📍',tractor:'🚜',fazenda:'🏡',sementes:'🌱',colheita:'🌾',insumo:'🧪',pulverizacao:'🛩️',praga:'🐛',besouro:'🪲',gafanhoto:'🦗',fogo:'🔥',abrigo:'⛺',agua:'💧',alerta:'⚠️',posto:'🏣',hospital:'🏥',galpao:'🏚️',arvore:'🌳',pedra:'🪨'};const emoji=mapx[key]||'📍';return L.divIcon({html:`<div class="emoji" style="font-size:${sizePx}px">${emoji}</div>`,iconSize:null,iconAnchor:[0,0],className:'emoji-pin'})};

      function attach(layer){
        layer.on('click', ()=> select(layer));
        if(layer instanceof L.Marker){ layer.options.draggable=true; }
        if(isLabel(layer)){
          layer.setZIndexOffset(1000);
          layer.on('dblclick', (ev)=>{ ev.originalEvent?.preventDefault(); ev.originalEvent?.stopPropagation(); LabelEditor.open(layer); });
        }
      }
      function select(layer){
        selected=layer; try{layer.openPopup();}catch{}
        E.toolbar.style.display='block';
        const pos=JSON.parse(sessionStorage.getItem('toolbar_pos')||'null');
        if(pos){ Object.assign(E.toolbar.style,{left:pos.left,top:pos.top,right:'auto',bottom:'auto'}); }
        syncToolbar();
      }
      function updateStyleBadges(){
        if(UI.strokeHex)UI.strokeHex.textContent=toHex(UI.strokeColor.value);
        if(UI.fillHex)UI.fillHex.textContent=toHex(UI.fillColor.value);
        if(UI.strokeWeightOut)UI.strokeWeightOut.textContent=`${UI.strokeWeight.value} px`;
        if(UI.fillOpacityOut)UI.fillOpacityOut.textContent=`${parseFloat(UI.fillOpacity.value).toFixed(2)}`;
        if(UI.labelSizeOut)UI.labelSizeOut.textContent=`${UI.labelSize.value} px`;
      }
      function syncToolbar(){
        updateStyleBadges();
        if(!selected) return;
        if(isLabel(selected)){
          const t=selected.options.htmlText||'';
          const o=selected._labelOpts||currentLabelOpts();
          UI.labelText.value=t;
          UI.labelSize.value=Math.round(selected._baseSizePx||o.size);
          UI.labelSizeOut.textContent=`${UI.labelSize.value} px`;
          UI.labelColor.value=o.color; UI.labelFont.value=o.font; UI.labelNoBg.checked=!!o.noBg; UI.labelBg.value=o.bgColor||'#ffffff';
          return;
        }
        if(selected.options&&selected.setStyle){
          UI.strokeColor.value=toHex(selected.options.color||'#1f2937');
          UI.fillColor.value=toHex(selected.options.fillColor||'#60a5fa');
          UI.strokeWeight.value=selected.options.weight||2;
          UI.fillOpacity.value=(selected.options.fillOpacity!=null?selected.options.fillOpacity:.25);
          updateStyleBadges();
          if(selected._labelRef){
            const t=selected._labelRef.options.htmlText||'';
            const o=selected._labelRef._labelOpts||currentLabelOpts();
            UI.labelText.value=t;
            UI.labelSize.value=Math.round(selected._labelRef._baseSizePx||o.size);
            UI.labelSizeOut.textContent=`${UI.labelSize.value} px`;
            UI.labelColor.value=o.color; UI.labelFont.value=o.font; UI.labelNoBg.checked=!!o.noBg; UI.labelBg.value=o.bgColor||'#ffffff';
          }else UI.labelText.value='';
        }
      }
      function showInfo(layer){
        try{
          const gj=layer.toGeoJSON(); if(!gj.geometry) return;
          const t=gj.geometry.type; let html='';
          if(t==='Polygon'||t==='MultiPolygon'){
            const area_m2=turf.area(gj), area_ha=area_m2/10000, area_km2=area_m2/1e6, acres=area_m2*CONST.ACRES_PER_M2;
            const per_m=turf.length(turf.polygonToLine(gj),{units:'meters'}), per_km=per_m/1000;
            const centroid=turf.centroid(gj).geometry.coordinates;
            const verts=countVerts(gj.geometry);
            const b=layer.getBounds?.();
            let w_km='—', h_km='—';
            if(b){
              const midLat=(b.getSouth()+b.getNorth())/2, midLon=(b.getWest()+b.getEast())/2;
              w_km=turf.distance([b.getWest(),midLat],[b.getEast(),midLat],{units:'kilometers'});
              h_km=turf.distance([midLon,b.getSouth()],[midLon,b.getNorth()],{units:'kilometers'});
            }
            html = `<div style="font-size:13px;line-height:1.35">
              <div><b>Área:</b> ${fmtN(area_m2,0)} m² • ${fmtN(area_ha,4)} ha • ${fmtN(area_km2,4)} km² • ${fmtN(acres,2)} acres</div>
              <div><b>Perímetro:</b> ${fmtN(per_m,1)} m • ${fmtN(per_km,4)} km</div>
              <div><b>Vértices:</b> ${verts}</div>
              <div><b>Centro:</b> ${fmtN(centroid[1],6)}, ${fmtN(centroid[0],6)}</div>
              <div><b>BBox:</b> ${typeof w_km==='number'?fmtN(w_km,3):w_km} km × ${typeof h_km==='number'?fmtN(h_km,3):h_km} km</div></div>`;
          } else if(t==='LineString'||t==='MultiLineString'){
            const len_km=turf.length(gj,{units:'kilometers'}), len_m=len_km*1000, len_mi=turf.length(gj,{units:'miles'}), verts=countVerts(gj.geometry);
            html=`<div style="font-size:13px;line-height:1.35">
              <div><b>Comprimento:</b> ${fmtN(len_m,1)} m • ${fmtN(len_km,3)} km • ${fmtN(len_mi,3)} mi</div>
              <div><b>Segmentos:</b> ${verts}</div></div>`;
          } else if(layer instanceof L.Circle){
            const r=layer.getRadius(); const area_m2=Math.PI*r*r, area_ha=area_m2/10000, area_km2=area_m2/1e6, circ=2*Math.PI*r; const c=layer.getLatLng();
            html=`<div style="font-size:13px;line-height:1.35">
              <div><b>Raio:</b> ${fmtN(r,1)} m</div>
              <div><b>Circunferência:</b> ${fmtN(circ,1)} m</div>
              <div><b>Área:</b> ${fmtN(area_m2,0)} m² • ${fmtN(area_ha,4)} ha • ${fmtN(area_km2,4)} km²</div>
              <div><b>Centro:</b> ${fmtN(c.lat,6)}, ${fmtN(c.lng,6)}</div></div>`;
          } else if(gj.geometry.type==='Point' && !isLabel(layer)){
            const [lng,lat]=gj.geometry.coordinates;
            html=`<div style="font-size:13px;line-height:1.35">
              <div><b>Ponto:</b> ${fmtN(lat,6)}, ${fmtN(lng,6)}</div>
              <div style="color:#6b7280">Dica: segure <b>Alt</b> e clique para copiar.</div></div>`;
          }
          layer.bindPopup(html);
        }catch{}
      }
      function countVerts(geom){
        let c=0;
        if(geom.type==='Polygon') geom.coordinates.forEach(r=> c+=Math.max(0,r.length-1));
        else if(geom.type==='MultiPolygon') geom.coordinates.forEach(p=> p.forEach(r=> c+=Math.max(0,r.length-1)));
        else if(geom.type==='LineString') c=geom.coordinates.length-1;
        else if(geom.type==='MultiLineString') geom.coordinates.forEach(ls=> c+=Math.max(0,ls.length-1));
        return c;
      }
      function applyZoomScaling(){
        const z=E.map.getZoom();
        E.drawn.eachLayer(l=>{
          if(isLabel(l)){
            const o=l._labelOpts||currentLabelOpts();
            const size=scaledSize(l._baseSizePx||o.size||12, l._scaleRefZoom||z);
            const next={...o,size}; l._labelOpts=next; l.setIcon(buildLabelIcon(l.options.htmlText||'', next));
          } else if(l instanceof L.Marker && l.options?.icon?.options?.className==='emoji-pin'){
            const size=scaledSize(l._baseSizePx||22, l._scaleRefZoom||z);
            l.setIcon(iconFor(l._emojiKey||'pin', size));
          }
        });
      }

      function bind(){
        E.drawn=new L.FeatureGroup();E.map.addLayer(E.drawn);
        const ctrl=new L.Control.Draw({position:'topright',draw:false,edit:{featureGroup:E.drawn,remove:true}});
        E.map.addControl(ctrl);

        const handlers={};
        handlers.polygon   = new L.Draw.Polygon(E.map,{shapeOptions:{color:'#1d4ed8',weight:2,fillColor:'#60a5fa',fillOpacity:.25}});
        handlers.rectangle = new L.Draw.Rectangle(E.map,{shapeOptions:{color:'#1d4ed8',weight:2,fillColor:'#60a5fa',fillOpacity:.25}});
        handlers.polyline  = new L.Draw.Polyline(E.map,{shapeOptions:{color:'#1d4ed8',weight:3}});
        handlers.circle    = new L.Draw.Circle(E.map,{shapeOptions:{color:'#16a34a',weight:2,fillColor:'#86efac',fillOpacity:.25}});
        handlers.marker    = new L.Draw.Marker(E.map,{icon:iconFor('pin')});

        function enable(h){
          if(activeHandler) activeHandler.disable();
          activeHandler = h;
          h.enable();
          E.map.getContainer().style.cursor='crosshair';
        }

        UI.btnPoly.onclick   = ()=> enable(handlers.polygon);
        UI.btnRect.onclick   = ()=> enable(handlers.rectangle);
        UI.btnLine.onclick   = ()=> enable(handlers.polyline);
        UI.btnCircle.onclick = ()=> enable(handlers.circle);
        UI.btnMarker.onclick = ()=> enable(handlers.marker);

        const stopDrawing=()=>{
          if(activeHandler){ try{activeHandler.disable();}catch{} activeHandler=null; }
          E.map.getContainer().style.cursor='';
        };

        E.map.on(L.Draw.Event.CREATED,(e)=>{
          const layer=e.layer; E.drawn.addLayer(layer); attach(layer); showInfo(layer); select(layer);
          stopDrawing();
        });
        E.map.on('draw:drawstop', stopDrawing);
        E.map.on('draw:drawvertex', ()=>{});

        E.map.on('draw:edited',(e)=>{ e.layers.eachLayer(l=>{ showInfo(l); if(l._labelRef && l.getBounds){ l._labelRef.setLatLng(l.getBounds().getCenter()); } }); });

        UI.btnEdit.onclick = ()=>{ if(!selected || isLabel(selected)) return; E.editSession = new L.EditToolbar.Edit(E.map,{featureGroup:E.drawn}); E.editSession.enable(); };
        UI.btnSaveEdits.onclick = ()=>{ if(E.editSession){ try{E.editSession.save();}catch{} E.editSession.disable(); E.editSession=null; } };
        UI.btnDelete.onclick = ()=>{ if(!selected) return; if(selected._labelRef){ E.drawn.removeLayer(selected._labelRef); } E.drawn.removeLayer(selected); selected=null; E.toolbar.style.display='none'; };

        [UI.strokeColor,UI.fillColor,UI.strokeWeight,UI.fillOpacity].forEach(node=>{
          node.addEventListener('input', ()=>{
            if(selected && selected.setStyle){
              selected.setStyle({
                color:UI.strokeColor.value,
                weight:parseInt(UI.strokeWeight.value,10),
                fillColor:UI.fillColor.value,
                fillOpacity:parseFloat(UI.fillOpacity.value)
              });
            }
            updateStyleBadges();
          });
        });

        UI.labelText.addEventListener('keydown', e=>{ if(e.key==='Enter') e.preventDefault(); });
        UI.labelText.addEventListener('input', ()=>{ UI.labelText.value = UI.labelText.value.replace(/\s*\n+\s*/g,' '); });

        [UI.labelSize,UI.labelColor,UI.labelFont,UI.labelNoBg,UI.labelBg].forEach(n=>{
          n.addEventListener('input', ()=>{
            if(selected && isLabel(selected)){
              const t=selected.options.htmlText||''; const o=currentLabelOpts();
              selected._baseSizePx=o.size; selected._labelOpts={...(selected._labelOpts||{}),...o};
              applyZoomScaling(); selected.options.htmlText=t;
            }
            if(n===UI.labelSize) updateStyleBadges();
          });
        });

        UI.btnApplyLabel.onclick = ()=>{
          const text = UI.labelText.value.replace(/\s*\n+\s*/g,' ');
          const opts = currentLabelOpts();
          if(selected && isLabel(selected)){
            selected.options.htmlText=text; selected._labelOpts=opts; selected._baseSizePx=opts.size;
            selected._scaleRefZoom = selected._scaleRefZoom ?? E.map.getZoom();
            selected.setIcon( buildLabelIcon(text,{...opts,size:scaledSize(opts.size, selected._scaleRefZoom)}) );
            return;
          }
          if(selected){
            const center=(selected.getBounds?selected.getBounds().getCenter():(selected.getLatLng?selected.getLatLng():E.map.getCenter()));
            applyLabel(selected, center, text, opts);
          } else {
            createFreeLabel(E.map.getCenter(), text, opts);
          }
        };

        UI.btnAddFreeLabel.onclick = ()=> createFreeLabel(E.map.getCenter(), UI.labelText.value.replace(/\s*\n+\s*/g,' '), currentLabelOpts());

        UI.markerIcon.addEventListener('change', ()=>{
          handlers.marker = new L.Draw.Marker(E.map,{icon:iconFor(UI.markerIcon.value)});
          if(selected && selected instanceof L.Marker && !isLabel(selected)){
            selected._emojiKey=UI.markerIcon.value; selected._baseSizePx=selected._baseSizePx||22; selected._scaleRefZoom=selected._scaleRefZoom??E.map.getZoom();
            selected.setIcon( iconFor(UI.markerIcon.value, scaledSize(selected._baseSizePx, selected._scaleRefZoom)) );
          }
        });
        UI.btnAddPoint.onclick = ()=>{
          const m=L.marker(E.map.getCenter(),{icon:iconFor(UI.markerIcon.value),draggable:true});
          m._emojiKey=UI.markerIcon.value; m._baseSizePx=22; m._scaleRefZoom=E.map.getZoom();
          E.drawn.addLayer(m); attach(m); select(m); applyZoomScaling();
        };
        UI.btnApplyIcon.onclick = ()=>{
          if(selected && selected instanceof L.Marker && !isLabel(selected)){
            selected._emojiKey=UI.markerIcon.value; selected._baseSizePx=selected._baseSizePx||22; selected._scaleRefZoom=selected._scaleRefZoom??E.map.getZoom();
            selected.setIcon( iconFor(UI.markerIcon.value, scaledSize(selected._baseSizePx, selected._scaleRefZoom)) );
          } else console.warn('Selecione um ponto para aplicar o ícone.');
        };

        UI.btnCloseToolbar.onclick = ()=>{ E.toolbar.style.display='none'; selected=null; };
        UI.openToolbarBtn.addEventListener('click', ()=>{
          E.toolbar.style.display='block';
          const pos=JSON.parse(sessionStorage.getItem('toolbar_pos')||'null');
          if(pos){ Object.assign(E.toolbar.style,{left:pos.left,top:pos.top,right:'auto',bottom:'auto'}); }
        });

        E.map.on('zoomend', applyZoomScaling);

        function createFreeLabel(latlng,text,opts){
          const lab=L.marker(latlng,{draggable:true,icon:buildLabelIcon(text,opts),zIndexOffset:1000});
          lab.options.htmlText=text; lab._labelOpts=opts; lab._scaleRefZoom=E.map.getZoom(); lab._baseSizePx=opts.size;
          E.drawn.addLayer(lab); attach(lab); select(lab); applyZoomScaling();
        }
        function applyLabel(layer,latlng,text,opts){
          let lab=layer._labelRef;
          if(!lab){
            lab=L.marker(latlng,{draggable:true,icon:buildLabelIcon(text,opts),zIndexOffset:1000});
            lab.options.htmlText=text; lab._labelOpts=opts; lab._scaleRefZoom=E.map.getZoom(); lab._baseSizePx=opts.size;
            E.drawn.addLayer(lab); layer._labelRef=lab; attach(lab);
          }else{
            lab.setLatLng(latlng); lab.setIcon(buildLabelIcon(text,opts));
            lab.options.htmlText=text; lab._labelOpts=opts; lab._baseSizePx=opts.size;
          }
          applyZoomScaling();
        }

        updateStyleBadges();
        Draggable.make(E.toolbar,document.getElementById('dragHandle'));
        LabelEditor.init();
      }

      const LabelEditor=(()=>{
        let box=null,editing=null,dblWas=null;
        function open(label){
          close();
          editing=label; dblWas=E.map.doubleClickZoom.enabled(); E.map.doubleClickZoom.disable();
          const mapEl=document.getElementById('map'); const p=E.map.latLngToContainerPoint(label.getLatLng());
          box=document.createElement('div'); box.className='label-editor'; box.style.left=(p.x+8)+'px'; box.style.top=(p.y-8)+'px';
          box.innerHTML=`<input type="text" id="__labelEdit">`; mapEl.appendChild(box);
          const input=box.querySelector('input'); input.value=(label.options.htmlText||'').trim(); input.select(); input.focus();
          const commit=()=>{
            const txt=input.value.replace(/\s*\n+\s*/g,' ');
            const o=label._labelOpts||currentLabelOpts();
            label.options.htmlText=txt;
            const size=scaledSize(label._baseSizePx||o.size||12, label._scaleRefZoom||E.map.getZoom());
            label.setIcon( buildLabelIcon(txt,{...o,size}) );
            if(editing===label) UI.labelText.value=txt;
            close();
          };
          input.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();commit();} if(e.key==='Escape'){e.preventDefault();close();} });
          input.addEventListener('blur',commit);
        }
        function close(){
          if(box && box.parentNode) box.parentNode.removeChild(box);
          box=null; editing=null; if(dblWas) E.map.doubleClickZoom.enable(); dblWas=null;
        }
        function init(){ document.addEventListener('keydown',e=>{ if(e.key==='Escape' && box){ close(); } }); }
        return{open,close,init};
      })();

      return{bind,isLabel,attach,showInfo};
    })();

    /* GeoJSON IO (merge, sem limpar) */
    const IO=(()=>{
      function pickStyle(layer){
        const o=layer.options||{};
        return{color:o.color||'#1f2937',weight:o.weight||2,fillColor:o.fillColor||'#60a5fa',fillOpacity:(o.fillOpacity!=null?o.fillOpacity:.25)};
      }
      function collect(){
        const fc={type:'FeatureCollection',features:[]};
        E.drawn.eachLayer(layer=>{
          if(Draw.isLabel(layer)){
            const gj=layer.toGeoJSON(); const o=layer._labelOpts||{};
            gj.properties={kind:'label',text:layer.options.htmlText||'',labelOpts:o,baseSizePx:layer._baseSizePx||o.size||12,scaleRefZoom:layer._scaleRefZoom||E.map.getZoom()};
            fc.features.push(gj); return;
          }
          if(layer instanceof L.Circle){
            const c=layer.getLatLng(); const r=layer.getRadius();
            fc.features.push({type:'Feature',geometry:{type:'Point',coordinates:[c.lng,c.lat]},properties:{kind:'circle',radiusMeters:r,style:pickStyle(layer)}});
            return;
          }
          if(layer instanceof L.Marker && layer.options?.icon?.options?.className==='emoji-pin'){
            const gj=layer.toGeoJSON();
            gj.properties={kind:'emoji',emojiKey:layer._emojiKey||'pin',baseSizePx:layer._baseSizePx||22,scaleRefZoom:layer._scaleRefZoom||E.map.getZoom()};
            fc.features.push(gj); return;
          }
          if(layer._labelRef){
            const gj=layer.toGeoJSON(); gj.properties={style:pickStyle(layer),kind:'shape'}; fc.features.push(gj);
            const lj=layer._labelRef.toGeoJSON(); const lo=layer._labelRef._labelOpts||{};
            lj.properties={kind:'label',text:layer._labelRef.options.htmlText||'',labelOpts:lo,baseSizePx:layer._labelRef._baseSizePx||lo.size||12,scaleRefZoom:layer._labelRef._scaleRefZoom||E.map.getZoom()};
            fc.features.push(lj); return;
          }
          if(layer.toGeoJSON){ const gj=layer.toGeoJSON(); gj.properties={style:pickStyle(layer),kind:'shape'}; fc.features.push(gj); }
        });
        return fc;
      }
      function download(fc,name='agromap.geojson'){
        const blob=new Blob([JSON.stringify(fc,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
      }

      function loadMerge(data){
        if(!data) return;
        const seen=new Set();
        const keyLab=(ll,t)=>`${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}|${t}`;

        const lyr=L.geoJSON(data,{
          pointToLayer:(ft,latlng)=>{
            if(ft.properties?.kind==='circle') return L.circle(latlng,{ radius:ft.properties.radiusMeters||0, ...(ft.properties.style||{}) });
            return L.marker(latlng,{draggable:true});
          },
          onEachFeature:(ft,l)=>{
            if(ft.properties?.style && l.setStyle) l.setStyle(ft.properties.style);

            if(ft.properties?.kind==='label'){
              const o=ft.properties.labelOpts||{size:12,color:'#111827',font:"system-ui,-apple-system,Segoe UI,Roboto,Ubuntu",noBg:false,bgColor:'#ffffff'};
              const t=ft.properties.text||'';
              const k=keyLab(l.getLatLng(),t); if(seen.has(k)) return; seen.add(k);
              const bubble=o.noBg?`background:transparent;border:0;box-shadow:none;padding:0`:`background:${o.bgColor};border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,.08);padding:4px 6px`;
              const lab=L.marker(l.getLatLng(),{
                draggable:true,
                icon:L.divIcon({className:'label-marker',html:`<div class="bubble" style="font-size:${o.size}px;color:${o.color};font-family:${o.font};${bubble};white-space:nowrap;line-height:1.15">${escapeHTML(t)}</div>`}),
                zIndexOffset:1000
              });
              lab.options.htmlText=t; lab._labelOpts=o; lab._baseSizePx=ft.properties.baseSizePx||o.size||12; lab._scaleRefZoom=ft.properties.scaleRefZoom||E.map.getZoom();
              E.drawn.addLayer(lab); Draw.attach(lab);
              return;
            }

            if(ft.properties?.kind==='emoji'){
              const key=ft.properties.emojiKey||'pin';
              const base=ft.properties.baseSizePx||22;
              const refZ=ft.properties.scaleRefZoom||E.map.getZoom();
              const mk=L.marker(l.getLatLng(),{draggable:true,icon:L.divIcon({html:`<div class="emoji" style="font-size:${base}px">📍</div>`,className:'emoji-pin'})});
              mk._emojiKey=key; mk._baseSizePx=base; mk._scaleRefZoom=refZ;
              E.drawn.addLayer(mk); Draw.attach(mk); Draw.showInfo(mk);
              return;
            }

            E.drawn.addLayer(l); Draw.attach(l); Draw.showInfo(l);
          }
        });

        try{
          if(lyr.getLayers().length) E.map.fitBounds(lyr.getBounds(),{padding:[16,16]});
        }catch{}
      }

      function bind(){
        UI.exportGeoJSON.addEventListener('click',()=>download(collect(),'agromap.geojson'));
        UI.geojsonInput.addEventListener('change',ev=>{
          const files=[...(ev.target.files||[])]; if(!files.length) return;
          (async ()=>{
            showLoading('Importando GeoJSON…');
            try{
              for(const f of files){
                const txt=await f.text();
                const obj=JSON.parse(txt);
                const fc = obj.type==='FeatureCollection' ? obj
                         : obj.type==='Feature' ? {type:'FeatureCollection',features:[obj]}
                         : {type:'FeatureCollection',features:[{type:'Feature',geometry:obj,properties:{}}]};
                loadMerge(fc);
              }
            }catch{ alert('GeoJSON inválido.'); }
            finally{ hideLoading(); }
          })();
        });
      }
      return{bind,collect,loadMerge,download};
    })();

    /* Coord / HUD */
    const Coord=(()=>{
      const fmt=(ll)=>`Lat: ${(+ll.lat).toFixed(6)} • Lng: ${(+ll.lng).toFixed(6)}`;
      const fmtCopy=(ll)=>`"${(+ll.lat).toFixed(6)},${(+ll.lng).toFixed(6)}"`;
      function setCross(latlng){
        if(!latlng){ if(E.coord.cross){E.map.removeLayer(E.coord.cross);E.coord.cross=null} return; }
        const html=`<div style="position:relative;width:22px;height:22px"><div style="position:absolute;left:10px;top:0;bottom:0;width:2px;background:#ef4444"></div><div style="position:absolute;top:10px;left:0;right:0;height:2px;background:#ef4444"></div></div>`;
        if(!E.coord.cross){ E.coord.cross=L.marker(latlng,{icon:L.divIcon({html,iconSize:[22,22]}),interactive:false, pane:'agro-carta'}).addTo(E.map); }
        else E.coord.cross.setLatLng(latlng);
      }
      function updateLabel(ll){ UI.coordMain.textContent=fmt(ll); UI.coordZoom.textContent=E.map.getZoom(); }
      function fixAt(ll){
        E.coord.locked=true;E.coord.fixed=ll;updateLabel(ll);setCross(ll);
        UI.lockBtn.classList.add('active');
        UI.coordState.innerHTML='<span class="coord-locked">• fixado</span>';
      }
      function bind(){
        E.map.on('mousemove',e=>{ if(!E.coord.locked) updateLabel(e.latlng); });
        E.map.on('zoomend',()=>{ UI.coordZoom.textContent=E.map.getZoom(); });
        E.map.on('click',e=>{ if(E.coord.locked) fixAt(e.latlng); });

        UI.lockBtn.addEventListener('click',()=>{
          E.coord.locked=!E.coord.locked;
          if(E.coord.locked){
            fixAt(E.map.getCenter());
          }else{
            E.coord.fixed=null; setCross(null);
            UI.lockBtn.classList.remove('active');
            UI.coordState.textContent='';
          }
        });

        UI.copyBtn.addEventListener('click',()=>{
          const ll=(E.coord.locked&&E.coord.fixed)?E.coord.fixed:E.map.getCenter();
          navigator.clipboard?.writeText(fmtCopy(ll));
          UI.copyBtn.innerHTML='<i class="fa-solid fa-check"></i>';
          setTimeout(()=>UI.copyBtn.innerHTML='<i class="fa-solid fa-copy"></i>',900);
        });

        UI.openToolbarBtn.addEventListener('click',()=>{
          E.toolbar.style.display='block';
          const pos=JSON.parse(sessionStorage.getItem('toolbar_pos')||'null');
          if(pos){ Object.assign(E.toolbar.style,{left:pos.left,top:pos.top,right:'auto',bottom:'auto'}); }
        });

        updateLabel(E.map.getCenter());
      }
      return{bind,fixAt};
    })();

    /* Régua */
    const Ruler=(()=>{
      const fmtDist=(m)=> m<1000 ? `${m.toFixed(1)} m` : `${(m/1000).toFixed((m/1000)<10?2:1)} km`;
      function update(){
        if(!E.measure.line){ UI.rulerValue.textContent='0 m'; return; }
        const pts=E.measure.line.getLatLngs();
        let total=0; for(let i=1;i<pts.length;i++) total+=E.map.distance(pts[i-1],pts[i]);
        UI.rulerValue.textContent=fmtDist(total);
      }
      function clear(){ E.measure.layer.clearLayers(); E.measure.points=[]; E.measure.line=null; E.measure.hasTemp=false; update(); }
      function start(){
        E.measure.on=true; UI.rulerBtn.classList.add('active'); E.map.getContainer().style.cursor='crosshair'; clear();
        E.measure.line=L.polyline([], {color:'#2563eb',weight:3,dashArray:'6,6'}).addTo(E.measure.layer);
        if(!E.map.hasLayer(E.measure.layer)) E.measure.layer.addTo(E.map);
      }
      function addPoint(ll){
        if(!E.measure.line) return;
        if(!E.measure.hasTemp){
          E.measure.line.setLatLngs([ll,ll]);
          E.measure.points.push(L.circleMarker(ll,{radius:4,color:'#2563eb',fillColor:'#2563eb',fillOpacity:1}).addTo(E.measure.layer));
          E.measure.hasTemp=true;
        }else{
          const latlngs=E.measure.line.getLatLngs();
          latlngs[latlngs.length-1]=ll;
          E.measure.line.setLatLngs([...latlngs,ll]);
          E.measure.points.push(L.circleMarker(ll,{radius:4,color:'#2563eb',fillColor:'#2563eb',fillOpacity:1}).addTo(E.measure.layer));
        }
        update();
      }
      function moveTemp(ll){
        if(E.measure.on && E.measure.line && E.measure.hasTemp){
          const latlngs=E.measure.line.getLatLngs();
          latlngs[latlngs.length-1]=ll;
          E.measure.line.setLatLngs(latlngs); update();
        }
      }
      function finish(){
        E.measure.on=false; UI.rulerBtn.classList.remove('active'); E.map.getContainer().style.cursor='';
        if(E.measure.line && E.measure.line.getLatLngs().length<2) clear();
      }
      function bind(){
        UI.rulerBtn.addEventListener('click', ()=> E.measure.on?finish():start());
        UI.rulerClear.addEventListener('click', clear);
        E.map.on('click', e=>{ if(E.measure.on) addPoint(e.latlng); });
        E.map.on('mousemove', e=> moveTemp(e.latlng));
        E.map.on('dblclick', ()=>{ if(E.measure.on) finish(); });
        document.addEventListener('keydown', e=>{ if(e.key==='Escape' && E.measure.on) finish(); });
      }
      return{bind};
    })();

    /* Draggable */
    const Draggable=(()=>({make(el,handle){
      let sx=0,sy=0,ox=0,oy=0,drag=false;
      const down=(x,y)=>{drag=true;el.classList.add('dragging');sx=x;sy=y;const r=el.getBoundingClientRect();ox=r.left;oy=r.top;};
      const move=(x,y)=>{if(!drag)return;Object.assign(el.style,{left:(ox+(x-sx))+'px',top:(oy+(y-sy))+'px',right:'auto',bottom:'auto'})};
      const up=()=>{if(!drag)return;drag=false;el.classList.remove('dragging');sessionStorage.setItem('toolbar_pos',JSON.stringify({left:el.style.left,top:el.style.top}))};
      handle.addEventListener('mousedown',e=>{down(e.clientX,e.clientY);document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu)});
      const mm=(e)=>move(e.clientX,e.clientY);
      const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);up()};
      handle.addEventListener('touchstart',e=>{const t=e.touches[0];down(t.clientX,t.clientY)},{passive:true});
      handle.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY)},{passive:true});
      handle.addEventListener('touchend',up,{passive:true});
    }}))();

    /* PIX Card */
    (function PixCard(){
      if(!UI.pixCard) return;
      try{
        UI.pixQrBox.innerHTML='';
        new QRCode(UI.pixQrBox,{text:CONST.PIX_PAYLOAD,width:200,height:200,correctLevel:QRCode.CorrectLevel.M});
      }catch(e){console.error('QR PIX:',e)}
      UI.btnCopyPayload?.addEventListener('click',()=>{navigator.clipboard?.writeText(CONST.PIX_PAYLOAD); const old=UI.btnCopyPayload.innerHTML; UI.btnCopyPayload.innerHTML='<i class="fa-solid fa-check"></i> Copiado'; setTimeout(()=>UI.btnCopyPayload.innerHTML=old,900);});
      UI.btnCopyKey?.addEventListener('click',()=>{navigator.clipboard?.writeText(CONST.PIX_RANDOM_KEY); const old=UI.btnCopyKey.innerHTML; UI.btnCopyKey.innerHTML='<i class="fa-solid fa-check"></i> Copiado'; setTimeout(()=>UI.btnCopyKey.innerHTML=old,900);});
      const show=()=>UI.pixCard.style.display='block', hide=()=>UI.pixCard.style.display='none';
      UI.pixClose?.addEventListener('click',hide);
      let firstTimer=setTimeout(show,60*1000), reTimer=null;
      const reshow=()=>{if(reTimer)clearInterval(reTimer); reTimer=setInterval(show,10*60*1000)};
      UI.pixClose?.addEventListener('click',reshow);
    })();

    /* Projeto */
    function collectProject(){
      const center=E.map.getCenter();
      const base={name:UI.baseSelect.value, labels:UI.chkLabels.checked, center:[center.lat,center.lng], zoom:E.map.getZoom()};
      const pdfs=Object.entries(E.pdfLayers).map(([name,ov])=>({
        name, dataUrl:ov._dataUrl || ov._url,
        bounds:[[ov.getBounds().getSouth(),ov.getBounds().getWest()],[ov.getBounds().getNorth(),ov.getBounds().getEast()]],
        opacity:ov._opacity ?? 1
      }));
      const kml=E.kmlTexts.slice();
      const geo=IO.collect();
      return { "$schema":"agromap-project-v1", version:1, base, geojson:geo, kml, pdfs, savedAt:new Date().toISOString() };
    }
    function downloadProject(){
      const proj=collectProject();
      IO.download(proj,'agromap.agromap.json');
    }
    async function loadProject(obj){
      try{
        if(!obj || obj.version!==1) throw new Error('Formato de projeto inválido ou versão não suportada.');
        showLoading('Carregando projeto…');
        UI.baseSelect.value=obj.base?.name || 'osm';
        UI.chkLabels.checked=!!obj.base?.labels;
        Base.setBase(UI.baseSelect.value);
        if(obj.base?.center && Number.isFinite(obj.base.zoom)){
          E.map.setView(obj.base.center, obj.base.zoom);
        }

        if(obj.geojson) IO.loadMerge(obj.geojson);

        if(Array.isArray(obj.pdfs)){
          Object.keys(E.pdfLayers).forEach(k=>{try{E.map.removeLayer(E.pdfLayers[k])}catch{}});
          E.pdfLayers={};
          UI.pdfControls.innerHTML='';
          obj.pdfs.forEach(p=>{
            try{
              const ov=L.imageOverlay(
                p.dataUrl,
                L.latLngBounds([[p.bounds[0][0],p.bounds[0][1]],[p.bounds[1][0],p.bounds[1][1]]]),
                {opacity:p.opacity??1}
              ).addTo(E.map);
              ov._dataUrl=p.dataUrl; ov._opacity=p.opacity??1; E.pdfLayers[p.name]=ov;
              PDF.addOpacityControl(p.name);
            }catch(e){console.warn('Falha ao restaurar PDF',p?.name,e)}
          });
          PDF.refreshSelect?.();
        }
        (function(){
          const sel=UI.pdfSelect; sel.innerHTML='';
          const names=Object.keys(E.pdfLayers);
          names.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;sel.appendChild(o);});
          document.getElementById('extentInfo').style.display=names.length?'block':'none';
        })();

        if(Array.isArray(obj.kml)) KML.loadFromTextList(obj.kml);
      }catch(e){
        alert('Não foi possível importar o projeto: '+e.message);
      } finally{
        hideLoading();
      }
    }

    (function bindProjectButtons(){
      UI.btnSaveProject?.addEventListener('click', downloadProject);
      UI.projectInput?.addEventListener('change', async (ev)=>{
        const file = ev.target.files?.[0];
        if(!file) return;
        try{
          const txt = await file.text();
          const obj = JSON.parse(txt);
          await loadProject(obj);
        }catch(e){
          alert('Projeto inválido: '+(e?.message||e));
        }
      });
    })();

    /* Boot */
    Base.init(); Search.bind(); PDF.bind(); KML.bind(); SHP.bind(); Draw.bind(); IO.bind(); Coord.bind(); Ruler.bind();

        })();
      }catch(e){
        console.error(e);
        document.getElementById('fatalError').style.display='block';
      }
    });
  

;


(function(){
  // status helper
  function showStatus(msg, ms){
    const box = document.getElementById('agro-status-overlay');
    if(!box) return;
    box.textContent = msg;
    box.style.display = 'block';
    if(ms){ setTimeout(()=>{ box.style.display='none'; }, ms); }
  }
  window.__agroStatus = { show: showStatus };

  // 1) Web Worker for SHP/ZIP parsing
  const workerCode = `
    self.onmessage = async (ev) => {
      const { type, payload } = ev.data;
      if(type !== 'parseShp') return;
      try {
        importScripts('https://unpkg.com/shpjs@latest/dist/shp.min.js');
        let input = payload;
        if(payload && payload.type === 'ab' && payload.data){
          input = payload.data;
        } else if (payload && payload.type === 'blob' && payload.data){
          input = new Blob([new Uint8Array(payload.data)], { type: 'application/zip' });
          input = await input.arrayBuffer();
        }
        const out = await shp(input);
        function toFC(x){
          if(!x) return {type:'FeatureCollection',features:[]};
          if(x.type==='FeatureCollection') return x;
          if(x.type && x.features) return x;
          if(typeof x === 'object'){
            const k = Object.keys(x)[0];
            return toFC(x[k]);
          }
          return {type:'FeatureCollection',features:[]};
        }
        const fc = toFC(out);
        postMessage({ ok:true, fc });
      } catch(err){
        postMessage({ ok:false, error: String(err) });
      }
    };
  `;
  const _workerURL = URL.createObjectURL(new Blob([workerCode], {type:'text/javascript'}));
  const shpWorker = new Worker(_workerURL);
  window.addEventListener('unload', ()=> { try{ URL.revokeObjectURL(_workerURL); }catch(_){}} , {once:true});

  // Wrap global shp() para usar o worker quando input for ArrayBuffer/Blob
  const shpOrig = window.shp;
  if (typeof shpOrig === 'function') {
    window.shp = function(input){
      try{
        if (input instanceof ArrayBuffer) {
          return new Promise((resolve, reject)=>{
            const onMsg = (ev)=>{
              const d = ev.data;
              if(d.ok){ shpWorker.removeEventListener('message', onMsg); resolve(d.fc); }
              else { shpWorker.removeEventListener('message', onMsg); reject(new Error(d.error||'shp worker failed')); }
            };
            shpWorker.addEventListener('message', onMsg);
            shpWorker.postMessage({ type:'parseShp', payload: { type:'ab', data: input } }, [input]);
          });
        }
        if (typeof Blob !== 'undefined' && input instanceof Blob) {
          return input.arrayBuffer().then(ab => new Promise((resolve, reject)=>{
            const onMsg = (ev)=>{
              const d = ev.data;
              if(d.ok){ shpWorker.removeEventListener('message', onMsg); resolve(d.fc); }
              else { shpWorker.removeEventListener('message', onMsg); reject(new Error(d.error||'shp worker failed')); }
            };
            shpWorker.addEventListener('message', onMsg);
            shpWorker.postMessage({ type:'parseShp', payload: { type:'ab', data: ab } }, [ab]);
          }));
        }
      }catch(e){ /* fallback */ }
      return shpOrig.apply(this, arguments);
    };
  }

  // 2) L.geoJSON -> VectorGrid para datasets grandes
  if (window.L && !L.___vectorPatchApplied) {
    const ORIGINAL_geoJSON = L.geoJSON;
    function approxSize(obj){ try { return JSON.stringify(obj).length; } catch(e){ return 0; } }
    L.geoJSON = function(geojson, options){
      try{
        const feats = (geojson && geojson.features) ? geojson.features.length : 0;
        const bytes = approxSize(geojson);
        const tooLarge = (feats > 4000) || (bytes > 12*1024*1024);
        if (tooLarge && L.vectorGrid && L.vectorGrid.slicer) {
          let simplified = geojson;
          try {
            if (typeof turf !== 'undefined' && geojson && geojson.type === 'FeatureCollection') {
              const tol = (window.AGRO_SIMPLIFY_TOL || 0.00005);
              simplified = turf.simplify(geojson, { tolerance: tol, highQuality: false });
            }
          } catch(_) {}
          const vg = L.vectorGrid.slicer(simplified, {
            rendererFactory: L.canvas.tile,
            maxZoom: 22,
            vectorTileLayerStyles: {
              sliced: { weight: 1, opacity: 0.95, fillOpacity: 0.15 }
            },
            interactive: true
          });
          vg.getBounds = function(){
            try { return ORIGINAL_geoJSON.call(L, simplified).getBounds(); }
            catch(e){ return L.latLngBounds(); }
          };
          L.___vectorPatchApplied = true;
          return vg;
        }
      }catch(e){ /* no-op */ }
      return ORIGINAL_geoJSON.apply(this, arguments);
    };
  }
})();


;


(function(){
  // ----------------- UTIL: PROGRESS BAR -----------------
  const $prog = document.getElementById('agro-progress');
  const $progText = document.getElementById('agro-progress-text');
  const $progBar = document.getElementById('agro-progress-bar');
  function progressShow(msg){ if(!$prog) return; $progText.textContent = msg||'Carregando…'; $prog.style.display='inline-block'; $progBar.style.width='10%'; }
  function progressTick(p){ if(!$progBar) return; const v = Math.max(10, Math.min(100, Math.round(p))); $progBar.style.width = v+'%'; }
  function progressHide(){ if(!$prog) return; $prog.style.display='none'; $progBar.style.width='0%'; }
  window.__agroProgress = { show:progressShow, tick:progressTick, hide:progressHide };

  // ----------------- LAYER MANAGER (limpeza total) -----------------
  const REG = new Map(); // id -> {layer, type, name}
  let COUNTER = 0;

  function genId(){ return 'agro-'+ (++COUNTER); }

  function deepRemoveLayer(layer, map){
    try{
      if(!layer) return;
      if(layer.clearLayers) { layer.clearLayers(); }
      if(layer.remove) { layer.remove(); }
      if(map && map.removeLayer) { try { map.removeLayer(layer); } catch(_){} }
      if(layer.off) { layer.off(); }
      if(layer.getPane && layer.getPane()) { /* let Leaflet handle DOM cleanup */ }
    }catch(e){}
  }

  function registerLayer(layer, type, name){
    const id = genId();
    REG.set(id, { layer, type:type||'unknown', name:name||('Layer '+id), visible:true });
    if(layer && layer.on){
      // keep registry in sync if removed externally
      layer.on('remove', ()=>{
        const it = REG.get(id);
        if(it) it.visible = false;
      });
    }
    return id;
  }

  function removeById(id, map){
    const it = REG.get(id);
    if(!it) return;
    deepRemoveLayer(it.layer, map||window.__leafletMap);
    REG.delete(id);
    // try to force gc-friendly cleanup
    it.layer = null;
  }

  function removeAll(map){
    Array.from(REG.keys()).forEach(id => removeById(id, map));
  }

  window.AGRO_LAYERS = { registerLayer, removeById, removeAll, _REG:REG };

  // Patch Map.removeLayer to ensure full cleanup for managed layers
  if(L && L.Map && !L.Map.__agroRemovePatched){
    const origRemove = L.Map.prototype.removeLayer;
    L.Map.prototype.removeLayer = function(layer){
      // find in registry
      for(const [id, entry] of REG){
        if(entry.layer === layer){
          deepRemoveLayer(layer, this);
          REG.delete(id);
          return this;
        }
      }
      return origRemove.call(this, layer);
    };
    L.Map.__agroRemovePatched = true;
  }

  // ----------------- FILE INPUT RESILIENCE -----------------
  // Limpar <input type=file> após importação para permitir reimportar o mesmo arquivo várias vezes
  document.addEventListener('change', (e)=>{
    const el = e.target;
    if(el && el.tagName==='INPUT' && el.type==='file'){
      setTimeout(()=>{ try{ el.value = ''; }catch(_){ } }, 1000);
    }
  }, true);

  // ----------------- SHAPEFILE VIA WORKER (com quantização opcional) -----------------
  // Reaproveita worker anterior se existir
  let shpWorker = window.__agroShpWorker;
  if(!shpWorker){
    const workerCode = `
      self.onmessage = async (ev) => {
        const { type, payload, quant } = ev.data;
        if(type !== 'parseShp') return;
        try {
          importScripts('https://unpkg.com/shpjs@latest/dist/shp.min.js');
          let input = payload;
          if(payload && payload.type==='ab' && payload.data){ input = payload.data; }
          const out = await shp(input);
          function toFC(x){
            if(!x) return {type:'FeatureCollection',features:[]};
            if(x.type==='FeatureCollection') return x;
            if(x.type && x.features) return x;
            if(typeof x === 'object'){ const k=Object.keys(x)[0]; return toFC(x[k]); }
            return {type:'FeatureCollection',features:[]};
          }
          let fc = toFC(out);

          // quantização leve (reduz bytes em ~30-60%)
          function qCoord(v,q){ return Math.round(v/q)*q; }
          function qGeom(g,q){
            const t=g.type, c=g.coordinates;
            if(!t||!c) return g;
            const qp=(p)=>[qCoord(p[0],q),qCoord(p[1],q)];
            if(t==='Point') return {type:t,coordinates:qp(c)};
            if(t==='MultiPoint'||t==='LineString') return {type:t,coordinates:c.map(qp)};
            if(t==='MultiLineString'||t==='Polygon') return {type:t,coordinates:c.map(r=>r.map(qp))};
            if(t==='MultiPolygon') return {type:t,coordinates:c.map(poly=>poly.map(r=>r.map(qp)))};
            return g;
          }
          if(quant && fc && fc.features){
            const q = quant; // e.g., 1e-5 ~ ~1m
            fc = { type:'FeatureCollection', features: fc.features.map(f=>({ type:'Feature', properties:f.properties||{}, geometry:qGeom(f.geometry,q) })) };
          }

          postMessage({ ok:true, fc, feats: (fc.features||[]).length });
        } catch(err){
          postMessage({ ok:false, error:String(err) });
        }
      };
    `;
    const url = URL.createObjectURL(new Blob([workerCode], {type:'text/javascript'}));
    shpWorker = new Worker(url);
    window.__agroShpWorker = shpWorker;
    window.addEventListener('unload', ()=>{ try{ URL.revokeObjectURL(url); }catch(_){ } }, { once:true });
  }

  // Monkey-patch global shp() para usar worker com progress UI
  const shpOrig = window.shp;
  if (typeof shpOrig === 'function' && !window.__agroShpWrapped){
    window.__agroShpWrapped = true;
    window.shp = function(input){
      try{
        if (input instanceof ArrayBuffer) {
          __agroProgress.show('Convertendo SHP…');
          return new Promise((resolve, reject)=>{
            const onMsg = (ev)=>{
              const d = ev.data;
              if(d.ok){ shpWorker.removeEventListener('message', onMsg); __agroProgress.hide(); resolve(d.fc); }
              else { shpWorker.removeEventListener('message', onMsg); __agroProgress.hide(); reject(new Error(d.error||'shp worker failed')); }
            };
            shpWorker.addEventListener('message', onMsg);
            // quantização automática p/ arquivos muito grandes
            shpWorker.postMessage({ type:'parseShp', payload:{ type:'ab', data: input }, quant: 1e-5 }, [input]);
          });
        }
        if (typeof Blob !== 'undefined' && input instanceof Blob) {
          __agroProgress.show('Lendo SHP…');
          return input.arrayBuffer().then(ab => new Promise((resolve, reject)=>{
            const onMsg = (ev)=>{
              const d = ev.data;
              if(d.ok){ shpWorker.removeEventListener('message', onMsg); __agroProgress.hide(); resolve(d.fc); }
              else { shpWorker.removeEventListener('message', onMsg); __agroProgress.hide(); reject(new Error(d.error||'shp worker failed')); }
            };
            shpWorker.addEventListener('message', onMsg);
            shpWorker.postMessage({ type:'parseShp', payload:{ type:'ab', data: ab }, quant: 1e-5 }, [ab]);
          }));
        }
      }catch(e){ /* fallback */ }
      return shpOrig.apply(this, arguments);
    };
  }

  // ----------------- POPUP com PIN e hover-only quando desfixado -----------------
  let pinned = false;
  function popupHtmlFromProps(props){
    const rows = Object.keys(props||{}).slice(0,50).map(k=>`<tr><td><b>${k}</b></td><td>${String(props[k])}</td></tr>`).join('');
    const table = rows ? `<table>${rows}</table>` : '<em>Sem atributos</em>';
    return `<button class="agro-pin" title="Fixar/Desfixar" onclick="(function(btn){ window.__agroTogglePin(btn); })(this)">📌</button>` + table;
  }
  window.__agroTogglePin = function(btn){
    pinned = !pinned;
    if(btn) btn.textContent = pinned ? '📌' : '📌';
  };

  function attachHoverPopupsToLayer(layer){
    if(!layer) return;
    // GeoJSON layers
    if(layer.eachLayer){
      layer.eachLayer(function(ch){
        if(ch && ch.bindPopup){
          const props = ch.feature ? ch.feature.properties||{} : {};
          ch.bindPopup(popupHtmlFromProps(props));
          ch.on('mouseover', function(ev){
            if(!pinned){ ch.openPopup(ev.latlng); }
          });
          ch.on('mouseout', function(){
            if(!pinned){ try{ ch.closePopup(); }catch(_){ } }
          });
        }
      });
    }
    // VectorGrid
    if(layer.on && layer._layers === undefined){ // heurística: vectorgrid não tem eachLayer tradicional
      layer.on('mouseover', function(e){
        const p = e.layer && e.layer.properties ? e.layer.properties : {};
        const html = popupHtmlFromProps(p);
        if(!pinned){ L.popup().setLatLng(e.latlng).setContent(html).openOn(window.__leafletMap || layer._map); }
      });
      layer.on('mouseout', function(){
        if(!pinned){ try{ (window.__leafletMap || layer._map).closePopup(); }catch(_){ } }
      });
      layer.on('click', function(e){
        const p = e.layer && e.layer.properties ? e.layer.properties : {};
        const html = popupHtmlFromProps(p);
        L.popup().setLatLng(e.latlng).setContent(html).openOn(window.__leafletMap || layer._map);
      });
    }
  }

  // ----------------- L.geoJSON auto-VectorGrid + registry + faster add -----------------
  if (window.L && !L.___vectorPatchApplied2) {
    const ORIGINAL_geoJSON = L.geoJSON;
    function approxSize(obj){ try { return JSON.stringify(obj).length; } catch(e){ return 0; } }
    L.geoJSON = function(geojson, options){
      try{
        const feats = (geojson && geojson.features) ? geojson.features.length : 0;
        const bytes = approxSize(geojson);
        const tooLarge = (feats > 4000) || (bytes > 12*1024*1024);

        if (tooLarge && L.vectorGrid && L.vectorGrid.slicer) {
          let simplified = geojson;
          try {
            if (typeof turf !== 'undefined' && geojson && geojson.type === 'FeatureCollection') {
              const tol = (window.AGRO_SIMPLIFY_TOL || 0.00005);
              simplified = turf.simplify(geojson, { tolerance: tol, highQuality: false });
            }
          } catch(_) {}

          const vg = L.vectorGrid.slicer(simplified, {
            rendererFactory: L.canvas.tile,
            maxZoom: 22,
            vectorTileLayerStyles: { sliced: { weight: 1, opacity: 0.95, fillOpacity: 0.15 } },
            interactive: true
          });
          // fitBounds compat
          vg.getBounds = function(){
            try { return ORIGINAL_geoJSON.call(L, simplified).getBounds(); }
            catch(e){ return L.latLngBounds(); }
          };

          // register / attach hover popups
          const id = registerLayer(vg, 'vectorgrid', 'Importado');
          setTimeout(()=> attachHoverPopupsToLayer(vg), 0);
          L.___vectorPatchApplied2 = true;
          return vg;
        }

        // Small/medium: create geojson layer but add features in chunks for speed
        const layer = ORIGINAL_geoJSON.call(L, { type:'FeatureCollection', features:[] }, options||{});
        const featsArr = (geojson && geojson.features) ? geojson.features.slice() : [];
        const chunk = 1000;
        function addChunk(){
          const part = featsArr.splice(0, chunk);
          if(part.length){
            try { layer.addData({ type:'FeatureCollection', features: part }); } catch(e){ console.warn(e); }
            if(typeof requestIdleCallback === 'function'){ requestIdleCallback(addChunk); }
            else { setTimeout(addChunk, 0); }
          } else {
            // when finished
            try { attachHoverPopupsToLayer(layer); } catch(_){}
          }
        }
        addChunk();

        const id = registerLayer(layer, 'geojson', 'Importado');
        return layer;
      }catch(e){
        return ORIGINAL_geoJSON.apply(this, arguments);
      }
    };
  }

  // ----------------- KML/KMZ visibility and unlimited re-import -----------------
  // A estratégia acima (registry + file reset) já permite reimportar ilimitado.
  // Para garantir, esvazie popups ao remover:
  document.addEventListener('click', (e)=>{
    // Se sua UI tiver um botão "Excluir" que chama map.removeLayer(...),
    // nosso patch de Map.removeLayer garante limpeza total.
  }, true);

  // Expor o mapa global se existir para popups
  // Tentativa de descobrir o mapa padrão
  setTimeout(()=>{
    try{
      for(const k in window){
        if(window[k] && window[k] instanceof L.Map){ window.__leafletMap = window[k]; break; }
      }
    }catch(_){}
  }, 500);

})();

;


(function(){
  const $fab = document.getElementById('agro-layer-fab');
  const $panel = document.getElementById('agro-layer-container');
  const $list = document.getElementById('agro-layer-list');
  const $hint = document.getElementById('agro-layer-hint');
  const REG = (window.AGRO_LAYERS && window.AGRO_LAYERS._REG) ? window.AGRO_LAYERS._REG : new Map();
  const API = window.AGRO_LAYERS || (window.AGRO_LAYERS = { registerLayer(){}, removeById(){}, removeAll(){}, _REG: REG });
  let ORDER = window.__AGRO_ORDER || [];
  window.__AGRO_ORDER = ORDER;

  // --- Toggle by FAB (left icon) ---
  if($fab){
    $fab.addEventListener('click', ()=>{
      if(!$panel) return;
      const vis = $panel.style.display !== 'none';
      $panel.style.display = vis ? 'none' : 'grid';
    });
  }

  // --- Draggable panel ---
  if($panel){
    const header = $panel.querySelector('h3');
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    function onDown(e){
      dragging=true; $panel.classList.add('dragging');
      const r = $panel.getBoundingClientRect(); ox=r.left; oy=r.top;
      sx = e.clientX; sy = e.clientY;
      e.preventDefault();
    }
    function onMove(e){
      if(!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      $panel.style.left = (ox+dx)+'px';
      $panel.style.top = (oy+dy)+'px';
    }
    function onUp(){ dragging=false; $panel.classList.remove('dragging'); }
    if(header){
      header.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  }

  // --- Ensure ORDER contains any registered IDs; new layers go on top ---
  function ensureOrderEntry(id){
    if(!ORDER.includes(id)) ORDER.unshift(id);
  }
  const _origRegister = API.registerLayer || function(layer, type, name){ return null; };
  API.registerLayer = function(layer, type, name){
    const id = _origRegister(layer, type, name);
    ensureOrderEntry(id);
    rebuildZOrder();
    syncLayerUI();
    return id;
  };

  // --- Auto-register any external layer added to the map (KML/KMZ/Tile etc.) ---
  function mapRef(){ return window.__leafletMap; }
  setTimeout(()=>{
    const m = mapRef();
    if(!m) return;
    m.on('layeradd', function(ev){
      const lyr = ev.layer;
      // If this layer is not in REG, register it with a generic name
      const already = Array.from(REG.values()).some(e => e.layer === lyr);
      if(!already){
        const name = (lyr._url ? (lyr._url.split('?')[0].split('/').slice(-2).join('/') || 'Mapa')
                    : (lyr.options && lyr.options.name) || 'Camada');
        if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.registerNamed){
          window.AGRO_LAYERS_UI.registerNamed(lyr, lyr instanceof L.TileLayer ? 'tile' : 'overlay', name);
        }else if(API.registerLayer){
          const id = API.registerLayer(lyr, (lyr instanceof L.TileLayer ? 'tile':'overlay'), name);
          ensureOrderEntry(id);
        }
      }
      // Progress watchdog: hide shortly after any layeradd
      if(window.__agroProgress){ setTimeout(()=> window.__agroProgress.hide(), 600); }
      rebuildZOrder();
      syncLayerUI();
    });
  }, 800);

  // --- Build panes and z-index according to ORDER (top of ORDER on top) ---
  function rebuildZOrder(){
    const m = mapRef(); if(!m) return;
    const paneBase = 200; // tilePane ~200, overlay ~400; we will manage our own range safely
    const items = ORDER.map(id => [id, REG.get(id)]).filter(([,e])=> e && e.layer);
    // Assign pane & bring to front/back according to position
    items.forEach(([,e], idx) => {
      const z = paneBase + 50 + idx; // increase with idx so later in ORDER sits above
      const paneName = 'agro-pane-' + idx;
      if(!m.getPane(paneName)){
        const p = m.createPane(paneName);
        p.style.zIndex = String(z);
      }else{
        m.getPane(paneName).style.zIndex = String(z);
      }
      try {
        // try setting pane if supported
        if(e.layer.setZIndex){ e.layer.setZIndex(z); }
        if(e.layer.setStyle){ /* vector layers respect bringToFront/Back */ }
        if(e.layer.options){ e.layer.options.pane = paneName; }
        // Re-add to apply pane change
        if(m.hasLayer(e.layer)){ m.removeLayer(e.layer); }
        e.layer.addTo(m);
      } catch(_){}
      // keep visibility
      if(e.visible === false){ try { m.removeLayer(e.layer); }catch(_){ } }
    });
  }

  // --- Sync Layer UI (reuse existing functions if present) ---
  function syncLayerUI(){
    if(!$list) return;
    // Remove ids that no longer exist
    ORDER = ORDER.filter(id => REG.has(id));
    window.__AGRO_ORDER = ORDER;
    // If list currently hidden by toggle, keep state; we keep container visible only by FAB
    const rows = ORDER.map((id)=>{
      const e = REG.get(id); const name = e?.name || ('Layer '+id);
      const visible = e?.visible !== false;
      return `<div class="layer-row" data-id="${id}">
        <div class="name" title="${name}">${name}</div>
        <div class="controls">
          <button class="layer-btn eye" data-eye title="${visible?'Ocultar':'Mostrar'}">${visible?'👁':'🚫'}</button>
          <button class="layer-btn" data-up title="Subir">↑</button>
          <button class="layer-btn" data-down title="Descer">↓</button>
          <button class="layer-btn" data-del title="Excluir">✖</button></div>
      </div>`;
    }).join('');
    $list.innerHTML = rows;
    // Attach events
    $list.querySelectorAll('.layer-row').forEach(row => {
      const id = row.getAttribute('data-id');
      const entry = REG.get(id);
      if(!entry) return;
      row.querySelector('[data-eye]').addEventListener('click', ()=>{
        const m = mapRef(); if(!m) return;
        entry.visible = !entry.visible;
        try { if(entry.visible){ entry.layer.addTo(m); } else { m.removeLayer(entry.layer); } } catch(_){}
        rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI();
      });
      row.querySelector('[data-up]').addEventListener('click', ()=>{
        const i = ORDER.indexOf(id);
        if(i>0){ const t=ORDER[i-1]; ORDER[i-1]=ORDER[i]; ORDER[i]=t; rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI(); }
      });
      row.querySelector('[data-down]').addEventListener('click', ()=>{
        const i = ORDER.indexOf(id);
        if(i>=0 && i<ORDER.length-1){ const t=ORDER[i+1]; ORDER[i+1]=ORDER[i]; ORDER[i]=t; rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI(); }
      });
      row.querySelector('[data-del]').addEventListener('click', ()=>{
        const m = mapRef();
        try { window.AGRO_LAYERS.removeById(id, m); } catch(_){}
        ORDER = ORDER.filter(x=>x!==id); rebuildZOrder(); window.dispatchEvent(new Event('agro-rebuilt-z')); syncLayerUI();
      });
    });
  }

  // --- Progress bar bugs: ensure hide on completion and on errors ---
  // Wrap FileReader/async flows: we can't hook all, so add watchdogs
  if(window.__agroProgress){
    const hide = window.__agroProgress.hide;
    window.__agroProgress.hide = function(){
      hide(); // call original
      // extra: ensure style reset
      const el = document.getElementById('agro-progress');
      if(el){ el.style.display='none'; const bar = document.getElementById('agro-progress-bar'); if(bar) bar.style.width='0%'; }
    };
    // global error handler fallback
    window.addEventListener('error', ()=>{ try{ window.__agroProgress.hide(); }catch(_){ } });
    window.addEventListener('unhandledrejection', ()=>{ try{ window.__agroProgress.hide(); }catch(_){ } });
  }

  // First sync when ready
  setTimeout(syncLayerUI, 1000);

})();

;


// === PATCH: garantir que o painel de camadas mostre tudo que já foi carregado ===
(function(){
  const REG = (window.AGRO_LAYERS && window.AGRO_LAYERS._REG) ? window.AGRO_LAYERS._REG : new Map();
  const API = window.AGRO_LAYERS || (window.AGRO_LAYERS = { registerLayer(){}, removeById(){}, removeAll(){}, _REG: REG });
  let ORDER = window.__AGRO_ORDER || [];
  window.__AGRO_ORDER = ORDER;

  // 1) Interceptar L.map para capturar o mapa assim que for criado
  if(window.L && !L.___agroMapCtorPatched){
    const _origMap = L.map;
    L.map = function(){
      const m = _origMap.apply(this, arguments);
      window.__leafletMap = m;

      // camada adicionada -> registra se ainda não estiver no REG
      m.on('layeradd', function(ev){
        const lyr = ev.layer;
        const already = Array.from(REG.values()).some(e => e.layer === lyr);
        if(!already){
          const name = (lyr._url ? (lyr._url.split('?')[0].split('/').slice(-2).join('/') || 'Mapa')
                      : (lyr.options && (lyr.options.name || lyr.options.pane)) || lyr.pm?.options?.name || 'Camada');
          if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.registerNamed){
            window.AGRO_LAYERS_UI.registerNamed(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
          } else if(API.registerLayer){
            const id = API.registerLayer(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
            if(!ORDER.includes(id)) ORDER.unshift(id);
          }
        }
        if(window.__agroProgress){ setTimeout(()=> window.__agroProgress.hide(), 400); }
        if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.sync) window.AGRO_LAYERS_UI.sync();
      });

      // 2) Registrar camadas já existentes no mapa (basemap + overlays)
      setTimeout(function registerExisting(){
        try {
          const layers = m._layers || {};
          Object.keys(layers).forEach(k => {
            const lyr = layers[k];
            const already = Array.from(REG.values()).some(e => e.layer === lyr);
            if(!already){
              const name = (lyr._url ? (lyr._url.split('?')[0].split('/').slice(-2).join('/') || 'Mapa')
                          : (lyr.options && (lyr.options.name || lyr.options.pane)) || 'Camada');
              if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.registerNamed){
                window.AGRO_LAYERS_UI.registerNamed(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
              } else if(API.registerLayer){
                const id = API.registerLayer(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
                if(!ORDER.includes(id)) ORDER.unshift(id);
              }
            }
          });
          if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.sync) window.AGRO_LAYERS_UI.sync();
        } catch(e){ console.warn('registerExisting error', e); }
      }, 300);

      L.___agroMapCtorPatched = true;
      return m;
    };
  }

  // 3) Se o mapa já existir (criado antes do patch), tenta detectar e registrar
  function tryBackfill(){
    if(window.__leafletMap){
      const m = window.__leafletMap;
      const layers = m._layers || {};
      Object.keys(layers).forEach(k => {
        const lyr = layers[k];
        const already = Array.from(REG.values()).some(e => e.layer === lyr);
        if(!already){
          const name = (lyr._url ? (lyr._url.split('?')[0].split('/').slice(-2).join('/') || 'Mapa')
                      : (lyr.options && (lyr.options.name || lyr.options.pane)) || 'Camada');
          if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.registerNamed){
            window.AGRO_LAYERS_UI.registerNamed(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
          } else if(API.registerLayer){
            const id = API.registerLayer(lyr, (lyr instanceof L.TileLayer ? 'tile' : 'overlay'), name);
            if(!ORDER.includes(id)) ORDER.unshift(id);
          }
        }
      });
      if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.sync) window.AGRO_LAYERS_UI.sync();
    }
  }
  setTimeout(tryBackfill, 1200);
})();


;


// === PATCH: painel de camadas deve refletir a ORDEM REAL do mapa (tiles, KML/KMZ, shapes) ===
(function(){
  const REG = (window.AGRO_LAYERS && window.AGRO_LAYERS._REG) ? window.AGRO_LAYERS._REG : new Map();
  let ORDER = window.__AGRO_ORDER || [];
  window.__AGRO_ORDER = ORDER;

  function mapRef(){ return window.__leafletMap; }

  // Efetivo Z-index de uma layer (tile ou vetor)
  function effectiveZ(layer, m){
    let z = 0;
    try{
      if(layer && typeof layer.getZIndex === 'function'){
        const v = layer.getZIndex();
        if(typeof v === 'number') z = v;
      }
      if(!z && layer && layer.options && typeof layer.options.zIndex === 'number'){
        z = layer.options.zIndex;
      }
      const paneName = (layer && layer.options && layer.options.pane) ? layer.options.pane : null;
      const pane = paneName && m ? m.getPane(paneName) : (layer.getPane ? layer.getPane() : null);
      if(pane && pane.style && pane.style.zIndex){
        const pz = parseInt(pane.style.zIndex, 10);
        if(!isNaN(pz)) z = pz;
      }
      // Vetor SVG/canvas: tenta pegar do parent do path
      if(!z && layer && layer._path && layer._path.parentNode && layer._path.parentNode.style.zIndex){
        const pz = parseInt(layer._path.parentNode.style.zIndex, 10);
        if(!isNaN(pz)) z = pz;
      }
      // Fallback: ordem de inserção (id numérico crescente ≈ mais antigo embaixo)
      if(!z && layer && layer._leaflet_id){
        z = layer._leaflet_id;
      }
    }catch(_){}
    return z;
  }

  // Reconstruir ORDER a partir do estado real do mapa
  function pullOrderFromMap(){
    const m = mapRef();
    if(!m) return;
    const items = [];
    for(const [id, entry] of REG){
      if(entry && entry.layer){
        items.push({ id, entry, z: effectiveZ(entry.layer, m) });
      }
    }
    // sort por z ASC e depois por existência no mapa (camadas não visíveis devem aparecer mas manter posição relativa)
    items.sort((a,b)=> a.z - b.z);
    ORDER = items.map(it => it.id);
    window.__AGRO_ORDER = ORDER;
    // Sincroniza UI se disponível
    if(window.AGRO_LAYERS_UI && window.AGRO_LAYERS_UI.sync) window.AGRO_LAYERS_UI.sync();
  }
  window.__AGRO_pullOrderFromMap = pullOrderFromMap;

  // Hook: quando adicionar/remover camada no mapa → puxa ordem real
  setTimeout(()=>{
    const m = mapRef(); if(!m) return;
    m.on('layeradd', ()=> setTimeout(pullOrderFromMap, 0));
    m.on('layerremove', ()=> setTimeout(pullOrderFromMap, 0));
    // primeira sincronização (inclui basemap/overlays iniciais)
    setTimeout(pullOrderFromMap, 400);
  }, 800);

  // Também puxe ao terminar reordenação manual (UI ↑/↓ chama rebuildZOrder, mas aqui revalida)
  window.addEventListener('agro-rebuilt-z', ()=> setTimeout(pullOrderFromMap, 0));
})();


;


// === STACKING MANAGER: última camada importada sempre por cima ===
(function(){
  // Base z-index for our imports; higher than common tile/overlay defaults
  let Z = 600; // starts above default overlay panes
  function mapRef(){ return window.__leafletMap; }

  // Ensure we patch map after it exists
  function setup(){
    const m = mapRef();
    if(!m) { setTimeout(setup, 300); return; }

    function lift(layer){
      try {
        const paneName = 'agro-stack-' + (++Z);
        const pane = m.getPane(paneName) || m.createPane(paneName);
        pane.style.zIndex = String(Z);
        if(layer && layer.options){ layer.options.pane = paneName; }
        if(typeof layer.setZIndex === 'function'){ layer.setZIndex(Z); }
        // re-add to apply pane change
        if(m.hasLayer(layer)){ m.removeLayer(layer); }
        layer.addTo(m);
      } catch(e){ /* ignore */ }
    }

    // Any time a layer is added, move it to the topmost pane
    m.on('layeradd', function(ev){
      const layer = ev.layer;
      lift(layer);
    });
  }
  setup();
})();


;


// === STRICT IMPORT ORDER STACKING ===
// Atribui uma ordem incremental a cada layer quando aparece (primeiro=baixo, último=topo).
// Força z-index via panes individuais, funcionando para tiles e vetores.
(function(){
  let ORDERCTR = 0;
  const BASE_Z = 700; // acima do overlayPane padrão

  function mapRef(){ return window.__leafletMap; }

  function applyZForAll(){
    const m = mapRef(); if(!m) return;
    const list = [];
    const layers = m._layers || {};
    Object.keys(layers).forEach(k => {
      const lyr = layers[k];
      if(!lyr) return;
      if(lyr.__agroOrder == null) return; // só mexe nas camadas importadas
      list.push(lyr);
    });
    // sort by __agroOrder ASC (mais antigo embaixo)
    list.sort((a,b)=> (a.__agroOrder||0) - (b.__agroOrder||0));
    list.forEach((lyr, idx) => {
      const z = BASE_Z + idx + 1;
      try {
        // prefer setZIndex quando existir (Tile/Grid)
        if(typeof lyr.setZIndex === 'function'){
          lyr.setZIndex(z);
        }
        // garantir pane dedicado (para vetores/overlays)
        const m = mapRef();
        const paneName = 'agro-order-' + z;
        const pane = m.getPane(paneName) || m.createPane(paneName);
        pane.style.zIndex = String(z);
        if(lyr.options){ lyr.options.pane = paneName; }
        if(lyr._setPane){ lyr._setPane(paneName); }
        // re-add para aplicar mudanças de pane
        if(m.hasLayer(lyr)){ m.removeLayer(lyr); }
        lyr.addTo(m);
        if(lyr.bringToFront){ lyr.bringToFront(); }
      } catch(e){ /* ignore */ }
    });
  }

  function onLayerAdd(ev){
    const lyr = ev.layer;
    // atribui ordem apenas se for novo (não reconta ao readd)
    if(lyr.__agroOrder == null){
      ORDERCTR += 1;
      lyr.__agroOrder = ORDERCTR;
    }
    // aplica z-index para todos garantindo consistência
    setTimeout(applyZForAll, 0);
  }

  function setup(){
    const m = mapRef();
    if(!m){ setTimeout(setup, 300); return; }
    // registra existentes (mantém ordem atual como base)
    const layers = m._layers || {};
    Object.keys(layers).forEach(k => {
      const lyr = layers[k];
      if(lyr && lyr.__agroOrder == null){
        ORDERCTR += 1;
        lyr.__agroOrder = ORDERCTR;
      }
    });
    applyZForAll();

    // hook events
    m.on('layeradd', onLayerAdd);
    m.on('layerremove', function(ev){
      // ao remover, apenas reaplica z para fechar buracos na sequência
      setTimeout(applyZForAll, 0);
    });
  }
  setup();
})();


;


// === STACKING RULES: "Carta/Mapa" sempre acima de Shapes/KML ===
// - Detecta "cartas/mapas" (image overlays de PDF renderizado, tile layers de imagery, ou nome contendo 'Carta'/'Mapa')
// - Garante que essas camadas fiquem SEMPRE por cima. Entre si, respeitam ordem de importação.
// - Shapes/KML/GeoJSON/VectorGrid ficam abaixo, respeitando ordem de importação.
(function(){
  let ORDERCTR = 0;
  const BASE_OTHER = 900;   // base para shapes/KML/etc.
  const BASE_CARTA = 1900;  // base para cartas/mapas (sempre acima)
  function mapRef(){ return window.__leafletMap; }

  function kindOf(layer){
    try{
      if(layer.__agroKind) return layer.__agroKind;
      // Heurística:
      // 1) ImageOverlay (muito comum para "Carta" PDF rasterizada)
      if(typeof L.ImageOverlay !== 'undefined' && layer instanceof L.ImageOverlay) return layer.__agroKind='carta';
      // 2) TileLayer de imagery / mapserver / raster
      if(typeof L.TileLayer !== 'undefined' && layer instanceof L.TileLayer){
        const url = (layer._url||'').toLowerCase();
        if(url.includes('mapserver') || url.includes('world_imagery') || url.includes('google') || url.includes('tile') || url.match(/\.(png|jpg|jpeg|webp)$/)) {
          return layer.__agroKind='carta';
        }
      }
      // 3) Nome/pane marcado
      const nm = ((layer.options&&layer.options.name)||layer.options?.pane||'').toString().toLowerCase();
      if(nm.includes('carta') || nm.includes('mapa') || nm.includes('mps') || nm.includes('pdf')) return layer.__agroKind='carta';
      // 4) VectorGrid/GeoJSON/KML etc. => outros
      return layer.__agroKind='outro';
    }catch(_){ return 'outro'; }
  }

  function zFor(layer, idxCarta, idxOutro){
    const k = kindOf(layer);
    if(k==='carta') return BASE_CARTA + idxCarta + 1;
    return BASE_OTHER + idxOutro + 1;
  }

  function applyZ(){
    const m = mapRef(); if(!m) return;
    // Coletar camadas importadas (tem __agroOrder setado)
    const cartas = [];
    const outros = [];
    const layers = m._layers || {};
    Object.keys(layers).forEach(k => {
      const lyr = layers[k];
      if(!lyr || lyr.__agroOrder==null) return;
      if(kindOf(lyr)==='carta') cartas.push(lyr); else outros.push(lyr);
    });
    // ordenar por ordem de importação (mais antigo primeiro)
    cartas.sort((a,b)=> (a.__agroOrder||0)-(b.__agroOrder||0));
    outros.sort((a,b)=> (a.__agroOrder||0)-(b.__agroOrder||0));
    // aplicar z; "outros" primeiro (embaixo), "cartas" depois (em cima)
    outros.forEach((lyr, i)=> applyLayerZ(lyr, zFor(lyr, 0, i)));
    cartas.forEach((lyr, i)=> applyLayerZ(lyr, zFor(lyr, i, 0)));
  }

  function applyLayerZ(layer, z){
    try{
      const m = mapRef(); if(!m) return;
      const paneName = 'agro-z-' + z;
      const pane = m.getPane(paneName) || m.createPane(paneName);
      pane.style.zIndex = String(z);
      if(layer.options){ layer.options.pane = paneName; }
      if(typeof layer.setZIndex === 'function'){ layer.setZIndex(z); }
      if(layer._setPane){ layer._setPane(paneName); }
      // re-add para aplicar o pane
      if(m.hasLayer(layer)){ m.removeLayer(layer); }
      layer.addTo(m);
      if(layer.bringToFront && kindOf(layer)==='carta'){ layer.bringToFront(); }
    }catch(_){}
  }

  function onLayerAdd(ev){
    const lyr = ev.layer;
    if(lyr.__agroOrder == null){
      ORDERCTR += 1;
      lyr.__agroOrder = ORDERCTR;
    }
    setTimeout(applyZ, 0);
  }

  function setup(){
    const m = mapRef();
    if(!m){ setTimeout(setup, 300); return; }
    // marcar existentes
    const layers = m._layers || {};
    Object.keys(layers).forEach(k => {
      const lyr = layers[k];
      if(lyr && lyr.__agroOrder==null){ ORDERCTR += 1; lyr.__agroOrder = ORDERCTR; }
    });
    applyZ();
    m.on('layeradd', onLayerAdd);
    m.on('layerremove', ()=> setTimeout(applyZ, 0));
  }
  setup();
})();


;


(function(){
  function ensurePanes(map){
    if(!map) return;
    if(!map.getPane('agro-carta-pane')){
      const p = map.createPane('agro-carta-pane');
      p.classList.add('agro-carta-pane'); p.style.zIndex = '10000';
    } else { map.getPane('agro-carta-pane').style.zIndex = '10000'; }
    if(!map.getPane('agro-below-carta')){
      const q = map.createPane('agro-below-carta');
      q.classList.add('agro-below-carta'); q.style.zIndex = '5000';
    } else { map.getPane('agro-below-carta').style.zIndex = '5000'; }
  }

  // ImageOverlay (Carta) -> sempre no topo
  if(window.L && L.ImageOverlay && !L.ImageOverlay.__agroCartaTop){
    const _init  = L.ImageOverlay.prototype.initialize;
    const _onAdd = L.ImageOverlay.prototype.onAdd;
    L.ImageOverlay.prototype.initialize = function(url, bounds, options){
      options = options || {};
      options.pane = 'agro-carta-pane';
      options.zIndex = 10000;
      return _init.call(this, url, bounds, options);
    };
    L.ImageOverlay.prototype.onAdd = function(map){
      ensurePanes(map);
      const r = _onAdd.call(this, map);
      try { if(this.setZIndex) this.setZIndex(10000); if(this.bringToFront) this.bringToFront(); } catch(_){}
      return r;
    };
    L.ImageOverlay.__agroCartaTop = true;
  }

  // Forçar todas as OUTRAS layers para o pane abaixo
  function forceBelow(layer, map){
    try{
      if(!layer) return;
      if(typeof L.ImageOverlay !== 'undefined' && (layer instanceof L.ImageOverlay)) return;
      layer.options = layer.options || {};
      layer.options.pane = 'agro-below-carta';
      if(typeof layer.setZIndex === 'function'){ layer.setZIndex(5000); }
      if(layer._setPane){ layer._setPane('agro-below-carta'); }
      if(map){
        const has = map.hasLayer(layer);
        if(has) map.removeLayer(layer);
        layer.addTo(map);
      }
    }catch(_){}
  }

  function wire(){
    const map = window.__leafletMap;
    if(!map){ setTimeout(wire, 300); return; }
    ensurePanes(map);

    // ajustar existentes
    const layers = map._layers || {};
    for(const k in layers){ forceBelow(layers[k], map); }

    map.on('layeradd', function(e){
      const lyr = e.layer;
      ensurePanes(map);
      // se for carta, mover pro pane topo; senão, pane abaixo
      if(typeof L.ImageOverlay !== 'undefined' && (lyr instanceof L.ImageOverlay)){
        try{
          lyr.options = lyr.options || {};
          lyr.options.pane = 'agro-carta-pane';
          if(map.hasLayer(lyr)) map.removeLayer(lyr);
          lyr.addTo(map);
          if(lyr.setZIndex)    lyr.setZIndex(10000);
          if(lyr.bringToFront) lyr.bringToFront();
        }catch(_){}
      } else {
        forceBelow(lyr, map);
      }
    });
  }
  wire();

  // envolver L.geoJSON e VectorGrid para já nascerem no pane abaixo
  try{
    if(window.L && L.geoJSON && !L.__agroGeoPaneWrapped){
      const OG = L.geoJSON;
      L.geoJSON = function(data, options){
        options = options || {};
        options.pane = 'agro-below-carta';
        const layer = OG.call(this, data, options);
        try{ if(layer.setZIndex) layer.setZIndex(5000); }catch(_){}
        return layer;
      };
      L.__agroGeoPaneWrapped = true;
    }
  }catch(_){}

  try{
    if(window.L && L.vectorGrid && !L.vectorGrid.__agroPaneWrapped){
      const slicerOG = L.vectorGrid.slicer;
      L.vectorGrid.slicer = function(geojson, options){
        options = options || {};
        options.pane = 'agro-below-carta';
        const layer = slicerOG.call(this, geojson, options);
        try{ if(layer.setZIndex) layer.setZIndex(5000); }catch(_){}
        return layer;
      };
      L.vectorGrid.__agroPaneWrapped = true;
    }
  }catch(_){}
})();


;


// === CARTA > TUDO: força L.TileLayer e L.ImageOverlay no topo; todo o resto abaixo ===
(function(){
  function ensurePanes(map){
    if(!map) return;
    if(!map.getPane('agro-carta-pane')){
      const p = map.createPane('agro-carta-pane'); p.classList.add('agro-carta-pane'); p.style.zIndex='100000';
    } else { map.getPane('agro-carta-pane').style.zIndex='100000'; }
    if(!map.getPane('agro-below-carta')){
      const q = map.createPane('agro-below-carta'); q.classList.add('agro-below-carta'); q.style.zIndex='5000';
    } else { map.getPane('agro-below-carta').style.zIndex='5000'; }
  }

  function isCarta(layer){
    try{
      if(typeof L.ImageOverlay !== 'undefined' && layer instanceof L.ImageOverlay) return true;
      if(typeof L.TileLayer    !== 'undefined' && layer instanceof L.TileLayer)    return true;
    }catch(_){}
    return false;
  }

  // Wrap genérico em L.Layer.addTo para setar pane/zIndex ANTES de adicionar
  if(window.L && L.Layer && !L.Layer.__agroPaneWrapped){
    const _addTo = L.Layer.prototype.addTo;
    L.Layer.prototype.addTo = function(map){
      try{
        ensurePanes(map);
        if(isCarta(this)){
          this.options = this.options || {};
          this.options.pane = 'agro-carta-pane';
          if(typeof this.setZIndex === 'function') this.setZIndex(100000);
        } else {
          this.options = this.options || {};
          this.options.pane = 'agro-below-carta';
          if(typeof this.setZIndex === 'function') this.setZIndex(5000);
        }
      }catch(_){}
      const r = _addTo.call(this, map);
      try{
        if(isCarta(this) && this.bringToFront) this.bringToFront();
      }catch(_){}
      return r;
    };
    L.Layer.__agroPaneWrapped = true;
  }

  // Fallback: varrer já existentes e corrigir
  function fixExisting(){
    const map = window.__leafletMap;
    if(!map) return;
    ensurePanes(map);
    const layers = map._layers || {};
    for(const k in layers){
      const lyr = layers[k];
      if(!lyr) continue;
      try{
        if(isCarta(lyr)){
          lyr.options = lyr.options || {};
          lyr.options.pane = 'agro-carta-pane';
          if(map.hasLayer(lyr)) map.removeLayer(lyr);
          lyr.addTo(map);
          if(lyr.setZIndex)    lyr.setZIndex(100000);
          if(lyr.bringToFront) lyr.bringToFront();
        } else {
          lyr.options = lyr.options || {};
          lyr.options.pane = 'agro-below-carta';
          if(map.hasLayer(lyr)) map.removeLayer(lyr);
          lyr.addTo(map);
          if(lyr.setZIndex)    lyr.setZIndex(5000);
        }
      }catch(_){}
    }
  }

  // Liga também nos eventos para subcamadas de grupos/cluster
  function wireMap(){
    const map = window.__leafletMap;
    if(!map){ setTimeout(wireMap, 400); return; }
    ensurePanes(map);
    map.on('layeradd', function(e){
      const lyr = e.layer;
      try{
        if(isCarta(lyr)){
          lyr.options = lyr.options || {};
          lyr.options.pane = 'agro-carta-pane';
          if(map.hasLayer(lyr)) map.removeLayer(lyr);
          lyr.addTo(map);
          if(lyr.setZIndex)    lyr.setZIndex(100000);
          if(lyr.bringToFront) lyr.bringToFront();
        } else {
          lyr.options = lyr.options || {};
          lyr.options.pane = 'agro-below-carta';
          if(map.hasLayer(lyr)) map.removeLayer(lyr);
          lyr.addTo(map);
          if(lyr.setZIndex)    lyr.setZIndex(5000);
        }
      }catch(_){}
    });
  }

  setTimeout(fixExisting, 500);
  window.addEventListener('load', ()=> setTimeout(fixExisting, 0));
  wireMap();
})();


;


// === CARTA NO TOPO (detecção ampla) ===
(function(){
  function ensurePanes(map){
    if(!map) return;
    const c = map.getPane('agro-carta-pane') || map.createPane('agro-carta-pane');
    c.classList.add('agro-carta-pane'); c.style.zIndex = '2147483600';
    const b = map.getPane('agro-below-carta') || map.createPane('agro-below-carta');
    b.classList.add('agro-below-carta'); b.style.zIndex = '1000';
  }

  function isCarta(lyr){
    try{
      if (!lyr) return false;
      // 1) ImageOverlay clássico
      if (window.L && L.ImageOverlay && lyr instanceof L.ImageOverlay) return true;
      // 2) Duck-typing: possui _image (IMG/CANVAS) típico de overlay raster
      if (lyr._image && (lyr._image.tagName === 'IMG' || lyr._image.tagName === 'CANVAS')) return true;
      // 3) Overlay raster com URL e bounds (não é GridLayer/TileLayer)
      if (lyr._url && typeof lyr.getBounds === 'function' && typeof lyr.getTileSize !== 'function') return true;
      // 4) Nome/pane sugerindo carta
      const nm = ((lyr.options && (lyr.options.name || lyr.options.pane)) || '').toString().toLowerCase();
      if (/(carta|mapa|pdf)/i.test(nm)) return true;
    } catch(_) {}
    return false;
  }

  function forceCarta(lyr, map){
    try{
      if(!lyr) return;
      lyr.options = lyr.options || {};
      lyr.options.pane = 'agro-carta-pane';
      const had = map.hasLayer(lyr);
      if(had) map.removeLayer(lyr);
      lyr.addTo(map);
      if(lyr.setZIndex) lyr.setZIndex(2147483600);
      if(lyr.bringToFront) lyr.bringToFront();
    }catch(_){}
  }

  function forceBelow(lyr, map){
    try{
      if(!lyr) return;
      lyr.options = lyr.options || {};
      lyr.options.pane = 'agro-below-carta';
      const had = map.hasLayer(lyr);
      if(had) map.removeLayer(lyr);
      lyr.addTo(map);
      if(lyr.setZIndex) lyr.setZIndex(1000);
    }catch(_){}
  }

  // Intercepta addTo de TODAS as layers
  if(window.L && L.Layer && !L.Layer.__agroCartaWrap2){
    const _addTo = L.Layer.prototype.addTo;
    L.Layer.prototype.addTo = function(map){
      try{ ensurePanes(map); }catch(_){}
      if (isCarta(this)) {
        try { this.options = this.options || {}; this.options.pane = 'agro-carta-pane'; } catch(_){}
      } else {
        try { this.options = this.options || {}; this.options.pane = 'agro-below-carta'; } catch(_){}
      }
      const r = _addTo.call(this, map);
      try {
        if (isCarta(this)) {
          if (this.setZIndex) this.setZIndex(2147483600);
          if (this.bringToFront) this.bringToFront();
          // Em alguns plugins, o elemento é criado depois: observar e reajustar
          const el = (this.getElement && this.getElement()) || this._image || null;
          if (el && el.parentElement && el.parentElement.parentElement){
            el.parentElement.parentElement.style.zIndex = '2147483600';
          }
        } else {
          if (this.setZIndex) this.setZIndex(1000);
        }
      } catch(_){}
      return r;
    };
    L.Layer.__agroCartaWrap2 = true;
  }

  function wireMap(){
    const map = window.__leafletMap;
    if(!map){ setTimeout(wireMap, 400); return; }
    ensurePanes(map);

    // Ajusta camadas já existentes
    const layers = map._layers || {};
    for(const k in layers){
      const lyr = layers[k];
      if(isCarta(lyr)) forceCarta(lyr, map);
      else forceBelow(lyr, map);
    }

    // Qualquer layer adicionada
    map.on('layeradd', function(e){
      const lyr = e.layer;
      if(isCarta(lyr)) forceCarta(lyr, map);
      else forceBelow(lyr, map);
    });

    // Observa mutações no container para corrigir z-index de elementos tardios
    const container = map.getPanes().overlayPane.parentElement;
    const mo = new MutationObserver(()=>{
      try {
        const cartaPane = map.getPane('agro-carta-pane');
        if(cartaPane) cartaPane.style.zIndex = '2147483600';
      } catch(_){}
    });
    mo.observe(container, {childList:true, subtree:true});
  }
  wireMap();
})();


;


(function(){
  var MODE = 'top';
  function isCarta(layer){
    try{
      if (window.L && L.ImageOverlay && layer instanceof L.ImageOverlay) return true;
      if (layer && layer._image && (layer._image.tagName==='IMG' || layer._image.tagName==='CANVAS')) return true;
      const nm = ((layer && layer.options && (layer.options.name || layer.options.pane)) || '').toString().toLowerCase();
      if (/(carta|mapa|mps|pdf)/.test(nm)) return true;
    }catch(_){}
    return false;
  }
  function ensurePanes(map){
    if(!map) return;
    if(!map.getPane('agro-pane-high')) map.createPane('agro-pane-high').classList.add('agro-pane-high');
    if(!map.getPane('agro-pane-low'))  map.createPane('agro-pane-low').classList.add('agro-pane-low');
    var high = map.getPane('agro-pane-high'); var low = map.getPane('agro-pane-low');
    if(MODE==='top'){ high.style.zIndex='2000000000'; low.style.zIndex='1000000000'; }
    else { high.style.zIndex='1000000000'; low.style.zIndex='2000000000'; }
  }
  function placeLayer(layer, map){
    try{
      if(!layer) return;
      var carta = isCarta(layer);
      var goHigh = (MODE==='top') ? carta : !carta;
      var pane = goHigh ? 'agro-pane-high' : 'agro-pane-low';
      layer.options = layer.options || {}; layer.options.pane = pane;
      var onMap = map.hasLayer(layer); if(onMap) map.removeLayer(layer); layer.addTo(map);
      if(typeof layer.setZIndex==='function') layer.setZIndex(goHigh?2000000000:1000000000);
      if(goHigh && layer.bringToFront) layer.bringToFront();
    }catch(_){}
  }
  function reapplyAll(map){
    if(!map) return; ensurePanes(map);
    var Ls = map._layers || {}; Object.keys(Ls).forEach(k=> placeLayer(Ls[k], map));
  }
  function wrapAddTo(){
    if(!window.L || !L.Layer || L.Layer.__agroCartaModeWrapped) return;
    var _addTo = L.Layer.prototype.addTo;
    L.Layer.prototype.addTo = function(map){
      ensurePanes(map);
      var carta = isCarta(this);
      var goHigh = (MODE==='top') ? carta : !carta;
      this.options = this.options || {}; this.options.pane = goHigh?'agro-pane-high':'agro-pane-low';
      var r = _addTo.call(this, map);
      try{
        if(typeof this.setZIndex==='function') this.setZIndex(goHigh?2000000000:1000000000);
        if(goHigh && this.bringToFront) this.bringToFront();
      }catch(_){}
      return r;
    };
    L.Layer.__agroCartaModeWrapped = true;
  }
  function wireUI(map){
    var box = document.getElementById('agro-carta-toggle'); if(!box) return;
    box.hidden = false;
    var btnTop = // agro-btn-top removido;

    var btnBot = document.getElementById('agro-btn-bottom');
    function sync(){ btnTop.classList.toggle('active', MODE==='top'); btnBot.classList.toggle('active', MODE==='bottom'); }
    btnTop.onclick = function(){ MODE='top'; ensurePanes(map); reapplyAll(map); sync(); };
    btnBot.onclick = function(){ MODE='bottom'; ensurePanes(map); reapplyAll(map); sync(); };
    sync();
  }
  (function init(){
    var t = setInterval(function(){
      var map = window.__leafletMap;
      if(map && window.L){
        clearInterval(t);
        ensurePanes(map); wrapAddTo(); wireUI(map); reapplyAll(map);
        map.on('layeradd', e=> placeLayer(e.layer, map));
        map.on('layerremove', ()=> ensurePanes(map));
      }
    }, 200);
  })();
})();


;


(function(){
  function wireCartaToggle(){
    try{
      var btnTop = // agro-btn-top removido;

      var btnBottom = document.getElementById('agro-btn-bottom');
      var mapPane = null;
      if (window.E && E.map && E.map.getPane) mapPane = E.map.getPane('agro-carta');
      if (!mapPane) mapPane = document.querySelector('.leaflet-pane#agro-carta') || document.getElementById('agro-carta');
      if (!mapPane || (!btnTop && !btnBottom)) { setTimeout(wireCartaToggle, 300); return; }
      function setMode(mode){
        if(mode==='top'){
          mapPane.style.zIndex = '2147483600';
          mapPane.style.pointerEvents = 'auto';
          if (btnTop) btnTop.classList.add('active');
          if (btnBottom) btnBottom.classList.remove('active');
        } else {
          mapPane.style.zIndex = '350';
          mapPane.style.pointerEvents = 'auto';
          if (btnBottom) btnBottom.classList.add('active');
          if (btnTop) btnTop.classList.remove('active');
        }
        try {
          if (window.E && E.pdfLayers) Object.values(E.pdfLayers).forEach(function(ov){ if (ov && ov.bringToFront) ov.bringToFront(); });
        } catch(_){}
      }
      if (btnTop) btnTop.onclick = function(){ setMode('top'); };
      if (btnBottom) btnBottom.onclick = function(){ setMode('bottom'); };
      setMode('top');
    }catch(_){ setTimeout(wireCartaToggle, 300); }
  }
  setTimeout(wireCartaToggle, 500);
})();


;


(function(){
  var Panel = {
    fab: null, box: null, list: null, header: null,
    layers: [], // {id, name, layer, kind:'pdf'|'vector', visible:true}
    idseq: 1
  };

  function $(id){ return document.getElementById(id); }

  function initPanel(){
    Panel.fab = $('layersFab'); Panel.box = $('layersPanel'); Panel.list = $('layersList'); Panel.header = $('layersHeader');
    if(!Panel.fab || !Panel.box) return;

    Panel.fab.onclick = function(){ Panel.box.style.display = (Panel.box.style.display==='none' || !Panel.box.style.display) ? 'block' : 'none'; render(); };
    $('layersClose').onclick = function(){ Panel.box.style.display = 'none'; };

    // Drag panel
    (function drag(el, handle){
      var sx=0, sy=0, ox=0, oy=0, dg=false;
      handle.addEventListener('mousedown', function(e){
        dg=true; el.classList.add('dragging'); sx=e.clientX; sy=e.clientY; var r=el.getBoundingClientRect(); ox=r.left; oy=r.top;
        function mm(ev){ if(!dg) return; el.style.left=(ox+(ev.clientX-sx))+'px'; el.style.top=(oy+(ev.clientY-sy))+'px'; el.style.transform=''; }
        function mu(){ dg=false; el.classList.remove('dragging'); document.removeEventListener('mousemove',mm); document.removeEventListener('mouseup',mu); }
        document.addEventListener('mousemove',mm); document.addEventListener('mouseup',mu);
      });
    })(Panel.box, Panel.header);
  }

  function addLayer(name, layer, kind){
    try{
      if(!layer) return;
      var id = 'lyr_'+(Panel.idseq++);
      Panel.layers.push({ id:id, name:name, layer:layer, kind:kind||'vector', visible:true });
      render();
    }catch(e){ console.warn(e); }
  }

  function removeLayerItem(id){
    var idx = Panel.layers.findIndex(function(x){ return x.id===id; });
    if(idx>=0){
      var it = Panel.layers[idx];
      try{
        if(it.kind==='pdf'){ if(window.E && E.map && it.layer){ E.map.removeLayer(it.layer); } }
        else { if(it.layer && it.layer.remove) it.layer.remove(); }
      }catch(_){}
      Panel.layers.splice(idx,1);
      render();
    }
  }

  function setVisible(id, vis){
    var it = Panel.layers.find(function(x){ return x.id===id; });
    if(!it) return;
    it.visible = !!vis;
    try{
      if(it.kind==='pdf' && it.layer && it.layer.setOpacity){
        it.layer.setOpacity(vis? (it.layer._opacity||1) : 0);
      }else if(it.kind==='vector'){
        if (it.layer.eachLayer){
          it.layer.eachLayer(function(l){
            try{
              if(l.setStyle){ l.setStyle({opacity: vis? (l.options.opacity ?? 1) : 0, fillOpacity: vis? (l.options.fillOpacity ?? 0.25) : 0}); }
              if(l.setOpacity){ l.setOpacity(vis? (l.options.opacity ?? 1) : 0); }
              if(l._icon){ l._icon.style.display = vis? '' : 'none'; }
              if(l._path){ l._path.style.display = vis? '' : 'none'; }
            }catch(_){}
          });
        }else{
          if(it.layer.setStyle){ it.layer.setStyle({opacity: vis? (it.layer.options.opacity ?? 1) : 0, fillOpacity: vis? (it.layer.options.fillOpacity ?? 0.25) : 0}); }
          if(it.layer.setOpacity){ it.layer.setOpacity(vis? (it.layer.options.opacity ?? 1) : 0); }
        }
      }
    }catch(_){}
  }

  function reorder(id, dir){
    // dir: 'up' => sobe (fica mais acima), 'down' => desce
    var idx = Panel.layers.findIndex(function(x){ return x.id===id; });
    if(idx<0) return;
    var swapWith = dir==='up' ? idx+1 : idx-1;
    if(swapWith<0 || swapWith>=Panel.layers.length) return;
    var tmp = Panel.layers[idx]; Panel.layers[idx] = Panel.layers[swapWith]; Panel.layers[swapWith] = tmp;
    applyOrder(); render();
  }

  function applyOrder(){
    // PDFs: ajusta zIndex dentro do pane 'agro-carta' usando style.zIndex incremental
    var z = 1000;
    Panel.layers.filter(function(x){ return x.kind==='pdf'; }).forEach(function(it){
      try{
        var el = it.layer && it.layer.getElement && it.layer.getElement();
        if(el){ z += 5; el.style.zIndex = String(z); }
      }catch(_){}
    });

    // Vetores: reempilha chamando bringToFront em ordem (último no topo)
    Panel.layers.filter(function(x){ return x.kind==='vector'; }).forEach(function(it){
      try{
        if(it.layer && it.layer.bringToFront) it.layer.bringToFront();
        else if(it.layer && it.layer.eachLayer){
          it.layer.eachLayer(function(l){ if(l.bringToFront) l.bringToFront(); });
        }
      }catch(_){}
    });
  }

  function render(){
    if(!Panel.list) return;
    Panel.list.innerHTML = '';
    // Mostra primeiro PDFs (topo), depois vetores (abaixo)
    var arr = Panel.layers.slice();
    arr.sort(function(a,b){
      if(a.kind===b.kind) return 0;
      return a.kind==='pdf' ? -1 : 1;
    });
    arr.forEach(function(it, i){
      var row = document.createElement('div');
      row.className = 'layer-item';
      row.innerHTML = ''
       + '<button class="eye" title="Visibilidade">'+(it.visible? '👁️' : '🚫')+'</button>'
       + '<div class="name" title="'+it.name+'">'+it.name+'<span class="kind">'+(it.kind==='pdf'?'[PDF]':'[Dados]')+'</span></div>'
       + '<div class="rowbtns">'
       + '  <button class="up" title="Subir">▲</button>'
       + '  <button class="down" title="Descer">▼</button>'
       + '  <button class="del" title="Remover">🗑️</button>'
       + '</div>';
      Panel.list.appendChild(row);
      var eye = row.querySelector('.eye'), up = row.querySelector('.up'), down = row.querySelector('.down'), del = row.querySelector('.del');
      eye.onclick = function(){ setVisible(it.id, !it.visible); render(); };
      up.onclick = function(){ reorder(it.id, 'up'); };
      down.onclick = function(){ reorder(it.id, 'down'); };
      del.onclick = function(){ removeLayerItem(it.id); };
    });
  }

  // ============ HOOKS ============
  function tryWire(){
    if(!(window.E && E.map)){ setTimeout(tryWire, 300); return; }
    initPanel();

    // Quando um layer é adicionado, tente registrar (apenas se for interessante)
    E.map.on('layeradd', function(ev){
      try{
        var lyr = ev.layer;
        // ImageOverlay => PDF (assumimos carta)
        if (window.L && L.ImageOverlay && (lyr instanceof L.ImageOverlay)) {
          // tenta achar um nome conhecido
          var name = 'Carta PDF';
          // se veio de E.pdfLayers, tente chave
          if (window.E && E.pdfLayers) {
            for (var k in E.pdfLayers) { if (E.pdfLayers[k] === lyr) { name = k; break; } }
          }
          // Não duplique
          if (!Panel.layers.some(function(x){ return x.layer===lyr; })) addLayer(name, lyr, 'pdf');
          applyOrder(); render();
          return;
        }
        // GeoJSON/FeatureGroup => dados
        if (lyr && (lyr.getLayers || lyr.toGeoJSON || lyr instanceof L.FeatureGroup)) {
          // Evitar registrar grupos internos do Draw
          var name = lyr.options && lyr.options.name || 'Camada dados';
          // Não duplique
          if (!Panel.layers.some(function(x){ return x.layer===lyr; })) addLayer(name, lyr, 'vector');
          applyOrder(); render();
        }
      }catch(e){ console.warn(e); }
    });

    // se já existirem PDFs carregados antes do hook
    if (E.pdfLayers){
      Object.keys(E.pdfLayers).forEach(function(nm){
        var lyr = E.pdfLayers[nm];
        if(lyr && !Panel.layers.some(function(x){ return x.layer===lyr; })) addLayer(nm, lyr, 'pdf');
      });
      applyOrder(); render();
    }
  }
  tryWire();
})();


;


(function(){
  // util: run when DOM ready
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function waitFor(pred, cb, timeoutMs=60000, intervalMs=250){
    const t0 = Date.now();
    const it = setInterval(()=>{
      try{
        if (pred()){
          clearInterval(it); cb();
        }else if (Date.now()-t0 > timeoutMs){
          clearInterval(it);
          console.warn('Camadas: tempo esgotado aguardando mapa.');
        }
      }catch{}
    }, intervalMs);
  }
  ready(function(){
    waitFor(()=>{
      return window.L && document.getElementById('map') && !!document.querySelector('.leaflet-pane');
    }, function initLayersUI(){
      // tentar obter o mapa existente; vários códigos expõem como E.map
      let map = (window.E && E.map) ? E.map : null;
      // fallback: tentar achar via _leaflet_id nos panes
      if(!map){
        // Hack: varrer objetos globais à procura de um L.Map
        for (const k of Object.getOwnPropertyNames(window)){
          const v = window[k];
          if(v && v instanceof Object && v.addLayer && v.getPane && v.dragging && v.setView && v.fitBounds){
            // heurística de L.Map
            map = v; break;
          }
        }
      }
      if(!map){ console.warn('Camadas: mapa não encontrado'); return; }
      // garantir registries
      if(!window.E) window.E = {};
      if(!E.pdfLayers) E.pdfLayers = {};
      if(!E.kmlLayers) E.kmlLayers = {};
      if(!E.shpLayers) E.shpLayers = {};

      // criar panes para PDF (top/bottom)
      if (!map.getPane('pdfTop')){
        map.createPane('pdfTop');   map.getPane('pdfTop').style.zIndex = 645; // acima de overlayPane (400) e markers (600), abaixo de tooltip (650)
      }
      if (!map.getPane('pdfBottom')){
        map.createPane('pdfBottom'); map.getPane('pdfBottom').style.zIndex = 350; // abaixo de vetores
      }

      // pegar elementos
      const $ = (id)=>document.getElementById(id);
      const panel = $('layerPanel'), listEl = $('layerList'), fab = $('layerFab');
      const btnClose = $('layerClose'), btnRefresh = $('layerRefresh');
      const btnHideAll = $('layerHideAll'), btnShowAll = $('layerShowAll');
      const handle = $('layerPanelHandle');

      // tornar painel arrastável
      (function makeDraggable(box, handle){
        if(!box || !handle) return;
        let sx=0, sy=0, ox=0, oy=0, drag=false;
        const mm=(e)=>{ if(!drag) return; box.style.left = (ox + (e.clientX - sx)) + 'px'; box.style.bottom = 'auto'; box.style.top = (oy + (e.clientY - sy)) + 'px'; };
        const mu=()=>{ if(!drag) return; drag=false; box.classList.remove('dragging'); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
        handle.addEventListener('mousedown', e=>{ drag=true; box.classList.add('dragging'); sx=e.clientX; sy=e.clientY; const r=box.getBoundingClientRect(); ox=r.left; oy=r.top; document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu); });
      })(panel, handle);

      function pdfNames(){ return Object.keys(E.pdfLayers||{}); }
      function kmlNames(){ return Object.keys(E.kmlLayers||{}); }
      function shpNames(){ return Object.keys(E.shpLayers||{}); }

      // Recria overlay para mover entre panes
      function swapPdfPane(name, paneName){
        const ov = E.pdfLayers?.[name];
        if(!ov) return;
        const b = ov.getBounds();
        const url = ov._dataUrl || ov._url;
        const opacity = (typeof ov.getOpacity==='function' ? ov.getOpacity() : (ov._opacity ?? 1));
        try{ map.removeLayer(ov); }catch{}
        const klass = (ov.options && ov.options.className) ? ov.options.className : 'pdf-overlay';
        const newOv = L.imageOverlay(url, b, {opacity:opacity, pane: paneName, className: klass}).addTo(map);
        newOv._dataUrl = url; newOv._opacity = opacity;
        E.pdfLayers[name] = newOv;
        if(paneName === 'pdfTop' && newOv.bringToFront) newOv.bringToFront();
      }

      function setGroupVisible(group, visible){
        (group||[]).forEach(l=>{
          try{
            if(l.setStyle){ l.setStyle({opacity: visible? (l.options.opacity ?? 1) : 0, fillOpacity: visible? (l.options.fillOpacity ?? 0.25) : 0}); }
            if(l.setOpacity){ l.setOpacity(visible? (l.options.opacity ?? 1) : 0); }
            if(l._icon){ l._icon.style.display = visible? '' : 'none'; }
            if(l._path){ l._path.style.display = visible? '' : 'none'; }
          }catch{}
        });
      }

      function render(){
        if(!listEl) return;
        const parts = [];
        pdfNames().forEach(name=>{
          parts.push(`
            <div class="layer-item" data-kind="pdf" data-name="${name.replace(/"/g,'&quot;')}">
              <input type="checkbox" class="vis" checked title="visível">
              <div class="name"><b>[PDF]</b> ${name}</div>
              <div class="btns">
<button class="btn toBelow" title="Enviar para ABAIXO">Abaixo</button>
                <button class="btn del" title="Remover">Remover</button></div>
            </div>`);
        });
        kmlNames().forEach(name=>{
          parts.push(`
            <div class="layer-item" data-kind="kml" data-name="${name.replace(/"/g,'&quot;')}">
              <input type="checkbox" class="vis" checked title="visível">
              <div class="name"><b>[KML]</b> ${name}</div>
              <div class="btns"><button class="btn del" title="Remover">Remover</button></div>
            </div>`);
        });
        shpNames().forEach(name=>{
          parts.push(`
            <div class="layer-item" data-kind="shp" data-name="${name.replace(/"/g,'&quot;')}">
              <input type="checkbox" class="vis" checked title="visível">
              <div class="name"><b>[SHP]</b> ${name}</div>
              <div class="btns"><button class="btn del" title="Remover">Remover</button></div>
            </div>`);
        });
        listEl.innerHTML = parts.join('');

        listEl.querySelectorAll('.layer-item').forEach(row=>{
          const kind = row.getAttribute('data-kind');
          const name = row.getAttribute('data-name');
          const vis = row.querySelector('.vis');
          const btnTop = row.querySelector('.toTop');
          const btnBelow = row.querySelector('.toBelow');
          const btnDel = row.querySelector('.del');

          if(vis) vis.addEventListener('change', ()=>{
            if(kind==='pdf'){
              const ov = E.pdfLayers?.[name]; if(!ov) return;
              const op = (typeof ov.getOpacity==='function' ? ov.getOpacity() : (ov._opacity ?? 1));
              ov.setOpacity(vis.checked? op : 0);
            }else if(kind==='kml'){
              const entry = E.kmlLayers?.[name]; if(!entry) return;
              setGroupVisible(entry.layers, vis.checked); entry.visible = !!vis.checked;
            }else if(kind==='shp'){
              const pack = E.shpLayers?.[name]; if(!pack) return;
              setGroupVisible(pack, vis.checked);
            }
          });
          if(btnTop) btnTop.addEventListener('click', ()=> swapPdfPane(name,'pdfTop'));
          if(btnBelow) btnBelow.addEventListener('click', ()=> swapPdfPane(name,'pdfBottom'));
          if(btnDel) btnDel.addEventListener('click', ()=>{
            if(kind==='pdf'){
              const ov = E.pdfLayers?.[name]; if(ov){ try{map.removeLayer(ov);}catch{} delete E.pdfLayers[name]; }
            }else if(kind==='kml'){
              const entry = E.kmlLayers?.[name]; if(entry){ (entry.layers||[]).forEach(l=>{ try{ E.drawn?.removeLayer(l); }catch{} }); delete E.kmlLayers[name]; }
            }else if(kind==='shp'){
              const pack = E.shpLayers?.[name]; if(pack){ (pack||[]).forEach(l=>{ try{ E.drawn?.removeLayer(l); }catch{} }); delete E.shpLayers[name]; }
            }
            render();
          });
        });
      }

      if(fab){ fab.addEventListener('click', ()=>{ panel.style.display = (panel.style.display==='none'||!panel.style.display)?'block':'none'; if(panel.style.display==='block') render(); }); }
      if(btnClose){ btnClose.addEventListener('click', ()=> panel.style.display='none'); }
      if(btnRefresh){ btnRefresh.addEventListener('click', render); }
      if(btnHideAll){ btnHideAll.addEventListener('click', ()=>{ listEl.querySelectorAll('.layer-item .vis').forEach(c=>{ if(c.checked){ c.checked=false; c.dispatchEvent(new Event('change')); } }); }); }
      if(btnShowAll){ btnShowAll.addEventListener('click', ()=>{ listEl.querySelectorAll('.layer-item .vis').forEach(c=>{ if(!c.checked){ c.checked=true; c.dispatchEvent(new Event('change')); } }); }); }

      // PDFs já existentes: forçar ficar no topo inicialmente
      Object.keys(E.pdfLayers||{}).forEach(name=> swapPdfPane(name,'pdfTop'));

      // Observador simples: quando usuário importar novos PDFs pelo seu código,
      // eles entram em E.pdfLayers; atualizamos a UI quando o painel estiver aberto.
      const rInt = setInterval(()=>{ if(panel.style.display==='block') render(); }, 1000);
    });
  });
})();


;


(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    if(!window.L || !window.E || !E.map) return;
    const $ = (id)=>document.getElementById(id);
    const UI = { list: $('layerList'), lockPdf: $('lockPdfTop') };

    // Ensure panes for ordering
    if (!E.map.getPane('panePDF')){
      const p = E.map.createPane('panePDF'); p.style.zIndex = '2147483600'; // super topo
    }
    const vectorBaseZ = 1000;
    function paneForIndex(i){
      const id='paneVector-'+i;
      if(!E.map.getPane(id)){
        const p = E.map.createPane(id);
        p.style.zIndex = String(vectorBaseZ + i*5);
      } else {
        E.map.getPane(id).style.zIndex = String(vectorBaseZ + i*5);
      }
      return id;
    }

    // Stack = [{id,name,type,layers,visible,ts}]
    E._stack = E._stack || [];
    let nextId = E._stack.length ? Math.max(...E._stack.map(x=>parseInt((x.id||'0').replace(/\D/g,''))||0))+1 : 1;

    function ensureEntry(name, type, layers){
      if(!name || !layers || !layers.length) return;
      let it = E._stack.find(x=>x.name===name && x.type===type);
      if(!it){
        it = { id: 'L'+(nextId++), name, type, layers: layers.slice(), visible: true, ts: Date.now() };
        // Inserção respeitando PDFs no topo quando lock ativo
        if(UI.lockPdf?.checked && type==='pdf'){
          E._stack.push(it);
        } else if(UI.lockPdf?.checked && type!=='pdf'){
          const firstPdf = E._stack.findIndex(x=>x.type==='pdf');
          if(firstPdf===-1) E._stack.push(it); else E._stack.splice(firstPdf,0,it);
        } else {
          E._stack.push(it);
        }
      }else{
        // atualiza referência de layers (ex: PDF recriado ao trocar pane)
        it.layers = layers.slice();
      }
    }

    function syncFromRegistries(){
      // PDFs
      Object.entries(E.pdfLayers||{}).forEach(([name,ov])=>{
        if(ov) ensureEntry(name, 'pdf', [ov]);
      });
      // KML
      Object.entries(E.kmlLayers||{}).forEach(([name,entry])=>{
        const arr = (entry && entry.layers) ? entry.layers.filter(Boolean) : [];
        if(arr.length) ensureEntry(name, 'kml', arr);
      });
      // SHP
      Object.entries(E.shpLayers||{}).forEach(([name,arr])=>{
        const layers = Array.isArray(arr) ? arr.filter(Boolean) : [];
        if(layers.length) ensureEntry(name, 'shp', layers);
      });
    }

    function applyOrdering(){
      // Lock: PDFs sempre por último na lista lógica (que será renderizada reversed), o que os mantém no topo visual
      if(UI.lockPdf?.checked){
        const pdfs = E._stack.filter(x=>x.type==='pdf');
        const others = E._stack.filter(x=>x.type!=='pdf');
        E._stack = [...others, ...pdfs];
      }
      E._stack.forEach((item, idx)=>{
        const paneId = (item.type==='pdf') ? 'panePDF' : paneForIndex(idx);
        item.layers.forEach(l=>{
          try{
            l.options = l.options || {}; l.options.pane = paneId;
            if(E.map.hasLayer(l)){ E.map.removeLayer(l); }
            l.addTo(E.map);
            if(item.type==='pdf' && l.getElement()) l.getElement().style.zIndex='2147483600';
          }catch(e){}
        });
      });
    }

    function renderList(){
      if(!UI.list) return;
      UI.list.innerHTML='';
      const items=[...E._stack].reverse(); // topo->baixo
      items.forEach(item=>{
        const li=document.createElement('li');
        li.className='layer-item'; li.setAttribute('draggable','true'); li.dataset.id=item.id;
        li.innerHTML =
          '<span class="name" title="'+item.name+'">'+item.name+'</span>'+
          '<span class="muted">'+item.type.toUpperCase()+'</span>'+
          '<button class="eye">'+(item.visible?'👁️':'🚫')+'</button>'+
          '<i class="fa-solid fa-grip-vertical drag-handle" title="Arraste para reordenar"></i>';

        // visibilidade
        li.querySelector('.eye').addEventListener('click',()=>{
          item.visible=!item.visible;
          li.querySelector('.eye').textContent=item.visible?'👁️':'🚫';
          item.layers.forEach(l=>{
            try{ item.visible ? l.addTo(E.map) : E.map.removeLayer(l); }catch{}
          });
        });
        // zoom ao nome
        li.querySelector('.name').addEventListener('click',()=>{
          try{ const fg=L.featureGroup(item.layers); const b=fg.getBounds(); if(b && b.isValid()) E.map.fitBounds(b,{padding:[16,16]}); }catch{}
        });
        // drag n drop
        li.addEventListener('dragstart', e=>{
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.effectAllowed='move';
        });
        li.addEventListener('dragover', e=>{ e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', ()=> li.classList.remove('drag-over'));
        li.addEventListener('drop', e=>{
          e.preventDefault(); li.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          if(!draggedId || draggedId===item.id) return;
          const stack = E._stack, ui=[...stack].reverse();
          const fromUI = ui.findIndex(x=>x.id===draggedId);
          const toUI   = ui.findIndex(x=>x.id===item.id);
          const moving = stack.splice(stack.length-1-fromUI,1)[0];
          stack.splice(stack.length-1-toUI,0,moving);
          renderList(); applyOrdering();
        });

        UI.list.appendChild(li);
      });
    }

    // Hook para quando seu código importar novos dados
    function refresh(){
      syncFromRegistries();
      applyOrdering();
      renderList();
    }

    // Primeira render
    refresh();
    // Observador simples
    setInterval(refresh, 1200);

    // Checkbox lock
    if(UI.lockPdf){ UI.lockPdf.addEventListener('change', ()=>{ applyOrdering(); renderList(); }); }
  });
})();


;


/* === AGRO LAYERS UI: Lista Arrastável + Ordem de Z (patch assertivo) === */
(function(){
  'use strict';
  function mapRef(){ return window.__leafletMap || (window.L && L._lastMap) || null; }
  // Hook para capturar mapa
  if (window.L && L.Map && !L.Map.__agroHooked) {
    L.Map.__agroHooked = true;
    L.Map.addInitHook(function(){ try{ window.__leafletMap = this; }catch(_){} });
  }
  const REG = (window.AGRO_LAYERS && window.AGRO_LAYERS._REG) ? window.AGRO_LAYERS._REG : new Map();
  let ORDER = window.__AGRO_ORDER || [];
  window.__AGRO_ORDER = ORDER;
  const API = window.AGRO_LAYERS || (window.AGRO_LAYERS = {});
  API._REG = REG;

  function toList(layer){ if(!layer) return []; if(layer.eachLayer){ const arr=[]; try{layer.eachLayer(l=>arr.push(l));}catch(_){} return arr.length?arr:[layer]; } return [layer]; }
  function inferKind(layer){
    try{
      if(layer instanceof L.ImageOverlay && (layer.options && (layer.options.pane||'').includes('agro-carta'))) return 'carta';
      if(layer._image && layer.getBounds) return 'carta';
      if(layer._url && /\.pdf($|\?)/i.test(layer._url)) return 'carta';
      if(layer.feature || layer.getLatLng || layer.getBounds) return 'vetor';
    }catch(_){}
    return 'outro';
  }
  let uid = 0;
  API.registerLayer = function(layer, name, kind, id){
    const _id = id || ('L' + (++uid));
    const entry = REG.get(_id) || { id:_id, name:name||'Camada', kind:kind||inferKind(layer), layers:[], visible:true };
    toList(layer).forEach(l => entry.layers.includes(l) ? null : entry.layers.push(l));
    REG.set(_id, entry);
    if(!ORDER.includes(_id)) ORDER.push(_id);
    syncIfUI(); applyOrdering(); return _id;
  };
  API.removeById = function(id, m){ const e=REG.get(id); if(!e) return; const map=m||mapRef(); if(map){ e.layers.forEach(l=>{try{map.removeLayer(l);}catch(_){}}); } REG.delete(id); ORDER=ORDER.filter(x=>x!==id); window.__AGRO_ORDER=ORDER; syncIfUI(); applyOrdering(); };
  API.removeAll = function(){ const m=mapRef(); for(const id of Array.from(REG.keys())) API.removeById(id,m); };

  const listEl = document.getElementById('layerList');
  const lockPdfEl = document.getElementById('lockPdfTop') || document.getElementById('lockPdf');

  function setLayerZ(layer, z){
    try{
      const m = mapRef(); if(!m||!layer) return;
      const paneName = 'agro-ui-z-' + z;
      const pane = m.getPane(paneName) || m.createPane(paneName);
      pane.style.zIndex = String(z);
      if(layer.options){ layer.options.pane = paneName; }
      if(typeof layer.setZIndex === 'function'){ layer.setZIndex(z); }
      if(layer._setPane){ layer._setPane(paneName); }
      if(m.hasLayer(layer)){ m.removeLayer(layer); }
      layer.addTo(m);
      if(layer.bringToFront){ layer.bringToFront(); }
    }catch(_){}
  }

  function applyOrdering(){
    const m = mapRef(); if(!m) return;
    const lockedPdfTop = !!(lockPdfEl && lockPdfEl.checked);
    const cartas=[], outros=[];
    ORDER.forEach(id=>{ const e=REG.get(id); if(!e) return; (e.kind==='carta'?cartas:outros).push(e); });
    const BASE_OTHER = 1200, BASE_CARTA = lockedPdfTop ? 1500 : 1200;
    let z = BASE_OTHER;
    outros.forEach((e)=>{ e.layers.forEach(l=>{ try{ e.visible ? l.addTo(m) : m.removeLayer(l); }catch(_){ } setLayerZ(l, z++); }); });
    z = BASE_CARTA;
    cartas.forEach((e)=>{ e.layers.forEach(l=>{ try{ e.visible ? l.addTo(m) : m.removeLayer(l); }catch(_){ } setLayerZ(l, z++); }); });
    window.dispatchEvent(new Event('agro-rebuilt-z'));
  }
  window.__AGRO_applyOrdering = applyOrdering;

  function renderList(){
    if(!listEl) return;
    listEl.innerHTML = '';
    const items = ORDER.map(id => REG.get(id)).filter(Boolean);
    const visual = items.slice().reverse();
    visual.forEach(item=>{
      const li = document.createElement('li');
      li.className = 'layer-item';
      li.draggable = true;
      li.dataset.id = item.id;
      li.innerHTML = `
        <span class="drag-handle" title="Arraste para reordenar"><i class="fa-solid fa-grip-vertical"></i></span>
        <div class="name">${(item.name||'Camada')}</div>
        <button class="eye" title="Mostrar/ocultar">${item.visible?'👁️':'🚫'}</button>
        <button class="eye" data-del title="Remover">🗑️</button>
      `;
      li.querySelector('.eye').addEventListener('click', ()=>{
        item.visible = !item.visible;
        li.querySelector('.eye').textContent = item.visible ? '👁️':'🚫';
        item.layers.forEach(l=>{ const m=mapRef(); try{ item.visible ? l.addTo(m) : m.removeLayer(l); }catch(_){}});
        applyOrdering();
      });
      li.querySelector('[data-del]').addEventListener('click', ()=>{ API.removeById(item.id); });
      li.querySelector('.name').addEventListener('click', ()=>{
        try{ const m=mapRef(); const fg=L.featureGroup(item.layers); const b=fg.getBounds(); if(b && b.isValid()) m.fitBounds(b,{padding:[16,16]}); }catch(_){}
      });
      li.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragover', e=>{ e.preventDefault(); li.classList.add('drag-over'); });
      li.addEventListener('dragleave', ()=> li.classList.remove('drag-over'));
      li.addEventListener('drop', e=>{
        e.preventDefault(); li.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if(!draggedId || draggedId === item.id) return;
        const visualIds = ORDER.slice().reverse();
        const fromIdx = visualIds.indexOf(draggedId);
        const toIdx   = visualIds.indexOf(item.id);
        if(fromIdx<0 || toIdx<0) return;
        const arr = visualIds;
        const [moved] = arr.splice(fromIdx,1);
        arr.splice(toIdx,0,moved);
        ORDER = arr.slice().reverse();
        window.__AGRO_ORDER = ORDER;
        applyOrdering(); renderList();
      });
      listEl.appendChild(li);
    });
  }
  function syncIfUI(){ try{ renderList(); }catch(_){ } }
  function syncFromKnown(){
    const g = window; const m = mapRef(); if(!m) return;
    try{ const pdfs=(g.E && g.E.pdfLayers)?g.E.pdfLayers:(g.PDF_LAYERS||{}); Object.keys(pdfs||{}).forEach(name=>{ const lyr=pdfs[name]; const id='pdf:'+name; if(!REG.has(id)) API.registerLayer(lyr,name,'carta',id); }); }catch(_){}
    try{ const kmls=(g.E && g.E.kmlLayers)?g.E.kmlLayers:(g.KML_LAYERS||{}); Object.keys(kmls||{}).forEach(name=>{ const lyr=kmls[name]; const id='kml:'+name; if(!REG.has(id)) API.registerLayer(lyr,name,'vetor',id); }); }catch(_){}
    try{ const shps=(g.E && g.E.shpLayers)?g.E.shpLayers:(g.SHP_LAYERS||{}); Object.keys(shps||{}).forEach(name=>{ const lyr=shps[name]; const id='shp:'+name; if(!REG.has(id)) API.registerLayer(lyr,name,'vetor',id); }); }catch(_){}
    try{ const drawn=(g.E && g.E.drawn)?g.E.drawn:null; if(drawn && !REG.has('drawn')) API.registerLayer(drawn,'Desenhos','vetor','drawn'); }catch(_){}
  }
  setInterval(function(){ syncFromKnown(); applyOrdering(); renderList(); }, 1000);
  if(lockPdfEl){ lockPdfEl.addEventListener('change', ()=>{ applyOrdering(); renderList(); }); }
  window.addEventListener('load', function(){ document.getElementById('foucFix')?.remove(); document.body.style.visibility='visible'; });
})();


;


(function(){
  'use strict';
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function(){
    const get = (id)=>document.getElementById(id);
    const inputs = [get('pdfInput'), get('kmlInput'), get('shpInput'), get('geojsonInput'), get('projectInput')].filter(Boolean);

    function resetFileInput(inp){
      try { inp.value = ''; } catch(_) {}
      if (!inp.value) return; // cleared ok
      const clone = inp.cloneNode(true);
      inp.parentNode.replaceChild(clone, inp);
    }

    inputs.forEach(function(inp){
      inp.addEventListener('change', function(){
        setTimeout(function(){ resetFileInput(inp); }, 0);
      });
    });

    (function ensureRegistries(){
      window.E = window.E || {};
      E.pdfLayers = E.pdfLayers || {};
      E.kmlLayers = E.kmlLayers || {};
      E.kmlTexts  = E.kmlTexts  || [];
      E.shpLayers = E.shpLayers || {};
    })();

    // IMPORTANT: do NOT call map.removeLayer here to avoid recursion.
    function deepRemove(layer){
      if(!layer) return;
      try{ if(layer.clearLayers) layer.clearLayers(); }catch(_){}
      try{ if(layer.remove) layer.remove(); }catch(_){}
      try{ if(layer.off) layer.off(); }catch(_){}
    }

    function purgeRegistriesForLayer(layer){
      try{
        if (E.pdfLayers){
          Object.keys(E.pdfLayers).forEach(function(k){
            if (E.pdfLayers[k] === layer){ delete E.pdfLayers[k]; }
          });
        }
        if (E.kmlLayers){
          Object.keys(E.kmlLayers).forEach(function(name){
            const entry = E.kmlLayers[name];
            if (!entry) { delete E.kmlLayers[name]; return; }
            if (Array.isArray(entry.layers)){
              entry.layers = entry.layers.filter(function(l){ return l && l !== layer; });
              if (!entry.layers.length){ delete E.kmlLayers[name]; }
            } else if (entry === layer){
              delete E.kmlLayers[name];
            }
          });
        }
        if (E.shpLayers){
          Object.keys(E.shpLayers).forEach(function(name){
            const entry = E.shpLayers[name];
            if (Array.isArray(entry)){
              E.shpLayers[name] = entry.filter(function(l){ return l && l !== layer; });
              if (!E.shpLayers[name].length){ delete E.shpLayers[name]; }
            } else if (entry === layer){
              delete E.shpLayers[name];
            }
          });
        }
      }catch(_){}
    }

    if (window.L && L.Map && !L.Map.prototype.__agro_rm_patched_v2){
      const _rm = L.Map.prototype.removeLayer;
      L.Map.prototype.removeLayer = function(layer){
        // Call original first to avoid any recursion patterns
        const ret = _rm.call(this, layer);
        try{ purgeRegistriesForLayer(layer); }catch(_){}
        try{ deepRemove(layer); }catch(_){}
        return ret;
      };
      L.Map.prototype.__agro_rm_patched_v2 = true;
    }

    function clearKMLAll(){
      const map = (window.E && E.map) || window.__leafletMap;
      try{
        if (E.kmlLayers){
          Object.keys(E.kmlLayers).forEach(function(name){
            const entry = E.kmlLayers[name];
            if(!entry) return;
            if (Array.isArray(entry.layers)) entry.layers.forEach(function(l){ try{ map && map.removeLayer && map.removeLayer(l); }catch(_){} });
            else { try{ map && map.removeLayer && map.removeLayer(entry); }catch(_){} }
          });
          E.kmlLayers = {};
        }
        if (Array.isArray(E.kmlTexts)) E.kmlTexts.length = 0;
        const list = get('kmlList'); if (list) list.innerHTML = '';
      }catch(_){}
      const inp = get('kmlInput');
      if (inp){ resetFileInput(inp); }
    }

    function clearSHPAll(){
      const map = (window.E && E.map) || window.__leafletMap;
      try{
        if (E.shpLayers){
          Object.keys(E.shpLayers).forEach(function(name){
            const entry = E.shpLayers[name];
            if (Array.isArray(entry)) entry.forEach(function(l){ try{ map && map.removeLayer && map.removeLayer(l); }catch(_){} });
            else { try{ map && map.removeLayer && map.removeLayer(entry); }catch(_){} }
          });
          E.shpLayers = {};
        }
        const list = get('shpList'); if (list) list.innerHTML = '';
      }catch(_){}
      const inp = get('shpInput');
      if (inp){ resetFileInput(inp); }
    }

    const clearKMLBtn = get('clearKML');
    if (clearKMLBtn && !clearKMLBtn.__wired_v2){
      clearKMLBtn.addEventListener('click', function(ev){ ev.preventDefault(); clearKMLAll(); });
      clearKMLBtn.__wired_v2 = true;
    }
    const clearSHPBtn = get('clearSHP');
    if (clearSHPBtn && !clearSHPBtn.__wired_v2){
      clearSHPBtn.addEventListener('click', function(ev){ ev.preventDefault(); clearSHPAll(); });
      clearSHPBtn.__wired_v2 = true;
    }

    // Sanity: ensure accept attributes
    try {
      const kml = get('kmlInput'); if(kml && (!kml.accept || !/\.kmz/.test(kml.accept))) kml.setAttribute('accept', '.kml,.kmz');
      const shp = get('shpInput'); if(shp && (!shp.accept || !/\.shp/.test(shp.accept))) shp.setAttribute('accept', '.zip,.shp,.dbf,.shx,.prj');
      const pdf = get('pdfInput'); if(pdf && (!pdf.accept || !/\.pdf/.test(pdf.accept))) pdf.setAttribute('accept', '.pdf');
      const geo = get('geojsonInput'); if(geo && (!geo.accept || !/\.geojson/.test(geo.accept))) geo.setAttribute('accept', '.geojson,.json');
    } catch(_){}
  });
})();


;


// ===== Robust Layer Scanner for "" =====
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    // Try to find the map
    let map = (window.E && E.map) ? E.map : null;
    if(!map){
      for(const k of Object.keys(window)){
        const v = window[k];
        if(v && v.addLayer && v.getPane && v.setView && v.fitBounds){ map = v; break; }
      }
    }
    if(!map) return;

    // Registries (if your code already has them, we reuse)
    if(!window.E) window.E = {};
    E.pdfLayers = E.pdfLayers || {};
    E.kmlLayers = E.kmlLayers || {};
    E.shpLayers = E.shpLayers || {};
    E._stack = E._stack || [];

    const $ = (id)=>document.getElementById(id);
    const UI = { list: $('layerList'), lockPdf: $('lockPdfTop') };
    if(!UI.list) return;

    // Ensure panes
    if (!map.getPane('panePDF')){ const p = map.createPane('panePDF'); p.style.zIndex='2147483600'; }
    const vectorBaseZ = 1000;
    function paneForIndex(i){
      const id='paneVector-'+i;
      if(!map.getPane(id)){ const p=map.createPane(id); p.style.zIndex=String(vectorBaseZ + i*5); }
      else { map.getPane(id).style.zIndex=String(vectorBaseZ + i*5); }
      return id;
    }

    // Helper: name generator
    function nextName(prefix){ let i=1; let n=prefix+' '+i; const used = new Set(Object.keys(E.pdfLayers).concat(Object.keys(E.kmlLayers)).concat(Object.keys(E.shpLayers))); while(used.has(n)) { i++; n=prefix+' '+i; } return n; }

    // Heuristic scan of map._layers to backfill registries if empty
    function backfill(){
      try{
        const layers = map._layers || {};
        // PDFs: L.ImageOverlay
        const imgOverlays = Object.values(layers).filter(l => l && l instanceof L.ImageOverlay);
        imgOverlays.forEach((ov)=>{
          // if not registered, add with synthetic name
          const already = Object.values(E.pdfLayers).includes(ov);
          if(!already){
            const n = nextName('PDF');
            E.pdfLayers[n] = ov;
          }
        });
        // GeoJSON groups (KML/SHP)
        const jsonGroups = Object.values(layers).filter(l => l && l instanceof L.GeoJSON);
        jsonGroups.forEach((g)=>{
          // pick a label by pane to guess type
          const pane = (g.options && g.options.pane) || '';
          let kind = pane && /shp|zip/i.test(pane) ? 'shp' : 'kml';
          // store under a synthetic name if not already contained in registries
          const alreadyK = Object.values(E.kmlLayers).some(e => e.layers && e.layers.includes && e.layers.includes(g));
          const alreadyS = Object.values(E.shpLayers).some(arr => Array.isArray(arr) && arr.includes(g));
          if(!alreadyK && !alreadyS){
            const nm = nextName(kind.toUpperCase());
            if(kind==='kml'){
              E.kmlLayers[nm] = {layers:[g], visible:true};
            }else{
              E.shpLayers[nm] = [g];
            }
          }
        });
      }catch(e){}
    }

    // Stack maintenance
    function ensureEntry(name,type,layers){
      if(!name || !layers || !layers.length) return;
      const found = E._stack.find(x=>x.name===name && x.type===type);
      if(found){ found.layers = layers.slice(); return; }
      const item = { id: 'L'+(Math.random()*1e6|0), name, type, layers: layers.slice(), visible:true };
      if(UI.lockPdf?.checked && type==='pdf'){
        E._stack.push(item);
      }else if(UI.lockPdf?.checked && type!=='pdf'){
        const firstPdf = E._stack.findIndex(x=>x.type==='pdf');
        if(firstPdf===-1) E._stack.push(item); else E._stack.splice(firstPdf,0,item);
      }else{
        E._stack.push(item);
      }
    }

    function syncFromRegistries(){
      backfill();
      Object.entries(E.pdfLayers).forEach(([n,ov])=>ov && ensureEntry(n,'pdf',[ov]));
      Object.entries(E.kmlLayers).forEach(([n,entry])=> entry && ensureEntry(n,'kml', (entry.layers||[]).filter(Boolean)));
      Object.entries(E.shpLayers).forEach(([n,arr])=> ensureEntry(n,'shp', (arr||[]).filter(Boolean)));
    }

    function applyOrdering(){
      if(UI.lockPdf?.checked){
        const pdfs = E._stack.filter(x=>x.type==='pdf');
        const others = E._stack.filter(x=>x.type!=='pdf');
        E._stack = [...others, ...pdfs];
      }
      E._stack.forEach((item, idx)=>{
        const paneId = (item.type==='pdf') ? 'panePDF' : paneForIndex(idx);
        item.layers.forEach(l=>{
          try{
            l.options = l.options || {}; l.options.pane = paneId;
            if(map.hasLayer(l)) map.removeLayer(l);
            l.addTo(map);
            if(item.type==='pdf' && l.getElement()) l.getElement().style.zIndex='2147483600';
          }catch{}
        });
      });
    }

    function renderList(){
      if(!UI.list) return;
      UI.list.innerHTML='';
      const items=[...E._stack].reverse();
      items.forEach(item=>{
        const li=document.createElement('li');
        li.className='layer-item'; li.setAttribute('draggable','true'); li.dataset.id=item.id;
        li.innerHTML =
          '<span class="name" title="'+item.name+'">'+item.name+'</span>'+
          '<span class="muted">'+item.type.toUpperCase()+'</span>'+
          '<button class="eye">'+(item.visible?'👁️':'🚫')+'</button>'+
          '<i class="fa-solid fa-grip-vertical drag-handle" title="Arraste para reordenar"></i>';
        li.querySelector('.eye').addEventListener('click',()=>{
          item.visible=!item.visible;
          li.querySelector('.eye').textContent=item.visible?'👁️':'🚫';
          item.layers.forEach(l=>{ try{ item.visible ? l.addTo(map) : map.removeLayer(l); }catch{} });
        });
        li.querySelector('.name').addEventListener('click',()=>{
          try{ const fg=L.featureGroup(item.layers); const b=fg.getBounds(); if(b && b.isValid()) map.fitBounds(b,{padding:[16,16]}); }catch{}
        });
        li.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed='move'; });
        li.addEventListener('dragover', e=>{ e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', ()=> li.classList.remove('drag-over'));
        li.addEventListener('drop', e=>{
          e.preventDefault(); li.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          if(!draggedId || draggedId===item.id) return;
          const stack = E._stack, ui=[...stack].reverse();
          const fromUI = ui.findIndex(x=>x.id===draggedId);
          const toUI   = ui.findIndex(x=>x.id===item.id);
          const moving = stack.splice(stack.length-1-fromUI,1)[0];
          stack.splice(stack.length-1-toUI,0,moving);
          renderList(); applyOrdering();
        });
        UI.list.appendChild(li);
      });
    }

    function refresh(){ syncFromRegistries(); applyOrdering(); renderList(); }
    refresh();
    setInterval(refresh, 1200);
    if(UI.lockPdf){ UI.lockPdf.addEventListener('change', ()=>{ applyOrdering(); renderList(); }); }
  });
})();
