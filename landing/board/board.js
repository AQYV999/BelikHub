/* ============================================================
   BelikHub · Mobile App Design Board & Interactive Flow Prototype
   React 18 (UMD) + htm (tanpa build step) + CSS token buatan sendiri
   ============================================================ */
const {useState,useEffect,useRef,useMemo,useContext,createContext,useCallback}=React;
const html=htm.bind(React.createElement);
const F=React.Fragment;
const rp=n=>'Rp '+new Intl.NumberFormat('id-ID').format(n);
const dec=(v,d=1)=>Number(v).toFixed(d).replace('.',',');
const pad2=n=>String(n).padStart(2,'0');
const mmss=s=>pad2(Math.floor(s/60))+':'+pad2(s%60);
const PhoneCtx=createContext({interactive:false,go(){},toast(){},shared:{},patch(){}});
const useP=()=>useContext(PhoneCtx);
function useInterval(fn,ms,on){const ref=useRef(fn);ref.current=fn;useEffect(()=>{if(!on)return;const id=setInterval(()=>ref.current(),ms);return()=>clearInterval(id);},[ms,on]);}
function useViewport(){const g=()=>({w:window.innerWidth,h:window.innerHeight});const[v,setV]=useState(g);useEffect(()=>{const f=()=>setV(g());window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f);},[]);return v;}

