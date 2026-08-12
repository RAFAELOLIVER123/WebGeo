from pathlib import Path
import re

js_path = Path('android-build/app/src/main/assets/app/app-v3.js')
css_path = Path('android-build/app/src/main/assets/app/style-v3.css')
gradle_path = Path('android-build/app/build.gradle')

s = js_path.read_text(encoding='utf-8')

# Remove global MutationObservers that were fighting over visibility and triggering repeated DOM work.
s = s.replace(
    "new MutationObserver(()=>setTimeout(postRender34,0)).observe(document.documentElement,{childList:true,subtree:true});",
    "/* V3.5.1: observer global removido; open/nav já chamam postRender34 */"
)
s = s.replace(
    "new MutationObserver(()=>setTimeout(post35,0)).observe(document.documentElement,{childList:true,subtree:true});",
    "/* V3.5.1: sem observer global para evitar rerender/pisca-pisca */"
)
s = s.replace(
    "function post35(){forceSyncVisible35();const h=document.querySelector('.estimate-section-head230 p');if(h)h.textContent='A amostra completa é mantida no aparelho, mas somente 12 linhas são exibidas por página para o formulário continuar rápido.'}",
    "function post35(){const h=document.querySelector('.estimate-section-head230 p'),t='A amostra completa é mantida no aparelho, mas somente 12 linhas são exibidas por página para o formulário continuar rápido.';if(h&&h.textContent!==t)h.textContent=t;}"
)

hotfix = r'''

/* AgroDominium Android V3.5.1 — estabilidade de tela + sync manual fixo */
(function(){
'use strict';
let lastWarn351=0;
const el351=id=>document.getElementById(id);
function badge351(id,n){const e=el351(id);if(!e)return;e.hidden=!n;e.textContent=n>99?'99+':String(n||'')}
function ensureSync351(){
  const hero=document.querySelector('#screen .hero-actions');
  if(hero&&!el351('forceSync351'))hero.insertAdjacentHTML('beforeend','<button id="forceSync351" class="secondary" onclick="syncScreen()">↻ Sincronizar</button>');
  const b=el351('forceSync351');if(b){b.style.setProperty('display','inline-flex','important');b.textContent='↻ Sincronizar'+(pending()?` (${pending()})`:'');}
  const sb=el351('syncBtn35');if(sb)sb.style.setProperty('display','inline-flex','important');
  document.querySelectorAll('#screen .menu-row').forEach(x=>{if(/Sincroniza/i.test(x.textContent||''))x.style.setProperty('display','flex','important')});
}
function patchScreen351(fn,delay=90){if(typeof fn!=='function')return fn;return function(){const r=fn.apply(this,arguments);setTimeout(ensureSync351,delay);return r}}
window.home=patchScreen351(window.home,110);
window.managerHome=patchScreen351(window.managerHome,120);
window.profile=patchScreen351(window.profile,120);
const syncScreen351=window.syncScreen;window.syncScreen=function(){const r=syncScreen351.apply(this,arguments);setTimeout(ensureSync351,80);return r};

// Auto-sync is silent: update queue/state only; never recreate home/agenda/profile.
window.agroAutoSyncResult=function(payload){
  const r=parse(payload,{});try{load()}catch(e){}
  ensureSync351();
  if(r.failed>0&&Date.now()-lastWarn351>12000){lastWarn351=Date.now();toast(`${r.failed} registro(s) continuam pendentes.`,'warn')}
  if(el351('syncTitle35'))el351('syncTitle35').textContent=pending()?pending()+' registro(s) pendente(s)':'Tudo atualizado';
  if(window.V35&&V35.chat&&V35.chat.conversationId&&Array.isArray(r.results)&&r.results.some(x=>x.type==='chat.message'))native('requestChatHistory',V35.chat.conversationId);
};

// Background bootstrap refresh only swaps data in memory. Current screen remains untouched.
window.agroBackgroundRefresh=function(payload){
  const r=parse(payload,{});if(!r.ok)return;
  try{snap=r;D=r.data||D;S.user=r.user||S.user;S.groups=r.groups||S.groups;S.group_id=r.group_id||S.group_id;S.online=!!native('isOnline')}catch(e){}
  ensureSync351();
  if(el351('syncText35'))el351('syncText35').textContent='Base atualizada em segundo plano sem sair desta tela.';
};

// Realtime only refreshes chat UI when data actually changed; no visual polling blink.
window.agroRealtimeResult=function(payload){
  const r=parse(payload,{});if(!r.ok)return;
  const oldConv=JSON.stringify(D.chat_conversas||[]),cid=window.V35&&V35.chat?+V35.chat.conversationId||0:0;
  const before=(D.chat_mensagens||[]).filter(x=>+x.conversa_id===cid).reduce((m,x)=>Math.max(m,+x.id||0),0);
  if(Array.isArray(r.notifications))D.notificacoes=r.notifications;
  if(Array.isArray(r.chat_conversas))D.chat_conversas=r.chat_conversas;
  if(Array.isArray(r.chat_mensagens)){
    D.chat_mensagens=D.chat_mensagens||[];const map=new Map(D.chat_mensagens.map(x=>[+x.id,x]));
    for(const m of r.chat_mensagens)map.set(+m.id,m);D.chat_mensagens=[...map.values()];
  }
  badge351('notifBadge33',+r.notification_unread||0);badge351('chatBadge33',+r.chat_unread||0);
  const after=(D.chat_mensagens||[]).filter(x=>+x.conversa_id===cid).reduce((m,x)=>Math.max(m,+x.id||0),0);
  if(el351('chatRoom35')&&cid&&after>before){native('requestChatHistory',cid);return}
  if(el351('chatList35')&&JSON.stringify(D.chat_conversas||[])!==oldConv&&typeof window.renderChatList35==='function')window.renderChatList35();
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureSync351,180));
setTimeout(ensureSync351,250);
})();
'''

s += hotfix
js_path.write_text(s, encoding='utf-8')

css = css_path.read_text(encoding='utf-8')
css += "\n/* V3.5.1 */\n#forceSync351,#syncBtn35{display:inline-flex!important;visibility:visible!important;opacity:1!important}#forceSync351{align-items:center;justify-content:center}\n"
css_path.write_text(css, encoding='utf-8')

g = gradle_path.read_text(encoding='utf-8')
g = re.sub(r'versionCode\s+\d+', 'versionCode 351', g, count=1)
g = re.sub(r"versionName\s+'[^']+'", "versionName '3.5.1'", g, count=1)
gradle_path.write_text(g, encoding='utf-8')

assert 'V3.5.1 — estabilidade' in s
assert 'new MutationObserver(()=>setTimeout(post35,0))' not in s
print('V3.5.1 stability hotfix applied')
