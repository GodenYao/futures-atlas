// Futures Atlas v4.5 PILOT - world.js : renderer, look, sky + environment, height/distance fog, sculpted terrain,
// water, kit loader + instancing with baked vertex AO, data-layer road stubs, camera, markers, HUD, loop.
// three.js r149 core + GLTFLoader (r147 examples/js build, last non-module release). All assets CC0 (see ../ASSETS.md).
// Checkpoint A1 (style=bluefacet): colour management, blue-hour relight with sky-only IBL, PBR-Neutral-type tone curve,
// on-demand shadows, batched glow/smoke, merged static landmark parts, jittered terraced facet terrain, river shelf +
// depth tint + foam, contact AO decals + crease bands. Techniques independently re-implemented from a written review
// spec (review/fable_saltline_*.md); no third-party engine code.
(function(){
'use strict';
window.__errs=window.__errs||[];
addEventListener('error',e=>window.__errs.push(String(e.message||e)));
addEventListener('unhandledrejection',e=>window.__errs.push('rej:'+String(e.reason&&e.reason.message||e.reason)));
{const ce=console.error.bind(console);console.error=(...a)=>{window.__errs.push('console: '+String(a[0]).slice(0,300));ce(...a);};} // shader compile errors land here too
const FA=window.FA={};
const Q=new URLSearchParams(location.search);
FA.Q=Q;FA.QS=Q; // C4: FA.Q becomes the quality tier string after the renderer exists (FA.QS keeps the URL params)
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
 props:{sat:1,white:null}, gk:{}, water:{c:'#1C2E3C',r:.2}, skirt:'#15172A', tuft:'#7C8A5E', clump:false, ts:0, aoK:1, glowK:1,
 cm:false, ibl:null, contact:false, envTer:null, exposureWorld:null, table:null
};
// ---------------- STYLE EXPLORATION (?style=<key>) - quick parameter-level approximations of Fable 5.2 directions ----------------
// (review/fable_style45_20261115_1532.md). Not final looks: no geometry rework, no SSAO/bloom.
const STYLES=FA.STYLES={
 pilot:{name:'Pilot (blue hour)',pitch:'Current v4.5 pilot look: blue-hour sky, low warm key, ACES.'},
 // Checkpoint A1 candidate: facet geometry language lit as blue hour. Hexes are sRGB (colour management ON), large-surface albedo capped near #C4C0BA.
 bluefacet:{name:'Blue facet',pitch:'Jittered terraced facets + clustered trees, lit at blue hour: warm key at 22 deg, violet-slate sky as the only ambient, Neutral tone curve.',
  cm:true,tone:'neutral',exposure:.84,exposureWorld:.9,
  sky:{zen:'#24315E',mid:'#4E5A8A',hor:'#A493BA',glow:'#FFB27A',low:'#6A6672'},
  fog:{c:'#7D7AA6',near:160,far:760,hk:.22,ha:.14},
  hemi:['#9AA4D8','#4A4456',.06],sun:['#FFB685',1.45],fill:['#7C9AF0',0],sunEl:22,
  env:.9,envTer:.6,ibl:{amb:.62,clamp:6,bounce:'#6A6672'},
  ter:{P:{lo:'#768C70',mid:'#86976E',hi:'#989A92',rock:'#878A8C',bank:'#B5A88E',bed:'#4E5E68',snow:'#B4B4C0',heath:'#958F7E'},oct:3,nrm:0,flat:true,facet:true,terr:1.3,hard:.85,cell:2.8,fine:1.1,vary:.04},
  props:{sat:.92},gk:{stone:'#83807C',stone2:'#95918C',wall:'#9C9893',tower:'#8A8682',spire:'#AFABA6',pod:'#A29E99',metal:'#3A3F4C',lid:'#5E5C69',pav:'#A9A5A2',ave:'#8E8A88',plaza:'#B2AEAA'},
  water:{c:'#3A5A6E',r:.3,sh:'#8FA79C',dp:'#2C4450',foam:'#E8EEF0',env:.5},skirt:'#2E2C3C',tuft:'#76855A',clump:true,ts:0,aoK:1,glowK:1.3,
  contact:true,road:'#9AA9BC',table:'#3A3850',
  // ---- Checkpoint A2 (js/a2.js): cooler violet-blue hour (not lavender), HDR post with threshold bloom (only emissives bloom),
  // warm 2700-3200 K windows/lamps, sky strip in close-ups, instrument-table frame, baked materials, GK future-tech kit, RV craft kit.
  a2:true,
  sky:{zen:'#112250',mid:'#2B4686',hor:'#7690C4',glow:'#FFA866',low:'#525C78',hbK:.025},
  fog:{c:'#7086B4',near:170,far:780,hk:.22,ha:.12},
  sun:['#FFBC72',.78],ibl:{amb:.76,clamp:6,bounce:'#596479'},exposure:.74,exposureWorld:.80,worldCam:{tx:6,tz:28,d:300,pitch:.72,fov:28},
  post:{thr:1.4,knee:.4,k:.40,vig:.14,sat:1.0,sc:.14,sh:[.86,.94,1.12],hi:[1.0,1.0,.98],lift:[.002,.004,.016],glowHDR:6.0},
  kitWarm:[1.18,1.0,.72],tuft:'#8E9A62',table:'#24253A',
  closeCam:{gatekeeper:{yaw:-1.18,pitch:.20,d:46,ty:8.6,fov:31,shift:.10,eye:-1.22},reversion:{yaw:-1.22,pitch:.25,d:40,ty:2.0,fov:31,shift:.10}},
  gk:{stone:'#6E6B72',stone2:'#7E7A7E',wall:'#8E8B8C',tower:'#7C7A7E',spire:'#A6A39F',pod:'#9A9692',metal:'#3A3F4C',lid:'#55535F',pav:'#9E9A97',ave:'#837F7E',plaza:'#A9A5A1'}},
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
// Checkpoint B0: archviz = bluefacet/A2 base (post chain, table frame, facet terrain) + blue-hour masterplan-model look; ?mood=day optional
{const A=STYLES.archviz=JSON.parse(JSON.stringify(STYLES.bluefacet));
 Object.assign(A,{name:'Arch-viz (blue hour)',pitch:'Procedural master-planned future city as a lit masterplan model at blue hour.',archviz:true,exposure:.82,exposureWorld:.86,glowK:1.2,sun:['#FFB07A',.30],sunEl:8});
 Object.assign(A.sky,{zen:'#0B1B48',mid:'#2A4E96',hor:'#B39A90',glow:'#FFA25E',hbK:.10});
 Object.assign(A.fog,{c:'#4E5D80',near:150,far:1000,ha:.16});A.ibl.amb=.62; // B2: fog desaturated to blue-grey, far fog -30 % (Fable crit knob)
 A.closeCam.gatekeeper={yaw:-1.18,pitch:.24,d:76,ty:9.5,fov:31,shift:.08,eye:-1.22};
 A.closeCam.reversion={yaw:-.6,pitch:.42,d:22,ty:.35,fov:31,shift:.05}; // C4: target = hamlet centroid (setView); from the south-west over the entrance lane toward river, wheel + bridge (was d 40 aimed 3 u east of the hamlet)
 A.pc={R:21.5,lit:1,line:1,mood:'blue'};
 if(Q.get('mood')!=='day'){
  // C1 (lighting + colour only): the city is the only warm light. Environment 1-2 stops down to deep cool blue-violet,
  // IBL gain capped (was saturating at 14 -> daylight-level ambient that procity had to crush), luminous cool upper sky
  // with a narrow peach-amber horizon band, darker desaturated trees, threshold bloom tuned so only emissives bloom.
  Object.assign(A,{exposure:.80,exposureWorld:1.08,sun:['#93A3DC',.55],kitWarm:[1.04,1.0,.92],props:{sat:.45,white:null},table:'#0E111C',
   farTree:{c:'#2E3E38',b:'#38453A'},thin:.5});
  Object.assign(A.sky,{zen:'#173576',mid:'#3A6CC4',hor:'#D89C84',glow:'#F09A60',low:'#121726',hbK:.04,bw:.06});
  Object.assign(A.fog,{c:'#273360',near:140,far:1000,ha:.12});
  Object.assign(A.ibl,{amb:.62,cap:3.6,bounce:'#20263A'});A.envTer=.55;A.env=.7;
  Object.assign(A.ter.P,{lo:'#56545E',mid:'#5B5961',hi:'#63606E',rock:'#5A5866',bank:'#6A6474',bed:'#1E2434',snow:'#7A7890',heath:'#5D5961'}); // violet-grey albedo: the blue IBL supplies the hue
  Object.assign(A.water,{sh:'#22344A',dp:'#0A1220',foam:'#7E8CA0',env:.7});
  Object.assign(A.post,{thr:1.15,knee:.35,k:.52,vig:.20});
  A.gk=Object.assign({},A.gk);
  // C2 (owner: 'reference the CURRENT v4.4 environment lighting'): v4.4 look 1 'Cinematic dusk' environment ported 1:1.
  // v4.4 runs legacy colour (hex numbers used as linear, no output encoding, NoToneMapping). Here colour management is ON:
  // hexes are kept as written (albedo x light products commute through the ~2.2 gamma), light INTENSITIES are converted
  // I_cm = I_v44^2.2, the Neutral toe crush + magenta pull + shadow grade are disabled (v4.4 has no curve or grade), and the
  // v4.4 screen-space atmosphere layers (CSS sky gradient, warm horizon vignette, screen-blended glow) are reproduced as overlays.
  Object.assign(A,{exposure:1.0,exposureWorld:1.10,
   // legacy v4.4 sums lights in display space, CM sums them in linear space (the warm key then swamps the blue sky term),
   // so the per-light conversion I^2.2 is the start point and the final split was matched by world-frame readback vs v4.4:
   hemi:['#8494D8','#120F2C',1.60],  // fa4_looks.js:11 hemi ['#8494D8','#120F2C',.62] (I^2.2 = .35 -> 1.60 by readback)
   sun:['#FFB070',.90],              // fa4_looks.js:11 sun ['#FFB070',1.25] (I^2.2 = 1.63 -> .90 by readback)
   fill:['#6A8EE6',.50,1],           // fa4_looks.js:11 fill ['#6A8EE6',.48] (I^2.2 = .20 -> .50; 3rd elem = enable, the C1 fill was never added)
   sunV:[-70,110,45],fillV:[80,40,-60], // fa4_build.js:235 sun at target+(-70,110,45) (53 deg, west-front); fa4_world.js:36 fill at (80,40,-60)
   table:'#161C38',                  // fa4_looks.js:8 bg 58 % stop (what v4.4 shows past the map edge)
   smokeK:.5,                        // C2 item 4: Reversion chimney smoke opacity -50 %
   overlay:{                         // fa4_looks.js:9-10 + :39-41 (90 s horizon drift, off under reduced motion), world view only
    vig:'linear-gradient(180deg,rgba(8,10,26,.55) 0%,rgba(255,160,90,.30) 7%,rgba(230,130,120,.12) 15%,rgba(150,110,190,.04) 26%,rgba(0,0,0,0) 34%,rgba(0,0,0,0) 62%,rgba(4,6,18,.42) 100%),radial-gradient(ellipse 92% 88% at 55% 40%,rgba(4,6,18,0) 52%,rgba(4,6,18,.55) 100%)',
    glow:'radial-gradient(ellipse 30% 22% at 57.5% 40%,rgba(255,180,110,.20) 0%,rgba(255,140,100,.07) 45%,rgba(0,0,0,0) 100%),radial-gradient(ellipse 70% 20% at 50% 2%,rgba(255,150,80,.40) 0%,rgba(230,110,110,.10) 55%,rgba(0,0,0,0) 100%),radial-gradient(ellipse 30% 26% at 92% 20%,rgba(200,110,170,.12) 0%,rgba(0,0,0,0) 100%)'}});
  // sky = v4.4 CSS bg gradient (fa4_looks.js:8 #0A0F22/#18203F/#35294E/#161C38) composited with its vig + glow layers at the horizon:
  // #35294E + vig rgba(255,160,90,.30) + screen rgba(255,150,80,.40) -> #AA7768 (horizon); #35294E + rgba(230,130,120,.12) -> #3A3060 (mid)
  Object.assign(A.sky,{zen:'#141A38',mid:'#3A3060',hor:'#AA7768',glow:'#FFA060',low:'#161C38',hbK:.04,bw:.10});
  A.fog={c:'#3E3C78',near:244,far:535,hk:.22,ha:.06}; // fa4_looks.js:11 fog ['#3E3C78',210,460] at v4.4 world d 258 -> x1.16 for the pilot world d 300
  Object.assign(A.ibl,{amb:.15,cap:3.6,bounce:'#120F2C'});A.envTer=.45; // IBL kept for reflections; ambient now mostly the ported hemi
  Object.assign(A.ter.P,{lo:'#0E1430',mid:'#1C2550',heath:'#2A3468',hi:'#3C4986',rock:'#474A76',bank:'#2A3560',bed:'#0A1230',snow:'#4C5284'}); // fa4_looks.js:12 T LO/MID/HI/ROCK/SHORE/WAT (heath = MID-HI mid, snow = ROCK lifted)
  Object.assign(A.water,{sh:'#2A3560',dp:'#0A1230',foam:'#6E78A8',env:.7}); // fa4_looks.js:12 SHORE / WAT
  Object.assign(A.post,{thr:.80,knee:.30,k:.62,vig:0,sc:0,toe:0,mg:0,sh:[1,1,1],hi:[1,1,1],lift:[0,0,0]}); // fa4_looks.js:16 bloom th .70 (sRGB) ~ linear .46 -> .80 keeps lit terrain out; no grade
  // C2b (art-director review: off-platform terrain read muddy mauve-violet, trees black blobs, no depth):
  // terrain albedo shifted from violet toward cooler slate-blue (same value), warm key -15 % (it turned the blue albedo mauve),
  // a cool moon-rim light from behind/above (no shadow), fog colour cooler + a second aerial-perspective layer and valley mist,
  // kit/far trees get a cool fill instead of crushing to black, Reversion kit props dimmed (roofs bloomed), smoke tinted to the fog.
  Object.assign(A.ter.P,{lo:'#0C1630',mid:'#16284E',heath:'#203464',hi:'#2D457A',rock:'#374670',bank:'#22355A',bed:'#0A1430',snow:'#405284'});
  A.sun=['#FFB878',.76];A.hemi=['#8A9EDC','#101A34',1.35];A.exposureWorld=1.02;
  A.moon=['#A9C2F2',.40,[30,160,-110]]; // high (el ~54 deg): rim on terrain/trees, its water specular falls below the frame
  A.fog=Object.assign(A.fog,{c:'#2C3A6A',hk:.20,ha:.10,l2:{c:'#46589A',d:.0042,s:55,k:.15}});
  A.farTree={c:'#3A5064',b:'#465C6C'};A.kitTree={dim:.82,fill:[.030,.042,.070]};A.kitDim=.58;
  A.smokeK=.34;A.smokeC='#5E6890';A.smokeS=1.5;
  // C4: the 'vertical light shafts above the roofs' were the chimney smoke columns (6 x 9 lilac puffs rising 34 m, 1.5x size, lighter than
  // the dark slopes behind them in the lower close-up). Shorter, thinner, darker, more drift; procottage also halves the chimney count.
  A.smokeK=.16;A.smokeC='#3C4566';A.smokeS=.85;A.smokeRise=1.7;
  A.water=Object.assign({},A.water,{env:.36,sh:'#33487A'}); // river: grazing sky reflection -> .7 -> .36; C7: lighter shallow edge vs the dark wet-mud band (value contrast)
  A.shore={mud:'#0F111A',sand:'#30344A',silt:'#0D1326'};    // C7 analytic shore band (blue hour)
  A.fill=[A.fill[0],.30,A.fill[2]];A.fillV=[60,120,-50]; // ported v4.4 cool rim at el 21 deg put a clipped specular on the river (RV close 5.2k px >240, 53 with it off) -> higher + weaker; the moon carries the rim
  }
 if(Q.get('mood')==='day'){A.name='Arch-viz (day haze)';Object.assign(A,{exposure:.80,exposureWorld:.84,glowK:.15,sun:['#FFF2E0',1.15],sunEl:40,kitWarm:null});
  Object.assign(A.sky,{zen:'#6F9BC8',mid:'#A9C6DF',hor:'#E4E6E2',glow:'#FFF0DC',low:'#B9C0C4',hbK:.03});
  Object.assign(A.fog,{c:'#C9D6E2',ha:.10});Object.assign(A.ibl,{amb:.9,bounce:'#9A9C98'});
  Object.assign(A.post,{sh:[1,1,1],lift:[0,0,0],vig:.08});A.pc={R:21.5,lit:0,line:.22,mood:'day'};}}
FA.DEFAULT_STYLE='bluefacet'; // A2: side-by-side vision judged A2 bluefacet clearly better than A1 (blue-hour 8 vs 4); ?style=pilot keeps the old look
FA.STYLE=STYLES[(Q.get('style')||'').toLowerCase()]?(Q.get('style')||'').toLowerCase():FA.DEFAULT_STYLE;
(function merge(dst,src){for(const k in src){const v=src[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k]))merge(dst[k],v);else dst[k]=v;}})(LOOK,STYLES[FA.STYLE]);
if(Q.has('ao'))LOOK.contact=Q.get('ao')==='1';              // ?ao=0 / ?ao=1 toggles contact decals + crease bands (A/B check)
// B0 terrain option (owner 11-16): 'c' = DEFAULT for the arch-viz style = architect's-model terrain: every city sits in a smooth
// basin (smooth normals, no facets, no terraces inside the basin rim) and the land around it is cut into crisp stepped contour
// layers (1.6 u plates, near-vertical risers, finer 1.9 u grid so the layer edges read as cut card rather than ramps).
// 'a' = the C7 faceted terrain unchanged (1.3 u terraces, 2.8 u facets). 'b' = cheap smooth variant (no terraces, smooth
// normals everywhere, 2.2 u grid). Other styles (bluefacet / pilot) stay on their own terrain ('a') unless ?ter= is given.
FA.TER=(()=>{const t=(Q.get('ter')||'').toLowerCase();if(!LOOK.ter.facet)return 'a';if(t==='a'||t==='b'||t==='c')return t;return LOOK.archviz?'b':'a';})();  // owner 11-16: smooth terrain B is the archviz default (C/A via ?ter=)
if(FA.TER==='c')Object.assign(LOOK.ter,{terr:1.6,hard:.93,cell:1.9});
if(FA.TER==='b')Object.assign(LOOK.ter,{terr:0,cell:2.2});
const TERB=FA.TER==='b'&&!!LOOK.ter.facet; // B1: smooth game-style terrain (per-vertex slope/height colour blend, undulation, grain)
// colour management (r149): with legacyMode off, hex/CSS colours are sRGB and converted to linear, so palettes render as written.
THREE.ColorManagement.legacyMode=!LOOK.cm;
const C=h=>new THREE.Color(h);

