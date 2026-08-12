from pathlib import Path
import re

root=Path('android-build/app')
js_path=root/'src/main/assets/app/app-v3.js'
css_path=root/'src/main/assets/app/style-v3.css'
java_path=root/'src/main/java/com/agrodominium/mobile/v3/MainActivity.java'
manifest_path=root/'src/main/AndroidManifest.xml'
paths_path=root/'src/main/res/xml/file_paths.xml'
gradle_path=root/'build.gradle'

j=java_path.read_text(encoding='utf-8')
if 'android.media.MediaScannerConnection' not in j:
    j=j.replace('import android.media.MediaPlayer;','import android.media.MediaPlayer;\nimport android.media.MediaScannerConnection;')
old='for(String x:new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.CAMERA,Manifest.permission.RECORD_AUDIO})if(checkSelfPermission(x)!=PackageManager.PERMISSION_GRANTED)p.add(x);'
new='for(String x:new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.CAMERA,Manifest.permission.RECORD_AUDIO})if(checkSelfPermission(x)!=PackageManager.PERMISSION_GRANTED)p.add(x);if(Build.VERSION.SDK_INT<=28&&checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED)p.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);'
if old in j:j=j.replace(old,new,1)
bridge_anchor='@JavascriptInterface public void playChatAudio(String id){int mid=toInt(id);if(mid<=0)return;io.execute(()->playChatAudioInternal(mid));}'
bridge_new=bridge_anchor+'\n        @JavascriptInterface public void downloadChatFile(String id,String mode){int mid=toInt(id);if(mid<=0)return;String md=mode==null?"save":mode;io.execute(()->downloadChatFileInternal(mid,md));}'
if 'downloadChatFile(String id,String mode)' not in j:
    if bridge_anchor not in j: raise SystemExit('bridge anchor not found')
    j=j.replace(bridge_anchor,bridge_new,1)
method_anchor='    private void playChatAudioInternal(int messageId){'
if 'private void downloadChatFileInternal(int messageId,String mode)' not in j:
    idx=j.find(method_anchor)
    if idx<0: raise SystemExit('method anchor not found')
    methods=r'''    private static String safeDownloadName(String name){String n=(name==null||name.trim().isEmpty())?"arquivo":name.trim();n=n.replaceAll("[\\\\/:*?\\\"<>|\\p{Cntrl}]","_");if(n.length()>180)n=n.substring(Math.max(0,n.length()-180));return n;}
    private void downloadChatFileInternal(int messageId,String mode){
        try{
            JSONObject r=ApiClient.chatFile(MainActivity.this,prefs.getInt("group_id",0),messageId);
            if(r==null||!r.optBoolean("ok"))throw new IOException(r==null?"Arquivo indisponível.":r.optString("error","Arquivo indisponível."));
            String data=r.optString("data","");if(data.isEmpty())throw new IOException("Arquivo vazio.");
            String raw=data.contains(",")?data.substring(data.indexOf(',')+1):data;byte[] bytes=Base64.decode(raw,Base64.DEFAULT);
            String name=safeDownloadName(r.optString("name","arquivo"));String mime=r.optString("mime_type",mimeFor(name));if(mime==null||mime.isEmpty())mime="application/octet-stream";
            Uri outUri=null;File outFile=null;String folder="Downloads/AgroDominium/Conversas";
            if(Build.VERSION.SDK_INT>=29){
                ContentValues cv=new ContentValues();cv.put(MediaStore.Downloads.DISPLAY_NAME,name);cv.put(MediaStore.Downloads.MIME_TYPE,mime);cv.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/AgroDominium/Conversas");cv.put(MediaStore.Downloads.IS_PENDING,1);
                outUri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,cv);if(outUri==null)throw new IOException("Não foi possível criar o arquivo em Downloads.");
                try(OutputStream o=getContentResolver().openOutputStream(outUri)){if(o==null)throw new IOException("Falha ao abrir destino do arquivo.");o.write(bytes);}ContentValues done=new ContentValues();done.put(MediaStore.Downloads.IS_PENDING,0);getContentResolver().update(outUri,done,null,null);
            }else{
                File dir=new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),"AgroDominium/Conversas");if(!dir.exists()&&!dir.mkdirs()&&!dir.isDirectory())throw new IOException("Não foi possível criar a pasta de downloads.");
                outFile=new File(dir,System.currentTimeMillis()+"_"+name);try(FileOutputStream o=new FileOutputStream(outFile)){o.write(bytes);}final String scanMime=mime;MediaScannerConnection.scanFile(this,new String[]{outFile.getAbsolutePath()},new String[]{scanMime},null);outUri=FileProvider.getUriForFile(this,getPackageName()+".files",outFile);
            }
            final Uri finalUri=outUri;final String finalMime=mime;final String finalName=name;JSONObject ok=new JSONObject().put("ok",true).put("id",messageId).put("name",name).put("folder",folder).put("uri",outUri==null?"":outUri.toString());
            js1("agroChatDownloadResult",ok.toString());
            if("open".equalsIgnoreCase(mode)||"play".equalsIgnoreCase(mode))runOnUiThread(()->{try{Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(finalUri,finalMime);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(Intent.createChooser(i,"Abrir "+finalName));}catch(Exception e){js1("agroChatDownloadResult",err("Arquivo salvo, mas não há aplicativo compatível para abrir.").toString());}});
        }catch(Exception e){js1("agroChatDownloadResult",err(e.getMessage()).toString());}
    }
'''
    j=j[:idx]+methods+j[idx:]
