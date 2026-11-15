// Futures Atlas v4.5 PILOT - world.js : renderer, look, sky + environment, height/distance fog, sculpted terrain,
// water, kit loader + instancing with baked vertex AO, data-layer road stubs, camera, markers, HUD, loop.
// three.js r149 core + GLTFLoader (r147 examples/js build, last non-module release). All assets CC0 (see ../ASSETS.md).
(function(){
'use strict';
window.__errs=window.__errs||[];
addEventListener('error',e=>window.__errs.push(String(e.message||e)));
addEventListener('unhandledrejection',e=>window.__errs.push('rej:'+String(e.reason&&e.reason.message||e.reason)));
const FA=window.FA={};
const Q=new URLSearchParams(location.search);
FA.Q=Q;
FA.CITY=(['gatekeeper','reversion'].includes((Q.get('city')||'').toLowerCase()))?Q.get('city').toLowerCase():'gatekeeper';
FA.VIEW=Q.get('view')==='close'?'close':'world';
FA.TFIX=Q.has('t')?parseFloat(Q.get('t')):null;

// ---------------- LOOK (one config object; contributors can add looks here) ----------------
// Blue hour with a low warm key light (Fable 3D-quality review sec.5). Lighting is descriptive atmosphere only (Q17).
const LOOK=FA.LOOK={
 sky:{zen:'#0B1230',mid:'#25305E',hor:'#7A6496',glow:'#FFAE74',low:'#1A1C3A'},
 fog:{c:'#4A4878',near:150,far:700,hk:.20,ha:.14},
 hemi:['#8E9BDD','#2A2238',.30], sun:['#FFA866',2.0], fill:['#7C9AF0',.30],
 exposure:.92, env:.45,
 human:'#FFB866', ai:'#BFEFFF', road:'#8098B2', brass:'#C9A45C',
 // style-exploration fields (defaults = the pilot look)
 tone:'aces', sunEl:null, ter:{P:{lo:'#3B5640',mid:'#55683F',hi:'#4F5878',rock:'#55506A',bank:'#6E6248',bed:'#262C3A',snow:'#767A98'},oct:5,nrm:.28,flat:false,terr:0,hard:.85,cell:1.4,vary:.12,contour:0,line:'#44525C'},
 props:{sat:1,white:null}, gk:{}, water:{c:'#1C2E3C',r:.2}, skirt:'#15172A', tuft:'#7C8A5E', clump:false, ts:0, aoK:1, glowK:1
};
// ---------------- STYLE EXPLORATION (?style=<key>) - quick parameter-level approximations of Fable 5.2 directions ----------------
// (review/fable_style45_20261115_1532.md). Not final looks: no geometry rework, no SSAO/bloom; tilt-shift is a cheap single pass.
const STYLES=FA.STYLES={
 pilot:{name:'Pilot (blue hour)',pitch:'Current v4.5 pilot look: blue-hour sky, low warm key, ACES.'},
 maquette:{name:'Maquette',pitch:"Architect's white model on a pale table; form and light do the work, colour only in light and the brass data layer.",
  sky:{zen:'#B9CAD8',mid:'#DCE5EC',hor:'#F2EEE7',glow:'#FFF1DC',low:'#E6E1D8'},fog:{c:'#ECE8E1',near:240,far:900,hk:.20,ha:.05},
  hemi:['#F4F7FA','#B8B0A4',.50],sun:['#FFF4E6',.82],fill:['#DDE6F0',.12],sunEl:50,tone:'linear',exposure:1.0,env:.15,
  ter:{P:{lo:'#E0DAD0',mid:'#D8D1C5',hi:'#CEC7BB',rock:'#BDB6AB',bank:'#D2CABC',bed:'#A9BEC8',snow:'#ECE8E1'},oct:2,nrm:0,vary:.03},
  props:{sat:0,white:'#F2EEE6'},gk:{stone:'#DCD6CB',stone2:'#E6E1D8',wall:'#E4DFD5',tower:'#D6D0C5',spire:'#F2EFE8',pod:'#DCD6CC',metal:'#BDB8B0',lid:'#D0CBC2'},
  water:{c:'#A9BEC8',r:.7},skirt:'#BDB6AB',tuft:'#D9D3C8',clump:true,ts:.55,aoK:1.25,glowK:.7},
 clay:{name:'Clay diorama',pitch:'A hand-made matte clay model shot with a macro lens: soft edges, soft occlusion, strong miniature blur.',
  sky:{zen:'#8FB2CC',mid:'#CFE0EA',hor:'#EEF0EA',glow:'#FFE8CC',low:'#D9DED8'},fog:{c:'#E2E8E6',near:200,far:820,hk:.20,ha:.10},
  hemi:['#DCE8F2','#BFB7A8',1.0],sun:['#FFEFD9',2.0],fill:['#C8D8EC',.15],sunEl:40,tone:'aces',exposure:1.1,env:.3,
  ter:{P:{lo:'#A9B48E',mid:'#B9C2A0',hi:'#D8CBAA',rock:'#A79C90',bank:'#D8CBAA',bed:'#7FA9B8',snow:'#C4B898'},oct:2,nrm:.06,vary:.03},
  props:{sat:.62},gk:{stone:'#B8AEA1',stone2:'#C9C0B2',wall:'#C4BAAD',tower:'#B2A89B',spire:'#E2DBD0',pod:'#CFC6B9',metal:'#9C948A',lid:'#B9B1A6'},
  water:{c:'#7FA9B8',r:.15},skirt:'#A79C90',tuft:'#B4BC92',clump:true,ts:1.0,aoK:1.3},
 facet:{name:'Faceted low-poly',pitch:'Bad North / Islanders discipline: terraced flat-shaded terrain in the same language as the kit props, muted daylight palette.',
  sky:{zen:'#7FAED6',mid:'#BFD9EC',hor:'#EAF2F4',glow:'#FFF2DC',low:'#DDE9EE'},fog:{c:'#DDE9EE',near:240,far:860,hk:.20,ha:.07},
  hemi:['#CFE3F2','#9C9A84',.50],sun:['#FFF1DC',.98],fill:['#CFE0F0',.10],sunEl:45,tone:'linear',exposure:1.0,env:.12,
  ter:{P:{lo:'#9DB67E',mid:'#B9C78E',hi:'#E2D9B8',rock:'#9AA0A8',bank:'#E2D9B8',bed:'#5E9DB5',snow:'#C4C194'},oct:3,nrm:0,flat:true,terr:1.5,hard:.85,cell:2.4,vary:.05},
  props:{sat:.75},gk:{stone:'#A8A296',stone2:'#B6B0A4',wall:'#B0AAA0',tower:'#9C968C',spire:'#D6D2CA',pod:'#C2BCB2',metal:'#9A968F',lid:'#B8B3AB'},
  water:{c:'#5E9DB5',r:.5},skirt:'#8E8A80',tuft:'#A8BA80',clump:true,ts:.5,aoK:1.1},
 dusk:{name:'Golden hour',pitch:'The current pilot, polished: low warm sun, long shadows, layered haze, exposed bright.',
  sky:{zen:'#5A82B6',mid:'#8FB4D9',hor:'#F6D9B8',glow:'#FFC58A',low:'#C9B8A8'},fog:{c:'#E6CFBA',near:170,far:720,hk:.20,ha:.16},
  hemi:['#A9C6E8','#6E6A78',.8],sun:['#FFC58A',3.0],fill:['#9FB8E0',.2],sunEl:14,tone:'aces',exposure:1.25,env:.45,
  ter:{P:{lo:'#8A9868',mid:'#9DAA7A',hi:'#C8B98A',rock:'#8A8494',bank:'#B5A57E',bed:'#4F7FA6',snow:'#A89C78'},oct:3,nrm:.10,vary:.06},
  props:{sat:.95},gk:{stone:'#75707A',stone2:'#837E87',wall:'#7A7681',tower:'#6E6A75',spire:'#C9C6C2',pod:'#8F8A91'},
  water:{c:'#4F7FA6',r:.2},skirt:'#3A3542',tuft:'#A0A472',clump:true,ts:.5},
 contour:{name:'Survey table',pitch:'A matte topographic table: terrain as stacked laser-cut layers with engraved contour lines, cities as pale miniatures.',
  sky:{zen:'#BCCCD8',mid:'#E3EAEF',hor:'#F1F4F6',glow:'#FFFFFF',low:'#E2E9EE'},fog:{c:'#E2E9EE',near:300,far:1000,hk:.20,ha:.03},
  hemi:['#F2F6F9','#B4BEC6',.52],sun:['#FFFFFF',.74],fill:['#E0E8F0',.10],sunEl:60,tone:'linear',exposure:1.0,env:.1,
  ter:{P:{lo:'#D2DBE0',mid:'#C9D4DA',hi:'#B9C8D2',rock:'#A3B4C0',bank:'#C7D3DA',bed:'#6F94A8',snow:'#E4EBEF'},oct:3,nrm:0,flat:true,terr:1.1,hard:.97,cell:1.4,vary:.0,contour:1.1,line:'#44525C'},
  props:{sat:.4},gk:{stone:'#D3DAE0',stone2:'#DFE5EA',wall:'#D9E0E5',tower:'#C9D1D8',spire:'#F3F5F6',pod:'#D6DDE2',metal:'#A8B2BA',lid:'#C4CCD3'},
  water:{c:'#6F94A8',r:.9},skirt:'#9FB2BF',tuft:'#C5D0C8',clump:true,ts:0,aoK:.9,glowK:.6}
};
FA.STYLE=STYLES[(Q.get('style')||'').toLowerCase()]?(Q.get('style')||'').toLowerCase():'pilot';
(function merge(dst,src){for(const k in src){const v=src[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k]))merge(dst[k],v);else dst[k]=v;}})(LOOK,STYLES[FA.STYLE]);
const C=h=>new THREE.Color(h);