// ---------------- helpers ----------------
FA.smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
FA.lerp=(a,b,t)=>a+(b-a)*t;
const smooth=FA.smooth,lerp=FA.lerp;
function hash(x,y){const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);}
FA.hash=hash;
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){o=o||5;let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=.5;}return s/(1-Math.pow(.5,o));}
FA.fbm=fbm;
FA.rng=function(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};

// ---------------- tone curve ----------------
// 'neutral': written from the public Khronos PBR Neutral description - identity below ~0.76, soft roll-off + slight
// desaturation above, so palette hexes and the brass accent survive (ACES shifts both).
if(LOOK.tone==='neutral'){THREE.ShaderChunk.tonemapping_pars_fragment=THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
 'vec3 CustomToneMapping( vec3 color ) {\n color *= toneMappingExposure;\n const float sC = 0.76; const float dS = 0.15;\n float x = min( color.r, min( color.g, color.b ) );\n float off = x < 0.08 ? x - 6.25 * x * x : 0.04;\n color -= off;\n float pk = max( color.r, max( color.g, color.b ) );\n if ( pk < sC ) return color;\n float d = 1.0 - sC;\n float np = 1.0 - d * d / ( pk + d - sC );\n color *= np / pk;\n float g = 1.0 - 1.0 / ( dS * ( pk - np ) + 1.0 );\n return mix( color, vec3( np ), g );\n}');}

// ---------------- renderer ----------------
const R=FA.R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
const DPR_CAP=Q.has('dpr')?parseFloat(Q.get('dpr')):1.25;            // pixel cap (Fable pitfalls: 1.5 at 1440x900 = 2.9 MP is too much)
R.setPixelRatio(Math.min(window.devicePixelRatio||1,DPR_CAP));R.setSize(innerWidth,innerHeight);
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=LOOK.tone==='linear'?THREE.LinearToneMapping:LOOK.tone==='neutral'?THREE.CustomToneMapping:THREE.ACESFilmicToneMapping;R.toneMappingExposure=LOOK.exposure;
if(LOOK.post){R.toneMapping=THREE.NoToneMapping;R.info.autoReset=false;} // A2: scene renders linear HDR to a target; curve + grade + bloom in js/a2.js post (exposure kept in toneMappingExposure)
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
R.shadowMap.autoUpdate=false;FA.shadowDirty=true;                   // shadows on demand: view change + ~10 Hz in close-up (moving wheel/fan/lids)
document.getElementById('stage').appendChild(R.domElement);
// C4 quality tier: FA.Q = 'high' (desktop, discrete / decent GPU) | 'low' (mobile, integrated or software GL, or ?q=low); ?q=high forces high.
// Low drops only close-up extras: 4096 close-up shadow map -> 2048, lane weeds / gravel / crop relief density x.4.
FA.Q=(function(){const q=(Q.get('q')||'').toLowerCase();let rs='';try{const gl=R.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');rs=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));}catch(e){}
 FA.GPU=rs;if(q==='low'||q==='high')return q;
 const mob=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent));
 const weak=/SwiftShader|llvmpipe|softpipe|Microsoft Basic|Mali|Adreno|PowerVR|Intel|Iris|UHD Graphics|HD Graphics/i.test(rs)&&!/Arc/i.test(rs);
 return(mob||weak||R.capabilities.maxTextureSize<8192)?'low':'high';})();
FA.QK=FA.Q==='high'?1:.4;
// B1 r4 image precision. (a) anisotropic filtering: every mipmapped texture gets the GPU max (16 on desktop; ?aniso=n) - the default
// for new textures plus a sweep (FA.anisoSweep) over scene materials at the first frame and over each lazily built site.
FA.ANISO=Q.has('aniso')?Math.max(1,+Q.get('aniso')):Math.min(16,R.capabilities.getMaxAnisotropy()||1);THREE.Texture.DEFAULT_ANISOTROPY=FA.ANISO;
FA.anisoSweep=function(root){let n=0;const fix=t=>{if(!t||!t.isTexture||t.isRenderTargetTexture||t.generateMipmaps===false||t.anisotropy>=FA.ANISO)return;
  if(t.minFilter!==THREE.LinearMipmapLinearFilter&&t.minFilter!==THREE.LinearMipmapNearestFilter)return;t.anisotropy=FA.ANISO;t.needsUpdate=true;n++;};
 const seen=new Set();root.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms){if(!m||seen.has(m))continue;seen.add(m);
  for(const k in m){const v=m[k];if(v&&v.isTexture)fix(v);}if(m.uniforms)for(const k in m.uniforms){const u=m.uniforms[k];if(u&&u.value&&u.value.isTexture)fix(u.value);}}});return n;};
// (b) pixel-ratio policy: target = min(devicePixelRatio, cap) with cap 2 (high tier) / 1.5 (low tier), limited by a pixel budget
// (?dprmp= megapixels, default 6 high / 2.5 low) so a 1913x1000 dpr-2 screen does not render 7.7 MP; ?dpr= forces the cap.
// Adaptive fallback: median frame interval over 40 interactive frames > D.slowMs (21) -> -0.25 (floor 1); < 15.5 ms for 4 windows -> +0.25
// (max 2 raises per session, so it cannot ping-pong). ?dpradapt=0 off, ?dprslow=<ms> test hook. FA.DPR.log = changes.
FA.DPR=(function(){const hi=FA.Q==='high',dev=window.devicePixelRatio||1,cap=Q.has('dpr')?parseFloat(Q.get('dpr')):hi?2:1.5,mp=Q.has('dprmp')?+Q.get('dprmp'):hi?6:2.5;
 const D={dev,cap,mp,min:1,adapt:Q.get('dpradapt')!=='0',slowMs:Q.has('dprslow')?+Q.get('dprslow'):21,fastMs:15.5,win:[],last:0,good:0,ups:0,log:[]};
 D.budget=()=>Math.sqrt(D.mp*1e6/Math.max(1,innerWidth*innerHeight));D.target=Math.max(D.min,Math.min(dev,cap,D.budget()));D.target=Math.round(D.target*100)/100;
 if(Q.has('dpr'))D.target=Math.min(dev,cap);D.cur=D.target;
 D.set=function(v,why){v=Math.round(v*100)/100;if(v===D.cur)return;D.cur=v;R.setPixelRatio(v);D.log.push({t:Math.round(performance.now()),dpr:v,why});FA.shadowDirty=true;FA.kick&&FA.kick(400);};
 D.note=function(n){if(!D.adapt)return;const dt=n-D.last;D.last=n;if(dt>70||dt<=0)return;D.win.push(dt);if(D.win.length<40)return;
  const s=D.win.slice().sort((a,b)=>a-b),med=s[20];D.win.length=0;D.lastMed=+med.toFixed(1);
  if(med>D.slowMs&&D.cur>D.min+1e-3){D.set(Math.max(D.min,D.cur-.25),'slow '+med.toFixed(1));D.good=0;}
  else if(med<D.fastMs&&D.cur<D.target-1e-3&&D.ups<2){if(++D.good>=4){D.set(Math.min(D.target,D.cur+.25),'fast '+med.toFixed(1));D.good=0;D.ups++;}}else D.good=0;};
 return D;})();
R.setPixelRatio(FA.DPR.cur);
// (c) composer AA: MSAA samples on the HDR scene target (?msaa=, default 4, clamped to the GPU max) + FXAA on the final LDR image
// (?aa=auto|fxaa|off; auto = FXAA only while the pixel ratio is < 1.75, i.e. where MSAA alone leaves bright HDR edges stair-stepped).
FA.MSAA=Math.min(R.capabilities.maxSamples||4,Q.has('msaa')?+Q.get('msaa'):4);FA.AA=Q.get('aa')||'auto';
// timing marks (B1 r4): FA.mark(kind, t0, t1, info) -> ring buffer FA.MARKS (last 600) + performance.measure 'fa:<kind>'
FA.MARKS=[];FA.mark=function(k,t0,t1,info){FA.MARKS.push([+t0.toFixed(1),k,+(t1-t0).toFixed(2),info||'']);if(FA.MARKS.length>600)FA.MARKS.splice(0,100);
 if(FA.MARKON)try{performance.measure('fa:'+k,{start:t0,end:t1});}catch(e){}};FA.MARKON=Q.get('marks')==='1';

// height + distance fog: patch the shared fog chunks once (world position varying; valleys get extra haze)
THREE.ShaderChunk.fog_pars_vertex='#ifdef USE_FOG\n varying float vFogDepth;\n varying vec3 vFogWP;\n#endif';
THREE.ShaderChunk.fog_vertex='#ifdef USE_FOG\n vFogDepth = - mvPosition.z;\n vec4 fogWP = vec4( transformed, 1.0 );\n #ifdef USE_INSTANCING\n  fogWP = instanceMatrix * fogWP;\n #endif\n vFogWP = ( modelMatrix * fogWP ).xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor;\n varying float vFogDepth;\n varying vec3 vFogWP;\n uniform float fogNear;\n uniform float fogFar;\n#endif';
THREE.ShaderChunk.fog_fragment='#ifdef USE_FOG\n float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n float fogH = exp( - max( vFogWP.y - 0.5, 0.0 ) * '+LOOK.fog.hk.toFixed(3)+' );\n fogFactor = clamp( fogFactor + fogH * '+LOOK.fog.ha.toFixed(3)+' * smoothstep( 20.0, 260.0, vFogDepth ), 0.0, 1.0 );\n gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n'+
 (LOOK.fog.l2?' gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3('+C(LOOK.fog.l2.c).toArray().map(v=>v.toFixed(4)).join(',')+'), '+LOOK.fog.l2.k.toFixed(3)+' * ( 1.0 - exp( - max( vFogDepth - '+LOOK.fog.l2.s.toFixed(1)+', 0.0 ) * '+LOOK.fog.l2.d.toFixed(4)+' ) ) * ( 0.55 + 0.45 * fogH ) );\n':'')+ // C2b: aerial-perspective layer 2 (cool, exponential, stronger in the valleys)
 '#endif';

const SC=FA.SC=new THREE.Scene();
SC.fog=new THREE.Fog(C(LOOK.fog.c),LOOK.fog.near,LOOK.fog.far);
const CAM=FA.CAM=new THREE.PerspectiveCamera(28,innerWidth/innerHeight,.5,1000); // far 1000, sky pinned to the far plane; near follows rig.d (z-fight fix)

