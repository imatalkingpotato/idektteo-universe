import * as THREE from 'three';
import './style.css';
import {Presence} from './presence';
import type {Visitor} from '../shared/protocol';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div id="world" aria-label="종이 캐릭터로 걸어보는 중앙 로비"></div>
  <header class="hud"><a class="brand" href="#">IDEKTTEO<span>UNIVERSE <i>↗</i></span></a><div class="location"><span class="tiny">지금 머무는 곳</span><strong id="location">중앙 로비</strong></div><div class="version presence-panel"><span id="self-name">이름 없는 종이</span><strong id="visitor-count">로비 입장 전</strong><small id="connection" role="status">익명으로 함께 머무는 곳</small></div></header>
  <section id="welcome"><div class="welcome-copy"><span class="eyebrow">IDEKTTEO UNIVERSE · FIRST WALK</span><h1>잠깐,<br>종이가 되어볼까요.</h1><p>가볍게 걸어보고, 잠시 머물러 보세요.</p><button id="start">로비에 들어가기 <span>↗</span></button><small>이름 없이, 같은 로비에서 만나요.</small></div></section>
  <div id="door-hint" hidden><span id="door-name"></span><button id="explore">공간 보기 <kbd>E</kbd></button></div>
  <aside id="room-card" hidden><button class="close" aria-label="닫기">×</button><span class="eyebrow">NEXT SPACE</span><h2></h2><p></p><small>지금은 로비를 걷는 시제품이에요. 공간 안의 활동은 다음에 열려요.</small></aside>
  <footer class="bottom"><div class="instructions"><span><kbd>W A S D</kbd> / 방향키 이동</span><span>드래그로 둘러보기 · 휠로 거리 조절</span><span class="click-help">바닥을 눌러도 걸어가요</span></div><div class="tools"><button id="home" title="시작 위치로 돌아가기" aria-label="시작 위치로 돌아가기">↺</button><button id="sound" aria-pressed="true">사각사각 <span>켜짐</span></button></div></footer>
  <div id="joystick" aria-label="이동 조이스틱"><div></div></div><div id="toast" role="status"></div>
`;
const mount = document.querySelector<HTMLDivElement>('#world')!;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e4d9');
scene.fog = new THREE.Fog('#e9e4d9', 28, 70);
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, .1, 90);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
mount.appendChild(renderer.domElement);
const hemi = new THREE.HemisphereLight('#fffaef','#999f8d',1.8);scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d2',2.6);sun.position.set(-9,18,11);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
const fill = new THREE.DirectionalLight('#e7f0ed',.6);fill.position.set(10,8,-6);scene.add(fill);
const mat=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.94});
const ivory=mat('#f3ecde'), plaster=mat('#e3d8c4'), paper=mat('#f3e6cd'), fold=mat('#d7c09c'), coral=mat('#c97454'), dark=mat('#56675d'), teal=mat('#729388'), brass=mat('#a48a60');
function box(w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const floor=box(80,.24,80,mat('#d8d0be'),0,-.16,0);
box(32,.12,30,ivory,0,-.02,-1);
const rug = new THREE.Mesh(new THREE.CircleGeometry(4.1,72),mat('#ccc7b5'));rug.rotation.x=-Math.PI/2;rug.position.set(0,.047,-1);scene.add(rug);
const ring=new THREE.Mesh(new THREE.RingGeometry(4.22,4.24,96),brass);ring.rotation.x=-Math.PI/2;ring.position.set(0,.05,-1);scene.add(ring);
// A quiet perimeter: architecture first, props later.
box(32,1,.5,plaster,0,.45,-15.8);box(.5,1,30,plaster,-16,.45,-1);box(.5,1,30,plaster,16,.45,-1);
for(const x of [-15,15]){for(const z of [-14,-4,8]){cylinder(.22,8.5,plaster,x,4.2,z);box(.8,.28,.8,ivory,x,8.3,z);}}
box(30.7,.25,.32,plaster,0,8.3,-14);box(.32,.25,23,plaster,-15,8.3,-3);box(.32,.25,23,plaster,15,8.3,-3);

function label(text:string,width:number,height:number,color='#3d4c42',fontSize=70){
 const c=document.createElement('canvas');c.width=1024;c.height=192;const ctx=c.getContext('2d')!;
 ctx.fillStyle=color;ctx.font=`600 ${fontSize}px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,96,1000);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));return plane;
}


