import {CATHEDRAL_PLAN as PLAN} from './cathedral-plan.ts';
export function canIgnite(x:number,z:number,protectedPoints:{x:number;z:number}[]=[]){
 return Number.isFinite(x)&&Number.isFinite(z)&&!(Math.abs(x)<=PLAN.halfWidth+4&&z>=PLAN.back-4&&z<=15)&&!(x>=PLAN.court.left-4&&x<=PLAN.court.right+4&&z>=PLAN.court.back-4&&z<=PLAN.court.front+4)&&protectedPoints.every(p=>Math.hypot(x-p.x,z-p.z)>10);
}
export const demonContact=(kind:'goblin'|'titan'|'warlock',distance:number,height:number)=>kind==='titan'?distance<18&&height<45:kind==='goblin'&&distance<1.5&&height<2;
