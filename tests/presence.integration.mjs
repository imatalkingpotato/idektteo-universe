import assert from 'node:assert/strict';
import WebSocket from 'ws';
const origin=process.env.TEST_ORIGIN??'http://127.0.0.1:5196';
const root=process.env.TEST_WS??'ws://127.0.0.1:5196';
const room=`qa-${Date.now()}`;
const opened=[];
function peer(name=room){
 const ws=new WebSocket(`${root}/api/room/${name}`,{origin});opened.push(ws);const messages=[];const pending=[];
 ws.on('message',raw=>{const msg=JSON.parse(raw);messages.push(msg);for(const p of [...pending])if(p.fn(msg)){clearTimeout(p.timer);pending.splice(pending.indexOf(p),1);p.resolve(msg);}});
 const next=fn=>new Promise((resolve,reject)=>{const old=messages.find(fn);if(old){resolve(old);return;}const p={fn,resolve,timer:setTimeout(()=>{pending.splice(pending.indexOf(p),1);reject(new Error('timed out waiting for event'));},5000)};pending.push(p);});
 return {ws,messages,next};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const a=peer();const aw=await a.next(m=>m.type==='welcome');
 const b=peer();const bw=await b.next(m=>m.type==='welcome');
 assert.notEqual(aw.self.id,bw.self.id);assert.notEqual(aw.self.name,bw.self.name);assert.notEqual(aw.self.color,bw.self.color);
 assert.equal(bw.visitors.length,2);await a.next(m=>m.type==='join'&&m.visitor.id===bw.self.id);
 console.log('PASS: two anonymous visitors receive the same roster and distinct identities');
 a.ws.send(JSON.stringify({type:'move',seq:0,x:3,z:4,yaw:.7,moving:true,id:'fake',name:'fake'}));
 const moved=await b.next(m=>m.type==='move'&&m.visitor.id===aw.self.id);assert.equal(moved.visitor.x,3);assert.equal(moved.visitor.name,aw.self.name);
 console.log('PASS: movement broadcasts while identity fields cannot be overridden');
 await sleep(120);a.ws.send(JSON.stringify({type:'move',seq:1,x:1000,z:4,yaw:0,moving:true}));
 await sleep(120);a.ws.send(JSON.stringify({type:'move',seq:0,x:9,z:4,yaw:0,moving:true}));
 await sleep(1200);a.ws.send(JSON.stringify({type:'ping'}));
 const pong=await a.next(m=>m.type==='pong');assert.equal(pong.visitors.find(p=>p.id===aw.self.id).x,3);
 console.log('PASS: out-of-bounds and replayed movements are rejected');
 const separate=peer(room+'-separate');const sw=await separate.next(m=>m.type==='welcome');assert.equal(sw.visitors.length,1);
 console.log('PASS: separate rooms do not leak visitors');
 b.ws.close();await a.next(m=>m.type==='leave'&&m.id===bw.self.id);
 const rejoined=peer();const rw=await rejoined.next(m=>m.type==='welcome');assert.equal(rw.visitors.length,2);assert.notEqual(rw.self.id,bw.self.id);
 console.log('PASS: disconnect removes visitor and reconnect creates a clean anonymous session');
}finally{for(const ws of opened)ws.close();}