// ---------------- lights ----------------
const hemi=new THREE.HemisphereLight(LOOK.hemi[0],LOOK.hemi[1],LOOK.hemi[2]);SC.add(hemi);
const SUNDIR=FA.SUNDIR=new THREE.Vector3(-1,.36,-.42).normalize(); // low warm key from the west, slightly behind (long shadows toward the viewer)
if(LOOK.sunEl!=null){const el=LOOK.sunEl*Math.PI/180,az=new THREE.Vector2(-1,-.42).normalize();SUNDIR.set(az.x*Math.cos(el),Math.sin(el),az.y*Math.cos(el));} // style: same azimuth, new elevation
if(LOOK.sunV)SUNDIR.set(LOOK.sunV[0],LOOK.sunV[1],LOOK.sunV[2]).normalize(); // C2: v4.4 key direction (fa4_build.js:235)
const sun=FA.sun=new THREE.DirectionalLight(LOOK.sun[0],LOOK.sun[1]);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;SC.add(sun,sun.target);
if(LOOK.fill[2]>0){const fill=new THREE.DirectionalLight(LOOK.fill[0],LOOK.fill[1]);const fv=LOOK.fillV||[80,50,90];fill.position.set(fv[0],fv[1],fv[2]);SC.add(fill);} // cool rim/fill, no shadow (off when IBL is the only ambient); C2: v4.4 rim position
if(LOOK.moon){const mo=new THREE.DirectionalLight(LOOK.moon[0],LOOK.moon[1]);mo.position.set(LOOK.moon[2][0],LOOK.moon[2][1],LOOK.moon[2][2]);SC.add(mo);FA.moon=mo;} // C2b: cool moon rim from behind (terrain relief + tree crowns), no shadow
// C2: v4.4 screen-space atmosphere layers (fa4_looks.js:9-10, :39-41) as two fixed overlays above the canvas, below labels/HUD; world view only
FA.RMOT=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(LOOK.overlay){const st=document.createElement('style');st.textContent='#faVig,#faGlow{position:fixed;inset:0;pointer-events:none;transition:opacity .6s}#faVig{background:'+LOOK.overlay.vig+'}#faGlow{mix-blend-mode:screen;background:'+LOOK.overlay.glow+
 ';animation:faHz 90s ease-in-out infinite alternate;transform-origin:50% 0}@keyframes faHz{0%{opacity:1;transform:translateX(0) scale(1.04)}35%{opacity:.84;transform:translateX(-2.2%) scale(1.04)}70%{opacity:.93;transform:translateX(1.6%) scale(1.06)}100%{opacity:.8;transform:translateX(2.6%) scale(1.04)}}'+
 '@media (prefers-reduced-motion:reduce){#faGlow{animation:none}}body.faClose #faVig,body.faClose #faGlow{opacity:0;animation:none}';document.head.appendChild(st);
 for(const id of['faVig','faGlow']){const d=document.createElement('div');d.id=id;document.getElementById('stage').appendChild(d);}}
FA.fitShadow=function(cx,cz,half,follow){if(!follow){FA.wFit=FA.VIEW==='world'?[cx,cz,half]:null;FA.shK='fit';}sun.target.position.set(cx,0,cz);sun.position.set(cx+SUNDIR.x*220,SUNDIR.y*220,cz+SUNDIR.z*220);
 const s=sun.shadow.camera;s.left=-half;s.right=half;s.top=half;s.bottom=-half;s.near=20;s.far=480;s.updateProjectionMatrix();sun.target.updateMatrixWorld();FA.shadowDirty=true;};
FA.setShadowRes=function(n){if(sun.shadow.mapSize.x===n)return;sun.shadow.mapSize.set(n,n);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}FA.shadowDirty=true;}; // C4: 4096 in close-up on the high tier

// ---------------- sky + PMREM environment ----------------
// display sky: gradient + horizon glow lobes + small sun lobe. capture sky (IBL): no narrow sun lobe (the key light is the sun),
// gain + clamp, ground-bounce colour below the horizon; gain auto-set so cosine-weighted sky radiance on flat ground = LOOK.ibl.amb.
function skyMat(capture,gain){const I=LOOK.ibl;return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{cZ:{value:C(LOOK.sky.zen)},cM:{value:C(LOOK.sky.mid)},cH:{value:C(LOOK.sky.hor)},cG:{value:C(LOOK.sky.glow)},cL:{value:C(LOOK.sky.low)},sunD:{value:SUNDIR},
  cB:{value:C(I&&I.bounce||LOOK.sky.low)},gain:{value:gain||1},clampV:{value:I?I.clamp:100.}},
 defines:capture&&I?{CAPTURE:1}:{},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=vec4(p.xy,p.w*.99999,p.w);}',
 fragmentShader:'uniform vec3 cZ,cM,cH,cG,cL,cB,sunD;uniform float gain,clampV;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;'+
 'vec3 c=y>0.?mix(cH,cM,smoothstep(0.,'+(LOOK.sky.bw||.20).toFixed(3)+',y)):mix(cH,cL,smoothstep(0.,-.10,y));c=mix(c,cZ,smoothstep(.20,.80,y));'+
 'float s=max(dot(d,normalize(sunD)),0.);float hb=exp(-abs(y-.02)*8.);\n'+
 '#ifdef CAPTURE\n c+=cG*(pow(s,5.)*.42*hb+hb*.07);c=mix(c,cB*.5,smoothstep(0.,-.08,y));c=min(c*gain,vec3(clampV));\n#else\n c+=cG*(pow(s,5.)*.42*hb+pow(s,60.)*.35+hb*'+(LOOK.sky.hbK!=null?LOOK.sky.hbK:.07).toFixed(3)+');\n#endif\n'+ // A2: all-round warm band .025 (the .07 band over blue read lavender)
 'gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});}
// JS mirror of the capture sky (no gain) to solve the IBL gain
function skyCapJS(d){const P=k=>C(LOOK.sky[k]);const H0=P('hor'),M=P('mid'),Z=P('zen'),G=P('glow'),y=d.y;
 const c=H0.clone().lerp(M,smooth(0,LOOK.sky.bw||.2,y));c.lerp(Z,smooth(.2,.8,y));const s=Math.max(0,d.dot(SUNDIR)),hb=Math.exp(-Math.abs(y-.02)*8);
 c.add(G.clone().multiplyScalar(Math.pow(s,5)*.42*hb+hb*.07));return c;}
let IBL_GAIN=1;
if(LOOK.ibl){const r=FA.rng(31),v=new THREE.Vector3();let sum=0,n=0;for(let i=0;i<1500;i++){const u1=r(),u2=r(),rr=Math.sqrt(u1),ph=u2*6.2832;v.set(rr*Math.cos(ph),Math.sqrt(1-u1),rr*Math.sin(ph));
  const c=skyCapJS(v);sum+=.2126*c.r+.7152*c.g+.0722*c.b;n++;}IBL_GAIN=Math.min(LOOK.ibl.cap||14,Math.max(1,LOOK.ibl.amb/(sum/n)));}
FA.IBL_GAIN=IBL_GAIN;
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,48,24),skyMat(false));sky.renderOrder=-10;sky.frustumCulled=false;SC.add(sky);FA.sky=sky;
{const ss=new THREE.Scene();ss.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),skyMat(true,IBL_GAIN)));
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
FA.puffTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=FA.rng(41);for(let k=0;k<7;k++){const x=20+r()*24,y=20+r()*24,rd=12+r()*10;
 const gr=g.createRadialGradient(x,y,0,x,y,rd);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}return new THREE.CanvasTexture(c);})();

// ---------------- batched VFX: all glows = 1 instanced draw, all smoke = 1 instanced draw ----------------
// glow handles keep the old sprite API (h.material.opacity) so animations stay unchanged; opacities are copied per frame.
FA.GLOWS=[];FA.SMOKES=[];
FA.glow=function(x,y,z,size,hex,k,an){const h={x,y,z,size,c:C(hex).multiplyScalar((k==null?.6:k)*LOOK.glowK),material:{opacity:1},an:an||null};FA.GLOWS.push(h);return h;}; // C2: an = [amp, period, phase, switch] (shader breath)
FA.smoke=function(x,y,z,period,phase,hex){FA.SMOKES.push({x,y,z,period,phase,c:C(LOOK.smokeC||hex||'#C9C5D0')});}; // C2b: LOOK.smokeC tints smoke toward the fog
FA.buildFx=function(GL,SM){const out=[];GL=GL||FA.GLOWS;SM=SM||FA.SMOKES; // B1: optional arrays -> per-site FX batch (lod.js lazy stand-ins); default = the global lists
 if(GL.length){const N=GL.length,g=new THREE.InstancedBufferGeometry();const b=new THREE.PlaneGeometry(1,1);g.index=b.index;g.setAttribute('position',b.attributes.position);g.setAttribute('uv',b.attributes.uv);
  const P=new Float32Array(N*3),Cc=new Float32Array(N*4),O=new Float32Array(N),BA=new Float32Array(N*4);GL.forEach((h,i)=>{P.set([h.x,h.y,h.z],i*3);Cc.set([h.c.r,h.c.g,h.c.b,h.size],i*4);O[i]=1;if(h.an)BA.set(h.an,i*4);});
  g.setAttribute('iP',new THREE.InstancedBufferAttribute(P,3));g.setAttribute('iC',new THREE.InstancedBufferAttribute(Cc,4));g.setAttribute('iB',new THREE.InstancedBufferAttribute(BA,4));const oa=new THREE.InstancedBufferAttribute(O,1);oa.setUsage(THREE.DynamicDrawUsage);g.setAttribute('iO',oa);g.instanceCount=N;
  const m=new THREE.ShaderMaterial({uniforms:{map:{value:FA.glowTex},uT:FA.TU.uT,uAn:FA.TU.uAn},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'uniform float uT;'+FA.BREATH_GLSL+'attribute vec3 iP;attribute vec4 iC;attribute vec4 iB;attribute float iO;varying vec2 vU;varying vec3 vC;varying float vO;void main(){vU=uv;vC=iC.rgb;vO=iO*faBr(iB,uT);vec4 mv=modelViewMatrix*vec4(iP,1.);mv.xy+=position.xy*iC.a;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D map;varying vec2 vU;varying vec3 vC;varying float vO;void main(){float t=texture2D(map,vU).a;float a=t*vO;'+
    (LOOK.post?'gl_FragColor=vec4(vC*(1.+t*t*'+LOOK.post.glowHDR.toFixed(2)+'),a);':'gl_FragColor=vec4(vC,a);')+'\n#include <encodings_fragment>\n}'}); // A2: HDR hot core -> threshold bloom on lamps/hearths only
  const me=new THREE.Mesh(g,m);me.frustumCulled=false;me.renderOrder=8;SC.add(me);FA.anims.push(()=>{if(!me.visible)return;let ch=false;GL.forEach((h,i)=>{const v=h.material.opacity;if(O[i]!==v){O[i]=v;ch=true;}});if(ch)oa.needsUpdate=true;});out.push(me);}
 if(SM.length){const N=SM.length,g=new THREE.InstancedBufferGeometry();const b=new THREE.PlaneGeometry(1,1);g.index=b.index;g.setAttribute('position',b.attributes.position);g.setAttribute('uv',b.attributes.uv);
  const P=new Float32Array(N*3),S=new Float32Array(N*2),Cc=new Float32Array(N*3);SM.forEach((h,i)=>{P.set([h.x,h.y,h.z],i*3);S.set([h.period,h.phase],i*2);Cc.set([h.c.r,h.c.g,h.c.b],i*3);});
  g.setAttribute('iP',new THREE.InstancedBufferAttribute(P,3));g.setAttribute('iS',new THREE.InstancedBufferAttribute(S,2));g.setAttribute('iC',new THREE.InstancedBufferAttribute(Cc,3));g.instanceCount=N;
  const m=new THREE.ShaderMaterial({uniforms:{map:{value:FA.puffTex},uT:FA.TU.uT},transparent:true,depthWrite:false,
   vertexShader:'uniform float uT;attribute vec3 iP;attribute vec2 iS;attribute vec3 iC;varying vec2 vU;varying vec3 vC;varying float vO;void main(){vU=uv;vC=iC;float u=fract(uT/iS.x+iS.y);'+
    'vec3 p=iP+vec3(u*1.6+sin(u*6.+iS.y*9.)*.12,u*'+(LOOK.smokeRise||3.4).toFixed(2)+',u*.5);float sc=(.4+u*1.7)*'+(LOOK.smokeS||1).toFixed(2)+';vO='+(.6*(LOOK.smokeK||1)).toFixed(3)+'*(1.-u)*smoothstep(0.,.08,u);vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=position.xy*sc;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D map;varying vec2 vU;varying vec3 vC;varying float vO;void main(){vec4 t=texture2D(map,vU);gl_FragColor=vec4(vC*t.rgb,t.a*vO);\n#include <encodings_fragment>\n}'});
  const me=new THREE.Mesh(g,m);me.frustumCulled=false;me.renderOrder=7;SC.add(me);out.push(me);}
 return out;};

// ---------------- static landmark merge (one draw per material instead of ~70 small meshes) ----------------
FA.STATIC=[];
FA.addStatic=function(...ms){for(const m of ms)FA.STATIC.push(m);};
FA.mergeStatic=function(){const groups={};for(const m of FA.STATIC){m.updateMatrix();const k=m.material.uuid+'|'+m.castShadow+'|'+m.receiveShadow+'|'+(m.userData.site||'');(groups[k]=groups[k]||[]).push(m);}
 let n=0;for(const k in groups){const L=groups[k],mat=L[0].material;if(L.length===1){SC.add(L[0]);n++;continue;}
  const useUV=!!mat.map,useC=!!mat.vertexColors;const pos=[],nor=[],uv=[],col=[];
  for(const m of L){const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());g.applyMatrix4(m.matrix);const p=g.attributes.position,q=g.attributes.normal;
   for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(q.getX(i),q.getY(i),q.getZ(i));
    if(useUV){const a=g.attributes.uv;uv.push(a?a.getX(i):0,a?a.getY(i):0);}if(useC){const a=g.attributes.color;col.push(a?a.getX(i):1,a?a.getY(i):1,a?a.getZ(i):1);}}g.dispose();}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  if(useUV)G.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(useC)G.setAttribute('color',new THREE.Float32BufferAttribute(col,3));G.computeBoundingSphere();
  const me=new THREE.Mesh(G,mat);me.castShadow=L[0].castShadow;me.receiveShadow=L[0].receiveShadow;me.renderOrder=L[0].renderOrder;if(L[0].userData.site)me.userData.site=L[0].userData.site;SC.add(me);n++;}
 FA.STATIC=[];return n;};
// crease band: darken the lowest `band` units of a (local-space) geometry by k (vertex colour; material needs vertexColors)
FA.crease=function(geo,y0,band,k,sy){sy=sy||1;const p=geo.attributes.position,n=p.count,c=new Float32Array(n*3);for(let i=0;i<n;i++){const y=(p.getY(i)-y0)*sy;const v=1-k*smooth(band,0,y);c[i*3]=c[i*3+1]=c[i*3+2]=v;}
 geo.setAttribute('color',new THREE.BufferAttribute(c,3));return geo;};

