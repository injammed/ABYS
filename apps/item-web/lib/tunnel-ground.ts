import * as T from 'three';
import {TUNNEL} from './game-economy.ts';
export function groundWithTunnel(west:number,east:number,north:number,south:number){
 const positions:number[]=[],uv:number[]=[];
 const rect=(w:number,e:number,n:number,s:number)=>{for(const [x,z] of [[w,n],[w,s],[e,n],[e,n],[w,s],[e,s]]){positions.push(x,-.25,z);uv.push((x-west)/(east-west),1-(z-north)/(south-north));}};
 rect(west,TUNNEL.x-4,north,south);rect(TUNNEL.x+4,east,north,south);rect(TUNNEL.x-4,TUNNEL.x+4,north,TUNNEL.z);rect(TUNNEL.x-4,TUNNEL.x+4,TUNNEL.z+40,south);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
