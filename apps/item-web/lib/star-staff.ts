import {CATHEDRAL_PLAN as PLAN} from './cathedral-plan.ts';
// Fictional test weapon. Only local hostile representatives take impact damage.
export const STAR_STAFF={range:180,radius:18,cooldown:6,fallTime:1.5,damage:10} as const;
export type StarTarget={x:number;y:number;z:number};
export function validStarTarget(origin:StarTarget,target:StarTarget,protectedActors:StarTarget[]=[]){
 if(![origin.x,origin.y,origin.z,target.x,target.y,target.z].every(Number.isFinite)||target.y<0)return false;
 if(Math.hypot(target.x-origin.x,target.y-origin.y,target.z-origin.z)>STAR_STAFF.range)return false;
 // Keep the entire impact radius outside the cathedral refuge.
 if(target.x>=-PLAN.halfWidth-STAR_STAFF.radius&&target.x<=PLAN.halfWidth+STAR_STAFF.radius&&target.z>=PLAN.back-STAR_STAFF.radius&&target.z<=11+STAR_STAFF.radius)return false;
 const court=PLAN.court;if(target.x>=court.left-STAR_STAFF.radius&&target.x<=court.right+STAR_STAFF.radius&&target.z>=court.back-STAR_STAFF.radius&&target.z<=court.front+STAR_STAFF.radius)return false;
 return protectedActors.every(p=>Math.hypot(target.x-p.x,target.y-p.y,target.z-p.z)>STAR_STAFF.radius+2);
}
export const inStarImpact=(target:StarTarget,enemy:StarTarget)=>Math.hypot(target.x-enemy.x,target.y-enemy.y,target.z-enemy.z)<=STAR_STAFF.radius;
