// Futures Atlas v4.5 PILOT - a2.js : Checkpoint A2 kit for style=bluefacet (LOOK.a2).
// (1) GPU-baked world-space material families (stone, concrete, metal panel, brushed brass), generated at load;
// (2) instrument-table map frame (section walls with strata engraving, bevelled rim, brass strip, engraved scale ticks,
//     faint coordinate labels, compass), (3) HDR post chain: threshold bloom (5-level down/up), Neutral-type curve,
//     split-tone grade, vignette, dither, (4) Gatekeeper future-tech kit (brass inlays, sensor masts, slow drones),
//     (5) Reversion craft kit (furrowed parcel pads, drystone walls).
// Techniques independently re-implemented from the written spec in review/fable_saltline_*.md; no third-party engine code.
(function(){
'use strict';
const FA=window.FA,L=FA.LOOK;if(!L.a2)return;
const R=FA.R,SC=FA.SC,C=h=>new THREE.Color(h);
const A=FA.A2={};

// ======================= (1) baked material families =======================
const BAKE_VS='varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}';
const BAKE_FS=[
'uniform int fam;uniform int mode;uniform float N;uniform sampler2D tH;varying vec2 vU;',
'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float pn(vec2 p,vec2 P){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h1(mod(i,P)),b=h1(mod(i+vec2(1.,0.),P)),c=h1(mod(i+vec2(0.,1.),P)),d=h1(mod(i+vec2(1.,1.),P));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
'void recipe(vec2 uv,out vec3 col,out float hgt,out float rough,out float metal){vec2 p=uv*4.;',
// stone: coursed blocks 1.0 x 0.5 unit, half-offset rows, joints ~0.03, 3 posterised tones per block (facet rule: flat per cell)
' if(fam==0){float row=floor(p.y/.5);float qx=p.x+mod(row,2.)*.5;vec2 cell=vec2(floor(qx),row);vec2 f=vec2(fract(qx),fract(p.y/.5)*.5);',
'  float dj=min(min(f.x,1.-f.x),min(f.y,.5-f.y));float id=h1(mod(cell,vec2(4.,8.))+3.1);float v=.88+.12*floor(id*3.)/2.;float j=smoothstep(.02,.05,dj);',
'  col=vec3(v)*mix(.45,1.,j)*(.985+.03*pn(p*6.,vec2(24.)));hgt=j*(.85+.15*id);rough=.80+.12*id;metal=0.;}',
// concrete: formwork panels 2.0 x 1.0, seams .02, 3 tones per panel, tie holes on a 0.5 grid, 2-octave mottling
' else if(fam==1){vec2 cell=floor(p/vec2(2.,1.));vec2 f=fract(p/vec2(2.,1.))*vec2(2.,1.);float dj=min(min(f.x,2.-f.x),min(f.y,1.-f.y));',
'  float id=h1(mod(cell,vec2(2.,4.))+7.3);float v=.90+.10*floor(id*3.)/2.;float j=smoothstep(.012,.03,dj);vec2 th=fract(f/.5)-.5;float tie=1.-smoothstep(.022,.034,length(th*.5));',
'  float n=pn(p*3.,vec2(12.))*.6+pn(p*11.,vec2(44.))*.4;col=vec3(v*(.96+.06*n))*mix(.55,1.,j)*(1.-.35*tie);hgt=j*(1.-.6*tie);rough=.70+.18*n;metal=0.;}',
// metal panel: staggered 0.8 x 2.0 panels, groove .015 with height dip, per-panel roughness step, faint vertical brushing
' else if(fam==2){float cx=floor(p.x/.8);float qy=p.y+mod(cx,2.);vec2 cell=vec2(cx,floor(qy/2.));vec2 f=vec2(fract(p.x/.8)*.8,fract(qy/2.)*2.);',
'  float dj=min(min(f.x,.8-f.x),min(f.y,2.-f.y));float id=h1(mod(cell,vec2(5.,2.))+1.7);float j=smoothstep(.015,.04,dj);float br=pn(vec2(p.x*40.,p.y),vec2(160.,4.));',
'  col=vec3(.97+.06*(id-.5))*(.98+.04*br)*mix(.42,1.,j);hgt=j;rough=.36+.14*step(.5,id)+.03*br;metal=1.;}',
// brushed brass (tile 1 unit): grain stretched 1:60 along U, two roughness bands, no patina
' else {float n=pn(vec2(uv.x*4.,uv.y*240.),vec2(4.,240.))*.6+pn(vec2(uv.x*8.,uv.y*480.),vec2(8.,480.))*.4;',
'  col=vec3(.94+.12*(n-.5));hgt=n*.3;rough=.34+.12*step(.5,pn(vec2(uv.x*2.,uv.y*30.),vec2(2.,30.)));metal=1.;}}',
'void main(){if(mode==2){float e=1./N;float hl=texture2D(tH,vU-vec2(e,0.)).a,hr=texture2D(tH,vU+vec2(e,0.)).a,hd=texture2D(tH,vU-vec2(0.,e)).a,hu=texture2D(tH,vU+vec2(0.,e)).a;',
' vec3 n=normalize(vec3(hl-hr,hd-hu,1.));gl_FragColor=vec4(n*.5+.5,1.);return;}',
' vec3 c;float h,r,m;recipe(vU,c,h,r,m);if(mode==0)gl_FragColor=vec4(c,h);else gl_FragColor=vec4(1.,r,m,1.);}'].join('\n');
let TEX=null;A.bakeMs=0;
function bakeAll(){const t0=performance.now();const sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const mat=new THREE.ShaderMaterial({uniforms:{fam:{value:0},mode:{value:0},N:{value:512},tH:{value:null}},vertexShader:BAKE_VS,fragmentShader:BAKE_FS,depthTest:false,depthWrite:false});
 const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;sc.add(q);const prev=R.getRenderTarget();
 const mk=N=>new THREE.WebGLRenderTarget(N,N,{type:THREE.HalfFloatType,depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,anisotropy:4});
 TEX=[];for(let f=0;f<4;f++){const N=f===3?256:512,tile=[8,8,6,1][f];const a=mk(N),o=mk(N),n=mk(N);mat.uniforms.fam.value=f;mat.uniforms.N.value=N;
  mat.uniforms.mode.value=0;R.setRenderTarget(a);R.render(sc,cam);mat.uniforms.mode.value=1;R.setRenderTarget(o);R.render(sc,cam);
  mat.uniforms.mode.value=2;mat.uniforms.tH.value=a.texture;R.setRenderTarget(n);R.render(sc,cam);
  a.texture.repeat.set(1/tile,1/tile);TEX.push({a:a.texture,o:o.texture,n:n.texture,tile});}
 R.setRenderTarget(prev);mat.dispose();q.geometry.dispose();A.bakeMs=Math.round(performance.now()-t0);}
// fam: 0 stone, 1 concrete, 2 metal panel, 3 brushed brass. Geometry needs unit-scaled uvs (uvCyl / uvBox / uvFlat).
A.mat=function(fam,hex,o){o=o||{};if(!TEX)bakeAll();const T=TEX[fam];const ns=o.ns!=null?o.ns:[.5,.4,.35,.15][fam];
 const m=new THREE.MeshStandardMaterial({color:hex,map:T.a,roughnessMap:T.o,roughness:o.rough!=null?o.rough:1,metalness:o.metal||0,metalnessMap:o.metal?T.o:null,
  normalMap:T.n,normalScale:new THREE.Vector2(ns,ns),envMapIntensity:o.env!=null?o.env:1,vertexColors:!!o.vc,flatShading:!!o.flat,side:o.side||THREE.FrontSide});
 if(o.po){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-3;}return m;};
// cylindrical unit uvs: u = angle x rRef (pick rRef so 2*pi*rRef is a multiple of the 4-unit tile), v = y; near-flat faces planar (x,z)
A.uvCyl=function(g,rr){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,nn=g.attributes.normal,n=p.count,uv=new Float32Array(n*2);
 for(let t=0;t<n;t+=3){const ids=[];for(let k=0;k<3;k++){const i=t+k,x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(nn.getY(i))>.8){uv[i*2]=x;uv[i*2+1]=z;}else{uv[i*2]=Math.atan2(x,z)*rr;uv[i*2+1]=y;ids.push(i);}}
  if(ids.length>1){let mn=1e9,mx=-1e9;for(const i of ids){mn=Math.min(mn,uv[i*2]);mx=Math.max(mx,uv[i*2]);}if(mx-mn>Math.PI*rr)for(const i of ids)if(uv[i*2]<0)uv[i*2]+=2*Math.PI*rr;}}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;};
A.uvBox=function(g){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,nn=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(nn.getX(i)),ay=Math.abs(nn.getY(i)),az=Math.abs(nn.getZ(i));let u,v;
  if(ay>=ax&&ay>=az){u=p.getX(i);v=p.getZ(i);}else if(ax>=az){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getY(i);}uv[i*2]=u;uv[i*2+1]=v;}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;};

