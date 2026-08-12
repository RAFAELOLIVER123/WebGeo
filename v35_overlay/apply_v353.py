from pathlib import Path
import re
root=Path('android-build/app')
main=root/'src/main/java/com/agrodominium/mobile/v3/MainActivity.java'
api=root/'src/main/java/com/agrodominium/mobile/v3/ApiClient.java'
sync=root/'src/main/java/com/agrodominium/mobile/v3/SyncCore.java'
js=root/'src/main/assets/app/app-v3.js'
gradle=root/'build.gradle'

j=main.read_text(encoding='utf-8')
anchor='    public class Bridge {'
if 'private void mergeChatDirectory353(JSONObject r)' not in j:
    helper=r'''    private void mergeChatDirectory353(JSONObject r){
        if(r==null||!r.optBoolean("ok"))return;
        try{
            JSONObject snap=new JSONObject(db.snapshot());JSONObject data=snap.optJSONObject("data");if(data==null){data=new JSONObject();snap.put("data",data);}
            if(r.optJSONArray("usuarios")!=null)data.put("chat_usuarios",r.getJSONArray("usuarios"));
            if(r.optJSONArray("chat_conversas")!=null)data.put("chat_conversas",r.getJSONArray("chat_conversas"));
            if(r.optJSONArray("chat_mensagens")!=null)data.put("chat_mensagens",r.getJSONArray("chat_mensagens"));
            db.saveSnapshot(snap.toString());
        }catch(Exception ignored){}
    }
    private void mergeChatHistory353(JSONObject r){
        if(r==null||!r.optBoolean("ok"))return;
        try{
            int cid=r.optInt("conversation_id",0);if(cid<=0)return;JSONObject snap=new JSONObject(db.snapshot());JSONObject data=snap.optJSONObject("data");if(data==null){data=new JSONObject();snap.put("data",data);}JSONArray old=data.optJSONArray("chat_mensagens"),fresh=r.optJSONArray("chat_mensagens"),out=new JSONArray();
            if(old!=null)for(int i=0;i<old.length();i++){JSONObject m=old.optJSONObject(i);if(m!=null&&m.optInt("conversa_id",0)!=cid)out.put(m);}if(fresh!=null)for(int i=0;i<fresh.length();i++){JSONObject m=fresh.optJSONObject(i);if(m!=null)out.put(m);}data.put("chat_mensagens",out);db.saveSnapshot(snap.toString());
        }catch(Exception ignored){}
    }

'''
    if anchor not in j: raise SystemExit('Bridge anchor missing')
    j=j.replace(anchor,helper+anchor,1)
old='@JavascriptInterface public void requestChatDirectory(){io.execute(()->{try{JSONObject r=ApiClient.chatUsers(MainActivity.this,prefs.getInt("group_id",0));js1("agroChatUsersResult",r.toString());}catch(Exception e){js1("agroChatUsersResult",err(e.getMessage()).toString());}});}'
new='@JavascriptInterface public void requestChatDirectory(){io.execute(()->{try{JSONObject r=ApiClient.chatUsers(MainActivity.this,prefs.getInt("group_id",0));if(r.optBoolean("ok"))mergeChatDirectory353(r);js1("agroChatUsersResult",r.toString());}catch(Exception e){js1("agroChatUsersResult",err(e.getMessage()).toString());}});}'
if old in j:j=j.replace(old,new,1)
oldh='@JavascriptInterface public void requestChatHistory(int conversationId){if(conversationId<=0)return;io.execute(()->{try{JSONObject r=ApiClient.chatHistory(MainActivity.this,prefs.getInt("group_id",0),conversationId);js1("agroChatHistoryResult",r.toString());}catch(Exception e){js1("agroChatHistoryResult",err(e.getMessage()).toString());}});}'
newh='@JavascriptInterface public void requestChatHistory(int conversationId){if(conversationId<=0)return;io.execute(()->{try{JSONObject r=ApiClient.chatHistory(MainActivity.this,prefs.getInt("group_id",0),conversationId);if(r.optBoolean("ok"))mergeChatHistory353(r);js1("agroChatHistoryResult",r.toString());}catch(Exception e){js1("agroChatHistoryResult",err(e.getMessage()).toString());}});}'
if oldh in j:j=j.replace(oldh,newh,1)
olds='@JavascriptInterface public void syncNow(){io.execute(()->{js1("agroSyncProgress","{\\"message\\":\\"Enviando registros pendentes…\\"}");JSONObject r=SyncCore.syncAll(MainActivity.this);js1("agroSyncResult",r.toString());});}'
news='@JavascriptInterface public void syncNow(){io.execute(()->{try{js1("agroSyncProgress","{\\"message\\":\\"Enviando pendências e baixando a base…\\"}");JSONObject r=SyncCore.syncAll(MainActivity.this);JSONObject dir=ApiClient.chatUsers(MainActivity.this,prefs.getInt("group_id",0));if(dir.optBoolean("ok")){mergeChatDirectory353(dir);r.put("chat_directory",dir).put("chat_atualizado",true);}else r.put("chat_atualizado",false).put("chat_error",dir.optString("error","Falha ao baixar mensagens."));js1("agroSyncResult",r.toString());}catch(Exception e){js1("agroSyncResult",err(e.getMessage()).toString());}});}'
if olds not in j:raise SystemExit('syncNow anchor missing')
j=j.replace(olds,news,1)
j=j.replace('j.put("version","3.5.0")','j.put("version","3.5.3")')
main.write_text(j,encoding='utf-8')