// ---------------- layout + sculpted heightfield ----------------
const GK=FA.GK={x:-30,z:6,top:3.9};const RV=FA.RV={x:30,z:-6};const WL=FA.WL=0.45;
const TW=280,TD=210;FA.TW=TW;FA.TD=TD;
FA.riverX=z=>RV.x+7.0+4.2*Math.sin((z-RV.z)*.045)+1.6*Math.sin(z*.11);
const riverX2=z=>-4.2*.045*.045*Math.sin((z-RV.z)*.045)-1.6*.11*.11*Math.sin(z*.11); // curvature sign -> outer bend side
const OC=LOOK.ter.oct;
function Hraw(x,z){let h=2.4+(fbm(x*.016+3.1,z*.016-1.7,Math.min(5,OC))-.5)*7;
 const r=fbm(x*.028+11,z*.028+5,Math.min(4,OC));h+=Math.pow(Math.max(0,r-.5),1.5)*30;
 h+=smooth(-30,-95,z)*(9+fbm(x*.035,z*.035,Math.min(5,OC))*20);               // back range (silhouette against the horizon glow)
 h+=smooth(90,135,Math.abs(x))*16*fbm(x*.05,z*.05+9,Math.min(4,OC));          // side rims
 // B1 terrain B (game-style smooth): gentle large-scale undulation (~90 u swells, +-1.5 u) + small surface noise (~8 u, +-.22 u);
 // faded out over low ground so no new puddles appear below the waterline. City / stand-in basins flatten it again in FA.H.
 if(TERB){const u=(fbm(x*.011+5.3,z*.011-2.9,3)-.5)*3.0+(fbm(x*.13+1.7,z*.13+8.1,2)-.5)*.45;h+=u*smooth(WL+.4,WL+2.6,h);}
 const s=LOOK.ter.terr;if(s>0){const q=h/s;h=(Math.floor(q)+smooth(LOOK.ter.hard,1,q-Math.floor(q)))*s;} // style terraces (risers = 1-hard of the step)
 return h;}
// river profile for facet terrain: width 0.8-2.6 along the course, deep line shifted to the outer bend, shallow shelf both sides,
// steep cut bank on the outer bend, gentle sand bar on the inner bend.
FA.riverW=z=>1.7+.9*Math.sin(z*.07+1.0);
// C7: analytic distance to the river centre line (perpendicular-corrected) + the waterline offset E. The archviz bank profile, the
// water alpha edge / foam / wave bands and the terrain shore band all use THIS (mirrored in GLSL by RIVER_GLSL) instead of the
// 1.1-u grid, so the shoreline is a smooth curve. (C6 root cause: water = grid cells below WL, edge + foam keyed on per-vertex
// depth interpolated across alternating-diagonal triangles -> regular sawtooth; per-face bank/bed/wet colours -> stepped bands.)
const riverXd=z=>.189*Math.cos((z-RV.z)*.045)+.176*Math.cos(z*.11);
FA.riverE=z=>FA.riverW(z)*.5+1.15;
FA.riverDs=(x,z)=>(x-FA.riverX(z))/Math.sqrt(1+riverXd(z)*riverXd(z));
FA.riverD=(x,z)=>Math.abs(FA.riverDs(x,z));
const RIVER_GLSL='\nfloat rvX(float z){return '+(RV.x+7).toFixed(3)+'+4.2*sin((z-('+RV.z.toFixed(3)+'))*.045)+1.6*sin(z*.11);}float rvXd(float z){return .189*cos((z-('+RV.z.toFixed(3)+'))*.045)+.176*cos(z*.11);}'+
 'float rvE(float z){return (1.7+.9*sin(z*.07+1.))*.5+1.15;}float rvD(vec2 p){float d=rvXd(p.y);return abs(p.x-rvX(p.y))/sqrt(1.+d*d);}\n';
function riverFacet(x,z,h){const k=smooth(-75,-30,z);if(k<=0)return h;const rc=FA.riverX(z),dx=x-rc,rw=FA.riverW(z)*.5+.4;const outer=-Math.sign(riverX2(z))||1;
 if(LOOK.archviz){ // C7: one continuous profile, waterline exactly at analytic t=.35 beyond E-.75 (slope .16 there, no shelf step)
  const ds=FA.riverDs(x,z),ad=Math.abs(ds),side=Math.sign(ds)===outer?1:0,off=.3*rw*outer,au=Math.abs(ds-off),land=Math.max(h,WL+.55),t=ad-rw-.75;
  const u=Math.min(1,au/(rw+Math.abs(off)));const yb=WL-.12-(.5+.3*Math.sin(z*.05))*(1-u*u);let y;
  if(t<.35)y=yb+.16*Math.max(0,t+.4);
  else{const W=side?.9:3.6,f=smooth(.35,.35+W,t);y=WL+.16*(t-.35)*(1-f)+(land-WL)*f;}
  return lerp(land,y,k);}
 const side=Math.sign(dx)===outer?1:0;const off=.3*rw*outer;const ad=Math.abs(dx),au=Math.abs(dx-off);const land=Math.max(h,WL+.55);let y;
 if(ad<rw){const u=Math.min(1,au/(rw+Math.abs(off)));y=WL-.12-(.5+.3*Math.sin(z*.05))*(1-u*u);}
 else if(ad<rw+.75)y=WL-.12;
 else{const t=ad-rw-.75,W=side?.6:3.6;y=lerp(WL+.06,land,smooth(0,W,t));if(!side)y=Math.min(y,lerp(WL+.06,land,smooth(W*.5,W*1.6,t)));}
 return lerp(land,y,k);}
// B1 r4 halo fix: max basin-flattening weight of the stand-in / protown site basins at (x,z) (same warp as FA.H). The terrain colour
// bands use the UNFLATTENED height inside a basin (lerp by this weight), because the flattened floor (h0 2.6 / 1.6) sat in the lower
// meadow band while its surroundings were heath -> a lighter round plate under every protown town in the world view.
FA.basinW=function(x,z){let m=0;if(FA.SITEB)for(const s of FA.SITEB){const ex=x-s.x,ez=z-s.z,ds=Math.hypot(ex,ez);if(ds>s.rb*1.7+24)continue;
  const w=s.p1==null||!FA.LOD||!FA.LOD.warp?s.rb+1:s.rb+1+s.rb*FA.LOD.warp(s,Math.atan2(ez,ex))+Math.max(0,(fbm(x*.07+s.p1,z*.07+s.p2,2)-.5)*7);m=Math.max(m,smooth(w+20,w,ds));}return m;};
FA.HRAW=(x,z)=>Hraw(x,z);FA.HALOFIX=Q.get('halofix')!=='0';
FA.H=function(x,z){let h=Hraw(x,z);
 let d=Math.hypot(x-GK.x,z-GK.z);h=lerp(h,2.6,LOOK.archviz?smooth(31,24,d):smooth(17,11.5,d));                       // Gatekeeper plinth bed
 d=Math.hypot(x-RV.x,z-RV.z);h=lerp(h,1.0+(fbm(x*.09,z*.09,3)-.5)*.7,smooth(24,10,d));    // Reversion valley floor (low banks so the wheel reaches the stream)
 const wm=Math.hypot(x-(RV.x-12),z-(RV.z-8));h+=1.6*smooth(5,1.5,wm)*smooth(24,10,d);      // windmill knoll
 if(FA.SITEB)for(const s of FA.SITEB){const ex=x-s.x,ez=z-s.z,ds=Math.hypot(ex,ez);if(ds>s.rb*1.7+24)continue;   // B0 stress stand-in basins (lod.js)
  // B1 r3: noise-warped footprint (outward only) + 20 u feathered blend instead of a 9 u ring (owner 11-16: no round disc)
  const w=s.p1==null||!FA.LOD||!FA.LOD.warp?s.rb+1:s.rb+1+s.rb*FA.LOD.warp(s,Math.atan2(ez,ex))+Math.max(0,(fbm(x*.07+s.p1,z*.07+s.p2,2)-.5)*7);
  h=lerp(h,s.h0,smooth(w+20,w,ds));}
 if(LOOK.ter.facet){h=riverFacet(x,z,h);return FA.carveH?FA.carveH(x,z,h):h;}   // C7: carveH = prostream brook trench (archviz RV only)
 const dx=Math.abs(x-FA.riverX(z)),rw=1.5+.35*Math.sin(z*.07);
 h=Math.max(h,WL+.55);h=lerp(h,WL-.8,smooth(rw+2.4,rw*.5,dx)*smooth(-75,-30,z));          // river channel (springs at the foot of the back range)
 return h;};
FA.slope=(x,z)=>{const e=.6;const a=FA.H(x+e,z)-FA.H(x-e,z),b=FA.H(x,z+e)-FA.H(x,z-e);return Math.hypot(a,b)/(2*e);};

// ---------------- kit loader + instancing with baked vertex AO ----------------
FA.MODELS={};FA.PL={};FA.AOS=[];
const matCache={};
// A2 per-material indirect tint compensation: the violet-blue sky IBL turned kit greens teal; warm the indirect diffuse only
FA.warmIndirect='';if(LOOK.kitWarm)FA.warmIndirect='\nreflectedLight.indirectDiffuse*=vec3('+LOOK.kitWarm.map(v=>v.toFixed(3)).join(',')+');';
// A2 window glow (Gatekeeper kit buildings only): blue glass texels darken to night glass; ~45 % of windows lit warm 2900 K (HDR -> bloom)
const WIN_GLSL='\n#ifdef USE_FOG\n{vec3 tc=diffuseColor.rgb/max(vColor,vec3(.2));float w=smoothstep(.02,.08,tc.b-tc.r)*step(tc.g*.9,tc.b)*(1.-smoothstep(.35,.6,abs(dot(normal,(viewMatrix*vec4(0.,1.,0.,0.)).xyz))));vec3 hp=floor(vFogWP*vec3(2.6,3.2,2.6));float hh=fract(sin(dot(hp,vec3(12.9898,78.233,37.719)))*43758.5453);'+
 'float lit=step(.5,hh);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.035,.04,.06),w*.8);totalEmissiveRadiance+=vec3(1.,.58,.26)*w*lit*(1.5+1.7*fract(hh*7.13))'+(Q.has('dbgwin')?'+vec3(0.,4.,0.)*w*lit+vec3(4.,0.,4.)*w*(1.-lit)':'')+';}\n#endif\n';
function kitMat(m,key){const win=!!(LOOK.a2&&key&&/^b[A-F]$/.test(key));const isT=!!(key&&/^tree/.test(key)),dim=isT?(LOOK.kitTree?LOOK.kitTree.dim:1):(LOOK.kitDim||1),tf=isT&&LOOK.kitTree?LOOK.kitTree.fill:null; // C2b: kit dim (RV roofs bloomed) + cool tree fill
 const ck=m.uuid+(win?'w':'')+(isT?'t':'');if(matCache[ck])return matCache[ck];const W=LOOK.props.white;const n=new THREE.MeshStandardMaterial({map:W?null:m.map,color:W?C(W):(m.color||C('#fff')),roughness:.82,metalness:0,vertexColors:true,envMapIntensity:LOOK.env});
 const sat=LOOK.props.sat,doSat=!W&&sat!==1;
 const xtra=(dim!==1?'diffuseColor.rgb*='+dim.toFixed(3)+';':'');const tfS=tf?'\nreflectedLight.indirectDiffuse+=vec3('+tf.map(v=>v.toFixed(3)).join(',')+')*(.5+diffuseColor.g*2.);':'';
 if(doSat||win||FA.warmIndirect||xtra||tfS){n.onBeforeCompile=sh=>{let f=sh.fragmentShader;if(doSat||xtra)f=f.replace('#include <map_fragment>','#include <map_fragment>\n{float l=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(l),diffuseColor.rgb,'+(doSat?sat:1).toFixed(3)+');'+xtra+'}');
  if(win)f=f.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>'+WIN_GLSL);if(FA.warmIndirect||tfS)f=f.replace('#include <lights_fragment_end>','#include <lights_fragment_end>'+FA.warmIndirect+tfS);sh.fragmentShader=f;};
  n.customProgramCacheKey=()=>'kit'+(doSat?sat:1)+(win?'w':'')+(FA.warmIndirect?'k':'')+dim.toFixed(2)+(tf?'f':'');} // style: prop desaturation, A2 window glow + indirect warm
 if(n.map){n.map.encoding=THREE.sRGBEncoding;n.map.anisotropy=4;}matCache[ck]=n;return n;}
FA.load=function(list){const L=new THREE.GLTFLoader();return Promise.all(Object.entries(list).map(([k,u])=>new Promise((res)=>{
 L.load(u,g=>{const root=g.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);const parts=[];const hgt=Math.max(.001,box.max.y-box.min.y);
  root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();const p=geo.attributes.position,n=p.count,col=new Float32Array(n*3),v=new THREE.Vector3();
   for(let i=0;i<n;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const t=(v.y-box.min.y)/hgt;const ao=.42+.58*smooth(0,.38,t);col[i*3]=col[i*3+1]=col[i*3+2]=ao;} // contact gradient (baked AO)
   geo.setAttribute('color',new THREE.BufferAttribute(col,3));parts.push({geo,mat:kitMat(Array.isArray(o.material)?o.material[0]:o.material,k),m:o.matrixWorld.clone(),name:o.name});});
  FA.MODELS[k]={parts,box};res();},undefined,e=>{window.__errs.push('load '+u+': '+(e&&e.message));res();});})));};
// placement matrix: footprint w (max of x/z extent) or height h; base sits at y
FA.pm=function(k,x,y,z,o){o=o||{};const M=FA.MODELS[k];if(!M)return null;const b=M.box,sx=b.max.x-b.min.x,sz=b.max.z-b.min.z,sy=b.max.y-b.min.y;
 const s=o.s||(o.h?o.h/sy:(o.w||1)/Math.max(sx,sz));const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;if(o.along!=null)o.ry=o.along+(sz>sx?Math.PI/2:0);
 const m=new THREE.Matrix4().makeTranslation(x,y,z).multiply(new THREE.Matrix4().makeRotationY(o.ry||0)).multiply(new THREE.Matrix4().makeScale(s,s*(o.sy||1),s)).multiply(new THREE.Matrix4().makeTranslation(-cx,-b.min.y,-cz));
 return {m,s,fw:Math.max(sx,sz)*s,h:sy*s,sx:sx*s,sz:sz*s};};
const SQ=/^(home|watermill|windmill|well|b[A-F]$)/;
FA.put=function(k,x,z,o){o=o||{};const y=o.y!=null?o.y:FA.H(x,z)-(o.sink||.04);const r=FA.pm(k,x,y,z,o);if(!r)return null;(FA.PL[k]=FA.PL[k]||[]).push(r.m);
 if(o.ao!==false)FA.AOS.push({x,z,r:r.fw*.62+.3,k:o.aok||.35,sq:SQ.test(k),ry:o.ry||0,sx:r.sx,sz:r.sz,y:o.y});return r;};