// ---------------- helpers ----------------
FA.smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
FA.lerp=(a,b,t)=>a+(b-a)*t;
const smooth=FA.smooth,lerp=FA.lerp;
function hash(x,y){const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){o=o||5;let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=.5;}return s/(1-Math.pow(.5,o));}
FA.fbm=fbm;
FA.rng=function(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};

// ---------------- renderer ----------------
const R=FA.R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R.setSize(innerWidth,innerHeight);
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=LOOK.tone==='linear'?THREE.LinearToneMapping:THREE.ACESFilmicToneMapping;R.toneMappingExposure=LOOK.exposure;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(R.domElement);

// height + distance fog: patch the shared fog chunks once (world position varying; valleys get extra haze)
THREE.ShaderChunk.fog_pars_vertex='#ifdef USE_FOG\n varying float vFogDepth;\n varying vec3 vFogWP;\n#endif';
THREE.ShaderChunk.fog_vertex='#ifdef USE_FOG\n vFogDepth = - mvPosition.z;\n vec4 fogWP = vec4( transformed, 1.0 );\n #ifdef USE_INSTANCING\n  fogWP = instanceMatrix * fogWP;\n #endif\n vFogWP = ( modelMatrix * fogWP ).xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor;\n varying float vFogDepth;\n varying vec3 vFogWP;\n uniform float fogNear;\n uniform float fogFar;\n#endif';
THREE.ShaderChunk.fog_fragment='#ifdef USE_FOG\n float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n float fogH = exp( - max( vFogWP.y - 0.5, 0.0 ) * '+LOOK.fog.hk.toFixed(3)+' );\n fogFactor = clamp( fogFactor + fogH * '+LOOK.fog.ha.toFixed(3)+' * smoothstep( 20.0, 260.0, vFogDepth ), 0.0, 1.0 );\n gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif';

