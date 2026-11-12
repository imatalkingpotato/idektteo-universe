export type Pose = { x:number; z:number; yaw:number; moving:boolean };
export type Visitor = Pose & { id:string; name:string; color:string };
export type ServerEvent =
 | {type:'welcome'; self:Visitor; visitors:Visitor[]}
 | {type:'join'|'move'; visitor:Visitor}
 | {type:'leave'; id:string}
 | {type:'pong'; visitors:Visitor[]};
export const PALETTE=['#c97454','#729388','#9784a3','#b99957','#6b8ca6','#ad807f'];
export function readPose(value:unknown):Pose|null {
 if(!value||typeof value!=='object')return null;
 const p=value as Record<string,unknown>;
 if(typeof p.x!=='number'||!Number.isFinite(p.x)||typeof p.z!=='number'||!Number.isFinite(p.z)||typeof p.yaw!=='number'||!Number.isFinite(p.yaw)||typeof p.moving!=='boolean')return null;
 if(p.x < -14.6 || p.x > 14.6 || p.z < -10.4 || p.z > 11.5)return null;
 return {x:p.x,z:p.z,yaw:Math.atan2(Math.sin(p.yaw),Math.cos(p.yaw)),moving:p.moving};
}
export function roomName(path:string):string|null {
 const match=/^\/api\/room\/([a-z0-9-]{1,40})$/.exec(path);return match?.[1]??null;
}