FA.buildInstances=function(){let n=0;for(const[k,arr]of Object.entries(FA.PL)){const M=FA.MODELS[k];if(!M||!arr.length)continue;
 for(const p of M.parts){const im=new THREE.InstancedMesh(p.geo,p.mat,arr.length);const t=new THREE.Matrix4();arr.forEach((m,i)=>{t.multiplyMatrices(m,p.m);im.setMatrixAt(i,t);});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;SC.add(im);n++;}}return n;};
// a single animated kit model (watermill wheel, windmill fan): returns {group, spin(partNameFilter, speed)}
FA.single=function(k,x,z,o){o=o||{};const y=o.y!=null?o.y:FA.H(x,z)-.05;const r=FA.pm(k,x,y,z,o);const M=FA.MODELS[k];if(!r)return null;const out=[];
 for(const p of M.parts){const me=new THREE.Mesh(p.geo,p.mat);me.matrixAutoUpdate=false;me.matrix.multiplyMatrices(r.m,p.m);me.castShadow=me.receiveShadow=true;SC.add(me);out.push({me,p,base:r.m});}
 FA.AOS.push({x,z,r:r.fw*.6+.3,k:.4,sq:true,ry:o.ry||0,sx:r.sx,sz:r.sz});
 return {r,parts:out,spinner(filter){const q=out.find(e=>e.p.name.toLowerCase().includes(filter));if(!q)return null;q.p.geo.computeBoundingBox();const bb=q.p.geo.boundingBox,e=new THREE.Vector3().subVectors(bb.max,bb.min);
   const ax=e.x<=e.y&&e.x<=e.z?new THREE.Vector3(1,0,0):(e.z<=e.y?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0));const rot=new THREE.Matrix4();
   return a=>{rot.makeRotationAxis(ax,a);q.me.matrix.multiplyMatrices(q.base,q.p.m).multiply(rot);};}};};

// ---------------- terrain mesh (slope/height/moisture colour, baked AO, detail normals, cloud shadows) ----------------
FA.TU={uT:{value:0},uAn:{value:FA.RMOT?0:1}}; // C2: uAn = light animation on/off (prefers-reduced-motion -> 0)
// C2 calm light animation (pools, lamp glows): b = (amplitude, period s, phase, switch flag). Breathes 1 +- amp; switchers go dark
// ~28 % of their slots (slot = 2.7 periods), as a few street lamps occasionally switching. Pure function of uT -> no CPU per frame.
FA.BREATH_GLSL='uniform float uAn;float faBr(vec4 b,float t){if(uAn<.5||b.y<=0.)return 1.;float w=1.+b.x*sin(6.2832*t/b.y+b.z);'+
 'if(b.w>0.){float s=floor(t/(b.y*2.7)+b.z);float h=fract(sin(s*91.7+b.z*37.1)*4375.85);w*=1.-.88*step(.72,h);}return w;}\n';
const TER_COMMON='#include <common>\nuniform float uT;\nfloat cH2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat cN2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(cH2(i),cH2(i+vec2(1,0)),f.x),mix(cH2(i+vec2(0,1)),cH2(i+vec2(1,1)),f.x),f.y);}';
const CLOUD='{vec2 q=vFogWP.xz*.028+vec2(uT*.012,uT*.004);float cl=cN2(q)*.6+cN2(q*2.1+3.)*.4;outgoingLight*=1.-.16*smoothstep(.52,.78,cl);}\n';
function terrainMat(T){const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,envMapIntensity:LOOK.envTer!=null?LOOK.envTer:LOOK.env*.7,flatShading:!!T.flat});
 if(T.nrm>0){const nm=FA.noiseNormal(128,1.4,11);nm.repeat.set(70,52);mat.normalMap=nm;mat.normalScale=new THREE.Vector2(T.nrm,T.nrm);}
 const CL=T.contour>0?'{float hq=vFogWP.y/'+T.contour.toFixed(3)+';float fw=max(fwidth(hq),1e-4);float ln=1.-smoothstep(.0,1.2,abs(fract(hq-.5)-.5)/fw);float major=step(4.5,mod(floor(hq+.5),5.));outgoingLight=mix(outgoingLight,outgoingLight*vec3('+C(T.line).toArray().map(v=>v.toFixed(3)).join(',')+')*1.6,ln*(.30+.30*major));}\n':'';
 // A2 survey engraving (matte, faint): 10-unit grid + 2.6-unit contours in a band along the map edge, tiny '+' marks every 50 units inside
 const SV=LOOK.a2?'{vec2 wp=vFogWP.xz;float ed=min('+(TW/2).toFixed(1)+'-abs(wp.x),'+(TD/2).toFixed(1)+'-abs(wp.y));float band=1.-smoothstep(5.,18.,ed);vec2 fw=max(fwidth(wp),vec2(1e-3));'+
  'vec2 g=abs(fract(wp/10.+.5)-.5)*10.;vec2 ln=1.-smoothstep(vec2(0.),fw*1.3,g);float gl=max(ln.x,ln.y);float hq=vFogWP.y/2.6;float fh=max(fwidth(hq),1e-4);float cl=1.-smoothstep(0.,1.1,abs(fract(hq-.5)-.5)/fh);'+
  'vec2 c5=abs(fract(wp/50.+.5)-.5)*50.;float cr=(1.-smoothstep(0.,fw.x*1.3,min(c5.x,c5.y)))*step(max(c5.x,c5.y),1.1);float e=max(max(gl*.13,cl*.10)*band,cr*.18);outgoingLight*=1.-e;}\n':'';
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;
  // B1 terrain B: small-scale albedo grain (2 octaves, +-7 %) so smooth slopes do not read as plastic at close range
  const GR=TERB?'{vec2 p=vFogWP.xz;float g=cN2(p*.55)*.6+cN2(p*1.9+5.)*.4;outgoingLight*=.93+.14*g;}\n':'';
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',TER_COMMON).replace('#include <output_fragment>','#ifdef USE_FOG\n'+GR+CLOUD+CL+SV+'#endif\n#include <output_fragment>');
  if(LOOK.archviz){const SHc=LOOK.shore||{mud:'#463E31',sand:'#9A8E76',silt:'#4E5E60'},v3=h=>{const q=C(h);return 'vec3('+q.r.toFixed(4)+','+q.g.toFixed(4)+','+q.b.toFixed(4)+')';};
   // C7: smooth-normal blend (aSN) + analytic shore band: silt -> sand under the shallow water, wet mud ~1 u above the waterline,
   // a faint pale gravel strip fading into the meadow. All keyed on rvD (distance to the river spline), never on the grid.
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aSN;varying vec4 vSN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSN=vec4(mat3(viewMatrix)*aSN.xyz,aSN.w);');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 vSN;'+RIVER_GLSL)
    .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nif(dot(vSN.xyz,vSN.xyz)>.01)normal=normalize(mix(normal,normalize(vSN.xyz),vSN.w));')
    .replace('#include <color_fragment>','#include <color_fragment>\n#ifdef USE_FOG\n{float rk=smoothstep(-75.,-30.,vFogWP.z);float t=rvD(vFogWP.xz)-rvE(vFogWP.z);if(rk>0.&&t<4.5){float n=cN2(vFogWP.xz*vec2(1.9,.6));'+
     'float wet=(1.-smoothstep(.3,1.0+.6*n,t))*rk;vec3 c=mix(diffuseColor.rgb,'+v3(SHc.mud)+'*(.8+.4*n),wet*.88);'+
     'float gv=smoothstep(.55,1.1,t)*(1.-smoothstep(1.5,3.2+n,t));c=mix(c,mix('+v3(SHc.sand)+',diffuseColor.rgb,.55),gv*.32*rk);'+
     'float sub=(1.-smoothstep(.12,.42,t))*rk;vec3 bed=mix('+v3(SHc.sand)+','+v3(SHc.silt)+',smoothstep(.1,-1.2,t))*(.85+.3*n);diffuseColor.rgb=mix(c,bed,sub);}}\n#endif');}};
 mat.customProgramCacheKey=()=>'ter'+FA.STYLE;return mat;}
function addSkirtTable(){if(LOOK.a2&&FA.A2){FA.A2.frame();return;} // A2: instrument-table frame (js/a2.js)
 const sk=new THREE.Mesh(new THREE.BoxGeometry(TW+.4,10,TD+.4),new THREE.MeshStandardMaterial({color:LOOK.skirt,roughness:1}));sk.position.y=-5.4;SC.add(sk);
 // matte table beyond the model edge, so a low camera never sees the bright below-horizon sky band past the map corner
 if(LOOK.table){const t=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshStandardMaterial({color:LOOK.table,roughness:1,envMapIntensity:.5}));t.rotation.x=-Math.PI/2;t.position.y=-10.3;SC.add(t);}}
FA.buildTerrain=function(colorHook){const T=LOOK.ter;if(T.facet)return buildFacetTerrain(colorHook);const SX=Math.round(TW/T.cell),SZ=Math.round(TD/T.cell);const g=new THREE.PlaneGeometry(TW,TD,SX,SZ);g.rotateX(-Math.PI/2);
 const p=g.attributes.position,n=p.count,NX=SX+1;const hs=new Float32Array(n);
 for(let i=0;i<n;i++){const x=p.getX(i),z=p.getZ(i);hs[i]=FA.H(x,z);p.setY(i,hs[i]);}
 g.computeVertexNormals();const nr=g.attributes.normal;const col=new Float32Array(n*3);const c=new THREE.Color();
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
 const m=new THREE.Mesh(g,terrainMat(T));m.receiveShadow=true;m.castShadow=true;SC.add(m);
 addSkirtTable();
 // water (sun glints + sky env reflections, scrolling detail normals)
 const wn=FA.noiseNormal(128,2.2,23);wn.repeat.set(36,27);FA.waterN=wn;
 const w=new THREE.Mesh(new THREE.PlaneGeometry(TW,TD),new THREE.MeshStandardMaterial({color:LOOK.water.c,roughness:LOOK.water.r,metalness:0,normalMap:wn,normalScale:new THREE.Vector2(.16,.16),envMapIntensity:.75}));
 w.rotation.x=-Math.PI/2;w.position.y=WL;w.receiveShadow=true;SC.add(w);
 return m;};

// ---- facet terrain (bluefacet): tensor grid (fine 1.1 around Reversion + the river, 2.8 elsewhere), vertices jittered +-0.25 cell,
// quad diagonal by the smaller height difference, non-indexed, one colour per face snapped to palette bands (+-2 %), horizon AO per vertex.
function axis(min,max,a,b,fine,coarse){const out=[];const seg=(s,e,st)=>{const n=Math.max(1,Math.ceil((e-s)/st));for(let i=0;i<n;i++)out.push(s+(e-s)*i/n);};const mid=(fine+coarse)/2,T=10; // graded fine->mid->coarse (no visible density seam)
 seg(min,a-T,coarse);seg(a-T,a,mid);seg(a,b,fine);seg(b,b+T,mid);seg(b+T,max,coarse);out.push(max);return out;}
// C6: the facet grid is shared (lazy, deterministic) so other modules can drape on the REAL terrain triangles before the mesh exists.
// Root cause of the jagged field edges (C5): terrain faces got the balk colour per face (1.1-u triangles) around the field rectangles and
// field vertices sat on the analytic height (+.05), not on the facet planes. FA.Hm = exact facet height; FA.terTris(i,j) = the cell's 2 triangles.
let TGR=null;
function tgrid(){if(TGR)return TGR;const T=LOOK.ter;const xs=axis(-TW/2,TW/2,6,49,T.fine,T.cell),zs=axis(-TD/2,TD/2,-32,22,T.fine,T.cell);const NX=xs.length,NZ=zs.length;
 const VX=new Float32Array(NX*NZ),VZ=new Float32Array(NX*NZ),VH=new Float32Array(NX*NZ);
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const k=j*NX+i;let x=xs[i],z=zs[j];
  if(i>0&&i<NX-1&&j>0&&j<NZ-1){const cx=Math.min(xs[i+1]-x,x-xs[i-1]),cz=Math.min(zs[j+1]-z,z-zs[j-1]);x+=(hash(i*1.3,j*.7)-.5)*.5*cx;z+=(hash(i*.9+7,j*1.7+3)-.5)*.5*cz;}
  VX[k]=x;VZ[k]=z;VH[k]=FA.H(x,z);}
 TGR={xs,zs,NX,NZ,VX,VZ,VH};return TGR;}
FA.tgrid=()=>LOOK.ter.facet?tgrid():null;
FA.terTris=function(i,j){const G=tgrid(),NX=G.NX,VH=G.VH,k00=j*NX+i,k10=k00+1,k01=k00+NX,k11=k01+1;
 return Math.abs(VH[k00]-VH[k11])<=Math.abs(VH[k10]-VH[k01])?[[k00,k01,k11],[k00,k11,k10]]:[[k00,k01,k10],[k10,k01,k11]];};
FA.terCell=function(x,z){const G=tgrid();const bs=(a,v)=>{let lo=0,hi=a.length-2;while(lo<hi){const m=(lo+hi+1)>>1;if(a[m]<=v)lo=m;else hi=m-1;}return lo;};return [bs(G.xs,x),bs(G.zs,z)];};
FA.Hm=function(x,z){if(!LOOK.ter.facet)return FA.H(x,z);const G=tgrid(),c=FA.terCell(x,z),X=G.VX,Z=G.VZ,Y=G.VH;
 for(let dj=0;dj<=2;dj++)for(let di=0;di<=2;di++){const i=c[0]+(di===2?-1:di),j=c[1]+(dj===2?-1:dj);if(i<0||j<0||i>G.NX-2||j>G.NZ-2)continue;
  for(const t of FA.terTris(i,j)){const a=t[0],b=t[1],d=t[2];const x1=X[b]-X[a],z1=Z[b]-Z[a],x2=X[d]-X[a],z2=Z[d]-Z[a],den=x1*z2-x2*z1;if(Math.abs(den)<1e-9)continue;
   const px=x-X[a],pz=z-Z[a],u=(px*z2-x2*pz)/den,v=(x1*pz-px*z1)/den;if(u>=-1e-5&&v>=-1e-5&&u+v<=1+1e-5)return Y[a]+(Y[b]-Y[a])*u+(Y[d]-Y[a])*v;}}
 return FA.H(x,z);};
