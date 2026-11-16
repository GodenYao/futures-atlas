// Futures Atlas v4.5 PILOT - proenslaved.js (E2) : site generator for 'enslaved' (Enslaved God, Tegmark Life 3.0 ch. 5).
// Ending text (src_v44/fa4_data.js): "A superintelligent AI is confined by its human controllers, who use it to produce technology
// and wealth beyond imagination; whether that is good or bad depends entirely on who the controllers are."
// E2 look (e_enslaved_notes.md): two blocs with opposite architectural grammar, one monumental contained mind each, an engineered scar.
//  - plan frame: x across the divide (Bloc A at x<0, Bloc B at x>0), z along it; site.rot applied by an inner group (far geoms
//    baked), the engine only translates (parallel_contract_v2.md). T.k = R/15.8 scales every dimension with the site radius.
//  - Bloc A "vertical stack" (cool slate, ice-white light): terraced arcology, needle towers + sky-bridges, capsule towers on an
//    orthogonal grid, mag-lev spine with pods. Centrepiece = Suspended Monolith in three gimbal rings over a ring basin.
//  - Bloc B "horizontal ground" (warm sand, pale amber light): plinth decks, dome clusters, disc towers, lattice hangars on a
//    radial plan around earthwork terraces. Centrepiece = Bound Sphere under coil tori and an open Faraday lattice.
//  - Divide = trench along z with two buttressed walls, hex block fields, sensor masts, two severed bridge stubs (not meeting).
// "Sunken" parts are built UPWARDS (the engine terrain would hide anything below heightAt): trench walls / pit rim / crater berms
// rise above the ground and their floors sit on it, so they read as sunken between raised lips.
// Describes, does not judge: same budget and care for both blocs, no text, no country names, no flag colours, no neon, uniform
// warm window light (Q17a). Materials: only ctx.mats (building, metal, light, foliage) + the feathered ground material with the
// SAME parameters as protown's pt_ground_feather (no new shader programs). Glows = light-family geometry with vertex colour > 1.
// Animated parts (gimbal rings, drones, pods, pulses) are plain meshes whose vertices / colours are rewritten in anim().
// Standalone: defines only FA.PROENSLAVED; no camera / DOM / engine globals. Classic script, ES2017. Apache-2.0. Independently written.
(function(){
'use strict';
const root=typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{});
root.FA=root.FA||{};
const TAU=Math.PI*2,PI=Math.PI,ST=.32;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const ss=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const now=()=>(root.performance&&root.performance.now)?root.performance.now():Date.now();
function perr(m){try{(root.__errs=root.__errs||[]).push('proenslaved: '+m);}catch(e){}}
function safe(n,f){try{return f();}catch(e){perr(n+': '+(e&&e.message?e.message:e));return null;}}
function mulberry32(a){a=a>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function hash2(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
const HEXC={};
function hex(h,k){let c=HEXC[h];if(!c){const n=parseInt(h.slice(1),16),f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  c=HEXC[h]=[f(n>>16&255),f(n>>8&255),f(n&255)];}k=k==null?1:k;return[c[0]*k,c[1]*k,c[2]*k];}
const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];

// ---- palettes: same structure for both blocs; grammar differs, not quality ----
const BLOC={
 A:{name:'Bloc A',walls:['#58708A','#667E98','#4E6580','#7590A8'],roof:'#3A4656',roof2:'#465466',ground:'#4C5868',deck:'#465264',
  light:'#CFEFFF',core:'#A8E0F0',pod:'#8FA4BA'},
 B:{name:'Bloc B',walls:['#C29A62','#D0AA74','#B08A58','#DAB884'],roof:'#7E6044','roof2':'#8E6E4C',ground:'#80694A',deck:'#A2845C',
  light:'#F2C894',core:'#F2C894',pod:'#C4A274'}};
const PAL={strip:'#7A776E',gravel:'#8C887D',asph:'#34363B',kerb:'#8E8A82',earth:'#6E6048',concrete:'#8E8A84',concL:'#A39F97',dark:'#2E3136',
 steel:'#7C8086',warm:'#FFC890',glassD:'#2A3038',mono:'#2A3038',sphere:'#6A5E50',cable:'#22252A',foliage:'#3E5238',trunk:'#5A4A3A',
 beacon:'#FFB070',cool:'#DCE8F2'};

// ======================= site context =======================
function mkSite(site,ctx){site=site||{};ctx=ctx||{};const THREE=ctx.THREE||root.THREE;
 const R=site.radius>0?+site.radius:15.8,rot=+site.rot||0,cr=Math.cos(rot),sr=Math.sin(rot),sx=+site.x||0,sz=+site.z||0;
 const hA=typeof ctx.heightAt==='function'?ctx.heightAt:null;let y0=0;
 if(hA){y0=site.y!=null?+site.y:+hA(sx,sz);if(!isFinite(y0))y0=0;}
 const seed=(site.seed==null?1:site.seed)>>>0,rnd=mulberry32(seed^0x5E1A7ED);
 const T={THREE,site,ctx,R,k:R/15.8,rot,seed,rnd,mood:site.mood==='day'?'day':'blue',q:({low:.5,mid:.75,high:1})[site.q]||1,
  toLocal:(x,z)=>[x*cr+z*sr,-x*sr+z*cr],
  yl:hA?function(x,z){const v=hA(sx+x*cr+z*sr,sz-x*sr+z*cr)-y0;return isFinite(v)?v:0;}:function(){return 0;}};
 T.A=T.mood==='day'?1:.84;T.day=T.mood==='day';
 // two-lobe, noise-warped boundary (wider across the divide than along it): never a round plate
 const q1=hash2(seed*.131,1.7)*TAU,q2=hash2(seed*.317,4.1)*TAU,q3=hash2(seed*.513,8.3)*TAU;
 T.rb=a=>clamp(R*(.80+.16*Math.pow(Math.abs(Math.cos(a)),1.5)+.05*Math.sin(3*a+q1)+.035*Math.sin(5*a+q2)+.02*Math.sin(7*a+q3)),R*.62,R*.97);
 T.bAt=(x,z)=>T.rb(Math.atan2(z,x));
 T.fa=(x,z)=>{const r=Math.hypot(x,z),b=T.bAt(x,z);return 1-ss(b*.84,b*1.03,r);};
 T.hw=R*.10;   // half width of the engineered divide (trench + lips)
 return T;}

// ======================= geometry emit (non-indexed soup: position, normal, colour [+ alpha]) =======================
function buf(af){return{p:[],n:[],c:[],af:af||null,a:af?[]:null};}
const nT=b=>b.p.length/9;
function tri(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];
 let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(!(l>1e-12))return;nx/=l;ny/=l;nz/=l;
 if(b.af)b.a.push(b.af(p0[0],p0[2]),b.af(p1[0],p1[2]),b.af(p2[0],p2[2]));
 b.p.push(p0[0],p0[1],p0[2],p1[0],p1[1],p1[2],p2[0],p2[1],p2[2]);
 for(let i=0;i<3;i++){b.n.push(nx,ny,nz);b.c.push(col[0],col[1],col[2]);}}
function quad(b,p0,p1,p2,p3,col){tri(b,p0,p1,p2,col);tri(b,p0,p2,p3,col);}
function quadUp(b,p0,p1,p2,p3,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p3[0]-p0[0],vz=p3[2]-p0[2];
 if(uz*vx-ux*vz>=0)quad(b,p0,p1,p2,p3,col);else quad(b,p0,p3,p2,p1,col);}
function triUp(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vz=p2[2]-p0[2];
 if(uz*vx-ux*vz>=0)tri(b,p0,p1,p2,col);else tri(b,p0,p2,p1,col);}
// winding chosen so the face normal points away from the reference point o (robust for curved shells)
function triO(b,p0,p1,p2,col,o){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];
 const d=(uy*vz-uz*vy)*((p0[0]+p1[0]+p2[0])/3-o[0])+(uz*vx-ux*vz)*((p0[1]+p1[1]+p2[1])/3-o[1])+(ux*vy-uy*vx)*((p0[2]+p1[2]+p2[2])/3-o[2]);
 if(d>=0)tri(b,p0,p1,p2,col);else tri(b,p0,p2,p1,col);}
function quadO(b,p0,p1,p2,p3,col,o){triO(b,p0,p1,p2,col,o);triO(b,p0,p2,p3,col,o);}
function wall(b,ax,az,bx,bz,y0,y1,col){quad(b,[ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az],col);}
function rectPts(x,z,w,d,ry){const hx=w/2,hz=d/2,c=Math.cos(ry||0),s=Math.sin(ry||0),o=[[hx,-hz],[-hx,-hz],[-hx,hz],[hx,hz]];
 for(let i=0;i<4;i++){const lx=o[i][0],lz=o[i][1];o[i]=[x+lx*c+lz*s,z-lx*s+lz*c];}return o;}
// chamfered rectangle (8 points, same winding as rectPts)
function chamfPts(x,z,w,d,ry,bv){const hx=w/2,hz=d/2,c=Math.cos(ry||0),s=Math.sin(ry||0);bv=Math.min(bv,hx*.9,hz*.9);
 const o=[[hx,-hz+bv],[hx-bv,-hz],[-hx+bv,-hz],[-hx,-hz+bv],[-hx,hz-bv],[-hx+bv,hz],[hx-bv,hz],[hx,hz-bv]];
 for(let i=0;i<8;i++){const lx=o[i][0],lz=o[i][1];o[i]=[x+lx*c+lz*s,z-lx*s+lz*c];}return o;}
// regular polygon in the same winding as rectPts (decreasing angle)
function polyPts(x,z,r,n,a0){const o=[];for(let i=0;i<n;i++){const a=(a0||0)-i*TAU/n;o.push([x+Math.cos(a)*r,z+Math.sin(a)*r]);}return o;}
function arcPts(x,z,r,a0,a1,n){const o=[];for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);o.push([x+Math.cos(a)*r,z+Math.sin(a)*r]);}return o;}
function prism(b,pts,y0,y1,col,top){const n=pts.length;for(let i=0;i<n;i++){const a=pts[i],c=pts[(i+1)%n];wall(b,a[0],a[1],c[0],c[1],y0,y1,col);}
 if(top!==false){const tc=top||col;for(let i=1;i<n-1;i++)tri(b,[pts[0][0],y1,pts[0][1]],[pts[i][0],y1,pts[i][1]],[pts[i+1][0],y1,pts[i+1][1]],tc);}}
function box(b,x,y0,z,w,h,d,ry,col,top){prism(b,rectPts(x,z,w,d,ry),y0,y0+h,col,top);}
// frustum between two same-count footprints (tapers, battered walls, stepped basins)
function loft(b,p0,y0,p1,y1,col,top){const n=p0.length;let cx=0,cz=0;for(const p of p0){cx+=p[0]/n;cz+=p[1]/n;}const o=[cx,(y0+y1)/2,cz];
 for(let i=0;i<n;i++){const j=(i+1)%n;quadO(b,[p0[i][0],y0,p0[i][1]],[p0[j][0],y0,p0[j][1]],[p1[j][0],y1,p1[j][1]],[p1[i][0],y1,p1[i][1]],col,o);}
 if(top){const q=y1>=y0?p1:p0,yy=y1>=y0?y1:y0;for(let i=1;i<n-1;i++)triUp(b,[q[0][0],yy,q[0][1]],[q[i][0],yy,q[i][1]],[q[i+1][0],yy,q[i+1][1]],top===true?col:top);}}
// bevelled box: chamfered vertical edges + tapered top and bottom (monolith, capsules, pods)
function bevBox(b,x,y0,z,w,h,d,ry,bv,col,cap){const o8=chamfPts(x,z,w,d,ry,bv),i8=chamfPts(x,z,w-bv*2,d-bv*2,ry,bv*.5),y1=y0+h,o=[x,y0+h/2,z];
 prism(b,o8,y0+bv,y1-bv,col,false);loft(b,o8,y1-bv,i8,y1,tone(col,1.12),cap||col);
 for(let i=0;i<8;i++){const j=(i+1)%8;quadO(b,[o8[i][0],y0+bv,o8[i][1]],[o8[j][0],y0+bv,o8[j][1]],[i8[j][0],y0,i8[j][1]],[i8[i][0],y0,i8[i][1]],tone(col,.8),o);}
 for(let i=1;i<7;i++)triO(b,[i8[0][0],y0,i8[0][1]],[i8[i][0],y0,i8[i][1]],[i8[i+1][0],y0,i8[i+1][1]],tone(col,.7),o);}
function cyl(b,x,y0,z,r0,r1,h,n,col,cap){const y1=y0+h;
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  quad(b,[x+c1*r0,y0,z+s1*r0],[x+c0*r0,y0,z+s0*r0],[x+c0*r1,y1,z+s0*r1],[x+c1*r1,y1,z+s1*r1],col);
  if(cap&&r1>0)tri(b,[x,y1,z],[x+c1*r1,y1,z+s1*r1],[x+c0*r1,y1,z+s0*r1],cap===true?col:cap);}}
function cylIn(b,x,y0,z,r0,r1,h,n,col){const y1=y0+h;   // inner surface (seen from inside: basins, crater walls)
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  quad(b,[x+c0*r0,y0,z+s0*r0],[x+c1*r0,y0,z+s1*r0],[x+c1*r1,y1,z+s1*r1],[x+c0*r1,y1,z+s0*r1],col);}}
// flat annulus facing up (decks, disc slabs, basin steps); a0..a1 optional arc
function annulus(b,x,y,z,r0,r1,n,col,a0,a1){a0=a0||0;a1=a1==null?a0+TAU:a1;
 for(let i=0;i<n;i++){const t0=lerp(a0,a1,i/n),t1=lerp(a0,a1,(i+1)/n),c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
  if(r0<=1e-6)triUp(b,[x,y,z],[x+c0*r1,y,z+s0*r1],[x+c1*r1,y,z+s1*r1],col);
  else quadUp(b,[x+c0*r0,y,z+s0*r0],[x+c0*r1,y,z+s0*r1],[x+c1*r1,y,z+s1*r1],[x+c1*r0,y,z+s1*r0],col);}}
