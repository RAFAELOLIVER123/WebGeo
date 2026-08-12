from pathlib import Path
import re

root=Path('android-build/app')
js_path=root/'src/main/assets/app/app-v3.js'
css_path=root/'src/main/assets/app/style-v3.css'
gradle_path=root/'build.gradle'

s=js_path.read_text(encoding='utf-8')

# Registro GPS: preserve the existing form, add point type to the queued payload.
s=s.replace("observacao:$('#pob').value.trim()};", "observacao:$('#pob').value.trim(),tipo_ponto:($('#ptype360')?.value||'PRODUTOR')};", 1)
s=s.replace('Registrar ponto','Registro GPS')
s=s.replace('Ponto / produtor','Registro GPS')

hotfix=r'''

/* AgroDominium Android V3.6.0 — RECOVERY: base, chat, mapa compartilhado e sync somente no Perfil */
(function(){
'use strict';
const e360=id=>document.getElementById(id);
const ptMeta360={
  PRODUTOR:{ico:'🌴',label:'Produtor',color:'#0b7a4d'},
  OBSERVACAO:{ico:'📝',label:'Observação',color:'#2563eb'},
  ACESSO:{ico:'🚧',label:'Acesso',color:'#d97706'},
  RISCO:{ico:'⚠',label:'Risco',color:'#dc2626'},
  FOTO:{ico:'📷',label:'Foto',color:'#7c3aed'},
  OUTRO:{ico:'📍',label:'Outro',color:'#475569'}
};
function meta360(t){return ptMeta360[String(t||'PRODUTOR').toUpperCase()]||ptMeta360.OUTRO}

// ---------- SINCRONIZAÇÃO: SOMENTE PERFIL ----------
function removeHomeSync360(){
  document.querySelectorAll('#forceSync35,#forceSync351,#forceSync360').forEach(x=>x.remove());
  document.querySelectorAll('#screen .hero-actions button').forEach(b=>{if(/Sincroniza/i.test(b.textContent||''))b.remove()});
}
try{window.forceSyncVisible35=removeHomeSync360}catch(e){}
try{window.ensureSync351=removeHomeSync360}catch(e){}
const home360=window.home;window.home=function(){const r=home360.apply(this,arguments);[0,80,180,420].forEach(t=>setTimeout(removeHomeSync360,t));return r};
const mh360=window.managerHome;window.managerHome=function(){const r=mh360.apply(this,arguments);[0,80,180,420].forEach(t=>setTimeout(removeHomeSync360,t));return r};

window.syncRecovery360=function(){
  load();if(!S.online)return toast('Sem internet. A base offline continua disponível.','warn');
  window.__syncRecovery360=true;toast('Sincronizando e baixando a base completa…');native('syncNow');
};
const oldProfile360=window.profile;window.profile=function(){
  const r=oldProfile360.apply(this,arguments);setTimeout(()=>{
    removeHomeSync360();
    const rows=[...document.querySelectorAll('#screen .menu-row')];
    const sync=rows.find(x=>/Sincroniza/i.test(x.textContent||''));
    if(sync){sync.setAttribute('onclick','syncRecovery360()');const b=sync.querySelector('b');if(b)b.textContent='Sincronizar e atualizar base';const em=sync.querySelector('em');if(em)em.textContent=`${(D.produtores||[]).length} produtores · ${pending()} pendente(s)`;}
    rows.filter(x=>/Atualizar base do aparelho/i.test(x.textContent||'')).forEach(x=>x.remove());
    const card=document.querySelector('#screen .card');if(card&&!e360('baseStatus360'))card.insertAdjacentHTML('afterend',`<div id="baseStatus360" class="base-status360"><div><small>BASE OFFLINE</small><b>${(D.produtores||[]).length.toLocaleString('pt-BR')} produtores</b></div><div><small>PLANTIOS</small><b>${(D.plantios||[]).length.toLocaleString('pt-BR')}</b></div><div><small>PONTOS COMPARTILHADOS</small><b>${(D.pontos||[]).length.toLocaleString('pt-BR')}</b></div></div>`);
  },40);return r;
};
window.agroSyncResult=function(payload){
  const r=parse(payload,{});load();
  if(!r.ok&&r.base_error)toast('Falha ao baixar a base: '+r.base_error,'bad');
  if(S.online&&((D.produtores||[]).length===0||!r.base_atualizada)){toast('Forçando download completo da base…');native('refreshData',+S.group_id||0);return;}
  toast(r.message||'Sincronização concluída.');window.__syncRecovery360=false;if(tab==='profile')profile();
};
window.agroRefreshResult=function(payload){const r=parse(payload,{});if(!r.ok)return toast(r.error||'Não foi possível baixar a base.','bad');load();window.__syncRecovery360=false;toast(`Base baixada: ${(D.produtores||[]).length} produtores e ${(D.plantios||[]).length} plantios.`);if(tab==='profile')profile();};

// Se o primeiro login trouxer uma base vazia, tenta um pull explícito uma única vez.
const login360=window.agroLoginResult;window.agroLoginResult=function(payload){if(typeof login360==='function')login360(payload);setTimeout(()=>{try{load();if(S.online&&(D.produtores||[]).length===0&&!sessionStorage.getItem('pull360')){sessionStorage.setItem('pull360','1');native('refreshData',+S.group_id||0)}}catch(e){}},450)};

// ---------- REGISTRO GPS COM TIPO ----------
const pointForm360=window.pointForm;window.pointForm=function(){const r=pointForm360.apply(this,arguments);setTimeout(()=>{
  const fc=document.querySelector('#screen .form-card');if(!fc||e360('ptype360'))return;
  const fields=fc.querySelectorAll('.field');const producer=fields[0];if(producer)producer.insertAdjacentHTML('afterend',`<label class="field"><span>Tipo do ponto</span><select id="ptype360"><option value="PRODUTOR">🌴 Produtor</option><option value="OBSERVACAO">📝 Observação</option><option value="ACESSO">🚧 Acesso</option><option value="RISCO">⚠ Risco</option><option value="FOTO">📷 Foto</option><option value="OUTRO">📍 Outro</option></select></label>`);
  const h=document.querySelector('#screen .page-head h1');if(h)h.textContent='Registro GPS';
},30);return r};

// ---------- CHAT: SEM DEPENDER DO ENDPOINT PARA LISTAR CONTATOS ----------
function users360(){
  const m=new Map(),me=+(S.user||{}).id;
  for(const u of [...(D.equipe||[]),...(D.chat_usuarios||[])]){const id=+u.id||0;if(id&&id!==me)m.set(id,{...(m.get(id)||{}),...u})}
  return [...m.values()].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
}
window.renderContacts352=function(){const root=e360('contacts352');if(!root)return;const q=norm(e360('contactSearch352')?.value||''),users=users360().filter(u=>!q||norm([u.nome,u.matricula,u.perfil_nome,u.perfil_codigo,u.polo_sigla].filter(Boolean).join(' ')).includes(q));root.innerHTML=`<div class="wa-contacts352">${users.map(u=>`<button class="wa-contact352" onclick="chatOpen352(0,${+u.id},'${escJs35(u.nome||'Usuário')}','${escJs35(u.foto_perfil_url||'')}')">${avatar352(u.foto_perfil_url,u.nome)}<span><b>${esc(u.nome||'Usuário')}</b><small>${esc([u.perfil_nome||u.perfil_codigo,u.polo_sigla].filter(Boolean).join(' · '))}</small></span></button>`).join('')||'<div class="wa-empty352"><b>Nenhum contato na base local</b><small>Abra Perfil e toque em “Sincronizar e atualizar base”.</small></div>'}</div>`};
const contacts360=window.chatContacts352;window.chatContacts352=function(){const r=contacts360.apply(this,arguments);setTimeout(()=>{if(e360('contacts352'))renderContacts352()},40);return r};

// ---------- MAPA DE CAMPO COMPARTILHADO ----------
function sharedPointItems360(mode){
  const me=+(S.user||{}).id,pm=new Map((D.produtores||[]).map(p=>[+p.id,p]));let out=[];
  if(mode==='shared'||mode==='minegps'){
    out=(D.pontos||[]).filter(p=>mode==='shared'||+p.tecnico_id===me).map(p=>({lat:+p.latitude,lng:+p.longitude,title:p.nome_produtor||meta360(p.tipo_ponto).label,sub:[p.tecnico_nome,p.comunidade_nome,brdt(p.capturado_em)].filter(Boolean).join(' · '),kind:'visit',type:String(p.tipo_ponto||'PRODUTOR').toUpperCase(),observation:p.observacao||'',id:+p.id||0,producer_id:+p.produtor_id||0,technician:p.tecnico_nome||'',captured:p.capturado_em||''}));
    for(const q of (Q||[]).filter(q=>q.type==='ponto.create'&&q.status!=='SYNCED')){const p=parse(q.payload_json,{});if(p.tipo_registro==='ESTIMATIVA')continue;out.push({lat:+p.latitude,lng:+p.longitude,title:p.nome_produtor||meta360(p.tipo_ponto).label,sub:'Salvo neste aparelho · aguardando sincronização',kind:'visit',type:String(p.tipo_ponto||'PRODUTOR').toUpperCase(),observation:p.observacao||'',local:true})}
  }else if(mode==='producers'){
    out=(D.plantios||[]).filter(x=>validCoord228(+x.latitude,+x.longitude)).map(x=>{const p=pm.get(+x.produtor_id)||{};return{lat:+x.latitude,lng:+x.longitude,title:p.nome||'Produtor',sub:[p.cpf,x.comunidade_nome,x.ano_plantio].filter(Boolean).join(' · '),kind:'producer',type:'PRODUTOR',producer_id:+x.produtor_id||0}});
  }
  return out.filter(p=>validCoord228(p.lat,p.lng));
}
window.pointItems228=function(mode,producerId){if(mode==='shared'||mode==='minegps'||mode==='producers')return sharedPointItems360(mode);if(mode==='producer')return sharedPointItems360('producers').filter(x=>+x.producer_id===+producerId);return sharedPointItems360('shared')};
window.draw228=function(){
  const c=e360('map228canvas');if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.round(r.width*d));c.height=Math.max(1,Math.round(r.height*d));const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,r.width,r.height);
  if(!S.online){x.fillStyle='#edf4ef';x.fillRect(0,0,r.width,r.height);x.strokeStyle='rgba(40,80,60,.08)';for(let i=0;i<r.width;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,r.height);x.stroke()}for(let j=0;j<r.height;j+=40){x.beginPath();x.moveTo(0,j);x.lineTo(r.width,j);x.stroke()}}
  for(const rr of X.map.routes||[]){if(rr.points.length<2)continue;x.beginPath();rr.points.forEach((p,i)=>{const q=screen228(p,r.width,r.height);i?x.lineTo(q.x,q.y):x.moveTo(q.x,q.y)});x.strokeStyle='#2563eb';x.lineWidth=3.5;x.lineJoin='round';x.lineCap='round';x.stroke()}
  for(const p of X.map.items||[]){const q=screen228(p,r.width,r.height);if(q.x<-18||q.y<-18||q.x>r.width+18||q.y>r.height+18)continue;const m=meta360(p.type);x.beginPath();x.arc(q.x,q.y,13,0,Math.PI*2);x.fillStyle=m.color;x.fill();x.strokeStyle='#fff';x.lineWidth=2.5;x.stroke();x.fillStyle='#fff';x.font='14px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(m.ico,q.x,q.y+1)}
  if(X.map.me&&validCoord228(+X.map.me.lat,+X.map.me.lng)){const q=screen228(X.map.me,r.width,r.height);x.beginPath();x.arc(q.x,q.y,9,0,Math.PI*2);x.fillStyle='#0ea5e9';x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.stroke();x.beginPath();x.arc(q.x,q.y,15,0,Math.PI*2);x.strokeStyle='rgba(14,165,233,.35)';x.lineWidth=4;x.stroke()}
};
window.renderSelected228=function(){const el=e360('map228info'),p=X.map.selected;if(!el)return;if(!p){el.innerHTML='<div class="map228-hint">Toque em um ícone para ver os detalhes. As observações só aparecem após selecionar o ponto.</div>';return}const m=meta360(p.type);el.innerHTML=`<div class="map360-info"><div class="map360-title"><span style="background:${m.color}">${m.ico}</span><div><b>${esc(p.title||m.label)}</b><small>${esc(m.label)}${p.sub?' · '+esc(p.sub):''}</small></div></div>${p.observation?`<div class="map360-observation"><small>OBSERVAÇÃO</small><p>${esc(p.observation)}</p></div>`:''}<div class="btn-row">${p.producer_id?`<button class="btn secondary" onclick="producerDetail228(${+p.producer_id})">Ver produtor</button>`:''}${p.id?`<button class="btn secondary" onclick="pointDetail(${+p.id})">Detalhes do GPS</button>`:''}</div></div>`};
window.map228=function(mode='shared'){
  load();if(mode==='mine')mode='shared';X.map.mode=mode;X.map.items=mode==='routes'?[]:pointItems228(mode);X.map.routes=mode==='routes'?routes228('mine'):[];X.map.selected=null;
  e360('screen').innerHTML=`<div class="map228-head"><div><h1>Mapa de campo</h1><p>${X.map.items.length} ponto(s) compartilhado(s)</p></div><div class="map360-head-actions"><button class="btn secondary" onclick="mapGps228()">◎ Minha posição</button><button class="btn primary" onclick="pointForm()">＋ Registro GPS</button></div></div><div class="map228-tabs"><button class="${mode==='shared'?'active':''}" onclick="map228('shared')">Pontos</button><button class="${mode==='producers'?'active':''}" onclick="map228('producers')">Produtores</button><button class="${mode==='minegps'?'active':''}" onclick="map228('minegps')">Meus GPS</button><button class="${mode==='routes'?'active':''}" onclick="map228('routes')">Minha rota</button></div><div class="map228-shell"><div id="map228tiles" class="map228-tiles"></div><canvas id="map228canvas"></canvas><div class="map228-controls"><button onclick="mapZoom228(1)">＋</button><button onclick="mapZoom228(-1)">−</button><button onclick="mapFit228()">⌗</button></div><div id="map228zoom" class="map228-zoom"></div><div class="map228-osm">${S.online?'© OpenStreetMap':'Mapa offline · pontos salvos no aparelho'}</div></div><div id="map228info"></div><div class="map360-legend">${Object.entries(ptMeta360).map(([k,m])=>`<span><i style="background:${m.color}">${m.ico}</i>${m.label}</span>`).join('')}</div>`;
  setTimeout(()=>{fit228();bindMap228();renderMap228();native('requestLocation','map228')},50);
};
window.map=function(mode='shared'){map228(mode==='mine'?'shared':mode)};
const loc360=window.agroLocationResult;window.agroLocationResult=function(tag,payload){if(tag==='map228'){const r=parse(payload,{});if(!r.ok)return toast(r.error||'GPS indisponível.','bad');X.map.me={lat:+r.latitude,lng:+r.longitude};X.map.center={lat:+r.latitude,lng:+r.longitude};X.map.zoom=Math.max(X.map.zoom||0,16);renderMap228();return}return typeof loc360==='function'?loc360(tag,payload):undefined};

setTimeout(removeHomeSync360,220);
})();
'''
s += hotfix
js_path.write_text(s,encoding='utf-8')