const obstacles:{x:number;z:number;r:number}[]=[];
type Room={name:string;desc:string;group:THREE.Group;point:THREE.Vector3};const rooms:Room[]=[];
function portal(name:string,desc:string,x:number,z:number,rotation:number,color:string){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
 const s=new THREE.Shape();s.moveTo(-2.05,0);s.lineTo(-2.05,3.25);s.absarc(0,3.25,2.05,Math.PI,0,true);s.lineTo(2.05,0);s.lineTo(1.65,0);s.lineTo(1.65,3.25);s.absarc(0,3.25,1.65,0,Math.PI,false);s.lineTo(-1.65,0);s.closePath();
 const arch=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.55,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:32}),plaster);arch.castShadow=true;arch.receiveShadow=true;g.add(arch);
 const roomMat=mat(color);box(3.3,4,.18,roomMat,0,2,-1.5,g);box(3.3,.08,2.1,roomMat,0,.02,-.5,g);
 const sign=label(name,3.65,.7,'#3d4c42',100);sign.position.set(0,4.8,.64);g.add(sign);
 const number=label(String(rooms.length+1).padStart(2,'0'),.85,.3,'#7d806d',58);number.position.set(0,4.4,.64);g.add(number);
 // Only a hint of each destination, not a fully furnished room.
 if(name==='컨펌 체육관'){box(.65,1.5,.65,coral,0,1.6,-.5,g);box(.035,1.8,.035,dark,0,3.25,-.5,g);}
 if(name==='탕비실'){box(2.7,1,.65,teal,0,.55,-.5,g);box(2.85,.12,.8,ivory,0,1.1,-.5,g);cylinder(.15,.25,ivory,.4,1.28,-.4,g);}
 if(name==='궤도 발사장'){const rocket=new THREE.Mesh(new THREE.ConeGeometry(.45,1.5,16),ivory);rocket.position.set(0,2,-.5);g.add(rocket);cylinder(.3,.9,coral,0,1.1,-.5,g);}
 if(name==='휴식 공간'){box(2.5,.5,.9,teal,0,.5,-.6,g);box(2.5,.8,.22,teal,0,1,-1,g);}
 if(name==='엿룸'){const dots=label('…',2,1,'#efe8d8',130);dots.position.set(0,2.3,-1.38);g.add(dots);}
 const point=new THREE.Vector3(0,0,1.5).applyAxisAngle(new THREE.Vector3(0,1,0),rotation).add(g.position);
 rooms.push({name,desc,group:g,point});
 for(const side of [-1,1]){const pos=new THREE.Vector3(side*1.88,0,.1).applyAxisAngle(new THREE.Vector3(0,1,0),rotation).add(g.position);obstacles.push({x:pos.x,z:pos.z,r:.5});}
}
portal('컨펌 체육관','기다리느라 굳은 마음을 한 대씩 풀어놓는 곳.',-8,-12,0,'#bd7158');
portal('탕비실','커피 한 잔과 잠깐의 딴짓이 허락되는 곳.',0,-12,0,'#8b9b86');
portal('궤도 발사장','이름 없이 남긴 속마음이 우주로 떠나는 곳.',8,-12,0,'#657c7a');
portal('휴식 공간','아무것도 하지 않아도 되는 작은 쉼표.',-13,0,Math.PI/2,'#a2ad92');
portal('엿룸','밖에서는 삼킨 말, 여기서는 내려놓아도 돼요.',13,0,-Math.PI/2,'#9e7c72');
portal('입구','돌아와도, 잠깐 나가 있어도 괜찮아요.',-9,10,Math.PI,'#c4bda5');

function plant(x:number,z:number){cylinder(.6,.8,plaster,x,.4,z);cylinder(.07,2.6,dark,x,1.7,z);for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),mat(i%2?'#7c9169':'#647c59'));leaf.scale.set(.9,1.15,.5);leaf.position.set(x+Math.sin(i*2.4)*.55,2+i*.16,z+Math.cos(i*2.4)*.5);leaf.rotation.z=i*.8;leaf.castShadow=true;scene.add(leaf);}obstacles.push({x,z,r:.85});}
plant(-11,-7);plant(11,-7);plant(-12,6);plant(12,6);
for(const x of [-6,6]){box(2.5,.25,1,plaster,x,.65,2);box(.2,.55,.7,dark,x-1,.3,2);box(.2,.55,.7,dark,x+1,.3,2);obstacles.push({x,z:2,r:1.65});}