function strut(b,a,e,r,col){let dx=e[0]-a[0],dy=e[1]-a[1],dz=e[2]-a[2];const L=Math.hypot(dx,dy,dz);if(L<1e-5)return;dx/=L;dy/=L;dz/=L;
 let ux,uy,uz;if(Math.abs(dy)<.9){ux=-dz;uy=0;uz=dx;}else{ux=1;uy=0;uz=0;}
 const k=ux*dx+uy*dy+uz*dz;ux-=dx*k;uy-=dy*k;uz-=dz*k;const ul=Math.hypot(ux,uy,uz)||1;ux/=ul;uy/=ul;uz/=ul;
 const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux,o=[];
 for(let i=0;i<3;i++){const t=i*TAU/3,c=Math.cos(t)*r,s=Math.sin(t)*r;o.push([ux*c+vx*s,uy*c+vy*s,uz*c+vz*s]);}
 for(let i=0;i<3;i++){const p=o[i],q=o[(i+1)%3];
  quad(b,[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[a[0]+q[0],a[1]+q[1],a[2]+q[2]],[e[0]+q[0],e[1]+q[1],e[2]+q[2]],[e[0]+p[0],e[1]+p[1],e[2]+p[2]],col);}}
// torus: centre c, orthonormal in-plane axes u,v; ring radius R, tube radius r, n segments x m sides; col may be fn(i); arc a0..a1
function torus(b,c,u,v,R,r,n,m,col,a0,a1){const w=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];a0=a0||0;a1=a1==null?a0+TAU:a1;
 const cf=typeof col==='function'?col:null;
 const P=(a,t)=>{const ca=Math.cos(a),sa=Math.sin(a),ex=u[0]*ca+v[0]*sa,ey=u[1]*ca+v[1]*sa,ez=u[2]*ca+v[2]*sa,ct=Math.cos(t)*r,st=Math.sin(t)*r;
  return[c[0]+ex*(R+ct)+w[0]*st,c[1]+ey*(R+ct)+w[1]*st,c[2]+ez*(R+ct)+w[2]*st];};
 for(let i=0;i<n;i++){const t0=lerp(a0,a1,i/n),t1=lerp(a0,a1,(i+1)/n),tm=(t0+t1)/2,cm=Math.cos(tm),sm=Math.sin(tm),cc=cf?cf(i):col;
  const o=[c[0]+(u[0]*cm+v[0]*sm)*R,c[1]+(u[1]*cm+v[1]*sm)*R,c[2]+(u[2]*cm+v[2]*sm)*R];
  for(let j=0;j<m;j++){const s0=j*TAU/m+PI/m,s1=(j+1)*TAU/m+PI/m;quadO(b,P(t0,s0),P(t1,s0),P(t1,s1),P(t0,s1),cc,o);}}}
const AXY=[[1,0,0],[0,0,1]],AXZ=[[1,0,0],[0,1,0]],AYZ=[[0,0,1],[0,1,0]];   // handy torus planes (horizontal, facing z, facing x)
// faceted latitude sphere with half-step twist per row (geodesic look); la0..la1 in radians; col may be fn(i,j)
function sphPt(x,y,z,r,nl,ns,la0,la1,i,j){const la=lerp(la0,la1,i/nl),lo=(j+i*.5)*TAU/ns,cr=Math.cos(la)*r;return[x+Math.cos(lo)*cr,y+Math.sin(la)*r,z+Math.sin(lo)*cr];}
function sphere(b,x,y,z,r,nl,ns,col,la0,la1){la0=la0==null?-PI/2:la0;la1=la1==null?PI/2:la1;const o=[x,y,z],cf=typeof col==='function'?col:null;
 const P=(i,j)=>sphPt(x,y,z,r,nl,ns,la0,la1,i,j);
 for(let i=0;i<nl;i++)for(let j=0;j<ns;j++){const a=P(i,j),e=P(i,j+1),c=P(i+1,j),d=P(i+1,j+1);
  triO(b,a,e,c,cf?cf(i,j,0):col,o);triO(b,e,d,c,cf?cf(i,j,1):col,o);}}
// open geodesic strut shell on the same lattice (Faraday hemisphere, facet joints); skip(i,j) may leave openings
function geoShell(b,x,y,z,r,nl,ns,rad,col,la0,la1,skip){la0=la0==null?0:la0;la1=la1==null?PI/2*.96:la1;
 const P=(i,j)=>sphPt(x,y,z,r,nl,ns,la0,la1,i,j);
 for(let i=0;i<=nl;i++)for(let j=0;j<ns;j++){if(skip&&skip(i,j))continue;const a=P(i,j),e=P(i,j+1);strut(b,a,e,rad,col);
  if(i<nl){strut(b,a,P(i+1,j),rad,col);strut(b,e,P(i+1,j),rad,col);}}}
// dome: ellipsoid cap (radius r, height h) of nl latitude bands, open oculus of radius r*oc at the top; col may be fn(i,j)
function domePt(x,y,z,r,h,oc,nl,ns,i,j){const t=lerp(0,Math.acos(clamp(oc||0,0,1)),i/nl),a=j*TAU/ns,cr=Math.cos(t)*r;return[x+Math.cos(a)*cr,y+Math.sin(t)*h,z+Math.sin(a)*cr];}
function dome(b,x,y,z,r,h,nl,ns,col,oc){const o=[x,y,z],cf=typeof col==='function'?col:null,P=(i,j)=>domePt(x,y,z,r,h,oc,nl,ns,i,j);
 for(let i=0;i<nl;i++)for(let j=0;j<ns;j++){const cc=cf?cf(i,j):col;
  if(i===nl-1&&!(oc>0))triO(b,P(i,j),P(i,j+1),[x,y+h,z],cc,o);else quadO(b,P(i,j),P(i,j+1),P(i+1,j+1),P(i+1,j),cc,o);}}
function domeRibs(b,x,y,z,r,h,nl,nr,rad,col,oc){const P=(i,j)=>domePt(x,y,z,r*1.015,h*1.015,oc,nl,nr,i,j);
 for(let j=0;j<nr;j++)for(let i=0;i<nl;i++)strut(b,P(i,j),P(i+1,j),rad,col);
 if(oc>0)for(let j=0;j<nr;j++)strut(b,P(nl,j),P(nl,j+1),rad,col);}
// barrel vault along local z (width w, length len, rise h), ns arc segments; ends closed with fans unless endCol===false
function barPt(x,y,z,w,h,ry,t,lz){const lx=Math.cos(t)*w/2,c=Math.cos(ry||0),s=Math.sin(ry||0);return[x+lx*c+lz*s,y+Math.sin(t)*h,z-lx*s+lz*c];}
function barrel(b,x,y,z,w,len,h,ry,ns,col,endCol){const o=[x,y,z],P=(i,lz)=>barPt(x,y,z,w,h,ry,PI*i/ns,lz),hl=len/2;
 for(let i=0;i<ns;i++)quadO(b,P(i,-hl),P(i+1,-hl),P(i+1,hl),P(i,hl),col,o);
 if(endCol!==false)for(const e of[-hl,hl]){const m=barPt(x,y,z,0,0,ry,0,e);for(let i=0;i<ns;i++)triO(b,m,P(i,e),P(i+1,e),endCol||col,o);}}
function barrelLattice(b,x,y,z,w,len,h,ry,ns,nb,rad,col){const P=(i,lz)=>barPt(x,y,z,w*1.02,h*1.03,ry,PI*i/ns,lz),hl=len/2;
 for(let k=0;k<nb;k++){const z0=-hl+len*k/nb,z1=z0+len/nb;
  for(let i=0;i<ns;i++){strut(b,P(i,z0),P(i+1,z1),rad,col);strut(b,P(i+1,z0),P(i,z1),rad,col);}}
 for(let k=0;k<=nb;k++){const zz=-hl+len*k/nb;for(let i=0;i<ns;i++)strut(b,P(i,zz),P(i+1,zz),rad*1.5,col);}}
// fin: thin vertical plate from (x0,z0) to (x1,z1), base yb0/yb1, heights h0/h1, thickness th
function fin(b,x0,z0,x1,z1,yb0,yb1,h0,h1,th,col){const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz)||1,nx=-dz/l*th/2,nz=dx/l*th/2,o=[(x0+x1)/2,(yb0+yb1)/2+(h0+h1)/4,(z0+z1)/2];
 const a=[x0+nx,yb0,z0+nz],e=[x1+nx,yb1,z1+nz],f=[x1+nx,yb1+h1,z1+nz],g=[x0+nx,yb0+h0,z0+nz],a2=[x0-nx,yb0,z0-nz],e2=[x1-nx,yb1,z1-nz],f2=[x1-nx,yb1+h1,z1-nz],g2=[x0-nx,yb0+h0,z0-nz];
 quadO(b,a,e,f,g,col,o);quadO(b,a2,e2,f2,g2,col,o);quadO(b,g,f,f2,g2,tone(col,1.15),o);quadO(b,e,e2,f2,f,col,o);quadO(b,a,a2,g2,g,col,o);}
function cum(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c;}
function polyAt(pts,c,t){let i=1;while(i<pts.length-1&&c[i]<t)i++;const a=pts[i-1],e=pts[i],l=(c[i]-c[i-1])||1e-6,k=clamp((t-c[i-1])/l,0,1);
 return[a[0]+(e[0]-a[0])*k,a[1]+(e[1]-a[1])*k,(e[0]-a[0])/l,(e[1]-a[1])/l];}
function resample(pts,step){const c=cum(pts),L=c[c.length-1],n=Math.max(1,Math.ceil(L/step)),o=[];for(let i=0;i<=n;i++)o.push(polyAt(pts,c,L*i/n));return o;}
function ribbon(b,T,pts,w,col,lift,step){const rs=resample(pts,step||.7),h=w/2;let pl=null,pr=null;lift=lift==null?.02:lift;
 for(let i=0;i<rs.length;i++){const s=rs[i],nx=-s[3],nz=s[2],lx=s[0]+nx*h,lz=s[1]+nz*h,rx=s[0]-nx*h,rz=s[1]-nz*h;
  const l=[lx,T.yl(lx,lz)+lift,lz],r=[rx,T.yl(rx,rz)+lift,rz];if(pl)quadUp(b,pl,pr,r,l,col);pl=l;pr=r;}}
function disc(b,T,x,z,r,nr,ns,col,lift){const P3=(rad,a)=>{const px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nr;i++){const ra=r*i/nr,rb=r*(i+1)/nr;for(let j=0;j<ns;j++){const a0=j*TAU/ns,a1=(j+1)*TAU/ns;
  if(i===0)triUp(b,P3(0,0),P3(rb,a0),P3(rb,a1),col);else quadUp(b,P3(ra,a0),P3(rb,a0),P3(rb,a1),P3(ra,a1),col);}}}
function rectGrid(b,T,x,z,w,d,ry,nx,nz,col,lift){const c=Math.cos(ry||0),s=Math.sin(ry||0);
 const P3=(i,j)=>{const lx=(i/nx-.5)*w,lz=(j/nz-.5)*d,px=x+lx*c+lz*s,pz=z-lx*s+lz*c;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quadUp(b,P3(i,j),P3(i+1,j),P3(i+1,j+1),P3(i,j+1),col);}
function seat(T,pts){let lo=1e9,hi=-1e9,sx=0,sz=0;for(const p of pts){const y=T.yl(p[0],p[1]);if(y<lo)lo=y;if(y>hi)hi=y;sx+=p[0];sz+=p[1];}
 const yc=T.yl(sx/pts.length,sz/pts.length);return{lo:Math.min(lo,yc),hi:Math.max(hi,yc)};}
const seatC=(T,x,z,r)=>seat(T,polyPts(x,z,r,8,0));

// ======================= materials (engine families; feathered ground = protown's pt_ground_feather parameters) =======================
function makeMats(T){const THREE=T.THREE,cm=T.ctx.mats||{},used={},M={};
 const std=o=>new THREE.MeshStandardMaterial(Object.assign({color:0xffffff,vertexColors:true},o));
 const pick=(k,mk)=>{if(cm[k]&&cm[k].isMaterial){used[k]='ctx';return cm[k];}used[k]='own';const m=mk();m.name='pe_'+k;return m;};
 M.building=pick('building',()=>std({roughness:.84,metalness:0}));
 M.metal=pick('metal',()=>std({roughness:.42,metalness:.6}));
 M.light=pick('light',()=>new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true}));
 M.foliage=pick('foliage',()=>std({roughness:.9,metalness:0}));
 M.ground=std({roughness:.95,metalness:0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});M.ground.name='pe_ground_feather';
 used.ground='own feather (vertex alpha)';return{M,used};}

// ======================= build state =======================
// N = near soup, D = mid soup, F = far soup; dynM / dynL / dynP = item lists for the (max 3) dynamic meshes (metal, light, pulse light)
function newBuild(T,L,MM){const fa=T.fa,mk=()=>({ground:buf(fa),building:buf(),metal:buf(),light:buf(),foliage:buf()});
 return{T,L,M:MM.M,used:MM.used,N:mk(),D:mk(),F:{building:buf(),light:buf(),metal:buf()},dynM:[],dynL:[],dynP:[],lights:[],movers:[],anims:[],casters:[],
  far:[],farTris:0,gl:T.day?.3:1,lit:T.day?.28:.38,warm:hex(PAL.warm,T.day?.32:1)};}
const winCol=(B,h)=>tone(B.warm,.5+.55*h);
const glow=(B,h,k)=>hex(h,k*B.gl);   // light-family colour: k 1.4-2.6 at blue hour (bloom), x.3 by day
function lightPt(B,x,y,z,col,i,d){if(B.lights.length<12)B.lights.push({x,y,z,color:col,intensity:i,dist:d});}

// ======================= layout =======================
function koHit(L,x,z,r){for(const k of L.ko)if(Math.hypot(x-k.x,z-k.z)<k.r+r)return true;return false;}
// pull a footprint centre inwards until its circle fits inside the warped boundary
function fit(T,x,z,r,k){for(let i=0;i<14;i++){const d=Math.hypot(x,z);if(d+r<=T.bAt(x,z)*(k||.9)||d<.5)break;x*=.95;z*=.95;}return[x,z];}
function inBloc(T,s,x,z,m){m=m||0;return s*x>T.hw*1.25+m&&Math.hypot(x,z)+m<T.bAt(x,z)*.93;}
function segD(px,pz,a,e){const dx=e[0]-a[0],dz=e[1]-a[1],t=clamp(((px-a[0])*dx+(pz-a[1])*dz)/((dx*dx+dz*dz)||1e-9),0,1);return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t);}
function polyD(px,pz,pts){let d=1e9;for(let i=1;i<pts.length;i++)d=Math.min(d,segD(px,pz,pts[i-1],pts[i]));return d;}
function clipRuns(pts,ok){const out=[];let run=[];for(const p of pts){if(ok(p[0],p[1]))run.push(p);else{if(run.length>2)out.push(run);run=[];}}
 if(run.length>2)out.push(run);return out;}
const lotSeed=(x,z)=>(hash2(x*7.1,z*3.3)*1e6)|0;