css=css_path.read_text(encoding='utf-8')
css += r'''

/* V3.6.0 Recovery */
#forceSync35,#forceSync351,#forceSync360{display:none!important}
.base-status360{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0;padding:12px;border:1px solid #d7e7df;border-radius:18px;background:#f6fbf8}.base-status360 div{min-width:0}.base-status360 small{display:block;font-size:10px;color:#73877f;font-weight:800}.base-status360 b{display:block;margin-top:3px;font-size:15px;color:#154b3c}.map360-head-actions{display:flex;gap:7px;align-items:center}.map360-head-actions .btn{white-space:nowrap}.map360-info{background:#fff;border:1px solid #dbe8e1;border-radius:18px;padding:14px;margin-top:10px;box-shadow:0 8px 24px rgba(15,70,50,.08)}.map360-title{display:flex;gap:10px;align-items:center}.map360-title>span{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:21px}.map360-title b,.map360-title small{display:block}.map360-title small{color:#71837c;margin-top:2px}.map360-observation{margin-top:12px;padding:11px 12px;border-radius:13px;background:#f5f8f6}.map360-observation small{font-size:10px;font-weight:800;color:#73877f}.map360-observation p{margin:5px 0 0;color:#173f34}.map360-legend{display:flex;gap:7px;overflow-x:auto;padding:10px 2px 2px}.map360-legend span{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:11px;color:#60736c}.map360-legend i{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;font-style:normal}
@media(max-width:380px){.base-status360{grid-template-columns:1fr 1fr}.map228-head{align-items:flex-start}.map360-head-actions{flex-direction:column;align-items:stretch}.map360-head-actions .btn{padding-left:10px;padding-right:10px}}
'''
css_path.write_text(css,encoding='utf-8')

g=gradle_path.read_text(encoding='utf-8')
g=re.sub(r"applicationId\s+'[^']+'", "applicationId 'com.agrodominium.mobile.v36'", g, count=1)
g=re.sub(r'versionCode\s+\d+','versionCode 360',g,count=1)
g=re.sub(r"versionName\s+'[^']+'","versionName '3.6.0'",g,count=1)
gradle_path.write_text(g,encoding='utf-8')

assert 'V3.6.0 — RECOVERY' in s
assert "applicationId 'com.agrodominium.mobile.v36'" in g
assert "versionName '3.6.0'" in g
print('V3.6.0 recovery applied')