const SC=FA.SC=new THREE.Scene();
SC.fog=new THREE.Fog(C(LOOK.fog.c),LOOK.fog.near,LOOK.fog.far);
const CAM=FA.CAM=new THREE.PerspectiveCamera(28,innerWidth/innerHeight,.5,1600);

// ---------------- lights ----------------
const hemi=new THREE.HemisphereLight(LOOK.hemi[0],LOOK.hemi[1],LOOK.hemi[2]);SC.add(hemi);
const SUNDIR=FA.SUNDIR=new THREE.Vector3(-1,.36,-.42).normalize(); // low warm key from the west, slightly behind (long shadows toward the viewer)
if(LOOK.sunEl!=null){const el=LOOK.sunEl*Math.PI/180,az=new THREE.Vector2(-1,-.42).normalize();SUNDIR.set(az.x*Math.cos(el),Math.sin(el),az.y*Math.cos(el));} // style: same azimuth, new elevation
const sun=FA.sun=new THREE.DirectionalLight(LOOK.sun[0],LOOK.sun[1]);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;SC.add(sun,sun.target);
const fill=new THREE.DirectionalLight(LOOK.fill[0],LOOK.fill[1]);fill.position.set(80,50,90);SC.add(fill); // cool rim/fill, no shadow
FA.fitShadow=function(cx,cz,half){sun.target.position.set(cx,0,cz);sun.position.set(cx+SUNDIR.x*220,SUNDIR.y*220,cz+SUNDIR.z*220);
 const s=sun.shadow.camera;s.left=-half;s.right=half;s.top=half;s.bottom=-half;s.near=20;s.far=480;s.updateProjectionMatrix();sun.target.updateMatrixWorld();};

// ---------------- sky + PMREM environment ----------------
function skyMat(){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{cZ:{value:C(LOOK.sky.zen)},cM:{value:C(LOOK.sky.mid)},cH:{value:C(LOOK.sky.hor)},cG:{value:C(LOOK.sky.glow)},cL:{value:C(LOOK.sky.low)},sunD:{value:SUNDIR}},
 vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 cZ,cM,cH,cG,cL,sunD;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;'+
 'vec3 c=y>0.?mix(cH,cM,smoothstep(0.,.20,y)):mix(cH,cL,smoothstep(0.,-.10,y));c=mix(c,cZ,smoothstep(.20,.80,y));'+
 'float s=max(dot(d,normalize(sunD)),0.);float hb=exp(-abs(y-.02)*8.);c+=cG*(pow(s,5.)*.42*hb+pow(s,60.)*.35+hb*.07);'+
 'gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});}
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,48,24),skyMat());sky.renderOrder=-10;sky.frustumCulled=false;SC.add(sky);FA.sky=sky;
{const ss=new THREE.Scene();ss.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),skyMat()));
 const pm=new THREE.PMREMGenerator(R);SC.environment=pm.fromScene(ss,.02).texture;pm.dispose();}

