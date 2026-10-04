export const CAPITAL={west:-77.08,east:-76.945,south:38.835,north:38.925,lon:-77.04,lat:38.904};
const MX=111320*Math.cos(CAPITAL.lat*Math.PI/180),MZ=111320;
export const geo=(lon:number,lat:number)=>({x:(lon-CAPITAL.lon)*MX,z:(CAPITAL.lat-lat)*MZ});
export const WEST=geo(CAPITAL.west,CAPITAL.lat).x,EAST=geo(CAPITAL.east,CAPITAL.lat).x,NORTH=geo(CAPITAL.lon,CAPITAL.north).z,SOUTH=geo(CAPITAL.lon,CAPITAL.south).z;
// Approximation of the user's drawn first-map outline, not the administrative DC boundary.
export const REGION=[[-77.075,38.923],[-76.965,38.923],[-76.965,38.883],[-76.969,38.875],[-76.986,38.87],[-77.006,38.871],[-77.022,38.86],[-77.037,38.838],[-77.05,38.838],[-77.059,38.845],[-77.061,38.866],[-77.069,38.884],[-77.075,38.893]].map(([lon,lat])=>{const p=geo(lon,lat);return [p.x,p.z];});
export type Footprint=[number,number[][]];
let grid=new Map<string,Footprint[]>();
export function inside(x:number,z:number,points:number[][]){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export const safe=(x:number,z:number)=>Math.abs(x)<6&&z>=-132&&z<=11;
export function capitalBounds(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&x>WEST+8&&x<EAST-8&&z>NORTH+8&&z<SOUTH-8&&inside(x,z,REGION);}
export function installFootprints(rows:Footprint[]){grid=new Map();for(const row of rows){const xs=row[1].map(p=>p[0]),zs=row[1].map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/100);x<=Math.floor(Math.max(...xs)/100);x++)for(let z=Math.floor(Math.min(...zs)/100);z<=Math.floor(Math.max(...zs)/100);z++){const key=x+','+z;const cell=grid.get(key)??[];cell.push(row);grid.set(key,cell);}}}
export function roofAt(x:number,z:number){return (grid.get(Math.floor(x/100)+','+Math.floor(z/100))??[]).reduce((h,[height,points])=>inside(x,z,points)?Math.max(h,height):h,0);}
