import {DurableObject} from 'cloudflare:workers';
import {PALETTE,readPose,roomName,type Visitor,type ServerEvent} from '../shared/protocol';
interface Env {WORLD:DurableObjectNamespace<OfficeWorld>;ASSETS:Fetcher}
type Session={visitor:Visitor;lastSeen:number;lastMove:number;seq:number;closed?:boolean};
const MAX_VISITORS=24;
const IDLE_MS=90_000;
export class OfficeWorld extends DurableObject<Env> {
 private sessions(){return this.ctx.getWebSockets().map(ws=>({ws,data:ws.deserializeAttachment() as Session})).filter(s=>s.data&&!s.data.closed);}
 private visitors(){return this.sessions().map(s=>s.data.visitor);}
 private broadcast(event:ServerEvent,except?:WebSocket){const text=JSON.stringify(event);for(const {ws} of this.sessions()){if(ws!==except){try{ws.send(text);}catch{this.depart(ws);}}}}
 private depart(ws:WebSocket){const s=ws.deserializeAttachment() as Session|undefined;if(!s||s.closed)return;s.closed=true;ws.serializeAttachment(s);this.broadcast({type:'leave',id:s.visitor.id},ws);}
 async fetch(request:Request){
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  const sessions=this.sessions();if(sessions.length>=MAX_VISITORS)return new Response('로비가 가득 찼어요. 잠시 후 다시 들어와 주세요.',{status:503});
  const slot=Array.from({length:MAX_VISITORS},(_,i)=>i).find(i=>!sessions.some(s=>s.data.visitor.name===`종이 ${String(i+1).padStart(2,'0')}`))!;
  const angle=slot*2.399;
  const visitor:Visitor={id:crypto.randomUUID(),name:`종이 ${String(slot+1).padStart(2,'0')}`,color:PALETTE[slot%PALETTE.length],x:slot===0?0:Math.sin(angle)*2,z:slot===0?7:7+Math.cos(angle)*1.5,yaw:Math.PI,moving:false};
  const pair=new WebSocketPair();const [client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);
  server.serializeAttachment({visitor,lastSeen:Date.now(),lastMove:0,seq:-1} satisfies Session);
  server.send(JSON.stringify({type:'welcome',self:visitor,visitors:this.visitors()} satisfies ServerEvent));
  this.broadcast({type:'join',visitor},server);
  if(await this.ctx.storage.getAlarm()===null)await this.ctx.storage.setAlarm(Date.now()+30_000);
  return new Response(null,{status:101,webSocket:client});
 }
 webSocketMessage(ws:WebSocket,raw:string|ArrayBuffer){
  if(typeof raw!=='string'||raw.length>512){ws.close(1009,'Message too large');this.depart(ws);return;}
  const s=ws.deserializeAttachment() as Session;if(!s||s.closed)return;
  let data;try{data=JSON.parse(raw);}catch{return;}if(!data||typeof data!=='object')return;
  const now=Date.now();
  if(data.type==='ping'){
   if(now-s.lastSeen<1000)return;s.lastSeen=now;ws.serializeAttachment(s);
   ws.send(JSON.stringify({type:'pong',visitors:this.visitors()} satisfies ServerEvent));return;
  }
  if(data.type!=='move'||!Number.isSafeInteger(data.seq)||data.seq<=s.seq||now-s.lastMove<45)return;
  const pose=readPose(data);if(!pose)return;
  s.visitor={...s.visitor,...pose};s.seq=data.seq;s.lastMove=now;s.lastSeen=now;ws.serializeAttachment(s);
  this.broadcast({type:'move',visitor:s.visitor},ws);
 }
 webSocketClose(ws:WebSocket){this.depart(ws);}
 webSocketError(ws:WebSocket){this.depart(ws);try{ws.close(1011,'Connection interrupted');}catch{}}
 async alarm(){
  const now=Date.now();for(const {ws,data} of this.sessions()){if(now-data.lastSeen>IDLE_MS){this.depart(ws);try{ws.close(1001,'Idle');}catch{}}}
  if(this.sessions().length)await this.ctx.storage.setAlarm(now+30_000);
 }
}
export default {
 async fetch(request:Request,env:Env){
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return Response.json({ok:true});
  const room=roomName(url.pathname);
  if(room){
   const origin=request.headers.get('Origin');
   const local=['http://127.0.0.1:5196','http://localhost:5196','http://127.0.0.1:8796'];
   if(origin&&origin!==url.origin&&origin!=='https://imatalkingpotato.github.io'&&!(url.hostname==='127.0.0.1'&&local.includes(origin)))return new Response('Origin not allowed',{status:403});
   return env.WORLD.get(env.WORLD.idFromName(room)).fetch(request);
  }
  if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
  return env.ASSETS.fetch(request);
 }
} satisfies ExportedHandler<Env>;