// ---------------- procedural textures ----------------
FA.noiseNormal=function(N,amp,seed){const o=(seed||7)*17.3;
 // tileable lattice value noise (period-wrapped octaves; no directional stripes)
 const tn=(x,y,p)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const w=(a)=>((a%p)+p)%p;
  const a=hash(w(xi)+o,w(yi)),b=hash(w(xi+1)+o,w(yi)),c=hash(w(xi)+o,w(yi+1)),d=hash(w(xi+1)+o,w(yi+1));return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
 const h=new Float32Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=0,am=1;for(const p of[8,16,32,64]){s+=tn(i/N*p,j/N*p,p)*am;am*=.55;}h[j*N+i]=s*2.2;}
 const d=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const dx=(h[j*N+(i+1)%N]-h[j*N+(i+N-1)%N])*amp,dy=(h[((j+1)%N)*N+i]-h[((j+N-1)%N)*N+i])*amp;
  const l=Math.hypot(dx,dy,1),o=(j*N+i)*4;d[o]=(-dx/l*.5+.5)*255;d[o+1]=(-dy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
 const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
FA.glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(.6,'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
 const t=new THREE.CanvasTexture(c);return t;})();
FA.puffTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');for(let k=0;k<7;k++){const x=20+Math.random()*24,y=20+Math.random()*24,r=12+Math.random()*10;
 const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}return new THREE.CanvasTexture(c);})();
// soft glow sprite = the only "bloom" in the pilot (controlled, additive, capped below clipping)
FA.glow=function(x,y,z,size,hex,k){const m=new THREE.SpriteMaterial({map:FA.glowTex,color:C(hex).multiplyScalar((k==null?.6:k)*LOOK.glowK),blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,transparent:true});
 const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(size,size,1);SC.add(s);return s;};

// ---------------- layout + sculpted heightfield ----------------
const GK=FA.GK={x:-30,z:6,top:3.9};const RV=FA.RV={x:30,z:-6};const WL=FA.WL=0.45;
const TW=280,TD=210;FA.TW=TW;FA.TD=TD;
FA.riverX=z=>RV.x+7.0+4.2*Math.sin((z-RV.z)*.045)+1.6*Math.sin(z*.11);
const OC=LOOK.ter.oct;
function Hraw(x,z){let h=2.4+(fbm(x*.016+3.1,z*.016-1.7,Math.min(5,OC))-.5)*7;
 const r=fbm(x*.028+11,z*.028+5,Math.min(4,OC));h+=Math.pow(Math.max(0,r-.5),1.5)*30;
 h+=smooth(-30,-95,z)*(9+fbm(x*.035,z*.035,Math.min(5,OC))*20);               // back range (silhouette against the horizon glow)
 h+=smooth(90,135,Math.abs(x))*16*fbm(x*.05,z*.05+9,Math.min(4,OC));          // side rims
 const s=LOOK.ter.terr;if(s>0){const q=h/s;h=(Math.floor(q)+smooth(LOOK.ter.hard,1,q-Math.floor(q)))*s;} // style terraces
 return h;}
FA.H=function(x,z){let h=Hraw(x,z);
 let d=Math.hypot(x-GK.x,z-GK.z);h=lerp(h,2.6,smooth(17,11.5,d));                       // Gatekeeper plinth bed
 d=Math.hypot(x-RV.x,z-RV.z);h=lerp(h,1.0+(fbm(x*.09,z*.09,3)-.5)*.7,smooth(24,10,d));    // Reversion valley floor (low banks so the wheel reaches the stream)
 const wm=Math.hypot(x-(RV.x-12),z-(RV.z-8));h+=1.6*smooth(5,1.5,wm)*smooth(24,10,d);      // windmill knoll
 const dx=Math.abs(x-FA.riverX(z)),rw=1.5+.35*Math.sin(z*.07);
 h=Math.max(h,WL+.55);h=lerp(h,WL-.8,smooth(rw+2.4,rw*.5,dx)*smooth(-75,-30,z));          // river channel (springs at the foot of the back range)
 return h;};
FA.slope=(x,z)=>{const e=.6;const a=FA.H(x+e,z)-FA.H(x-e,z),b=FA.H(x,z+e)-FA.H(x,z-e);return Math.hypot(a,b)/(2*e);};

// ---------------- kit loader + instancing with baked vertex AO ----------------
FA.MODELS={};FA.PL={};FA.AOS=[];
const matCache={};
function kitMat(m){if(matCache[m.uuid])return matCache[m.uuid];const W=LOOK.props.white;const n=new THREE.MeshStandardMaterial({map:W?null:m.map,color:W?C(W):(m.color||C('#fff')),roughness:.82,metalness:0,vertexColors:true,envMapIntensity:LOOK.env});
 if(!W&&LOOK.props.sat!==1){const sat=LOOK.props.sat;n.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n{float l=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(l),diffuseColor.rgb,'+sat.toFixed(3)+');}');};n.customProgramCacheKey=()=>'sat'+sat;} // style: prop desaturation
 if(n.map){n.map.encoding=THREE.sRGBEncoding;n.map.anisotropy=4;}matCache[m.uuid]=n;return n;}