/* ---------- icons (24px, stroke) ---------- */
const IC={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
drop:'<path d="M12 2.7S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.7 12 2.7z"/>',
receipt:'<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
alert:'<path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
leaf:'<path d="M5 19c0-8 5-13 15-14 0 10-5 15-13 15"/><path d="M5 19c2-5 5-8 9-10"/>',
sprout:'<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
chart:'<path d="M5 20V11M11 20V4M17 20v-6M2 20.5h20"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
chr:'<path d="m9 5 7 7-7 7"/>',
chl:'<path d="m15 5-7 7 7 7"/>',
bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',
heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1"/>',
clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
mountain:'<path d="m3 20 6-11 4 6 2-3 6 8z"/>',
trash:'<path d="M4 7h16M10 3h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
send:'<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
award:'<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
gauge:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-6"/>',
cross:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
route:'<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
chat:'<path d="M3 21l1.6-4.8A9 9 0 1 1 8 19.5z"/>',
back:'<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 9 5 5M17 9l-5 5"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
down:'<path d="m6 9 6 6 6-6"/>',
up:'<path d="m6 15 6-6 6 6"/>',
printer:'<path d="M7 9V3h10v6M7 17H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-3"/><rect x="7" y="14" width="10" height="7"/>',
share:'<path d="M12 15V3M8 7l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
play:'<path d="M7 4.5v15l12-7.5z"/>',
stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
wifi:'<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r=".6"/>',
};
const Icon=({n,s=22,c='currentColor',w=1.75})=>html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke=${c} strokeWidth=${w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${{flex:'none'}} dangerouslySetInnerHTML=${{__html:IC[n]||''}}></svg>`;

const Logo=({s=44,c='#fff',bg='#124734'})=>html`<svg width=${s} height=${s} viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C24 3 8 20 8 30.5a16 16 0 0 0 32 0C40 20 24 3 24 3z" fill=${c}/><path d="M24 39V26" stroke=${bg} strokeWidth="2.4" strokeLinecap="round" fill="none"/><path d="M24 29c0-6 3.5-9.5 9-9.5 0 6-3.5 9.5-9 9.5z" fill=${bg}/><path d="M24 33c0-4.5-2.5-7-7-7 0 4.5 2.5 7 7 7z" fill=${bg}/></svg>`;

/* ---------- topographic contours (water/terrain motif) ---------- */
function contourPath(cx,cy,r,i){let d='';const N=72;for(let k=0;k<=N;k++){const t=k/N*Math.PI*2;const rr=r*(1+0.09*Math.sin(3*t+i*0.7)+0.05*Math.sin(5*t+i*1.3)+0.03*Math.sin(2*t-i));const x=cx+rr*Math.cos(t)*1.2,y=cy+rr*Math.sin(t);d+=(k?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}return d+'Z';}
const Contours=({w,h,cx,cy,n=14,gap=26,color='#fff',op=.12})=>{
  const vb='0 0 '+w+' '+h;
  return html`<svg style=${{position:'absolute',inset:0,pointerEvents:'none'}} width=${w} height=${h} viewBox=${vb} aria-hidden="true">${Array.from({length:n},(_,i)=>html`<path key=${i} d=${contourPath(cx,cy,18+i*gap,i)} fill="none" stroke=${color} strokeOpacity=${op} strokeWidth="1"/>`)}</svg>`;
};

/* ---------- QR (pola contoh, bukan QRIS sungguhan) ---------- */
function QR({size=160,seed=7,fg='#0F172A'}){
  const N=29;const m=Array.from({length:N},()=>Array(N).fill(0));let r=seed*7919+13;
  const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)m[y][x]=rnd()>.52?1:0;
  const finder=(ox,oy)=>{for(let y=-1;y<=7;y++)for(let x=-1;x<=7;x++){const X=ox+x,Y=oy+y;if(X<0||Y<0||X>=N||Y>=N)continue;const edge=x===-1||y===-1||x===7||y===7;const ring=x===0||y===0||x===6||y===6;const core=x>=2&&x<=4&&y>=2&&y<=4;m[Y][X]=(!edge&&(ring||core))?1:0;}};
  finder(0,0);finder(N-7,0);finder(0,N-7);
  let d='';for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(m[y][x])d+='M'+x+' '+y+'h1v1h-1z';
  const vb='-1 -1 '+(N+2)+' '+(N+2);
  return html`<svg width=${size} height=${size} viewBox=${vb} shapeRendering="crispEdges" role="img" aria-label="Kode QR contoh"><rect x="-1" y="-1" width=${N+2} height=${N+2} fill="#fff"/><path d=${d} fill=${fg}/></svg>`;
}

/* ---------- data series & charts ---------- */
function series(seed,n=24,base=1,amp=.06,fx){
  const out=[];let r=seed*9301+49297;
  for(let i=0;i<n;i++){r=(r*9301+49297)%233280;const nz=(r/233280-.5)*2;let v=base*(1+amp*Math.sin(i/3+seed)+amp*.6*nz);if(fx)v=fx(v,i,base);out.push(+v.toFixed(2));}
  return out;
}
function AreaChart({data,w=358,h=150,color='#124734',gid='ac',min,max,ticks=3,thr,thrLabel,fmt=v=>dec(v,1),xl=['00','06','12','18','Kini']}){
  const pL=36,pR=12,pT=10,pB=22;
  let lo=min!=null?min:Math.min(...data)*0.85, hi=max!=null?max:Math.max(...data)*1.15;
  if(thr!=null&&hi<thr*1.1)hi=thr*1.1;
  const X=i=>pL+(w-pL-pR)*i/(data.length-1), Y=v=>pT+(h-pT-pB)*(1-(v-lo)/(hi-lo));
  const line=data.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  const area=line+'L'+X(data.length-1).toFixed(1)+' '+(h-pB)+'L'+pL+' '+(h-pB)+'Z';
  const gl=Array.from({length:ticks},(_,k)=>lo+(hi-lo)*k/(ticks-1));
  const idx=[0,6,12,18,data.length-1];
  const last=data[data.length-1];
  return html`<svg width="100%" viewBox=${'0 0 '+w+' '+h} role="img" aria-label="Grafik 24 jam" style=${{display:'block'}}>
    <defs><linearGradient id=${gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor=${color} stopOpacity=".28"/><stop offset="1" stopColor=${color} stopOpacity="0"/></linearGradient></defs>
    ${gl.map((v,k)=>html`<g key=${k}><line x1=${pL} x2=${w-pR} y1=${Y(v)} y2=${Y(v)} stroke="rgba(15,23,42,.09)"/><text x=${pL-6} y=${Y(v)+4} textAnchor="end" fontSize="10.5" fill="rgba(15,23,42,.55)" className="num">${fmt(v)}</text></g>`)}
    ${thr!=null&&html`<g><line x1=${pL} x2=${w-pR} y1=${Y(thr)} y2=${Y(thr)} stroke="#B42318" strokeDasharray="4 4" strokeWidth="1.2"/><text x=${w-pR} y=${Y(thr)-5} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#B42318">${thrLabel}</text></g>`}
    <path d=${area} fill=${'url(#'+gid+')'}/>
    <path d=${line} fill="none" stroke=${color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx=${X(data.length-1)} cy=${Y(last)} r="4.5" fill="#fff" stroke=${color} strokeWidth="2.2"/>
    ${idx.map((i,k)=>html`<text key=${k} x=${X(i)} y=${h-6} textAnchor=${k===0?'start':k===4?'end':'middle'} fontSize="10.5" fill="rgba(15,23,42,.55)">${xl[k]}</text>`)}
  </svg>`;
}
function Spark({data,w=300,h=46,color='#124734',gid='sp'}){
  const lo=Math.min(...data)*.97,hi=Math.max(...data)*1.03;
  const X=i=>4+(w-8)*i/(data.length-1),Y=v=>4+(h-8)*(1-(v-lo)/(hi-lo));
  const line=data.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  const area=line+'L'+X(data.length-1)+' '+h+'L4 '+h+'Z';
  return html`<svg width="100%" viewBox=${'0 0 '+w+' '+h} aria-hidden="true" style=${{display:'block'}}><defs><linearGradient id=${gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor=${color} stopOpacity=".25"/><stop offset="1" stopColor=${color} stopOpacity="0"/></linearGradient></defs><path d=${area} fill=${'url(#'+gid+')'}/><path d=${line} fill="none" stroke=${color} strokeWidth="2" strokeLinejoin="round"/><circle cx=${X(data.length-1)} cy=${Y(data[data.length-1])} r="3.6" fill="#fff" stroke=${color} strokeWidth="2"/></svg>`;
}

/* ---------- placeholder "foto" (ilustrasi SVG) ---------- */
function Scene({kind='pipe',h=140,seed=1,radius=12,style}){
  const vb='0 0 300 150';
  const body=(()=>{
    if(kind==='pipe')return html`<defs><linearGradient id="gpipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCE6DE"/><stop offset="1" stopColor="#B7C7B6"/></linearGradient></defs><rect width="300" height="150" fill="url(#gpipe)"/><ellipse cx="150" cy="128" rx="110" ry="14" fill="#7FA6B5" opacity=".55"/><ellipse cx="150" cy="128" rx="70" ry="8" fill="#9CC5DA" opacity=".6"/><rect x="0" y="62" width="300" height="26" fill="#94A3B8"/><rect x="0" y="66" width="300" height="5" fill="#CBD5E1" opacity=".8"/><rect x="132" y="56" width="36" height="38" rx="4" fill="#64748B"/><path d="M150 90 L146 104 M150 90 L156 102 M150 92 L136 100 M150 92 L164 98" stroke="#9CC5DA" strokeWidth="3" strokeLinecap="round"/><circle cx="144" cy="112" r="3" fill="#9CC5DA"/><circle cx="158" cy="108" r="2.5" fill="#9CC5DA"/><circle cx="136" cy="106" r="2" fill="#9CC5DA"/><path d="M146 88l4 6-3 4 5 6" stroke="#0F172A" strokeWidth="1.6" fill="none" opacity=".55"/>`;
    if(kind==='meter')return html`<rect width="300" height="150" fill="#1E293B"/><circle cx="150" cy="75" r="62" fill="#F1F5F4" stroke="#94A3B8" strokeWidth="6"/><rect x="92" y="52" width="116" height="34" rx="5" fill="#0b1220"/><g style=${{fontFamily:"'DM Mono',monospace"}} fontSize="26" fill="#fff"><text x="98" y="78">0</text><text x="120" y="78">0</text><text x="142" y="78">1</text><text x="164" y="78">4</text><text x="186" y="78" fill="#fca5a5">0</text></g><text x="150" y="108" textAnchor="middle" fontSize="12" fill="#475569" style=${{fontFamily:"'DM Mono',monospace"}}>m³</text><circle cx="150" cy="33" r="9" fill="none" stroke="#64748B" strokeWidth="1.5"/><path d="M150 33l4-5" stroke="#B42318" strokeWidth="1.6"/>`;
    if(kind==='sapling')return html`<defs><linearGradient id="gsap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9E8E3"/><stop offset="1" stopColor="#F3EFD9"/></linearGradient></defs><rect width="300" height="150" fill="url(#gsap)"/><path d="M0 100 C60 80 120 96 180 84 C230 76 270 88 300 80 V150 H0Z" fill="#7BA37E" opacity=".55"/><rect y="112" width="300" height="38" fill="#8B6B4A"/><ellipse cx="150" cy="114" rx="34" ry="6" fill="#6B4F34"/><path d="M150 112 V66" stroke="#2F6B3E" strokeWidth="4" strokeLinecap="round"/><path d="M150 82c0-14 10-22 26-22 0 14-10 22-26 22z" fill="#1B6048"/><path d="M150 94c0-12-8-18-22-18 0 12 8 18 22 18z" fill="#2F8F5B"/><path d="M150 70c-1-9 4-15 14-17-1 9-6 15-14 17z" fill="#3FA56B"/><rect x="176" y="70" width="3" height="46" fill="#C7A36B"/>`;
    if(kind==='sat'){const id='nz'+seed;return html`<defs><filter id=${id} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="4" seed=${seed}/><feColorMatrix type="matrix" values="0.30 0 0 0 0.06  0 0.34 0 0 0.20  0 0 0.18 0 0.07  0 0 0 0 1"/></filter></defs><rect width="300" height="150" fill="#2A4A2F" filter=${'url(#'+id+')'}/><path d="M-10 120 C60 100 90 130 160 104 S260 96 310 70" stroke="#2B5D6B" strokeWidth="6" fill="none" opacity=".85"/><g stroke="rgba(255,255,255,.18)" strokeWidth=".8"><path d="M0 50H300M0 100H300M75 0V150M150 0V150M225 0V150"/></g><rect x="112" y="40" width="72" height="50" fill="rgba(217,119,6,.14)" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 3"/><text x="118" y="35" fontSize="11" fontWeight="700" fill="#FDE68A" style=${{fontFamily:"'DM Mono',monospace"}}>PLOT B-12</text>`;}
    if(kind==='forest')return html`<defs><linearGradient id="gfor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5EBD0"/><stop offset=".6" stopColor="#CFE0D2"/><stop offset="1" stopColor="#B4CDBB"/></linearGradient></defs><rect width="300" height="150" fill="url(#gfor)"/><circle cx="236" cy="66" r="17" fill="#F6C66A" opacity=".9"/><path d="M0 92 C40 62 90 70 130 52 C170 38 210 70 300 54 V150 H0Z" fill="#6E9C7C" opacity=".65"/><path d="M0 112 C50 86 110 100 160 82 C210 66 260 96 300 84 V150 H0Z" fill="#3E7A57"/><path d="M0 130 C60 112 120 126 190 112 C240 104 270 120 300 112 V150 H0Z" fill="#124734"/><g fill="#0E3A2A">${[20,52,86,122,168,206,248,280].map((x,i)=>html`<path key=${i} d=${'M'+x+' '+(118-(i%3)*4)+'l7 -22 7 22z'}/>`)}</g><path d="M150 110c0-10 5-14 13-14 0 10-5 14-13 14z" fill="#8FD0A0"/><path d="M150 110V96" stroke="#8FD0A0" strokeWidth="2"/>`;
    if(kind==='slide')return html`<rect width="300" height="150" fill="#C9D8CD"/><path d="M0 70 C60 40 120 50 170 30 L300 20 V150 H0Z" fill="#6E9C7C"/><path d="M120 44 C140 70 150 90 130 118 C160 126 200 120 230 100 C210 80 180 60 160 38 Z" fill="#8B6B4A"/><path d="M130 118 C160 126 200 120 230 100" stroke="#6B4F34" strokeWidth="3" fill="none"/><path d="M0 120 C80 110 160 130 300 108 V150 H0Z" fill="#124734" opacity=".9"/><g stroke="#4B6B52" strokeWidth="2"><path d="M60 100v14M80 96v16M250 90v16"/></g>`;
    if(kind==='trash')return html`<rect width="300" height="150" fill="#D5E1D6"/><path d="M0 100 C80 84 160 104 300 90 V150 H0Z" fill="#6E9C7C"/><rect y="118" width="300" height="32" fill="#8B6B4A"/><g><ellipse cx="120" cy="108" rx="30" ry="22" fill="#334155"/><ellipse cx="160" cy="112" rx="26" ry="18" fill="#475569"/><ellipse cx="190" cy="106" rx="22" ry="20" fill="#1E293B"/><rect x="138" y="94" width="26" height="10" rx="4" fill="#94A3B8" transform="rotate(-18 150 100)"/><path d="M96 98l12 4M205 96l10 6" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/></g>`;
    return null;
  })();
  return html`<svg width="100%" height=${h} viewBox=${vb} preserveAspectRatio="xMidYMid slice" role="img" aria-label=${'Ilustrasi '+kind} style=${Object.assign({display:'block',borderRadius:radius},style||{})}>${body}</svg>`;
}

/* ---------- phone shell ---------- */
const StatusBar=({dark})=>html`<div className="sb" style=${{color:dark?'#fff':'#0F172A'}}><span className="num">9:41</span><span className="sbr"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg><${Icon} n="wifi" s=${17} w=${2.2}/><svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="22" height="12" rx="3.6" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.4" fill="currentColor"/><rect x="24" y="4" width="2" height="5" rx="1" fill="currentColor" opacity=".45"/></svg></span></div>`;

const TABS={
  warga:[{label:'Beranda',icon:'home',to:'w-home'},{label:'Bayar',icon:'wallet',to:'w-pay'},{label:'Struk',icon:'receipt',to:'w-receipt'},{label:'Lapor',icon:'alert',to:'w-report'},{label:'Profil',icon:'user'}],
  bumdes:[{label:'Dasbor',icon:'chart',to:'b-dash'},{label:'Meteran',icon:'gauge',to:'b-meter'},{label:'Kas',icon:'cash',to:'b-cash'},{label:'Warga',icon:'users'},{label:'Profil',icon:'user'}],
  relawan:[{label:'Patroli',icon:'route',to:'r-map'},{label:'Insiden',icon:'alert',to:'r-incident'},{label:'Reboisasi',icon:'sprout',to:'r-plant'},{label:'Riwayat',icon:'clock'},{label:'Profil',icon:'user'}],
  donatur:[{label:'Program',icon:'leaf',to:'d-explore'},{label:'Donasi',icon:'heart',to:'d-checkout'},{label:'Dampak',icon:'chart',to:'d-impact'},{label:'Profil',icon:'user'}],
  pdam:[{label:'Agregat',icon:'chart',to:'p-agg'},{label:'Antrean',icon:'clip',to:'p-queue'},{label:'Peta',icon:'pin'},{label:'Profil',icon:'user'}],
};
function TabBar({kind,active}){
  const {go,toast}=useP();
  return html`<nav className="tabbar" aria-label="Navigasi utama">${TABS[kind].map(t=>html`<button key=${t.label} className=${'tab'+(t.to===active?' on':'')} onClick=${()=>t.to?go(t.to):toast('Menu ini di luar cakupan papan prototipe')}><${Icon} n=${t.icon} s=${24} w=${t.to===active?2:1.7}/><span>${t.label}</span></button>`)}<i className="hbar"></i></nav>`;
}
function Shell({bg,dark,under,tab,active,homeBg,homeBar,children}){
  return html`<div className="shell" style=${{background:bg||'var(--canvas)'}}>
    ${under?html`<div className="sb-abs"><${StatusBar} dark=${dark}/></div>`:html`<${StatusBar} dark=${dark}/>`}
    <div className="scroll">${children}</div>
    ${tab?html`<${TabBar} kind=${tab} active=${active}/>`:html`<div className="home" style=${{background:homeBg||'transparent'}}><i style=${{background:homeBar||(dark?'#fff':'#0F172A')}}></i></div>`}
  </div>`;
}
function Phone({interactive,go,shared,patch,children}){
  const [msg,setMsg]=useState(null);const tRef=useRef();
  const toast=useCallback(m=>{if(!interactive)return;setMsg(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setMsg(null),2400);},[interactive]);
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  const ctx=useMemo(()=>({interactive,go:interactive?go:()=>{},toast,shared,patch:interactive?patch:()=>{}}),[interactive,go,toast,shared,patch]);
  return html`<${PhoneCtx.Provider} value=${ctx}><div className=${'phone '+(interactive?'live':'static')} inert=${interactive?undefined:''}><span className="island"></span>${children}${msg&&html`<div className="toast" role="status"><${Icon} n="info" s=${18}/><span>${msg}</span></div>`}</div><//>`;
}

/* ---------- shared UI atoms ---------- */
const NavBack=({to,label='Kembali'})=>{const {go}=useP();return html`<button className="back" onClick=${()=>go(to)} aria-label=${label}><${Icon} n="chl" s=${22} w=${2.2}/>${label}</button>`;};
const Seg=({items,value,onChange,style})=>html`<div className="seg" role="tablist" style=${style}>${items.map(it=>html`<button key=${it.v} role="tab" aria-selected=${value===it.v} className=${value===it.v?'on':''} onClick=${()=>onChange(it.v)}>${it.l}</button>`)}</div>`;
const Row=({icon,bg='var(--forest)',title,sub,right,strong,onClick,chev,children})=>html`<${onClick?'button':'div'} className=${'r'+(icon?' ic':'')} onClick=${onClick}>${icon&&html`<span className="ri" style=${{background:bg}}><${Icon} n=${icon} s=${18} w=${2}/></span>`}<span className="col">${title&&html`<span className="rt">${title}</span>`}${sub&&html`<span className="rs">${sub}</span>`}${children}</span>${(right!=null||chev)&&html`<span className=${'rv num'+(strong?' strong':'')}>${right}${chev&&html`<${Icon} n="chr" s=${16} c="rgba(15,23,42,.3)" w=${2.4}/>`}</span>`}<//>`;
const Group=({head,headRight,foot,children,style})=>html`<${F}>${head&&html`<div className="gh"><span>${head}</span>${headRight&&html`<span style=${{textTransform:'none',letterSpacing:0,fontWeight:500}}>${headRight}</span>`}</div>`}<div className="g" style=${style}>${children}</div>${foot&&html`<div className="gf">${foot}</div>`}<//>`;
const Pill=({kind='ok',children,icon})=>html`<span className=${'pill '+kind}>${icon&&html`<${Icon} n=${icon} s=${12} w=${2.6}/>`}${children}</span>`;
const Keypad=({onKey})=>html`<div className="kp">${['1','2','3','4','5','6','7','8','9','','0','del'].map((k,i)=>k===''?html`<span key=${i} className="k ghost"></span>`:html`<button key=${i} className=${'k'+(k==='del'?' ghost':'')} onClick=${()=>onKey(k)} aria-label=${k==='del'?'Hapus':k}>${k==='del'?html`<${Icon} n="back" s=${26} w=${1.6}/>`:k}</button>`)}</div>`;
const Check=({on})=>html`<span className=${'cb'+(on?' on':'')}>${on&&html`<${Icon} n="check" s=${14} c="#fff" w=${3}/>`}</span>`;

/* ============================================================
   ALUR 1 · ONBOARDING & AUTH
   ============================================================ */
const ROLES=[
  {id:'warga',t:'Warga Batang',s:'Pelanggan Belik · bayar iuran & lapor',ic:'home',bg:'#124734'},
  {id:'bumdes',t:'Pengelola BUMDes',s:'Petugas lapangan · meteran & kas',ic:'wallet',bg:'#D97706'},
  {id:'relawan',t:'Relawan Konservasi',s:'Patroli hutan & reboisasi',ic:'leaf',bg:'#2F8F5B'},
  {id:'donatur',t:'Donatur Hijau',s:'Danai bibit penahan air',ic:'heart',bg:'#0F172A'},
  {id:'pdam',t:'Admin PDAM Batang',s:'Pantau belik & validasi laporan',ic:'shield',bg:'#475569'},
];
const ROLE_DEST={warga:'login',bumdes:'login',relawan:'login',donatur:'portal',pdam:'portal'};
const ROLE_LABEL={warga:'Warga Batang',bumdes:'Pengelola BUMDes',relawan:'Relawan Konservasi',donatur:'Donatur Hijau',pdam:'Admin PDAM Batang'};

function Splash(){
  const {shared,patch,go}=useP();
  const role=shared.role;
  return html`<${Shell} bg="var(--forest)" dark under homeBg="#fff" homeBar="#0F172A">
    <div style=${{position:'relative',height:'100%'}}>
      <${Contours} w=${390} h=${810} cx=${290} cy=${120} n=${13} gap=${30} op=${.13}/>
      <div style=${{position:'absolute',top:80,left:0,right:0,textAlign:'center',color:'#fff'}}>
        <${Logo} s=${58}/>
        <div className="serif" style=${{fontSize:46,fontWeight:500,letterSpacing:'-.02em',lineHeight:1.05,marginTop:8}}>BelikHub</div>
        <div style=${{fontSize:15,opacity:.8,marginTop:6}}>Mata air terjaga, iuran transparan.</div>
        <div style=${{fontSize:12.5,opacity:.55,marginTop:3}}>Kabupaten Batang · bersama PDAM Batang</div>
      </div>
      <div className="sheet" style=${{paddingTop:18,paddingBottom:10,animation:'rise .6s both'}}>
        <div className="serif" style=${{fontSize:25,fontWeight:500,marginBottom:10}}>Masuk sebagai</div>
        <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
          ${ROLES.map(r=>html`<${Row} key=${r.id} icon=${r.ic} bg=${r.bg} title=${r.t} sub=${r.s} onClick=${()=>patch({role:r.id})} right=${role===r.id?html`<${Icon} n="check" s=${20} c="#124734" w=${2.6}/>`:null}/>`)}
        </div>
        <div style=${{marginTop:14}}><button className="btn btn-p" onClick=${()=>go(ROLE_DEST[role])}>Lanjutkan sebagai ${ROLE_LABEL[role]}</button></div>
      </div>
    </div><//>`;
}

function Login(){
  const {shared,go,interactive}=useP();
  const role=shared.role;
  const [mode,setMode]=useState(role==='bumdes'?'pin':'otp');
  const [step,setStep]=useState(interactive?'phone':'otp');
  const [phone,setPhone]=useState('812 3456 7890');
  const [code,setCode]=useState(interactive?'':'4821');
  const [pin,setPin]=useState('');
  const [left,setLeft]=useState(interactive?60:42);
  useInterval(()=>setLeft(s=>s>0?s-1:0),1000,interactive&&mode==='otp'&&step==='otp');
  const dest=role==='relawan'?'r-map':role==='bumdes'?'b-dash':'w-home';
  const press=setter=>k=>setter(c=>k==='del'?c.slice(0,-1):(c+k).slice(0,6));
  useEffect(()=>{if(interactive&&mode==='pin'&&pin.length===6){const t=setTimeout(()=>go('b-dash'),350);return()=>clearTimeout(t);}},[pin,mode]);
  const boxes=Array.from({length:6},(_,i)=>html`<span key=${i} className=${'obox num'+(i===code.length?' cur':'')}>${code[i]||''}</span>`);
  const dots=Array.from({length:6},(_,i)=>html`<span key=${i} className=${'pdot'+(i<pin.length?' on':'')}></span>`);
  return html`<${Shell}>
    <${NavBack} to="splash" label="Peran"/>
    <h1 className="lt">Masuk</h1>
    <p className="ls">${ROLE_LABEL[role]}</p>
    <div className="mt16"><${Seg} value=${mode} onChange=${m=>{setMode(m);}} items=${[{v:'otp',l:'WhatsApp OTP'},{v:'pin',l:'PIN Petugas BUMDes'}]}/></div>
    ${mode==='otp'&&step==='phone'&&html`<${F}>
      <${Group} head="Nomor WhatsApp" foot="Kami kirim kode 6 digit lewat WhatsApp. Tidak ada biaya.">
        <div className="r"><span className="rt num" style=${{paddingRight:10,borderRight:'1px solid var(--line)'}}>+62</span><input className="in num" inputMode="tel" value=${phone} onChange=${e=>setPhone(e.target.value)} aria-label="Nomor WhatsApp"/></div>
      <//>
      <div className="pad mt16"><button className="btn btn-p" disabled=${phone.replace(/\D/g,'').length<9} onClick=${()=>setStep('otp')}><${Icon} n="chat" s=${20}/>Kirim Kode via WhatsApp</button></div>
    <//>`}
    ${mode==='otp'&&step==='otp'&&html`<${F}>
      <p style=${{padding:'18px 20px 14px',margin:0,fontSize:14.5,color:'var(--mute)'}}>Masukkan kode 6 digit yang dikirim ke <b className="num" style=${{color:'var(--slate)'}}>+62 ${phone.trim()}</b>.</p>
      <div style=${{display:'flex',gap:8,justifyContent:'center'}}>${boxes}</div>
      <div style=${{textAlign:'center',fontSize:13.5,color:'var(--mute)',margin:'12px 0 14px'}} className="num">${left>0?html`Kirim ulang dalam ${mmss(left)}`:html`<button onClick=${()=>setLeft(60)} style=${{border:0,background:'none',color:'var(--forest)',fontWeight:600,fontSize:13.5}}>Kirim ulang kode</button>`}</div>
      <${Keypad} onKey=${press(setCode)}/>
      <div className="pad mt12"><button className="btn btn-p" disabled=${code.length<6} onClick=${()=>go(dest)}>Verifikasi & Masuk</button></div>
      <div style=${{textAlign:'center',fontSize:12,color:'var(--mute)',marginTop:8}}>Demo: isi 6 digit apa saja</div>
    <//>`}
    ${mode==='pin'&&html`<${F}>
      <p style=${{padding:'18px 20px 16px',margin:0,fontSize:14.5,color:'var(--mute)'}}>Masukkan PIN 6 digit petugas. PIN hanya berlaku di perangkat yang didaftarkan BUMDes.</p>
      <div style=${{display:'flex',gap:16,justifyContent:'center',margin:'6px 0 22px'}}>${dots}</div>
      <${Keypad} onKey=${press(setPin)}/>
      <div style=${{textAlign:'center',fontSize:13.5,color:'var(--forest)',fontWeight:600,marginTop:16}}>Lupa PIN? Hubungi bendahara BUMDes</div>
      <div style=${{textAlign:'center',fontSize:12,color:'var(--mute)',marginTop:6}}>Demo: ketik 6 digit apa saja</div>
    <//>`}
  <//>`;
}

function Portal(){
  const {go,interactive,toast}=useP();
  const [email,setEmail]=useState('ratna@hijaulestari.id');
  const [sent,setSent]=useState(false);
  const [nip,setNip]=useState('19840712 201001 1 005');
  const [otp,setOtp]=useState(interactive?'':'284170');
  const adminOk=nip.replace(/\D/g,'').length===18&&otp.length===6;
  return html`<${Shell}>
    <${NavBack} to="splash" label="Peran"/>
    <h1 className="lt">Pintu Masuk</h1>
    <p className="ls">Donatur dan Admin PDAM</p>
    <${Group} head="Donatur Hijau" foot=${sent?html`Tautan masuk dikirim ke <b>${email}</b>. Berlaku 10 menit.`:'Tanpa kata sandi. Kami kirim tautan masuk sekali pakai ke surel Anda.'}>
      <div className="r ic"><span className="ri" style=${{background:'#0F172A'}}><${Icon} n="mail" s=${18} w=${2}/></span><input className="in" type="email" value=${email} onChange=${e=>{setEmail(e.target.value);setSent(false);}} aria-label="Surel donatur"/></div>
    <//>
    <div className="pad mt12">${sent
      ?html`<button className="btn btn-s" onClick=${()=>go('d-explore')}><${Icon} n="mail" s=${20}/>Buka Tautan di Surel (simulasi)</button>`
      :html`<button className="btn btn-p" disabled=${!/.+@.+\..+/.test(email)} onClick=${()=>{setSent(true);toast('Magic link terkirim');}}><${Icon} n="send" s=${20}/>Kirim Magic Link</button>`}</div>
    <${Group} head="Admin PDAM Batang" foot="Gunakan NIP 18 digit dan kode 2FA dari aplikasi autentikator. Kode berganti tiap 30 detik.">
      <div className="r ic"><span className="ri" style=${{background:'#475569'}}><${Icon} n="shield" s=${18} w=${2}/></span><span className="col" style=${{flex:1}}><span className="rs">NIP</span><input className="in num" inputMode="numeric" value=${nip} onChange=${e=>setNip(e.target.value)} aria-label="NIP"/></span></div>
      <div className="r ic"><span className="ri" style=${{background:'#124734'}}><${Icon} n="lock" s=${18} w=${2}/></span><span className="col" style=${{flex:1}}><span className="rs">Kode 2FA</span><input className="in num" inputMode="numeric" maxLength=${6} placeholder="000000" style=${{letterSpacing:'.3em',fontWeight:600}} value=${otp} onChange=${e=>setOtp(e.target.value.replace(/\D/g,''))} aria-label="Kode 2FA"/></span></div>
    <//>
    <div className="pad mt12"><button className="btn btn-p" disabled=${!adminOk} onClick=${()=>go('p-agg')}>Masuk sebagai Admin PDAM</button></div>
    <div style=${{textAlign:'center',fontSize:12,color:'var(--mute)',marginTop:8}}>Demo: NIP sudah terisi, ketik 6 digit apa saja untuk 2FA</div>
  <//>`;
}

/* ============================================================
   ALUR 2 · WARGA BATANG
   ============================================================ */
const D24=series(3,24,4.8,.05);
function WHome(){
  const {go}=useP();
  return html`<${Shell} tab="warga" active="w-home">
    <div style=${{display:'flex',alignItems:'center',padding:'6px 20px 12px'}}>
      <div className="col"><span style=${{fontSize:14,color:'var(--mute)'}}>Selamat pagi,</span><span className="serif" style=${{fontSize:30,fontWeight:500,lineHeight:1.1}}>Bu Siti Aminah</span></div>
      <button aria-label="Notifikasi" style=${{marginLeft:'auto',width:40,height:40,borderRadius:20,border:0,background:'#fff',display:'grid',placeItems:'center',position:'relative',boxShadow:'0 1px 2px rgba(15,23,42,.1)'}}><${Icon} n="bell" s=${20}/><i style=${{position:'absolute',top:9,right:10,width:8,height:8,borderRadius:4,background:'var(--amber)',border:'1.5px solid #fff'}}></i></button>
    </div>
    <div className="idcard">
      <${Contours} w=${358} h=${176} cx=${290} cy=${40} n=${9} gap=${24} op=${.14}/>
      <div style=${{position:'absolute',inset:0,padding:18,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div style=${{display:'flex',alignItems:'center',gap:8}}><${Logo} s=${22}/><span style=${{letterSpacing:'.14em',fontSize:11,fontWeight:600,opacity:.85}}>KARTU PELANGGAN BELIK</span></div>
        <div><div className="serif" style=${{fontSize:27,fontWeight:500,lineHeight:1.1}}>Siti Aminah</div><div style=${{opacity:.8,fontSize:13,marginTop:2}}>RT 03 / RW 02 · Desa Bismo · sejak 2019</div></div>
        <div style=${{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div><div style=${{fontSize:10.5,letterSpacing:'.1em',opacity:.6}}>NO. PELANGGAN</div><div className="mono num" style=${{fontSize:18,letterSpacing:'.08em',marginTop:1}}>BLK 0412 0087</div></div>
          <div style=${{background:'#fff',padding:4,borderRadius:8}}><${QR} size=${50} seed=${3}/></div>
        </div>
      </div>
    </div>
    <${Group} head="Tuk Bismo · telemetri langsung" headRight="09:40">
      <div className="r" style=${{padding:'12px 14px'}}><span className="pulse-dot"></span><span className="col"><span className="rt">Jernih & Normal</span><span className="rs">Sensor Bismo-01 · terhubung</span></span><span className="rv"><${Pill}>Normal<//></span></div>
      <div className="r" style=${{padding:0,alignItems:'stretch'}}>
        ${[['Debit','4,8','L/dtk'],['Kekeruhan','1,2','NTU'],['Level air','82','%']].map((m,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep"></span>`}<div style=${{flex:1,padding:'9px 14px'}}><div className="rs">${m[0]}</div><div className="num" style=${{fontSize:25,fontWeight:600,lineHeight:1.15}}>${m[1]} <span style=${{fontSize:12,fontWeight:500,color:'var(--mute)'}}>${m[2]}</span></div></div><//>`)}
      </div>
      <div className="r" style=${{display:'block',padding:'8px 14px 6px'}}><div className="rs">Debit 24 jam terakhir · stabil</div><${Spark} data=${D24} gid="spw" h=${40}/></div>
    <//>
    <${Group} head="Tagihan bulan ini">
      <div className="r" style=${{padding:'13px 14px'}}>
        <span className="col"><span className="rt">Iuran Air November 2026</span><span className="rs num">Meteran 128 → 140 m³ · jatuh tempo 28 Nov</span></span>
        <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:4}}><span className="num" style=${{fontSize:20,fontWeight:700,color:'var(--slate)'}}>Rp 15.000</span><${Pill} kind="warn">Belum lunas<//></span>
      </div>
    <//>
    <div className="pad mt12"><button className="btn btn-p" onClick=${()=>go('w-pay')}>Bayar Rp 15.000</button></div>
  <//>`;
}