java_path.write_text(j,encoding='utf-8')

m=manifest_path.read_text(encoding='utf-8')
perm='    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />\n'
if 'WRITE_EXTERNAL_STORAGE' not in m:m=m.replace('    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n','    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n'+perm)
manifest_path.write_text(m,encoding='utf-8')
p=paths_path.read_text(encoding='utf-8')
if '<external-path name="downloads"' not in p:p=p.replace('</paths>','    <external-path name="downloads" path="Download/" />\n</paths>')
paths_path.write_text(p,encoding='utf-8')

s=js_path.read_text(encoding='utf-8')
hotfix=r'''

/* AgroDominium Android V3.5.2 — chat mobile, contatos, avatars, downloads locais e sync único */
(function(){
'use strict';
const SITE352='https://salmon-woodcock-375027.hostingersite.com/';
const e352=id=>document.getElementById(id);
function photoUrl352(v){let p=String(v||'').trim();if(!p)return'';if(/^data:|^https?:\/\//i.test(p))return p;p=p.replace(/^\.\//,'').replace(/^\//,'');return SITE352+p;}
function avatar352(photo,name,cls='chat-avatar352'){const p=photoUrl352(photo),n=String(name||'U').trim();return p?`<span class="${cls}"><img src="${esc(p)}" alt="" onerror="this.parentNode.innerHTML='${esc(n.slice(0,1).toUpperCase())}'"></span>`:`<span class="${cls}">${esc(n.slice(0,1).toUpperCase())}</span>`}
function user352(id){return (D.chat_usuarios||[]).find(x=>+x.id===+id)||null}
function convPhoto352(c){return c?.direto_foto||c?.foto_perfil_url||user352(c?.direto_usuario_id)?.foto_perfil_url||''}
function fmtTime352(v){const x=String(v||'');if(!x)return'';if(x.length>=16)return x.slice(11,16);return x}
function cleanupSync352(){document.querySelectorAll('#forceSync35,#forceSync351').forEach(x=>x.remove());const hero=document.querySelector('#screen .hero-actions');if(hero){const bs=[...hero.querySelectorAll('button')].filter(x=>/Sincroniza/i.test(x.textContent||''));bs.forEach((b,i)=>{b.style.setProperty('display',i===0?'inline-flex':'none','important')})}}
window.postRender34=function(){try{replaceText34();dedupe34();if(tab==='home'||tab==='profile')injectRecords34()}catch(e){}cleanupSync352();}
const h352=window.home;window.home=function(){const r=h352.apply(this,arguments);setTimeout(cleanupSync352,20);setTimeout(cleanupSync352,190);return r};
const mh352=window.managerHome;window.managerHome=function(){const r=mh352.apply(this,arguments);setTimeout(cleanupSync352,20);setTimeout(cleanupSync352,210);return r};
const pr352=window.profile;window.profile=function(){const r=pr352.apply(this,arguments);setTimeout(cleanupSync352,20);setTimeout(cleanupSync352,210);return r};
function renderConversations352(){const root=e352('chatList35');if(!root)return;const q=norm(e352('chatSearch35')?.value||''),convs=(Array.isArray(D.chat_conversas)?D.chat_conversas:[]).filter(c=>!q||norm([chatTitle35(c),c.ultima_mensagem,c.preview].filter(Boolean).join(' ')).includes(q));root.innerHTML=`<div class="wa-convs352">${convs.map(c=>{const title=chatTitle35(c),prev=String(c.ultima_mensagem||c.preview||'').trim()||(/AUDIO/i.test(c.ultimo_tipo||'')?'🎙 Áudio':/IMAGEM/i.test(c.ultimo_tipo||'')?'📷 Imagem':/ARQUIVO/i.test(c.ultimo_tipo||'')?'📎 Arquivo':'');return `<button class="wa-conv352" onclick="chatOpen352(${+c.id||0},${+c.direto_usuario_id||0},'${escJs35(title)}','${escJs35(convPhoto352(c))}')">${avatar352(convPhoto352(c),title)}<span class="wa-body352"><span class="wa-line352"><b>${esc(title)}</b><time>${esc(fmtTime352(c.ultima_data||c.updated_at))}</time></span><span class="wa-line352 preview"><small>${esc(prev||'Toque para conversar')}</small>${+c.nao_lidas?`<em>${+c.nao_lidas}</em>`:''}</span></span></button>`}).join('')||'<div class="wa-empty352"><b>Nenhuma conversa ainda</b><small>Toque em Contatos para iniciar uma conversa.</small></div>'}</div>`}
window.renderChatList35=renderConversations352;
window.chat231=function(){load();V35.chat={conversationId:0,partnerId:0,title:'Mensagens',files:[],recording:false,avatar:''};native('setRealtimeConversation',0,0);open(()=>{e352('screen').innerHTML=`<div class="wa-page352"><div class="wa-top352">${back()}<div class="wa-title352"><h1>Mensagens</h1><small>AgroDominium</small></div><button class="wa-contact-btn352" onclick="chatContacts352()" title="Contatos">👤<span>Contatos</span></button></div><div class="wa-search352"><span>⌕</span><input id="chatSearch35" placeholder="Pesquisar conversas" oninput="renderChatList35()"></div><div id="chatList35"><div class="wa-empty352"><small>Carregando conversas…</small></div></div></div>`;renderConversations352();native('requestChatDirectory');native('requestRealtime')})};
window.chatContacts352=function(){load();open(()=>{e352('screen').innerHTML=`<div class="wa-page352"><div class="wa-top352">${back()}<div class="wa-title352"><h1>Contatos</h1><small>Selecione uma pessoa</small></div></div><div class="wa-search352"><span>⌕</span><input id="contactSearch352" placeholder="Pesquisar contato" oninput="renderContacts352()"></div><div id="contacts352"></div></div>`;renderContacts352();native('requestChatDirectory')})};
window.renderContacts352=function(){const root=e352('contacts352');if(!root)return;const q=norm(e352('contactSearch352')?.value||''),users=chatUsers35().filter(u=>!q||norm([u.nome,u.matricula,u.perfil_nome,u.perfil_codigo,u.polo_sigla].filter(Boolean).join(' ')).includes(q));root.innerHTML=`<div class="wa-contacts352">${users.map(u=>`<button class="wa-contact352" onclick="chatOpen352(0,${+u.id},'${escJs35(u.nome||'Usuário')}','${escJs35(u.foto_perfil_url||'')}')">${avatar352(u.foto_perfil_url,u.nome)}<span><b>${esc(u.nome||'Usuário')}</b><small>${esc([u.perfil_nome||u.perfil_codigo,u.polo_sigla].filter(Boolean).join(' · '))}</small></span></button>`).join('')||'<div class="wa-empty352"><b>Nenhum contato encontrado</b><small>Sincronize o aplicativo e tente novamente.</small></div>'}</div>`};
window.chatOpen352=function(cid,pid,title,avatar){V35.chat={conversationId:+cid||0,partnerId:+pid||0,title:title||'Conversa',files:[],recording:false,avatar:avatar||''};V34.chat={...V34.chat,...V35.chat};window.__agroChatState={conversationId:V35.chat.conversationId,partnerId:V35.chat.partnerId,title:V35.chat.title};native('setRealtimeConversation',V35.chat.conversationId,0);open(()=>renderChatRoom352(!!V35.chat.conversationId));if(V35.chat.conversationId)native('requestChatHistory',V35.chat.conversationId);native('requestRealtime')};
window.chatOpen231=function(cid,pid,title){const u=user352(pid);window.chatOpen352(cid,pid,title,(u&&u.foto_perfil_url)||'')};
function att352(f){const k=kind35(f),id=+f.server_id||0,path=String(f.path||'').replace(/'/g,"\\'");if(id){const icon=k==='AUDIO'?'🎙':k==='IMAGEM'?'📷':'📎',label=k==='AUDIO'?'Áudio':k==='IMAGEM'?'Imagem':(f.name||'Arquivo');return `<div class="wa-att352 ${k.toLowerCase()}"><button class="wa-att-open352" onclick="downloadChat352(${id},'open')"><span>${icon}</span><span><b>${esc(label)}</b><small>${k==='AUDIO'&&f.duracao_segundos?Math.round(f.duracao_segundos)+' s':'Toque para baixar e abrir'}</small></span></button><button class="wa-download352" onclick="downloadChat352(${id},'save')" title="Baixar">↓</button></div>`}return `<button class="wa-att352 local" onclick="native('openLocalFile','${path}')"><span>📎</span><span><b>${esc(f.name||'Arquivo no aparelho')}</b><small>Arquivo local</small></span></button>`}
window.downloadChat352=function(id,mode){toast(mode==='save'?'Baixando arquivo…':'Preparando arquivo…');native('downloadChatFile',String(id),mode||'save')};
window.agroChatDownloadResult=function(payload){const r=parse(payload,{});if(!r.ok)return toast(r.error||'Não foi possível baixar o arquivo.','bad');toast(`Salvo em ${r.folder||'Downloads/AgroDominium/Conversas'}.`)};
window.renderChatRoom352=function(loading=false){const root=e352('screen');if(!root)return;const msgs=groupedChat35(),me=+(S.user||{}).id;root.innerHTML=`<div id="chatRoom35" class="wa-room352"><div class="wa-chat-head352">${back()}${avatar352(V35.chat.avatar,V35.chat.title,'wa-avatar-head352')}<div class="wa-chat-name352"><b>${esc(V35.chat.title)}</b><small>${S.online?'online':'offline'}</small></div><button class="wa-head-sync352" onclick="chatRefreshRoom35()">↻</button></div><div id="chatMsgs35" class="wa-msgs352">${loading&&!msgs.length?'<div class="wa-empty352"><small>Carregando mensagens…</small></div>':msgs.map(g=>{const own=g._local||+g.usuario_id===me;return `<div class="wa-bubble352 ${own?'mine':'other'}">${g.mensagem?`<div class="wa-text352">${esc(g.mensagem)}</div>`:''}${g.files.map(att352).join('')}<div class="wa-meta352"><span>${String(g.created_at||'').slice(11,16)}</span>${g._local?`<span>${g._status==='FAILED'?'⚠':'✓'}</span>`:own?'<span>✓✓</span>':''}</div>${g._error?`<small class="chat-error34">${esc(g._error)}</small>`:''}</div>`}).join('')||'<div class="wa-empty352"><small>Nenhuma mensagem ainda.</small></div>'}</div><div id="chatFiles35" class="chat-files34"></div><div class="wa-compose352"><button onclick="document.getElementById('chatAttach35').click()">📎</button><input id="chatAttach35" type="file" multiple style="display:none" onchange="chatFiles35(this.files)"><textarea id="chatText35" rows="1" placeholder="Mensagem"></textarea><button id="chatAudio35" onclick="toggleAudio35()">🎙</button><button class="send" onclick="sendChat35()">➤</button></div></div>`;drawPendingChat35();setTimeout(()=>{const e=e352('chatMsgs35');if(e)e.scrollTop=e.scrollHeight},20)};
window.renderChatRoom35=window.renderChatRoom352;
window.agroChatHistoryResult=function(payload){const r=parse(payload,{});if(!r.ok)return toast(r.error||'Não foi possível carregar o histórico.','bad');const cid=+r.conversation_id||0;if(cid){D.chat_mensagens=(D.chat_mensagens||[]).filter(x=>+x.conversa_id!==cid).concat(Array.isArray(r.chat_mensagens)?r.chat_mensagens:[]);native('setRealtimeConversation',cid,+r.last_id||0)}if(e352('chatRoom35')&&cid===V35.chat.conversationId)renderChatRoom352(false)};
window.agroChatUsersResult=function(payload){const r=parse(payload,{});if(!r.ok)return toast(r.error||'Não foi possível carregar os contatos.','bad');D.chat_usuarios=Array.isArray(r.usuarios)?r.usuarios:[];if(e352('contacts352'))renderContacts352();if(e352('chatList35'))renderConversations352()};
window.agroRealtimeResult=function(payload){const r=parse(payload,{});if(!r.ok)return;const cid=V35&&V35.chat?+V35.chat.conversationId||0:0,before=(D.chat_mensagens||[]).filter(x=>+x.conversa_id===cid).reduce((m,x)=>Math.max(m,+x.id||0),0);if(Array.isArray(r.notifications))D.notificacoes=r.notifications;if(Array.isArray(r.chat_conversas))D.chat_conversas=r.chat_conversas;if(Array.isArray(r.chat_mensagens)){const map=new Map((D.chat_mensagens||[]).map(x=>[+x.id,x]));for(const m of r.chat_mensagens)map.set(+m.id,m);D.chat_mensagens=[...map.values()]}const after=(D.chat_mensagens||[]).filter(x=>+x.conversa_id===cid).reduce((m,x)=>Math.max(m,+x.id||0),0);if(e352('chatRoom35')&&after>before){native('requestChatHistory',cid);return}if(e352('chatList35'))renderConversations352()};
setTimeout(cleanupSync352,250);
})();
'''
s += hotfix
js_path.write_text(s,encoding='utf-8')