FA.load=function(list){const L=new THREE.GLTFLoader();return Promise.all(Object.entries(list).map(([k,u])=>new Promise((res)=>{
 L.load(u,g=>{const root=g.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);const parts=[];const hgt=Math.max(.001,box.max.y-box.min.y);
  root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();const p=geo.attributes.position,n=p.count,col=new Float32Array(n*3),v=new THREE.Vector3();
   for(let i=0;i<n;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const t=(v.y-box.min.y)/hgt;const ao=.42+.58*smooth(0,.38,t);col[i*3]=col[i*3+1]=col[i*3+2]=ao;} // contact gradient (baked AO)
   geo.setAttribute('color',new THREE.BufferAttribute(col,3));parts.push({geo,mat:kitMat(Array.isArray(o.material)?o.material[0]:o.material),m:o.matrixWorld.clone(),name:o.name});});
  FA.MODELS[k]={parts,box};res();},undefined,e=>{window.__errs.push('load '+u+': '+(e&&e.message));res();});})));};
// placement matrix: footprint w (max of x/z extent) or height h; base sits at y
FA.pm=function(k,x,y,z,o){o=o||{};const M=FA.MODELS[k];if(!M)return null;const b=M.box,sx=b.max.x-b.min.x,sz=b.max.z-b.min.z,sy=b.max.y-b.min.y;
 const s=o.s||(o.h?o.h/sy:(o.w||1)/Math.max(sx,sz));const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;if(o.along!=null)o.ry=o.along+(sz>sx?Math.PI/2:0);
 const m=new THREE.Matrix4().makeTranslation(x,y,z).multiply(new THREE.Matrix4().makeRotationY(o.ry||0)).multiply(new THREE.Matrix4().makeScale(s,s*(o.sy||1),s)).multiply(new THREE.Matrix4().makeTranslation(-cx,-b.min.y,-cz));
 return {m,s,fw:Math.max(sx,sz)*s,h:sy*s};};
FA.put=function(k,x,z,o){o=o||{};const y=o.y!=null?o.y:FA.H(x,z)-(o.sink||.04);const r=FA.pm(k,x,y,z,o);if(!r)return null;(FA.PL[k]=FA.PL[k]||[]).push(r.m);
 if(o.ao!==false)FA.AOS.push({x,z,r:r.fw*.62+.3,k:o.aok||.35});return r;};
FA.buildInstances=function(){let n=0;for(const[k,arr]of Object.entries(FA.PL)){const M=FA.MODELS[k];if(!M||!arr.length)continue;
 for(const p of M.parts){const im=new THREE.InstancedMesh(p.geo,p.mat,arr.length);const t=new THREE.Matrix4();arr.forEach((m,i)=>{t.multiplyMatrices(m,p.m);im.setMatrixAt(i,t);});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;SC.add(im);n++;}}return n;};
// a single animated kit model (watermill wheel, windmill fan): returns {group, spin(partNameFilter, speed)}
FA.single=function(k,x,z,o){o=o||{};const y=o.y!=null?o.y:FA.H(x,z)-.05;const r=FA.pm(k,x,y,z,o);const M=FA.MODELS[k];if(!r)return null;const out=[];
 for(const p of M.parts){const me=new THREE.Mesh(p.geo,p.mat);me.matrixAutoUpdate=false;me.matrix.multiplyMatrices(r.m,p.m);me.castShadow=me.receiveShadow=true;SC.add(me);out.push({me,p,base:r.m});}
 FA.AOS.push({x,z,r:r.fw*.6+.3,k:.4});
 return {r,parts:out,spinner(filter){const q=out.find(e=>e.p.name.toLowerCase().includes(filter));if(!q)return null;q.p.geo.computeBoundingBox();const bb=q.p.geo.boundingBox,e=new THREE.Vector3().subVectors(bb.max,bb.min);
   const ax=e.x<=e.y&&e.x<=e.z?new THREE.Vector3(1,0,0):(e.z<=e.y?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0));const rot=new THREE.Matrix4();
   return a=>{rot.makeRotationAxis(ax,a);q.me.matrix.multiplyMatrices(q.base,q.p.m).multiply(rot);};}};};