function Barcode(){const w=[2,1,3,1,2,2,1,3,2,1,1,3,2,1,2,3,1,1,2,2,3,1,2,1,3,2,1,2,1,1,3,2,2,1,3,1,2,1,2,3];let x=0;const bars=w.map((v,i)=>{const r=html`<rect key=${i} x=${x} y="0" width=${v} height="40" fill=${i%2?'transparent':'#0F172A'}/>`;x+=v;return r;});return html`<svg width="100%" viewBox=${'0 0 '+x+' 40'} preserveAspectRatio="none" height="40" aria-hidden="true">${bars}</svg>`;}

function WPay(){
  const {go,interactive}=useP();
  const [m,setM]=useState('qris');
  const [left,setLeft]=useState(interactive?900:872);
  useInterval(()=>setLeft(s=>Math.max(0,s-1)),1000,interactive&&m==='qris');
  const exp=left===0;
  return html`<${Shell} tab="warga" active="w-pay">
    <h1 className="lt">Bayar Iuran</h1>
    <p className="ls">Iuran Air November 2026 · BLK 0412 0087</p>
    <div className="mt12"><${Seg} value=${m} onChange=${setM} items=${[{v:'qris',l:'QRIS'},{v:'kasir',l:'Kasir BUMDes'}]}/></div>
    ${m==='qris'?html`<${F}>
      <div className="g mt16" style=${{padding:'14px 16px 14px',textAlign:'center'}}>
        <div style=${{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><span style=${{fontWeight:700,letterSpacing:'.08em',fontSize:13}}>QRIS</span><span className="rs">BUMDes Tirta Bismo</span></div>
        <div style=${{display:'inline-block',padding:6,border:'1px solid var(--line)',borderRadius:12,opacity:exp?.18:1,transition:'opacity .3s'}}><${QR} size=${164} seed=${11}/></div>
        <div className="num" style=${{fontSize:26,fontWeight:700,marginTop:8}}>Rp 15.000</div>
        <div style=${{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:4,color:exp?'var(--red)':'var(--amber)',fontWeight:600,fontSize:14}} className="num"><${Icon} n="clock" s=${16} w=${2}/>${exp?'QR kedaluwarsa':'Berlaku '+mmss(left)}</div>
        <div className="track" style=${{marginTop:8}}><div style=${{height:'100%',width:(left/900*100)+'%',background:exp?'var(--red)':'var(--amber)',transition:'width 1s linear'}}></div></div>
      </div>
    <//>`:html`<${Group} head="Bayar langsung di kasir">
      <div className="r" style=${{display:'block',padding:'14px 14px 12px'}}><div className="rs">Kode bayar</div><div className="mono num" style=${{fontSize:22,fontWeight:500,letterSpacing:'.06em',margin:'2px 0 10px'}}>BLK-0412-0087-1126</div><${Barcode}/></div>
      <${Row} icon="pin" bg="#124734" title="Balai Desa Bismo" sub="Senin–Sabtu · 08.00–15.00"/>
      <${Row} icon="users" bg="#D97706" title="Petugas keliling RT 03" sub="Pak Darto · Selasa & Jumat"/>
    <//>`}
    <${Group} head="Rincian">
      <${Row} title="Iuran November 2026" right="Rp 15.000"/>
      <${Row} title="Biaya layanan" right="Rp 0"/>
      <${Row} title="Total" right="Rp 15.000" strong/>
    <//>
    <div className="pad mt16">${m==='qris'
      ?html`<button className="btn btn-p" disabled=${exp} onClick=${()=>go('w-receipt')}>Saya sudah membayar</button>${exp&&html`<button className="btn btn-s mt8" onClick=${()=>setLeft(900)}>Buat QR baru</button>`}`
      :html`<button className="btn btn-s" onClick=${()=>go('w-home')}>Kembali ke Beranda</button>`}</div>
  <//>`;
}

function WReceipt(){
  const {go,toast}=useP();
  const [k,setK]=useState(0);
  const L=(a,b,bold)=>html`<div className=${'ln num'} style=${{fontWeight:bold?600:400}}><span>${a}</span><span style=${{textAlign:'right'}}>${b}</span></div>`;
  return html`<${Shell} bg="#E4ECE9">
    <div style=${{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 12px 8px'}}>
      <button className="back" onClick=${()=>go('w-home')} style=${{padding:'0 6px'}} aria-label="Tutup"><${Icon} n="x" s=${22} w=${2}/></button>
      <span style=${{fontWeight:600,fontSize:16}}>Struk Digital</span>
      <button className="back" onClick=${()=>setK(k+1)} style=${{fontSize:14}}>Ulangi</button>
    </div>
    <div style=${{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style=${{width:332,height:12,borderRadius:7,background:'#0F172A',position:'relative',zIndex:2}}></div>
      <div style=${{width:332,overflow:'hidden',padding:'0 14px 14px',marginTop:-2}}>
        <div key=${k} className="paper" style=${{animation:'print 1.9s cubic-bezier(.2,.7,.2,1) both'}}>
          <div style=${{textAlign:'center'}}><div style=${{display:'flex',justifyContent:'center'}}><${Logo} s=${26} c="#124734" bg="#FFFEFA"/></div><div style=${{fontWeight:500,fontSize:14,letterSpacing:'.12em'}}>BELIKHUB</div><div>BUMDes Tirta Bismo · Desa Bismo</div></div>
          <hr/>
          <div style=${{textAlign:'center',fontWeight:500}}>STRUK IURAN AIR</div>
          ${L('No.','TRX-261123-0087')}${L('Tanggal','23 Nov 2026 09:41')}${L('Pelanggan','Siti Aminah')}${L('ID','BLK 0412 0087')}${L('Metode','QRIS')}
          <hr/>
          ${L('Periode','Nov 2026')}${L('Meteran','128 → 140')}${L('Pemakaian','12 m³')}${L('Iuran tetap','Rp 15.000')}
          <hr/>
          <div className="ln num" style=${{fontWeight:600,fontSize:14}}><span>TOTAL</span><span>Rp 15.000</span></div>
          <hr/>
          <div style=${{fontWeight:500,marginBottom:3}}>ALOKASI DANA</div>
          <div style=${{display:'flex',height:9,borderRadius:2,overflow:'hidden',margin:'4px 0 6px'}}><i style=${{width:'70%',background:'#124734'}}></i><i style=${{width:'30%',background:'#D97706'}}></i></div>
          <div className="ln num"><span><span style=${{color:'#124734'}}>■</span> Operasional BUMDes 70%</span><span>Rp 10.500</span></div>
          <div className="ln num"><span><span style=${{color:'#D97706'}}>■</span> Kas Konservasi Belik 30%</span><span>Rp 4.500</span></div>
          <hr/>
          <div style=${{display:'flex',alignItems:'center',gap:12}}>
            <div style=${{border:'2px solid #124734',color:'#124734',padding:'3px 9px',fontWeight:700,letterSpacing:'.12em',transform:'rotate(-6deg)'}}>LUNAS ✓</div>
            <div style=${{marginLeft:'auto',textAlign:'center',fontSize:9.5}}><${QR} size=${56} seed=${21}/><div>Verifikasi</div></div>
          </div>
          <div style=${{textAlign:'center',marginTop:10,fontSize:10.5}}>Terima kasih telah menjaga<br/>mata air Tuk Bismo.</div>
        </div>
      </div>
    </div>
    <div style=${{display:'flex',gap:10,padding:'4px 16px 0'}}>
      <button className="btn btn-s sm" style=${{flex:1,background:'#fff'}} onClick=${()=>toast('Struk dikirim ke WhatsApp +62 812-3456-7890')}><${Icon} n="chat" s=${18}/>Bagikan WA</button>
      <button className="btn btn-p sm" style=${{flex:1}} onClick=${()=>go('w-home')}>Selesai</button>
    </div>
  <//>`;
}

function MiniMap({h=84}){
  return html`<svg width="100%" height=${h} viewBox="0 0 358 84" preserveAspectRatio="xMidYMid slice" aria-label="Peta lokasi" role="img" style=${{display:'block'}}>
    <rect width="358" height="84" fill="#E4ECE6"/>
    <path d="M-10 62 C80 50 140 76 220 58 S330 40 370 48" stroke="#9CC5DA" strokeWidth="9" fill="none" opacity=".8"/>
    <g stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M0 28H358"/><path d="M96 0V84"/><path d="M250 0V84"/><path d="M96 28 L160 84"/></g>
    <g fill="#CFE0D2"><rect x="108" y="36" width="34" height="18" rx="3"/><rect x="262" y="8" width="40" height="14" rx="3"/><rect x="20" y="40" width="50" height="24" rx="3"/></g>
    <circle cx="179" cy="40" r="26" fill="rgba(10,132,255,.14)" stroke="rgba(10,132,255,.45)"/>
    <path d="M179 56s9-8 9-15a9 9 0 0 0-18 0c0 7 9 15 9 15z" fill="#B42318" stroke="#fff" strokeWidth="1.5"/><circle cx="179" cy="41" r="3" fill="#fff"/>
  </svg>`;
}

function WReport(){
  const {interactive,toast}=useP();
  const [photo,setPhoto]=useState('demo');
  const [type,setType]=useState('Pipa bocor');
  const [desc,setDesc]=useState('Pipa PVC di depan rumah RT 03 bocor, air menggenang sejak pagi.');
  const [ticket,setTicket]=useState({id:'LPR-2611-014',step:2,t:'Pipa bocor · RT 03'});
  const fileRef=useRef();
  const steps=['Laporan diterima','Ditinjau Admin BUMDes','Teknisi ditugaskan','Perbaikan selesai'];
  const subs=['23 Nov · 07.12','23 Nov · 08.05','Teknisi menuju lokasi','Menunggu'];
  const pick=e=>{const f=e.target.files&&e.target.files[0];if(f)setPhoto(URL.createObjectURL(f));};
  const submit=()=>{setTicket({id:'LPR-2611-018',step:0,t:type+' · RT 03'});toast('Laporan terkirim · tiket LPR-2611-018');};
  return html`<${Shell} tab="warga" active="w-report">
    <h1 className="lt">Lapor Kerusakan</h1>
    <p className="ls">Foto, lokasi, dan jenis kerusakan. Lokasi terisi otomatis.</p>
    <div style=${{margin:'12px 16px 0',position:'relative',borderRadius:14,overflow:'hidden',height:112}}>
      ${photo==='demo'?html`<${Scene} kind="pipe" h=${112} radius=${0}/>`:html`<img src=${photo} alt="Foto laporan" style=${{width:'100%',height:112,objectFit:'cover',display:'block'}}/>`}
      <button onClick=${()=>fileRef.current&&fileRef.current.click()} style=${{position:'absolute',right:10,bottom:10,height:32,padding:'0 12px',borderRadius:16,border:0,background:'rgba(15,23,42,.82)',color:'#fff',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}><${Icon} n="camera" s=${16}/>Ganti foto</button>
      <input ref=${fileRef} type="file" accept="image/*" capture="environment" hidden onChange=${pick} aria-label="Pilih foto"/>
    </div>
    <${Group} style=${{marginTop:12}}>
      <${MiniMap} h=${60}/>
      <div className="r" style=${{padding:'9px 14px'}}><span className="col"><span className="rt" style=${{fontSize:15}}>Desa Bismo, Kab. Batang</span><span className="rs num">−7,0412° S · 109,9036° T · akurasi ±8 m</span></span><span className="rv"><${Pill} icon="check">GPS terkunci<//></span></div>
    <//>
    <div style=${{height:12}}></div>
    <div className="chips">${['Pipa bocor','Meteran rusak','Air keruh','Lainnya'].map(t=>html`<button key=${t} className=${'chip'+(type===t?' on':'')} onClick=${()=>setType(t)}>${t}</button>`)}</div>
    <${Group} style=${{marginTop:12}}><div className="r" style=${{alignItems:'flex-start'}}><textarea className="in" rows="2" value=${desc} onChange=${e=>setDesc(e.target.value)} aria-label="Deskripsi kerusakan"></textarea></div><//>
    <div className="pad mt12"><button className="btn btn-p" onClick=${submit} disabled=${!desc.trim()}><${Icon} n="send" s=${19}/>Kirim Laporan</button></div>
    <${Group} head="Status penanganan" headRight=${html`<span className="mono">#${ticket.id}</span>`}>
      <div style=${{padding:'4px 0'}}>${steps.map((s,i)=>html`<div key=${i} className=${'step'+(i<=ticket.step?' d':'')}><span className=${'nd'+(i<ticket.step?' f':i===ticket.step?' c':'')}>${i<ticket.step&&html`<${Icon} n="check" s=${11} c="#fff" w=${3.4}/>`}</span><span className="col"><span className="rt" style=${{fontSize:15,color:i>ticket.step?'var(--mute)':'var(--slate)'}}>${s}</span><span className="rs">${i===ticket.step?(i===0?'Baru saja':subs[i]):i<ticket.step?subs[i]:'Menunggu'}</span></span></div>`)}</div>
    <//>
    <div style=${{height:16}}></div>
  <//>`;
}

/* ============================================================
   ALUR 3 · PENGELOLA BUMDES
   ============================================================ */
function Ring({value,total,size=164,stroke=16,children}){
  const [p,setP]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setP(value/total),60);return()=>clearTimeout(t);},[value,total]);
  const r=(size-stroke)/2,c=2*Math.PI*r;
  return html`<div style=${{position:'relative',width:size,height:size,flex:'none'}}><svg width=${size} height=${size} viewBox=${'0 0 '+size+' '+size} style=${{transform:'rotate(-90deg)'}} aria-hidden="true"><circle cx=${size/2} cy=${size/2} r=${r} fill="none" stroke="#E2ECE9" strokeWidth=${stroke}/><circle cx=${size/2} cy=${size/2} r=${r} fill="none" stroke="#124734" strokeWidth=${stroke} strokeLinecap="round" strokeDasharray=${c} strokeDashoffset=${c*(1-p)} style=${{transition:'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)'}}/></svg><div style=${{position:'absolute',inset:0,display:'grid',placeItems:'center',textAlign:'center'}}>${children}</div></div>`;
}
const RT=[['RT 01',38,45],['RT 02',36,42],['RT 03',40,48],['RT 04',28,45]];
function BDash(){
  const {go}=useP();
  return html`<${Shell} tab="bumdes" active="b-dash">
    <h1 className="lt">Dasbor Lapangan</h1>
    <p className="ls">Pak Darto · BUMDes Tirta Bismo · Nov 2026</p>
    <div style=${{display:'flex',alignItems:'center',gap:18,padding:'16px 20px 4px'}}>
      <${Ring} value=${142} total=${180} size=${160}><div><div className="num" style=${{fontSize:40,fontWeight:700,lineHeight:1}}>142</div><div className="rs num" style=${{marginTop:2}}>dari 180 rumah</div><div style=${{fontSize:12,fontWeight:600,color:'var(--forest)',marginTop:2}}>Lunas · 79%</div></div><//>
      <div className="col" style=${{gap:12,flex:1}}>
        <div><div className="eyebrow">Belum lunas</div><div style=${{display:'flex',alignItems:'center',gap:8}}><i style=${{width:10,height:10,borderRadius:5,background:'var(--amber)'}}></i><span className="num" style=${{fontSize:26,fontWeight:700}}>38</span><span className="rs">rumah</span></div></div>
        <div><div className="eyebrow">Kas tunai di tangan</div><div className="num" style=${{fontSize:22,fontWeight:700}}>Rp 1.140.000</div></div>
      </div>
    </div>
    <div style=${{display:'flex',gap:10,padding:'12px 16px 0'}}>
      <button className="btn btn-s sm" style=${{flex:1}} onClick=${()=>go('b-meter')}><${Icon} n="gauge" s=${18}/>Catat Meteran</button>
      <button className="btn btn-p sm" style=${{flex:1}} onClick=${()=>go('b-cash')}><${Icon} n="cash" s=${18}/>Terima Tunai</button>
    </div>
    <${Group} head="Pemasukan bulan ini" headRight="Total Rp 2.130.000">
      <${Row} icon="cash" bg="#D97706" title="Tunai" sub="76 rumah" right="Rp 1.140.000" strong/>
      <${Row} icon="qr" bg="#124734" title="QRIS" sub="66 rumah" right="Rp 990.000" strong/>
    <//>
    <${Group} head="Penagihan per RT">
      ${RT.map(r=>{const pct=r[1]/r[2];return html`<div key=${r[0]} className="r" style=${{padding:'10px 14px'}}><span style=${{width:46,fontWeight:600}}>${r[0]}</span><div style=${{flex:1}}><div className="track"><div className="fill" style=${{width:(pct*100)+'%',background:pct<.7?'var(--amber)':'var(--forest)'}}></div></div></div><span className="rv num strong" style=${{minWidth:44,justifyContent:'flex-end'}}>${r[1]}/${r[2]}</span></div>`;})}
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function BMeter(){
  const {go,interactive,toast}=useP();
  const prev=128;
  const [val,setVal]=useState('140');
  const [photo,setPhoto]=useState('demo');
  const [ocr,setOcr]=useState('ok');
  const fileRef=useRef();
  const n=val===''?null:Number(val);
  const bad=n==null||isNaN(n)||n<prev;
  const use=bad?null:n-prev;
  const digits=String(isNaN(n)||n==null?0:n).padStart(5,'0').slice(-5).split('');
  const pick=e=>{const f=e.target.files&&e.target.files[0];if(f){setPhoto(URL.createObjectURL(f));setOcr('wait');setTimeout(()=>setOcr('ok'),1100);}};
  return html`<${Shell} tab="bumdes" active="b-meter">
    <h1 className="lt">Catat Meteran</h1>
    <p className="ls">Pencatatan mandiri · Nov 2026</p>
    <${Group} style=${{marginTop:14}}>
      <${Row} title="Bu Siti Aminah" sub="BLK 0412 0087 · RT 03 · Desa Bismo" chev onClick=${()=>toast('Pilih pelanggan dari daftar RT 03')}><//>
    <//>
    <div style=${{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'20px 0 6px'}}>
      <div className="odo num" role="img" aria-label=${'Angka meteran '+(val||0)}>${digits.map((d,i)=>html`<b key=${i}>${d}</b>`)}</div><span className="num" style=${{fontSize:20,fontWeight:600}}>m³</span>
    </div>
    <${Group} foot=${bad&&val!==''?html`<span style=${{color:'var(--red)'}}>Angka lebih kecil dari bulan lalu. Periksa lagi atau foto ulang meteran.</span>`:'Pemakaian dipakai untuk neraca debit Tuk Bismo dan deteksi kebocoran.'}>
      <${Row} title="Meteran bulan lalu" right="128 m³"/>
      <div className="r"><span className="rt">Meteran sekarang</span><span className="rv" style=${{marginLeft:'auto'}}><input className="in num" inputMode="numeric" style=${{textAlign:'right',width:90,fontSize:22,fontWeight:700}} value=${val} onChange=${e=>setVal(e.target.value.replace(/\D/g,'').slice(0,5))} aria-label="Meteran sekarang"/><span style=${{fontWeight:600}}>m³</span></span></div>
      <div className="r"><span className="rt">Pemakaian</span><span className="rv strong num" style=${{fontSize:20}}>${use==null?'—':use+' m³'}</span></div>
    <//>
    <${Group} head="Verifikasi foto angka meteran">
      <div className="r" style=${{padding:'10px 14px'}}>
        <div style=${{width:84,height:56,borderRadius:10,overflow:'hidden',flex:'none'}}>${photo==='demo'?html`<${Scene} kind="meter" h=${56} radius=${0}/>`:html`<img src=${photo} alt="Foto meteran" style=${{width:'100%',height:56,objectFit:'cover'}}/>`}</div>
        <span className="col"><span className="rt" style=${{fontSize:15}}>${ocr==='wait'?'Membaca angka...':'Terbaca '+(val||'—')+' m³'}</span><span className="rs">${ocr==='wait'?'OCR sedang berjalan':'Cocok dengan input · 09:38'}</span></span>
        <span className="rv"><button onClick=${()=>fileRef.current&&fileRef.current.click()} style=${{border:0,background:'var(--sage)',color:'var(--forest)',height:32,borderRadius:16,padding:'0 12px',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:5}}><${Icon} n="camera" s=${16}/>Foto</button></span>
        <input ref=${fileRef} type="file" accept="image/*" capture="environment" hidden onChange=${pick} aria-label="Foto meteran"/>
      </div>
    <//>
    <div className="pad mt16"><button className="btn btn-p" disabled=${bad||ocr==='wait'} onClick=${()=>{toast('Meteran tersimpan: '+use+' m³');go('b-cash');}}>Simpan & Lanjut Terima Bayar</button></div>
  <//>`;
}