// ======================= (2) instrument-table map frame =======================
A.frame=function(){const HW=FA.TW/2,HD=FA.TD/2,RW=9,OW=HW+RW,OD=HD+RW,Y0=-0.9,DEP=11,BT=.7;const E=FA.EDGE;
 // section walls: the terrain cut face down to the rim, matte slate with engraved strata every terrace step (1.3)
 const pos=[];const quad=(x0,z0,x1,z1)=>{const h0=Math.max(FA.H(x0,z0),Y0),h1=Math.max(FA.H(x1,z1),Y0);pos.push(x0,h0,z0,x0,Y0,z0,x1,Y0,z1,x0,h0,z0,x1,Y0,z1,x1,h1,z1);};
 const xs=E?E.xs:null,zs=E?E.zs:null;const along=(a,b,n)=>{const o=[];for(let i=0;i<=n;i++)o.push(a+(b-a)*i/n);return o;};
 const XS=xs||along(-HW,HW,140),ZS=zs||along(-HD,HD,105);
 for(let i=0;i<XS.length-1;i++){quad(XS[i],HD,XS[i+1],HD);quad(XS[i],-HD,XS[i+1],-HD);}
 for(let j=0;j<ZS.length-1;j++){quad(-HW,ZS[j],-HW,ZS[j+1]);quad(HW,ZS[j],HW,ZS[j+1]);}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));sg.computeVertexNormals();
 const sm=new THREE.MeshStandardMaterial({color:'#3A394C',roughness:.95,envMapIntensity:.8,side:THREE.DoubleSide});
 sm.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <output_fragment>','#ifdef USE_FOG\n{float hq=vFogWP.y/1.3;float fw=max(fwidth(hq),1e-4);float d=abs(fract(hq+.5)-.5)/fw;float ln=1.-smoothstep(0.,1.2,d);float mj=step(4.5,mod(floor(hq+.5),5.));outgoingLight*=1.-(.16+.14*mj)*ln;'+
  'float top=smoothstep(.0,.5,vFogWP.y-('+Y0.toFixed(2)+'));outgoingLight*=.86+.14*top;}\n#endif\n#include <output_fragment>');};sm.customProgramCacheKey=()=>'section';
 const sec=new THREE.Mesh(sg,sm);sec.receiveShadow=true;SC.add(sec);
 // rim: bevelled ring (outer + inner bevel), engraved scale + labels on the top cap (canvas, sRGB), darker bevel/sides
 const shp=new THREE.Shape();shp.moveTo(-OW,-OD);shp.lineTo(OW,-OD);shp.lineTo(OW,OD);shp.lineTo(-OW,OD);shp.lineTo(-OW,-OD);
 const hole=new THREE.Path();hole.moveTo(-HW,-HD);hole.lineTo(-HW,HD);hole.lineTo(HW,HD);hole.lineTo(HW,-HD);hole.lineTo(-HW,-HD);shp.holes.push(hole);
 const rg=new THREE.ExtrudeGeometry(shp,{depth:DEP,bevelEnabled:true,bevelThickness:BT,bevelSize:BT,bevelSegments:2,curveSegments:1});rg.rotateX(-Math.PI/2);rg.translate(0,Y0-DEP-BT,0);
 const tex=rimTex(HW,HD,OW,OD);tex.repeat.set(1/(2*OW),1/(2*OD));tex.offset.set(.5,.5);
 const topM=new THREE.MeshStandardMaterial({color:'#ffffff',map:tex,roughness:.74,envMapIntensity:.9});
 const sideM=new THREE.MeshStandardMaterial({color:'#262737',roughness:.42,metalness:.0,envMapIntensity:1.1});
 const rim=new THREE.Mesh(rg,[topM,sideM]);rim.receiveShadow=true;SC.add(rim);
 // brass strip at the foot of the section walls (the single accent; < 2 % of pixels)
 const bs=new THREE.Shape();const W2=HW+.42,D2=HD+.42;bs.moveTo(-W2,-D2);bs.lineTo(W2,-D2);bs.lineTo(W2,D2);bs.lineTo(-W2,D2);bs.lineTo(-W2,-D2);
 const bh=new THREE.Path();bh.moveTo(-HW,-HD);bh.lineTo(-HW,HD);bh.lineTo(HW,HD);bh.lineTo(HW,-HD);bh.lineTo(-HW,-HD);bs.holes.push(bh);
 const bg=new THREE.ExtrudeGeometry(bs,{depth:.16,bevelEnabled:false,curveSegments:1});bg.rotateX(-Math.PI/2);bg.translate(0,Y0-.02,0);A.uvBox(bg);
 const brass=A.brass();const strip=new THREE.Mesh(A.uvBox(bg.index?bg.toNonIndexed():bg),brass);SC.add(strip);
 // table surface beyond the frame
 const t=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshStandardMaterial({color:L.table||'#2A2B3C',roughness:1,envMapIntensity:.5}));t.rotation.x=-Math.PI/2;t.position.y=Y0-DEP-2*BT-.05;SC.add(t);
 A.frameInfo={Y0,RW};};