css=css_path.read_text(encoding='utf-8')
css += r'''

/* AgroDominium V3.5.2 — WhatsApp-like mobile chat */
#forceSync35,#forceSync351{display:none!important}
.wa-page352,.wa-room352{height:100%;min-height:0;display:flex;flex-direction:column;background:#f7faf8}.wa-top352,.wa-chat-head352{display:flex;align-items:center;gap:10px;padding:10px 2px 12px;flex:none}.wa-top352 .back,.wa-chat-head352 .back{width:42px;height:42px;flex:none}.wa-title352,.wa-chat-name352{min-width:0;flex:1}.wa-title352 h1{font-size:25px;margin:0}.wa-title352 small,.wa-chat-name352 small{display:block;color:var(--muted);margin-top:2px}.wa-contact-btn352{height:44px;border:0;border-radius:14px;background:#e7f4ed;color:var(--green);padding:0 12px;display:flex;align-items:center;gap:6px;font-weight:800}.wa-search352{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:0 13px;margin:0 0 12px}.wa-search352 input{border:0!important;outline:0!important;background:transparent!important;width:100%;height:48px;font-size:15px}.wa-convs352,.wa-contacts352{display:flex;flex-direction:column;background:#fff;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,.05)}.wa-conv352,.wa-contact352{border:0;background:#fff;display:flex;align-items:center;gap:12px;text-align:left;padding:11px 13px;min-height:68px}.wa-conv352+.wa-conv352,.wa-contact352+.wa-contact352{border-top:1px solid #eef2ef}.chat-avatar352,.wa-avatar-head352{width:48px;height:48px;border-radius:50%;background:#e5f3ec;color:var(--green);display:grid;place-items:center;font-size:19px;font-weight:900;overflow:hidden;flex:none}.chat-avatar352 img,.wa-avatar-head352 img{width:100%;height:100%;object-fit:cover}.wa-avatar-head352{width:42px;height:42px}.wa-body352{min-width:0;flex:1}.wa-line352{display:flex;align-items:center;justify-content:space-between;gap:10px}.wa-line352 b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wa-line352 time{font-size:10px;color:var(--muted);flex:none}.wa-line352.preview small{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100vw - 155px)}.wa-line352.preview em{font-style:normal;background:var(--green);color:#fff;border-radius:999px;min-width:20px;height:20px;padding:0 5px;display:grid;place-items:center;font-size:10px}.wa-contact352>span:last-child{display:grid;min-width:0}.wa-contact352 b{font-size:15px}.wa-contact352 small{color:var(--muted);margin-top:3px}.wa-empty352{padding:28px;text-align:center;color:var(--muted);display:grid;gap:4px}.wa-chat-head352{background:#fff;margin:-12px -14px 0;padding:10px 12px;border-bottom:1px solid #e8ece9;position:sticky;top:0;z-index:20}.wa-head-sync352{width:40px;height:40px;border:0;border-radius:50%;background:#eef6f1;color:var(--green);font-size:18px}.wa-msgs352{flex:1;min-height:0;overflow:auto;padding:12px 4px 16px;display:flex;flex-direction:column;gap:6px;background:linear-gradient(rgba(246,249,247,.94),rgba(246,249,247,.94)),radial-gradient(circle at 10px 10px,#dce9e1 1px,transparent 1.2px);background-size:auto,20px 20px;overscroll-behavior:contain}.wa-bubble352{max-width:84%;border-radius:14px;padding:8px 9px 5px;box-shadow:0 1px 2px rgba(0,0,0,.08);word-break:break-word}.wa-bubble352.other{align-self:flex-start;background:#fff;border-top-left-radius:4px}.wa-bubble352.mine{align-self:flex-end;background:#d9f5e4;border-top-right-radius:4px}.wa-text352{font-size:14px;line-height:1.4;white-space:pre-wrap}.wa-meta352{display:flex;justify-content:flex-end;gap:4px;font-size:9px;color:#6f7f77;margin-top:3px}.wa-att352{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.58);border-radius:11px;margin-top:5px;overflow:hidden}.wa-att-open352,.wa-att352.local{border:0;background:transparent;display:flex;align-items:center;gap:9px;text-align:left;padding:8px;min-width:0;flex:1}.wa-att-open352>span:first-child{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(13,116,76,.1);font-size:17px}.wa-att-open352>span:last-child{display:grid;min-width:0}.wa-att-open352 b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wa-att-open352 small{font-size:9px;color:var(--muted);margin-top:2px}.wa-download352{width:38px;align-self:stretch;border:0;border-left:1px solid rgba(0,0,0,.06);background:transparent;color:var(--green);font-size:19px}.wa-compose352{display:grid;grid-template-columns:40px minmax(0,1fr) 40px 44px;gap:5px;align-items:end;background:#f7faf8;padding:7px 0 max(7px,env(safe-area-inset-bottom));flex:none}.wa-compose352 textarea{min-height:44px;max-height:100px;resize:none;border:1px solid var(--line);border-radius:21px;padding:11px 13px;background:#fff}.wa-compose352 button{height:44px;border:0;border-radius:50%;background:#eef5f1;font-size:18px}.wa-compose352 .send{background:var(--green);color:#fff}.wa-compose352 button.recording{background:#fee2e2;color:#b91c1c;animation:agroPulse231 1s infinite}@media(max-width:380px){.wa-contact-btn352 span{display:none}.wa-contact-btn352{width:44px;padding:0;justify-content:center}.chat-avatar352{width:44px;height:44px}.wa-conv352,.wa-contact352{padding:10px}.wa-bubble352{max-width:90%}}
'''
css_path.write_text(css,encoding='utf-8')

g=gradle_path.read_text(encoding='utf-8')
g=re.sub(r'versionCode\s+\d+','versionCode 352',g,count=1)
g=re.sub(r"versionName\s+'[^']+'","versionName '3.5.2'",g,count=1)
gradle_path.write_text(g,encoding='utf-8')
assert 'downloadChatFile(String id,String mode)' in j
assert 'V3.5.2 — chat mobile' in s
assert "versionName '3.5.2'" in g
print('V3.5.2 applied')