function BCash(){
  const {go,interactive,toast}=useP();
  const [paid,setPaid]=useState(!interactive);
  const [sent,setSent]=useState(false);
  const [got,setGot]=useState(15000);
  const change=got-15000;
  return html`<${Shell} tab="bumdes" active="b-cash">
    <h1 className="lt">Terima Bayar Tunai</h1>
    <p className="ls">Iuran Air November 2026</p>
    <${Group} style=${{marginTop:14}}><${Row} title="Bu Siti Aminah" sub="BLK 0412 0087 · RT 03" right=${paid?html`<${Pill} icon="check">Lunas<//>`:html`<${Pill} kind="warn">Belum lunas<//>`}/><//>
    ${!paid?html`<${F}>
      <div style=${{textAlign:'center',padding:'26px 0 8px'}}><div className="eyebrow">Tagihan</div><div className="num" style=${{fontSize:48,fontWeight:700,letterSpacing:'-.02em'}}>Rp 15.000</div></div>
      <div className="gh" style=${{paddingTop:12}}><span>Uang diterima</span></div>
      <div className="chips">${[[15000,'Pas Rp 15.000'],[20000,'Rp 20.000'],[50000,'Rp 50.000']].map(c=>html`<button key=${c[0]} className=${'chip num'+(got===c[0]?' on':'')} onClick=${()=>setGot(c[0])}>${c[1]}</button>`)}</div>
      <${Group} style=${{marginTop:14}}><${Row} title="Kembalian" right=${rp(change)} strong/><//>
      <div className="pad mt16"><button className="btn btn-p" style=${{height:56}} onClick=${()=>{setPaid(true);toast('Pembayaran tunai tercatat');}}><${Icon} n="cash" s=${22}/>Terima Tunai Rp 15.000</button></div>
    <//>`:html`<${F}>
      <div style=${{display:'flex',flexDirection:'column',alignItems:'center',padding:'18px 0 4px'}}>
        <div style=${{width:58,height:58,borderRadius:29,background:'var(--forest)',display:'grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${32} c="#fff" w=${3}/></div>
        <div className="serif" style=${{fontSize:24,fontWeight:500,marginTop:10}}>Pembayaran tercatat</div>
        <div className="rs num">Tunai Rp 15.000 · 23 Nov 2026 09:41</div>
      </div>
      <${Group} head="Kirim struk ke warga">
        <div className="r" style=${{display:'block',padding:'12px 14px',background:'var(--sage)'}}>
          <div className="rs num" style=${{marginBottom:6}}>Ke: Bu Siti Aminah · +62 812-3456-7890</div>
          <div className="bubble">Halo Bu Siti, iuran air Nov 2026 Rp 15.000 sudah kami terima tunai. Alokasi: 70% operasional BUMDes, 30% Kas Konservasi Belik Tuk Bismo. Terima kasih sudah menjaga mata air. Pak Darto, BUMDes Tirta Bismo.<div className="num" style=${{textAlign:'right',fontSize:11,color:'var(--mute)',marginTop:3}}>09:41 ${sent?'✓✓':''}</div></div>
        </div>
      <//>
      <div style=${{display:'flex',gap:10,padding:'14px 16px 0'}}>
        <button className="btn btn-p sm" style=${{flex:1.3,height:48}} onClick=${()=>{setSent(true);toast('Struk terkirim ke WhatsApp warga');}}><${Icon} n="chat" s=${18}/>${sent?'Terkirim':'Kirim WhatsApp'}</button>
        <button className="btn btn-s sm" style=${{flex:1,height:48}} onClick=${()=>toast('Mencetak struk termal...')}><${Icon} n="printer" s=${18}/>Cetak</button>
      </div>
      <div className="pad mt8"><button className="btn sm" style=${{background:'transparent',color:'var(--forest)'}} onClick=${()=>go('b-dash')}>Kembali ke Dasbor</button></div>
    <//>`}
  <//>`;
}

