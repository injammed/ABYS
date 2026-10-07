import * as T from 'three';

export const CAPITAL_LOOK={sky:0x9b9385,zenith:0x203647,sun:0xffd4a0,stone:0xd7c5a6,machine:0x62cbd1};
export type Surface='stone'|'marble'|'asphalt'|'cloth'|'steel'|'facade';
// Original, deterministic surface detail. Shared small textures, no external asset requests.
export function surfaceTexture(kind:Surface,size=128){
 const pixels=new Uint8Array(size*size*4);let seed=731;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=((seed>>>24)/255-.5);
  let v=.78+noise*.16;
  if(kind==='stone'){const seam=y%32<2||(x+(Math.floor(y/32)%2)*32)%64<2;v=seam?.38:.84+noise*.12;}
  if(kind==='marble')v=.84-Math.pow(Math.max(0,Math.sin(x*.11+Math.sin(y*.08)*3)),18)*.24+noise*.035;
  if(kind==='asphalt')v=.7+noise*.28-(Math.abs(x-62-Math.sin(y*.1)*8)<.8?.28:0);
  if(kind==='cloth')v=.76+noise*.08+(x%2===0?.09:0)+(y%2===0?.04:0);
  if(kind==='steel')v=.8+noise*.05-(y%32===0?.18:0)+(x%19===0?.05:0);
  if(kind==='facade'){const window=x%32>7&&x%32<25&&y%32>6&&y%32<24;v=window?.19+noise*.05:.78+noise*.08;if(y%32>24&&y%32<27)v*=.65;}
  const i=(y*size+x)*4;pixels[i]=Math.round(v*255);pixels[i+1]=Math.round(v*255);pixels[i+2]=Math.round(v*255);pixels[i+3]=255;
 }
 const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
export function surfaceMaterial(kind:Surface,color:number,repeat=1){
 const map=surfaceTexture(kind);map.repeat.set(repeat,repeat);map.colorSpace=T.SRGBColorSpace;
 const bump=map.clone();bump.colorSpace=T.NoColorSpace;bump.needsUpdate=true;
 return new T.MeshStandardMaterial({color,map,bumpMap:bump,bumpScale:kind==='cloth'?.025:.065,roughness:kind==='marble'?.3:kind==='steel'?.4:.9,metalness:kind==='steel'?.72:0});
}
export function disposeSurface(material:T.Material){const m=material as T.MeshStandardMaterial;m.map?.dispose();m.bumpMap?.dispose();m.dispose();}