// ---------------- terrain mesh (slope/height/moisture colour, baked AO, detail normals, cloud shadows) ----------------
FA.TU={uT:{value:0}};
FA.buildTerrain=function(colorHook){const T=LOOK.ter;const SX=Math.round(TW/T.cell),SZ=Math.round(TD/T.cell);const g=new THREE.PlaneGeometry(TW,TD,SX,SZ);g.rotateX(-Math.PI/2);
 const p=g.attributes.position,n=p.count,NX=SX+1;const hs=new Float32Array(n);
 for(let i=0;i<n;i++){const x=p.getX(i),z=p.getZ(i);hs[i]=FA.H(x,z);p.setY(i,hs[i]);}
 g.computeVertexNormals();const nr=g.attributes.normal;const col=new Float32Array(n*3);const c=new THREE.Color(),c2=new THREE.Color();
 const P={};for(const k in T.P)P[k]=C(T.P[k]);const AR=Math.max(1,Math.round(2*1.4/T.cell)),AR2=Math.max(2,Math.round(6*1.4/T.cell));
 const hAt=(ix,iz)=>hs[Math.min(SZ,Math.max(0,iz))*NX+Math.min(SX,Math.max(0,ix))];
 for(let i=0;i<n;i++){const x=p.getX(i),z=p.getZ(i),h=hs[i],sl=1-nr.getY(i),ix=i%NX,iz=(i/NX)|0;
  const mo=fbm(x*.05+40,z*.05-20,3);
  c.copy(P.lo).lerp(P.mid,smooth(.3,.75,mo));c.lerp(P.hi,smooth(6,16,h));c.lerp(P.snow,smooth(22,34,h)*.6);
  c.lerp(P.rock,smooth(.22,.5,sl));
  const dx=Math.abs(x-FA.riverX(z));c.lerp(P.bank,smooth(5.2,2.6,dx)*.8);c.lerp(P.bed,smooth(1.9,.8,dx));
  if(colorHook)colorHook(x,z,h,sl,c);
  // baked AO: horizon occlusion from the height grid (2 radii x 8 dirs)
  let occ=0;for(let a=0;a<8;a++){const ca=Math.cos(a*.785),sa=Math.sin(a*.785);for(const rr of[AR,AR2]){occ+=Math.max(0,hAt(ix+Math.round(ca*rr),iz+Math.round(sa*rr))-h)/(rr*T.cell/1.4);}}
  let ao=1-Math.min(.42,occ*.085);
  for(const q of FA.AOS){const rq=q.r*1.6;if(Math.abs(x-q.x)>rq||Math.abs(z-q.z)>rq)continue;const d=Math.hypot(x-q.x,z-q.z);if(d<q.r*1.6)ao*=1-Math.min(.9,q.k*LOOK.aoK)*smooth(q.r*1.6,q.r*.55,d);} // contact AO under props
  const v=1-T.vary/2+T.vary*hash(x*.37,z*.53);c.multiplyScalar(ao*v);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));
 const nm=FA.noiseNormal(128,1.4,11);nm.repeat.set(70,52);
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,normalMap:T.nrm>0?nm:null,normalScale:new THREE.Vector2(T.nrm,T.nrm),envMapIntensity:LOOK.env*.7,flatShading:!!T.flat});
 const CL=T.contour>0?'{float hq=vFogWP.y/'+T.contour.toFixed(3)+';float fw=max(fwidth(hq),1e-4);float ln=1.-smoothstep(.0,1.2,abs(fract(hq-.5)-.5)/fw);float major=step(4.5,mod(floor(hq+.5),5.));outgoingLight=mix(outgoingLight,outgoingLight*vec3('+C(T.line).toArray().map(v=>v.toFixed(3)).join(',')+')*1.6,ln*(.30+.30*major));}\n':'';
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;\nfloat cH2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat cN2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(cH2(i),cH2(i+vec2(1,0)),f.x),mix(cH2(i+vec2(0,1)),cH2(i+vec2(1,1)),f.x),f.y);}')
   .replace('#include <output_fragment>','#ifdef USE_FOG\n{vec2 q=vFogWP.xz*.028+vec2(uT*.012,uT*.004);float cl=cN2(q)*.6+cN2(q*2.1+3.)*.4;outgoingLight*=1.-.16*smoothstep(.52,.78,cl);}\n'+CL+'#endif\n#include <output_fragment>');};
 mat.customProgramCacheKey=()=>'ter'+FA.STYLE;
 const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.castShadow=true;SC.add(m);
 // tabletop relief: plinth skirt under the model edge
 const sk=new THREE.Mesh(new THREE.BoxGeometry(TW+.4,10,TD+.4),new THREE.MeshStandardMaterial({color:LOOK.skirt,roughness:1}));sk.position.y=-5.4;SC.add(sk);
 // water (sun glints + sky env reflections, scrolling detail normals)
 const wn=FA.noiseNormal(128,2.2,23);wn.repeat.set(36,27);FA.waterN=wn;
 const w=new THREE.Mesh(new THREE.PlaneGeometry(TW,TD),new THREE.MeshStandardMaterial({color:LOOK.water.c,roughness:LOOK.water.r,metalness:0,normalMap:wn,normalScale:new THREE.Vector2(.16,.16),envMapIntensity:.75}));
 w.rotation.x=-Math.PI/2;w.position.y=WL;w.receiveShadow=true;SC.add(w);
 return m;};

