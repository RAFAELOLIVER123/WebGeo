body{visibility:hidden}

/* --- separator --- */


    :root{
      --brand-blue:#2563eb; --brand-blue-dark:#1d4ed8; --bg:#f4f7fb; --ink:#0f172a; --muted:#6b7280;
      --panel-grad:linear-gradient(180deg,#fff 0%,#fbfdff 100%); --card-border:#e8eef7; --ctrl-border:#e5e7eb;
      --hud-bg: rgba(10,18,33,.78); --hud-fg:#e5e7eb; --hud-border: rgba(255,255,255,.12);
      --hud-shadow1:0 10px 24px rgba(0,0,0,.18); --hud-shadow2:0 2px 6px rgba(0,0,0,.08);
      --hud-chip-bg:rgba(255,255,255,.06); --hud-chip-bd:rgba(255,255,255,.14);
    }
    html,body{height:100%;margin:0;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}
    #map{
      position:absolute;
      inset:0;
      top:0; right:0; bottom:0; left:0;
    }
    .hidden{display:none!important}

    #controls{
      position:absolute;top:10px;left:10px;z-index:920;
      width:250px; min-width:260px; max-width:260px;
      max-height:calc(95vh - 15px); overflow:auto;
      background:var(--panel-grad);border:1px solid #eef2f7;
      border-radius:9.2px;padding:12px;
      box-shadow:0 12px 28px rgba(16,24,40,.14),0 2px 6px rgba(16,24,40,.06);
      font-size:10px; scrollbar-gutter:stable; overscroll-behavior:contain; box-sizing:border-box;
    }
    #controls::-webkit-scrollbar{width:10px}
    #controls::-webkit-scrollbar-track{background:#f3f6fb;border-radius:10px}
    #controls::-webkit-scrollbar-thumb{background:#cfd7e6;border-radius:10px;border:2px solid #f3f6fb}
    #controls::-webkit-scrollbar-thumb:hover{background:#b9c4d8}


    .section{margin-bottom:12px}
    .section-title{display:flex;align-items:center;gap:8px;font-weight:800;color:var(--ink);margin:6px 0}
    .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    label.small{font-size:11px;color:#64748b;display:block;margin:4px 0}

    .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:none;border-radius:10px;background:var(--brand-blue);color:#fff;cursor:pointer;transition:.15s;box-shadow:0 4px 14px rgba(37,99,235,.25);font-size:12px}
    .btn:hover{filter:brightness(.96)}
    .btn-ghost{background:#fff;color:var(--ink);border:1px solid var(--ctrl-border);box-shadow:none}
    .btn-danger{background:#ef4444}
    .btn-save{background:#16a34a}

    select,textarea,input[type="text"],input[type="number"],input[type="range"],input[type="color"]{width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--ctrl-border);border-radius:10px;background:#fff;font-size:12px}
    textarea{resize:vertical}

    #toggleButton{position:absolute;top:10px;left:244px;z-index:1001;padding:5px 7px;border:none;border-radius:10px;background:#0f172a;color:#fff;cursor:pointer;font-size:12px}

    #shapeToolbar{position:absolute;right:12px;bottom:12px;z-index:1000;width:320px;display:none;cursor:default;background:#ffffffd8;backdrop-filter:blur(6px);border:1px solid var(--card-border);border-radius:16px;box-shadow:0 12px 28px rgba(16,24,40,.14),0 2px 6px rgba(16,24,40,.06)}
    #shapeToolbar.dragging{opacity:.96}
    #dragHandle{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;color:#fff;border-top-left-radius:16px;border-top-right-radius:16px;user-select:none;cursor:move;background:linear-gradient(90deg,var(--brand-blue),var(--brand-blue-dark))}
    #dragHandle .toolbar-title{font-weight:900;font-size:14px;letter-spacing:.2px}
    #btnCloseToolbar{background:rgba(255,255,255,.18);color:#fff;border:none;border-radius:10px;padding:6px 10px;cursor:pointer}
    .toolbar-body{padding:12px;max-height:78vh;overflow:auto}
    .toolbar-body .row{margin:6px 0}

    .actions-bar{position:sticky; top:0; z-index:2; display:flex; gap:8px; padding-bottom:10px; margin-bottom:10px; background:linear-gradient(180deg,#ffffffd8 60%, rgba(255,255,255,0) 100%); border-bottom:1px dashed var(--ctrl-border)}
    .actions-bar .btn{flex:1; justify-content:center; border-radius:12px}

    .field{margin:10px 0}
    .field label.small{margin-bottom:6px}
    .color-row{display:flex;align-items:center;gap:8px}
    .color-row input[type="color"]{padding:0;width:48px;height:36px;border-radius:10px;border:1px solid var(--ctrl-border);background:
      linear-gradient(45deg,#ccc 25%, transparent 25%) 0 0/10px 10px,
      linear-gradient(-45deg,#ccc 25%, transparent 25%) 0 0/10px 10px,
      linear-gradient(45deg,transparent 75%, #ccc 75%) 0 0/10px 10px,
      linear-gradient(-45deg,transparent 75%, #ccc 75%) 0 0/10px 10px,#fff;}
    .hex-badge{font-size:12px;padding:6px 8px;border:1px solid var(--ctrl-border);border-radius:10px;background:#fff;color:#111827;min-width:86px;text-align:center}
    .range-line{display:flex;align-items:center;gap:8px}
    .range-line output{min-width:64px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;border:1px solid var(--ctrl-border);background:#fff;color:#111827;border-radius:10px;padding:6px 8px;font-size:12px}

    #loadingMessage{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2000;background:rgba(2,6,23,.82);color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;display:none;box-shadow:0 10px 24px rgba(0,0,0,.35)}
    #fatalError{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:3000;background:#ef4444;color:#fff;padding:10px 14px;border-radius:10px;display:none;font-size:13px}

    .label-marker .bubble{position:relative;left:50%;transform:translate(-50%,-100%);display:inline-block;border-radius:8px;white-space:nowrap;line-height:1.15}
    .emoji-pin{background:transparent!important;border:none!important}
    .emoji-pin .emoji{position:relative;left:50%;transform:translate(-50%,-100%);display:inline-block;line-height:1}

    #extentInfo{margin-top:8px;padding-top:8px;border-top:1px dashed var(--ctrl-border);display:none;font-size:12px;color:#111827}
    #extentInfo .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px}
    #extentInfo .tag{font-size:11px;color:var(--muted);align-self:center}
    .adjust-mode #map{cursor:move!important}

    .label-editor{position:absolute;z-index:2001;padding:6px;background:#0f172a;color:#fff;border:1px solid var(--brand-blue);border-radius:10px;box-shadow:0 12px 28px rgba(0,0,0,.35)}
    .label-editor input{width:240px;background:transparent;border:0;outline:none;color:#fff;font:13px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}

    #hudStack{display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none;margin:10px}
    #hudStack>*{pointer-events:auto}
    .hud-card{background:var(--hud-bg);color:var(--hud-fg);border:1px solid var(--hud-border);border-radius:14px;backdrop-filter:blur(8px);box-shadow:var(--hud-shadow1),var(--hud-shadow2);width:280px;transition:transform .15s,opacity .15s;opacity:.95}
    @media (hover:hover){.hud-card:not(:hover){opacity:.88;transform:scale(.985)}}
    #coordBox{padding:8px!important}
    #coordBox .coord-row{display:flex;gap:6px;align-items:center}
    #coordBox .coord-small{color:#cbd5e1!important;font-size:12px}
    #coordMain{font-weight:800;font-size:10px}
    #coordZoom{font-weight:700}
    #coordState{margin-left:4px}
    .coord-btn{padding:8px 10px!important;border-radius:10px;border:1px solid var(--hud-chip-bd)!important;background:var(--hud-chip-bg)!important;color:var(--hud-fg)!important;cursor:pointer}
    /* HUD colorido (pedido): */
    #lockBtn{border-color:transparent!important;background:linear-gradient(90deg,#0ea5e9,#0284c7)!important;color:#fff!important;box-shadow:0 6px 16px rgba(2,132,199,.35)}
    #lockBtn.active{background:linear-gradient(90deg,#22c55e,#16a34a)!important;box-shadow:0 6px 16px rgba(22,163,74,.35)}
    #copyBtn{border-color:transparent!important;background:linear-gradient(90deg,#f59e0b,#d97706)!important;color:#111827!important;box-shadow:0 6px 16px rgba(217,119,6,.35)}
    #openToolbarBtn{border-color:transparent!important;background:linear-gradient(90deg,#ef4444,#dc2626)!important;color:#fff!important;box-shadow:0 6px 16px rgba(239,68,68,.35)}

    #rulerBox{display:flex;align-items:flex-start;gap:8px;padding:8px;justify-content: space-between}
    .ruler-btn{border-radius:10px;padding:6px 10px;border:1px solid var(--hud-chip-bd);background:var(--hud-chip-bg);color:var(--hud-fg)}
    .ruler-btn i{margin-right:6px}
    #rulerBtn.active{background:linear-gradient(90deg,#1d4ed8,#2563eb);border-color:transparent;color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35)}
    #rulerValue{font-weight:900;font-variant-numeric:tabular-nums;padding:4px 10px;border-radius:10px;background:var(--hud-chip-bg);border:1px solid var(--hud-chip-bd)}

    #sec-search .row{display:flex;gap:8px;align-items:center}
    #searchBox{flex:1;min-width:0}
    #searchBtn,#gpsBtn{white-space:nowrap}

    #pixCard{position:fixed;right:16px;bottom:90px;z-index:2001;width:300px;background:#fff;border:1px solid var(--card-border);border-radius:10px;box-shadow:0 18px 40px rgba(16,24,40,.18),0 4px 14px rgba(16,24,40,.08);display:none;overflow:hidden;animation:pixIn .5s ease}
    @keyframes pixIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    #pixCard header{background:linear-gradient(90deg,var(--brand-blue),var(--brand-blue-dark));color:#fff;padding:12px;display:flex;align-items:center;justify-content:space-between}
    #pixCard .title{font-weight:800;letter-spacing:.2px}
    #pixCard .body{padding:12px;color:var(--ink)}
    #pixCard .qr{border:1px solid var(--ctrl-border);border-radius:12px;padding:8px;display:flex;align-items:center;justify-content:center;background:#fff}
    #pixCard .kvs{margin-top:8px;font-size:12.5px;color:#111827}
    #pixCard .kv{display:flex;gap:8px;margin:4px 0}
    #pixCard .k{width:96px;color:#64748b}
    #pixCard .v{flex:1;word-break:break-word}
    #pixClose{background:rgba(255,0,0);border:0;color:#ffffff;padding:6px 8px;border-radius:8px;cursor:pointer}
    #pixActions{display:flex;gap:8px;margin-top:10px}
    #pixActions .btn{flex:1}
    .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;background:#f1f5ff;border:1px solid #e2e8ff;color:#1d4ed8;border-radius:8px;font-weight:600;font-size:12px}

    /* Remover controle de zoom do Leaflet */
    .leaflet-control-zoom { display: none !important; }

    /* =========================
       🔸 RESPONSIVIDADE MOBILE
       ========================= */
    @media (max-width: 880px){
      #controls{
        position:fixed;
        left:0; right:0; bottom:0; top:auto;
        width:auto; min-width:0; max-width:none;
        max-height:52vh; height:52vh;
        border-radius:16px 16px 0 0;
        padding:14px 14px calc(14px + env(safe-area-inset-bottom,0));
        margin:0;
        box-shadow:0 -10px 28px rgba(16,24,40,.16),0 -2px 6px rgba(16,24,40,.06);
        font-size:12px;
      }
      #toggleButton{
        position:fixed;
        top:auto; bottom:calc(env(safe-area-inset-bottom,0) + 12px);
        left:12px;
        padding:10px 12px;
        border-radius:12px;
        font-size:14px;
        z-index:1100;
      }
      #hudStack{gap:8px;margin:10px}
      .hud-card{width:min(88vw, 320px)}
      #coordMain{font-size:12px}

      #shapeToolbar{
        width:min(96vw, 520px);
        right:2vw; left:auto;
        bottom:calc(12px + env(safe-area-inset-bottom,0));
        border-radius:16px;
      }
      #dragHandle .toolbar-title{font-size:15px}
      .toolbar-body{max-height:65vh}

      #controls.hidden{display:none!important}

      .row{gap:10px}
      #sec-search .row{flex-wrap:nowrap}
      #sec-search #searchBox{min-width:0}
      @media (max-width: 560px){
        #sec-search .row{flex-direction:column;align-items:stretch}
        #sec-search .row .btn{width:100%}
      }

      #sec-pdf .row label.btn,
      #sec-kml .row label.btn,
      #sec-draw .row label.btn,
      #sec-project .row label.btn,
      #sec-shp .row label.btn{flex:1}

      #pixCard{
        width:min(92vw, 420px);
        right:4vw;
        bottom:calc(12px + env(safe-area-inset-bottom,0));
        border-radius:14px;
      }

      .leaflet-control-attribution{font-size:10px}
    }

    @media (max-width: 400px){
      #shapeToolbar{width:96vw; right:2vw; left:2vw}
      .actions-bar .btn{font-size:12px;padding:8px}
      .btn{font-size:12px;padding:8px 10px;border-radius:12px}
      select,textarea,input[type="text"],input[type="number"],input[type="range"],input[type="color"]{font-size:13px}
      .section-title{font-size:14px}
    }

    @media (max-height: 520px) and (max-width: 880px){
      #controls{height:46vh;max-height:46vh}
      .toolbar-body{max-height:58vh}
    }
  

/* --- separator --- */


.leaflet-popup-content .agro-pin { float:right; margin-left:8px; cursor:pointer; font-size:12px; background:#111827; color:#fff; border:0; border-radius:6px; padding:2px 6px; }
.leaflet-tooltip.agro-hover { pointer-events:none; }


/* --- separator --- */


/* === Layer Container === */
#agro-layer-container {
  position:absolute; top:10px; right:10px; z-index:1400;
  width:320px; background:#ffffff; border-radius:14px;
  box-shadow:0 12px 34px rgba(2,6,23,.14); padding:10px; display:grid; gap:8px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto;
}
#agro-layer-container h3 { margin:0; font-size:14px; color:#0f172a; display:flex; align-items:center; justify-content:space-between; }
#agro-layer-container .muted { color:#64748b; font-size:12px; }
#agro-layer-list { max-height:240px; overflow:auto; display:grid; gap:6px; }
.layer-row {
  display:grid; grid-template-columns: 1fr auto; gap:6px; align-items:center;
  background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:6px 8px;
}
.layer-row .name { font-size:12px; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.layer-row .controls { display:flex; gap:6px; }
.layer-btn {
  appearance:none; border:0; border-radius:8px; padding:4px 8px; cursor:pointer;
  background:#e5e7eb; color:#0f172a; font-size:12px;
}
.layer-btn.eye { width:30px; text-align:center; }
.layer-btn:hover { filter:brightness(0.95); }
#agro-layer-hint { font-size:11px; color:#64748b; }
#agro-layer-toggle {
  appearance:none; border:0; background:#0f172a; color:#fff; border-radius:999px; padding:4px 10px; font-size:11px; cursor:pointer;
}
/* Progress pill already exists; ensure on top */
#agro-progress { z-index: 1600 !important; }


/* --- separator --- */


#agro-layer-fab {
  position:absolute; left:10px; top:100px; z-index:1500;
  width:38px; height:38px; border-radius:999px; background:#0f172a; color:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  box-shadow:0 8px 28px rgba(0,0,0,.22);
  font-family: system-ui, -apple-system, Segoe UI, Roboto;
}
#agro-layer-fab:hover { filter:brightness(1.1); }
#agro-layer-container { position:fixed; left:60px; top:80px; display:none; cursor:default; }
#agro-layer-container.dragging { opacity:.9; cursor:grabbing; }
#agro-layer-container h3 { cursor:grab; }


/* --- separator --- */


/* Disable legacy layer UI if any leftover */
#agro-layer-container, #agro-layer-fab { display: none !important; }


/* --- separator --- */


.leaflet-pane.agro-carta-pane { z-index: 10000 !important; }
.leaflet-pane.agro-below-carta { z-index: 5000 !important; }


/* --- separator --- */


/* CARTA super topo e tudo o resto abaixo dela */
.leaflet-pane.agro-carta-pane { z-index: 100000 !important; }
.leaflet-pane.agro-below-carta { z-index: 5000 !important; }


/* --- separator --- */


/* CARTA super topo (abaixo apenas de popups/tooltip) */
.leaflet-pane.agro-carta-pane { z-index: 2147483600 !important; }
.leaflet-pane.leaflet-popup-pane, .leaflet-pane.leaflet-tooltip-pane { z-index: 2147483647 !important; }
.leaflet-pane.agro-below-carta { z-index: 1000 !important; } /* shapes/KML etc. */


/* --- separator --- */


/* === Camadas (FAB + Painel flutuante) === */
/* (removido) #layerFab */
#layerFab i{ font-size: 18px }
#layerPanel{
  position: absolute; left: 12px; bottom: 70px; z-index: 1201;
  width: 320px; max-height: 65vh; overflow: auto;
  background: #ffffffd8; backdrop-filter: blur(6px);
  border: 1px solid #e5e7eb; border-radius: 14px;
  box-shadow: 0 12px 28px rgba(16,24,40,.14), 0 2px 6px rgba(16,24,40,.06);
  display: none;
}
#layerPanel.dragging{ opacity: .96 }
#layerPanel header{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding: 10px 12px; color: #fff;
  background: linear-gradient(90deg,#2563eb,#1d4ed8);
  border-top-left-radius: 14px; border-top-right-radius: 14px;
  user-select: none; cursor: move;
}
#layerPanel .title{ font-weight: 900; letter-spacing: .2px }
#layerPanel .body{ padding: 10px }
.layer-item{
  display:grid; grid-template-columns: 22px 1fr auto; align-items:center;
  gap:8px; padding:8px 6px; border-bottom: 1px dashed #e5e7eb;
}
.layer-item .name{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.layer-item .btns{ display:flex; gap:6px }
.layer-item .btn{ border:1px solid #e5e7eb; background:#fff; padding:4px 8px; border-radius:8px; cursor:pointer; }
.layer-item .btn:hover{ background:#f8fafc }
.layer-item .tag{ font-size:11px; color:#64748b; margin-left:6px }
.layer-footer{ display:flex; gap:8px; padding-top:8px }
.layer-footer .btn{ flex:1; justify-content:center }
@media (max-width: 600px){
  #layerPanel{ width: min(92vw, 440px); left: 4vw; bottom: 80px }
}


/* ===  === */
#layersCard{border:1px dashed #e5e7eb;border-radius:12px;background:#fafcff;padding:8px}
#layerList{list-style:none;margin:6px 0 4px 0;padding:0;max-height:260px;overflow:auto}
.layer-item{display:grid;grid-template-columns: 1fr auto 30px 30px;gap:6px;align-items:center;
  background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:6px 8px;margin:6px 0}
.layer-item .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.drag-handle{cursor:grab;color:#64748b}
.layer-item.drag-over{outline:2px dashed #2563eb}
.eye{width:30px;height:28px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;cursor:pointer}
.muted{color:#64748b;font-size:12px}






/* --- separator --- */


/* Crop tool (mask-only) */
#cropperModal{position:fixed;inset:0;display:none;background:rgba(0,0,0,.65);z-index:9999}
#cropperModal.open{display:flex;align-items:center;justify-content:center}
#cropperCard{background:#0f172a;color:#e2e8f0;width:min(960px,92vw);max-height:92vh;border-radius:14px;box-shadow:0 20px 90px rgba(0,0,0,.5);overflow:hidden;border:1px solid rgba(148,163,184,.25)}
#cropperHeader{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.2)}
#cropperBody{display:grid;grid-template-columns:1fr 320px;gap:14px;padding:14px}
#cropPreview{position:relative;background:#0b1220;border:1px dashed rgba(148,163,184,.35);border-radius:10px;overflow:hidden;min-height:420px}
#pdfCropCanvas{display:block;max-width:100%}
#selOverlay{position:absolute;inset:0;pointer-events:auto}
.kbtn{width:100%;background:#0b1324;color:#e2e8f0;border:1px solid rgba(125,196,255,.25);padding:10px;border-radius:10px;cursor:pointer}
.kbtn.primary{background:#133b2f;border-color:rgba(74,222,128,.35)}
.kdim{font-size:12px;color:#e2e8f0;position:absolute;right:8px;bottom:8px;background:rgba(2,6,23,.6);padding:4px 8px;border-radius:8px;border:1px solid rgba(148,163,184,.25)}


/* --- separator --- */


#cropperCard{background:#0c1327;color:#e6edf7;border:1px solid rgba(120,162,255,.25)}
#cropperHeader{border-bottom:1px solid rgba(120,162,255,.25)}
#cropPreview{background:#0a1122;border:1px dashed rgba(120,162,255,.35)}
.kbtn{background:#0a1533;border:1px solid rgba(120,162,255,.35);color:#e6edf7}
.kbtn.primary{background:#154ec1;border-color:rgba(41,112,255,.55)}
.kbtn.warn{background:#3b1f1f;border-color:rgba(248,113,113,.35)}
.kdim{border:1px solid rgba(120,162,255,.35);background:rgba(6,12,32,.65)}
.leaflet-control .mini{font-size:12px;line-height:1; padding:6px 8px; color:#e6edf7; background:#0a1533; border:1px solid rgba(120,162,255,.35); display:inline-block}


/* --- separator --- */


/* Oculta os botões de forma (sem quebrar JS) */
#cropperModal #btnShapeRect,
#cropperModal #btnShapeEllipse { display: none !important; }


/* --- separator --- */


/* Aumenta a espessura e pegada do controle de transparência (.rng) */
input.rng{ height: 26px; } /* aumenta área clicável */
input.rng::-webkit-slider-runnable-track{ height: 8px; }
input.rng::-moz-range-track{ height: 8px; }
input.rng::-ms-track{ height: 8px; }


/* --- separator --- */


  #exportBar{
   position: fixed; left: 50%; top: 12px; transform: translateX(-50%);
   z-index: 2147483646; display:flex; gap:px; align-items:center;
   background:; backdrop-filter: blur(4px);
   padding:6px px; border-radius: 9px; box-shadow: 0 6px 24px rgba(0,0,0,.12);
   font-size: 9px;
  }
  #exportBar button{ cursor:pointer; border:0; border-radius:12px; padding:5px 10px; font-weight:300; }
  #exportBar .primary{ background:#0ea5e9; color:#fff; }
  #exportBar .ghost{ background:#f3f4f6; }
  .exporting #controls,
  .exporting #shapeToolbar,
  .exporting #hudStack,
  .exporting #pixCard,
  .exporting #toggleButton,
  .exporting .leaflet-control-container,
  .exporting .leaflet-popup,
  .exporting .leaflet-tooltip { display:none !important; }
  .exporting #map{ position:fixed !important; inset:0 !important; z-index:1 !important; }
  @media print{
    #exportBar, #controls, #shapeToolbar, #hudStack, #pixCard, #toggleButton, .leaflet-control-container { display:none !important; }
    html, body, #map { height:100% !important; }
    #map { position:fixed !important; inset:0 !important; }
  }


/* --- separator --- */


  #layersFab{
    position:absolute; left:12px; top:50%; transform:translateY(-50%);
    z-index:2147483650; width:42px; height:42px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    background:#0f172acc; color:#fff; border:1px solid rgba(255,255,255,.12);
    box-shadow:0 10px 28px rgba(0,0,0,.28); cursor:pointer;
  }
  #layersFab i{font-size:18px}
  #layersPanel{
    position:absolute; left:60px; top:50%; transform:translateY(-50%);
    z-index:2147483651; width:300px; max-height:70vh; overflow:auto;
    background:#ffffffee; backdrop-filter: blur(8px);
    border:1px solid #e5e7eb; border-radius:14px; display:none;
    box-shadow:0 14px 36px rgba(16,24,40,.2), 0 3px 10px rgba(16,24,40,.08);
  }
  #layersHeader{
    position:sticky; top:0; background:linear-gradient(90deg,#2563eb,#1d4ed8);
    color:#fff; padding:10px; display:flex; align-items:center; justify-content:space-between;
    border-top-left-radius:14px; border-top-right-radius:14px; user-select:none; cursor:move;
  }
  #layersList{ padding:10px; }
  .layer-item{
    display:grid; grid-template-columns: 24px 1fr auto; align-items:center; gap:8px;
    padding:8px; border:1px solid #e5e7eb; border-radius:10px; margin:6px 0; background:#fff;
  }
  .layer-item .name{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .layer-item .kind{ font-size:11px; color:#64748b; margin-left:6px }
  .chip{font-size:10px; padding:2px 6px; border-radius:999px; background:#eff6ff; border:1px solid #dbeafe; color:#1d4ed8; margin-left:6px}
  .rowbtns{ display:flex; gap:6px; }
  .rowbtns button{ border:1px solid #e5e7eb; background:#fff; border-radius:8px; padding:6px; cursor:pointer }
  .rowbtns button:hover{ background:#f8fafc }
  .eye{ color:#111827 }
  .dragging{ opacity:.96 }


/* --- separator --- */


  .leaflet-pane.agro-pane-high { z-index: 2000000000 !important; }
  .leaflet-pane.agro-pane-low  { z-index: 1000000000 !important; }
  #agro-carta-toggle {
    position: absolute; right: 12px; top: 12px; z-index: 3000000000;
    background: #0f172acc; color: #fff; border-radius: 12px; padding: 6px 8px;
    font: 12px/1 system-ui,-apple-system,Segoe UI,Roboto; display:flex; gap:6px; align-items:center;
    box-shadow: 0 10px 28px rgba(0,0,0,.25); backdrop-filter: blur(6px);
  }
  #agro-carta-toggle button{ border:0; border-radius: 8px; padding: 4px 8px; cursor:pointer; background:#1f2937; color:#fff; }
  #agro-carta-toggle button.active{ background:#2563eb; }
