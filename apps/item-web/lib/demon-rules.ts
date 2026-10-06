export function canIgnite(x:number,z:number,protectedPoints:{x:number;z:number}[]=[]){
 return Number.isFinite(x)&&Number.isFinite(z)&&!(Math.abs(x)<=10&&z>=-136&&z<=15)&&protectedPoints.every(p=>Math.hypot(x-p.x,z-p.z)>10);
}
export const demonContact=(kind:'goblin'|'titan'|'warlock',distance:number,height:number)=>kind==='titan'?distance<18&&height<45:kind==='goblin'&&distance<1.5&&height<2;
