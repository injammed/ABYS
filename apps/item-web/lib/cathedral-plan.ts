// Authored Cologne × Seville sanctuary: all coordinates are game metres.
export const CATHEDRAL_PLAN={halfWidth:16,back:-135,front:10,doorHalf:2,portalZ:-42,court:{left:16,right:30,back:-58,front:-26},towers:[{x:-11,z:5,w:6.4,d:8,height:57},{x:11,z:5,w:6.4,d:8,height:57},{x:23,z:-17,w:5,d:5,height:43}]} as const;
export const cathedralSafe=(x:number,z:number)=>Math.abs(x)<16&&z>=-135&&z<=11||x>=16&&x<30&&z>=-58&&z<=-26;
export function cathedralWalkable(x:number,z:number){
 const p=CATHEDRAL_PLAN,margin=.4;
 if(p.towers.some(t=>Math.abs(x-t.x)<t.w/2+margin&&Math.abs(z-t.z)<t.d/2+margin))return false;
 // Physical shell: front doors and the east courtyard portal are the only openings.
 if(z>=p.back-margin&&z<=p.front+margin&&Math.abs(Math.abs(x)-p.halfWidth)<.6){if(!(x>0&&Math.abs(z-p.portalZ)<1.6))return false;}
 if(Math.abs(z-p.back)<.6&&Math.abs(x)<p.halfWidth+.4)return false;
 if(Math.abs(z-p.front)<.65&&Math.abs(x)<p.halfWidth+.4&&Math.abs(x)>1.6)return false;
 // Clustered arcade columns align with the visible bases; aisles stay open between bays.
 if(z>=-134&&z<=8)for(let bay=8;bay>=-134;bay-=6)for(const side of [-1,1])for(const aisle of [5.65,10.65])if(Math.abs(x-side*aisle)<.85&&Math.abs(z-bay)<.85)return false;
 const c=p.court;
 if(x>=c.left-.4&&x<=c.right+.4){if(Math.abs(z-c.back)<.6||Math.abs(z-c.front)<.6)return false;}
 if(Math.abs(x-c.right)<.6&&z>c.back&&z<c.front)return false;
 for(const tx of [20,26])for(const tz of [-53,-32])if(Math.abs(x-tx)<1.15&&Math.abs(z-tz)<1.15)return false;
 return true;
}
export function cathedralRoofAt(x:number,z:number){
 const p=CATHEDRAL_PLAN;for(const t of p.towers)if(Math.abs(x-t.x)<t.w/2+1&&Math.abs(z-t.z)<t.d/2+1)return t.height;
 return Math.abs(x)<17&&z>=p.back&&z<=p.front?Math.abs(x)<6.2?15:9:0;
}
