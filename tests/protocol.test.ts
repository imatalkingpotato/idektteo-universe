import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readPose,roomName} from '../shared/protocol.ts';
test('untrusted coordinates and types are rejected',()=>{
 for(const pose of [null,{}, {x:Infinity,z:0,yaw:0,moving:true},{x:0,z:NaN,yaw:0,moving:true},{x:100,z:0,yaw:0,moving:true},{x:'0',z:0,yaw:0,moving:true},{x:0,z:0,yaw:0,moving:'yes'}])assert.equal(readPose(pose),null);
});
test('pose strips identity fields and normalizes angle',()=>{const p=readPose({x:2,z:3,yaw:Math.PI*4,moving:false,id:'impersonation',name:'fake'});assert.deepEqual(Object.keys(p!).sort(),['moving','x','yaw','z']);assert.ok(Math.abs(p!.yaw)<.00001);});
test('only bounded room identifiers route to a room',()=>{assert.equal(roomName('/api/room/lobby'),'lobby');assert.equal(roomName('/api/room/test-01'),'test-01');for(const p of ['/api/room/','/api/room/../secret','/api/room/'+ 'a'.repeat(41),'/else'])assert.equal(roomName(p),null);});