function buildFacetTerrain(colorHook){const T=LOOK.ter;const G=tgrid(),xs=G.xs,zs=G.zs,NX=G.NX,NZ=G.NZ;FA.EDGE={xs,zs};
 const VX=G.VX,VZ=G.VZ,VH=G.VH,VA=new Float32Array(NX*NZ);
 // horizon AO (8 dirs x 2 radii) sampled from the analytic height
 for(let k=0;k<NX*NZ;k++){const x=VX[k],z=VZ[k],h=VH[k];let occ=0;for(let a=0;a<8;a++){const ca=Math.cos(a*.785),sa=Math.sin(a*.785);for(const rr of[2.8,8.4]){occ+=Math.max(0,FA.H(x+ca*rr,z+sa*rr)-h)*1.4/rr;}}VA[k]=1-Math.min(.42,occ*.085);}
 const P={};for(const kk in T.P)P[kk]=C(T.P[kk]);const pos=[],col=[];const wpos=[],wdep=[];const c=new THREE.Color(),a=new THREE.Vector3(),b=new THREE.Vector3(),nn=new THREE.Vector3();
 // C7 (archviz): per-vertex analytic smooth normal + blend weight (Reversion basin + river corridor) -> the fragment shader blends the
 // flat facet normal toward it, so the 1.1-u facets stop reading as angular steps / dark wedges on the valley floor and banks
 let SNv=null;const snA=[];if(LOOK.archviz){SNv=new Float32Array(NX*NZ*4);const e=.35;for(let k=0;k<NX*NZ;k++){const x=VX[k],z=VZ[k];
   let m=Math.max(.72*smooth(28,20,Math.hypot(x-RV.x,z-RV.z)),.72*smooth(-75,-30,z)*smooth(FA.riverE(z)+7,FA.riverE(z)+4,FA.riverD(x,z)));
   if(FA.TER==='b')m=1;else if(FA.TER==='c'&&FA.SITEB_ALL)for(const s of FA.SITEB_ALL)m=Math.max(m,smooth(s.rb+3,s.rb-2,Math.hypot(x-s.x,z-s.z)));  // B0 ter C: smooth basins
   if(m<=0)continue;
   const gx=(FA.H(x+e,z)-FA.H(x-e,z))/(2*e),gz=(FA.H(x,z+e)-FA.H(x,z-e))/(2*e),l=Math.hypot(gx,1,gz);SNv[k*4]=-gx/l;SNv[k*4+1]=1/l;SNv[k*4+2]=-gz/l;SNv[k*4+3]=m;}}
 // B1 terrain B: colour PER VERTEX (interpolated across faces -> no per-face bands / steps). Slope from the analytic smooth normal,
 // height bands with noisy soft edges, dirt/scree at the mountain foot + slope breaks, rock on steep faces; palette = the look's ter.P.
 let VC=null;if(SNv&&TERB){VC=new Float32Array(NX*NZ*3);const q=new THREE.Color(),PH=P.heath||P.mid,PK=P.rock.clone().lerp(P.snow,.5);
  for(let k=0;k<NX*NZ;k++){const x=VX[k],z=VZ[k],h0=VH[k],sl=1-SNv[k*4+1],mo=fbm(x*.05+40,z*.05-20,3),n2=fbm(x*.19+3.7,z*.19-6.1,2)-.5;
   const bw=FA.HALOFIX?FA.basinW(x,z):0,h=bw>0?lerp(h0,Math.max(h0,FA.HRAW(x,z)),bw):h0;              // B1 r4: colour bands from the unflattened height in site basins
   if(bw>0)VA[k]=lerp(VA[k],Math.min(1,VA[k]+.08),bw);                                            // and a softer occlusion ring at the basin wall
   q.copy(P.lo).lerp(P.mid,smooth(.36,.66,mo));                                                   // meadow: 2 moisture tones, blended
   q.lerp(PH,smooth(4.5,9,h+n2*3));q.lerp(P.hi,smooth(10,16,h+n2*4));q.lerp(PK,smooth(19,30,h+n2*5)*.7); // upland bands, noisy soft edges
   let sf=1;if(FA.SITEB)for(const s of FA.SITEB){const d=Math.hypot(x-s.x,z-s.z);sf=Math.min(sf,smooth(s.rb*1.1,s.rb*1.7+26,d));}   // B1 r3: no scree ring at a site's feathered basin edge
   const foot=smooth(.06,.16,sl+n2*.05)*(1-smooth(.30,.44,sl))*sf;q.lerp(P.bank,foot*.42*(1-smooth(14,20,h))); // dirt / scree at slope breaks
   q.lerp(P.rock,smooth(.24+n2*.12,.47,sl));                                                      // rock on steep faces
   if(h<WL-.2)q.lerp(P.bed,.8);
   if(colorHook)colorHook(x,z,h,sl,q);
   const v=1-T.vary/2+T.vary*hash(x*.37,z*.53);q.multiplyScalar(VA[k]*v*(.97+.06*n2));VC[k*3]=q.r;VC[k*3+1]=q.g;VC[k*3+2]=q.b;}}
 const face=(k0,k1,k2)=>{const x=(VX[k0]+VX[k1]+VX[k2])/3,z=(VZ[k0]+VZ[k1]+VZ[k2])/3,h=(VH[k0]+VH[k1]+VH[k2])/3;
  if(VC){for(const kk of[k0,k1,k2]){pos.push(VX[kk],VH[kk],VZ[kk]);col.push(VC[kk*3],VC[kk*3+1],VC[kk*3+2]);snA.push(SNv[kk*4],SNv[kk*4+1],SNv[kk*4+2],SNv[kk*4+3]);}
   if(Math.min(VH[k0],VH[k1],VH[k2])<WL){for(const kk of[k0,k1,k2]){wpos.push(VX[kk],WL,VZ[kk]);wdep.push(WL-VH[kk]);}}return;}
  a.set(VX[k1]-VX[k0],VH[k1]-VH[k0],VZ[k1]-VZ[k0]);b.set(VX[k2]-VX[k0],VH[k2]-VH[k0],VZ[k2]-VZ[k0]);nn.crossVectors(b,a).normalize();if(nn.y<0)nn.negate();const sl=1-nn.y;
  const mo=fbm(x*.05+40,z*.05-20,3),dx=Math.abs(x-FA.riverX(z));
  // palette bands: meadow (2 moisture tiers) -> heath -> upland -> snow-rock; risers/steep faces = rock; river sand bar / bed
  if(h>20)c.copy(P.snow).lerp(P.rock,.35);else if(h>12)c.copy(P.hi);else if(h>6.5)c.copy(P.heath);else c.copy(mo>.52?P.mid:P.lo);
  // C7: the binary meadow moisture threshold made per-face stepped dark patches (lower-left / south lane); around Reversion blend it
  if(LOOK.archviz&&h<=6.5){const wr=smooth(42,30,Math.hypot(x-RV.x,z-RV.z));if(wr>0)c.lerp(P.lo.clone().lerp(P.mid,smooth(.42,.62,mo)),wr);}
  const rk=smooth(-75,-30,z),rvA=LOOK.archviz&&rk>0&&FA.riverD(x,z)<FA.riverE(z)+4.6; // C7: archviz river corridor = meadow per face, shore band painted analytically in the shader
  if(sl>.36&&!rvA)c.copy(P.rock).lerp(c,sl>.55?0:.45);
  else c.multiplyScalar(Math.floor(h/T.terr)%2?1.02:.98);                                 // alternate terrace shelves +-2 % so the steps read
  if(!rvA){if(rk>0&&dx<FA.riverW(z)*.5+5.0&&h<WL+.9)c.copy(P.bank);if(rk>0&&h<WL-.2)c.copy(P.bed);else if(rk>0&&h<WL-.02)c.copy(P.bank).multiplyScalar(.82);} // shelf bed = wet sand (seen through shallow water)
  if(colorHook)colorHook(x,z,h,sl,c);
  if(!rvA&&rk>0&&h>WL&&h<WL+.38&&dx<8)c.multiplyScalar(.78);                                   // wet band just above the waterline
  const ao=(VA[k0]+VA[k1]+VA[k2])/3,v=1-T.vary/2+T.vary*hash(x*.37,z*.53);c.multiplyScalar(ao*v);
  for(const kk of[k0,k1,k2]){pos.push(VX[kk],VH[kk],VZ[kk]);col.push(c.r,c.g,c.b);if(SNv)snA.push(SNv[kk*4],SNv[kk*4+1],SNv[kk*4+2],SNv[kk*4+3]);}
  if(Math.min(VH[k0],VH[k1],VH[k2])<WL){for(const kk of[k0,k1,k2]){wpos.push(VX[kk],WL,VZ[kk]);wdep.push(WL-VH[kk]);}}};
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const k00=j*NX+i,k10=k00+1,k01=k00+NX,k11=k01+1;
  if(Math.abs(VH[k00]-VH[k11])<=Math.abs(VH[k10]-VH[k01])){face(k00,k01,k11);face(k00,k11,k10);}else{face(k00,k01,k10);face(k10,k01,k11);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));if(SNv)g.setAttribute('aSN',new THREE.Float32BufferAttribute(snA,4));g.computeVertexNormals();
 const m=new THREE.Mesh(g,terrainMat(T));m.receiveShadow=true;m.castShadow=!LOOK.archviz;SC.add(m);FA.terrainTris=pos.length/9;
 addSkirtTable();
 // water: only the cells below the waterline, depth per vertex -> depth tint (shallow->deep), stepped foam lines at the shore
 const wn=FA.noiseNormal(128,2.2,23);wn.repeat.set(36,27);FA.waterN=wn;const W=LOOK.water;
 const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wpos,3));wg.setAttribute('aDep',new THREE.Float32BufferAttribute(wdep,1));
 const uv=[];for(let i=0;i<wpos.length;i+=3)uv.push(wpos[i]/TW+.5,wpos[i+2]/TD+.5);wg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));wg.computeVertexNormals();
 const wm=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:W.r,metalness:0,normalMap:wn,normalScale:new THREE.Vector2(.12,.12),envMapIntensity:W.env!=null?W.env:1.0,transparent:true,depthWrite:false});
 const v3=h=>{const q=C(h);return 'vec3('+q.r.toFixed(4)+','+q.g.toFixed(4)+','+q.b.toFixed(4)+')';};
 wm.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aDep;varying float vDep;').replace('#include <begin_vertex>','#include <begin_vertex>\nvDep=aDep;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',TER_COMMON+'\nvarying float vDep;'+RIVER_GLSL);
  if(LOOK.archviz){
   // C7: river corridor (m) uses the analytic spline distance: depth tint dark centre -> lighter shallows, alpha feathered out before the
   // geometric waterline (t=.35), a faint broken foam line + one parallel wave band + slow flow streaks, all following the spline
   const RV_='float rk=smoothstep(-75.,-30.,vFogWP.z);float t=rvD(vFogWP.xz)-rvE(vFogWP.z);float m=rk*(1.-smoothstep(1.5,3.,t));';
   sh.fragmentShader=sh.fragmentShader
    .replace('#include <color_fragment>','#ifdef USE_FOG\n{'+RV_+'float dz=mix(smoothstep(.1,.55,vDep),smoothstep(.0,-1.5,t),m);float fl=cN2(vec2(rvD(vFogWP.xz)*2.6,vFogWP.z*.32-uT*.22));'+
     'diffuseColor.rgb=mix('+v3(W.sh)+','+v3(W.dp)+',dz)*(1.+.16*(fl-.5)*m*dz);diffuseColor.a=mix(.40,.93,dz)*mix(1.,1.-smoothstep(-.3,.1,t),m);}\n#else\n'+
     '{float dz=smoothstep(.1,.55,vDep);diffuseColor.rgb='+v3(W.sh)+'*(1.-dz)+'+v3(W.dp)+'*dz;diffuseColor.a=mix(.42,.93,dz);}\n#endif')
    .replace('#include <output_fragment>','#ifdef USE_FOG\n{'+RV_+'float n=cN2(vec2(vFogWP.z*.9,t*2.)+vec2(-uT*.25,0.));float br=smoothstep(.34,.5,cN2(vec2(vFogWP.z*.38+11.,uT*.05)));'+
     'float f1=(1.-smoothstep(0.,.045,abs(t+.05+.035*n)))*br;float f2=(1.-smoothstep(0.,.03,abs(t+.42+.07*n)))*smoothstep(.5,.62,n);'+
     'float fo=(1.-smoothstep(.008,.018,vDep-.006*n))*step(-.002,vDep)*step(.32,cN2(vFogWP.xz*vec2(.9,.3)+7.));float f=mix(fo*.75,max(f1*.5,f2*.22),m);'+
     'outgoingLight=mix(outgoingLight,'+v3(W.foam)+'*.5,f);diffuseColor.a=max(diffuseColor.a,f*.7);}\n#endif\n#include <output_fragment>');}
  else sh.fragmentShader=sh.fragmentShader
   .replace('#include <color_fragment>','{float dz=smoothstep(.1,.55,vDep);diffuseColor.rgb='+v3(W.sh)+'*(1.-dz)+'+v3(W.dp)+'*dz;diffuseColor.a=mix(.42,.93,dz);}')
   .replace('#include <output_fragment>','#ifdef USE_FOG\n{float n=cN2(vFogWP.xz*vec2(1.7,.55)+vec2(0.,-uT*.3));float br=step(.32,cN2(vFogWP.xz*vec2(.9,.3)+7.));float f1=(1.-smoothstep(.008,.018,vDep-.006*n))*br*step(-.002,vDep);float f2=(1.-smoothstep(.0,.006,abs(vDep-.07-.025*n)))*step(.5,n);'+
    'float f=max(f1*.75,f2*.4);outgoingLight=mix(outgoingLight,'+v3(W.foam)+'*.5,f);diffuseColor.a=max(diffuseColor.a,f*.85);}\n#endif\n#include <output_fragment>');};
 wm.customProgramCacheKey=()=>'waterF';
 const w=new THREE.Mesh(wg,wm);w.renderOrder=3;w.receiveShadow=true;SC.add(w);FA.waterTris=wpos.length/9;
 return m;}

// ---------------- contact AO decals (instanced; radial for trees/props, rounded rectangle for buildings) ----------------
function decalTex(rect){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 if(!rect){const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.45,'rgba(0,0,0,.7)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
 else{g.filter='blur(7px)';g.fillStyle='#000';g.fillRect(17,17,30,30);}
 const t=new THREE.CanvasTexture(c);return t;}
FA.buildDecals=function(){if(!LOOK.contact)return 0;let n=0;
 for(const rect of[false,true]){const L=FA.AOS.filter(q=>!!q.sq===rect&&q.r<14);if(!L.length)continue;
  const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
  const mat=new THREE.MeshBasicMaterial({color:'#0C0A16',alphaMap:decalTex(rect),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,fog:true});
  mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n diffuseColor.a *= vColor.r;\n#endif');};mat.customProgramCacheKey=()=>'decal';
  const im=new THREE.InstancedMesh(g,mat,L.length);const M=new THREE.Matrix4(),q=new THREE.Quaternion(),qy=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),nv=new THREE.Vector3(),cc=new THREE.Color();let k=0;
  for(const d of L){const e=.5,hx=FA.H(d.x+e,d.z)-FA.H(d.x-e,d.z),hz=FA.H(d.x,d.z+e)-FA.H(d.x,d.z-e);nv.set(-hx/(2*e),1,-hz/(2*e)).normalize();if(d.y==null&&1-nv.y>.5)continue;
   let y;if(d.y!=null)y=d.y;else{const sz=Math.max(.4,d.r*.9);y=Math.max(FA.H(d.x,d.z),FA.H(d.x+sz,d.z),FA.H(d.x-sz,d.z),FA.H(d.x,d.z+sz),FA.H(d.x,d.z-sz));}
   const fw=Math.max(.3,(d.r-.3)/.62);if(rect){s.set((d.sx||fw)*1.45/0.47,1,(d.sz||fw)*1.45/0.47);}else{const dd=fw*1.5;s.set(dd,1,dd);}
   qy.setFromAxisAngle(up,d.ry||0);q.setFromUnitVectors(up,d.y!=null?up:nv).multiply(qy);p.set(d.x,y+.035,d.z);M.compose(p,q,s);im.setMatrixAt(k,M);
   const op=Math.min(.45,Math.max(.25,d.k*.95))*LOOK.aoK;im.setColorAt(k,cc.setRGB(op,op,op));k++;}
  im.count=k;im.renderOrder=2;im.frustumCulled=false;SC.add(im);n+=k;}
 return n;};