A.brass=function(){if(A._brass)return A._brass;A._brass=A.mat(3,'#C9A45C',{metal:.85,rough:1,env:1.3});return A._brass;};
function rimTex(HW,HD,OW,OD){const CW=4096,CH=2048,sx=CW/(2*OW),sz=CH/(2*OD);const c=document.createElement('canvas');c.width=CW;c.height=CH;const g=c.getContext('2d');
 const X=x=>(x+OW)*sx,Z=z=>(z+OD)*sz;
 g.fillStyle='#2D2F42';g.fillRect(0,0,CW,CH);const r=FA.rng(88);
 for(let i=0;i<9000;i++){g.fillStyle='rgba('+(r()<.5?'255,255,255,':'0,0,10,')+(.012+r()*.018)+')';const x=r()*CW,y=r()*CH;g.fillRect(x,y,2+r()*10,2+r()*4);} // matte grain
 // engraved line: dark groove + light lower lip
 const eng=(x0,z0,x1,z1,w,lt)=>{g.lineCap='butt';g.strokeStyle='rgba(12,12,22,.85)';g.lineWidth=w;g.beginPath();g.moveTo(X(x0),Z(z0));g.lineTo(X(x1),Z(z1));g.stroke();
  g.strokeStyle=lt||'rgba(150,152,176,.42)';g.lineWidth=Math.max(1,w*.5);g.beginPath();g.moveTo(X(x0)+1,Z(z0)+1.5);g.lineTo(X(x1)+1,Z(z1)+1.5);g.stroke();};
 const lab=(txt,x,z,u,col,al)=>{g.save();g.setTransform(sx*u/64,0,0,sz*u/64,X(x),Z(z));g.font='64px "Plex Mono", ui-monospace, monospace';g.textAlign=al||'center';g.textBaseline='middle';
  g.fillStyle='rgba(8,8,16,.7)';g.fillText(txt,2,3);g.fillStyle=col||'rgba(150,152,172,.80)';g.fillText(txt,0,0);g.restore();};
 const fmt=v=>(v<0?'\u2212':v>0?'+':'')+String(Math.abs(v)).padStart(3,'0');
 const BR='rgba(201,164,92,.85)';
 // outer engraved double line + inner frame line
 for(const k of[1.2,1.5]){const a=OW-k,b=OD-k;eng(-a,-b,a,-b,2);eng(a,-b,a,b,2);eng(a,b,-a,b,2);eng(-a,b,-a,-b,2);}
 // ticks: minor 2 u, major 10 u, brass every 50 u; labels every 20 u
 for(let x=-140;x<=140;x+=2){const mj=x%10===0,b50=x%50===0;const len=b50?2.7:mj?1.9:.9;for(const s of[1,-1]){const z0=s*(HD+.6),z1=s*(HD+.6+len);eng(x,z0,x,z1,mj?3:2,b50?BR:null);}
  if(x%20===0){lab(fmt(x),x,HD+4.5,1.75);lab(fmt(x),x,-HD-4.5,1.75);}}
 for(let z=-104;z<=104;z+=2){const mj=z%10===0,b50=z%50===0;const len=b50?2.7:mj?1.9:.9;for(const s of[1,-1]){const x0=s*(HW+.6),x1=s*(HW+.6+len);eng(x0,z,x1,z,mj?3:2,b50?BR:null);}
  if(z%20===0&&Math.abs(z)<100){lab(fmt(-z),HW+5.4,z,1.6);lab(fmt(-z),-HW-5.4,z,1.6);}}
 // cartouche + compass (front corners)
 lab('FUTURES ATLAS \u00B7 SURVEY TABLE \u00B7 GRID 10 U \u00B7 v4.5 PILOT',-HW+2,HD+7.4,1.25,'rgba(150,152,172,.72)','left');
 lab('X \u2192',HW-2,HD+7.4,1.25,'rgba(150,152,172,.72)','right');
 {const cx=OW-4.6,cz=OD-4.6,rr=2.9;g.strokeStyle='rgba(12,12,22,.85)';g.lineWidth=3;g.beginPath();g.ellipse(X(cx),Z(cz),rr*sx,rr*sz,0,0,6.29);g.stroke();
  g.strokeStyle='rgba(150,152,176,.45)';g.lineWidth=1.5;g.beginPath();g.ellipse(X(cx)+1,Z(cz)+1.5,rr*sx,rr*sz,0,0,6.29);g.stroke();
  eng(cx-rr*1.2,cz,cx+rr*1.2,cz,2);eng(cx,cz-rr*1.2,cx,cz+rr*1.2,2);
  g.fillStyle=BR;g.beginPath();g.moveTo(X(cx),Z(cz-rr*1.05));g.lineTo(X(cx+.55),Z(cz));g.lineTo(X(cx-.55),Z(cz));g.closePath();g.fill();lab('N',cx,cz-rr-1.0,1.2,BR);}
 {const cx=-OW+4.6,cz=OD-4.6;for(let k=0;k<5;k++)eng(cx-3+k*1.5,cz-.6,cx-3+k*1.5,cz+.6,2,k%2?null:BR);eng(cx-3,cz,cx+3,cz,2);lab('0',cx-3,cz+1.7,.95);lab('6 U',cx+3,cz+1.7,.95);}
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;}