// ---- Bloc A anchors: Suspended Monolith core, terraced arcology, mag-lev spine, arched aqueducts, ops, drones ----
function layA(T,L){const R=T.R,k=T.k,hw=T.hw,sg=hash2(T.seed*.71,3.3)<.5?-1:1,K={s:-1,P:BLOC.A,key:'A',sg};L.blocs.push(K);
 let c=fit(T,-R*.45,sg*R*.12,4.9*k,.95);const cx=c[0],cz=c[1];
 // E2 patch (vision pass 1): the monolith is the tallest object of the site (~1.6x the needles), rings clear it, masts outside the ring sweep
 K.core={x:cx,z:cz,r:4.9*k,pit:2.2*k};
 K.mono={w:2.0*k,d:1.25*k,h:6.4*k,hang:2.2*k,bv:.2*k,cy:5.4*k};
 K.rings=[{r:3.55*k,tube:.13*k,ax:0,w:.21,ph:hash2(T.seed,1.1)*TAU},{r:3.85*k,tube:.14*k,ax:1,w:-.16,ph:hash2(T.seed,2.2)*TAU},
  {r:4.15*k,tube:.16*k,ax:2,w:.12,ph:hash2(T.seed,3.3)*TAU}];
 c=fit(T,-R*.66,-sg*R*.29,2.5*k,.95);
 K.arc={x:c[0],z:c[1],w:4.0*k,d:3.2*k,h:6.2*k,tiers:7,ry:0};const a=K.arc;
 const zm=a.z+sg*a.d*.17;L.zm=zm;   // mag-lev axis: straight along x through the arcology front, beside the core, out over the trench
 const mid=Math.atan2(a.z-cz,a.x-cx);K.mastA0=mid+PI/4;
 K.masts=[];for(let i=0;i<4;i++){const an=K.mastA0+i*PI/2;K.masts.push({x:cx+Math.cos(an)*4.55*k,z:cz+Math.sin(an)*4.55*k,h:9.6*k,a:an});}
 K.fins={n:32,r0:2.4*k,r1:3.7*k,h:.5*k};
 // two arched data aqueducts: pit rim -> arcology faces
 const ends=[[a.x+a.w*.2,a.z+sg*a.d*.5],[a.x+a.w*.5,a.z+sg*a.d*.42]];
 ends.forEach((e,i)=>{const an=Math.atan2(e[1]-cz,e[0]-cx);
  L.aq.push({bloc:'A',pts:[[cx+Math.cos(an)*2.0*k,cz+Math.sin(an)*2.0*k],e],h:1.3*k,w:.22*k,arch:true,span:1.5*k,ph:i*.37,col:BLOC.A.core});});
 const x0=a.x+a.w/2-.2*k,x1=-hw*.3,y=2.1*k,pyl=[];for(let x=x0+.9*k;x<-hw*1.22;x+=1.7*k)pyl.push(x);pyl.push(-hw*1.22);
 L.maglev={z:zm,x0,x1,y,pyl,pods:4,w:.3*k};
 c=fit(T,cx+.3*k,cz+sg*5.9*k,1.0*k,.93);K.ops={x:c[0],z:c[1],w:1.5*k,d:1.0*k,st:8,ry:0};
 for(let i=0;i<6;i++)L.drones.push({bloc:'A',x:cx,z:cz,r:(i<3?5.2:4.9)*k,y:(i<3?2.6:8.3)*k,w:(i<3?.3:-.24),ph:i*TAU/3+hash2(i,T.seed)*.5});
 L.ko.push({x:cx,z:cz,r:4.9*k,n:'coreA'},{x:a.x,z:a.z,r:2.3*k,n:'arcA'},{x:K.ops.x,z:K.ops.z,r:1.0*k,n:'opsA'});
 L.solids.push({n:'coreA',x:cx,z:cz,r:4.9*k},{n:'arcA',x:a.x,z:a.z,w:a.w,d:a.d,ry:0},{n:'opsA',x:K.ops.x,z:K.ops.z,w:K.ops.w,d:K.ops.d,ry:0});
 L.lots.push({x:a.x,z:a.z,w:a.w,d:a.d,ry:0,st:Math.round(a.h/ST),kind:'arcology',bloc:'A',seed:lotSeed(a.x,a.z)});
 L.labels.push({text:K.P.name,x:cx,z:cz});return K;}

// ---- Bloc B anchors: Bound Sphere core (crater, coils, lattice, terraces), radial aqueducts + trench stub, ops, drones ----
function layB(T,L){const R=T.R,k=T.k,hw=T.hw,sg=hash2(T.seed*.37,9.1)<.5?-1:1,K={s:1,P:BLOC.B,key:'B',sg},zm=L.zm;L.blocs.push(K);
 const c=fit(T,R*.48,sg*R*.08,5.3*k,.95),cx=c[0],cz=c[1],sr=3.1*k,yc=.55*k;
 // E2 patch (vision pass 1): deep crater (terraces 1.6 u), bigger sphere lifted so its body shows, thick stacked coils, no fin collar
 K.core={x:cx,z:cz,r:5.3*k,crater:4.0*k};K.sphere={r:sr,nl:8,ns:16,yc};K.lattice={r:3.95*k,nl:5,ns:16};
 K.coils=[.3,1.2,2.1].map((v,i)=>{const y=v*k;return{y:y+yc,r:Math.sqrt(sr*sr-y*y)+.3*k,tube:.2*k,pyl:8,i};});
 K.terr={n:5,r0:4.05*k,r1:5.3*k,h:1.6*k};K.fins={n:0,r0:4.0*k,r1:4.2*k,h:.55*k};
 // long low radial aqueducts into the dome sprawl
 const j=(hash2(T.seed*.19,5.5)-.5)*.3;
 for(const an of[.15+j,1.3+j*.5,-1.25+j*.5]){let t=5.4*k;const ca=Math.cos(an),sa=Math.sin(an);
  while(t<R&&inBloc(T,1,cx+ca*(t+.6*k),cz+sa*(t+.6*k),.3*k))t+=.4*k;
  if(t>7.2*k)L.aq.push({bloc:'B',pts:[[cx+ca*4.0*k,cz+sa*4.0*k],[cx+ca*t,cz+sa*t]],h:1.75*k,w:.3*k,arch:false,span:1.9*k,ph:an*.2,col:BLOC.B.core});}
 // the aqueduct that heads for the trench and ends as a severed stub facing Bloc A's mag-lev spine
 const kx=hw*1.2+1.5*k,as=Math.atan2(zm-cz,kx-cx);K.stubA=as;
 L.aq.push({bloc:'B',pts:[[cx+Math.cos(as)*4.0*k,cz+Math.sin(as)*4.0*k],[kx,zm],[hw*.3,zm]],h:1.75*k,w:.3*k,arch:false,span:1.9*k,ph:.5,col:BLOC.B.core,stub:true});
 K.casc=[.72+j,-.62+j,as+1.0];   // cooling cascade directions down the terraces
 const ao=as-1.05,o=fit(T,cx+Math.cos(ao)*6.4*k,cz+Math.sin(ao)*6.4*k,1.0*k,.93);
 K.ops={x:o[0],z:o[1],w:1.6*k,d:1.1*k,st:3,ry:-(ao+PI/2),a:ao};
 for(let i=0;i<5;i++)L.drones.push({bloc:'B',x:cx,z:cz,r:(i<3?4.7:3.2)*k,y:(i<3?2.4:4.6)*k,w:(i<3?-.3:.24),ph:i*TAU/(i<3?3:2)+hash2(i+7,T.seed)*.5});
 L.ko.push({x:cx,z:cz,r:5.3*k,n:'coreB'},{x:K.ops.x,z:K.ops.z,r:1.0*k,n:'opsB'});
 L.solids.push({n:'coreB',x:cx,z:cz,r:5.3*k},{n:'opsB',x:K.ops.x,z:K.ops.z,w:K.ops.w,d:K.ops.d,ry:K.ops.ry});
 L.labels.push({text:K.P.name,x:cx,z:cz});return K;}

// ---- the divide: trench section, lip masts, hex block rows, the two severed stubs ----
function layDivide(T,L){const k=T.k,hw=T.hw,zs=[T.rb(PI/2),T.rb(-PI/2)],z0=-zs[1]*.9,z1=zs[0]*.9,zm=L.zm,M=L.maglev;L.zWall=[z0,z1];
 // floor |x|<fl at ground level; battered walls fl->top rising wallH; lip deck top->lip; backfill slope lip->out
 L.trench={z0,z1,fl:hw*.5,top:hw*.62,lip:hw*.86,out:hw*1.2,wallH:.95*k,butt:1.5*k,zm};
 for(const s of[-1,1]){let i=0;for(let z=z0+.8*k;z<z1-.4*k;z+=4.8*k,i++){if(Math.abs(z-zm)<1.1*k)continue;
   L.masts.push({x:s*hw*.74,z:z+(s>0?1.6*k:0),s,h:(2.3+.5*hash2(i,s))*k,ph:hash2(s*3.1,i)*TAU});}}
 L.hexF={z0:z0+.5*k,z1:z1-.5*k,step:.62*k,r:.2*k,rows:3,gap:1.3*k};   // gap = clear floor under the stubs
 L.stubs=[{bloc:'A',kind:'maglev',z:zm,x0:-hw*1.22,x1:M.x1,y:M.y},{bloc:'B',kind:'aq',z:zm,x0:hw*1.2,x1:hw*.3,y:1.75*k}];}

// ---- Bloc A lots: orthogonal grid aligned to the mag-lev axis; needles (+sky-bridges), capsule towers, slab / stack blocks ----
function lotsA(T,L,K){const k=T.k,hw=T.hw,p=1.7*k,ox=-(hw*1.2+.75*k),zm=L.zm,cand=[],D=L.dbg;K.grid={p,ox,oz:zm};
 for(let i=0;i<11;i++)for(let j=-9;j<9;j++){const x=ox-(i+.5)*p,z=zm+(j+.5)*p;D.cells++;
  if(!inBloc(T,-1,x,z,.5*p)){D.bd++;if(inBloc(T,-1,x,z,.1*k)&&hash2(x,z)<.6)L.trees.push({x,z,n:1+(hash2(z,x)*3|0),s:.8+hash2(x*2,z)*.4});continue;}
  if(koHit(L,x,z,.5*p)){D.ko++;continue;}cand.push({i,j,x,z});}
 // needle district: the contiguous cells nearest a point on the open side of the spine
 const nx=K.core.x+.4*k,nz=zm-K.sg*2.6*k;cand.sort((a,b)=>Math.hypot(a.x-nx,a.z-nz)-Math.hypot(b.x-nx,b.z-nz));
 const needles=[];let caps=0,blocks=0;
 cand.forEach((c,n)=>{const h=hash2(c.x*1.37+T.seed*.01,c.z*2.11),h2=hash2(c.z*.91,c.x*1.7),rr=Math.hypot(c.x,c.z)/T.bAt(c.x,c.z),tall=1-.5*ss(.45,.95,rr);
  const base={x:c.x,z:c.z,ry:0,bloc:'A',seed:lotSeed(c.x,c.z),gi:c.i,gj:c.j};
  if(n<8){const l=Object.assign(base,{kind:'needle',w:.52*k,d:.52*k,h:(4.3+2.0*h)*k,oct:h2>.5,st:0});l.st=Math.round(l.h/ST);needles.push(l);L.lots.push(l);return;}
  if(caps<5&&(n%3===0||h>.8)){caps++;const hh=(3.0+1.4*h)*k;
   L.lots.push(Object.assign(base,{kind:'capsule',w:1.0*k,d:1.0*k,h:hh,coreR:.19*k,caps:Math.floor((hh-.5*k)/(.25*k)),twist:.9+h2*.5,st:Math.round(hh/ST)}));return;}
  if(blocks>=56)return;blocks++;
  if(h2<.55)L.lots.push(Object.assign(base,{kind:'slab',w:1.25*k,d:.5*k,ry:h<.5?0:PI/2,st:Math.max(2,Math.round((4+h*6)*tall)),twin:true}));
  else L.lots.push(Object.assign(base,{kind:'stack',w:1.15*k,d:1.15*k,st:Math.max(2,Math.round((3+h*5)*tall)),steps:2+(h>.5?1:0)}));});
 // sky-bridges between grid-adjacent needles at 2-3 levels
 for(let a=0;a<needles.length;a++)for(let b=a+1;b<needles.length;b++){const A=needles[a],E=needles[b];
  if(Math.abs(A.gi-E.gi)+Math.abs(A.gj-E.gj)!==1||L.bridges.length>=9)continue;const hm=Math.min(A.h,E.h),hv=hash2(a*3.1,b*1.7);
  L.bridges.push({a:[A.x,A.z],b:[E.x,E.z],ys:hv>.45?[hm*.42,hm*.66,hm*.86]:[hm*.48,hm*.78],w:.16*k,inset:.28*k});}
 K.needles=needles;}