/* ============================================================
   ALUR 4 · RELAWAN KONSERVASI
   ============================================================ */
const CPS=['Gerbang Hutan','Pos 2 Lereng Barat','Sumber Tuk Bismo','Pos 4 Punggung','Pos 5 Lereng Timur','Pos 6 Hulu'];
const CPT=[[112,368],[140,318],[190,250],[246,206],[286,158],[232,116]];
function RMap(){
  const {interactive,toast}=useP();
  const [inside,setInside]=useState(true);
  const [run,setRun]=useState(false);
  const [sec,setSec]=useState(0);
  useInterval(()=>setSec(s=>s+1),1000,run);
  const km=sec*0.0014;
  const cps=Math.min(6,Math.floor(sec/6));
  const me=inside?[150,300]:[338,92];
  const route=CPT.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('');
  const rings=Array.from({length:9},(_,i)=>html`<path key=${i} d=${contourPath(236,236,26+i*30,i+2)} fill="none" stroke="#124734" strokeOpacity=".14"/>`);
  const end=()=>{toast('Patroli tersimpan · '+dec(km,2)+' km, '+cps+' titik');setRun(false);setSec(0);};
  return html`<${Shell} tab="relawan" active="r-map" under>
    <div style=${{position:'relative',height:'100%',background:'#DCE7E1'}}>
      <svg width="390" height="761" viewBox="0 0 390 761" style=${{position:'absolute',inset:0}} role="img" aria-label="Peta patroli Hutan Lindung Bismo">
        <rect width="390" height="761" fill="#DCE7E1"/>
        ${rings}
        <path d="M40 120 C80 60 200 40 300 80 C360 110 380 200 340 290 C300 360 180 400 100 380 C40 340 10 190 40 120Z" fill="rgba(18,71,52,.20)" stroke="rgba(18,71,52,.45)" strokeWidth="1.5"/>
        <path d="M-10 400 C60 350 120 370 170 320 S270 290 320 350 S380 420 400 440" stroke="#9CC5DA" strokeWidth="9" fill="none" strokeLinecap="round"/>
        <circle cx="190" cy="250" r="126" fill="rgba(18,71,52,.10)" stroke="#124734" strokeWidth="2" strokeDasharray="7 6"/>
        <path d=${route} fill="none" stroke="#D97706" strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round"/>
        ${CPT.map((p,i)=>{const done=i<cps;return html`<g key=${i}><circle cx=${p[0]} cy=${p[1]} r="12" fill=${done?'#124734':'#fff'} stroke="#124734" strokeWidth="2"/>${done?html`<path d=${'M'+(p[0]-4.5)+' '+p[1]+'l3.2 3.4 6-6.6'} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>`:html`<text x=${p[0]} y=${p[1]+4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#124734">${i+1}</text>`}</g>`;})}
        <g><circle cx="190" cy="250" r="22" fill="#124734" opacity=".18"/><circle cx="190" cy="250" r="14" fill="#124734"/><path d="M190 242s-5.4 5.6-5.4 9.2a5.4 5.4 0 0 0 10.8 0c0-3.6-5.4-9.2-5.4-9.2z" fill="#fff"/></g>
        <g><rect x="152" y="270" width="76" height="22" rx="11" fill="#fff"/><text x="190" y="285" textAnchor="middle" fontSize="12" fontWeight="700" fill="#124734">Tuk Bismo</text></g>
        <g><circle cx=${me[0]} cy=${me[1]} r="9" fill="rgba(10,132,255,.3)"><animate attributeName="r" values="9;24" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.8s" repeatCount="indefinite"/></circle><circle cx=${me[0]} cy=${me[1]} r="8.5" fill="#0A84FF" stroke="#fff" strokeWidth="3.5"/></g>
      </svg>
      <div style=${{position:'absolute',top:60,left:14,right:14,display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.94)',backdropFilter:'blur(10px)',borderRadius:16,padding:'10px 12px',boxShadow:'0 6px 18px -8px rgba(15,23,42,.35)'}}>
        <span className="ri" style=${{background:'var(--forest)'}}><${Icon} n="mountain" s=${18} w=${2}/></span>
        <span className="col" style=${{flex:1}}><span style=${{fontWeight:600,fontSize:15}}>Hutan Lindung Bismo</span><span className="rs num">${inside?'Dalam zona · 120 m dari sumber':'Di luar zona · 310 m dari sumber'}</span></span>
        <${Pill} kind=${inside?'ok':'warn'}>${inside?'Geofence aktif':'Keluar zona'}<//>
      </div>
      <div style=${{position:'absolute',right:14,top:128,display:'flex',flexDirection:'column',gap:8}}>
        ${['layers','cross'].map(n=>html`<button key=${n} aria-label=${n==='layers'?'Lapisan peta':'Lokasi saya'} onClick=${()=>toast(n==='layers'?'Lapisan: topografi, batas hutan, alur air':'Memusatkan ke posisi Anda')} style=${{width:42,height:42,borderRadius:21,border:0,background:'rgba(255,255,255,.94)',display:'grid',placeItems:'center',boxShadow:'0 4px 12px -6px rgba(15,23,42,.4)'}}><${Icon} n=${n} s=${20}/></button>`)}
      </div>
      <div className="sheet">
        <div className="grab"></div>
        <div style=${{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span className="serif" style=${{fontSize:25,fontWeight:500}}>Patroli Hari Ini</span>${run?html`<${Pill} kind="ok">Berjalan<//>`:html`<${Pill} kind="mute">Siap<//>`}</div>
        <div className="rs">Regu 2 · Pak Slamet & Mbak Rina · Senin 23 Nov</div>
        <div style=${{display:'flex',margin:'12px 0',padding:'10px 0',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
          ${[['Jarak',dec(km,2),'km'],['Waktu',mmss(sec),''],['Titik cek',cps+'/6','']].map((s,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep"></span>`}<div style=${{flex:1,textAlign:'center'}}><div className="rs">${s[0]}</div><div className="num" style=${{fontSize:24,fontWeight:700}}>${s[1]}${s[2]&&html` <span style=${{fontSize:12,color:'var(--mute)',fontWeight:500}}>${s[2]}</span>`}</div></div><//>`)}
        </div>
        <div className="rs" style=${{marginBottom:8,display:'flex',alignItems:'center',gap:6}}><${Icon} n="pin" s=${14}/>Berikutnya: <b style=${{color:'var(--slate)'}}>${cps<6?CPS[cps]:'Semua titik selesai'}</b></div>
        ${run?html`<button className="btn btn-a" onClick=${end}><${Icon} n="stop" s=${20}/>Akhiri Patroli</button>`
             :html`<button className="btn btn-p" disabled=${!inside} onClick=${()=>{setRun(true);toast('Patroli dimulai · lokasi direkam tiap 10 detik');}}><${Icon} n="play" s=${20}/>${inside?'Mulai Patroli Lapangan':'Masuk zona patroli dulu'}</button>`}
        ${interactive&&html`<button onClick=${()=>{setInside(!inside);if(inside&&run)end();}} style=${{display:'block',margin:'8px auto 0',border:0,background:'none',color:'var(--mute)',fontSize:12.5,textDecoration:'underline'}}>Simulasi: ${inside?'keluar dari zona':'kembali ke zona'}</button>`}
      </div>
    </div><//>`;
}

function RIncident(){
  const {toast}=useP();
  const [type,setType]=useState('longsor');
  const [sev,setSev]=useState('sedang');
  const [note,setNote]=useState('Longsor kecil di lereng timur, tanah menutup alur air menuju sumber.');
  const [photos,setPhotos]=useState(['slide','forest']);
  const fileRef=useRef();
  const types=[{id:'hutan',t:'Degradasi hutan',s:'Penebangan atau pembukaan lahan',ic:'leaf',bg:'#2F8F5B'},{id:'sampah',t:'Tumpukan sampah',s:'Dekat alur air atau sumber',ic:'trash',bg:'#475569'},{id:'longsor',t:'Longsor lereng',s:'Tanah bergerak, tutupan terbuka',ic:'mountain',bg:'#D97706'}];
  const add=e=>{const f=e.target.files&&e.target.files[0];if(f&&photos.length<3)setPhotos(p=>[...p,URL.createObjectURL(f)]);};
  return html`<${Shell} tab="relawan" active="r-incident">
    <h1 className="lt">Lapor Insiden</h1>
    <p className="ls">Dikirim ke BUMDes dan PDAM</p>
    <${Group} head="Jenis insiden">
      ${types.map(t=>html`<${Row} key=${t.id} icon=${t.ic} bg=${t.bg} title=${t.t} sub=${t.s} onClick=${()=>setType(t.id)} right=${type===t.id?html`<${Icon} n="check" s=${20} c="#124734" w=${2.6}/>`:null}/>`)}
    <//>
    <div className="gh" style=${{paddingBottom:6}}><span>Tingkat keparahan</span></div>
    <${Seg} value=${sev} onChange=${setSev} items=${[{v:'ringan',l:'Ringan'},{v:'sedang',l:'Sedang'},{v:'berat',l:'Berat'}]}/>
    <${Group} head="Geotag & foto">
      <div className="r" style=${{padding:'11px 14px'}}><span className="col"><span className="rt" style=${{fontSize:15}}>Geotag otomatis</span><span className="rs num">−7,0431° S · 109,9058° T · ±5 m · 612 mdpl</span></span><span className="rv"><${Pill} icon="check">Terkunci<//></span></div>
      <div className="r" style=${{padding:'10px 14px',gap:8}}>
        ${photos.map((p,i)=>html`<div key=${i} style=${{width:64,height:64,borderRadius:10,overflow:'hidden',flex:'none'}}>${p.indexOf('blob:')===0?html`<img src=${p} alt="Foto insiden" style=${{width:64,height:64,objectFit:'cover'}}/>`:html`<${Scene} kind=${p} h=${64} radius=${0}/>`}</div>`)}
        ${photos.length<3&&html`<button onClick=${()=>fileRef.current&&fileRef.current.click()} aria-label="Tambah foto" style=${{width:64,height:64,borderRadius:10,border:'1.5px dashed rgba(15,23,42,.3)',background:'transparent',display:'grid',placeItems:'center',color:'var(--mute)'}}><${Icon} n="camera" s=${24}/></button>`}
        <input ref=${fileRef} type="file" accept="image/*" capture="environment" hidden onChange=${add} aria-label="Tambah foto insiden"/>
      </div>
    <//>
    <${Group} style=${{marginTop:12}}><div className="r"><textarea className="in" rows="2" value=${note} onChange=${e=>setNote(e.target.value)} aria-label="Catatan insiden"></textarea></div><//>
    <div className="pad mt12"><button className="btn btn-a" disabled=${!note.trim()} onClick=${()=>toast('Insiden terkirim ke BUMDes & Admin PDAM')}><${Icon} n="send" s=${19}/>Kirim Laporan Insiden</button></div>
    <div style=${{height:12}}></div>
  <//>`;
}

function RPlant(){
  const {toast}=useP();
  const [sp,setSp]=useState('Beringin');
  const [qty,setQty]=useState(12);
  const [total,setTotal]=useState(214);
  const items=['Bibit tegak dan tidak layu','Mulsa dan ajir terpasang','Gulma sekitar bibit disiangi','Kelembapan tanah cukup','Tidak ada tanda hama atau penyakit'];
  const [chk,setChk]=useState([true,true,true,false,false]);
  const n=chk.filter(Boolean).length;
  return html`<${Shell} tab="relawan" active="r-plant">
    <h1 className="lt">Log Reboisasi</h1>
    <p className="ls">Sabuk Hijau Tuk Bismo · Plot B-12 lereng timur</p>
    <div style=${{padding:'12px 20px 0'}}>
      <div style=${{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><span><span className="num" style=${{fontSize:30,fontWeight:700}}>${total}</span><span className="rs num"> dari 500 bibit tertanam</span></span><${Pill} icon="check">Tumbuh 94%<//></div>
      <div className="track mt8"><div className="fill" style=${{width:(total/500*100)+'%',transition:'width .6s'}}></div></div>
    </div>
    <${Group} head="Tanam hari ini">
      <div className="r"><span className="rt">Jenis bibit</span><span className="rv" style=${{width:170}}><${Seg} value=${sp} onChange=${setSp} style=${{margin:0,width:'100%'}} items=${[{v:'Beringin',l:'Beringin'},{v:'Aren',l:'Aren'}]}/></span></div>
      <div className="r"><span className="rt">Jumlah ditanam</span><span className="rv"><span className="stepper"><button aria-label="Kurangi" onClick=${()=>setQty(Math.max(1,qty-1))}>−</button><span className="num">${qty}</span><button aria-label="Tambah" onClick=${()=>setQty(qty+1)}>+</button></span></span></div>
      <div className="r"><span className="rt">Foto dokumentasi</span><span className="rv"><div style=${{width:58,height:40,borderRadius:8,overflow:'hidden'}}><${Scene} kind="sapling" h=${40} radius=${0}/></div></span></div>
    <//>
    <${Group} head="Monitoring berkala · ke-3 (hari ke-90)" headRight=${n+'/5'}>
      ${items.map((t,i)=>html`<button key=${i} className="r" onClick=${()=>setChk(c=>c.map((v,j)=>j===i?!v:v))} aria-pressed=${chk[i]}><${Check} on=${chk[i]}/><span className="rt" style=${{fontSize:15,fontWeight:chk[i]?500:400,color:chk[i]?'var(--slate)':'var(--mute)'}}>${t}</span></button>`)}
    <//>
    <div className="pad mt12"><button className="btn btn-p" onClick=${()=>{setTotal(total+qty);toast('Log tersimpan · +'+qty+' bibit '+sp);}}><${Icon} n="sprout" s=${20}/>Simpan Log Reboisasi</button></div>
    <div style=${{height:10}}></div>
  <//>`;
}

/* ============================================================
   ALUR 5 · DONATUR HIJAU
   ============================================================ */
function DExplore(){
  const {shared,patch,go}=useP();
  const qty=shared.qty,sp=shared.species;
  const species=[{v:'Beringin',s:'Akar dalam dan kanopi lebat, menahan tanah di sekitar sumber.'},{v:'Aren',s:'Akar serabut rapat, menahan lereng dan membantu resapan air.'}];
  return html`<${Shell} tab="donatur" active="d-explore" under>
    <${Scene} kind="forest" h=${190} radius=${0}/>
    <h1 className="lt" style=${{fontSize:32,paddingTop:14}}>Sabuk Hijau Tuk Bismo</h1>
    <p className="ls">Tanam pohon penahan air di lereng sumber agar belik tetap mengalir.</p>
    <div className="serif" style=${{padding:'10px 20px 0',fontSize:23,fontStyle:'italic',color:'var(--forest)'}}><span className="num">Rp 25.000</span> = 1 bibit penahan air</div>
    <${Group} head="Pilih bibit">
      ${species.map(s=>html`<button key=${s.v} className="r" style=${{padding:'11px 14px'}} onClick=${()=>patch({species:s.v})}><span style=${{width:22,height:22,borderRadius:11,border:'2px solid '+(sp===s.v?'var(--forest)':'rgba(15,23,42,.28)'),display:'grid',placeItems:'center',flex:'none'}}>${sp===s.v&&html`<i style=${{width:10,height:10,borderRadius:5,background:'var(--forest)'}}></i>`}</span><span className="col"><span className="rt">${s.v}</span><span className="rs">${s.s}</span></span></button>`)}
      <div className="r"><span className="rt">Jumlah bibit</span><span className="rv"><span className="stepper"><button aria-label="Kurangi" onClick=${()=>patch({qty:Math.max(1,qty-1)})}>−</button><span className="num">${qty}</span><button aria-label="Tambah" onClick=${()=>patch({qty:qty+1})}>+</button></span></span></div>
    <//>
    <div className="chips" style=${{marginTop:10}}>${[1,4,10,20].map(c=>html`<button key=${c} className=${'chip num'+(qty===c?' on':'')} onClick=${()=>patch({qty:c})}>${c} bibit</button>`)}</div>
    <div style=${{padding:'14px 20px 0'}}>
      <div style=${{display:'flex',justifyContent:'space-between',fontSize:13.5}}><span style=${{fontWeight:600}}>Terdanai</span><span className="num" style=${{color:'var(--mute)'}}>312 dari 500 bibit</span></div>
      <div className="track mt8"><div className="fill" style=${{width:'62.4%'}}></div></div>
    </div>
    <div className="pad mt16"><button className="btn btn-p" onClick=${()=>go('d-checkout')}>Lanjut Donasi · ${rp(qty*25000)}</button></div>
    <div style=${{height:12}}></div>
  <//>`;
}

function Cert({name,qty,sp,paid}){
  return html`<div className="cert">
    <div style=${{fontFamily:'var(--fb)',fontSize:9.5,letterSpacing:'.24em',fontWeight:600,color:'var(--forest)'}}>SERTIFIKAT DONATUR</div>
    <div style=${{fontStyle:'italic',fontSize:15,marginTop:2}}>Sabuk Hijau Tuk Bismo</div>
    <div style=${{fontFamily:'var(--fb)',fontSize:11,color:'var(--mute)',marginTop:8}}>diberikan kepada</div>
    <div style=${{fontSize:28,fontWeight:500,lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 6px'}}>${name||'Nama Donatur'}</div>
    <div style=${{fontFamily:'var(--fb)',fontSize:11.5,marginTop:6,lineHeight:1.45,padding:'0 8px'}}>atas <b className="num">${qty}</b> bibit <b>${sp}</b> penahan air yang ditanam di lereng sumber Tuk Bismo, Kabupaten Batang.</div>
    <div className="mono num" style=${{display:'flex',justifyContent:'space-between',fontSize:9.5,marginTop:10,padding:'0 6px',color:'var(--mute)'}}><span>No. BLK-SD-2611-0031</span><span>23 Nov 2026</span></div>
    ${paid&&html`<span className="stamp">TERBIT</span>`}
  </div>`;
}

function DCheckout(){
  const {shared,go,interactive,toast}=useP();
  const qty=shared.qty,sp=shared.species,total=qty*25000;
  const [paid,setPaid]=useState(false);
  const [kind,setKind]=useState('pribadi');
  const [names,setNames]=useState({pribadi:'Ratna Lestari',organisasi:'Komunitas Hijau Lestari'});
  const [left,setLeft]=useState(interactive?900:851);
  useInterval(()=>setLeft(s=>Math.max(0,s-1)),1000,interactive&&!paid);
  const exp=left===0;
  return html`<${Shell} tab="donatur" active="d-checkout">
    <h1 className="lt">Checkout Donasi</h1>
    <p className="ls">${paid?'Pembayaran diterima. Sertifikat Anda sudah terbit.':'Bayar dengan QRIS, sertifikat terbit otomatis.'}</p>
    <${Group} style=${{marginTop:12}}><${Row} icon="sprout" bg="#124734" title=${qty+' bibit '+sp} sub="Sabuk Hijau Tuk Bismo · Plot B-12" right=${rp(total)} strong/><//>
    ${!paid?html`<div className="g mt12" style=${{padding:'12px 14px',display:'flex',gap:14,alignItems:'center'}}>
      <div style=${{padding:5,border:'1px solid var(--line)',borderRadius:10,opacity:exp?.2:1,flex:'none'}}><${QR} size=${118} seed=${31}/></div>
      <div className="col" style=${{gap:3}}><span style=${{fontWeight:700,letterSpacing:'.08em',fontSize:12.5}}>QRIS</span><span className="num" style=${{fontSize:25,fontWeight:700}}>${rp(total)}</span><span className="num" style=${{fontSize:13.5,fontWeight:600,color:exp?'var(--red)':'var(--amber)'}}>${exp?'QR kedaluwarsa':'Berlaku '+mmss(left)}</span><span className="rs">Buka m-banking atau e-wallet, lalu pindai.</span></div>
    </div>`:html`<${Group} style=${{marginTop:12}}><${Row} icon="check" bg="#124734" title="Pembayaran diterima" sub=${'QRIS · '+rp(total)} right=${html`<${Pill}>Lunas<//>`}/><//>`}
    <div className="mt12"><${Seg} value=${kind} onChange=${setKind} items=${[{v:'pribadi',l:'Pribadi'},{v:'organisasi',l:'Organisasi'}]}/></div>
    <${Group} style=${{marginTop:10}}><div className="r"><span className="col" style=${{flex:1}}><span className="rs">Atas nama sertifikat</span><input className="in" value=${names[kind]} maxLength=${34} onChange=${e=>setNames(Object.assign({},names,{[kind]:e.target.value}))} aria-label="Nama pada sertifikat"/></span></div><//>
    <div style=${{padding:'12px 16px 0'}}><${Cert} name=${names[kind]} qty=${qty} sp=${sp} paid=${paid}/></div>
    <div className="pad mt12">${paid
      ?html`<div style=${{display:'flex',gap:10}}><button className="btn btn-s sm" style=${{flex:1,height:48}} onClick=${()=>toast('Sertifikat dibagikan')}><${Icon} n="share" s=${18}/>Bagikan</button><button className="btn btn-p sm" style=${{flex:1.3,height:48}} onClick=${()=>go('d-impact')}>Lihat Jejak Dampak</button></div>`
      :html`<button className="btn btn-p" disabled=${exp} onClick=${()=>{setPaid(true);toast('Pembayaran diterima, sertifikat terbit');}}>Saya sudah membayar</button>`}</div>
    <div style=${{height:12}}></div>
  <//>`;
}

function DImpact(){
  const {shared}=useP();
  const [view,setView]=useState('foto');
  const sp=shared.species,qty=shared.qty;
  const items=[
    {d:'02 Okt 2026',t:'Donasi diterima',s:rp(qty*25000)+' · '+qty+' bibit '+sp,done:true},
    {d:'18 Okt 2026',t:'Bibit ditanam',s:'Relawan Pak Slamet · Plot B-12',img:true,done:true,k1:'sapling',k2:'sat',seed:4,cap2:'Citra satelit Sentinel-2, plot B-12 sebelum tanam'},
    {d:'18 Nov 2026',t:'Pemantauan hari ke-30',s:'Semua bibit hidup, mulsa terpasang',img:true,done:true,k1:'sapling',k2:'sat',seed:9,cap2:'Citra satelit Sentinel-2, tutupan hijau plot B-12 naik'},
    {d:'16 Jan 2027',t:'Pemantauan hari ke-90',s:'Dijadwalkan relawan regu 2',done:false},
  ];
  return html`<${Shell} tab="donatur" active="d-impact">
    <h1 className="lt">Jejak Dampak</h1>
    <p className="ls">${qty+' bibit '+sp+' · Plot B-12 · donasi 02 Okt 2026'}</p>
    <div style=${{display:'flex',padding:'14px 20px 12px'}}>
      ${[[String(qty),'bibit hidup'],['52','hari tertanam'],['100%','tumbuh']].map((m,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep" style=${{margin:'0 16px'}}></span>`}<div><div className="num serif" style=${{fontSize:30,fontWeight:500,lineHeight:1}}>${m[0]}</div><div className="rs">${m[1]}</div></div><//>`)}
    </div>
    <${Seg} value=${view} onChange=${setView} items=${[{v:'foto',l:'Foto relawan'},{v:'sat',l:'Citra satelit'}]}/>
    <div style=${{padding:'18px 20px 0'}}>
      ${items.map((it,i)=>html`<div key=${i} className="tl" style=${{paddingBottom:18}}>
        <span className=${'nd'+(it.done?' f':' u')}>${it.done&&html`<${Icon} n="check" s=${10} c="#fff" w=${3.6}/>`}</span>
        <div className="mono num" style=${{fontSize:11.5,color:'var(--mute)'}}>${it.d}</div>
        <div style=${{fontWeight:600,fontSize:16,color:it.done?'var(--slate)':'var(--mute)'}}>${it.t}</div>
        <div className="rs num">${it.s}</div>
        ${it.img&&html`<div style=${{marginTop:8}}><${Scene} kind=${view==='foto'?it.k1:it.k2} seed=${it.seed} h=${view==='foto'?120:120} radius=${12}/><div className="rs" style=${{marginTop:4}}>${view==='foto'?'Foto relawan di lapangan':it.cap2}</div></div>`}
      </div>`)}
      <div className="rs" style=${{paddingBottom:16}}>Data pada prototipe ini adalah contoh.</div>
    </div>
  <//>`;
}

/* ============================================================
   ALUR 6 · ADMIN PDAM BATANG
   ============================================================ */
const BELIK=[
  {id:'bismo',n:'Tuk Bismo',d:'Desa Bismo',q:4.8,ntu:1.2,st:'ok',seed:3},
  {id:'kalisari',n:'Tuk Kalisari',d:'Desa Kalisari',q:6.1,ntu:0.9,st:'ok',seed:5},
  {id:'pandan',n:'Tuk Pandansari',d:'Desa Pandansari',q:3.7,ntu:3.6,st:'warn',seed:8},
  {id:'gunung',n:'Tuk Gunungsari',d:'Desa Gunungsari',q:2.1,ntu:14.6,st:'bad',seed:12},
  {id:'wonokerto',n:'Tuk Wonokerto',d:'Desa Wonokerto',q:4.7,ntu:1.5,st:'ok',seed:15},
];
BELIK.forEach(b=>{
  b.qs=series(b.seed,24,b.id==='gunung'?3.4:b.q,.05,b.id==='gunung'?((v,i)=>i>=14?v*(1-.38*Math.min(1,(i-13)/4)):v):null);
  b.ns=series(b.seed+1,24,b.id==='gunung'?1.4:b.id==='pandan'?1.8:b.ntu,.08,b.id==='gunung'?((v,i)=>i>=14?v+13.2*Math.min(1,(i-13)/5):v):b.id==='pandan'?((v,i)=>i>=12?v+1.8*Math.min(1,(i-11)/8):v):null);
  b.qs[23]=b.q;b.ns[23]=b.ntu;
});
const ST={ok:{k:'ok',l:'Normal',c:'#124734'},warn:{k:'warn',l:'Waspada',c:'#D97706'},bad:{k:'bad',l:'Anomali',c:'#B42318'}};
function PAgg(){
  const [sel,setSel]=useState('gunung');
  const [met,setMet]=useState('q');
  const b=BELIK.find(x=>x.id===sel);
  const total=BELIK.reduce((a,x)=>a+x.q,0);
  return html`<${Shell} tab="pdam" active="p-agg">
    <h1 className="lt">Belik Utama Batang</h1>
    <p className="ls">5 sumber · diperbarui 09:41 · data simulasi</p>
    <div style=${{display:'flex',alignItems:'center',gap:14,padding:'12px 20px 4px'}}>
      <div><div className="eyebrow">Total debit</div><div className="num" style=${{fontSize:34,fontWeight:700,lineHeight:1.05}}>${dec(total,1)} <span style=${{fontSize:14,color:'var(--mute)',fontWeight:500}}>L/dtk</span></div></div>
      <div style=${{marginLeft:'auto',display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}><${Pill}>3 normal<//><${Pill} kind="warn">1 waspada<//><${Pill} kind="bad" icon="alert">1 anomali<//></div>
    </div>
    <div style=${{padding:'8px 20px 4px',display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><span style=${{fontWeight:600,fontSize:15}}>${b.n} · ${met==='q'?'Debit':'Kekeruhan'} 24 jam</span><span className="rs num">${met==='q'?dec(b.q,1)+' L/dtk':dec(b.ntu,1)+' NTU'}</span></div>
    <div style=${{padding:'0 14px'}}><${AreaChart} data=${met==='q'?b.qs:b.ns} h=${112} color=${ST[b.st].c} gid=${'pa'+met+sel} min=${0} max=${met==='q'?8:16} thr=${met==='n'?5:null} thrLabel="Ambang 5 NTU"/></div>
    <div style=${{marginTop:4}}><${Seg} value=${met} onChange=${setMet} items=${[{v:'q',l:'Debit (L/dtk)'},{v:'n',l:'Kekeruhan (NTU)'}]}/></div>
    <${Group} head="Sumber">
      ${BELIK.map(x=>html`<button key=${x.id} className="r" onClick=${()=>setSel(x.id)} style=${{padding:'9px 14px',background:sel===x.id?'rgba(226,236,233,.7)':'transparent'}} aria-pressed=${sel===x.id}>
        <i style=${{width:10,height:10,borderRadius:5,background:ST[x.st].c,flex:'none'}}></i>
        <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.n}</span><span className="rs">${x.d}</span></span>
        <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:3}}><${Pill} kind=${ST[x.st].k} icon=${x.st==='bad'?'alert':null}>${ST[x.st].l}<//><span className="num" style=${{fontSize:12.5,color:'var(--slate)'}}>${dec(x.q,1)} L/dtk · ${dec(x.ntu,1)} NTU</span></span>
      </button>`)}
    <//>
    <div className="gf" style=${{paddingBottom:12}}>Waspada jika kekeruhan di atas 3 NTU. Anomali jika di atas 5 NTU atau debit turun lebih dari 30%.</div>
  <//>`;
}

const LAP0=[
  {id:1,t:'Pipa bocor',w:'RT 03 Bismo',by:'Bu Siti Aminah',ago:'2 jam lalu',kind:'pipe',gps:'−7,0412° S, 109,9036° T',note:'Pipa PVC di depan rumah bocor, air menggenang sejak pagi.',st:'wait'},
  {id:2,t:'Meteran rusak',w:'RT 01 Kalisari',by:'Pak Joko',ago:'5 jam lalu',kind:'meter',gps:'−7,0388° S, 109,9102° T',note:'Angka meteran macet di 00212.',st:'wait'},
  {id:3,t:'Air keruh',w:'RT 02 Gunungsari',by:'Bu Yati',ago:'1 hari lalu',kind:'slide',gps:'−7,0517° S, 109,9244° T',note:'Air keruh sejak kemarin sore. Lereng di atas sumber tampak longsor.',st:'wait',link:'Terkait anomali'},
  {id:4,t:'Pipa bocor',w:'RT 04 Wonokerto',by:'Pak Anwar',ago:'2 hari lalu',kind:'pipe',gps:'−7,0299° S, 109,9187° T',note:'Sambungan pipa utama merembes.',st:'wait'},
];
const CAIR0=[
  {id:1,t:'Perbaikan sambungan pipa RT 03–04',by:'BUMDes Tirta Bismo',amt:1250000,st:'wait',rab:[['Pipa PVC 2″ · 12 batang',540000],['Sambungan & lem',210000],['Upah tukang · 2 orang',500000]]},
  {id:2,t:'Penggantian meteran · 6 unit',by:'BUMDes Tirta Kalisari',amt:1680000,st:'wait',rab:[['Meteran air ½″ · 6 × 280.000',1680000]]},
];
function PQueue(){
  const {toast}=useP();
  const [tab,setTab]=useState('lap');
  const [lap,setLap]=useState(LAP0);
  const [cair,setCair]=useState(CAIR0);
  const [open,setOpen]=useState(1);
  const nl=lap.filter(x=>x.st==='wait').length,nc=cair.filter(x=>x.st==='wait').length;
  const setL=(id,st,msg)=>{setLap(l=>l.map(x=>x.id===id?Object.assign({},x,{st}):x));setOpen(null);toast(msg);};
  const setC=(id,st,msg)=>{setCair(l=>l.map(x=>x.id===id?Object.assign({},x,{st}):x));setOpen(null);toast(msg);};
  const stp=s=>s==='wait'?html`<${Pill} kind="warn">Menunggu<//>`:s==='ok'?html`<${Pill} icon="check">${tab==='lap'?'Divalidasi':'Disetujui'}<//>`:html`<${Pill} kind="bad">Ditolak<//>`;
  return html`<${Shell} tab="pdam" active="p-queue">
    <h1 className="lt">Antrean Validasi</h1>
    <p className="ls">Laporan warga dan pengajuan dana pemeliharaan</p>
    <div className="mt12"><${Seg} value=${tab} onChange=${t=>{setTab(t);setOpen(1);}} items=${[{v:'lap',l:'Laporan Warga ('+nl+')'},{v:'cair',l:'Pencairan Dana ('+nc+')'}]}/></div>
    ${tab==='lap'?html`<${Group} head="Perlu ditinjau">
      ${lap.map(x=>html`<${F} key=${x.id}>
        <button className="r ic" onClick=${()=>setOpen(open===x.id?null:x.id)} style=${{padding:'10px 14px'}} aria-expanded=${open===x.id}>
          <span className="ri" style=${{background:x.link?'#B42318':'#D97706'}}><${Icon} n="alert" s=${18} w=${2}/></span>
          <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.t} · ${x.w}</span><span className="rs">${x.by} · ${x.ago}</span>${x.link&&html`<span style=${{marginTop:3}}><${Pill} kind="bad">${x.link}<//></span>`}</span>
          <span className="rv">${stp(x.st)}</span>
        </button>
        ${open===x.id&&html`<div className="r" style=${{display:'block',padding:'4px 14px 14px'}}>
          <${Scene} kind=${x.kind} h=${104} radius=${10}/>
          <div style=${{fontSize:14,margin:'8px 0 2px'}}>${x.note}</div>
          <div className="rs num" style=${{display:'flex',alignItems:'center',gap:5}}><${Icon} n="pin" s=${13}/>${x.gps}</div>
          ${x.st==='wait'?html`<div style=${{display:'flex',gap:8,marginTop:10}}><button className="btn btn-d sm" style=${{flex:1}} onClick=${()=>setL(x.id,'no','Laporan ditolak')}>Tolak</button><button className="btn btn-p sm" style=${{flex:2}} onClick=${()=>setL(x.id,'ok','Divalidasi · teknisi ditugaskan')}>Validasi & tugaskan teknisi</button></div>`:null}
        </div>`}
      <//>`)}
    <//>`:html`<${Group} head="Pengajuan BUMDes" foot="Dana pemeliharaan tersedia Rp 6.450.000.">
      ${cair.map(x=>html`<${F} key=${x.id}>
        <button className="r" onClick=${()=>setOpen(open===x.id?null:x.id)} style=${{padding:'11px 14px'}} aria-expanded=${open===x.id}>
          <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.t}</span><span className="rs">${x.by}</span></span>
          <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:4}}><span className="num" style=${{fontWeight:700,color:'var(--slate)',fontSize:16}}>${rp(x.amt)}</span>${stp(x.st)}</span>
        </button>
        ${open===x.id&&html`<div className="r" style=${{display:'block',padding:'2px 14px 14px'}}>
          <div className="eyebrow" style=${{marginBottom:4}}>Rincian anggaran</div>
          ${x.rab.map((l,i)=>html`<div key=${i} style=${{display:'flex',justifyContent:'space-between',fontSize:14,padding:'3px 0',gap:10}}><span>${l[0]}</span><span className="num">${rp(l[1])}</span></div>`)}
          <div style=${{display:'flex',justifyContent:'space-between',fontWeight:700,borderTop:'1px solid var(--line)',marginTop:6,paddingTop:6}}><span>Total</span><span className="num">${rp(x.amt)}</span></div>
          ${x.st==='wait'?html`<div style=${{display:'flex',gap:8,marginTop:10}}><button className="btn btn-d sm" style=${{flex:1}} onClick=${()=>setC(x.id,'no','Pengajuan ditolak')}>Tolak</button><button className="btn btn-p sm" style=${{flex:2}} onClick=${()=>setC(x.id,'ok','Pencairan disetujui · menunggu transfer')}>Setujui pencairan</button></div>`:null}
        </div>`}
      <//>`)}
    <//>`}
    <div style=${{height:14}}></div>
  <//>`;
}

/* ============================================================
   REGISTRI LAYAR (18 layar · 6 alur)
   ============================================================ */
const FLOWS=[
  {id:'auth',n:1,title:'Onboarding & Auth',actor:'Semua peran',desc:'Splash, pilih peran, lalu masuk dengan metode yang sesuai: OTP WhatsApp, PIN petugas, magic link, atau NIP + 2FA.',screens:[
    {id:'splash',code:'1.1',title:'Splash & Pilih Peran',C:Splash,hint:'Pilih satu peran lalu tekan Lanjutkan. Warga, BUMDes dan Relawan menuju login. Donatur dan Admin PDAM menuju pintu masuk khusus.'},
    {id:'login',code:'1.2',title:'Login WhatsApp OTP / PIN Petugas',C:Login,hint:'Kirim kode, ketik 6 digit di keypad, lalu Verifikasi. Tab PIN Petugas BUMDes masuk otomatis setelah 6 digit.'},
    {id:'portal',code:'1.3',title:'Pintu Masuk Donatur & Admin PDAM',C:Portal,hint:'Donatur: kirim magic link lalu buka tautannya. Admin PDAM: NIP sudah terisi, ketik 6 digit 2FA lalu masuk.'},
  ]},
  {id:'warga',n:2,title:'Warga Batang',actor:'Pelanggan Belik · Desa Bismo',desc:'Kartu pelanggan, telemetri Tuk Bismo, iuran Rp 15.000, struk dengan alokasi dana, dan laporan kerusakan.',screens:[
    {id:'w-home',code:'2.1',title:'Beranda Warga',C:WHome,hint:'Tekan Bayar untuk membuka pembayaran. Tab bawah berpindah antar layar warga.'},
    {id:'w-pay',code:'2.2',title:'Pembayaran Iuran',C:WPay,hint:'Countdown QRIS 15 menit berjalan. Ganti ke Kasir BUMDes untuk kode bayar. Saya sudah membayar menuju struk.'},
    {id:'w-receipt',code:'2.3',title:'Struk Digital',C:WReceipt,hint:'Struk tercetak dengan animasi. Ulangi memutar ulang animasi cetak.'},
    {id:'w-report',code:'2.4',title:'Form Lapor Kerusakan',C:WReport,hint:'Ganti foto, pilih jenis, lalu kirim. Tiket baru muncul di Status penanganan.'},
  ]},
  {id:'bumdes',n:3,title:'Pengelola BUMDes',actor:'Petugas lapangan · BUMDes Tirta Bismo',desc:'Pantau penagihan per RT, catat meteran dengan verifikasi foto, dan terima bayar tunai dengan struk WhatsApp.',screens:[
    {id:'b-dash',code:'3.1',title:'Dashboard Lapangan',C:BDash,hint:'Cincin menunjukkan rumah lunas. Catat Meteran dan Terima Tunai membuka form masing-masing.'},
    {id:'b-meter',code:'3.2',title:'Form Catat Meteran Mandiri',C:BMeter,hint:'Ubah angka meteran, pemakaian terhitung otomatis. Angka di bawah 128 ditolak. Foto ulang memicu pembacaan OCR simulasi.'},
    {id:'b-cash',code:'3.3',title:'Catat Bayar Tunai',C:BCash,hint:'Pilih uang diterima, tekan Terima Tunai, lalu kirim struk lewat WhatsApp atau cetak.'},
  ]},
  {id:'relawan',n:4,title:'Relawan Konservasi',actor:'Patroli Hutan Lindung Bismo',desc:'Patroli dengan geofence sumber Tuk Bismo, laporan insiden bergeotag, dan log reboisasi dengan monitoring berkala.',screens:[
    {id:'r-map',code:'4.1',title:'Peta Patroli Hutan Lindung',C:RMap,hint:'Mulai Patroli menjalankan timer dan titik cek. Simulasi keluar zona menonaktifkan tombol mulai.'},
    {id:'r-incident',code:'4.2',title:'Form Insiden Belik',C:RIncident,hint:'Pilih jenis dan tingkat keparahan, tambah foto, lalu kirim.'},
    {id:'r-plant',code:'4.3',title:'Log Reboisasi',C:RPlant,hint:'Atur jumlah bibit, centang monitoring, lalu simpan. Progres naik sebesar jumlah bibit.'},
  ]},
  {id:'donatur',n:5,title:'Donatur Hijau',actor:'Individu & organisasi',desc:'Rp 25.000 menjadi satu bibit Beringin atau Aren. Bayar QRIS, terima sertifikat digital, lalu pantau dampaknya.',screens:[
    {id:'d-explore',code:'5.1',title:'Eksplorasi Program Sabuk Hijau',C:DExplore,hint:'Pilih bibit dan jumlah. Total berubah per Rp 25.000 dan terbawa ke checkout.'},
    {id:'d-checkout',code:'5.2',title:'Checkout QRIS + Sertifikat',C:DCheckout,hint:'Ubah nama sertifikat, pilih Pribadi atau Organisasi, lalu tekan Saya sudah membayar untuk menerbitkan sertifikat.'},
    {id:'d-impact',code:'5.3',title:'Timeline Dampak',C:DImpact,hint:'Ganti antara foto relawan dan citra satelit. Gulir untuk melihat jadwal pemantauan berikutnya.'},
  ]},
  {id:'pdam',n:6,title:'Admin PDAM Batang',actor:'Pemantauan & validasi',desc:'Agregat debit dan kekeruhan lima belik utama, antrean laporan warga, dan pencairan dana pemeliharaan.',screens:[
    {id:'p-agg',code:'6.1',title:'Agregat Debit & Kekeruhan',C:PAgg,hint:'Pilih belik untuk melihat grafik 24 jam. Ganti antara Debit dan Kekeruhan.'},
    {id:'p-queue',code:'6.2',title:'Antrean Validasi',C:PQueue,hint:'Buka laporan lalu validasi atau tolak. Di tab Pencairan Dana, tinjau RAB dan setujui pengajuan.'},
  ]},
];
const ALL=FLOWS.flatMap(f=>f.screens.map(s=>Object.assign({},s,{flow:f})));
const byId=Object.fromEntries(ALL.map(s=>[s.id,s]));

/* ============================================================
   PAPAN & MODE PERANGKAT
   ============================================================ */
function DeviceStage({cur,setCur,shared,patch,reserve}){
  const vp=useViewport();
  const s=Math.max(.35,Math.min(1,(vp.h-reserve)/872,(vp.w-16)/418));
  const S=byId[cur]||byId.splash;
  const go=useCallback(id=>{if(byId[id])setCur(id);},[setCur]);
  return html`<div style=${{width:418*s,height:872*s,flex:'none'}}><div style=${{width:418,height:872,padding:14,transform:'scale('+s+')',transformOrigin:'top left'}}>
    <${Phone} interactive=${true} go=${go} shared=${shared} patch=${patch}><${S.C} key=${S.id}/><//>
  </div></div>`;
}

function BoardFrame({s,z,onPreview,shared,patch}){
  return html`<figure style=${{margin:0,width:418*z}}>
    <figcaption style=${{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,margin:'0 0 8px 6px'}}>
      <span style=${{display:'flex',alignItems:'center',gap:8,minWidth:0}}><span className="fnum">${s.code}</span><span title=${s.title} style=${{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>${s.title}</span></span>
      <button className="pv" onClick=${()=>onPreview(s.id)} aria-label=${'Coba interaktif: '+s.title}><${Icon} n="play" s=${13} w=${2.2}/>Coba</button>
    </figcaption>
    <div style=${{width:418*z,height:872*z}}><div style=${{width:418,height:872,padding:14,transform:'scale('+z+')',transformOrigin:'top left'}}>
      <${Phone} interactive=${false} go=${()=>{}} shared=${shared} patch=${patch}><${s.C}/><//>
    </div></div>
  </figure>`;
}

function TokenStrip(){
  const sw=[['Canvas','#F8FAFC'],['Forest Green','#124734'],['Sage','#E2ECE9'],['Amber','#D97706'],['Slate','#0F172A']];
  return html`<div style=${{display:'flex',flexWrap:'wrap',gap:'22px 40px',padding:'18px 0 22px',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
    <div><div className="eyebrow" style=${{marginBottom:8}}>Warna</div><div style=${{display:'flex',gap:14,flexWrap:'wrap'}}>${sw.map(c=>html`<div key=${c[0]} style=${{display:'flex',alignItems:'center',gap:8}}><span className="swatch" style=${{background:c[1]}}></span><span><div style=${{fontWeight:600,fontSize:13}}>${c[0]}</div><div className="mono" style=${{fontSize:11.5,color:'var(--mute)'}}>${c[1]}</div></span></div>`)}</div></div>
    <div><div className="eyebrow" style=${{marginBottom:6}}>Huruf</div>
      <div className="serif" style=${{fontSize:26,lineHeight:1.1}}>Newsreader <span style=${{fontSize:13,color:'var(--mute)',fontFamily:'var(--fb)'}}>judul editorial</span></div>
      <div style=${{fontSize:15,fontWeight:600,marginTop:4}}>Figtree <span style=${{fontSize:13,color:'var(--mute)',fontWeight:400}}>data dan formulir</span></div>
      <div className="num" style=${{fontSize:14,marginTop:4,fontWeight:500}}>Rp 15.000 · 140 m³ · 4,8 L/dtk</div></div>
    <div style=${{maxWidth:340}}><div className="eyebrow" style=${{marginBottom:6}}>Prinsip</div>
      <div style=${{fontSize:14,lineHeight:1.5}}>Daftar inset grouped ala iOS, tanpa kartu bertingkat. Kartu hanya untuk benda yang memang kartu: kartu pelanggan, struk, dan sertifikat. Angka meteran dan rupiah memakai tabular numerals.</div></div>
  </div>`;
}

function Board({z,onPreview,shared,patch}){
  const jump=id=>{const el=document.getElementById('flow-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});};
  return html`<main className="dots" style=${{padding:'28px 20px 80px'}}><div style=${{maxWidth:2000,margin:'0 auto',padding:'0 4px'}}>
    <div style=${{maxWidth:720}}>
      <h1 className="serif" style=${{fontSize:'clamp(32px,5vw,48px)',fontWeight:500,letterSpacing:'-.02em',lineHeight:1.05,margin:0}}>Papan desain BelikHub</h1>
      <p style=${{fontSize:16,lineHeight:1.55,color:'var(--mute)',margin:'10px 0 18px'}}>Platform konservasi mata air dan retribusi air komunitas Kabupaten Batang, dalam 18 layar iPhone 390×844. Tekan Coba di bawah tiap layar, atau pindah ke mode Interactive Device di atas untuk mengetik dan menekan tombol langsung.</p>
    </div>
    <${TokenStrip}/>
    <div style=${{display:'flex',gap:8,flexWrap:'wrap',margin:'18px 0 30px'}}>${FLOWS.map(f=>html`<button key=${f.id} className="pv" onClick=${()=>jump(f.id)}><span className="mono" style=${{fontSize:11.5}}>${f.n}</span>${f.title}</button>`)}</div>
    ${FLOWS.map(f=>html`<section key=${f.id} id=${'flow-'+f.id} style=${{marginBottom:56,scrollMarginTop:90}}>
      <div className="fhead"><span className="fnum">Alur ${f.n}</span><h2 className="serif" style=${{fontSize:30,fontWeight:500,margin:0,letterSpacing:'-.01em'}}>${f.title}</h2><span style=${{color:'var(--mute)',fontSize:14}}>${f.actor}</span></div>
      <p style=${{margin:'0 0 16px',maxWidth:640,fontSize:14.5,lineHeight:1.5,color:'var(--mute)'}}>${f.desc}</p>
      <div className="flowrule"></div>
      <div style=${{display:'flex',flexWrap:'wrap',gap:'30px 18px',alignItems:'flex-start'}}>${f.screens.map(s=>html`<${BoardFrame} key=${s.id} s=${s} z=${z} onPreview=${onPreview} shared=${shared} patch=${patch}/>`)}</div>
    </section>`)}
  </div></main>`;
}

function DeviceMode({cur,setCur,shared,patch}){
  const S=byId[cur]||byId.splash;
  const vp=useViewport();
  const wide=vp.w>=1024;
  const note=vp.w>=1280;
  return html`<div className="dots" style=${{display:'flex',minHeight:'calc(100vh - 62px)'}}>
    ${wide&&html`<aside aria-label="Daftar layar" style=${{width:300,flex:'none',borderRight:'1px solid var(--line)',background:'rgba(248,250,252,.7)',height:'calc(100vh - 62px)',overflowY:'auto',position:'sticky',top:62,padding:'14px 12px 30px'}}>
      ${FLOWS.map(f=>html`<div key=${f.id} style=${{marginBottom:14}}>
        <div className="eyebrow" style=${{padding:'4px 10px 6px'}}>${f.n}. ${f.title}</div>
        ${f.screens.map(s=>html`<button key=${s.id} onClick=${()=>setCur(s.id)} aria-current=${cur===s.id} style=${{display:'flex',width:'100%',alignItems:'center',gap:10,textAlign:'left',border:0,borderRadius:10,padding:'8px 10px',background:cur===s.id?'#fff':'transparent',boxShadow:cur===s.id?'0 1px 3px rgba(15,23,42,.14)':'none',fontSize:14,fontWeight:cur===s.id?600:500,color:'var(--slate)'}}><span className="fnum" style=${{flex:'none'}}>${s.code}</span><span>${s.title}</span></button>`)}
      </div>`)}
    </aside>`}
    <section style=${{flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 8px 16px',gap:10}}>
      ${!wide&&html`<label style=${{display:'flex',alignItems:'center',gap:8,fontSize:14,fontWeight:600}}>Layar<select value=${cur} onChange=${e=>setCur(e.target.value)} style=${{height:38,borderRadius:10,border:'1px solid var(--line)',background:'#fff',padding:'0 10px',font:'500 14px var(--fb)',maxWidth:'70vw'}}>${FLOWS.map(f=>html`<optgroup key=${f.id} label=${f.n+'. '+f.title}>${f.screens.map(s=>html`<option key=${s.id} value=${s.id}>${s.code} ${s.title}</option>`)}</optgroup>`)}</select></label>`}
      <${DeviceStage} cur=${cur} setCur=${setCur} shared=${shared} patch=${patch} reserve=${wide?100:150}/>
    </section>
    ${note&&html`<aside aria-label="Catatan layar" style=${{width:300,flex:'none',padding:'22px 22px 30px',position:'sticky',top:62,alignSelf:'flex-start'}}>
      <div className="eyebrow">Alur ${S.flow.n} · ${S.flow.title}</div>
      <div className="serif" style=${{fontSize:26,fontWeight:500,lineHeight:1.15,margin:'6px 0 10px'}}><span className="fnum" style=${{verticalAlign:'middle',marginRight:6}}>${S.code}</span>${S.title}</div>
      <p style=${{fontSize:14.5,lineHeight:1.55,margin:'0 0 14px'}}>${S.hint}</p>
      <div className="eyebrow" style=${{marginBottom:4}}>Peran aktif</div>
      <div style=${{fontSize:14.5,fontWeight:600}}>${ROLE_LABEL[shared.role]}</div>
      <p style=${{fontSize:12.5,color:'var(--mute)',lineHeight:1.5,marginTop:14}}>Semua data adalah contoh. Tab bawah berpindah antar layar dalam satu alur, dan tombol utama membawa Anda ke langkah berikutnya.</p>
    </aside>`}
  </div>`;
}

function PreviewOverlay({id,onClose,onOpenDevice,shared,patch}){
  const [cur,setCur]=useState(id);
  const idx=ALL.findIndex(x=>x.id===cur);
  const S=ALL[idx];
  const step=d=>{const n=ALL[(idx+d+ALL.length)%ALL.length];setCur(n.id);};
  const btn={height:36,borderRadius:18,border:'1px solid rgba(255,255,255,.28)',background:'rgba(255,255,255,.1)',color:'#fff',padding:'0 14px',fontWeight:600,fontSize:13.5,display:'inline-flex',alignItems:'center',gap:6};
  return html`<div role="dialog" aria-modal="true" aria-label="Preview interaktif layar penuh" style=${{position:'fixed',inset:0,zIndex:60,background:'rgba(15,23,42,.9)',backdropFilter:'blur(6px)',display:'flex',flexDirection:'column'}}>
    <div style=${{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',padding:'10px 16px',color:'#fff'}}>
      <span className="fnum">${S.code}</span><span style=${{fontWeight:600}}>${S.title}</span>
      <span style=${{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
        <button style=${btn} onClick=${()=>step(-1)} aria-label="Layar sebelumnya"><${Icon} n="chl" s=${16} w=${2.4}/>Sebelumnya</button>
        <button style=${btn} onClick=${()=>step(1)} aria-label="Layar berikutnya">Berikutnya<${Icon} n="chr" s=${16} w=${2.4}/></button>
        <button style=${btn} onClick=${()=>onOpenDevice(cur)}>Buka di mode Device</button>
        <button style=${Object.assign({},btn,{background:'#fff',color:'#0F172A'})} onClick=${onClose} aria-label="Tutup preview"><${Icon} n="x" s=${16} w=${2.4}/>Tutup</button>
      </span>
    </div>
    <div style=${{flex:1,minHeight:0,display:'flex',justifyContent:'center',alignItems:'flex-start',overflow:'auto',paddingBottom:8}}>
      <${DeviceStage} cur=${cur} setCur=${setCur} shared=${shared} patch=${patch} reserve=${70}/>
    </div>
  </div>`;
}

function App(){
  const [mode,setMode]=useState(()=>{try{return location.hash==='#device'?'device':'board';}catch(e){return 'board';}});
  const [z,setZ]=useState(.7);
  const [cur,setCur]=useState('splash');
  const [pv,setPv]=useState(null);
  const [shared,setShared]=useState({role:'warga',qty:4,species:'Beringin'});
  const patch=useCallback(p=>setShared(s=>Object.assign({},s,p)),[]);
  useEffect(()=>{try{history.replaceState(null,'',mode==='device'?'#device':'#board');}catch(e){}},[mode]);
  useEffect(()=>{if(!pv)return;const f=e=>{if(e.key==='Escape')setPv(null);};window.addEventListener('keydown',f);const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',f);document.body.style.overflow=o;};},[pv]);
  const toDevice=id=>{setCur(id);setPv(null);setMode('device');window.scrollTo(0,0);};
  return html`<div>
    <header className="topbar"><div style=${{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px 22px',padding:'10px 20px',minHeight:62}}>
      <div style=${{display:'flex',alignItems:'center',gap:10}}><${Logo} s=${34} c="#124734" bg="#EDF1F0"/><div><div className="serif" style=${{fontSize:22,lineHeight:1,fontWeight:500}}>BelikHub</div><div style=${{fontSize:12,color:'var(--mute)',marginTop:2}}>Mobile App Design Board · 18 layar · 6 alur</div></div></div>
      <div className="mseg" role="tablist" aria-label="Mode tampilan">
        <button role="tab" aria-selected=${mode==='board'} className=${mode==='board'?'on':''} onClick=${()=>setMode('board')}>Design Board</button>
        <button role="tab" aria-selected=${mode==='device'} className=${mode==='device'?'on':''} onClick=${()=>setMode('device')}>Interactive Device</button>
      </div>
      ${mode==='board'&&html`<div style=${{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}><span style=${{fontSize:12.5,color:'var(--mute)',fontWeight:600}}>Zoom</span><div className="mseg sm" role="group" aria-label="Zoom papan">${[[.5,'50%'],[.7,'70%'],[.85,'85%'],[1,'100%']].map(o=>html`<button key=${o[0]} className=${z===o[0]?'on':''} onClick=${()=>setZ(o[0])}>${o[1]}</button>`)}</div></div>`}
    </div></header>
    ${mode==='board'?html`<${Board} z=${z} onPreview=${setPv} shared=${shared} patch=${patch}/>`:html`<${DeviceMode} cur=${cur} setCur=${setCur} shared=${shared} patch=${patch}/>`}
    ${pv&&html`<${PreviewOverlay} id=${pv} onClose=${()=>setPv(null)} onOpenDevice=${toDevice} shared=${shared} patch=${patch}/>`}
  </div>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);