// ---------------- grass + tree scatter (instanced) ----------------
FA.tufts=function(cands){const g=new THREE.ConeGeometry(.09,.32,3);g.translate(0,.16,0);const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:LOOK.tuft,roughness:.9,envMapIntensity:.4}),cands.length);
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),pv=new THREE.Vector3(),cc=new THREE.Color();
 cands.forEach((c,i)=>{const k=.7+Math.random()*.9;s.set(k,k*(.8+Math.random()*.7),k);q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28);pv.set(c[0],FA.H(c[0],c[1])-.03,c[1]);m.compose(pv,q,s);im.setMatrixAt(i,m);
  cc.setHSL(.20+Math.random()*.06,.22+Math.random()*.12,.36+Math.random()*.12);if(FA.STYLE!=='pilot'){const hsl={};C(LOOK.tuft).getHSL(hsl);cc.setHSL(hsl.h+(Math.random()-.5)*.04,hsl.s*(.8+Math.random()*.4),hsl.l*(.9+Math.random()*.2));}im.setColorAt(i,cc);});
 im.receiveShadow=true;im.frustumCulled=false;SC.add(im);return im;};

// ---------------- data-layer road stub (unlit, no fog, no tone mapping, dark outline) ----------------
FA.road=function(pts,w,hex,yTop){const cu=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])));const N=90,ps=cu.getSpacedPoints(N);
 function ribbon(width,lift,colr,op,ro){const pos=[],idx=[];for(let i=0;i<=N;i++){const a=ps[Math.max(0,i-1)],b=ps[Math.min(N,i+1)];const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;const nx=-dz/l,nz=dx/l;
   for(const sgn of[-1,1]){const x=ps[i].x+nx*width/2*sgn,z=ps[i].z+nz*width/2*sgn;let y=FA.H(x,z);if(yTop&&yTop(x,z)!=null)y=yTop(x,z);pos.push(x,Math.max(y,WL)+lift,z);}
   if(i<N){const o=i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:colr,transparent:op<1,opacity:op,fog:false,toneMapped:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));m.renderOrder=ro;SC.add(m);return m;}
 ribbon(w+.7,.22,C('#0A0E13'),.62,5);ribbon(w,.30,C(hex),1,6);};

// ---------------- camera rig ----------------
FA.rig={tx:0,ty:0,tz:0,d:215,pitch:.9,yaw:0};
FA.setView=function(){const c=FA.CITY==='gatekeeper'?GK:RV;const rg=FA.rig;
 if(FA.VIEW==='world'){Object.assign(rg,{tx:c.x+(c===GK?8:-8),ty:0,tz:c.z-10,d:185,pitch:.50,yaw:c===GK?.08:-.08});FA.fitShadow(0,-14,125);}
 else if(c===GK){Object.assign(rg,{tx:c.x,ty:7.6,tz:c.z,d:50,pitch:.38,yaw:-.36});FA.fitShadow(c.x,c.z,20);}
 else{Object.assign(rg,{tx:c.x+1.5,ty:1.8,tz:c.z,d:46,pitch:.50,yaw:-.30});FA.fitShadow(c.x+1,c.z,22);}
 FA.applyCam();FA.ui&&FA.ui();};
FA.applyCam=function(){const r=FA.rig;CAM.position.set(r.tx+Math.sin(r.yaw)*Math.cos(r.pitch)*r.d,r.ty+Math.sin(r.pitch)*r.d,r.tz+Math.cos(r.yaw)*Math.cos(r.pitch)*r.d);CAM.lookAt(r.tx,r.ty,r.tz);};
{let drag=null;const el=R.domElement;el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:FA.rig.yaw,pitch:FA.rig.pitch};});
 addEventListener('pointerup',()=>drag=null);addEventListener('pointermove',e=>{if(!drag)return;FA.rig.yaw=drag.yaw-(e.clientX-drag.x)*.005;FA.rig.pitch=Math.min(1.35,Math.max(.12,drag.pitch+(e.clientY-drag.y)*.004));FA.applyCam();});
 el.addEventListener('wheel',e=>{e.preventDefault();FA.rig.d=Math.min(330,Math.max(14,FA.rig.d*Math.exp(e.deltaY*.0012)));FA.applyCam();},{passive:false});}
addEventListener('resize',()=>{CAM.aspect=innerWidth/innerHeight;CAM.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);});

// ---------------- markers (world: drop line + disc + brass ring + plate; close-up: current site plate only) ----------------
FA.markers=[];
FA.marker=function(id,name,sub,x,gy,z){const ALT=24;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,ALT,z),new THREE.Vector3(x,gy+.2,z)]);
 const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#E6E0D2',transparent:true,opacity:.55,fog:false,toneMapped:false}));SC.add(line);
 const dot=new THREE.Mesh(new THREE.RingGeometry(.35,.6,24),new THREE.MeshBasicMaterial({color:'#E6E0D2',fog:false,toneMapped:false,transparent:true,opacity:.8,depthTest:false}));dot.rotation.x=-Math.PI/2;dot.position.set(x,gy+.25,z);dot.renderOrder=9;SC.add(dot);
 const el=document.createElement('div');el.className='mk';el.innerHTML='<i></i><span class="pl"><b>'+name+'</b><em>'+sub+'</em></span>';document.getElementById('labels').appendChild(el);
 FA.markers.push({id,el,line,dot,p:new THREE.Vector3(x,ALT,z),anchor:new THREE.Vector3(x,gy,z)});};