// ======================= (3) HDR post chain =======================
A.makePost=function(){const P=L.post;if(!P)return null;
 const opt={type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter};
 const rtS=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});const D=[],U=[];
 for(let i=0;i<5;i++)D.push(new THREE.WebGLRenderTarget(4,4,opt));for(let i=0;i<4;i++)U.push(new THREE.WebGLRenderTarget(4,4,opt));
 const VS='varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const mk=(fs,u)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:VS,fragmentShader:fs,depthTest:false,depthWrite:false});
 const mPre=mk('uniform sampler2D tI;uniform vec2 px;uniform float thr,knee;varying vec2 vU;float mx(vec3 c){return max(c.r,max(c.g,c.b));}'+
  'void main(){vec3 m=(texture2D(tI,vU+vec2(-.5,-.5)*px).rgb+texture2D(tI,vU+vec2(.5,-.5)*px).rgb+texture2D(tI,vU+vec2(-.5,.5)*px).rgb+texture2D(tI,vU+vec2(.5,.5)*px).rgb)*.25;'+
  'float br=mx(m);float rq=clamp(br-thr+knee,0.,2.*knee);rq=rq*rq/(4.*knee+1e-4);gl_FragColor=vec4(min(m*max(rq,br-thr)/max(br,1e-4),vec3(16.)),1.);}',
  {tI:{value:null},px:{value:new THREE.Vector2()},thr:{value:P.thr},knee:{value:P.knee}});
 const mDown=mk('uniform sampler2D tI;uniform vec2 px;varying vec2 vU;void main(){vec3 c=texture2D(tI,vU).rgb*4.;c+=texture2D(tI,vU+vec2(-1.,-1.)*px).rgb+texture2D(tI,vU+vec2(1.,-1.)*px).rgb+texture2D(tI,vU+vec2(-1.,1.)*px).rgb+texture2D(tI,vU+vec2(1.,1.)*px).rgb;gl_FragColor=vec4(c/8.,1.);}',
  {tI:{value:null},px:{value:new THREE.Vector2()}});
 const mUp=mk('uniform sampler2D tI,tB;uniform vec2 px;varying vec2 vU;void main(){vec3 c=vec3(0.);for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float w=(i==0?2.:1.)*(j==0?2.:1.);c+=texture2D(tI,vU+vec2(float(i),float(j))*px).rgb*w;}gl_FragColor=vec4(c/16.+texture2D(tB,vU).rgb,1.);}',
  {tI:{value:null},tB:{value:null},px:{value:new THREE.Vector2()}});
 const v3=a=>new THREE.Vector3(a[0],a[1],a[2]);
 const mComp=mk(['uniform sampler2D tS,tB;uniform float exposure,bk,vig,sat,sc;uniform vec3 shC,hiC,lift;varying vec2 vU;',
  'vec3 neutral(vec3 color){const float sC=.76;const float dS=.15;float x=min(color.r,min(color.g,color.b));float off=x<.08?x-6.25*x*x:.04;color-=off*'+(P.toe!=null?P.toe:1).toFixed(3)+';float pk=max(color.r,max(color.g,color.b));if(pk<sC)return color;float d=1.-sC;float np=1.-d*d/(pk+d-sC);color*=np/pk;float g=1.-1./(dS*(pk-np)+1.);return mix(color,vec3(np),g);}',
  'float h12(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
  'void main(){vec3 c=texture2D(tS,vU).rgb+texture2D(tB,vU).rgb*bk;c=neutral(max(c*exposure,0.));',
  ' float l=dot(c,vec3(.2126,.7152,.0722));c*=mix(shC,vec3(1.),smoothstep(0.,.25,l));c*=mix(vec3(1.),hiC,smoothstep(.5,.85,l));c+=lift*(1.-smoothstep(0.,.3,l));',
  ' l=dot(c,vec3(.2126,.7152,.0722));float mg=max(min(c.r,c.b)-c.g,0.);c.r-=mg*.9*'+(P.mg!=null?P.mg:1).toFixed(3)+';c.b+=mg*.1*'+(P.mg!=null?P.mg:1).toFixed(3)+';c=max(mix(vec3(l),c,sat),0.);vec2 q=(vU-.5)*vec2(1.5,1.);c*=1.-vig*smoothstep(.35,1.05,length(q));', // A2: magenta pull (lavender -> violet-blue)
  ' c=mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));c=mix(c,c*c*(3.-2.*c),sc);c+=(h12(gl_FragCoord.xy)-.5)/255.;gl_FragColor=vec4(clamp(c,0.,1.),1.);}'].join('\n'),
  {tS:{value:null},tB:{value:null},exposure:{value:1},bk:{value:P.k},vig:{value:P.vig},sat:{value:P.sat},sc:{value:P.sc},shC:{value:v3(P.sh)},hiC:{value:v3(P.hi)},lift:{value:v3(P.lift)}});
 const ps=new THREE.Scene(),pc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mComp);q.frustumCulled=false;ps.add(q);
 const pass=(m,t)=>{q.material=m;R.setRenderTarget(t);R.render(ps,pc);};
 return {rtS,D,U,mComp,render(){const w=R.domElement.width,h=R.domElement.height;
  if(rtS.width!==w||rtS.height!==h){rtS.setSize(w,h);for(let i=0;i<5;i++){const s=2**(i+1),ww=Math.max(1,(w/s)|0),hh=Math.max(1,(h/s)|0);D[i].setSize(ww,hh);if(i<4)U[i].setSize(ww,hh);}}
  R.setRenderTarget(rtS);R.render(SC,FA.CAM);
  mPre.uniforms.tI.value=rtS.texture;mPre.uniforms.px.value.set(1/w,1/h);pass(mPre,D[0]);
  for(let i=1;i<5;i++){mDown.uniforms.tI.value=D[i-1].texture;mDown.uniforms.px.value.set(1/D[i-1].width,1/D[i-1].height);pass(mDown,D[i]);}
  for(let i=3;i>=0;i--){const lo=i===3?D[4]:U[i+1];mUp.uniforms.tI.value=lo.texture;mUp.uniforms.tB.value=D[i].texture;mUp.uniforms.px.value.set(1/lo.width,1/lo.height);pass(mUp,U[i]);}
  mComp.uniforms.tS.value=rtS.texture;mComp.uniforms.tB.value=U[0].texture;mComp.uniforms.exposure.value=R.toneMappingExposure;pass(mComp,null);}};};

