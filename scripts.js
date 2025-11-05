// Remove FOUC hider as soon as the DOM is ready or on a hard timeout
(function(){
  function show(){ try{ document.body.style.visibility = 'visible'; }catch(_){}
    var s=document.getElementById('foucFix'); if(s&&s.parentNode){ s.parentNode.removeChild(s); } }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){ show(); }
  else { document.addEventListener('DOMContentLoaded', show); window.addEventListener('load', show); }
  // failsafe
  setTimeout(show, 1500);
})();


;


// ==== Robust Guards: avoid init crashes if optional elements are missing ====
(function(){
  // Safe bind util
  window.$id = function(id){ return document.getElementById(id); };
  window.bindIf = function(id, evt, fn, opts){
    var el = typeof id === 'string' ? $id(id) : id;
    if(el && el.addEventListener){ el.addEventListener(evt, fn, opts||false); return true; }
    return false;
  };
  // Fail-soft init error handler (prevent blocking UI)
  function revealBody(){ try{ document.body.style.visibility='visible'; }catch(_){}
    var s=document.getElementById('foucFix'); if(s&&s.parentNode){ s.parentNode.removeChild(s); } }
  window.addEventListener('error', function(e){
    // evita telas "Falha ao inicializar..." por erros não críticos
    console.error('[agro-soft-error]', e.message);
    revealBody();
  }, { once: false });
  window.addEventListener('unhandledrejection', function(e){
    console.error('[agro-soft-rejection]', e.reason);
    revealBody();
  });
  // Se houver função global init, envolvemos com try/catch
  try{
    if(window.AGRO && typeof window.AGRO.init === 'function' && !window.AGRO.__wrapped){
      const orig = window.AGRO.init;
      window.AGRO.init = async function(){
        try{ return await orig.apply(this, arguments); }
        catch(err){ console.error('[AGRO.init]', err); revealBody(); }
      };
      window.AGRO.__wrapped = true;
    }
  }catch(_){}
})();


;


document.addEventListener('DOMContentLoaded', function(){
  try {
    var btn = document.getElementById('cropReset');
    if (btn && !btn.dataset._wiredReset) {
      btn.addEventListener('click', function(ev){
        try {
          if (typeof clearOverlay === 'function') { 
            clearOverlay(); 
            return;
          }
        } catch(_){}
        // Fallback: clear overlay canvas and dimension label
        try {
          var ov = document.getElementById('selOverlay');
          if (ov && ov.getContext) {
            var octx = ov.getContext('2d');
            octx.clearRect(0,0,ov.width,ov.height);
          }
          var dimEl = document.getElementById('kdim');
          if (dimEl) dimEl.textContent = '—';
        } catch(_){}
      });
      btn.dataset._wiredReset = '1';
    }
  } catch(e){ /* noop */ }
});