const _v=new THREE.Vector3();
FA.placeMarkers=function(){for(const m of FA.markers){const cur=m.id===FA.CITY;const world=FA.VIEW==='world';m.line.visible=m.dot.visible=world;
  m.el.style.display=(world||cur)?'block':'none';m.el.classList.toggle('cur',cur);m.el.classList.toggle('big',!world);
  if(world)_v.copy(m.p);else _v.copy(m.anchor).add(new THREE.Vector3(m.id==='gatekeeper'?1.6:0,m.id==='gatekeeper'?7.0:5.5,0));
  _v.project(CAM);const X=(_v.x*.5+.5)*innerWidth,Y=(-_v.y*.5+.5)*innerHeight;m.el.style.transform='translate('+X.toFixed(1)+'px,'+Y.toFixed(1)+'px)';}};

// ---------------- loop + perf counter ----------------
// style tilt-shift: scene -> HDR target (MSAA), then one 16-tap disc blur whose radius grows outside a horizontal focus band; tone map + sRGB in this pass
const TS=LOOK.ts>0?(function(){const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});
 const mat=new THREE.ShaderMaterial({uniforms:{tD:{value:rt.texture},res:{value:new THREE.Vector2(1,1)},amt:{value:LOOK.ts*15.0},band:{value:.12},cy:{value:.50}},depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D tD;uniform vec2 res;uniform float amt,band,cy;varying vec2 vU;void main(){float d=max(0.,abs(vU.y-cy)-band)/(1.-band);float r=amt*smoothstep(0.,.5,d);vec4 a=texture2D(tD,vU);float n=1.;'+
  'if(r>.3){for(int i=0;i<16;i++){float fi=float(i);float rr=sqrt((fi+.5)/16.)*r;float an=fi*2.39996;a+=texture2D(tD,vU+vec2(cos(an),sin(an))*rr/res);n+=1.;}}gl_FragColor=a/n;\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});
 const s=new THREE.Scene(),c=new THREE.OrthographicCamera(-1,1,1,-1,0,1),q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;s.add(q);return {rt,s,c,q};})():null;
FA.TS=TS;
{const t=document.querySelector('#hud .t');if(t)t.textContent+=' · style: '+STYLES[FA.STYLE].name;}
FA.anims=[];const clock=new THREE.Clock();let fr=0,acc=0,lastInfo='';FA.T=0;
const fpsEl=document.getElementById('fps');if(Q.get('fps')==='1')fpsEl.style.display='block';
FA.frame=function(){const dt=Math.min(.05,clock.getDelta());FA.T=FA.TFIX!=null?FA.TFIX:FA.T+dt;FA.TU.uT.value=FA.T;
 if(FA.waterN){FA.waterN.offset.set(FA.T*.006,FA.T*.011);}
 for(const a of FA.anims)a(FA.T,dt);sky.position.copy(CAM.position);
 if(TS){const w=R.domElement.width,h=R.domElement.height;if(TS.rt.width!==w||TS.rt.height!==h)TS.rt.setSize(w,h);TS.q.material.uniforms.res.value.set(w,h);
  R.setRenderTarget(TS.rt);R.render(SC,CAM);R.setRenderTarget(null);R.render(TS.s,TS.c);}
 else R.render(SC,CAM);FA.placeMarkers();
 fr++;acc+=dt;if(acc>.5&&fpsEl.style.display==='block'){const i=R.info;lastInfo='fps '+(fr/acc).toFixed(0)+' · '+(acc/fr*1000).toFixed(1)+' ms · calls '+i.render.calls+' · tris '+(i.render.triangles/1000).toFixed(0)+'k · geo '+i.memory.geometries+' · tex '+i.memory.textures+' · dpr '+R.getPixelRatio();fpsEl.textContent=lastInfo;fr=0;acc=0;}
 if(FA.wantClip){FA.wantClip=false;FA.clip=FA.measureClip();}};
FA.loop=function(){requestAnimationFrame(FA.loop);FA.frame();};
FA.info=()=>({calls:R.info.render.calls,tris:R.info.render.triangles,geometries:R.info.memory.geometries,textures:R.info.memory.textures,programs:(R.info.programs||[]).length,dpr:R.getPixelRatio()});
// clipped-pixel check (P2): share of pixels with any channel > 240, measured right after a render
FA.measureClip=function(){const cv=R.domElement,w=cv.width,h=cv.height;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(cv,0,0);
 const d=g.getImageData(0,0,w,h).data;let n=0,mx=0;for(let i=0;i<d.length;i+=4){const m=Math.max(d[i],d[i+1],d[i+2]);if(m>240)n++;if(m>mx)mx=m;}return {over240:n,share:+(n/(w*h)*100).toFixed(3),max:mx,w,h};};
})();