// ======================= (4) Gatekeeper future-tech kit =======================
// brass inlays (paving rings, plinth lip, spire foot), sensor masts on three gate towers with slow machine indicators,
// three slow drones (diamond = AI in the glyph grammar): two orbits + one shuttle along the south avenue. All cheap.
A.gkKit=function(o){const {cx,cz,top,towers,sy}=o;const br=A.brass();const ST=[];
 const flat=(g,y)=>{g.rotateX(-Math.PI/2);const m=new THREE.Mesh(A.uvBox(g),A._inlay||(A._inlay=(()=>{const m=A.mat(3,'#C9A45C',{metal:.85,env:1.3,po:true});return m;})()));m.position.set(cx,y,cz);m.receiveShadow=true;return m;};
 ST.push(flat(new THREE.RingGeometry(3.21,3.29,128),top+.03),flat(new THREE.RingGeometry(6.40,6.46,160),top+.03));
 for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;const g=new THREE.PlaneGeometry(.05,2.6);g.rotateZ(-a);const m=flat(g,top+.031);m.position.x+=Math.cos(a)*4.85;m.position.z+=Math.sin(a)*4.85;
  m.geometry.dispose();const g2=new THREE.PlaneGeometry(.05,2.6);g2.rotateX(-Math.PI/2);g2.rotateY(-a+Math.PI/2);m.geometry=A.uvBox(g2);ST.push(m);} // diagonal brass survey lines between the avenues
 const lip=new THREE.Mesh(A.uvCyl(new THREE.CylinderGeometry(10.29,10.29,.07,120,1,true),1.273),br);lip.position.set(cx,top-.04,cz);ST.push(lip);
 const sf=new THREE.Mesh(A.uvCyl(new THREE.TorusGeometry(1.33,.035,6,72).rotateX(Math.PI/2),1.273),br);sf.position.set(cx,sy+.04,cz);ST.push(sf);
 // sensor masts (dark alloy panel), cross arms, a small dish; indicator = slow cool blink (machine light only)
 const alloy=A.mat(2,'#3A3F4C',{metal:.7,env:1.2,flat:true});const pick=[0,3,6].map(i=>towers[i]).filter(Boolean);
 pick.forEach((t,i)=>{const y0=t.y,hM=1.5+i*.35;const ms=new THREE.Mesh(A.uvCyl(new THREE.CylinderGeometry(.03,.045,hM,6),.6366),alloy);ms.position.set(t.x,y0+hM/2,t.z);ms.castShadow=true;ST.push(ms);
  for(const f of[.55,.8]){const b=new THREE.Mesh(A.uvBox(new THREE.BoxGeometry(.46*(1.2-f),.025,.025)),alloy);b.position.set(t.x,y0+hM*f,t.z);b.rotation.y=t.a;ST.push(b);}
  if(i===1){const d=new THREE.Mesh(A.uvCyl(new THREE.SphereGeometry(.2,12,6,0,6.283,0,1.1),.6366),alloy);d.position.set(t.x+Math.sin(t.a)*.12,y0+hM*.68,t.z+Math.cos(t.a)*.12);d.rotation.x=-1.1;d.rotation.y=t.a;ST.push(d);}
  const g=FA.glow(t.x,y0+hM+.05,t.z,.42,FA.LOOK.ai,.30);const ph=i*1.9;FA.anims.push(T=>{g.material.opacity=.35+.65*Math.pow(.5+.5*Math.sin(T*1.3+ph),3);});});
 ST.forEach(m=>FA.addStatic(m));
 // drones: flattened elongated diamonds + a tiny warm nav light each (HDR, blooms faintly); 2 instanced draws
 const bodyG=new THREE.OctahedronGeometry(.3,0);bodyG.scale(.75,.28,1.35);const body=new THREE.InstancedMesh(bodyG,alloy,3);body.castShadow=false;body.frustumCulled=false;
 const lg=new THREE.BoxGeometry(.07,.05,.07);const lm=new THREE.MeshBasicMaterial({color:C('#FFC890').multiplyScalar(2.6)});const lit=new THREE.InstancedMesh(lg,lm,3);lit.frustumCulled=false;SC.add(body,lit);
 const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1.8,1.8,1.8),P=new THREE.Vector3(),P2=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0),E=new THREE.Euler();
 const path=(i,T)=>{if(i===0){const a=T*.07+.6;P.set(cx+Math.cos(a)*6.4,top+7.2+.25*Math.sin(T*.5),cz+Math.sin(a)*6.4);}
  else if(i===1){const a=-T*.09+2.4;P.set(cx+Math.cos(a)*4.6,top+9.6+.2*Math.sin(T*.6+1),cz+Math.sin(a)*4.6);}
  else{const u=(T/46)%1,s=u<.5?u*2:2-u*2,e=s*s*(3-2*s);P.set(cx+.4,top+4.6+1.6*Math.sin(e*3.1416),cz+8.5+e*30);}return P;};
 FA.anims.push(T=>{for(let i=0;i<3;i++){path(i,T);const p=P.clone();path(i,T+.25);P2.copy(P);P.copy(p);const dx=P2.x-P.x,dz=P2.z-P.z;E.set(0,Math.atan2(dx,dz),0);Q.setFromEuler(E);
  M.compose(P,Q,S);body.setMatrixAt(i,M);P.y-=.06;M.compose(P,Q,S);lit.setMatrixAt(i,M);}body.instanceMatrix.needsUpdate=true;lit.instanceMatrix.needsUpdate=true;});
 return ST.length;};