// ---- Bloc B lots: radial slots on rings around the crater; dome clusters on plinths, disc towers, lattice hangars, low arc pads ----
function lotsB(T,L,K){const k=T.k,cx=K.core.x,cz=K.core.z,D=L.dbg,seq=['domes','hangar','disc','domes','pad','hangar','disc','domes','pad'],cnt={domes:0,disc:0,hangar:0,pad:0},cap={domes:6,disc:6,hangar:4,pad:36};
 const aqB=L.aq.filter(a=>a.bloc==='B');let n=0;K.ringR=[6.6*k,8.3*k,10.0*k,11.7*k,13.4*k];
 K.ringR.forEach((rr,ri)=>{const ns=Math.max(6,Math.round(TAU*rr/(2.15*k))),a0=hash2(T.seed*.01+ri,ri*2.3)*TAU;
  for(let j=0;j<ns;j++){const a=a0+j*TAU/ns,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;D.cells++;
   if(!inBloc(T,1,x,z,.7*k)){D.bd++;if(inBloc(T,1,x,z,.15*k)&&hash2(x,z)<.6)L.trees.push({x,z,n:1+(hash2(z,x)*3|0),s:.8+hash2(x*2,z)*.4});continue;}
   let near=koHit(L,x,z,.85*k);for(const q of aqB)if(polyD(x,z,q.pts)<.95*k)near=true;if(near){D.ko++;continue;}
   let kind=seq[n%seq.length];if(cnt[kind]>=cap[kind])kind='pad';if(cnt.pad>=cap.pad&&kind==='pad')continue;
   const lr=({domes:1.2,disc:.75,hangar:1.3,pad:.95})[kind]*k;let clash=false;for(const q of (K.placed=K.placed||[]))if(Math.hypot(q[0]-x,q[1]-z)<(q[2]+lr)*.92){clash=true;break;}
   if(clash){D.ko++;continue;}K.placed.push([x,z,lr]);n++;cnt[kind]++;
   const h=hash2(x*1.37+T.seed*.01,z*2.11),h2=hash2(z*.91,x*1.7),base={x,z,ry:-(a+PI/2),a,bloc:'B',seed:lotSeed(x,z),ring:ri};
   if(kind==='domes'){const big=(.62+.18*h)*k;   // local frame: +x tangential, +z radial; three domes of different sizes on one round plinth
    L.lots.push(Object.assign(base,{kind,w:2.4*k,d:2.4*k,r:1.2*k,st:1,plinth:.3*k,
     domes:[{dx:-.28*k,dz:.12*k,r:big,h:big*.82,oc:.2},{dx:.55*k,dz:-.3*k,r:.45*k,h:.36*k,oc:.24},{dx:.38*k,dz:.62*k,r:.32*k,h:.27*k,oc:.28}]}));}
   else if(kind==='disc'){const hh=(1.9+.7*h)*k;L.lots.push(Object.assign(base,{kind,w:1.5*k,d:1.5*k,r:.75*k,h:hh,discs:h2>.5?3:2,stem:.13*k,st:Math.round(hh/ST),plinth:.2*k}));}
   else if(kind==='hangar')L.lots.push(Object.assign(base,{kind,w:2.3*k,d:1.3*k,h:.75*k,st:2,plinth:.16*k}));   // vault axis along local x (tangential)
   else L.lots.push(Object.assign(base,{kind:'pad',w:(1.5+.5*h)*k,d:(.7+.25*h2)*k,st:1+(h*2.2|0),plinth:.14*k,court:h2>.6}));}});
 // E2 patch: hex-lattice infill so the warm sprawl reaches the whole half (rings alone leave most of it empty around the big crater)
 for(let gx=0;gx<9;gx++)for(let gz=-8;gz<=8;gz++){const x=T.hw*1.25+1.1*k+gx*1.85*k,z=gz*1.6*k+(gx%2?.8*k:0);D.cells++;
  if(!inBloc(T,1,x,z,.7*k)){D.bd++;continue;}if(koHit(L,x,z,.85*k)){D.ko++;continue;}let near=false;for(const q of aqB)if(polyD(x,z,q.pts)<.95*k)near=true;if(near)continue;
  const h=hash2(x*2.13+T.seed*.01,z*1.37),h2=hash2(z*.77,x*1.91);let kind=h<.34?'domes':h<.5?'disc':h<.62?'hangar':'pad';if(cnt[kind]>=cap[kind]+4)kind='pad';
  let lr=({domes:1.2,disc:.75,hangar:1.3,pad:.95})[kind]*k,small=false;const cl=r=>{for(const q of K.placed)if(Math.hypot(q[0]-x,q[1]-z)<(q[2]+r)*.92)return true;return false;};
  if(cl(lr)){if(cl(.62*k))continue;kind='domes';lr=.62*k;small=true;}
  K.placed.push([x,z,lr]);cnt[kind]++;const a=Math.atan2(z-cz,x-cx),base={x,z,ry:-(a+PI/2),a,bloc:'B',seed:lotSeed(x,z),ring:9};
  if(small){const r=(.4+.12*h2)*k;L.lots.push(Object.assign(base,{kind,w:1.2*k,d:1.2*k,r:.6*k,st:1,plinth:.18*k,domes:[{dx:0,dz:0,r,h:r*.8,oc:.22},{dx:.42*k,dz:.3*k,r:.2*k,h:.16*k,oc:.3}]}));}
  else if(kind==='domes'){const big=(.56+.18*h2)*k;L.lots.push(Object.assign(base,{kind,w:2.4*k,d:2.4*k,r:1.2*k,st:1,plinth:.3*k,
    domes:[{dx:-.28*k,dz:.12*k,r:big,h:big*.82,oc:.2},{dx:.55*k,dz:-.3*k,r:.42*k,h:.34*k,oc:.24},{dx:.38*k,dz:.62*k,r:.3*k,h:.25*k,oc:.28}]}));}
  else if(kind==='disc'){const hh=(1.7+.8*h2)*k;L.lots.push(Object.assign(base,{kind,w:1.5*k,d:1.5*k,r:.75*k,h:hh,discs:h2>.5?3:2,stem:.13*k,st:Math.round(hh/ST),plinth:.2*k}));}
  else if(kind==='hangar')L.lots.push(Object.assign(base,{kind,w:2.3*k,d:1.3*k,h:.75*k,st:2,plinth:.16*k}));
  else L.lots.push(Object.assign(base,{kind:'pad',w:(1.5+.5*h2)*k,d:(.7+.25*h)*k,st:1+(h2*2.2|0),plinth:.14*k,court:h>.8}));}
 K.counts=cnt;}

// ---- streets: A = orthogonal canyon grid; B = wide concentric arcs ----
function layStreets(T,L){const k=T.k,A=L.blocs[0],B=L.blocs[1],G=A.grid,okA=(x,z)=>inBloc(T,-1,x,z,0)&&!koHit(L,x,z,.12*k),okB=(x,z)=>inBloc(T,1,x,z,.1*k)&&!koHit(L,x,z,.1*k);
 for(let i=0;i<=11;i++){const pts=[];for(let z=-T.R;z<=T.R;z+=.5*k)pts.push([G.ox-i*G.p,z]);
  for(const r of clipRuns(pts,okA))if(L.streets.length<60)L.streets.push({pts:r,w:.28*k,kind:'grid',s:-1});}
 for(let j=-9;j<=9;j++){const pts=[];for(let x=-T.R;x<=0;x+=.5*k)pts.push([x,G.oz+j*G.p]);
  for(const r of clipRuns(pts,okA))if(L.streets.length<60)L.streets.push({pts:r,w:j===0?.5*k:.28*k,kind:j===0?'spine':'grid',s:-1});}
 for(const rr of[4.85*k,7.3*k,9.9*k,12.5*k]){const n=Math.max(24,Math.round(TAU*rr/(.5*k)));
  for(const r of clipRuns(arcPts(B.core.x,B.core.z,rr,0,TAU,n),okB))if(L.streets.length<90)L.streets.push({pts:r,w:.5*k,kind:'arc',s:1});}}

// ---- layout driver (sliced): returns L = everything the emitters need, no geometry yet ----
function* layoutGen(T){
 const L={blocs:[],lots:[],streets:[],ko:[],solids:[],trees:[],labels:[],aq:[],drones:[],masts:[],bridges:[],stubs:[],
  maglev:null,trench:null,hexF:null,zWall:[0,0],zm:0,dbg:{cells:0,bd:0,ko:0}};
 const KA=layA(T,L);yield 1;
 const KB=layB(T,L);yield 1;
 layDivide(T,L);yield 1;
 lotsA(T,L,KA);yield 1;
 lotsB(T,L,KB);yield 1;
 layStreets(T,L);
 // everything inside the boundary: drop any lot whose circle leaves it (belt and braces for odd seeds / radii)
 L.lots=L.lots.filter(l=>l.kind==='arcology'||Math.hypot(l.x,l.z)+Math.hypot(l.w,l.d)*.5<T.bAt(l.x,l.z)*.97);
 L.dbg.lots=L.lots.length;L.dbg.aq=L.aq.length;L.dbg.bridges=L.bridges.length;L.dbg.drones=L.drones.length;L.dbg.masts=L.masts.length;
 for(const l of L.lots)if(Math.hypot(l.x,l.z)>T.R*.97)L.dbg.out=(L.dbg.out||0)+1;
 return L;}

// ======================= shared building parts =======================
const lotH=l=>l.h||l.st*ST;
function plinth(T,S,pts,h,col,top){const s=seat(T,pts);prism(S.building,pts,s.lo-.12,s.hi+h,col,top);return s.hi+h;}
// ribbon-window bands on every face of a footprint (lit = light family warm, dark = glass tone on the wall family)
function bands(B,S,pts,yb,n,sd,mid,sh,bh,minL){const T=B.T,dg=hex(PAL.glassD,1),N=pts.length;sh=sh||ST;bh=bh||.13;minL=minL||.25*T.k;
 for(let f=0;f<N;f++){const a=pts[f],c=pts[(f+1)%N],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);if(len<minL)continue;
  const ox=-dz/len*.014,oz=dx/len*.014,segs=mid?1:(len>T.k?2:1);
  for(let k=0;k<n;k+=mid?2:1){const ya=yb+k*sh+.1,yt=ya+(mid?bh*1.4:bh);
   for(let g=0;g<segs;g++){const hv=hash2(sd*.0137+f*13.1+g*.37,k*7.3+g*1.9),on=hv<B.lit;if(mid&&!on)continue;
    const t0=(g+.08)/segs,t1=(g+.92)/segs;
    quad(on?S.light:S.building,[a[0]+dx*t0+ox,ya,a[1]+dz*t0+oz],[a[0]+dx*t1+ox,ya,a[1]+dz*t1+oz],[a[0]+dx*t1+ox,yt,a[1]+dz*t1+oz],[a[0]+dx*t0+ox,yt,a[1]+dz*t0+oz],on?winCol(B,hash2(hv,k)):dg);}}}}
// lit glazing segments around a drum / disc rim
function drumWin(B,S,x,y,z,r,h,n,sd,frac){const o=[x,y,z],R=r*1.012;
 for(let j=0;j<n;j++){if(hash2(sd*.013+j*1.7,j*.37+sd*.001)>=frac)continue;const a0=(j+.1)*TAU/n,a1=(j+.9)*TAU/n,c0=Math.cos(a0)*R,s0=Math.sin(a0)*R,c1=Math.cos(a1)*R,s1=Math.sin(a1)*R;
  quadO(S.light,[x+c0,y,z+s0],[x+c1,y,z+s1],[x+c1,y+h,z+s1],[x+c0,y+h,z+s0],winCol(B,hash2(j,sd*.01)),o);}}
// box beam between two 3D points (p,q = top centre line), horizontal width w, depth h; open ends
function beam3(b,p,q,w,h,col,top){const dx=q[0]-p[0],dz=q[2]-p[2],l=Math.hypot(dx,dz)||1,nx=-dz/l*w/2,nz=dx/l*w/2,o=[(p[0]+q[0])/2,(p[1]+q[1])/2-h/2,(p[2]+q[2])/2];
 const a=[p[0]+nx,p[1],p[2]+nz],c=[p[0]-nx,p[1],p[2]-nz],d=[q[0]-nx,q[1],q[2]-nz],e=[q[0]+nx,q[1],q[2]+nz],lo=v=>[v[0],v[1]-h,v[2]];
 quadO(b,a,c,d,e,top||col,o);quadO(b,lo(a),lo(c),lo(d),lo(e),tone(col,.7),o);quadO(b,a,e,lo(e),lo(a),col,o);quadO(b,c,d,lo(d),lo(c),col,o);}
// tapering lattice mast (legs + rungs + diagonals)
function latticeMast(S,x,y0,z,h,w0,w1,lv,rad,col,legs){legs=legs||4;
 const P=(i,t)=>{const a=i*TAU/legs+PI/4,w=lerp(w0,w1,t);return[x+Math.cos(a)*w,y0+h*t,z+Math.sin(a)*w];};
 for(let i=0;i<legs;i++){strut(S.metal,P(i,0),P(i,1),rad,col);
  for(let l=1;l<=lv;l++){strut(S.metal,P(i,l/lv),P(i+1,l/lv),rad*.7,col);strut(S.metal,P(i,(l-1)/lv),P(i+1,l/lv),rad*.6,col);}}}
// severed end: dark break face, bent rebar, warning beacon (dx = direction the stub points)
function stubEnd(B,S,p,dx,w){const k=B.T.k,dk=hex(PAL.dark,B.T.A);
 box(S.building,p[0]-dx*.02*k,p[1]-.17*k,p[2],.05*k,.2*k,w*1.12,0,dk);
 for(let i=0;i<4;i++){const z=p[2]+(i-1.5)*w*.26,h=hash2(i*3.7,p[2]);strut(S.metal,[p[0],p[1]-.04*k-i*.02*k,z],[p[0]+dx*(.1+.16*h)*k,p[1]-(.06+.1*h)*k-i*.02*k,z+(h-.5)*.06*k],.012*k,dk);}
 box(S.light,p[0]-dx*.14*k,p[1]+.01*k,p[2],.06*k,.06*k,.06*k,0,glow(B,PAL.beacon,1.8));}

// ======================= Bloc A buildings (vertical stack) =======================
function arcology(B,S,K,mid){const T=B.T,k=T.k,a=K.arc,P=K.P,n=a.tiers,th=a.h/n,rc=hex(P.roof,T.A),fc=hex(PAL.foliage,T.A),ic=glow(B,P.light,1.5),st=hex(PAL.steel,.6*T.A);
 let y=plinth(T,S,rectPts(a.x,a.z,a.w+.4*k,a.d+.4*k,0),.1*k,hex(PAL.concrete,.7*T.A));
 for(let i=0;i<n;i++){const f=1-i*.125,w=a.w*f,d=a.d*f,zc=a.z-K.sg*i*.1*k,pts=chamfPts(a.x,zc,w,d,0,.2*k),wc=hex(P.walls[i%4],T.A*(1-.03*i));
  prism(S.building,pts,y,y+th,wc,rc);bands(B,S,pts,y-.04,2,i*17+3,mid,th*.45,.16*k);
  if(!mid){for(const sd of[-1,1]){box(S.foliage,a.x,y+th,zc+sd*(d/2-.09*k),w*.78,.06*k,.1*k,0,fc);box(S.light,a.x,y+th-.03*k,zc+sd*(d/2+.012*k),w*.6,.02*k,.012*k,0,ic,false);}
   for(const sd of[-1,1])for(let j=0;j<3;j++){const fz=zc+(j-1)*d*.28;fin(S.metal,a.x+sd*w/2,fz,a.x+sd*(w/2+.16*k),fz,y,y,th,th*.6,.03*k,st);}}
  y+=th;}
 const zt=a.z-K.sg*n*.1*k;box(S.building,a.x,y,zt,.5*k,.4*k,.5*k,0,hex(P.walls[3],T.A),rc);
 if(!mid){strut(S.metal,[a.x,y+.4*k,zt],[a.x,y+.95*k,zt],.03*k,st);box(S.light,a.x,y+.93*k,zt,.07*k,.06*k,.07*k,0,glow(B,PAL.beacon,1.6));}}