// Folded-paper silhouette. Front is local +Z; the camera follows its back.
const player=new THREE.Group();player.position.set(0,0,7);player.scale.setScalar(.85);scene.add(player);
const body=new THREE.Group();body.name="paper-body";player.add(body);
function triangle(points:number[],material:THREE.Material,parent:THREE.Object3D){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);parent.add(mesh);return mesh;}
const tunic=new THREE.Mesh(new THREE.CylinderGeometry(.28,.43,.68,4),paper);tunic.rotation.y=Math.PI/4;tunic.position.y=.91;tunic.castShadow=true;body.add(tunic);
const head=new THREE.Group();head.name="paper-head";head.position.y=1.65;body.add(head);
box(.94,.74,.63,paper,0,0,0,head);
// Envelope flaps on both sides, with raised triangular facets and restrained fold seams.
triangle([-.47,.37,-.321,.47,.37,-.321,0,-.12,-.39],fold,head);
triangle([-.47,.37,.321,0,-.12,.39,.47,.37,.321],ivory,head);
const seam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.46,.36,-.33),new THREE.Vector3(0,-.13,-.4),new THREE.Vector3(.46,.36,-.33)]),new THREE.LineBasicMaterial({color:'#c4b292'}));head.add(seam);
const top=new THREE.Mesh(new THREE.ConeGeometry(.68,.26,4),paper);top.rotation.y=Math.PI/4;top.position.y=.5;top.scale.z=.7;top.castShadow=true;head.add(top);
const scarf=box(.65,.13,.55,coral,0,1.29,0,body);scarf.rotation.z=-.08;scarf.name="accent-scarf";
const tail=box(.2,.4,.05,coral,.19,1.08,-.34,body);tail.rotation.z=.2;tail.name="accent-tail";
const arms:THREE.Group[]=[],legs:THREE.Group[]=[];
for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.37,1.11,0);const a=box(.17,.5,.2,paper,side*.07,-.19,0,arm);a.rotation.z=side*.18;body.add(arm);arm.name=`arm-${arms.length}`;arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.18,.58,0);box(.23,.4,.25,fold,0,-.19,0,leg);box(.27,.14,.38,paper,0,-.45,.06,leg);player.add(leg);leg.name=`leg-${legs.length}`;legs.push(leg);}
box(.39,.43,.16,teal,0,.96,-.31,body);box(.12,.055,.02,brass,0,.98,-.4,body);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!;const grad=sc.createRadialGradient(64,64,4,64,64,62);grad.addColorStop(0,'rgba(56,46,30,.3)');grad.addColorStop(1,'rgba(56,46,30,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.07;contact.scale.setScalar(.85);scene.add(contact);
const destinationRing=new THREE.Mesh(new THREE.RingGeometry(.18,.22,32),new THREE.MeshBasicMaterial({color:'#b16a4b',transparent:true,opacity:.7,side:THREE.DoubleSide}));destinationRing.rotation.x=-Math.PI/2;destinationRing.visible=false;scene.add(destinationRing);

let started=false,muted=false,yaw=0,distance=10.2,phase=0,elapsed=0;
let target:THREE.Vector3|null=null,activeRoom:Room|null=null;
const keys=new Set<string>(),joy=new THREE.Vector2();
let audio:AudioContext|undefined,noise:AudioBuffer|undefined;
function unlockAudio(){if(muted)return;audio??=new AudioContext();void audio.resume();if(!noise){noise=audio.createBuffer(1,audio.sampleRate*.2,audio.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}}
function rustle(speed:number){if(muted||!audio||audio.state!=='running'||!noise)return;const src=audio.createBufferSource();src.buffer=noise;src.playbackRate.value=.72+Math.random()*.2;const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1450+Math.random()*450;filter.Q.value=.7;const gain=audio.createGain();const t=audio.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.034*speed,t+.035);gain.gain.exponentialRampToValueAtTime(.001,t+.17);src.connect(filter).connect(gain).connect(audio.destination);src.start();src.stop(t+.22);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};}
function toast(message:string){const e=document.querySelector<HTMLDivElement>('#toast')!;e.textContent=message;e.classList.add('visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>e.classList.remove('visible'),2600);}let toastTimer=0;
const welcome=document.querySelector<HTMLElement>('#welcome')!;
document.querySelector('#start')!.addEventListener('click',()=>{started=true;welcome.classList.add('leaving');presence.start();unlockAudio();setTimeout(()=>welcome.hidden=true,700);});
document.querySelector('#sound')!.addEventListener('click',()=>{muted=!muted;const b=document.querySelector<HTMLButtonElement>('#sound')!;b.setAttribute('aria-pressed',String(!muted));b.querySelector('span')!.textContent=muted?'꺼짐':'켜짐';if(!muted)unlockAudio();});
function reset(){keys.clear();joy.set(0,0);player.position.set(0,0,7);player.rotation.y=Math.PI;yaw=0;distance=10.2;target=null;destinationRing.visible=false;closeCard();toast('처음 자리로 돌아왔어요.');}
document.querySelector('#home')!.addEventListener('click',reset);
const card=document.querySelector<HTMLElement>('#room-card')!;
function showRoom(){if(!activeRoom)return;target=null;keys.clear();card.querySelector('h2')!.textContent=activeRoom.name;card.querySelector('p')!.textContent=activeRoom.desc;card.hidden=false;}
function closeCard(){card.hidden=true;}
card.querySelector('.close')!.addEventListener('click',closeCard);document.querySelector('#explore')!.addEventListener('click',showRoom);
const movementKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
addEventListener('keydown',(e)=>{if(!started)return;const k=e.key.toLowerCase();if(movementKeys.includes(k)){e.preventDefault();keys.add(k);target=null;destinationRing.visible=false;unlockAudio();}if(k==='e')showRoom();if(k==='escape')closeCard();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function clearInput(){keys.clear();joy.set(0,0);target=null;destinationRing.visible=false;drag=null;const knob=document.querySelector<HTMLElement>('#joystick div')!;knob.style.transform='translate(0,0)';}
addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
let drag:{x:number;y:number;lastX:number;moved:boolean}|null=null;
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{if(!started)return;closeCard();drag={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false};canvas.setPointerCapture(e.pointerId);unlockAudio();});
canvas.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;if(drag.moved)yaw-=(e.clientX-drag.lastX)*.006;drag.lastX=e.clientX;});
const raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
canvas.addEventListener('pointerup',e=>{if(!drag)return;if(!drag.moved){raycaster.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);const p=raycaster.ray.intersectPlane(ground,new THREE.Vector3());if(p&&Math.abs(p.x)<14.5&&p.z>-13&&p.z<11.5){target=p;destinationRing.position.set(p.x,.08,p.z);destinationRing.visible=true;}}drag=null;});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.008,6,14);},{passive:false});
const stick=document.querySelector<HTMLElement>('#joystick')!;let joyPointer:number|null=null;
function moveStick(e:PointerEvent){const r=stick.getBoundingClientRect();joy.set((e.clientX-r.left-r.width/2)/36,(e.clientY-r.top-r.height/2)/36);if(joy.length()>1)joy.normalize();stick.querySelector<HTMLElement>('div')!.style.transform=`translate(${joy.x*28}px,${joy.y*28}px)`;target=null;}
stick.addEventListener('pointerdown',e=>{if(!started)return;joyPointer=e.pointerId;stick.setPointerCapture(e.pointerId);unlockAudio();moveStick(e);});stick.addEventListener('pointermove',e=>{if(joyPointer===e.pointerId)moveStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,()=>{joyPointer=null;joy.set(0,0);stick.querySelector<HTMLElement>('div')!.style.transform='translate(0,0)';});


type Remote={root:THREE.Group;body:THREE.Object3D;head:THREE.Object3D;arms:THREE.Object3D[];legs:THREE.Object3D[];shadow:THREE.Mesh;tag:THREE.Sprite;target:Visitor;phase:number;lastUpdate:number};
const remotes=new Map<string,Remote>();
let connected=false;
function tintAvatar(root:THREE.Object3D,color:string){for(const name of ['accent-scarf','accent-tail']){const mesh=root.getObjectByName(name) as THREE.Mesh;mesh.material=new THREE.MeshStandardMaterial({color,roughness:.94});}}
function updateCount(){document.querySelector('#visitor-count')!.textContent=connected?`함께 있는 종이 ${remotes.size+1}명`:'연결을 기다리는 중';}
function removeRemote(id:string){const r=remotes.get(id);if(!r)return;scene.remove(r.root,r.shadow);r.tag.material.map?.dispose();r.tag.material.dispose();for(const name of ['accent-scarf','accent-tail']){((r.root.getObjectByName(name) as THREE.Mesh).material as THREE.Material).dispose();}remotes.delete(id);updateCount();}
function remoteTag(name:string,color:string){const c=document.createElement('canvas');c.width=384;c.height=96;const cx=c.getContext('2d')!;cx.fillStyle='#f8f3e8e8';cx.beginPath();cx.roundRect(20,10,344,76,30);cx.fill();cx.fillStyle=color;cx.beginPath();cx.arc(69,48,9,0,Math.PI*2);cx.fill();cx.fillStyle='#425548';cx.font='500 33px "Apple SD Gothic Neo",sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(name,211,49);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true,depthWrite:false}));tag.position.set(0,2.55,0);tag.scale.set(1.65,.42,1);return tag;}
function updateRemote(visitor:Visitor){
 let r=remotes.get(visitor.id);
 if(!r){const root=player.clone(true);tintAvatar(root,visitor.color);root.position.set(visitor.x,0,visitor.z);root.rotation.y=visitor.yaw;const shadow=contact.clone();scene.add(root,shadow);const tag=remoteTag(visitor.name,visitor.color);root.add(tag);r={root,body:root.getObjectByName('paper-body')!,head:root.getObjectByName('paper-head')!,arms:[root.getObjectByName('arm-0')!,root.getObjectByName('arm-1')!],legs:[root.getObjectByName('leg-0')!,root.getObjectByName('leg-1')!],shadow,tag,target:visitor,phase:0,lastUpdate:performance.now()};remotes.set(visitor.id,r);}
 r.target=visitor;r.lastUpdate=performance.now();updateCount();
}
const presence=new Presence({
 status(text){connected=text==='연결됨';document.querySelector('#connection')!.textContent=text;updateCount();},
 welcome(self){connected=true;player.position.set(self.x,0,self.z);player.rotation.y=self.yaw;target=null;destinationRing.visible=false;tintAvatar(player,self.color);document.querySelector('#self-name')!.textContent=`나 · ${self.name}`;},
 sync(visitors){const ids=new Set(visitors.map(v=>v.id));for(const id of remotes.keys())if(!ids.has(id))removeRemote(id);for(const visitor of visitors)updateRemote(visitor);updateCount();},
 update:updateRemote,leave:removeRemote
});
addEventListener('pagehide',()=>presence.stop());addEventListener('pageshow',()=>{if(started)presence.start();});
function animateRemotes(dt:number,now:number){for(const r of remotes.values()){
 const motion=r.target.moving&&now-r.lastUpdate<450;
 r.root.position.x=THREE.MathUtils.damp(r.root.position.x,r.target.x,13,dt);r.root.position.z=THREE.MathUtils.damp(r.root.position.z,r.target.z,13,dt);
 r.root.rotation.y+=Math.atan2(Math.sin(r.target.yaw-r.root.rotation.y),Math.cos(r.target.yaw-r.root.rotation.y))*Math.min(1,dt*12);
 if(motion)r.phase+=dt*8.5;const stride=motion?Math.sin(r.phase):0;
 for(let i=0;i<2;i++){const goal=stride*(i?1:-1)*.29;r.legs[i].rotation.x=THREE.MathUtils.damp(r.legs[i].rotation.x,goal,12,dt);r.arms[i].rotation.x=THREE.MathUtils.damp(r.arms[i].rotation.x,-.07-goal*.22,8,dt);}
 r.body.rotation.x=motion?.10:.075;r.body.rotation.z=stride*.012;r.body.position.y=-.025+(motion?Math.cos(r.phase*2)*.007:Math.sin(elapsed*.9)*.003);r.head.rotation.x=.12;r.shadow.position.set(r.root.position.x,.07,r.root.position.z);
}}

function canMove(x:number,z:number){return x>-14.6&&x<14.6&&z>-10.4&&z<11.5&&!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.35);}
let previousFrame=performance.now();
const focus=new THREE.Vector3(0,1.25,5),desired=new THREE.Vector3(),motion=new THREE.Vector3();player.rotation.y=Math.PI;
camera.position.set(0,6.1,15);camera.lookAt(focus);
let lastRoom='';
function animate(){requestAnimationFrame(animate);const now=performance.now();const dt=Math.min((now-previousFrame)/1000,.045);previousFrame=now;elapsed+=dt;
 let moving=false;
 if(started&&card.hidden){
  const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x;
  const dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.y;
  motion.set(dx,0,dz);if(motion.lengthSq()>.015){if(motion.length()>1)motion.normalize();motion.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);}else if(target){motion.copy(target).sub(player.position);motion.y=0;if(motion.length()<.15){target=null;destinationRing.visible=false;motion.set(0,0,0);}else motion.normalize();}
  if(motion.lengthSq()>.01){const speed=3.2,old=player.position.clone();const nx=player.position.x+motion.x*dt*speed,nz=player.position.z+motion.z*dt*speed;if(canMove(nx,player.position.z))player.position.x=nx;if(canMove(player.position.x,nz))player.position.z=nz;moving=old.distanceToSquared(player.position)>.00001;
   if(!moving&&target){target=null;destinationRing.visible=false;}
   const angle=Math.atan2(motion.x,motion.z);player.rotation.y+=Math.atan2(Math.sin(angle-player.rotation.y),Math.cos(angle-player.rotation.y))*Math.min(1,dt*12);
  }
 }
 // A tired commute: grounded steps, rounded shoulders, very little arm swing.
 const previousStep=Math.floor(phase/Math.PI);
 if(moving){phase+=dt*8.5;if(Math.floor(phase/Math.PI)>previousStep)rustle(.9);}
 const stride=moving?Math.sin(phase):0;
 for(let i=0;i<2;i++){
  const goal=stride*(i?1:-1)*.29;
  legs[i].rotation.x=THREE.MathUtils.damp(legs[i].rotation.x,goal,12,dt);
  arms[i].rotation.x=THREE.MathUtils.damp(arms[i].rotation.x,-.07-goal*.22,8,dt);
 }
 body.position.y=THREE.MathUtils.damp(body.position.y,-.025+(moving?Math.cos(phase*2)*.007:Math.sin(elapsed*.9)*.003),7,dt);
 body.rotation.x=THREE.MathUtils.damp(body.rotation.x,moving?.10:.075,5,dt);
 body.rotation.z=THREE.MathUtils.damp(body.rotation.z,stride*.012,7,dt);
 head.rotation.x=THREE.MathUtils.damp(head.rotation.x,.12+(moving?Math.sin(phase-.5)*.012:Math.sin(elapsed*.65)*.006),5,dt);
 head.rotation.y=Math.sin(elapsed*.4)*.012;
 tail.rotation.x=THREE.MathUtils.damp(tail.rotation.x,moving?Math.sin(phase-.6)*.035:0,6,dt);
 contact.position.set(player.position.x,.07,player.position.z);
 focus.lerp(desired.copy(player.position).add(new THREE.Vector3(-Math.sin(yaw)*2,1.4,-Math.cos(yaw)*2)),1-Math.exp(-dt*6));
 desired.set(Math.sin(yaw)*distance, distance*.30, Math.cos(yaw)*distance).add(focus);camera.position.lerp(desired,1-Math.exp(-dt*5));camera.lookAt(focus);
 activeRoom=started?rooms.find(r=>r.point.distanceTo(player.position)<3)??null:null;
 const roomName=activeRoom?.name??'';if(roomName!==lastRoom){document.querySelector<HTMLElement>('#door-hint')!.hidden=!activeRoom;document.querySelector('#door-name')!.textContent=roomName;lastRoom=roomName;}
 if(started)presence.send({x:player.position.x,z:player.position.z,yaw:player.rotation.y,moving});
 animateRemotes(dt,now);
 renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));});
animate();
