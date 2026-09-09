// Radial dead zone prevents drift; diagonal input never exceeds full speed.
export function joystickVector(x:number,y:number){
 const length=Math.hypot(x,y);if(!Number.isFinite(length)||length<.12)return {x:0,y:0};
 const strength=(Math.min(1,length)-.12)/.88;return {x:x/length*strength,y:y/length*strength};
}
export function smoothAxis(current:number,target:number,dt:number){return current+(target-current)*(1-Math.exp(-12*Math.max(0,Math.min(dt,.05))));}