function needle(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.A,sh=f=>l.oct?polyPts(l.x,l.z,l.w*.62*f,8,PI/8):rectPts(l.x,l.z,l.w*f,l.d*f,0);
 const wc=hex(P.walls[l.seed%4],T.A),rc=hex(P.roof,T.A),st=hex(PAL.steel,.65*T.A);
 const y0=plinth(T,S,rectPts(l.x,l.z,l.w*1.6,l.d*1.6,0),.14*k,hex(PAL.concrete,.66*T.A)),ym=y0+l.h*.62,y1=y0+l.h,p0=sh(1),p1=sh(.7),sv=ST*1.5;
 prism(S.building,p0,y0,ym,wc,false);loft(S.building,p0,ym,p1,ym+.14*k,tone(wc,.85));prism(S.building,p1,ym+.14*k,y1,tone(wc,1.06),rc);
 bands(B,S,p0,y0,Math.floor((ym-y0-.2*k)/sv),l.seed,mid,sv,.13,.15*k);bands(B,S,p1,ym+.14*k,Math.floor((y1-ym-.4*k)/sv),l.seed+5,mid,sv,.13,.15*k);
 if(mid)return;
 for(let i=0;i<4;i++){const a=i*PI/2+PI/4,c=Math.cos(a),s=Math.sin(a),r=l.w*.3;fin(S.metal,l.x+c*r*.3,l.z+s*r*.3,l.x+c*r,l.z+s*r,y1,y1,.55*k,.2*k,.025*k,st);}
 strut(S.metal,[l.x,y1,l.z],[l.x,y1+.8*k,l.z],.016*k,st);box(S.light,l.x,y1+.78*k,l.z,.05*k,.05*k,.05*k,0,glow(B,P.light,1.8));}
function capsule(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.A,wc=hex(P.walls[2],T.A*.9),rc=hex(P.roof,T.A),st=hex(PAL.steel,.65*T.A);
 const y0=plinth(T,S,rectPts(l.x,l.z,l.w,l.d,0),.12*k,hex(PAL.concrete,.66*T.A));
 cyl(S.building,l.x,y0,l.z,l.coreR,l.coreR,l.h,mid?6:8,wc,rc);
 for(let i=0;i<l.caps;i++){const a=i*l.twist,ca=Math.cos(a),sa=Math.sin(a),r=l.coreR+.17*k,px=l.x+ca*r,pz=l.z+sa*r,y=y0+.3*k+i*.25*k;
  const cc=hex(P.walls[(i+l.seed)%4],T.A*(.9+.2*hash2(i,l.seed*.001)));
  if(mid){if(!(i&1))box(S.building,px,y,pz,.36*k,.42*k,.28*k,-a,cc);continue;}
  bevBox(S.building,px,y,pz,.36*k,.2*k,.28*k,-a,.03*k,cc);
  box(S.light,l.x+ca*(r+.185*k),y+.06*k,l.z+sa*(r+.185*k),.012*k,.08*k,.13*k,-a,hash2(i*1.3,l.seed*.01)<.7?winCol(B,.8):tone(B.warm,.22),false);}
 if(mid)return;
 cyl(S.metal,l.x,y0+l.h,l.z,l.coreR*1.5,l.coreR*.6,.14*k,8,st,true);strut(S.metal,[l.x,y0+l.h,l.z],[l.x,y0+l.h+.6*k,l.z],.014*k,st);
 box(S.light,l.x,y0+l.h+.58*k,l.z,.045*k,.045*k,.045*k,0,glow(B,P.light,1.7));}
function slab(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.A,c=Math.cos(l.ry),s=Math.sin(l.ry),rc=hex(P.roof,T.A),st=hex(PAL.steel,.7*T.A);
 const y0=plinth(T,S,rectPts(l.x,l.z,1.36*k,1.36*k,0),.1*k,hex(P.deck,T.A));
 for(const sd of[-1,1]){const px=l.x+sd*.36*k*s,pz=l.z+sd*.36*k*c,n=Math.max(2,l.st-(sd>0?1:0)),pts=rectPts(px,pz,l.w,l.d,l.ry),wc=hex(P.walls[(l.seed+(sd>0?1:0))%4],T.A);
  prism(S.building,pts,y0,y0+n*ST,wc,rc);bands(B,S,pts,y0,n,l.seed+sd,mid);
  if(!mid)box(S.metal,px+(hash2(l.seed*.01,sd)-.5)*l.w*.5*c,y0+n*ST,pz-(hash2(l.seed*.01,sd)-.5)*l.w*.5*s,.24*k,.12*k,.18*k,l.ry,st);}
 box(S.building,l.x,y0,l.z,.22*k,l.st*ST*.7,.3*k,l.ry,hex(P.walls[2],T.A*.85),rc);}
function stack(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.A,rc=hex(P.roof2,T.A),n=Math.max(1,Math.ceil(l.st/l.steps));
 let y=plinth(T,S,rectPts(l.x,l.z,l.w+.2*k,l.d+.2*k,0),.1*k,hex(P.deck,T.A));
 for(let i=0;i<l.steps;i++){const f=1-i*.24,pts=chamfPts(l.x,l.z,l.w*f,l.d*f,0,.1*k);
  prism(S.building,pts,y,y+n*ST,hex(P.walls[(l.seed+i)%4],T.A),rc);bands(B,S,pts,y,n,l.seed+i*3,mid);y+=n*ST;}
 if(!mid)box(S.foliage,l.x,y,l.z,l.w*.3,.05*k,l.d*.3,0,hex(PAL.foliage,T.A));}
function bridges(B,S,mid){const T=B.T,k=T.k,P=BLOC.A,wc=hex(P.walls[1],T.A*.9),rc=hex(P.roof,T.A);
 for(const br of B.L.bridges){const dx=br.b[0]-br.a[0],dz=br.b[1]-br.a[1],d=Math.hypot(dx,dz)||1,ux=dx/d*br.inset,uz=dz/d*br.inset;
  const ax=br.a[0]+ux,az=br.a[1]+uz,bx=br.b[0]-ux,bz=br.b[1]-uz,yb=Math.max(T.yl(br.a[0],br.a[1]),T.yl(br.b[0],br.b[1]))+.14*k;
  for(const h of br.ys){beam3(S.building,[ax,yb+h,az],[bx,yb+h,bz],br.w,.11*k,wc,rc);
   if(!mid)beam3(S.light,[ax,yb+h-.035*k,az],[bx,yb+h-.035*k,bz],br.w+.02*k,.035*k,winCol(B,.6));}}}
function maglev(B,S,mid){const T=B.T,L=B.L,k=T.k,M=L.maglev,z=M.z,cc=hex(PAL.concrete,.78*T.A),cl=hex(PAL.concL,.8*T.A),st=hex(PAL.steel,.7*T.A);
 let yb=T.yl(M.x0,z);for(const x of M.pyl)yb=Math.max(yb,T.yl(x,z));yb+=M.y;M.yB=yb;
 beam3(S.building,[M.x0,yb,z],[M.x1,yb,z],M.w,.14*k,cc,cl);
 for(const x of M.pyl){const y=T.yl(x,z);box(S.building,x,y-.12,z,.16*k,yb-.14*k-y+.12,.16*k,0,cc);box(S.building,x,yb-.22*k,z,.2*k,.08*k,.62*k,0,cc);}
 if(mid)return;
 for(const sd of[-1,1])beam3(S.metal,[M.x0,yb+.03*k,z+sd*.09*k],[M.x1-.05*k,yb+.03*k,z+sd*.09*k],.03*k,.03*k,st);
 beam3(S.light,[M.x0,yb-.14*k,z],[M.x1-.3*k,yb-.14*k,z],.05*k,.012*k,glow(B,BLOC.A.light,1.4));
 stubEnd(B,S,[M.x1,yb,z],1,M.w);}

// ======================= Bloc B buildings (horizontal ground) =======================
function domes(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.B,n=mid?8:12,s=seatC(T,l.x,l.z,l.r),yt=s.hi+l.plinth,c=Math.cos(l.ry),sn=Math.sin(l.ry),deck=hex(P.deck,T.A);
 cyl(S.building,l.x,s.lo-.12,l.z,l.r,l.r,yt-s.lo+.12,mid?8:14,deck,tone(deck,1.1));
 l.domes.forEach((d,i)=>{if(mid&&i===2)return;const x=l.x+d.dx*c+d.dz*sn,z=l.z-d.dx*sn+d.dz*c,wc=hex(P.walls[(l.seed+i)%4],T.A),dr=.1*k,nl=mid?2:4;
  cyl(S.building,x,yt,z,d.r,d.r,dr,n,tone(wc,.85));
  dome(S.building,x,yt+dr,z,d.r,d.h,nl,n,mid?wc:(a,b)=>tone(wc,.93+.14*hash2(a*3.1+l.seed*.001,b*1.7+i)),d.oc);
  annulus(S.light,x,yt+dr+Math.sin(Math.acos(d.oc))*d.h-.004*k,z,0,d.r*d.oc,mid?6:8,glow(B,P.light,1.9));
  if(mid)return;
  drumWin(B,S,x,yt+.02*k,z,d.r,.06*k,n,l.seed+i*7,.5);domeRibs(S.metal,x,yt+dr,z,d.r,d.h,nl,i?6:8,.014*k,hex(P.roof,T.A),d.oc);});}
function discTower(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.B,n=mid?8:12,s=seatC(T,l.x,l.z,l.r),y0=s.hi+l.plinth,wc=hex(P.walls[l.seed%4],T.A),rc=hex(P.roof,T.A),deck=hex(P.deck,T.A);
 cyl(S.building,l.x,s.lo-.12,l.z,l.r*.9,l.r*.9,y0-s.lo+.12,n,deck,tone(deck,1.1));
 cyl(S.building,l.x,y0,l.z,l.stem*1.3,l.stem,l.h,mid?6:8,wc);
 const hs=l.discs===3?[.5,.76,1]:[.64,1];
 for(let i=0;i<l.discs;i++){const yd=y0+l.h*hs[i]-.1*k,rd=l.r*(.62+.38*(i+1)/l.discs);
  cyl(S.building,l.x,yd-.14*k,l.z,l.stem,rd,.14*k,n,tone(wc,.8));cyl(S.building,l.x,yd,l.z,rd,rd,.09*k,n,hex(PAL.glassD,1.2));
  drumWin(B,S,l.x,yd+.015*k,l.z,rd,.06*k,n,l.seed+i,mid?.45:.7);cyl(S.building,l.x,yd+.09*k,l.z,rd,rd*.55,.06*k,n,rc,tone(rc,1.1));}
 if(mid)return;const yt=y0+l.h+.05*k;
 strut(S.metal,[l.x,yt,l.z],[l.x,yt+.4*k,l.z],.014*k,hex(PAL.steel,.7*T.A));box(S.light,l.x,yt+.38*k,l.z,.045*k,.045*k,.045*k,0,glow(B,P.light,1.6));}
function hangar(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.B,wc=hex(P.walls[l.seed%4],T.A),ry=l.ry+PI/2;
 const y0=plinth(T,S,rectPts(l.x,l.z,l.w+.3*k,l.d+.3*k,l.ry),l.plinth,hex(P.deck,T.A));
 barrel(S.building,l.x,y0,l.z,l.d,l.w,l.h,ry,mid?4:8,wc,tone(wc,.8));
 if(mid)return;
 barrelLattice(S.metal,l.x,y0,l.z,l.d,l.w,l.h,ry,6,4,.014*k,hex(P.roof,T.A));
 for(const e of[-1,1]){const m=barPt(l.x,y0,l.z,0,0,ry,0,e*(l.w/2+.012*k));box(S.light,m[0],y0+.04*k,m[2],l.d*.5,l.h*.5,.01*k,ry,winCol(B,.7),false);}}
function pad(B,S,l,mid){const T=B.T,k=T.k,P=BLOC.B,wc=hex(P.walls[l.seed%4],T.A),pts=chamfPts(l.x,l.z,l.w,l.d,l.ry,.14*k);
 const y0=plinth(T,S,rectPts(l.x,l.z,l.w+.35*k,l.d+.35*k,l.ry),l.plinth,hex(P.deck,T.A));
 prism(S.building,pts,y0,y0+l.st*ST,wc,hex(P.roof,T.A));bands(B,S,pts,y0,l.st,l.seed,mid);
 if(l.court&&!mid){dome(S.building,l.x,y0+l.st*ST,l.z,l.d*.3,l.d*.22,2,8,tone(wc,1.08),.3);annulus(S.light,l.x,y0+l.st*ST+l.d*.2,l.z,0,l.d*.09,6,glow(B,P.light,1.7));}}
function emitLot(B,l,S,mid){switch(l.kind){
 case'arcology':return arcology(B,S,B.L.blocs[0],mid);case'needle':return needle(B,S,l,mid);case'capsule':return capsule(B,S,l,mid);
 case'slab':return slab(B,S,l,mid);case'stack':return stack(B,S,l,mid);case'domes':return domes(B,S,l,mid);
 case'disc':return discTower(B,S,l,mid);case'hangar':return hangar(B,S,l,mid);default:return pad(B,S,l,mid);}}

// ======================= data aqueducts, ops, infra =======================
function aqPath(B,q){if(q.p3)return q.p3;const T=B.T,k=T.k,rs=resample(q.pts,q.span/2),o=[];let yg=0;
 for(let i=0;i<rs.length;i++){const s=rs[i],over=Math.abs(s[0])<T.hw*1.2,f=i/Math.max(1,rs.length-1);if(!over||!i)yg=T.yl(s[0],s[1]);
  o.push([s[0],yg+q.h+(q.arch?.5*k*Math.sin(PI*f):0),s[1],over?1:0,T.yl(s[0],s[1])]);}
 return q.p3=o;}
function aqueduct(B,S,q,mid){const T=B.T,k=T.k,P=BLOC[q.bloc],p=aqPath(B,q),cc=hex(q.bloc==='A'?PAL.concrete:P.walls[2],.8*T.A),g=glow(B,q.col,.9),pw=(q.arch?.14:.22)*k;
 for(let i=1;i<p.length;i++){const a=p[i-1],e=p[i];beam3(S.building,a,e,q.w,.12*k,cc,tone(cc,.7));
  if(!mid)beam3(S.light,[a[0],a[1]+.012*k,a[2]],[e[0],e[1]+.012*k,e[2]],q.w*.35,.012*k,g);}
 for(let i=0;i<p.length;i+=2){const s=p[i];if(s[3])continue;box(S.building,s[0],s[4]-.12,s[2],pw,s[1]-.12*k-s[4]+.12,pw,0,cc);
  if(q.arch&&!mid&&i+2<p.length){const m=p[i+1],e=p[i+2];strut(S.building,[s[0],s[1]-.6*k,s[2]],[m[0],m[1]-.12*k,m[2]],.035*k,cc);strut(S.building,[e[0],e[1]-.6*k,e[2]],[m[0],m[1]-.12*k,m[2]],.035*k,cc);}}
 if(q.stub&&!mid)stubEnd(B,S,p[p.length-1],-1,q.w);}