ap=api.read_text(encoding='utf-8').replace('AgroDominium-Android/3.5.0','AgroDominium-Android/3.5.3').replace('c.setConnectTimeout(20000);c.setReadTimeout(60000);','c.setConnectTimeout(25000);c.setReadTimeout(120000);')
api.write_text(ap,encoding='utf-8')

sc=sync.read_text(encoding='utf-8')
oldblock='''            boolean base=false;try{int gid=prefs.getInt("group_id",0);JSONObject b=ApiClient.request(ctx,"bootstrap","GET",null,gid);if(b.optBoolean("ok")){db.saveSnapshot(b.toString());base=true;if(b.optJSONObject("user")!=null)prefs.edit().putString("user",b.getJSONObject("user").toString()).apply();if(b.optJSONArray("groups")!=null)prefs.edit().putString("groups",b.getJSONArray("groups").toString()).apply();}}catch(Exception ignored){}\n            out.put("ok",fail==0).put("synced",ok).put("failed",fail).put("pending",db.pendingCount()).put("base_atualizada",base).put("results",results).put("message",ok+" registro(s) enviado(s). "+db.pendingCount()+" pendente(s).");'''
newblock='''            boolean base=false;String baseError="";try{int gid=prefs.getInt("group_id",0);JSONObject b=ApiClient.request(ctx,"bootstrap","GET",null,gid);if(b.optBoolean("ok")){db.saveSnapshot(b.toString());base=true;if(b.optJSONObject("user")!=null)prefs.edit().putString("user",b.getJSONObject("user").toString()).apply();if(b.optJSONArray("groups")!=null)prefs.edit().putString("groups",b.getJSONArray("groups").toString()).apply();}else baseError=b.optString("error","O servidor não devolveu a base atualizada.");}catch(Exception e){baseError=e.getMessage()==null?"Falha ao baixar a base.":e.getMessage();}\n            boolean allOk=fail==0&&base;String msg=base?(ok+" registro(s) enviado(s). Base baixada e gravada no aparelho."):(ok+" registro(s) enviado(s), mas a base não foi baixada: "+baseError);out.put("ok",allOk).put("synced",ok).put("failed",fail).put("pending",db.pendingCount()).put("base_atualizada",base).put("base_error",baseError).put("results",results).put("message",msg);'''
if oldblock not in sc:raise SystemExit('SyncCore base block missing')
sc=sc.replace(oldblock,newblock,1)
sync.write_text(sc,encoding='utf-8')

s=js.read_text(encoding='utf-8')
s += r'''

/* AgroDominium Android V3.5.3 — pull confirmado + chat independente do realtime */
(function(){
'use strict';
const x353=id=>document.getElementById(id);
function applyDirectory353(r){if(!r||!r.ok)return false;if(Array.isArray(r.usuarios))D.chat_usuarios=r.usuarios;if(Array.isArray(r.chat_conversas))D.chat_conversas=r.chat_conversas;if(Array.isArray(r.chat_mensagens))D.chat_mensagens=r.chat_mensagens;return true;}
window.agroChatUsersResult=function(payload){const r=parse(payload,{});if(!r.ok)return toast(r.error||'Não foi possível baixar contatos e conversas.','bad');applyDirectory353(r);if(x353('contacts352'))renderContacts352();if(x353('chatList35'))renderConversations352();};
const sync353=window.agroSyncResult;window.agroSyncResult=function(payload){const r=parse(payload,{});if(r.chat_directory)applyDirectory353(r.chat_directory);if(typeof sync353==='function')sync353(payload);if(r.base_atualizada&&x353('chatList35'))renderConversations352();if(!r.base_atualizada&&r.base_error)toast('Dados enviados, mas falhou o download: '+r.base_error,'bad');};
const chat353=window.chat231;window.chat231=function(){const r=chat353.apply(this,arguments);native('requestChatDirectory');return r};
window.chatRefresh35=function(){toast('Baixando contatos e conversas…');native('requestChatDirectory');native('requestRealtime')};
})();
'''
js.write_text(s,encoding='utf-8')

g=gradle.read_text(encoding='utf-8');g=re.sub(r'versionCode\s+\d+','versionCode 353',g,count=1);g=re.sub(r"versionName\s+'[^']+'","versionName '3.5.3'",g,count=1);gradle.write_text(g,encoding='utf-8')
assert 'mergeChatDirectory353' in j and 'base não foi baixada' in sc and 'V3.5.3 — pull confirmado' in s and "versionName '3.5.3'" in g
print('V3.5.3 applied')
