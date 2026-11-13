export type ActivityKind='coffee'|'rest';
const destinations:Record<string,{label:string;url:string}>={
 '컨펌 체육관':{label:'빡쾅퍽벨 울리기 ↗',url:'https://imatalkingpotato.github.io/confirm-bell/'},
 '궤도 발사장':{label:'궤도로 출발하기 ↗',url:'https://imatalkingpotato.github.io/idek-orbit/'}
};
export class Activities{
 private kind:ActivityKind|null=null;
 private began=0;
 private button:HTMLButtonElement|null=null;
 private status:HTMLElement|null=null;
 private visual:HTMLElement|null=null;
 constructor(private host:HTMLElement,private toast:(message:string)=>void){}
 open(name:string){
  this.stop();this.host.replaceChildren();
  const destination=destinations[name];
  if(destination){
   const link=document.createElement('a');link.className='activity-primary';link.href=destination.url;link.target='_blank';link.rel='noopener';link.textContent=destination.label;
   const note=document.createElement('small');note.textContent='새 탭에서 열려요. 이 로비는 그대로 남아 있어요.';
   this.host.appendChild(link);this.host.appendChild(note);return;
  }
  const kind=name==='탕비실'?'coffee':name==='휴식 공간'?'rest':null;
  if(!kind){const note=document.createElement('small');note.textContent=name==='엿룸'?'아직 문을 준비하고 있어요. 속마음은 궤도에서 먼저 남길 수 있어요.':'잠깐 나갔다 와도, 여기는 그대로예요.';this.host.appendChild(note);return;}
  this.visual=document.createElement('div');this.visual.className=`activity-visual ${kind}`;this.visual.setAttribute('aria-hidden','true');
  this.visual.innerHTML=kind==='rest'?'<div class="breath-orb"></div>':'<span class="coffee-steam">〰</span><span class="coffee-symbol">☕</span>';
  this.status=document.createElement('p');this.status.className='activity-status';this.status.setAttribute('role','status');this.status.textContent=kind==='coffee'?'마감보다 커피가 먼저인 순간.':'30초만, 어깨에 힘을 빼세요.';
  this.button=document.createElement('button');this.button.className='activity-primary';this.button.textContent=kind==='coffee'?'커피 한 모금':'30초 쉬어가기';
  this.button.onclick=()=>{if(this.kind)return;this.kind=kind;this.began=performance.now();this.button!.disabled=true;this.button!.textContent=kind==='coffee'?'잠깐 충전 중…':'쉬는 중…';this.visual!.classList.add('active');};
  this.host.appendChild(this.visual);this.host.appendChild(this.status);this.host.appendChild(this.button);
 }
 stop(){this.kind=null;this.visual?.classList.remove('active');this.button=null;this.status=null;this.visual=null;}
 tick(now:number):{kind:ActivityKind|null;progress:number}{
  if(!this.kind)return {kind:null,progress:0};
  const duration=this.kind==='coffee'?6000:30000,age=now-this.began,progress=Math.min(age/duration,1);
  if(age>=duration){
   const coffee=this.kind==='coffee';this.kind=null;this.visual?.classList.remove('active');
   if(this.status)this.status.textContent=coffee?'한 모금만큼, 여유가 생겼어요.':'아무것도 안 해도 괜찮은 30초였어요.';
   if(this.button){this.button.disabled=false;this.button.textContent=coffee?'한 모금 더':'한 번 더 쉬기';}
   this.toast(coffee?'커피 한 잔의 여유 ☕':'잠깐의 쉼, 완료.');return {kind:null,progress:1};
  }
  if(this.status){const text=this.kind==='coffee'?'천천히 한 모금.':(age%10000<4000?'천천히 들이마시고':'길게 내쉬세요')+` · ${Math.ceil((duration-age)/1000)}초`;if(this.status.textContent!==text)this.status.textContent=text;}
  return {kind:this.kind,progress};
 }
}