// controllers' ops structure outside the containment + the only link: a glazed bridge to the rim (no gate, no road)
function ops(B,S,K,mid){const T=B.T,k=T.k,o=K.ops,c=K.core,P=K.P,wc=hex(P.walls[1],T.A),rc=hex(P.roof,T.A),h=o.st*ST,pts=rectPts(o.x,o.z,o.w,o.d,o.ry);
 const y0=plinth(T,S,rectPts(o.x,o.z,o.w+.3*k,o.d+.3*k,o.ry),.1*k,hex(P.deck,T.A));
 prism(S.building,pts,y0,y0+h,wc,rc);bands(B,S,pts,y0,o.st,K.s*7+11,mid);
 const a=Math.atan2(o.z-c.z,o.x-c.x),rr=(K.key==='A'?3.14:3.6)*k,yb=y0+Math.min(h-.12*k,1.3*k),e=[c.x+Math.cos(a)*rr,yb,c.z+Math.sin(a)*rr];
 beam3(S.building,[o.x,yb,o.z],e,.2*k,.16*k,tone(wc,.85),rc);box(S.building,e[0],T.yl(e[0],e[2])-.1,e[2],.14*k,yb-.1*k-T.yl(e[0],e[2])+.1,.14*k,0,tone(wc,.8));
 if(mid)return;
 beam3(S.light,[o.x,yb-.05*k,o.z],e,.22*k,.05*k,winCol(B,.5));
 strut(S.metal,[o.x,y0+h,o.z],[o.x,y0+h+.45*k,o.z],.016*k,hex(PAL.steel,.7*T.A));lightPt(B,o.x,y0+h+.1,o.z,PAL.warm,.4,5*k);}
function* infraGen(B,S,mid){const L=B.L;maglev(B,S,mid);yield 1;
 for(const q of L.aq){aqueduct(B,S,q,mid);yield 1;}
 bridges(B,S,mid);yield 1;
 for(const K of L.blocs){ops(B,S,K,mid);yield 1;}}

// ======================= centrepiece A : Suspended Monolith =======================
function ringPose(r,t,Q){if(r.ax===0){Q[3]=r.ph+r.w*t;Q[5]=0;}else{Q[3]=r.ax===1?.6:.6+PI/2;Q[5]=r.ph+r.w*t;}}
function ringAxes(r){const Q=[0,0,0,0,1,0];ringPose(r,0,Q);const c=Math.cos(Q[3]),s=Math.sin(Q[3]),cp=Math.cos(Q[5]),sp=Math.sin(Q[5]);return[[c,0,-s],[sp*s,cp,sp*c]];}
function monoSeams(b,B,K,x,y,z){const k=B.T.k,m=K.mono,g=glow(B,K.P.core,2.0),yb=y+m.hang;
 for(const p of rectPts(x,z,m.w-m.bv*.8,m.d-m.bv*.8,m.ry))strut(b,[p[0],yb+m.bv,p[1]],[p[0],yb+m.h-m.bv,p[1]],.022*k,g);
 for(const f of[.22,.5,.78])prism(b,chamfPts(x,z,m.w+.02*k,m.d+.02*k,m.ry,m.bv),yb+m.h*f,yb+m.h*f+.035*k,g,false);}
function mastA(B,S,K,ms,y,cor,mid){const T=B.T,k=T.k,m=K.mono,st=hex(PAL.steel,.62*T.A),dk=hex(PAL.dark,T.A),cab=hex(PAL.cable,1),ym=T.yl(ms.x,ms.z);
 let best=cor[0],bd=1e9;for(const p of cor){const d=Math.hypot(p[0]-ms.x,p[1]-ms.z);if(d<bd){bd=d;best=p;}}
 box(S.building,ms.x,ym-.15,ms.z,1.1*k,.15+.22*k,1.1*k,-ms.a,hex(PAL.concrete,.62*T.A));
 strut(S.metal,[ms.x,ym+ms.h-.1*k,ms.z],[best[0],y+m.hang+m.h-m.bv,best[1]],(mid?.045:.026)*k,cab);
 if(mid){loft(S.metal,rectPts(ms.x,ms.z,.7*k,.7*k,-ms.a),ym,rectPts(ms.x,ms.z,.2*k,.2*k,-ms.a),ym+ms.h,st,true);return;}
 // heavy clamp mast: tapered solid spine + outer lattice, a clamp head with a dark yoke pointing at the monolith
 loft(S.building,rectPts(ms.x,ms.z,.42*k,.42*k,-ms.a),ym,rectPts(ms.x,ms.z,.16*k,.16*k,-ms.a),ym+ms.h,hex(PAL.dark,1.25*T.A),true);
 latticeMast(S,ms.x,ym+.1*k,ms.z,ms.h*.78,.62*k,.2*k,7,.035*k,st);
 strut(S.metal,[ms.x,ym+ms.h*.45,ms.z],[best[0],y+m.hang+m.bv,best[1]],.024*k,cab);
 strut(S.metal,[ms.x,ym+ms.h*.72,ms.z],[best[0],y+m.hang+m.h*.5,best[1]],.02*k,cab);
 box(S.metal,ms.x,ym+ms.h-.05*k,ms.z,.55*k,.32*k,.55*k,-ms.a,dk);
 box(S.light,ms.x,ym+ms.h+.27*k,ms.z,.08*k,.08*k,.08*k,0,glow(B,PAL.beacon,1.7));
 for(const f of[.3,.55])prism(S.light,rectPts(ms.x,ms.z,.44*k,.44*k,-ms.a),ym+ms.h*f,ym+ms.h*f+.04*k,glow(B,K.P.core,1.3),false);}
function* coreA(B,S,K,mid){const T=B.T,k=T.k,c=K.core,m=K.mono,cx=c.x,cz=c.z,se=seatC(T,cx,cz,c.r*.85),y=se.hi,n=mid?16:32;K.y=y;m.ry=-(K.mastA0-PI/4);
 const cd=hex(PAL.concrete,.62*T.A),cl=hex(PAL.concL,.8*T.A),dk=hex(PAL.dark,T.A),st=hex(PAL.steel,.65*T.A);
 // stepped cooling basin: three rings rising outward around the pit floor (reads as a sunken ring pit), glowing floor ring
 let hp=0;for(let i=0;i<3;i++){const r0=c.pit+i*.38*k,r1=r0+.38*k,h=(.18+i*.2)*k;cylIn(S.building,cx,y+hp,cz,r0,r0,h-hp,n,tone(cd,.8));annulus(S.building,cx,y+h,cz,r0,r1,n,i%2?cl:cd);hp=h;}
 cyl(S.building,cx,se.lo-.15,cz,c.pit+1.2*k,c.pit+1.14*k,y+hp-se.lo+.15,n,cd);
 annulus(S.building,cx,y+.02,cz,0,c.pit,n,dk);annulus(S.light,cx,y+.035,cz,.45*k,1.1*k,mid?8:16,glow(B,K.P.core,1.5));
 if(!mid)lightPt(B,cx,y+1.2*k,cz,K.P.core,1.0,10*k);
 yield 1;
 // radial heat-sink fin field following the basin steps
 if(!mid){const F=K.fins;for(let i=0;i<F.n;i++){const a=i*TAU/F.n,ca=Math.cos(a),sa=Math.sin(a);
   fin(S.metal,cx+ca*F.r0,cz+sa*F.r0,cx+ca*F.r1,cz+sa*F.r1,y+.18*k,y+.58*k,F.h,F.h*.6,.035*k,st);}yield 1;}
 // the monolith (near: seams and rings live in the dynamic meshes; mid: static)
 bevBox(S.building,cx,y+m.hang,cz,m.w,m.h,m.d,m.ry,m.bv,hex(PAL.mono,1),hex(PAL.mono,1.3));
 if(mid){monoSeams(S.light,B,K,cx,y,cz);for(const r of K.rings){const ax=ringAxes(r);torus(S.metal,[cx,y+m.cy,cz],ax[0],ax[1],r.r,r.tube*1.3,16,3,st);}}
 yield 1;
 // four clamp masts + tension cables to the monolith corners
 const cor=rectPts(cx,cz,m.w,m.d,m.ry);for(const ms of K.masts){mastA(B,S,K,ms,y,cor,mid);yield 1;}}

// ======================= centrepiece B : Bound Sphere =======================
function* coreB(B,S,K,mid){const T=B.T,k=T.k,c=K.core,cx=c.x,cz=c.z,se=seatC(T,cx,cz,c.r*.9),y=se.hi,n=mid?18:36,P=K.P,te=K.terr,sp=K.sphere,la=K.lattice;K.y=y;
 const e1=hex(PAL.earth,.95*T.A),e2=hex(P.walls[2],.8*T.A),dk=hex(PAL.dark,T.A),st=hex(PAL.steel,.6*T.A),gl=glow(B,P.core,1.5),dr=(te.r1-te.r0)/te.n;
 // earthwork terraces rising to the crater rim, crater wall + floor, light spilling from under the sphere
 let hp=0;for(let i=0;i<te.n;i++){const ro=te.r1-i*dr,h=te.h*(i+1)/te.n;
  cyl(S.building,cx,i?y+hp:se.lo-.15,cz,ro+(i?0:.12*k),ro,i?h-hp:y+h-se.lo+.15,n,i%2?e2:e1);annulus(S.building,cx,y+h,cz,ro-dr,ro,n,tone(i%2?e2:e1,1.12));hp=h;}
 cylIn(S.building,cx,y,cz,te.r0,te.r0,te.h,n,tone(e2,.6));annulus(S.building,cx,y+.02,cz,0,te.r0,n,dk);annulus(S.light,cx,y+.04,cz,sp.r*1.02,sp.r*1.2,mid?12:24,gl);
 if(!mid){const wcol=hex('#9FC2D6',T.day?.4:.62);   // cooling cascades down the terraces (dimmed: read as water, not white stairs)
  for(const a of K.casc){let h0=0;for(let i=0;i<te.n;i++){const ro=te.r1-i*dr,h=te.h*(i+1)/te.n,r2=ro+.012*k;
    annulus(S.light,cx,y+h+.012*k,cz,ro-dr,r2,1,wcol,a-.05,a+.05);
    quadO(S.light,[cx+Math.cos(a-.05)*r2,y+h0,cz+Math.sin(a-.05)*r2],[cx+Math.cos(a+.05)*r2,y+h0,cz+Math.sin(a+.05)*r2],[cx+Math.cos(a+.05)*r2,y+h,cz+Math.sin(a+.05)*r2],[cx+Math.cos(a-.05)*r2,y+h,cz+Math.sin(a-.05)*r2],tone(wcol,.8),[cx,y,cz]);h0=h;}}
  lightPt(B,cx,y+1.2*k,cz,P.core,1.0,10*k);}
 yield 1;
 // the sphere: faceted, lit facet joints
 const nl=mid?5:sp.nl,ns=mid?12:sp.ns,yc=sp.yc||0,la0=-Math.asin(clamp(yc/sp.r,0,.9));
 sphere(S.building,cx,y+yc,cz,sp.r,nl,ns,(i,j,h)=>hex(PAL.sphere,T.A*(.8+.4*hash2(i*5.3+j,j*1.9+h))),la0,PI/2);yield 1;
 geoShell(S.light,cx,y+yc,cz,sp.r*1.004,nl,ns,(mid?.02:.011)*k,glow(B,P.core,.85),la0,PI/2);yield 1;
 // three stacked magnetic coil tori on short pylons
 let pc=null;for(const co of K.coils){torus(S.metal,[cx,y+co.y,cz],AXY[0],AXY[1],co.r,co.tube,mid?16:28,mid?3:5,i=>tone(st,i%2?1:.68));
  torus(S.light,[cx,y+co.y,cz],AXY[0],AXY[1],co.r+co.tube*.9,co.tube*.4,mid?12:28,3,gl);   // E2 patch: lit coil band also in NEAR (coils read as separate bands)
  if(!mid||!pc)for(let j=0;j<co.pyl;j++){const a=j*TAU/co.pyl+co.i*.39,ca=Math.cos(a),sa=Math.sin(a);
   if(!pc)box(S.building,cx+ca*co.r,y,cz+sa*co.r,.2*k,co.y-co.tube*.8,.2*k,-a,dk);
   else strut(S.metal,[cx+ca*pc.r,y+pc.y+pc.tube*.7,cz+sa*pc.r],[cx+ca*co.r,y+co.y-co.tube*.7,cz+sa*co.r],.035*k,dk);}
  pc=co;yield 1;}
 // open geodesic Faraday lattice hemisphere (crown left open) on a footing ring
 geoShell(S.metal,cx,y,cz,la.r,mid?3:la.nl,mid?10:la.ns,(mid?.04:.028)*k,st,0,PI/2*.8);
 if(!mid)torus(S.metal,[cx,y+.06*k,cz],AXY[0],AXY[1],la.r,.06*k,la.ns,3,dk);
 yield 1;
 // radial fin collar on the crater rim
 if(!mid){const F=K.fins;for(let i=0;i<F.n;i++){const a=(i+.5)*TAU/F.n,ca=Math.cos(a),sa=Math.sin(a),r1=F.r1+.4*k;
   fin(S.metal,cx+ca*F.r0,cz+sa*F.r0,cx+ca*r1,cz+sa*r1,y+te.h,y+te.h*.78,F.h,F.h*.3,.035*k,st);}yield 1;}}