// ---------------- grass + tree scatter (instanced) ----------------
FA.tufts=function(cands){if(LOOK.cm)cands=cands.filter((c,i)=>i%5<2); // bluefacet: 40 % of the tufts (they read as specks at blue-hour contrast)
 const g=LOOK.a2?(function(){const pos=[];for(let k=0;k<3;k++){const a=k*2.094+.4,l=.16,cx=Math.cos(a),cz=Math.sin(a);pos.push(-cz*.05,0,cx*.05, cz*.05,0,-cx*.05, cx*l,.30+k*.03,cz*l);} // A2: 3 leaning blades (not specks)
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.computeVertexNormals();const n=G.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,n.getX(i)*.4,1,n.getZ(i)*.4);n.normalize&&0;return G;})()
  :new THREE.ConeGeometry(.09,.32,3);if(!LOOK.a2)g.translate(0,.16,0);
 const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:LOOK.cm?'#ffffff':LOOK.tuft,roughness:.9,envMapIntensity:.4*(LOOK.cm?2:1),side:LOOK.a2?THREE.DoubleSide:THREE.FrontSide}),cands.length); // cm: white base so instance colour is not squared
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),pv=new THREE.Vector3(),cc=new THREE.Color();
 cands.forEach((c,i)=>{const k=(.7+Math.random()*.9)*(c[3]||1);s.set(k,k*(.8+Math.random()*.7),k);q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28);pv.set(c[0],FA.H(c[0],c[1])-.03,c[1]);m.compose(pv,q,s);im.setMatrixAt(i,m);
  cc.setHSL(.20+Math.random()*.06,.22+Math.random()*.12,.36+Math.random()*.12);if(FA.STYLE!=='pilot'){const hsl={};C(LOOK.tuft).getHSL(hsl);cc.setHSL(hsl.h+(Math.random()-.5)*.04,hsl.s*(.8+Math.random()*.4),hsl.l*(.9+Math.random()*.2));}if(c[2])cc.set(c[2]).multiplyScalar(.82+Math.random()*.3);im.setColorAt(i,cc);});
 im.receiveShadow=true;im.frustumCulled=false;SC.add(im);return im;};

// ---------------- facet far-field trees (bluefacet): 2 archetypes (stacked hex cones = conifer, 6-sided bicone = broadleaf), 12 tris each,
// 2-4 per clump spot, per-instance scale / lean / yaw / hue (bigger + darker inside a clump). 1 draw call instead of 300k-tri kit clusters.
FA.FARTREES=[];
FA.buildFarTrees=function(){const L=FA.FARTREES;if(!L.length)return null;const r=FA.rng(57);
 const con=new THREE.ConeGeometry(.42,1.0,6,1,true);con.translate(0,.5,0);const con2=new THREE.ConeGeometry(.32,.75,6,1,true);con2.translate(0,1.05,0);
 const geoC=mergeSimple([con,con2]);const bl=new THREE.ConeGeometry(.5,.62,6,1,true);bl.translate(0,.62,0);const bl2=new THREE.ConeGeometry(.5,.38,6,1,true);bl2.rotateX(Math.PI);bl2.translate(0,.12,0);
 const geoB=mergeSimple([bl,bl2]);const base=LOOK.farTree?{c:C(LOOK.farTree.c),b:C(LOOK.farTree.b)}:LOOK.a2?{c:C('#48633F'),b:C('#728244')}:{c:C('#41604C'),b:C('#677D46')};const out=[]; // A2: less blue in the far-tree greens (teal under the violet IBL)
 for(const kind of['c','b']){const S=[];for(const t of L){const n=2+((r()*3)|0);for(let i=0;i<n;i++){const a=r()*6.283,d=r()*t.w*.42;if((kind==='c')!==(r()<.62))continue;S.push([t.x+Math.cos(a)*d,t.z+Math.sin(a)*d,t.w,1-d/(t.w*.42+.01)]);}}
  if(!S.length)continue;const im=new THREE.InstancedMesh(kind==='c'?geoC:geoB,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.88,flatShading:true,envMapIntensity:LOOK.env}),S.length);
  const M=new THREE.Matrix4(),q=new THREE.Quaternion(),ql=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),ax=new THREE.Vector3(),cc=new THREE.Color(),hsl={};base[kind].getHSL(hsl);
  S.forEach((t,i)=>{const inner=t[3];const sc=lerp(.75,1.35,r())*lerp(.85,1.15,inner)*(t[2]/1.8)*1.25;const sy=sc*lerp(.9,1.25,r());
   q.setFromAxisAngle(ax.set(0,1,0),r()*6.283);ql.setFromAxisAngle(ax.set(r()-.5,0,r()-.5).normalize(),(r()*6+FA.slope(t[0],t[1])*8)*Math.PI/180);q.premultiply(ql);
   p.set(t[0],FA.H(t[0],t[1])-.05,t[1]);s.set(sc,sy,sc);M.compose(p,q,s);im.setMatrixAt(i,M);
   cc.setHSL(hsl.h+(r()-.5)*.05,hsl.s*lerp(.85,1.1,r()),hsl.l*lerp(.88,1.08,r())*(1-.12*inner));im.setColorAt(i,cc);});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;SC.add(im);out.push(im);}
 return out;};
function mergeSimple(gs){const pos=[],nor=[];for(const g0 of gs){const g=g0.index?g0.toNonIndexed():g0;const p=g.attributes.position;for(let i=0;i<p.count;i++)pos.push(p.getX(i),p.getY(i),p.getZ(i));}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.computeVertexNormals();return G;}

// ---------------- data-layer road stub (unlit, no fog, no tone mapping, dark outline) ----------------
FA.road=function(pts,w,hex,yTop){const cu=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])));const N=90,ps=cu.getSpacedPoints(N);
 // A2 drape: centreline height = upper envelope of the terrain across the ribbon (max filter +-3 samples) smoothed twice (+-3),
 // so the ribbon glides over terrace risers instead of stair-stepping; both edges share the centre height.
 let YC=null;if(LOOK.a2){const raw=ps.map((p,i)=>{const a=ps[Math.max(0,i-1)],b=ps[Math.min(N,i+1)];const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;const nx=-dz/l,nz=dx/l;let m=-1e9;
   for(const s of[-1,-.5,0,.5,1]){const x=p.x+nx*(w/2+.35)*s,z=p.z+nz*(w/2+.35)*s;let y=FA.H(x,z);if(yTop&&yTop(x,z)!=null)y=yTop(x,z);m=Math.max(m,y);}return Math.max(m,WL);});
  const mf=raw.map((v,i)=>{let m=v;for(let k=-3;k<=3;k++)m=Math.max(m,raw[Math.min(N,Math.max(0,i+k))]);return m;});
  let sm=mf;for(let it=0;it<2;it++)sm=sm.map((v,i)=>{let s=0;for(let k=-3;k<=3;k++)s+=sm[Math.min(N,Math.max(0,i+k))];return s/7;});
  YC=sm.map((v,i)=>Math.max(v,raw[i]-.12));}
 function ribbon(width,lift,colr,op,ro){const pos=[],idx=[];for(let i=0;i<=N;i++){const a=ps[Math.max(0,i-1)],b=ps[Math.min(N,i+1)];const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;const nx=-dz/l,nz=dx/l;
   for(const sgn of[-1,1]){const x=ps[i].x+nx*width/2*sgn,z=ps[i].z+nz*width/2*sgn;let y=FA.H(x,z);if(yTop&&yTop(x,z)!=null)y=yTop(x,z);if(YC)y=YC[i];pos.push(x,Math.max(y,WL)+lift,z);}
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
 rg.fov=28;rg.shift=0;FA.eyeBase=-.22;
 if(FA.VIEW==='world'&&LOOK.worldCam){const k=LOOK.worldCam;Object.assign(rg,{tx:c===GK?-k.tx:k.tx,ty:0,tz:k.tz,d:k.d,pitch:k.pitch,yaw:c===GK?.08:-.08,fov:k.fov||28});FA.fitShadow(0,-6,135);} // A2: pulled back so the instrument-table rim + scale read in the world view
 if(FA.VIEW==='close'&&LOOK.closeCam&&LOOK.closeCam[FA.CITY]){const k=LOOK.closeCam[FA.CITY];Object.assign(rg,{yaw:k.yaw,pitch:k.pitch,d:k.d,ty:k.ty,fov:k.fov||28,shift:k.shift||0});if(k.eye!=null)FA.eyeBase=k.eye;FA.shadowDirty=true;if(LOOK.archviz&&c===GK)FA.fitShadow(c.x,c.z,27);} // A2: lower close-up, lens shift up -> a strip of graded sky + horizon glow in frame
 // C4: Reversion close-up deep-link framed empty terraces (target sat 3 u east of the village, 40 u out): aim at the hamlet centroid, tighter
 if(FA.VIEW==='close'&&c===RV&&LOOK.archviz&&FA.RVSITE){const S=FA.RVSITE;let x=0,z=0;S.homes.forEach(h=>{x+=h.x;z+=h.z;});x/=S.homes.length;z/=S.homes.length;x=x*.8+S.vx*.2;z=z*.8+S.vz*.2;
  Object.assign(rg,{tx:x,tz:z,ty:FA.H(x,z)+(LOOK.closeCam.reversion.ty||.4)});FA.fitShadow(x,z,15);}
 FA.setShadowRes(FA.VIEW==='close'&&FA.Q==='high'?4096:2048);
 if(FA.closeOnly)for(const o of FA.closeOnly)o.visible=FA.VIEW==='close'; // C4: lane weeds / gravel / ground pools / crop relief only in close-up
 if(LOOK.exposureWorld)R.toneMappingExposure=FA.VIEW==='world'?LOOK.exposureWorld:LOOK.exposure;  // fixed exposure per view, no auto-exposure
 document.body.classList.toggle('faClose',FA.VIEW!=='world');FA.kick&&FA.kick(1500); // C2: v4.4 overlays only in world view
 FA.applyCam();FA.ui&&FA.ui();if(FA.PROFLORA&&FA.PROFLORA.on)FA.PROFLORA.setView();if(FA.LOD&&FA.LOD.on)FA.LOD.update(true);};
FA.applyCam=function(){const r=FA.rig;CAM.position.set(r.tx+Math.sin(r.yaw)*Math.cos(r.pitch)*r.d,r.ty+Math.sin(r.pitch)*r.d,r.tz+Math.cos(r.yaw)*Math.cos(r.pitch)*r.d);CAM.lookAt(r.tx,r.ty,r.tz);
 const nr=Math.min(4,Math.max(.5,r.d*.02));let up=false;if(Math.abs(CAM.near-nr)>.01){CAM.near=nr;up=true;}
 const fv=r.fov||28,sh=r.shift||0;if(CAM.fov!==fv){CAM.fov=fv;up=true;}if(sh>0){if(!CAM.view||!CAM.view.enabled||Math.abs(CAM.view.offsetY+innerHeight*sh)>.5||CAM.view.fullWidth!==innerWidth||CAM.view.fullHeight!==innerHeight){CAM.setViewOffset(innerWidth,innerHeight,0,-innerHeight*sh,innerWidth,innerHeight);up=false;}}else if(CAM.view&&CAM.view.enabled){CAM.clearViewOffset();up=false;}
 if(up)CAM.updateProjectionMatrix();};   // near grows with distance: depth precision at world zoom; A2 close-up fov + vertical lens shift (sky strip)
{let drag=null;const el=R.domElement;el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:FA.rig.yaw,pitch:FA.rig.pitch};FA.kick();});
 addEventListener('pointerup',()=>drag=null);addEventListener('pointermove',e=>{if(!drag)return;FA.rig.yaw=drag.yaw-(e.clientX-drag.x)*.005;FA.rig.pitch=Math.min(1.35,Math.max(.12,drag.pitch+(e.clientY-drag.y)*.004));FA.applyCam();FA.kick();});
 el.addEventListener('wheel',e=>{e.preventDefault();FA.rig.d=Math.min(330,Math.max(FA.VIEW==='close'?6:14,FA.rig.d*Math.exp(e.deltaY*.0012)));FA.applyCam();FA.kick();},{passive:false});
 addEventListener('keydown',()=>FA.kick());}
