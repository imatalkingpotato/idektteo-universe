import type {Pose,Visitor,ServerEvent} from '../shared/protocol';
export class Presence {
 private socket:WebSocket|null=null;
 private retry=0;private timer=0;private heartbeat=0;private seq=0;private stopped=true;private lastReply=0;
 private lastSent=0;private lastPose='';private selfId='';
 constructor(private callbacks:{status:(text:string)=>void;welcome:(self:Visitor)=>void;sync:(visitors:Visitor[])=>void;update:(visitor:Visitor)=>void;leave:(id:string)=>void}){}
 start(){if(!this.stopped)return;this.stopped=false;this.connect();}
 stop(){this.stopped=true;clearTimeout(this.timer);clearInterval(this.heartbeat);const ws=this.socket;this.socket=null;ws?.close();this.callbacks.sync([]);}
 private connect(){
  if(this.stopped)return;
  this.callbacks.status(this.retry?'다시 연결하는 중':'로비에 연결하는 중');
  const query=new URLSearchParams(location.search).get('room')??'lobby';const room=/^[a-z0-9-]{1,40}$/.test(query)?query:'lobby';
  const url=new URL(`/api/room/${room}`,import.meta.env.VITE_WORLD_URL||location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  const ws=new WebSocket(url);this.socket=ws;this.lastSent=0;this.lastPose='';this.seq=0;this.selfId='';
  const timeout=window.setTimeout(()=>{if(this.socket===ws&&!this.selfId)ws.close();},10_000);
  ws.onmessage=event=>{
   if(this.socket!==ws)return;
   let data:ServerEvent;try{data=JSON.parse(event.data);}catch{return;}
   this.lastReply=Date.now();
   if(data.type==='welcome'){
    clearTimeout(timeout);this.retry=0;this.selfId=data.self.id;this.callbacks.welcome(data.self);this.callbacks.sync(data.visitors.filter(p=>p.id!==this.selfId));this.callbacks.status('연결됨');
    clearInterval(this.heartbeat);this.heartbeat=window.setInterval(()=>{if(Date.now()-this.lastReply>65_000){ws.close();return;}if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ping'}));},25_000);
   }else if(data.type==='pong'){this.callbacks.sync(data.visitors.filter(p=>p.id!==this.selfId));}
   else if(data.type==='leave')this.callbacks.leave(data.id);
   else if(data.type==='join'||data.type==='move'){if(data.visitor.id!==this.selfId)this.callbacks.update(data.visitor);}
  };
  ws.onerror=()=>ws.close();
  ws.onclose=()=>{
   clearTimeout(timeout);if(this.socket!==ws)return;clearInterval(this.heartbeat);this.socket=null;this.selfId='';this.callbacks.sync([]);
   if(!this.stopped){this.callbacks.status('연결이 끊겼어요 · 재접속 중');this.timer=window.setTimeout(()=>this.connect(),Math.min(1000*2**this.retry++,10_000)+Math.random()*500);}
  };
 }
 send(pose:Pose){
  const ws=this.socket;if(!ws||ws.readyState!==WebSocket.OPEN||!this.selfId)return;
  const now=performance.now();if(now-this.lastSent<100)return;
  const rounded={x:+pose.x.toFixed(3),z:+pose.z.toFixed(3),yaw:+pose.yaw.toFixed(3),moving:pose.moving};const json=JSON.stringify(rounded);
  if(json===this.lastPose)return;this.lastPose=json;this.lastSent=now;ws.send(JSON.stringify({type:'move',seq:this.seq++,...rounded}));
 }
}