// ======================= the divide: trench walls, buttresses, sensor masts, hex block fields =======================
function* divideGen(B,S,mid){const T=B.T,L=B.L,k=T.k,t=L.trench,cc=hex(PAL.concL,.8*T.A),cd=hex(PAL.concrete,.62*T.A),er=hex(PAL.earth,.9*T.A),st=hex(PAL.steel,.65*T.A),dk=hex(PAL.dark,T.A);
 const segL=(mid?3:1.5)*k,yt=(s,z)=>T.yl(s*t.top,z)+t.wallH;
 for(const s of[-1,1]){
  for(let z=t.z0;z<t.z1-.01;z+=segL){const e=Math.min(t.z1,z+segL),zc=(z+e)/2,ya=yt(s,z),ye=yt(s,e);
   quadO(S.building,[s*t.fl,T.yl(s*t.fl,z)-.1,z],[s*t.fl,T.yl(s*t.fl,e)-.1,e],[s*t.top,ye,e],[s*t.top,ya,z],tone(cc,(Math.round(z/segL)&1)?1:.92),[s*t.out*3,ya,zc]);
   quadUp(S.building,[s*t.top,ya,z],[s*t.lip,ya,z],[s*t.lip,ye,e],[s*t.top,ye,e],cd);
   quadO(S.building,[s*t.lip,ya,z],[s*t.lip,ye,e],[s*t.out,T.yl(s*t.out,e)-.03,e],[s*t.out,T.yl(s*t.out,z)-.03,z],er,[0,ya-9,zc]);}
  yield 1;
  for(let z=t.z0+t.butt*.5;z<t.z1;z+=t.butt*(mid?2:1)){const yf=T.yl(s*t.fl,z)-.05;fin(S.building,s*t.fl*.62,z,s*t.top,z,yf,yf,.06*k,yt(s,z)-yf,.24*k,cc);}
  yield 1;}
 let nl=0;for(const m of L.masts){const y=yt(m.s,m.z);
  if(mid)box(S.metal,m.x,y,m.z,.07*k,m.h,.07*k,0,st);
  else{latticeMast(S,m.x,y,m.z,m.h,.16*k,.03*k,3,.016*k,st,3);box(S.metal,m.x,y+m.h,m.z,.14*k,.1*k,.14*k,0,dk);if((nl++)%4===0)lightPt(B,m.x,y+m.h,m.z,PAL.beacon,.3,4*k);}
  box(S.light,m.x,y+m.h+(mid?0:.1*k),m.z,.06*k,.06*k,.06*k,0,glow(B,PAL.beacon,1.7));if(!mid)yield 1;}
 if(mid)return;
 // hex block fields on the moat floor (clear under the severed stubs)
 const H=L.hexF,stp=H.step/Math.max(.6,T.q);let i=0;
 for(let z=H.z0;z<H.z1;z+=stp,i++){if(Math.abs(z-t.zm)<H.gap)continue;
  for(let r=0;r<H.rows;r++){const x=(r-(H.rows-1)/2)*t.fl*.6,zz=z+(r&1)*stp*.5,y=T.yl(x,zz);
   prism(S.building,polyPts(x,zz,H.r,6,0),y-.03,y+(.1+.08*hash2(i,r))*k,cd,tone(cd,1.15));}
  if(i%12===11)yield 1;}}

// ======================= ground: feathered two-tone underlay, trench floor, core pads, streets =======================
function* groundGen(B,S,mid){const T=B.T,L=B.L,R=T.R,k=T.k,hw=T.hw,NR=mid?5:11,NS=mid?36:72,cA=hex(BLOC.A.ground,T.A),cB=hex(BLOC.B.ground,T.A),cS=hex(PAL.strip,T.A*.8);
 const V=(i,j)=>{const a=j*TAU/NS,r=Math.min(T.rb(a)*1.04,R*1.0)*i/NR,x=Math.cos(a)*r,z=Math.sin(a)*r;return[x,T.yl(x,z)-.03,z];};
 const col=x=>{const t=ss(hw*.9,hw*1.9,Math.abs(x)),c=x<0?cA:cB;return[lerp(cS[0],c[0],t),lerp(cS[1],c[1],t),lerp(cS[2],c[2],t)];};
 for(let i=0;i<NR;i++){for(let j=0;j<NS;j++){const p0=V(i,j),p1=V(i+1,j),p2=V(i+1,j+1),p3=V(i,j+1),c=col((p0[0]+p2[0])/2);
   if(i===0)triUp(S.ground,p0,p1,p2,c);else quadUp(S.ground,p0,p1,p2,p3,c);}if(!mid&&i%3===2)yield 1;}
 yield 1;
 const t=L.trench;rectGrid(S.ground,T,0,(t.z0+t.z1)/2,t.fl*2.1,t.z1-t.z0,0,mid?1:2,mid?6:20,hex(PAL.gravel,T.A*.5),.012);
 const A=L.blocs[0],Bq=L.blocs[1];
 disc(S.ground,T,A.core.x,A.core.z,A.core.r*1.1,mid?2:3,mid?14:28,hex(PAL.concrete,.5*T.A),.016);
 disc(S.ground,T,Bq.core.x,Bq.core.z,Bq.core.r*1.08,mid?2:3,mid?14:28,hex(PAL.earth,.8*T.A),.016);
 yield 1;
 const AS=hex(PAL.asph,T.A),PV=hex(BLOC.B.deck,.7*T.A);let n=0;
 for(const st of L.streets){if(mid&&st.pts.length<12)continue;ribbon(S.ground,T,st.pts,st.w,st.s<0?AS:PV,.02,(mid?2.4:1.0)*k);if((++n)%12===0)yield 1;}
 yield 1;}
function trees(B,S,mid){const T=B.T,k=T.k,fc=hex(PAL.foliage,T.A),tk=hex(PAL.trunk,.7*T.A),rnd=mulberry32((T.seed*31+7)>>>0);let n=0;
 for(const t of B.L.trees){for(let i=0;i<t.n&&n<110;i++){const x=t.x+(rnd()-.5)*1.1*k,z=t.z+(rnd()-.5)*1.1*k,s=t.s*(.6+rnd()*.35)*k,y=T.yl(x,z),sh=rnd();
   if(Math.hypot(x,z)>T.bAt(x,z)*.95||Math.abs(x)<T.hw*1.25)continue;n++;
   if(mid){cyl(S.foliage,x,y,z,.26*s,0,.75*s,4,fc);continue;}
   cyl(S.foliage,x,y,z,.035*s,.03*s,.25*s,4,tk);cyl(S.foliage,x,y+.18*s,z,.3*s,0,.8*s,6,tone(fc,.85+.3*sh));}}}

// ======================= animated parts: templates rewritten in anim() (no instancing, no allocation per frame) =======================
function tmpl(fill){const b=buf();fill(b);return{p:new Float32Array(b.p),n:new Float32Array(b.n),c:new Float32Array(b.c)};}
// item: {t:template, at(t,Q), pulse?}. at() fills Q = [x,y,z,yaw,gain,pitch]; pitch (about local x) is applied before yaw (about y);
// gain scales the template vertex colours (written only for items flagged pulse).
function dynMesh(B,name,items,mat){const THREE=B.T.THREE;let nv=0,anyC=false;for(const it of items){nv+=it.t.p.length/3;if(it.pulse)anyC=true;}if(!nv)return null;
 const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),Q=[0,0,0,0,1,0];let o=0;for(const it of items){it.o=o;C.set(it.t.c,o);o+=it.t.p.length;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));
 g.attributes.position.setUsage(THREE.DynamicDrawUsage);g.attributes.normal.setUsage(THREE.DynamicDrawUsage);if(anyC)g.attributes.color.setUsage(THREE.DynamicDrawUsage);
 const m=new THREE.Mesh(g,mat);m.name=name;m.frustumCulled=false;m.receiveShadow=mat!==B.M.light;
 const upd=t=>{for(let k=0;k<items.length;k++){const it=items[k];Q[0]=Q[1]=Q[2]=Q[3]=Q[5]=0;Q[4]=1;it.at(t,Q);
   const x=Q[0],y=Q[1],z=Q[2],c=Math.cos(Q[3]),s=Math.sin(Q[3]),cp=Math.cos(Q[5]),sp=Math.sin(Q[5]),tp=it.t.p,tn=it.t.n,L=tp.length,o2=it.o;
   for(let i=0;i<L;i+=3){const lx=tp[i],ly=tp[i+1]*cp-tp[i+2]*sp,lz=tp[i+1]*sp+tp[i+2]*cp,nx=tn[i],ny=tn[i+1]*cp-tn[i+2]*sp,nz=tn[i+1]*sp+tn[i+2]*cp,j=o2+i;
    P[j]=x+lx*c+lz*s;P[j+1]=y+ly;P[j+2]=z-lx*s+lz*c;N[j]=nx*c+nz*s;N[j+1]=ny;N[j+2]=-nx*s+nz*c;}
   if(it.pulse){const tc=it.t.c,gn=Q[4];for(let i=0;i<L;i++)C[o2+i]=tc[i]*gn;}}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;if(anyC)g.attributes.color.needsUpdate=true;};
 upd(0);g.computeBoundingSphere();B.anims.push(upd);return m;}
function pathFn(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));
 const L=c[c.length-1]||1e-6;return{L,at(d,q){d=clamp(d,0,L);let i=1;while(i<pts.length-1&&c[i]<d)i++;const a=pts[i-1],e=pts[i],k=clamp((d-c[i-1])/((c[i]-c[i-1])||1e-6),0,1);
  q[0]=a[0]+(e[0]-a[0])*k;q[1]=a[1]+(e[1]-a[1])*k;q[2]=a[2]+(e[2]-a[2])*k;q[3]=Math.atan2(-(e[2]-a[2]),e[0]-a[0]);}};}
const pulse6=t=>.8+1.3*Math.exp(-2.2*(((t%6)+6)%6));   // slow pulse every 6 s
function dynCoreA(B){const T=B.T,k=T.k,K=B.L.blocs[0],c=K.core,y=K.y||0,st=hex(PAL.steel,.75*T.A),dk=hex(PAL.dark,T.A),cy=y+K.mono.cy;
 for(const r of K.rings){const tp=tmpl(b=>{torus(b,[0,0,0],AXZ[0],AXZ[1],r.r,r.tube,28,4,i=>tone(st,i%7?1:.6));
   for(const sd of[-1,1]){if(r.ax)box(b,sd*r.r,-.09*k,0,.22*k,.18*k,.18*k,0,dk);else box(b,0,sd*r.r-.09*k,0,.18*k,.18*k,.18*k,0,dk);}});
  B.dynM.push({t:tp,at:(t,Q)=>{Q[0]=c.x;Q[1]=cy;Q[2]=c.z;ringPose(r,t,Q);}});}
 B.dynP.push({t:tmpl(b=>monoSeams(b,B,K,c.x,y,c.z)),pulse:true,at:(t,Q)=>{Q[4]=pulse6(t);}});
 B.movers.push({x:c.x,y:cy,z:c.z,r:c.r,n:3});}
function dynCoreB(B){const T=B.T,K=B.L.blocs[1],c=K.core,y=K.y||0;
 for(const co of K.coils){const tp=tmpl(b=>torus(b,[c.x,y+co.y,c.z],AXY[0],AXY[1],co.r+co.tube*.9,co.tube*.35,24,3,glow(B,K.P.core,1.6)));
  B.dynP.push({t:tp,pulse:true,at:(t,Q)=>{const w=Math.max(0,Math.sin(t*1.1-co.i*1.2));Q[4]=.35+1.4*w*w;}});}   // pulse wave travelling upward
 B.movers.push({x:c.x,y:y+T.k,z:c.z,r:c.r,n:3});}
function dynTraffic(B){const T=B.T,L=B.L,k=T.k,dk=hex(PAL.dark,T.A*1.3),st=hex(PAL.steel,.75*T.A),M=L.maglev;
 // containment drones
 const dm=tmpl(b=>{cyl(b,0,-.02*k,0,.1*k,.1*k,.04*k,6,dk,true);box(b,0,-.05*k,0,.05*k,.03*k,.05*k,0,st);box(b,0,0,0,.32*k,.012*k,.025*k,0,st);box(b,0,0,0,.025*k,.012*k,.32*k,0,st);});
 for(const d of L.drones){const K=L.blocs[d.bloc==='A'?0:1],yb=(K.y||0)+d.y,eye=tmpl(b=>box(b,.09*k,-.015*k,0,.03*k,.03*k,.03*k,0,glow(B,K.P.light,2.0)));
  const at=(t,Q)=>{const a=d.ph+d.w*t;Q[0]=d.x+Math.cos(a)*d.r;Q[1]=yb+.06*k*Math.sin(t*.9+d.ph);Q[2]=d.z+Math.sin(a)*d.r;Q[3]=-a;};
  B.dynM.push({t:dm,at});B.dynL.push({t:eye,at});}
 // mag-lev pods shuttling between the arcology and the trench lip
 if(M&&M.yB!=null){const pm=tmpl(b=>bevBox(b,0,0,0,.5*k,.15*k,.2*k,0,.03*k,hex(BLOC.A.pod,T.A))),pl=tmpl(b=>box(b,0,.06*k,0,.36*k,.04*k,.21*k,0,winCol(B,.8),false));
  const xa=M.x0+.4*k,xb=-T.hw*1.3,Ln=Math.max(.5,xb-xa);
  for(let i=0;i<M.pods;i++){const off=i*2*Ln/M.pods,at=(t,Q)=>{const d=((t*.9*k+off)%(2*Ln)+2*Ln)%(2*Ln);Q[0]=d<Ln?xa+d:xa+2*Ln-d;Q[1]=M.yB+.03*k;Q[2]=M.z;};
   B.dynM.push({t:pm,at});B.dynL.push({t:pl,at});}
  B.movers.push({x:(xa+xb)/2,y:M.yB,z:M.z,r:Ln/2,n:M.pods});}
 // light pulses travelling down the data aqueducts (core -> city)
 for(const q of L.aq){if(!q.p3||q.p3.length<2)continue;const pf=pathFn(q.p3),n=Math.max(2,Math.round(pf.L/(2.4*k)));
  const bd=tmpl(b=>box(b,0,0,0,.24*k,.05*k,q.w*.42,0,glow(B,q.col,2.4)));
  for(let i=0;i<n;i++){const off=(q.ph+i/n)*pf.L;B.dynP.push({t:bd,pulse:true,at:(t,Q)=>{const d=((t*.7*k+off)%pf.L+pf.L)%pf.L,f=d/pf.L;pf.at(d,Q);Q[1]+=.03*k;
    Q[4]=Math.min(1,f*5,(1-f)*5)*(.55+.45*pulse6(t));}});}}}
function dynParts(B){safe('dynA',()=>dynCoreA(B));safe('dynB',()=>dynCoreB(B));safe('dynT',()=>dynTraffic(B));}

// ======================= merge: near (chunked jobs), mid, far =======================
const CHUNK=6000;
function geomRange(T,b,t0,t1,rot){const THREE=T.THREE,g=new THREE.BufferGeometry(),a=t0*9,n=(t1-t0)*9,P=new Float32Array(n),N=new Float32Array(n);
 for(let i=0;i<n;i++){P[i]=b.p[a+i];N[i]=b.n[a+i];}
 if(rot)for(let i=0;i<n;i+=3){let q=T.toLocal(P[i],P[i+2]);P[i]=q[0];P[i+2]=q[1];q=T.toLocal(N[i],N[i+2]);N[i]=q[0];N[i+2]=q[1];}
 let C;if(b.a){C=new Float32Array((t1-t0)*12);for(let v=t0*3,j=0;v<t1*3;v++,j+=4){C[j]=b.c[v*3];C[j+1]=b.c[v*3+1];C[j+2]=b.c[v*3+2];C[j+3]=b.a[v];}}
 else{C=new Float32Array(n);for(let i=0;i<n;i++)C[i]=b.c[a+i];}
 g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,b.a?4:3));
 g.computeBoundingSphere();return g;}