// ======================= (5) Reversion craft kit =======================
// parcel pads with furrows (real flat pads with parcel-local uvs; no raised trays), drystone walls (instanced stones)
function fieldAtlas(){const N=1024,Hh=512,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const r=FA.rng(61);
 const T=[{b:'#9A8246',ri:'#B39A54',tr:'#6E5B36',fl:'#C8B070',fur:1},{b:'#5F6C39',ri:'#738244',tr:'#5A4B37',fl:null,fur:1},{b:'#6B5A48',ri:'#7E6C54',tr:'#52463B',fl:'#9A8558',fur:1},{b:'#64774A',ri:'#6E8250',tr:'#56683F',fl:null,fur:0}];
 T.forEach((t,k)=>{const ox=(k%2)*Hh,oy=(k>>1)*Hh;g.save();g.beginPath();g.rect(ox,oy,Hh,Hh);g.clip();g.fillStyle=t.b;g.fillRect(ox,oy,Hh,Hh);
  if(t.fur){const per=Hh/(3.1/.4);for(let y=oy-per;y<oy+Hh+per;y+=per){const gr=g.createLinearGradient(0,y,0,y+per);gr.addColorStop(0,t.tr);gr.addColorStop(.35,t.ri);gr.addColorStop(.6,t.ri);gr.addColorStop(1,t.tr);g.fillStyle=gr;g.fillRect(ox,y,Hh,per);}}
  else for(let i=0;i<260;i++){g.fillStyle=r()<.5?'rgba(40,60,30,.10)':'rgba(170,180,120,.08)';g.beginPath();g.ellipse(ox+r()*Hh,oy+r()*Hh,6+r()*18,4+r()*12,r()*3,0,6.29);g.fill();}
  for(let i=0;i<900;i++){g.fillStyle=r()<.5?'rgba(255,245,220,'+(.03+r()*.05)+')':'rgba(20,14,8,'+(.04+r()*.06)+')';g.fillRect(ox+r()*Hh,oy+r()*Hh,2+r()*5,1.5+r()*3);} // clods
  if(t.fl)for(let i=0;i<220;i++){g.strokeStyle=t.fl;g.globalAlpha=.55;g.lineWidth=1.2;const x=ox+r()*Hh,y=oy+r()*Hh,a=r()*3.14;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*5,y+Math.sin(a)*5);g.stroke();g.globalAlpha=1;}
  g.strokeStyle='rgba(30,26,18,.35)';g.lineWidth=10;g.strokeRect(ox+5,oy+5,Hh-10,Hh-10);g.strokeStyle='rgba(120,136,84,.55)';g.lineWidth=5;g.strokeRect(ox+2.5,oy+2.5,Hh-5,Hh-5);g.restore();});
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
A.rvCraft=function(walls){const TY={wheat:0,olive:1,fallow:2,pasture:3};const pos=[],uv=[],idx=[];const NA=10,NB=8;
 for(const f of FA.fields){const t=TY[f.ty]||0,base=pos.length/3;for(let j=0;j<=NB;j++)for(let i=0;i<=NA;i++){const a=-2.05+4.1*i/NA,b=-1.55+3.1*j/NB;const x=f.x+f.ux*a+f.wx*b,z=f.z+f.uz*a+f.wz*b;
   pos.push(x,FA.H(x,z)+.05,z);const uu=.004+.992*i/NA,vv=.004+.992*j/NB;uv.push((t%2)*.5+uu*.5,1-((t>>1)*.5+vv*.5));}
  for(let j=0;j<NB;j++)for(let i=0;i<NA;i++){const k=base+j*(NA+1)+i;idx.push(k,k+NA+1,k+1,k+1,k+NA+1,k+NA+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const nrm=g.attributes.normal;for(let i=0;i<nrm.count;i++)if(nrm.getY(i)<0)nrm.setXYZ(i,-nrm.getX(i),-nrm.getY(i),-nrm.getZ(i));
 const pm=new THREE.MeshStandardMaterial({map:fieldAtlas(),roughness:.95,envMapIntensity:.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 const pad=new THREE.Mesh(g,pm);pad.receiveShadow=true;pad.renderOrder=1;SC.add(pad);
 // drystone walls: two courses + cap, stones 0.26 apart, jittered size/yaw/value
 const S=[];const r=FA.rng(71);for(const w of walls){const f=w.f;for(let a=-2.0;a<=2.01;a+=.26)for(let c=0;c<3;c++){if(c===2&&r()<.35)continue;const b=w.sgn*(1.74+(r()-.5)*.04);const x=f.x+f.ux*a+f.wx*b,z=f.z+f.uz*a+f.wz*b;S.push([x,z,c,Math.atan2(-f.uz,f.ux)]);}}
 if(S.length){const sg=new THREE.IcosahedronGeometry(1,0);const im=new THREE.InstancedMesh(sg,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,flatShading:true,envMapIntensity:.9}),S.length);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),Sc=new THREE.Vector3(),P=new THREE.Vector3(),cc=new THREE.Color();
  S.forEach((s,i)=>{const y=FA.H(s[0],s[1])+.07+s[2]*.13;E.set((r()-.5)*.3,s[3]+(r()-.5)*.5,(r()-.5)*.3);Q.setFromEuler(E);const k=s[2]===2?.8:1;Sc.set((.14+r()*.05)*k,(.075+r()*.03)*k,(.11+r()*.04)*k);P.set(s[0],y,s[1]);M.compose(P,Q,Sc);im.setMatrixAt(i,M);
   const v=.82+r()*.3;im.setColorAt(i,cc.set(r()<.5?'#9A9384':'#8C8676').multiplyScalar(v));});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;SC.add(im);}
 return {pads:FA.fields.length,stones:S.length};};
})();