addEventListener('resize',()=>{CAM.aspect=innerWidth/innerHeight;CAM.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);FA.kick();});

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
// legacy screen-band tilt-shift (style exploration only): OFF by default since A1 - it blurred the eye; opt in with ?ts=1. Depth-based DOF comes with the post chain.
const TS=(LOOK.ts>0&&Q.get('ts')==='1')?(function(){const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});
 const mat=new THREE.ShaderMaterial({uniforms:{tD:{value:rt.texture},res:{value:new THREE.Vector2(1,1)},amt:{value:LOOK.ts*15.0},band:{value:.12},cy:{value:.50}},depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D tD;uniform vec2 res;uniform float amt,band,cy;varying vec2 vU;void main(){float d=max(0.,abs(vU.y-cy)-band)/(1.-band);float r=amt*smoothstep(0.,.5,d);vec4 a=texture2D(tD,vU);float n=1.;'+
  'if(r>.3){for(int i=0;i<16;i++){float fi=float(i);float rr=sqrt((fi+.5)/16.)*r;float an=fi*2.39996;a+=texture2D(tD,vU+vec2(cos(an),sin(an))*rr/res);n+=1.;}}gl_FragColor=a/n;\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});
 const s=new THREE.Scene(),c=new THREE.OrthographicCamera(-1,1,1,-1,0,1),q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;s.add(q);return {rt,s,c,q};})():null;
FA.TS=TS;
{const t=document.querySelector('#hud .t');if(t)t.textContent+=' · style: '+STYLES[FA.STYLE].name;}
FA.anims=[];const clock=new THREE.Clock();let fr=0,acc=0,lastInfo='',lastSh=-1;FA.T=0;
FA.perf={steady:null,shadow:null};
// B1 r4 composer AA hook (a2.js is not B1-owned: the chain is wrapped here, not edited). MSAA samples are set before the scene target is
// first allocated; FXAA redirects the chain's final screen pass (setRenderTarget(null)) into an LDR target, then one FXAA pass to screen.
FA.postAA=function(P){if(P.rtS)P.rtS.samples=FA.MSAA;const base=P.render;let rtF=null,mF=null,qs=null,qc=null;
 P.render=function(){const fx=FA.AA==='fxaa'||(FA.AA==='auto'&&R.getPixelRatio()<1.75);FA.fxaaOn=fx;if(!fx)return base();
  const w=R.domElement.width,h=R.domElement.height;
  if(!rtF){rtF=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
   mF=new THREE.ShaderMaterial({uniforms:{tI:{value:null},px:{value:new THREE.Vector2()}},depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:['uniform sampler2D tI;uniform vec2 px;varying vec2 vU;',   // FXAA (Lottes, console variant) + local-contrast early out
     'void main(){const vec3 L=vec3(.299,.587,.114);vec3 cM=texture2D(tI,vU).rgb;float lM=dot(cM,L);',
     ' float lNW=dot(texture2D(tI,vU+vec2(-1.,-1.)*px).rgb,L),lNE=dot(texture2D(tI,vU+vec2(1.,-1.)*px).rgb,L),lSW=dot(texture2D(tI,vU+vec2(-1.,1.)*px).rgb,L),lSE=dot(texture2D(tI,vU+vec2(1.,1.)*px).rgb,L);',
     ' float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE))),lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));',
     ' if(lMax-lMin<max(.0312,lMax*.125)){gl_FragColor=vec4(cM,1.);return;}',
     ' vec2 d=vec2(-((lNW+lNE)-(lSW+lSE)),(lNW+lSW)-(lNE+lSE));float rd=max((lNW+lNE+lSW+lSE)*.03125,1./128.);float rc=1./(min(abs(d.x),abs(d.y))+rd);',
     ' d=clamp(d*rc,vec2(-8.),vec2(8.))*px;vec3 A=.5*(texture2D(tI,vU+d*(1./3.-.5)).rgb+texture2D(tI,vU+d*(2./3.-.5)).rgb);',
     ' vec3 B=A*.5+.25*(texture2D(tI,vU-d*.5).rgb+texture2D(tI,vU+d*.5).rgb);float lB=dot(B,L);gl_FragColor=vec4((lB<lMin||lB>lMax)?A:B,1.);}'].join('\n')});
   qs=new THREE.Scene();qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mF);q.frustumCulled=false;qs.add(q);}
  if(rtF.width!==w||rtF.height!==h)rtF.setSize(w,h);
  const sr=R.setRenderTarget;R.setRenderTarget=function(t,a,b){return sr.call(R,t==null?rtF:t,a,b);};
  try{base();}finally{R.setRenderTarget=sr;}
  mF.uniforms.tI.value=rtF.texture;mF.uniforms.px.value.set(1/w,1/h);R.setRenderTarget(null);R.render(qs,qc);};};
// B1 r4 shadow follow (NEAR detail in WORLD view): when the world camera is closer than FA.SHF_D (110 u) to its target, the sun shadow
// frustum is refitted around the view (half = max(16, .8 d), shifted .3 half forward along the view), quantised (half in 1.25x steps,
// centre on a half/4 grid) so it refits only a few times per dolly; at d >= 110 the go() world fit is restored. ?shf=0 off.
// 2048 map: world fit 135 u half = .13 u/texel -> d 30: 24 u half = .023 u/texel (5.6x finer) without a second cascade.
FA.SHF=Q.get('shf')!=='0'&&LOOK.archviz;FA.SHF_D=+(Q.get('shfd')||110);FA.shK='';FA.shFits=0;
FA.shFollow=function(){if(!FA.SHF||FA.VIEW!=='world'||!FA.wFit||!FA.rig)return;const rg=FA.rig;
 if(rg.d>=FA.SHF_D){if(FA.shK!=='fit'&&FA.shK!=='w'){FA.shK='w';FA.fitShadow(FA.wFit[0],FA.wFit[1],FA.wFit[2],true);}return;}
 let half=Math.max(16,rg.d*.8);half=Math.min(FA.wFit[2],Math.pow(1.25,Math.ceil(Math.log(half)/Math.log(1.25))));
 const vx=rg.tx-CAM.position.x,vz=rg.tz-CAM.position.z,vl=Math.hypot(vx,vz)||1,g=half*.25;
 const cx=Math.round((rg.tx+vx/vl*half*.3)/g)*g,cz=Math.round((rg.tz+vz/vl*half*.3)/g)*g,k=half.toFixed(2)+','+cx.toFixed(1)+','+cz.toFixed(1);
 if(k===FA.shK)return;FA.shK=k;FA.shFits++;FA.fitShadow(cx,cz,half,true);};
const fpsEl=document.getElementById('fps');if(Q.get('fps')==='1')fpsEl.style.display='block';
FA.frame=function(){if(FA.IDLE)FA.IDLE.renders++;if(FA.LOD&&FA.LOD.on&&FA.LOD.farMeshes)FA.LOD.update();  // B0 LOD tiers (throttled 120 ms)
const dt=Math.min(.1,clock.getDelta());FA.T=FA.TFIX!=null?FA.TFIX:FA.T+dt;FA.TU.uT.value=FA.T; // C2: clamp .05 -> .1 so the 15-30 fps ambient cap keeps real-time animation speed
 if(FA.waterN){FA.waterN.offset.set(FA.T*.006,FA.T*.011);}
 for(const a of FA.anims)a(FA.T,dt);sky.position.copy(CAM.position);
 if(!FA._aniso){FA._aniso=1;FA.anisoN=FA.anisoSweep(SC);}   // B1 r4: before the first upload of any texture
 {const e=CAM.matrixWorld.elements,k=e[12]+e[13]*1.3+e[14]*1.7+e[8]*7+e[9]*11+e[10]*13;if(k!==FA._camK){FA._camK=k;FA.camMovedAt=performance.now();}}   // B1 r4: camera-move clock (LOD stand-in hold / idle prebuild)
 FA.shFollow();
 // on-demand shadow map: after a view change, and at ~10 Hz in close-up where the wheel / fan / eyelids move (world zoom: they are sub-pixel)
 let sh=false;if(FA.shadowDirty||(FA.VIEW==='close'&&FA.TFIX==null&&FA.T-lastSh>.1)){R.shadowMap.needsUpdate=true;FA.shadowDirty=false;lastSh=FA.T;sh=true;}
 if(LOOK.post)R.info.reset();
 if(TS){const w=R.domElement.width,h=R.domElement.height;if(TS.rt.width!==w||TS.rt.height!==h)TS.rt.setSize(w,h);TS.q.material.uniforms.res.value.set(w,h);
  R.setRenderTarget(TS.rt);R.render(SC,CAM);R.setRenderTarget(null);R.render(TS.s,TS.c);}
 else if(LOOK.post&&FA.A2){if(!FA.POST){FA.POST=FA.A2.makePost();if(FA.POST)FA.postAA(FA.POST);}FA.POST.render();}   // A2: HDR target -> bloom -> Neutral + grade (draw calls include the 10 post passes); B1 r4: + MSAA samples / FXAA
 else R.render(SC,CAM);FA.placeMarkers();
 {const i=R.info.render;FA.perf[sh?'shadow':'steady']={calls:i.calls,tris:i.triangles};}
 fr++;acc+=dt;if(acc>.5&&fpsEl.style.display==='block'){const i=R.info,P=FA.perf;lastInfo='fps '+(fr/acc).toFixed(0)+' · '+(acc/fr*1000).toFixed(1)+' ms · calls '+(P.steady?P.steady.calls:i.render.calls)+' · tris '+((P.steady?P.steady.tris:i.render.triangles)/1000).toFixed(0)+'k'+
  (P.shadow?' (shadow-refresh frame '+P.shadow.calls+' / '+(P.shadow.tris/1000).toFixed(0)+'k)':'')+' · geo '+i.memory.geometries+' · tex '+i.memory.textures+' · dpr '+R.getPixelRatio()+' · '+(FA.ambFps?'ambient cap '+FA.ambFps+' fps':'interactive')+(FA.LOD&&FA.LOD.hud?' · '+FA.LOD.hud():'');fpsEl.textContent=lastInfo;fr=0;acc=0;}
 if(FA.wantClip){FA.wantClip=false;FA.clip=FA.measureClip();}};
// C2: v4.4-style render loop (fa4_labels.js:308-320): full display rate while the user interacts (kick), ~30 fps ambient,
// ~15 fps after 30 s without input, nothing while the tab is hidden. All light animation is a pure function of uT in shaders,
// so the ambient ticks cost one frame each and no per-frame CPU work beyond the existing anims.
FA.activeUntil=0;FA.lastInput=performance.now();FA.ambFps=0;let lastF=0;
FA.kick=function(ms){const n=performance.now();FA.lastInput=n;FA.activeUntil=Math.max(FA.activeUntil,n+(ms||900));};
// C2 wrap-up: idle no longer renders at 30/15 fps (a headless SwiftShader tab sat at ~290 % CPU idle). The light animation is slow
// (breath periods 3-9 s, switch slots ~10-25 s), so idle ticks run at FA.IDLE_FPS[0] for 30 s after input, then FA.IDLE_FPS[1];
// reduced motion (uAn 0) or ?idle=0 -> no idle frames at all (pure on-demand). Interaction (kick) still renders every rAF.
// C5 (owner decision A): idle renders at FA.IDLE_FPS[0] (30) while any continuously moving element is ON SCREEN (water wheel,
// windmill sails, Gatekeeper eye / spire ring, drones, wind sway of near trees = FA.PROFLORA.moving()), else FA.IDLE_FPS[1] (10).
// Interaction still every rAF; reduced motion (uAn 0) or ?idle=0 -> no idle frames; document.hidden -> nothing at all.
// Movers register with FA.mover({x,y,z,r,n}) | ({o:Object3D,r,n}) | ({fn:()=>bool,n}); "on screen" = sphere inside the frustum
// and >= 1.5 px projected radius; re-tested every 250 ms. FA.IDLE = {on, mode, fps, moving:[names], renders} for tests.
FA.IDLE_FPS=Q.get('idle')==='0'?[0,0]:[30,10];
FA.IDLE={on:Q.get('idle')!=='0',mode:'init',fps:0,moving:[],renders:0};FA.MOVERS=[];FA.mover=m=>{FA.MOVERS.push(m);return m;};
const _fr=new THREE.Frustum(),_pm=new THREE.Matrix4(),_sp=new THREE.Sphere(),_wp=new THREE.Vector3();let lastMv=-1e9;
// B0 owner decision 11-16 (option 2): in WORLD view ambient movers (windmill sails, spire ring, stream, ...) never hold 30 fps;
// world idle = 10 fps unless an ending is hovered / in showcase (FA.LOD.hot). `?idlepx=<n>` restores the size-based mover rule for tests.
FA.WORLD_MOVERS=Q.get('idlepx')!=null;
FA.movingNow=function(){if(FA.TFIX!=null)return [];if(FA.VIEW==='world'&&!FA.WORLD_MOVERS)return [];CAM.updateMatrixWorld();_pm.multiplyMatrices(CAM.projectionMatrix,CAM.matrixWorldInverse);_fr.setFromProjectionMatrix(_pm);
 const out=[],ms=FA.eyePos?FA.MOVERS.concat([{x:FA.eyePos.x,y:FA.eyePos.y,z:FA.eyePos.z,r:1.6,n:'eye'}]):FA.MOVERS,hp=R.domElement.height/2/Math.tan(CAM.fov*Math.PI/360),hpc=innerHeight/2/Math.tan(CAM.fov*Math.PI/360);
 for(const m of ms){try{if(m.vis&&!m.vis())continue;if(m.fn){if(m.fn())out.push(m.n||'fn');continue;}
  if(m.o){if(!m.o.visible||!m.o.parent)continue;m.o.getWorldPosition(_wp);}else if(m.p)_wp.copy(m.p());else _wp.set(m.x,m.y,m.z);_sp.set(_wp,m.r||1);
  // B0 idle rule (owner decision 3 option B): world view counts a mover only when its projected DIAMETER >= FA.IDLE_PX (12 CSS px);
  // close-up keeps the C5 rule (projected radius >= 1.5 device px)
  if(!_fr.intersectsSphere(_sp))continue;const d=Math.max(.1,_wp.distanceTo(CAM.position));
  if(FA.VIEW==='world'?2*(m.r||1)/d*hpc>=FA.IDLE_PX:(m.r||1)/d*hp>=1.5)out.push(m.n||'?');}catch(e){}}
 return out;};
FA.loop=function(n){requestAnimationFrame(FA.loop);const I=FA.IDLE;if(document.hidden){I.mode='hidden';I.fps=FA.ambFps=0;return;}n=n||performance.now();const busy=n<FA.activeUntil||Q.get('anim')==='1';
 let f=0;if(busy)I.mode='interactive';
 else if(!I.on||FA.TU.uAn.value<.5){I.mode='off';I.fps=FA.ambFps=0;return;}
 else{if(n-lastMv>250){I.moving=FA.movingNow();lastMv=n;}const hot=FA.LOD&&FA.LOD.hot();I.hot=hot;
  f=FA.IDLE_FPS[(I.moving.length||hot)?0:1];I.mode=hot?'hot:'+hot:I.moving.length?'moving':'still';if(!f){I.fps=FA.ambFps=0;return;}}  // B0: hovered / showcase ending -> 30 fps
 I.fps=f;const gap=busy?0:1000/f;FA.ambFps=busy?0:f;if(n-lastF<gap-3)return;lastF=n;const tf=performance.now();FA.frame();FA.mark('frame',tf,performance.now());if(busy)FA.DPR.note(n);};
FA.info=()=>({calls:R.info.render.calls,tris:R.info.render.triangles,geometries:R.info.memory.geometries,textures:R.info.memory.textures,programs:(R.info.programs||[]).length,dpr:R.getPixelRatio(),perf:FA.perf,terrainTris:FA.terrainTris,waterTris:FA.waterTris,iblGain:FA.IBL_GAIN});
// clipped-pixel check (P2): share of pixels with any channel > 240, measured right after a render
FA.measureClip=function(){const cv=R.domElement,w=cv.width,h=cv.height;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(cv,0,0);
 const d=g.getImageData(0,0,w,h).data;let n=0,mx=0;for(let i=0;i<d.length;i+=4){const m=Math.max(d[i],d[i+1],d[i+2]);if(m>240)n++;if(m>mx)mx=m;}return {over240:n,share:+(n/(w*h)*100).toFixed(3),max:mx,w,h};};
})();