function wrap(T,name){const THREE=T.THREE,g=new THREE.Group(),inner=new THREE.Group();g.name=name;inner.name=name+'_rot';inner.rotation.y=T.rot;g.add(inner);return{g,inner};}
function famJobs(B,W,bufs,prefix,cast,ck){const THREE=B.T.THREE,jobs=[];
 for(const k of['ground','building','metal','light','foliage']){const b=bufs[k],nt=b?nT(b):0;if(!nt)continue;const CK=k==='ground'?Math.min(ck,4500):ck;
  for(let t=0;t<nt;t+=CK){const t0=t,t1=Math.min(nt,t+CK),sfx=nt>CK?'_'+(t0/CK):'';
   jobs.push(()=>{const m=new THREE.Mesh(geomRange(B.T,b,t0,t1,false),B.M[k]);m.name=prefix+k+sfx;m.receiveShadow=k!=='light';
    if(k==='ground')m.renderOrder=1+t0/CK*.001;if(cast&&(k==='building'||k==='metal')){m.castShadow=true;B.casters.push(m);}W.inner.add(m);});}}
 return jobs;}
// far: both centrepiece silhouettes (monolith slab + one ring, sphere + one coil), top skyline masses, trench walls
function farLots(B){const T=B.T,L=B.L,F=B.F,k=T.k,vol=l=>l.w*l.d*lotH(l),sky=l=>l.kind!=='slab'&&l.kind!=='stack'&&l.kind!=='pad'&&l.kind!=='arcology';
 const lots=L.lots.filter(sky).concat(L.lots.filter(l=>!sky(l)&&l.kind!=='arcology').sort((a,b)=>vol(b)-vol(a)).slice(0,40));
 for(const l of lots){const P=BLOC[l.bloc],s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry)),wc=hex(P.walls[l.seed%4],T.A),rc=hex(P.roof,T.A);
  if(l.kind==='domes'){const d=l.domes[0];dome(F.building,l.x,s.lo-.05,l.z,d.r*1.25,d.h*1.25+.3*k,2,6,wc);}
  else if(l.kind==='hangar')barrel(F.building,l.x,s.lo-.05,l.z,l.d,l.w,l.h+.16*k,l.ry+PI/2,3,wc);
  else if(l.kind==='disc'){cyl(F.building,l.x,s.lo-.1,l.z,l.stem*1.3,l.stem*1.3,l.h+.1,4,wc);cyl(F.building,l.x,s.hi+l.h,l.z,l.r,l.r*.6,.16*k,6,wc,rc);}
  else if(l.kind==='slab')box(F.building,l.x,s.lo-.1,l.z,l.w,s.hi-s.lo+.1+lotH(l),1.2*k,l.ry,wc,rc);
  else box(F.building,l.x,s.lo-.1,l.z,l.w,s.hi-s.lo+.2+lotH(l),l.d,l.ry,wc,rc);}
 const K=L.blocs[0],a=K.arc,s=seat(T,rectPts(a.x,a.z,a.w,a.d,0)),th=a.h/a.tiers;
 for(let i=0;i<a.tiers;i++){const f=1-i*.125;box(F.building,a.x,i?s.hi+i*th:s.lo-.15,a.z-K.sg*i*.1*k,a.w*f,i?th:th+s.hi-s.lo+.15,a.d*f,0,hex(K.P.walls[i%4],T.A),hex(K.P.roof,T.A));}}
function farCores(B){const T=B.T,L=B.L,F=B.F,k=T.k,A=L.blocs[0],Q=L.blocs[1],st=hex(PAL.steel,.65*T.A);
 let c=A.core,m=A.mono,y=A.y!=null?A.y:T.yl(c.x,c.z);m.ry=m.ry||0;
 cyl(F.building,c.x,y-.3,c.z,c.pit+1.2*k,c.pit+1.14*k,.3+.58*k,12,hex(PAL.concrete,.62*T.A));
 box(F.building,c.x,y+m.hang,c.z,m.w,m.h,m.d,m.ry,hex(PAL.mono,1),hex(PAL.mono,1.3));
 prism(F.light,chamfPts(c.x,c.z,m.w+.04*k,m.d+.04*k,m.ry,m.bv),y+m.hang+m.h*.5,y+m.hang+m.h*.5+.08*k,hex(A.P.core,1.6*B.gl),false);
 const r=A.rings[0],ax=ringAxes(r);torus(F.metal,[c.x,y+m.cy,c.z],ax[0],ax[1],r.r,r.tube*1.8,12,3,st);
 for(const ms of A.masts){const ym=T.yl(ms.x,ms.z);loft(F.metal,rectPts(ms.x,ms.z,.5*k,.5*k,0),ym-.1,rectPts(ms.x,ms.z,.14*k,.14*k,0),ym+ms.h,st);}
 c=Q.core;y=Q.y!=null?Q.y:T.yl(c.x,c.z);const te=Q.terr,co=Q.coils[1];
 cyl(F.building,c.x,y-.3,c.z,te.r1,te.r0,.3+te.h,12,hex(PAL.earth,.95*T.A),hex(PAL.dark,T.A));
 sphere(F.building,c.x,y+(Q.sphere.yc||0),c.z,Q.sphere.r,3,8,hex(PAL.sphere,T.A),-Math.asin(clamp((Q.sphere.yc||0)/Q.sphere.r,0,.9)),PI/2);
 torus(F.metal,[c.x,y+Q.coils[2].y,c.z],AXY[0],AXY[1],Q.coils[2].r,Q.coils[2].tube*1.4,12,3,st);
 torus(F.metal,[c.x,y+co.y,c.z],AXY[0],AXY[1],co.r,co.tube*1.6,12,3,st);
 annulus(F.light,c.x,y+te.h+.02,c.z,Q.sphere.r*.98,Q.sphere.r*1.12,12,hex(Q.P.core,1.5*B.gl));}
function mergeFar(B){const T=B.T,L=B.L,F=B.F,t=L.trench,cc=hex(PAL.concL,.8*T.A);
 safe('far lots',()=>farLots(B));safe('far cores',()=>farCores(B));
 for(const s of[-1,1])for(let i=0;i<6;i++){const z=lerp(t.z0,t.z1,i/6),e=lerp(t.z0,t.z1,(i+1)/6),xm=s*(t.top+t.lip)/2;
  box(F.building,xm,T.yl(xm,(z+e)/2)-.2,(z+e)/2,t.lip-t.top+.1*T.k,.2+t.wallH,e-z,0,cc);}
 const out=[];let tris=0;for(const k of['building','light','metal']){const b=F[k];if(!nT(b))continue;tris+=nT(b);out.push({geom:geomRange(T,b,0,nT(b),true),family:k});}
 B.far=out;B.farTris=tris;}
function trisOf(o){let n=0,d=0;if(o)o.traverse(m=>{if(m.isMesh){const g=m.geometry,c=g.index?g.index.count:g.attributes.position.count;n+=c/3*(m.isInstancedMesh?m.count:1);d++;}});return[Math.round(n),d];}

// ======================= result, buildSteps, build =======================
function emptyResult(msg){perr(msg);return{near:null,mid:null,far:[],casters:[],movers:[],lights:[],anim(){},uniforms:{uT:{value:0}},anchors:{},keepOut:[],footprints:null,
 stats:{tris:0,ms:0,nearTris:0,midTris:0,farTris:0,nearDraws:0,midDraws:0,lots:0,steps:[]},ending:'enslaved',matsUsed:{},__dbg:{}};}
function finalize(B,steps,ms){const T=B.T,L=B.L,k=T.k,an=B.anims,U={uT:{value:0}},P3=(x,z,y)=>{const q=T.toLocal(x,z);return{x:q[0],y:y==null?T.yl(x,z):y,z:q[1]};};
 const nt=trisOf(B.near),mt=trisOf(B.mid),A=L.blocs[0],Q=L.blocs[1],yA=A.y!=null?A.y:T.yl(A.core.x,A.core.z),yB=Q.y!=null?Q.y:T.yl(Q.core.x,Q.core.z);
 const ko=L.ko.map(o=>{const q=T.toLocal(o.x,o.z);return{x:q[0],z:q[1],r:o.r};});
 for(let z=L.zWall[0];z<=L.zWall[1];z+=T.hw*1.4){const q=T.toLocal(0,z);ko.push({x:q[0],z:q[1],r:T.hw*1.2});}
 const res={near:B.near,mid:B.mid,far:B.far||[],casters:B.casters,
  movers:B.movers.map(m=>{const q=T.toLocal(m.x,m.z);return{x:q[0],y:m.y,z:q[1],r:m.r,n:m.n};}),
  lights:B.lights.slice(0,12).map(l=>{const q=T.toLocal(l.x,l.z);return{x:q[0],y:l.y,z:q[1],color:l.color,intensity:l.intensity*(T.day?.3:1),dist:l.dist};}),
  anim(t){t=+t||0;U.uT.value=t;for(let i=0;i<an.length;i++)an[i](t);},uniforms:U,
  anchors:{square:P3(0,0),seam:P3(0,0),entries:[],divide:{a:P3(0,L.zWall[0]),b:P3(0,L.zWall[1])},
   blocA:P3(A.core.x,A.core.z),blocB:P3(Q.core.x,Q.core.z),coreA:P3(A.core.x,A.core.z,yA+A.mono.cy),coreB:P3(Q.core.x,Q.core.z,yB+1.3*k),
   labels:L.labels.map(l=>Object.assign({text:l.text},P3(l.x,l.z,(l.x<0?yA+7.6*k:yB+3.4*k))))},
  keepOut:ko,
  footprints:{frame:'layout',lots:L.lots.map(l=>[l.x,l.z,l.w,l.d,l.ry,0]),solids:L.solids.slice()},
  stats:{tris:nt[0],ms:Math.round(ms*10)/10,nearTris:nt[0],midTris:mt[0],farTris:B.farTris,nearDraws:nt[1],midDraws:mt[1],lots:L.lots.length,steps},
  ending:'enslaved',matsUsed:B.used,
  __dbg:Object.assign({streets:L.streets.length,trees:L.trees.length,dynItems:B.dynM.length+B.dynL.length+B.dynP.length,counts:Q.counts||null,k:T.k},L.dbg||{})};
 safe('anim(0)',()=>res.anim(0));PE.info.last={stats:res.stats};return res;}
function* buildSteps(site,ctx){const steps=[];let ts=now(),total=0;const SL=site&&+site.sliceMs>0?+site.sliceMs:3.5;
 const mark=n=>{const ms=now()-ts;total+=ms;const o={step:n,ms:Math.round(ms*100)/100};steps.push(o);ts=now();return o;};
 const run=function*(name,gen){let t0=now(),any=false;for(;;){let r;try{r=gen.next();}catch(e){perr(name+': '+(e&&e.message?e.message:e));break;}
  if(r.done)break;any=true;if(now()-t0>=SL){yield mark(name);t0=now();any=false;}}if(any)yield mark(name);};
 const each=function*(arr,fn){for(let i=0;i<arr.length;i++){const a=arr[i];safe('unit',()=>fn(a,i));yield 1;}};
 if(site&&site.ending&&site.ending!=='enslaved')perr('preset "'+site.ending+'" is not enslaved; building enslaved');
 const T=safe('site',()=>mkSite(site,ctx));if(!T||!T.THREE)return emptyResult('THREE not available');
 const LG=layoutGen(T);let L=null;for(;;){let r;try{r=LG.next();}catch(e){return emptyResult('layout: '+(e&&e.message?e.message:e));}if(r.done){L=r.value;break;}yield mark('layout');}
 const MM=safe('materials',()=>makeMats(T));if(!MM)return emptyResult('materials failed');const B=newBuild(T,L,MM),KA=L.blocs[0],KB=L.blocs[1];yield mark('materials');
 // ---- near ----
 yield* run('ground',groundGen(B,B.N,false));
 yield* run('divide',divideGen(B,B.N,false));
 yield* run('coreA',coreA(B,B.N,KA,false));
 yield* run('coreB',coreB(B,B.N,KB,false));
 yield* run('infra',infraGen(B,B.N,false));
 yield* run('buildings',each(L.lots,l=>emitLot(B,l,B.N,false)));
 safe('trees',()=>trees(B,B.N,false));yield mark('trees');
 const W=wrap(T,'pe_near');B.casters=[];const J=famJobs(B,W,B.N,'pe_',true,CHUNK);yield mark('merge:prep');
 for(const j of J){safe('merge near',j);yield mark('merge:near');}
 safe('dyn parts',()=>dynParts(B));yield mark('dyn:parts');
 for(const d of[['pe_dyn_metal',B.dynM,B.M.metal],['pe_dyn_light',B.dynL,B.M.light],['pe_dyn_pulse',B.dynP,B.M.light]]){
  safe('dyn mesh',()=>{const m=dynMesh(B,d[0],d[1],d[2]);if(m)W.inner.add(m);});yield mark('merge:dyn');}
 B.near=W.g;
 // ---- mid: same silhouettes simplified, both centrepieces, no props ----
 yield* run('mid:ground',groundGen(B,B.D,true));
 yield* run('mid:divide',divideGen(B,B.D,true));
 yield* run('mid:coreA',coreA(B,B.D,KA,true));
 yield* run('mid:coreB',coreB(B,B.D,KB,true));
 yield* run('mid:infra',infraGen(B,B.D,true));
 yield* run('mid:buildings',each(L.lots,l=>emitLot(B,l,B.D,true)));
 safe('mid trees',()=>trees(B,B.D,true));
 const WM=wrap(T,'pe_mid');for(const j of famJobs(B,WM,B.D,'pe_mid_',false,1e9)){safe('merge mid',j);yield mark('merge:mid');}B.mid=WM.g;
 // ---- far ----
 safe('far',()=>mergeFar(B));yield mark('merge:far');
 const res=safe('finalize',()=>finalize(B,steps,total));return res||emptyResult('finalize failed');}
function build(site,ctx){const it=buildSteps(site,ctx);let r=it.next();while(!r.done)r=it.next();return r.value;}
const PE={version:2,build,buildSteps,info:{version:2,ending:'enslaved',last:null},blocs:{A:BLOC.A.name,B:BLOC.B.name}};
root.FA.PROENSLAVED=PE;
})();
