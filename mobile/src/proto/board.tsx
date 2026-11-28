// @ts-nocheck
// mobile/src/proto/board.tsx
// BelikHub app, ported 1:1 from belikhub-design-board.html (React + htm, same markup, same CSS).
// All data is sample data held in memory, exactly as in the board. Web only (renders DOM elements).

import React from 'react';
import htm from 'htm';

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
const reduceMotion=()=>{try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function useCountUp(v,on=true,ms=800){
  const anim=on&&!reduceMotion();
  const [x,setX]=useState(anim?0:v);
  const from=useRef(anim?0:v);
  useEffect(()=>{
    if(!anim){setX(v);from.current=v;return;}
    const a=from.current,b=v;
    if(a===b){setX(b);return;}
    let raf,t0=null;
    const step=t=>{if(t0==null)t0=t;const k=Math.min(1,(t-t0)/ms);const e=1-Math.pow(1-k,3);const val=a+(b-a)*e;from.current=val;setX(val);if(k<1)raf=requestAnimationFrame(step);else{from.current=b;setX(b);}};
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[v,anim]);
  return x;
}
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
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
wifi:'<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r=".6"/>',
};
const Icon=({n,s=22,c='currentColor',w=1.75})=>html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke=${c} strokeWidth=${w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${{flex:'none'}} dangerouslySetInnerHTML=${{__html:IC[n]||''}}></svg>`;

const Logo=({s=44,c='#fff',bg='#124734'})=>html`<svg width=${s} height=${s} viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C24 3 8 20 8 30.5a16 16 0 0 0 32 0C40 20 24 3 24 3z" fill=${c}/><path d="M24 39V26" stroke=${bg} strokeWidth="2.4" strokeLinecap="round" fill="none"/><path d="M24 29c0-6 3.5-9.5 9-9.5 0 6-3.5 9.5-9 9.5z" fill=${bg}/><path d="M24 33c0-4.5-2.5-7-7-7 0 4.5 2.5 7 7 7z" fill=${bg}/></svg>`;

/* ---------- topographic contours (water/terrain motif) ---------- */
function contourPath(cx,cy,r,i){let d='';const N=72;for(let k=0;k<=N;k++){const t=k/N*Math.PI*2;const rr=r*(1+0.09*Math.sin(3*t+i*0.7)+0.05*Math.sin(5*t+i*1.3)+0.03*Math.sin(2*t-i));const x=cx+rr*Math.cos(t)*1.2,y=cy+rr*Math.sin(t);d+=(k?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}return d+'Z';}
const Contours=({w,h,cx,cy,n=14,gap=26,color='#fff',op=.12})=>{
  const vb='0 0 '+w+' '+h;
  return html`<svg className="drift" style=${{position:'absolute',inset:0,pointerEvents:'none'}} width=${w} height=${h} viewBox=${vb} aria-hidden="true">${Array.from({length:n},(_,i)=>html`<path key=${i} d=${contourPath(cx,cy,18+i*gap,i)} fill="none" stroke=${color} strokeOpacity=${op} strokeWidth="1"/>`)}</svg>`;
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
    <path key=${'a'+gid} className="area-in" d=${area} fill=${'url(#'+gid+')'}/>
    <path key=${'l'+gid} className="draw-line" pathLength="1" d=${line} fill="none" stroke=${color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
    <circle key=${'c'+gid} className="dot-in" cx=${X(data.length-1)} cy=${Y(last)} r="4.5" fill="#fff" stroke=${color} strokeWidth="2.2"/>
    ${idx.map((i,k)=>html`<text key=${k} x=${X(i)} y=${h-6} textAnchor=${k===0?'start':k===4?'end':'middle'} fontSize="10.5" fill="rgba(15,23,42,.55)">${xl[k]}</text>`)}
  </svg>`;
}
function Spark({data,w=300,h=46,color='#124734',gid='sp'}){
  const lo=Math.min(...data)*.97,hi=Math.max(...data)*1.03;
  const X=i=>4+(w-8)*i/(data.length-1),Y=v=>4+(h-8)*(1-(v-lo)/(hi-lo));
  const line=data.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  const area=line+'L'+X(data.length-1)+' '+h+'L4 '+h+'Z';
  return html`<svg width="100%" viewBox=${'0 0 '+w+' '+h} aria-hidden="true" style=${{display:'block'}}><defs><linearGradient id=${gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor=${color} stopOpacity=".25"/><stop offset="1" stopColor=${color} stopOpacity="0"/></linearGradient></defs><path className="area-in" d=${area} fill=${'url(#'+gid+')'}/><path className="draw-line" pathLength="1" d=${line} fill="none" stroke=${color} strokeWidth="2" strokeLinejoin="round"/><circle className="dot-in" cx=${X(data.length-1)} cy=${Y(data[data.length-1])} r="3.6" fill="#fff" stroke=${color} strokeWidth="2"/></svg>`;
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
  warga:[{label:'Beranda',icon:'home',to:'w-home'},{label:'Bayar',icon:'wallet',to:'w-pay'},{label:'Struk',icon:'receipt',to:'w-receipt'},{label:'Lapor',icon:'alert',to:'w-report'},{label:'Profil',icon:'user',to:'w-profile'}],
  bumdes:[{label:'Dasbor',icon:'chart',to:'b-dash'},{label:'Meteran',icon:'gauge',to:'b-meter'},{label:'Kas',icon:'cash',to:'b-cash'},{label:'Warga',icon:'users',to:'b-customers'},{label:'Profil',icon:'user',to:'b-profile'}],
  relawan:[{label:'Patroli',icon:'route',to:'r-map'},{label:'Insiden',icon:'alert',to:'r-incident'},{label:'Reboisasi',icon:'sprout',to:'r-plant'},{label:'Riwayat',icon:'clock',to:'r-history'},{label:'Profil',icon:'user',to:'r-profile'}],
  donatur:[{label:'Program',icon:'leaf',to:'d-explore'},{label:'Donasi',icon:'heart',to:'d-checkout'},{label:'Dampak',icon:'chart',to:'d-impact'},{label:'Profil',icon:'user',to:'d-profile'}],
  pdam:[{label:'Agregat',icon:'chart',to:'p-agg'},{label:'Antrean',icon:'clip',to:'p-queue'},{label:'Peta',icon:'pin',to:'p-map'},{label:'Profil',icon:'user',to:'p-profile'}],
};
function TabBar({kind,active}){
  const {go,toast}=useP();
  return html`<nav className="tabbar" aria-label="Navigasi utama">${TABS[kind].map(t=>html`<button key=${t.label} className=${'tab'+(t.to===active?' on':'')} onClick=${()=>t.to?go(t.to):toast('Menu ini di luar cakupan papan prototipe')}><${Icon} n=${t.icon} s=${24} w=${t.to===active?2:1.7}/><span>${t.label}</span></button>`)}<i className="hbar"></i></nav>`;
}
const AUTH_IDS=['splash','login','portal'];
function SideNav({kind,active}){
  const {go,shared}=useP();
  return html`<aside className="side" aria-label="Navigasi utama">
    <div className="side-brand"><${Logo} s=${34} c="#fff" bg="#124734"/><span>BelikHub</span></div>
    <div className="side-role"><span className="eyebrow">Masuk sebagai</span><b>${ROLE_LABEL[shared.role]}</b></div>
    <nav>${(TABS[kind]||[]).map(t=>html`<button key=${t.to} className=${'side-item'+(t.to===active?' on':'')} aria-current=${t.to===active?'page':undefined} onClick=${()=>go(t.to)}><${Icon} n=${t.icon} s=${22} w=${t.to===active?2:1.7}/><span>${t.label}</span></button>`)}</nav>
    <button className="side-item out" onClick=${()=>go('splash')}><${Icon} n="back" s=${20}/><span>Ganti peran</span></button>
  </aside>`;
}
function Shell({bg,dark,under,tab,active,homeBg,homeBar,overlay,children}){
  const {desk,cur,shared}=useP();
  if(desk){
    if(AUTH_IDS.includes(cur))return html`<div className="shell" style=${{background:bg||'var(--canvas)'}}><div className="scroll">${children}</div>${overlay||null}</div>`;
    return html`<div className="shell dsk"><${SideNav} kind=${tab||shared.role} active=${active||cur}/><main className="dmain"><div className="scroll"><div className="col-w">${children}</div></div></main>${overlay||null}</div>`;
  }
  return html`<div className="shell" style=${{background:bg||'var(--canvas)'}}>
    ${under?html`<div className="sb-abs"><${StatusBar} dark=${dark}/></div>`:html`<${StatusBar} dark=${dark}/>`}
    <div className="scroll">${children}</div>
    ${tab?html`<${TabBar} kind=${tab} active=${active}/>`:html`<div className="home" style=${{background:homeBg||'transparent'}}><i style=${{background:homeBar||(dark?'#fff':'#0F172A')}}></i></div>`}
    ${overlay||null}
  </div>`;
}
function Phone({interactive,go,shared,patch,dir,desk,cur,children}){
  const [msg,setMsg]=useState(null);const tRef=useRef();
  const toast=useCallback(m=>{if(!interactive)return;setMsg({m,k:Date.now()});clearTimeout(tRef.current);tRef.current=setTimeout(()=>setMsg(null),2400);},[interactive]);
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  const ctx=useMemo(()=>({interactive,go:interactive?go:()=>{},toast,shared,patch:interactive?patch:()=>{},desk:!!desk,cur}),[interactive,go,toast,shared,patch,desk,cur]);
  return html`<${PhoneCtx.Provider} value=${ctx}><div className=${'phone '+(interactive?'live':'static')+(desk?' desk':'')} data-dir=${interactive?(dir||'fade'):undefined} inert=${interactive?undefined:''}><span className="island"></span>${children}${msg&&html`<div key=${msg.k} className="toast" role="status"><${Icon} n="info" s=${18}/><span>${msg.m}</span></div>`}</div><//>`;
}

/* ---------- shared UI atoms ---------- */
const NavBack=({to,label='Kembali'})=>{const {go}=useP();return html`<button className="back" onClick=${()=>go(to)} aria-label=${label}><${Icon} n="chl" s=${22} w=${2.2}/>${label}</button>`;};
const Seg=({items,value,onChange,style})=>html`<div className="seg" role="tablist" style=${Object.assign({'--n':items.length,'--i':Math.max(0,items.findIndex(it=>it.v===value))},style)}><span className="seg-thumb" aria-hidden="true"></span>${items.map(it=>html`<button key=${it.v} role="tab" aria-selected=${value===it.v} className=${value===it.v?'on':''} onClick=${()=>onChange(it.v)}>${it.l}</button>`)}</div>`;
const Row=({icon,bg='var(--forest)',title,sub,right,strong,onClick,chev,children})=>html`<${onClick?'button':'div'} className=${'r'+(icon?' ic':'')} onClick=${onClick}>${icon&&html`<span className="ri" style=${{background:bg}}><${Icon} n=${icon} s=${18} w=${2}/></span>`}<span className="col">${title&&html`<span className="rt">${title}</span>`}${sub&&html`<span className="rs">${sub}</span>`}${children}</span>${(right!=null||chev)&&html`<span className=${'rv num'+(strong?' strong':'')}>${right}${chev&&html`<${Icon} n="chr" s=${16} c="rgba(15,23,42,.3)" w=${2.4}/>`}</span>`}<//>`;
const Group=({head,headRight,foot,children,style})=>html`<${F}>${head&&html`<div className="gh"><span>${head}</span>${headRight&&html`<span style=${{textTransform:'none',letterSpacing:0,fontWeight:500}}>${headRight}</span>`}</div>`}<div className="g" style=${style}>${children}</div>${foot&&html`<div className="gf">${foot}</div>`}<//>`;
const Pill=({kind='ok',children,icon})=>html`<span className=${'pill '+kind}>${icon&&html`<${Icon} n=${icon} s=${12} w=${2.6}/>`}${children}</span>`;
const Keypad=({onKey})=>html`<div className="kp">${['1','2','3','4','5','6','7','8','9','','0','del'].map((k,i)=>k===''?html`<span key=${i} className="k ghost"></span>`:html`<button key=${i} className=${'k'+(k==='del'?' ghost':'')} onClick=${()=>onKey(k)} aria-label=${k==='del'?'Hapus':k}>${k==='del'?html`<${Icon} n="back" s=${26} w=${1.6}/>`:k}</button>`)}</div>`;
function Sheet({open,onClose,title,children}){
  const [vis,setVis]=useState(!!open);
  const [out,setOut]=useState(false);
  const [ent,setEnt]=useState(true);
  const last=useRef(children);
  const ref=useRef();
  const drag=useRef(null);
  if(open)last.current=children;
  useEffect(()=>{
    if(open){setVis(true);setOut(false);setEnt(true);const t=setTimeout(()=>setEnt(false),380);return()=>clearTimeout(t);}
    if(!vis)return;
    setOut(true);
    const t=setTimeout(()=>{setVis(false);setOut(false);},250);
    return()=>clearTimeout(t);
  },[open]);
  if(!open&&!vis)return null;
  const body=open?children:last.current;
  const down=e=>{const s=ref.current;if(!s)return;const k=s.offsetHeight?s.getBoundingClientRect().height/s.offsetHeight:1;drag.current={y:e.clientY,k:k||1,dy:0};try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}s.style.transition='none';setEnt(false);};
  const move=e=>{const d=drag.current,s=ref.current;if(!d||!s)return;d.dy=Math.max(0,(e.clientY-d.y)/d.k);s.style.transform='translateY('+d.dy+'px)';};
  const up=()=>{const d=drag.current,s=ref.current;drag.current=null;if(!d||!s)return;
    if(d.dy>80){onClose();}
    else{s.style.transition='transform .28s cubic-bezier(.2,.8,.2,1)';s.style.transform='';setTimeout(()=>{if(ref.current)ref.current.style.transition='';},300);}};
  const closing=out&&!open;
  return html`<div className=${'sheet-wrap'+(closing?' out':'')} onClick=${onClose} aria-hidden=${closing?'true':undefined}><div ref=${ref} className=${'sheet2'+(closing?' out':ent?' in':'')} role="dialog" aria-label=${title} onClick=${e=>e.stopPropagation()}><div className="sheet-grab" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}><div className="grab"></div></div><div style=${{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'2px 0 10px'}}><span className="serif" style=${{fontSize:24,fontWeight:500}}>${title}</span><button onClick=${onClose} aria-label="Tutup" style=${{width:32,height:32,borderRadius:16,border:0,background:'rgba(15,23,42,.07)',display:'grid',placeItems:'center'}}><${Icon} n="x" s=${16} w=${2.4}/></button></div>${body}</div></div>`;
}
const Toggle=({on,onChange,label})=>html`<button className=${'sw'+(on?' on':'')} role="switch" aria-checked=${on} aria-label=${label} onClick=${()=>onChange(!on)}></button>`;
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
    <div style=${{position:'relative',minHeight:'100%',display:'flex',flexDirection:'column'}}>
      <${Contours} w=${390} h=${810} cx=${290} cy=${120} n=${13} gap=${30} op=${.13}/>
      <div style=${{position:'relative',flex:1,minHeight:150,paddingTop:'clamp(28px,9vh,80px)',paddingBottom:18,textAlign:'center',color:'#fff'}}>
        <${Logo} s=${58}/>
        <div className="serif" style=${{fontSize:46,fontWeight:500,letterSpacing:'-.02em',lineHeight:1.05,marginTop:8}}>BelikHub</div>
        <div style=${{fontSize:15,opacity:.8,marginTop:6}}>Mata air terjaga, iuran transparan.</div>
        <div style=${{fontSize:12.5,opacity:.55,marginTop:3}}>Kabupaten Batang · bersama PDAM Batang</div>
      </div>
      <div className="sheet" style=${{position:'relative',flex:'none',paddingTop:18,paddingBottom:14,animation:'rise .6s both'}}>
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
  const [forgot,setForgot]=useState(false);
  const [left,setLeft]=useState(interactive?60:42);
  useInterval(()=>setLeft(s=>s>0?s-1:0),1000,interactive&&mode==='otp'&&step==='otp');
  const dest=role==='relawan'?'r-map':role==='bumdes'?'b-dash':'w-home';
  const press=setter=>k=>setter(c=>k==='del'?c.slice(0,-1):(c+k).slice(0,6));
  useEffect(()=>{if(interactive&&mode==='pin'&&pin.length===6){const t=setTimeout(()=>go('b-dash'),350);return()=>clearTimeout(t);}},[pin,mode]);
  const boxes=Array.from({length:6},(_,i)=>html`<span key=${i} className=${'obox num'+(i===code.length?' cur':'')}>${code[i]||''}</span>`);
  const dots=Array.from({length:6},(_,i)=>html`<span key=${i} className=${'pdot'+(i<pin.length?' on':'')}></span>`);
  return html`<${Shell} overlay=${html`<${ForgotSheet} open=${forgot} onClose=${()=>setForgot(false)}/>`}>
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
      <div style=${{textAlign:'center',marginTop:16}}><button onClick=${()=>setForgot(true)} style=${{border:0,background:'none',fontSize:13.5,color:'var(--forest)',fontWeight:600,padding:'6px 10px'}}>Lupa PIN? Hubungi bendahara BUMDes</button></div>
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
  const {go,shared,patch}=useP();
  const c=custById('siti');
  const pm=shared.paid.siti;
  const mt=meterNow(shared,c);
  const mine=shared.reports.filter(r=>r.mine);
  const nOpen=mine.filter(r=>r.st==='wait').length;
  return html`<${Shell} tab="warga" active="w-home">
    <div style=${{display:'flex',alignItems:'center',padding:'6px 20px 12px'}}>
      <div className="col"><span style=${{fontSize:14,color:'var(--mute)'}}>Selamat pagi,</span><span className="serif" style=${{fontSize:30,fontWeight:500,lineHeight:1.1}}>Bu Siti Aminah</span></div>
      <button className=${shared.notifRead?'':'bell-ring'} aria-label=${shared.notifRead?'Notifikasi':'Notifikasi, ada yang belum dibaca'} onClick=${()=>go('w-notif')} style=${{marginLeft:'auto',width:40,height:40,borderRadius:20,border:0,background:'#fff',display:'grid',placeItems:'center',position:'relative',boxShadow:'0 1px 2px rgba(15,23,42,.1)'}}><${Icon} n="bell" s=${20}/>${!shared.notifRead&&html`<i style=${{position:'absolute',top:9,right:10,width:8,height:8,borderRadius:4,background:'var(--amber)',border:'1.5px solid #fff'}}></i>`}</button>
    </div>
    <div className="idcard">
      <${Contours} w=${358} h=${176} cx=${290} cy=${40} n=${9} gap=${24} op=${.14}/>
      <div style=${{position:'absolute',inset:0,padding:18,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div style=${{display:'flex',alignItems:'center',gap:8}}><${Logo} s=${22}/><span style=${{letterSpacing:'.14em',fontSize:11,fontWeight:600,opacity:.85}}>KARTU PELANGGAN BELIK</span></div>
        <div><div className="serif" style=${{fontSize:27,fontWeight:500,lineHeight:1.1}}>Siti Aminah</div><div style=${{opacity:.8,fontSize:13,marginTop:2}}>RT 03 / RW 02 · Desa Bismo · sejak 2019</div></div>
        <div style=${{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div><div style=${{fontSize:10.5,letterSpacing:'.1em',opacity:.6}}>NO. PELANGGAN</div><div className="mono num" style=${{fontSize:18,letterSpacing:'.08em',marginTop:1}}>${c.no}</div></div>
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
        <span className="col"><span className="rt">Iuran Air November 2026</span><span className="rs num">${'Meteran '+c.prev+' → '+mt+' m³ · '+(pm?'dibayar 23 Nov':'jatuh tempo 28 Nov')}</span></span>
        <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:4}}><span className="num" style=${{fontSize:20,fontWeight:700,color:'var(--slate)'}}>Rp 15.000</span>${pm?html`<${Pill} icon="check">Lunas<//>`:html`<${Pill} kind="warn">Belum lunas<//>`}</span>
      </div>
    <//>
    <div className="pad mt12">${pm
      ?html`<button className="btn btn-s" onClick=${()=>{patch({rcpt:'now'});go('w-receipt');}}><${Icon} n="receipt" s=${20}/>Lihat Struk</button>`
      :html`<button className="btn btn-p" onClick=${()=>go('w-pay')}>Bayar Rp 15.000</button>`}</div>
    <${Group} head="Pintasan">
      <${Row} icon="receipt" bg="#475569" title="Riwayat pembayaran" sub="Struk bulan-bulan sebelumnya" chev onClick=${()=>go('w-history')}/>
      <${Row} icon="alert" bg="#D97706" title="Tiket laporan" sub=${mine.length?(nOpen+' menunggu validasi · '+mine.length+' tiket'):'Belum ada tiket'} chev onClick=${()=>go('w-report')}/>
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function Barcode(){const w=[2,1,3,1,2,2,1,3,2,1,1,3,2,1,2,3,1,1,2,2,3,1,2,1,3,2,1,2,1,1,3,2,2,1,3,1,2,1,2,3];let x=0;const bars=w.map((v,i)=>{const r=html`<rect key=${i} x=${x} y="0" width=${v} height="40" fill=${i%2?'transparent':'#0F172A'}/>`;x+=v;return r;});return html`<svg width="100%" viewBox=${'0 0 '+x+' 40'} preserveAspectRatio="none" height="40" aria-hidden="true">${bars}</svg>`;}

function WPay(){
  const {go,interactive,shared,patch}=useP();
  const paidM=shared.paid.siti;
  const [m,setM]=useState('qris');
  const [left,setLeft]=useState(interactive?900:872);
  const [chk,setChk]=useState(false);
  const tRef=useRef();
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  useInterval(()=>setLeft(s=>Math.max(0,s-1)),1000,interactive&&m==='qris'&&!chk&&!paidM);
  const exp=left===0;
  const confirm=()=>{setChk(true);tRef.current=setTimeout(()=>{patch(s=>({paid:Object.assign({},s.paid,{siti:'QRIS'}),notifRead:false,rcpt:'now'}));go('w-receipt');},1300);};
  if(paidM)return html`<${Shell} tab="warga" active="w-pay">
    <h1 className="lt">Bayar Iuran</h1>
    <p className="ls">Iuran Air November 2026 · BLK 0412 0087</p>
    <div style=${{display:'flex',flexDirection:'column',alignItems:'center',padding:'34px 0 8px',textAlign:'center'}}>
      <div style=${{width:62,height:62,borderRadius:31,background:'var(--forest)',display:'grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${34} c="#fff" w=${3}/></div>
      <div className="serif" style=${{fontSize:26,fontWeight:500,marginTop:12}}>Iuran November sudah lunas</div>
      <div className="rs num" style=${{marginTop:2}}>${paidM+' · Rp 15.000 · 23 Nov 2026'}</div>
    </div>
    <${Group} head="Rincian">
      <${Row} title="Operasional BUMDes 70%" right="Rp 10.500"/>
      <${Row} title="Kas Konservasi Belik 30%" right="Rp 4.500"/>
    <//>
    <div className="pad mt16"><button className="btn btn-p" onClick=${()=>{patch({rcpt:'now'});go('w-receipt');}}><${Icon} n="receipt" s=${20}/>Lihat Struk</button><button className="btn btn-s mt8" onClick=${()=>go('w-home')}>Kembali ke Beranda</button></div>
  <//>`;
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
      ?html`<button className="btn btn-p" disabled=${exp||chk} onClick=${confirm}>${chk?html`<${F}><span className="spin" style=${{width:18,height:18,borderWidth:2.5,borderColor:'rgba(255,255,255,.35)',borderTopColor:'#fff'}}></span>Memeriksa pembayaran...<//>`:'Saya sudah membayar'}</button>${exp&&html`<button className="btn btn-s mt8" onClick=${()=>setLeft(900)}>Buat QR baru</button>`}`
      :html`<button className="btn btn-s" onClick=${()=>go('w-home')}>Kembali ke Beranda</button>`}</div>
  <//>`;
}

function WReceipt(){
  const {go,interactive,shared}=useP();
  const [k,setK]=useState(0);
  const [share,setShare]=useState(false);
  const c=custById('siti');
  const r=RCPTS.find(x=>x.id===shared.rcpt)||RCPTS[0];
  const isNow=r.id==='now';
  const pm=isNow?(shared.paid.siti||'QRIS'):r.method;
  const mt=meterNow(shared,c);
  const meter=isNow?(c.prev+' → '+mt):r.meter;
  const use=isNow?mt-c.prev:r.use;
  const back=isNow?'w-home':'w-history';
  const L=(a,b,bold)=>html`<div className=${'ln num'} style=${{fontWeight:bold?600:400}}><span>${a}</span><span style=${{textAlign:'right'}}>${b}</span></div>`;
  const text='Struk iuran air '+r.period+' · '+plain(c.n)+' ('+c.no+'). Rp 15.000 lunas lewat '+pm+'. No. '+r.no+'. Terima kasih sudah menjaga mata air Tuk Bismo.';
  if(interactive&&isNow&&!shared.paid.siti)return html`<${Shell} tab="warga" active="w-receipt">
    <h1 className="lt">Struk</h1>
    <p className="ls">Belum ada struk untuk November 2026</p>
    <div style=${{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'40px 30px 10px'}}>
      <span style=${{width:62,height:62,borderRadius:31,background:'var(--sage)',color:'var(--forest)',display:'grid',placeItems:'center'}}><${Icon} n="receipt" s=${30} w=${1.8}/></span>
      <div className="serif" style=${{fontSize:24,fontWeight:500,marginTop:12}}>Struk terbit setelah iuran lunas</div>
      <div className="rs" style=${{marginTop:4,fontSize:14,lineHeight:1.45}}>Bayar lewat QRIS atau kasir BUMDes. Struk digital muncul otomatis di sini.</div>
    </div>
    <div className="pad mt12"><button className="btn btn-p" onClick=${()=>go('w-pay')}>Bayar Rp 15.000</button><button className="btn btn-s mt8" onClick=${()=>go('w-history')}>Lihat Riwayat Pembayaran</button></div>
  <//>`;
  return html`<${Shell} bg="#E4ECE9" overlay=${html`<${ShareSheet} open=${share} onClose=${()=>setShare(false)} title="Bagikan struk" text=${text}/>`}>
    <div style=${{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 12px 8px'}}>
      <button className="back" onClick=${()=>go(back)} style=${{padding:'0 6px'}} aria-label="Tutup"><${Icon} n="x" s=${22} w=${2}/></button>
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
          ${L('No.',r.no)}${L('Tanggal',r.date)}${L('Pelanggan',plain(c.n))}${L('ID',c.no)}${L('Metode',pm)}
          <hr/>
          ${L('Periode',r.period)}${L('Meteran',meter)}${L('Pemakaian',use+' m³')}${L('Iuran tetap','Rp 15.000')}
          <hr/>
          <div className="ln num" style=${{fontWeight:600,fontSize:14}}><span>TOTAL</span><span>Rp 15.000</span></div>
          <hr/>
          <div style=${{fontWeight:500,marginBottom:3}}>ALOKASI DANA</div>
          <div style=${{display:'flex',height:9,borderRadius:2,overflow:'hidden',margin:'4px 0 6px'}}><i style=${{width:'70%',background:'#124734'}}></i><i style=${{width:'30%',background:'#D97706'}}></i></div>
          <div className="ln num"><span><span style=${{color:'#124734'}}>■</span> Operasional BUMDes 70%</span><span>Rp 10.500</span></div>
          <div className="ln num"><span><span style=${{color:'#D97706'}}>■</span> Kas Konservasi Belik 30%</span><span>Rp 4.500</span></div>
          <hr/>
          <div style=${{display:'flex',alignItems:'center',gap:12}}>
            <div className="stamp-in" style=${{border:'2px solid #124734',color:'#124734',padding:'3px 9px',fontWeight:700,letterSpacing:'.12em',transform:'rotate(-6deg)'}}>LUNAS ✓</div>
            <div style=${{marginLeft:'auto',textAlign:'center',fontSize:9.5}}><${QR} size=${56} seed=${21}/><div>Verifikasi</div></div>
          </div>
          <div style=${{textAlign:'center',marginTop:10,fontSize:10.5}}>Terima kasih telah menjaga<br/>mata air Tuk Bismo.</div>
        </div>
      </div>
    </div>
    <div style=${{display:'flex',gap:10,padding:'4px 16px 0'}}>
      <button className="btn btn-s sm" style=${{flex:1,background:'#fff'}} onClick=${()=>setShare(true)}><${Icon} n="share" s=${18}/>Bagikan</button>
      <button className="btn btn-p sm" style=${{flex:1}} onClick=${()=>go(back)}>Selesai</button>
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
  const {shared,patch}=useP();
  const mine=shared.reports.filter(r=>r.mine);
  const [sel,setSel]=useState(null);
  const tk=mine.find(r=>r.id===sel)||mine[0];
  const [photo,setPhoto]=useState('demo');
  const [type,setType]=useState('Pipa bocor');
  const [desc,setDesc]=useState('Pipa PVC di depan rumah RT 03 bocor, air menggenang sejak pagi.');
  const [sent,setSent]=useState(null);
  const fileRef=useRef();
  const stRef=useRef();
  const KIND={'Pipa bocor':'pipe','Meteran rusak':'meter','Air keruh':'slide','Lainnya':'pipe'};
  const steps=['Laporan diterima','Ditinjau Admin PDAM','Teknisi ditugaskan','Perbaikan selesai'];
  const pick=e=>{const f=e.target.files&&e.target.files[0];if(f)setPhoto(URL.createObjectURL(f));};
  const submit=()=>{
    const id='LPR-2611-'+pad3(shared.seq.lap);
    const rep={id,t:type,w:'RT 03 Bismo',by:'Bu Siti Aminah',ago:'Baru saja',at:'23 Nov · 09.47',kind:KIND[type],photo:photo!=='demo'?photo:null,gps:'−7,0412° S, 109,9036° T',note:desc.trim(),st:'wait',mine:true};
    patch(s=>({reports:[rep].concat(s.reports),seq:Object.assign({},s.seq,{lap:s.seq.lap+1}),notifRead:false}));
    setSel(id);setSent(id);setDesc('');setPhoto('demo');
  };
  const viewStatus=()=>{setSent(null);setTimeout(()=>{try{stRef.current&&stRef.current.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}},60);};
  const rej=tk&&tk.st==='no';
  const step=tk?(tk.st==='ok'?2:1):0;
  const subs=tk?[tk.at,tk.st==='wait'?'Menunggu validasi PDAM':'Divalidasi PDAM','Teknisi menuju lokasi','Menunggu']:[];
  const stp=s=>s==='wait'?html`<${Pill} kind="warn">Menunggu<//>`:s==='ok'?html`<${Pill} icon="check">Ditugaskan<//>`:html`<${Pill} kind="bad">Ditolak<//>`;
  const overlay=html`<${Sheet} open=${!!sent} onClose=${()=>setSent(null)} title="Laporan terkirim">
    <div style=${{textAlign:'center',padding:'4px 0 2px'}}>
      <div style=${{width:54,height:54,borderRadius:27,background:'var(--forest)',display:'inline-grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${30} c="#fff" w=${3}/></div>
      <div className="mono num" style=${{fontSize:16,margin:'8px 0 4px'}}>${'#'+(sent||'')}</div>
      <div className="rs" style=${{fontSize:14,lineHeight:1.45,margin:'0 8px 14px'}}>Admin PDAM akan meninjau laporan Anda. Status berubah di sini dan muncul di Notifikasi.</div>
      <button className="btn btn-p" onClick=${viewStatus}>Lihat Status Tiket</button>
    </div>
  <//>`;
  return html`<${Shell} tab="warga" active="w-report" overlay=${overlay}>
    <h1 className="lt">Lapor Kerusakan</h1>
    <p className="ls">Foto, lokasi, dan jenis kerusakan. Lokasi terisi otomatis.</p>
    <div style=${{margin:'12px 16px 0',position:'relative',borderRadius:14,overflow:'hidden',height:112}}>
      ${photo==='demo'?html`<${Scene} kind=${KIND[type]} h=${112} radius=${0}/>`:html`<img src=${photo} alt="Foto laporan" style=${{width:'100%',height:112,objectFit:'cover',display:'block'}}/>`}
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
    ${mine.length>1&&html`<${Group} head="Tiket saya" foot="Ketuk tiket untuk melihat status penanganannya.">
      ${mine.map(r=>html`<${Row} key=${r.id} icon="alert" bg=${r.st==='no'?'#B42318':'#D97706'} title=${r.t+' · '+r.w} sub=${r.id+' · '+r.ago} right=${stp(r.st)} onClick=${()=>setSel(r.id)}/>`)}
    <//>`}
    ${tk&&html`<div ref=${stRef} style=${{scrollMarginTop:10}}><${Group} head="Status penanganan" headRight=${html`<span className="mono">#${tk.id}</span>`}>
      <div style=${{padding:'4px 0'}}>${steps.map((s,i)=>{const bad=rej&&i===1;const dim=i>step||(rej&&i>1);return html`<div key=${i} className=${'step'+(i<=step?' d':'')}><span className=${'nd'+(i<step?' f':i===step?' c':'')}>${i<step&&html`<${Icon} n="check" s=${11} c="#fff" w=${3.4}/>`}</span><span className="col"><span className="rt" style=${{fontSize:15,color:bad?'var(--red)':dim?'var(--mute)':'var(--slate)'}}>${bad?'Laporan ditolak':s}</span><span className="rs">${bad?'Ajukan ulang dengan foto yang lebih jelas':dim?'Menunggu':subs[i]}</span></span></div>`;})}</div>
    <//></div>`}
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
  const {go,interactive,shared}=useP();
  const st=dashStats(shared);
  const cLunas=useCountUp(st.lunas,interactive),cBelum=useCountUp(st.belum,interactive),cTunai=useCountUp(st.tunai,interactive);
  const pct=Math.round(st.lunas/180*100);
  const rts=RT_BASE.map(r=>[r[0],Math.min(r[2],r[1]+(st.rtAdd[r[0]]||0)),r[2]]);
  return html`<${Shell} tab="bumdes" active="b-dash">
    <h1 className="lt">Dasbor Lapangan</h1>
    <p className="ls">Pak Darto · BUMDes Tirta Bismo · Nov 2026</p>
    <div style=${{display:'flex',alignItems:'center',gap:18,padding:'16px 20px 4px'}}>
      <${Ring} value=${st.lunas} total=${180} size=${160}><div><div className="num" style=${{fontSize:40,fontWeight:700,lineHeight:1}}>${Math.round(cLunas)}</div><div className="rs num" style=${{marginTop:2}}>dari 180 rumah</div><div style=${{fontSize:12,fontWeight:600,color:'var(--forest)',marginTop:2}}>${'Lunas · '+pct+'%'}</div></div><//>
      <div className="col" style=${{gap:12,flex:1}}>
        <div><div className="eyebrow">Belum lunas</div><div style=${{display:'flex',alignItems:'center',gap:8}}><i style=${{width:10,height:10,borderRadius:5,background:'var(--amber)'}}></i><span className="num" style=${{fontSize:26,fontWeight:700}}>${Math.round(cBelum)}</span><span className="rs">rumah</span></div></div>
        <div><div className="eyebrow">Kas tunai di tangan</div><div className="num" style=${{fontSize:22,fontWeight:700}}>${rp(Math.round(cTunai))}</div></div>
      </div>
    </div>
    <div style=${{display:'flex',gap:10,padding:'12px 16px 0'}}>
      <button className="btn btn-s sm" style=${{flex:1}} onClick=${()=>go('b-meter')}><${Icon} n="gauge" s=${18}/>Catat Meteran</button>
      <button className="btn btn-p sm" style=${{flex:1}} onClick=${()=>go('b-cash')}><${Icon} n="cash" s=${18}/>Terima Tunai</button>
    </div>
    <${Group} head=${'Pemasukan bulan ini'} headRight=${'Total '+rp(st.total)}>
      <${Row} icon="cash" bg="#D97706" title="Tunai" sub=${st.nTunai+' rumah'} right=${rp(st.tunai)} strong/>
      <${Row} icon="qr" bg="#124734" title="QRIS" sub=${st.nQris+' rumah'} right=${rp(st.qris)} strong/>
    <//>
    <${Group} head="Penagihan per RT">
      ${rts.map(r=>{const p=r[1]/r[2];return html`<div key=${r[0]} className="r" style=${{padding:'10px 14px'}}><span style=${{width:46,fontWeight:600}}>${r[0]}</span><div style=${{flex:1}}><div className="track"><div className="fill" style=${{width:(p*100)+'%',background:p<.7?'var(--amber)':'var(--forest)'}}></div></div></div><span className="rv num strong" style=${{minWidth:44,justifyContent:'flex-end'}}>${r[1]}/${r[2]}</span></div>`;})}
    <//>
    <${Group} head="Perlu ditagih">
      <${Row} icon="users" bg="#475569" title=${st.belum+' rumah belum lunas'} sub="Buka daftar pelanggan untuk menagih" chev onClick=${()=>go('b-customers')}/>
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function BMeter(){
  const {go,toast,shared,patch}=useP();
  const c=custById(shared.cust);
  const prev=c.prev;
  const saved=shared.meters&&shared.meters[c.id];
  const [val,setVal]=useState(String(saved||prev+12));
  const [photo,setPhoto]=useState('demo');
  const [ocr,setOcr]=useState('ok');
  const [pickC,setPickC]=useState(false);
  const fileRef=useRef();
  useEffect(()=>{setVal(String(saved||c.prev+12));},[c.id]);
  const n=val===''?null:Number(val);
  const bad=n==null||isNaN(n)||n<prev;
  const use=bad?null:n-prev;
  const digits=String(isNaN(n)||n==null?0:n).padStart(5,'0').slice(-5).split('');
  const pick=e=>{const f=e.target.files&&e.target.files[0];if(f){setPhoto(URL.createObjectURL(f));setOcr('wait');setTimeout(()=>setOcr('ok'),1100);}};
  const save=()=>{patch(s=>({meters:Object.assign({},s.meters,{[c.id]:n})}));toast('Meteran '+plain(c.n)+' tersimpan: '+use+' m³');go('b-cash');};
  return html`<${Shell} tab="bumdes" active="b-meter" overlay=${html`<${CustomerSheet} open=${pickC} onClose=${()=>setPickC(false)}/>`}>
    <h1 className="lt">Catat Meteran</h1>
    <p className="ls">Pencatatan mandiri · Nov 2026</p>
    <${Group} style=${{marginTop:14}}>
      <${Row} title=${c.n} sub=${c.no+' · '+c.rt+' · Desa Bismo'} right=${saved?html`<${Pill} icon="check">Tercatat<//>`:null} chev onClick=${()=>setPickC(true)}/>
    <//>
    <div style=${{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'20px 0 6px'}}>
      <div className="odo num" role="img" aria-label=${'Angka meteran '+(val||0)}>${digits.map((d,i)=>html`<b key=${i}>${d}</b>`)}</div><span className="num" style=${{fontSize:20,fontWeight:600}}>m³</span>
    </div>
    <${Group} foot=${bad&&val!==''?html`<span style=${{color:'var(--red)'}}>Angka lebih kecil dari bulan lalu. Periksa lagi atau foto ulang meteran.</span>`:'Pemakaian dipakai untuk neraca debit Tuk Bismo dan deteksi kebocoran.'}>
      <${Row} title="Meteran bulan lalu" right=${prev+' m³'}/>
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
    <div className="pad mt16"><button className="btn btn-p" disabled=${bad||ocr==='wait'} onClick=${save}>Simpan & Lanjut Terima Bayar</button></div>
  <//>`;
}

function BCash(){
  const {go,interactive,toast,shared,patch}=useP();
  const c=custById(shared.cust);
  const pm=payOf(c,shared);
  const done=!interactive||!!pm;
  const how=pm||'Tunai';
  const [pickC,setPickC]=useState(false);
  const [pr,setPr]=useState(false);
  const [sent,setSent]=useState(false);
  const [got,setGot]=useState(15000);
  useEffect(()=>{setSent(false);setGot(15000);},[c.id]);
  const change=got-15000;
  const accept=()=>{patch(s=>({paid:Object.assign({},s.paid,{[c.id]:'Tunai'}),notifRead:false}));toast('Pembayaran tunai tercatat');};
  const greet=c.n.split(' ').slice(0,2).join(' ');
  const overlay=html`<${F}><${CustomerSheet} open=${pickC} onClose=${()=>setPickC(false)}/><${PrintSheet} open=${pr} onClose=${()=>setPr(false)} no=${'TRX-261123-'+c.no.slice(-4)}/><//>`;
  return html`<${Shell} tab="bumdes" active="b-cash" overlay=${overlay}>
    <h1 className="lt">Terima Bayar Tunai</h1>
    <p className="ls">Iuran Air November 2026</p>
    <${Group} style=${{marginTop:14}}><${Row} title=${c.n} sub=${c.no+' · '+c.rt} right=${done?html`<${Pill} icon="check">Lunas<//>`:html`<${Pill} kind="warn">Belum lunas<//>`} chev onClick=${()=>setPickC(true)}/><//>
    ${!done?html`<${F}>
      <div style=${{textAlign:'center',padding:'26px 0 8px'}}><div className="eyebrow">Tagihan</div><div className="num" style=${{fontSize:48,fontWeight:700,letterSpacing:'-.02em'}}>Rp 15.000</div></div>
      <div className="gh" style=${{paddingTop:12}}><span>Uang diterima</span></div>
      <div className="chips">${[[15000,'Pas Rp 15.000'],[20000,'Rp 20.000'],[50000,'Rp 50.000']].map(x=>html`<button key=${x[0]} className=${'chip num'+(got===x[0]?' on':'')} onClick=${()=>setGot(x[0])}>${x[1]}</button>`)}</div>
      <${Group} style=${{marginTop:14}}><${Row} title="Kembalian" right=${rp(change)} strong/><//>
      <div className="pad mt16"><button className="btn btn-p" style=${{height:56}} onClick=${accept}><${Icon} n="cash" s=${22}/>Terima Tunai Rp 15.000</button></div>
    <//>`:html`<${F}>
      <div style=${{display:'flex',flexDirection:'column',alignItems:'center',padding:'18px 0 4px'}}>
        <div style=${{width:58,height:58,borderRadius:29,background:'var(--forest)',display:'grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${32} c="#fff" w=${3}/></div>
        <div className="serif" style=${{fontSize:24,fontWeight:500,marginTop:10}}>${how==='Tunai'?'Pembayaran tercatat':'Sudah lunas'}</div>
        <div className="rs num">${how+' Rp 15.000 · 23 Nov 2026 09:41'}</div>
      </div>
      <${Group} head="Kirim struk ke warga">
        <div className="r" style=${{display:'block',padding:'12px 14px',background:'var(--sage)'}}>
          <div className="rs num" style=${{marginBottom:6}}>${'Ke: '+c.n+' · '+c.wa}</div>
          <div className="bubble">${'Halo '+greet+', iuran air Nov 2026 Rp 15.000 sudah kami terima'+(how==='Tunai'?' tunai':' lewat '+how)+'. Alokasi: 70% operasional BUMDes, 30% Kas Konservasi Belik Tuk Bismo. Terima kasih sudah menjaga mata air. Pak Darto, BUMDes Tirta Bismo.'}<div className="num" style=${{textAlign:'right',fontSize:11,color:'var(--mute)',marginTop:3}}>09:41 ${sent?'✓✓':''}</div></div>
        </div>
      <//>
      <div style=${{display:'flex',gap:10,padding:'14px 16px 0'}}>
        <button className="btn btn-p sm" style=${{flex:1.3,height:48}} onClick=${()=>{setSent(true);toast('Struk terkirim ke WhatsApp '+greet);}}><${Icon} n="chat" s=${18}/>${sent?'Terkirim':'Kirim WhatsApp'}</button>
        <button className="btn btn-s sm" style=${{flex:1,height:48}} onClick=${()=>setPr(true)}><${Icon} n="printer" s=${18}/>Cetak</button>
      </div>
      <div style=${{display:'flex',gap:10,padding:'10px 16px 0'}}>
        <button className="btn sm" style=${{flex:1,background:'transparent',color:'var(--forest)'}} onClick=${()=>go('b-customers')}>Pelanggan berikutnya</button>
        <button className="btn sm" style=${{flex:1,background:'transparent',color:'var(--forest)'}} onClick=${()=>go('b-dash')}>Ke Dasbor</button>
      </div>
    <//>`}
  <//>`;
}


/* ============================================================
   ALUR 4 · RELAWAN KONSERVASI
   ============================================================ */
const CPS=['Gerbang Hutan','Pos 2 Lereng Barat','Sumber Tuk Bismo','Pos 4 Punggung','Pos 5 Lereng Timur','Pos 6 Hulu'];
const CPT=[[112,368],[140,318],[190,250],[246,206],[286,158],[232,116]];
function RMap(){
  const {interactive,toast,go,patch}=useP();
  const [inside,setInside]=useState(true);
  const [run,setRun]=useState(false);
  const [sec,setSec]=useState(0);
  const [lay,setLay]=useState({forest:true,river:true,contour:true,route:true});
  const [layOpen,setLayOpen]=useState(false);
  const [focus,setFocus]=useState(false);
  const [sum,setSum]=useState(null);
  const fRef=useRef();
  useEffect(()=>()=>clearTimeout(fRef.current),[]);
  useInterval(()=>setSec(s=>s+1),1000,run);
  const km=sec*0.0014;
  const cps=Math.min(6,Math.floor(sec/6));
  const me=inside?[150,300]:[338,92];
  const route=CPT.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('');
  const rings=Array.from({length:9},(_,i)=>html`<path key=${i} d=${contourPath(236,236,26+i*30,i+2)} fill="none" stroke="#124734" strokeOpacity=".14"/>`);
  const end=()=>{
    setRun(false);
    if(sec<3){setSec(0);toast('Patroli dibatalkan, terlalu singkat untuk dicatat');return;}
    const rec={id:'p'+Date.now(),when:'23 Nov',km:Math.round(km*100)/100,cps,dur:hms(sec)};
    patch(s=>({patrols:[rec].concat(s.patrols)}));
    setSum(rec);setSec(0);
  };
  const locate=()=>{setFocus(true);clearTimeout(fRef.current);fRef.current=setTimeout(()=>setFocus(false),2600);};
  const tog=(k,v)=>setLay(l=>Object.assign({},l,{[k]:v}));
  const bx=Math.min(me[0]-66,390-138);
  const overlay=html`<${F}>
    <${Sheet} open=${layOpen} onClose=${()=>setLayOpen(false)} title="Lapisan peta">
      <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
        ${[['forest','Batas hutan lindung'],['river','Alur air'],['contour','Kontur topografi'],['route','Rute dan titik cek']].map(l=>html`<div key=${l[0]} className="r"><span className="rt">${l[1]}</span><span className="rv"><${Toggle} on=${lay[l[0]]} onChange=${v=>tog(l[0],v)} label=${l[1]}/></span></div>`)}
      </div>
    <//>
    <${Sheet} open=${!!sum} onClose=${()=>setSum(null)} title="Patroli tersimpan">
      <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
        <${Row} icon="route" bg="#124734" title="Jarak" right=${sum?dec(sum.km,2)+' km':''} strong/>
        <${Row} icon="clock" bg="#475569" title="Waktu" right=${sum?sum.dur:''} strong/>
        <${Row} icon="pin" bg="#D97706" title="Titik cek" right=${sum?sum.cps+' dari 6':''} strong/>
      </div>
      <button className="btn btn-p mt12" onClick=${()=>{setSum(null);go('r-history');}}>Lihat Riwayat</button>
      <button className="btn btn-s mt8" onClick=${()=>setSum(null)}>Tutup</button>
    <//>
  <//>`;
  return html`<${Shell} tab="relawan" active="r-map" under overlay=${overlay}>
    <div style=${{position:'relative',height:'100%',background:'#DCE7E1'}}>
      <svg width="390" height="761" viewBox="0 0 390 761" style=${{position:'absolute',inset:0}} role="img" aria-label="Peta patroli Hutan Lindung Bismo">
        <rect width="390" height="761" fill="#DCE7E1"/>
        ${lay.contour&&rings}
        ${lay.forest&&html`<path d="M40 120 C80 60 200 40 300 80 C360 110 380 200 340 290 C300 360 180 400 100 380 C40 340 10 190 40 120Z" fill="rgba(18,71,52,.20)" stroke="rgba(18,71,52,.45)" strokeWidth="1.5"/>`}
        ${lay.river&&html`<path d="M-10 400 C60 350 120 370 170 320 S270 290 320 350 S380 420 400 440" stroke="#9CC5DA" strokeWidth="9" fill="none" strokeLinecap="round"/>`}
        <circle cx="190" cy="250" r="126" fill="rgba(18,71,52,.10)" stroke="#124734" strokeWidth="2" strokeDasharray="7 6"/>
        ${lay.route&&html`<g><path d=${route} fill="none" stroke="#D97706" strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round"/>
        ${CPT.map((p,i)=>{const done=i<cps;return html`<g key=${i+(done?'d':'u')} className=${done?'cp-pop':undefined}><circle cx=${p[0]} cy=${p[1]} r="12" fill=${done?'#124734':'#fff'} stroke="#124734" strokeWidth="2"/>${done?html`<path d=${'M'+(p[0]-4.5)+' '+p[1]+'l3.2 3.4 6-6.6'} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>`:html`<text x=${p[0]} y=${p[1]+4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#124734">${i+1}</text>`}</g>`;})}</g>`}
        <g><circle cx="190" cy="250" r="22" fill="#124734" opacity=".18"/><circle cx="190" cy="250" r="14" fill="#124734"/><path d="M190 242s-5.4 5.6-5.4 9.2a5.4 5.4 0 0 0 10.8 0c0-3.6-5.4-9.2-5.4-9.2z" fill="#fff"/></g>
        <g><rect x="152" y="270" width="76" height="22" rx="11" fill="#fff"/><text x="190" y="285" textAnchor="middle" fontSize="12" fontWeight="700" fill="#124734">Tuk Bismo</text></g>
        <g><circle cx=${me[0]} cy=${me[1]} r="9" fill="rgba(10,132,255,.3)"><animate attributeName="r" values="9;24" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.8s" repeatCount="indefinite"/></circle><circle cx=${me[0]} cy=${me[1]} r="8.5" fill="#0A84FF" stroke="#fff" strokeWidth="3.5"/></g>
        ${focus&&html`<g><rect x=${bx} y=${me[1]-52} width="132" height="28" rx="14" fill="#0F172A"/><text x=${bx+66} y=${me[1]-33.5} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">Anda di sini · ±5 m</text></g>`}
      </svg>
      <div style=${{position:'absolute',top:60,left:14,right:14,display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.94)',backdropFilter:'blur(10px)',borderRadius:16,padding:'10px 12px',boxShadow:'0 6px 18px -8px rgba(15,23,42,.35)'}}>
        <span className="ri" style=${{background:'var(--forest)'}}><${Icon} n="mountain" s=${18} w=${2}/></span>
        <span className="col" style=${{flex:1}}><span style=${{fontWeight:600,fontSize:15}}>Hutan Lindung Bismo</span><span className="rs num">${inside?'Dalam zona · 120 m dari sumber':'Di luar zona · 310 m dari sumber'}</span></span>
        <${Pill} kind=${inside?'ok':'warn'}>${inside?'Geofence aktif':'Keluar zona'}<//>
      </div>
      <div style=${{position:'absolute',right:14,top:128,display:'flex',flexDirection:'column',gap:8}}>
        ${['layers','cross'].map(n=>html`<button key=${n} aria-label=${n==='layers'?'Lapisan peta':'Lokasi saya'} onClick=${()=>n==='layers'?setLayOpen(true):locate()} style=${{width:42,height:42,borderRadius:21,border:0,background:'rgba(255,255,255,.94)',display:'grid',placeItems:'center',boxShadow:'0 4px 12px -6px rgba(15,23,42,.4)'}}><${Icon} n=${n} s=${20}/></button>`)}
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
  const {go,shared,patch}=useP();
  const [type,setType]=useState('longsor');
  const [sev,setSev]=useState('sedang');
  const [note,setNote]=useState('Longsor kecil di lereng timur, tanah menutup alur air menuju sumber.');
  const [photos,setPhotos]=useState(['slide','forest']);
  const [sent,setSent]=useState(null);
  const fileRef=useRef();
  const types=[{id:'hutan',t:'Degradasi hutan',s:'Penebangan atau pembukaan lahan',ic:'leaf',bg:'#2F8F5B',k:'forest'},{id:'sampah',t:'Tumpukan sampah',s:'Dekat alur air atau sumber',ic:'trash',bg:'#475569',k:'trash'},{id:'longsor',t:'Longsor lereng',s:'Tanah bergerak, tutupan terbuka',ic:'mountain',bg:'#D97706',k:'slide'}];
  const SEV={ringan:'Ringan',sedang:'Sedang',berat:'Berat'};
  const add=e=>{const f=e.target.files&&e.target.files[0];if(f&&photos.length<3)setPhotos(p=>[...p,URL.createObjectURL(f)]);};
  const submit=()=>{
    const T=types.find(x=>x.id===type);
    const id='INS-2611-'+pad3(shared.seq.ins);
    const blob=photos.find(p=>p.indexOf('blob:')===0);
    const rec={id,t:T.t,sev:SEV[sev],by:'Pak Slamet',ago:'Baru saja',kind:T.k,photo:blob||null,gps:'−7,0431° S, 109,9058° T',note:note.trim(),st:'wait',mine:true};
    patch(s=>({incidents:[rec].concat(s.incidents),seq:Object.assign({},s.seq,{ins:s.seq.ins+1}),notifRead:false}));
    setSent(id);
  };
  const again=()=>{setSent(null);setNote('');setPhotos([]);setType('hutan');setSev('ringan');};
  const overlay=html`<${Sheet} open=${!!sent} onClose=${()=>setSent(null)} title="Insiden terkirim">
    <div style=${{textAlign:'center',padding:'4px 0 2px'}}>
      <div style=${{width:54,height:54,borderRadius:27,background:'var(--forest)',display:'inline-grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${30} c="#fff" w=${3}/></div>
      <div className="mono num" style=${{fontSize:16,margin:'8px 0 4px'}}>${'#'+(sent||'')}</div>
      <div className="rs" style=${{fontSize:14,lineHeight:1.45,margin:'0 8px 14px'}}>Laporan diteruskan ke BUMDes dan Admin PDAM. Pantau statusnya di Riwayat.</div>
      <button className="btn btn-p" onClick=${()=>{setSent(null);go('r-history');}}>Lihat Riwayat</button>
      <button className="btn btn-s mt8" onClick=${again}>Lapor Insiden Lain</button>
    </div>
  <//>`;
  return html`<${Shell} tab="relawan" active="r-incident" overlay=${overlay}>
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
        ${photos.map((p,i)=>html`<div key=${p+i} style=${{width:64,height:64,borderRadius:10,overflow:'hidden',flex:'none',position:'relative'}}>${p.indexOf('blob:')===0?html`<img src=${p} alt="Foto insiden" style=${{width:64,height:64,objectFit:'cover'}}/>`:html`<${Scene} kind=${p} h=${64} radius=${0}/>`}<button aria-label="Hapus foto" onClick=${()=>setPhotos(l=>l.filter((_,j)=>j!==i))} style=${{position:'absolute',top:3,right:3,width:20,height:20,borderRadius:10,border:0,background:'rgba(15,23,42,.72)',color:'#fff',display:'grid',placeItems:'center',padding:0}}><${Icon} n="x" s=${12} w=${2.8}/></button></div>`)}
        ${photos.length<3&&html`<button onClick=${()=>fileRef.current&&fileRef.current.click()} aria-label="Tambah foto" style=${{width:64,height:64,borderRadius:10,border:'1.5px dashed rgba(15,23,42,.3)',background:'transparent',display:'grid',placeItems:'center',color:'var(--mute)'}}><${Icon} n="camera" s=${24}/></button>`}
        <input ref=${fileRef} type="file" accept="image/*" capture="environment" hidden onChange=${add} aria-label="Tambah foto insiden"/>
      </div>
    <//>
    <${Group} style=${{marginTop:12}}><div className="r"><textarea className="in" rows="2" value=${note} onChange=${e=>setNote(e.target.value)} aria-label="Catatan insiden"></textarea></div><//>
    <div className="pad mt12"><button className="btn btn-a" disabled=${!note.trim()} onClick=${submit}><${Icon} n="send" s=${19}/>Kirim Laporan Insiden</button></div>
    <div style=${{height:12}}></div>
  <//>`;
}

function RPlant(){
  const {toast,go,interactive,shared,patch}=useP();
  const [sp,setSp]=useState('Beringin');
  const [qty,setQty]=useState(12);
  const [photo,setPhoto]=useState('demo');
  const fileRef=useRef();
  const total=shared.plant.total;
  const cTot=Math.round(useCountUp(total,interactive));
  const items=['Bibit tegak dan tidak layu','Mulsa dan ajir terpasang','Gulma sekitar bibit disiangi','Kelembapan tanah cukup','Tidak ada tanda hama atau penyakit'];
  const [chk,setChk]=useState([true,true,true,false,false]);
  const n=chk.filter(Boolean).length;
  const pickP=e=>{const f=e.target.files&&e.target.files[0];if(f)setPhoto(URL.createObjectURL(f));};
  const save=()=>{
    const rec={id:'l'+Date.now(),when:'23 Nov',sp,n:qty,note:'Penanaman · monitoring '+n+'/5'};
    patch(s=>({plant:{total:s.plant.total+qty,logs:[rec].concat(s.plant.logs)}}));
    toast('Log tersimpan · +'+qty+' bibit '+sp);
  };
  return html`<${Shell} tab="relawan" active="r-plant">
    <h1 className="lt">Log Reboisasi</h1>
    <p className="ls">Sabuk Hijau Tuk Bismo · Plot B-12 lereng timur</p>
    <div style=${{padding:'12px 20px 0'}}>
      <div style=${{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><span><span className="num" style=${{fontSize:30,fontWeight:700}}>${cTot}</span><span className="rs num"> dari 500 bibit tertanam</span></span><${Pill} icon="check">Tumbuh 94%<//></div>
      <div className="track mt8"><div className="fill" style=${{width:Math.min(100,total/500*100)+'%',transition:'width .6s'}}></div></div>
    </div>
    <${Group} head="Tanam hari ini">
      <div className="r"><span className="rt">Jenis bibit</span><span className="rv" style=${{width:170}}><${Seg} value=${sp} onChange=${setSp} style=${{margin:0,width:'100%'}} items=${[{v:'Beringin',l:'Beringin'},{v:'Aren',l:'Aren'}]}/></span></div>
      <div className="r"><span className="rt">Jumlah ditanam</span><span className="rv"><span className="stepper"><button aria-label="Kurangi" onClick=${()=>setQty(Math.max(1,qty-1))}>−</button><span className="num">${qty}</span><button aria-label="Tambah" onClick=${()=>setQty(qty+1)}>+</button></span></span></div>
      <div className="r"><span className="rt">Foto dokumentasi</span><span className="rv"><button onClick=${()=>fileRef.current&&fileRef.current.click()} aria-label="Ganti foto dokumentasi" style=${{width:58,height:40,borderRadius:8,overflow:'hidden',border:0,padding:0,background:'none'}}>${photo==='demo'?html`<${Scene} kind="sapling" h=${40} radius=${0}/>`:html`<img src=${photo} alt="Foto dokumentasi" style=${{width:58,height:40,objectFit:'cover',display:'block'}}/>`}</button><input ref=${fileRef} type="file" accept="image/*" capture="environment" hidden onChange=${pickP} aria-label="Pilih foto dokumentasi"/></span></div>
    <//>
    <${Group} head="Monitoring berkala · ke-3 (hari ke-90)" headRight=${n+'/5'}>
      ${items.map((t,i)=>html`<button key=${i} className="r" onClick=${()=>setChk(c=>c.map((v,j)=>j===i?!v:v))} aria-pressed=${chk[i]}><${Check} on=${chk[i]}/><span className="rt" style=${{fontSize:15,fontWeight:chk[i]?500:400,color:chk[i]?'var(--slate)':'var(--mute)'}}>${t}</span></button>`)}
    <//>
    <div className="pad mt12"><button className="btn btn-p" onClick=${save}><${Icon} n="sprout" s=${20}/>Simpan Log Reboisasi</button></div>
    <${Group} head="Log terakhir">
      ${shared.plant.logs.slice(0,3).map(l=>html`<${Row} key=${l.id} icon="sprout" bg="#2F8F5B" title=${l.n+' bibit '+l.sp} sub=${l.when+' · '+l.note}/>`)}
      <${Row} title="Lihat semua riwayat" chev onClick=${()=>go('r-history')}/>
    <//>
    <div style=${{height:10}}></div>
  <//>`;
}

/* ============================================================
   ALUR 5 · DONATUR HIJAU
   ============================================================ */
function DExplore(){
  const {shared,patch,go,interactive}=useP();
  const qty=shared.qty,sp=shared.species;
  const funded=312+shared.donations.reduce((a,d)=>a+d.qty,0);
  const cF=Math.round(useCountUp(funded,interactive));
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
      <div style=${{display:'flex',justifyContent:'space-between',fontSize:13.5}}><span style=${{fontWeight:600}}>Terdanai</span><span className="num" style=${{color:'var(--mute)'}}>${cF+' dari 500 bibit'}</span></div>
      <div className="track mt8"><div className="fill" style=${{width:Math.min(100,funded/500*100)+'%'}}></div></div>
    </div>
    <div className="pad mt16"><button className="btn btn-p" onClick=${()=>go('d-checkout')}>Lanjut Donasi · ${rp(qty*25000)}</button></div>
    <div style=${{height:12}}></div>
  <//>`;
}

function Cert({name,qty,sp,paid,no='BLK-SD-2611-0031',date='23 Nov 2026'}){
  return html`<div className="cert">
    <div style=${{fontFamily:'var(--fb)',fontSize:9.5,letterSpacing:'.24em',fontWeight:600,color:'var(--forest)'}}>SERTIFIKAT DONATUR</div>
    <div style=${{fontStyle:'italic',fontSize:15,marginTop:2}}>Sabuk Hijau Tuk Bismo</div>
    <div style=${{fontFamily:'var(--fb)',fontSize:11,color:'var(--mute)',marginTop:8}}>diberikan kepada</div>
    <div style=${{fontSize:28,fontWeight:500,lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 6px'}}>${name||'Nama Donatur'}</div>
    <div style=${{fontFamily:'var(--fb)',fontSize:11.5,marginTop:6,lineHeight:1.45,padding:'0 8px'}}>atas <b className="num">${qty}</b> bibit <b>${sp}</b> penahan air yang ditanam di lereng sumber Tuk Bismo, Kabupaten Batang.</div>
    <div className="mono num" style=${{display:'flex',justifyContent:'space-between',fontSize:9.5,marginTop:10,padding:'0 6px',color:'var(--mute)'}}><span>${'No. '+no}</span><span>${date}</span></div>
    ${paid&&html`<span className="stamp">TERBIT</span>`}
  </div>`;
}

function DCheckout(){
  const {shared,go,interactive,toast,patch}=useP();
  const qty=shared.qty,sp=shared.species,total=qty*25000;
  const [paid,setPaid]=useState(false);
  const [kind,setKind]=useState('pribadi');
  const [names,setNames]=useState({pribadi:'Ratna Lestari',organisasi:'Komunitas Hijau Lestari'});
  const [no]=useState(()=>'BLK-SD-2611-'+pad4(shared.seq.don));
  const [share,setShare]=useState(false);
  const [left,setLeft]=useState(interactive?900:851);
  useInterval(()=>setLeft(s=>Math.max(0,s-1)),1000,interactive&&!paid);
  const exp=left===0;
  const nm=names[kind]||'Donatur';
  const pay=()=>{
    const d={id:no,no,qty,sp,name:nm,total,date:'23 Nov 2026'};
    patch(s=>({donations:[d].concat(s.donations),seq:Object.assign({},s.seq,{don:s.seq.don+1})}));
    setPaid(true);toast('Pembayaran diterima, sertifikat terbit');
  };
  const text='Sertifikat donatur Sabuk Hijau Tuk Bismo atas nama '+nm+': '+qty+' bibit '+sp+' penahan air. No. '+no+'.';
  return html`<${Shell} tab="donatur" active="d-checkout" overlay=${html`<${ShareSheet} open=${share} onClose=${()=>setShare(false)} title="Bagikan sertifikat" text=${text}/>`}>
    <h1 className="lt">Checkout Donasi</h1>
    <p className="ls">${paid?'Pembayaran diterima. Sertifikat Anda sudah terbit.':'Bayar dengan QRIS, sertifikat terbit otomatis.'}</p>
    <${Group} style=${{marginTop:12}}><${Row} icon="sprout" bg="#124734" title=${qty+' bibit '+sp} sub="Sabuk Hijau Tuk Bismo · Plot B-12" right=${rp(total)} strong/><//>
    ${!paid?html`<div className="g mt12" style=${{padding:'12px 14px',display:'flex',gap:14,alignItems:'center'}}>
      <div style=${{padding:5,border:'1px solid var(--line)',borderRadius:10,opacity:exp?.2:1,flex:'none'}}><${QR} size=${118} seed=${31}/></div>
      <div className="col" style=${{gap:3}}><span style=${{fontWeight:700,letterSpacing:'.08em',fontSize:12.5}}>QRIS</span><span className="num" style=${{fontSize:25,fontWeight:700}}>${rp(total)}</span><span className="num" style=${{fontSize:13.5,fontWeight:600,color:exp?'var(--red)':'var(--amber)'}}>${exp?'QR kedaluwarsa':'Berlaku '+mmss(left)}</span><span className="rs">Buka m-banking atau e-wallet, lalu pindai.</span></div>
    </div>`:html`<${Group} style=${{marginTop:12}}><${Row} icon="check" bg="#124734" title="Pembayaran diterima" sub=${'QRIS · '+rp(total)} right=${html`<${Pill}>Lunas<//>`}/><//>`}
    <div className="mt12"><${Seg} value=${kind} onChange=${setKind} items=${[{v:'pribadi',l:'Pribadi'},{v:'organisasi',l:'Organisasi'}]}/></div>
    <${Group} style=${{marginTop:10}}><div className="r"><span className="col" style=${{flex:1}}><span className="rs">Atas nama sertifikat</span><input className="in" value=${names[kind]} maxLength=${34} disabled=${paid} onChange=${e=>setNames(Object.assign({},names,{[kind]:e.target.value}))} aria-label="Nama pada sertifikat"/></span></div><//>
    <div style=${{padding:'12px 16px 0'}}><${Cert} name=${names[kind]} qty=${qty} sp=${sp} no=${no} paid=${paid}/></div>
    <div className="pad mt12">${paid
      ?html`<div style=${{display:'flex',gap:10}}><button className="btn btn-s sm" style=${{flex:1,height:48}} onClick=${()=>setShare(true)}><${Icon} n="share" s=${18}/>Bagikan</button><button className="btn btn-p sm" style=${{flex:1.3,height:48}} onClick=${()=>go('d-impact')}>Lihat Jejak Dampak</button></div>`
      :html`<button className="btn btn-p" disabled=${exp} onClick=${pay}>Saya sudah membayar</button>`}</div>
    <div style=${{height:12}}></div>
  <//>`;
}

function DImpact(){
  const {shared,go}=useP();
  const all=shared.donations.concat(DON0);
  const [selId,setSelId]=useState(null);
  const [view,setView]=useState('foto');
  const d=all.find(x=>x.id===selId)||all[0];
  const sp=d.sp,qty=d.qty;
  const items=d.seed?[
    {d:'02 Okt 2026',t:'Donasi diterima',s:rp(d.total)+' · '+qty+' bibit '+sp,done:true},
    {d:'18 Okt 2026',t:'Bibit ditanam',s:'Relawan Pak Slamet · Plot B-12',img:true,done:true,k1:'sapling',k2:'sat',seed:4,cap2:'Citra satelit Sentinel-2, plot B-12 sebelum tanam'},
    {d:'18 Nov 2026',t:'Pemantauan hari ke-30',s:'Semua bibit hidup, mulsa terpasang',img:true,done:true,k1:'sapling',k2:'sat',seed:9,cap2:'Citra satelit Sentinel-2, tutupan hijau plot B-12 naik'},
    {d:'16 Jan 2027',t:'Pemantauan hari ke-90',s:'Dijadwalkan relawan regu 2',done:false},
  ]:[
    {d:d.date,t:'Donasi diterima',s:rp(d.total)+' · '+qty+' bibit '+sp,done:true},
    {d:'Des 2026',t:'Bibit ditanam',s:'Dijadwalkan relawan regu 2 · Plot B-12',done:false},
    {d:'Jan 2027',t:'Pemantauan hari ke-30',s:'Foto relawan dan citra satelit',done:false},
    {d:'Mar 2027',t:'Pemantauan hari ke-90',s:'Dijadwalkan relawan regu 2',done:false},
  ];
  const stats=d.seed?[[String(qty),'bibit hidup'],['52','hari tertanam'],['100%','tumbuh']]:[[String(qty),'bibit didanai'],['0','hari tertanam'],['—','tumbuh']];
  return html`<${Shell} tab="donatur" active="d-impact">
    <h1 className="lt">Jejak Dampak</h1>
    <p className="ls">${qty+' bibit '+sp+' · Plot B-12 · donasi '+d.date}</p>
    ${all.length>1&&html`<div className="chips" style=${{marginTop:10}}>${all.map(x=>html`<button key=${x.id} className=${'chip num'+(x.id===d.id?' on':'')} onClick=${()=>setSelId(x.id)}>${x.qty+' bibit · '+x.date}</button>`)}</div>`}
    <div style=${{display:'flex',padding:'14px 20px 12px'}}>
      ${stats.map((m,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep" style=${{margin:'0 16px'}}></span>`}<div><div className="num serif" style=${{fontSize:30,fontWeight:500,lineHeight:1}}>${m[0]}</div><div className="rs">${m[1]}</div></div><//>`)}
    </div>
    <${Seg} value=${view} onChange=${setView} items=${[{v:'foto',l:'Foto relawan'},{v:'sat',l:'Citra satelit'}]}/>
    <div style=${{padding:'18px 20px 0'}}>
      ${items.map((it,i)=>html`<div key=${i} className="tl" style=${{paddingBottom:18}}>
        <span className=${'nd'+(it.done?' f':' u')}>${it.done&&html`<${Icon} n="check" s=${10} c="#fff" w=${3.6}/>`}</span>
        <div className="mono num" style=${{fontSize:11.5,color:'var(--mute)'}}>${it.d}</div>
        <div style=${{fontWeight:600,fontSize:16,color:it.done?'var(--slate)':'var(--mute)'}}>${it.t}</div>
        <div className="rs num">${it.s}</div>
        ${it.img&&html`<div style=${{marginTop:8}}><${Scene} kind=${view==='foto'?it.k1:it.k2} seed=${it.seed} h=${120} radius=${12}/><div className="rs" style=${{marginTop:4}}>${view==='foto'?'Foto relawan di lapangan':it.cap2}</div></div>`}
      </div>`)}
      <div className="rs" style=${{paddingBottom:6}}>Data pada prototipe ini adalah contoh.</div>
    </div>
    <${Group}><${Row} icon="award" bg="#D97706" title="Sertifikat donasi" sub=${'No. '+d.no} chev onClick=${()=>go('d-profile')}/><//>
    <div style=${{height:12}}></div>
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
  const {go,interactive,shared,patch}=useP();
  const sel=shared.belik;
  const [met,setMet]=useState('q');
  const b=BELIK.find(x=>x.id===sel)||BELIK[3];
  const total=BELIK.reduce((a,x)=>a+x.q,0);
  const cT=useCountUp(total,interactive);
  const nRep=belikReports(shared,b).length;
  return html`<${Shell} tab="pdam" active="p-agg">
    <h1 className="lt">Belik Utama Batang</h1>
    <p className="ls">5 sumber · diperbarui 09:41 · data simulasi</p>
    <div style=${{display:'flex',alignItems:'center',gap:14,padding:'12px 20px 4px'}}>
      <div><div className="eyebrow">Total debit</div><div className="num" style=${{fontSize:34,fontWeight:700,lineHeight:1.05}}>${dec(cT,1)} <span style=${{fontSize:14,color:'var(--mute)',fontWeight:500}}>L/dtk</span></div></div>
      <div style=${{marginLeft:'auto',display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}><${Pill}>3 normal<//><${Pill} kind="warn">1 waspada<//><${Pill} kind="bad" icon="alert">1 anomali<//></div>
    </div>
    <div style=${{padding:'8px 20px 4px',display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><span style=${{fontWeight:600,fontSize:15}}>${b.n} · ${met==='q'?'Debit':'Kekeruhan'} 24 jam</span><span className="rs num">${met==='q'?dec(b.q,1)+' L/dtk':dec(b.ntu,1)+' NTU'}</span></div>
    <div style=${{padding:'0 14px'}}><${AreaChart} data=${met==='q'?b.qs:b.ns} h=${112} color=${ST[b.st].c} gid=${'pa'+met+b.id} min=${0} max=${met==='q'?8:16} thr=${met==='n'?5:null} thrLabel="Ambang 5 NTU"/></div>
    <div style=${{marginTop:4}}><${Seg} value=${met} onChange=${setMet} items=${[{v:'q',l:'Debit (L/dtk)'},{v:'n',l:'Kekeruhan (NTU)'}]}/></div>
    <${Group} head="Sumber">
      ${BELIK.map(x=>html`<button key=${x.id} className="r" onClick=${()=>patch({belik:x.id})} style=${{padding:'9px 14px',background:sel===x.id?'rgba(226,236,233,.7)':'transparent'}} aria-pressed=${sel===x.id}>
        <i style=${{width:10,height:10,borderRadius:5,background:ST[x.st].c,flex:'none'}}></i>
        <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.n}</span><span className="rs">${x.d}</span></span>
        <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:3}}><${Pill} kind=${ST[x.st].k} icon=${x.st==='bad'?'alert':null}>${ST[x.st].l}<//><span className="num" style=${{fontSize:12.5,color:'var(--slate)'}}>${dec(x.q,1)} L/dtk · ${dec(x.ntu,1)} NTU</span></span>
      </button>`)}
    <//>
    <div className="gf" style=${{paddingBottom:4}}>Waspada jika kekeruhan di atas 3 NTU. Anomali jika di atas 5 NTU atau debit turun lebih dari 30%.</div>
    <${Group} head=${'Tindak lanjut · '+b.n}>
      ${nRep>0&&html`<${Row} icon="alert" bg="#B42318" title=${nRep+' laporan warga menunggu'} sub=${'Dari '+b.d+', buka antrean validasi'} chev onClick=${()=>go('p-queue')}/>`}
      <${Row} icon="pin" bg="#124734" title="Lihat di peta" sub="Sebaran lima belik utama" chev onClick=${()=>go('p-map')}/>
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function PQueue(){
  const {toast,shared,patch}=useP();
  const lap=shared.reports,cair=shared.cair,inc=shared.incidents;
  const [tab,setTab]=useState('lap');
  const [open,setOpen]=useState(()=>{const f=shared.reports.find(x=>x.st==='wait');return f?f.id:null;});
  const nl=lap.filter(x=>x.st==='wait').length,nc=cair.filter(x=>x.st==='wait').length,ni=inc.filter(x=>x.st==='wait').length;
  const avail=6450000-cair.filter(x=>x.st==='ok').reduce((a,x)=>a+x.amt,0);
  const setL=(id,st,msg)=>{patch(s=>({reports:s.reports.map(x=>x.id===id?Object.assign({},x,{st}):x),notifRead:false}));setOpen(null);toast(msg);};
  const setC=(id,st,msg)=>{patch(s=>({cair:s.cair.map(x=>x.id===id?Object.assign({},x,{st}):x)}));setOpen(null);toast(msg);};
  const setI=(id,st,msg)=>{patch(s=>({incidents:s.incidents.map(x=>x.id===id?Object.assign({},x,{st}):x),notifRead:false}));setOpen(null);toast(msg);};
  const first=t=>{const l=t==='lap'?lap:t==='cair'?cair:inc;const f=l.find(x=>x.st==='wait');return f?f.id:null;};
  const stp=s=>s==='wait'?html`<${Pill} kind="warn">Menunggu<//>`:s==='ok'?html`<${Pill} icon="check">${tab==='lap'?'Divalidasi':tab==='cair'?'Disetujui':'Ditindak'}<//>`:html`<${Pill} kind="bad">Ditolak<//>`;
  const empty=html`<div className="r rs">Tidak ada item.</div>`;
  return html`<${Shell} tab="pdam" active="p-queue">
    <h1 className="lt">Antrean Validasi</h1>
    <p className="ls">Laporan warga, insiden relawan, dan pencairan dana</p>
    <div className="mt12"><${Seg} value=${tab} onChange=${t=>{setTab(t);setOpen(first(t));}} items=${[{v:'lap',l:'Laporan ('+nl+')'},{v:'inc',l:'Insiden ('+ni+')'},{v:'cair',l:'Pencairan ('+nc+')'}]}/></div>
    ${tab==='lap'&&html`<${Group} head="Perlu ditinjau">
      ${lap.length===0?empty:lap.map(x=>html`<${F} key=${x.id}>
        <button className="r ic" onClick=${()=>setOpen(open===x.id?null:x.id)} style=${{padding:'10px 14px'}} aria-expanded=${open===x.id}>
          <span className="ri" style=${{background:x.link?'#B42318':'#D97706'}}><${Icon} n="alert" s=${18} w=${2}/></span>
          <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.t} · ${x.w}</span><span className="rs">${x.by} · ${x.ago}</span>${x.link&&html`<span style=${{marginTop:3}}><${Pill} kind="bad">${x.link}<//></span>`}</span>
          <span className="rv">${stp(x.st)}</span>
        </button>
        ${open===x.id&&html`<div className="r" style=${{display:'block',padding:'4px 14px 14px'}}>
          ${x.photo?html`<img src=${x.photo} alt="Foto laporan warga" style=${{width:'100%',height:104,objectFit:'cover',borderRadius:10,display:'block'}}/>`:html`<${Scene} kind=${x.kind} h=${104} radius=${10}/>`}
          <div style=${{fontSize:14,margin:'8px 0 2px'}}>${x.note}</div>
          <div className="rs num" style=${{display:'flex',alignItems:'center',gap:5}}><${Icon} n="pin" s=${13}/>${x.gps}</div>
          ${x.st==='wait'?html`<div style=${{display:'flex',gap:8,marginTop:10}}><button className="btn btn-d sm" style=${{flex:1}} onClick=${()=>setL(x.id,'no','Laporan ditolak')}>Tolak</button><button className="btn btn-p sm" style=${{flex:2}} onClick=${()=>setL(x.id,'ok','Divalidasi · teknisi ditugaskan')}>Validasi & tugaskan teknisi</button></div>`:null}
        </div>`}
      <//>`)}
    <//>`}
    ${tab==='inc'&&html`<${Group} head="Laporan relawan" foot="Insiden berat perlu ditindak dalam 24 jam.">
      ${inc.length===0?empty:inc.map(x=>html`<${F} key=${x.id}>
        <button className="r ic" onClick=${()=>setOpen(open===x.id?null:x.id)} style=${{padding:'10px 14px'}} aria-expanded=${open===x.id}>
          <span className="ri" style=${{background:x.sev==='Berat'?'#B42318':'#D97706'}}><${Icon} n=${x.kind==='trash'?'trash':x.kind==='forest'?'leaf':'mountain'} s=${18} w=${2}/></span>
          <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.t} · ${x.sev}</span><span className="rs">${x.by} · ${x.ago}</span></span>
          <span className="rv">${stp(x.st)}</span>
        </button>
        ${open===x.id&&html`<div className="r" style=${{display:'block',padding:'4px 14px 14px'}}>
          ${x.photo?html`<img src=${x.photo} alt="Foto insiden" style=${{width:'100%',height:104,objectFit:'cover',borderRadius:10,display:'block'}}/>`:html`<${Scene} kind=${x.kind} h=${104} radius=${10}/>`}
          <div style=${{fontSize:14,margin:'8px 0 2px'}}>${x.note}</div>
          <div className="rs num" style=${{display:'flex',alignItems:'center',gap:5}}><${Icon} n="pin" s=${13}/>${x.gps}</div>
          ${x.st==='wait'?html`<div style=${{display:'flex',gap:8,marginTop:10}}><button className="btn btn-d sm" style=${{flex:1}} onClick=${()=>setI(x.id,'no','Insiden ditolak')}>Tolak</button><button className="btn btn-p sm" style=${{flex:2}} onClick=${()=>setI(x.id,'ok','Insiden ditindak · tim PDAM dikirim')}>Tindak lanjuti</button></div>`:null}
        </div>`}
      <//>`)}
    <//>`}
    ${tab==='cair'&&html`<${Group} head="Pengajuan BUMDes" foot=${'Dana pemeliharaan tersedia '+rp(avail)+'.'}>
      ${cair.map(x=>html`<${F} key=${x.id}>
        <button className="r" onClick=${()=>setOpen(open===x.id?null:x.id)} style=${{padding:'11px 14px'}} aria-expanded=${open===x.id}>
          <span className="col"><span className="rt" style=${{fontSize:15.5}}>${x.t}</span><span className="rs">${x.by}</span></span>
          <span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:4}}><span className="num" style=${{fontWeight:700,color:'var(--slate)',fontSize:16}}>${rp(x.amt)}</span>${stp(x.st)}</span>
        </button>
        ${open===x.id&&html`<div className="r" style=${{display:'block',padding:'2px 14px 14px'}}>
          <div className="eyebrow" style=${{marginBottom:4}}>Rincian anggaran</div>
          ${x.rab.map((l,i)=>html`<div key=${i} style=${{display:'flex',justifyContent:'space-between',fontSize:14,padding:'3px 0',gap:10}}><span>${l[0]}</span><span className="num">${rp(l[1])}</span></div>`)}
          <div style=${{display:'flex',justifyContent:'space-between',fontWeight:700,borderTop:'1px solid var(--line)',marginTop:6,paddingTop:6}}><span>Total</span><span className="num">${rp(x.amt)}</span></div>
          ${x.st==='wait'?html`<div style=${{display:'flex',gap:8,marginTop:10}}><button className="btn btn-d sm" style=${{flex:1}} onClick=${()=>setC(x.id,'no','Pengajuan ditolak')}>Tolak</button><button className="btn btn-p sm" style=${{flex:2}} disabled=${x.amt>avail} onClick=${()=>setC(x.id,'ok','Pencairan disetujui · menunggu transfer')}>${x.amt>avail?'Dana tidak cukup':'Setujui pencairan'}</button></div>`:null}
        </div>`}
      <//>`)}
    <//>`}
    <div style=${{height:14}}></div>
  <//>`;
}


/* ============================================================
   DATA BERSAMA (satu sumber kebenaran lintas layar & peran)
   ============================================================ */
const pad3=n=>String(n).padStart(3,'0');
const pad4=n=>String(n).padStart(4,'0');
const hms=s=>pad2(Math.floor(s/3600))+':'+mmss(s%3600);
const plain=n=>n.replace(/^(Pak|Bu|Mbak|Mas)\s+/,'');
const CUSTOMERS=[
  {id:'siti',n:'Bu Siti Aminah',no:'BLK 0412 0087',rt:'RT 03',wa:'+62 812-3456-7890',prev:128,base:'belum'},
  {id:'rukmini',n:'Bu Rukmini',no:'BLK 0412 0091',rt:'RT 04',wa:'+62 813-2201-4417',prev:96,base:'belum'},
  {id:'darmo',n:'Pak Darmo',no:'BLK 0412 0102',rt:'RT 01',wa:'+62 857-1180-3392',prev:210,base:'belum'},
  {id:'wati',n:'Bu Wati',no:'BLK 0412 0118',rt:'RT 02',wa:'+62 821-4467-9015',prev:74,base:'belum'},
  {id:'sugeng',n:'Pak Sugeng',no:'BLK 0412 0124',rt:'RT 04',wa:'+62 815-6623-1180',prev:152,base:'belum'},
  {id:'lasmi',n:'Bu Lasmi',no:'BLK 0412 0133',rt:'RT 03',wa:'+62 852-9034-2271',prev:88,base:'belum'},
  {id:'harjo',n:'Pak Harjo',no:'BLK 0412 0140',rt:'RT 01',wa:'+62 878-5510-7743',prev:131,base:'belum'},
  {id:'yuni',n:'Mbak Yuni',no:'BLK 0412 0156',rt:'RT 02',wa:'+62 896-3302-5518',prev:67,base:'belum'},
  {id:'tarno',n:'Pak Tarno',no:'BLK 0412 0021',rt:'RT 01',wa:'+62 812-7745-0093',prev:140,base:'lunas',method:'QRIS'},
  {id:'ratmi',n:'Bu Ratmi',no:'BLK 0412 0034',rt:'RT 02',wa:'+62 813-6670-2814',prev:119,base:'lunas',method:'Tunai'},
  {id:'suyadi',n:'Pak Suyadi',no:'BLK 0412 0049',rt:'RT 03',wa:'+62 857-2209-6631',prev:105,base:'lunas',method:'Tunai'},
  {id:'painem',n:'Bu Painem',no:'BLK 0412 0066',rt:'RT 04',wa:'+62 821-9981-4402',prev:93,base:'lunas',method:'QRIS'},
];
const custById=id=>CUSTOMERS.find(c=>c.id===id)||CUSTOMERS[0];
const payOf=(c,s)=>c.base==='lunas'?c.method:((s.paid&&s.paid[c.id])||null);
const initials=n=>plain(n).split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const meterNow=(s,c)=>(s.meters&&s.meters[c.id])||c.prev+12;
const belikReports=(s,b)=>s.reports.filter(r=>r.st==='wait'&&r.w.indexOf(b.d.replace('Desa ',''))>=0);
const RT_BASE=[['RT 01',38,45],['RT 02',36,42],['RT 03',40,48],['RT 04',28,45]];
function dashStats(s){
  const e=Object.entries(s.paid||{});
  const nT=e.filter(x=>x[1]==='Tunai').length,nQ=e.length-nT;
  const rtAdd={};e.forEach(x=>{const rt=custById(x[0]).rt;rtAdd[rt]=(rtAdd[rt]||0)+1;});
  const lunas=142+e.length;
  return {lunas,belum:180-lunas,nTunai:76+nT,nQris:66+nQ,tunai:1140000+nT*15000,qris:990000+nQ*15000,total:2130000+e.length*15000,rtAdd};
}
const LAP0=[
  {id:'LPR-2611-014',t:'Pipa bocor',w:'RT 03 Bismo',by:'Bu Siti Aminah',ago:'2 jam lalu',at:'23 Nov · 07.41',kind:'pipe',gps:'−7,0412° S, 109,9036° T',note:'Pipa PVC di depan rumah bocor, air menggenang sejak pagi.',st:'wait',mine:true},
  {id:'LPR-2611-013',t:'Meteran rusak',w:'RT 01 Kalisari',by:'Pak Joko',ago:'5 jam lalu',at:'23 Nov · 04.30',kind:'meter',gps:'−7,0388° S, 109,9102° T',note:'Angka meteran macet di 00212.',st:'wait'},
  {id:'LPR-2611-012',t:'Air keruh',w:'RT 02 Gunungsari',by:'Bu Yati',ago:'1 hari lalu',at:'22 Nov · 16.10',kind:'slide',gps:'−7,0517° S, 109,9244° T',note:'Air keruh sejak kemarin sore. Lereng di atas sumber tampak longsor.',st:'wait',link:'Terkait anomali'},
  {id:'LPR-2611-011',t:'Pipa bocor',w:'RT 04 Wonokerto',by:'Pak Anwar',ago:'2 hari lalu',at:'21 Nov · 08.22',kind:'pipe',gps:'−7,0299° S, 109,9187° T',note:'Sambungan pipa utama merembes.',st:'wait'},
];
const INS0=[
  {id:'INS-2611-002',t:'Degradasi hutan',sev:'Berat',by:'Mbak Rina',ago:'4 hari lalu',kind:'forest',gps:'−7,0455° S, 109,9012° T',note:'Pembukaan lahan baru di batas timur hutan lindung, sekitar 0,3 hektare.',st:'wait'},
  {id:'INS-2611-004',t:'Longsor lereng',sev:'Sedang',by:'Pak Slamet',ago:'Kemarin',kind:'slide',gps:'−7,0431° S, 109,9058° T',note:'Retakan tanah di lereng timur, bibir longsor sekitar 4 meter.',st:'wait',mine:true},
  {id:'INS-2611-003',t:'Tumpukan sampah',sev:'Ringan',by:'Mbak Rina',ago:'3 hari lalu',kind:'trash',gps:'−7,0402° S, 109,9021° T',note:'Sampah plastik menumpuk di dekat alur air Tuk Bismo.',st:'ok',mine:true},
];
const CAIR0=[
  {id:1,t:'Perbaikan sambungan pipa RT 03–04',by:'BUMDes Tirta Bismo',amt:1250000,st:'wait',rab:[['Pipa PVC 2″ · 12 batang',540000],['Sambungan & lem',210000],['Upah tukang · 2 orang',500000]]},
  {id:2,t:'Penggantian meteran · 6 unit',by:'BUMDes Tirta Kalisari',amt:1680000,st:'wait',rab:[['Meteran air ½″ · 6 × 280.000',1680000]]},
];
const PAT0=[{id:'p3',when:'22 Nov',km:2.4,cps:6,dur:'01:12:40'},{id:'p2',when:'20 Nov',km:2.1,cps:6,dur:'01:05:12'},{id:'p1',when:'18 Nov',km:1.8,cps:5,dur:'00:58:03'}];
const PLT0=[{id:'l3',when:'18 Nov',sp:'Beringin',n:20,note:'Monitoring ke-2'},{id:'l2',when:'11 Nov',sp:'Aren',n:30,note:'Penanaman'},{id:'l1',when:'04 Nov',sp:'Beringin',n:25,note:'Penanaman'}];
const DON0=[{id:'BLK-SD-2610-0014',no:'BLK-SD-2610-0014',qty:4,sp:'Beringin',name:'Ratna Lestari',total:100000,date:'02 Okt 2026',seed:true}];
const RCPTS=[
  {id:'now',period:'Nov 2026',meter:'128 → 140',use:12,no:'TRX-261123-0087',date:'23 Nov 2026 09:41'},
  {id:'okt',period:'Okt 2026',meter:'117 → 128',use:11,method:'QRIS',no:'TRX-261021-0087',date:'21 Okt 2026 16:05'},
  {id:'sep',period:'Sep 2026',meter:'107 → 117',use:10,method:'Tunai',no:'TRX-260924-0087',date:'24 Sep 2026 10:12'},
  {id:'agu',period:'Agu 2026',meter:'96 → 107',use:11,method:'QRIS',no:'TRX-260822-0087',date:'22 Agu 2026 19:30'},
  {id:'jul',period:'Jul 2026',meter:'86 → 96',use:10,method:'QRIS',no:'TRX-260720-0087',date:'20 Jul 2026 08:44'},
];
const INIT={
  role:'warga',qty:4,species:'Beringin',cust:'siti',paid:{},belik:'gunung',rcpt:'now',notifRead:false,
  reports:LAP0,incidents:INS0,cair:CAIR0,patrols:PAT0,plant:{total:214,logs:PLT0},donations:[],
  meters:{},seq:{lap:15,ins:5,don:31},
};

/* ============================================================
   SHEET YANG DIPAKAI ULANG
   ============================================================ */
function ShareSheet({open,onClose,title='Bagikan',text}){
  const {toast}=useP();
  const copy=()=>{try{const p=navigator.clipboard.writeText(text);if(p&&p.catch)p.catch(()=>{});}catch(e){}toast('Teks disalin');onClose();};
  return html`<${Sheet} open=${open} onClose=${onClose} title=${title}>
    <div className="rs" style=${{marginBottom:12,lineHeight:1.45,fontSize:13.5}}>${text}</div>
    <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
      <${Row} icon="chat" bg="#124734" title="WhatsApp" sub="Kirim ke kontak atau grup" chev onClick=${()=>{toast('Dibuka di WhatsApp (simulasi)');onClose();}}/>
      <${Row} icon="share" bg="#475569" title="Salin teks" sub="Tempel di aplikasi lain" chev onClick=${copy}/>
      <${Row} icon="camera" bg="#D97706" title="Simpan sebagai gambar" sub="Ke galeri perangkat" chev onClick=${()=>{toast('Tersimpan ke galeri (simulasi)');onClose();}}/>
    </div>
  <//>`;
}

function PrintSheet({open,onClose,no}){
  const [st,setSt]=useState('search');
  useEffect(()=>{if(!open)return;setSt('search');const t=setTimeout(()=>setSt('found'),1300);return()=>clearTimeout(t);},[open]);
  useEffect(()=>{if(st!=='print')return;const t=setTimeout(()=>setSt('done'),2300);return()=>clearTimeout(t);},[st]);
  return html`<${Sheet} open=${open} onClose=${onClose} title="Cetak struk">
    ${st==='search'&&html`<div style=${{display:'flex',alignItems:'center',gap:12,padding:'14px 2px 18px'}}><span className="spin"></span><span><div style=${{fontWeight:600}}>Mencari printer Bluetooth</div><div className="rs">Nyalakan printer termal di dekat HP</div></span></div>`}
    ${st==='found'&&html`<${F}><div className="gh" style=${{padding:'4px 4px 6px'}}><span>Printer ditemukan</span></div><div className="g" style=${{margin:0,background:'var(--canvas)'}}><${Row} icon="printer" bg="#475569" title="RPP02N" sub="Kertas 58 mm · sinyal kuat" chev onClick=${()=>setSt('print')}/></div><div className="gf" style=${{padding:'8px 4px 0'}}>Tidak ada printer? Tutup lalu kirim struk lewat WhatsApp.</div><//>`}
    ${st==='print'&&html`<div style=${{padding:'10px 2px 18px'}}><div style=${{display:'flex',alignItems:'center',gap:12}}><span className="spin"></span><span><div style=${{fontWeight:600}}>Mencetak ${no||'struk'}</div><div className="rs">Jangan jauhkan HP dari printer</div></span></div><div className="track mt12"><div className="fill" style=${{animationDuration:'2.2s'}}></div></div></div>`}
    ${st==='done'&&html`<div style=${{textAlign:'center',padding:'6px 0 4px'}}><div style=${{width:54,height:54,borderRadius:27,background:'var(--forest)',display:'inline-grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${30} c="#fff" w=${3}/></div><div style=${{fontWeight:600,fontSize:17,margin:'8px 0 12px'}}>Struk tercetak</div><button className="btn btn-p" onClick=${onClose}>Selesai</button></div>`}
  <//>`;
}

function CustomerSheet({open,onClose}){
  const {shared,patch}=useP();
  const [q,setQ]=useState('');
  const list=CUSTOMERS.filter(c=>(c.n+' '+c.no+' '+c.rt).toLowerCase().includes(q.toLowerCase()));
  return html`<${Sheet} open=${open} onClose=${onClose} title="Pilih pelanggan">
    <div className="g" style=${{margin:'0 0 10px',background:'var(--canvas)'}}><div className="r"><${Icon} n="search" s=${18} c="rgba(15,23,42,.45)"/><input className="in" placeholder="Cari nama, nomor, atau RT" value=${q} onChange=${e=>setQ(e.target.value)} aria-label="Cari pelanggan"/></div></div>
    <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
      ${list.map(c=>{const pm=payOf(c,shared);return html`<button key=${c.id} className="r" onClick=${()=>{patch({cust:c.id});setQ('');onClose();}} style=${{padding:'9px 14px'}}><span className="av-s">${initials(c.n)}</span><span className="col"><span className="rt" style=${{fontSize:15.5}}>${c.n}</span><span className="rs">${c.no} · ${c.rt}</span></span><span className="rv">${pm?html`<${Pill}>Lunas<//>`:html`<${Pill} kind="warn">Belum<//>`}${shared.cust===c.id&&html`<${Icon} n="check" s=${18} c="#124734" w=${2.6}/>`}</span></button>`;})}
      ${list.length===0&&html`<div className="r rs">Tidak ada pelanggan yang cocok.</div>`}
    </div>
  <//>`;
}

function PinSheet({open,onClose}){
  const {toast}=useP();
  const [step,setStep]=useState('new');
  const [a,setA]=useState('');const [b,setB]=useState('');const [err,setErr]=useState('');
  useEffect(()=>{if(open){setStep('new');setA('');setB('');setErr('');}},[open]);
  const cur=step==='new'?a:b;
  const press=k=>{setErr('');(step==='new'?setA:setB)(c=>k==='del'?c.slice(0,-1):(c+k).slice(0,6));};
  useEffect(()=>{
    if(step==='new'&&a.length===6){const t=setTimeout(()=>setStep('confirm'),250);return()=>clearTimeout(t);}
    if(step==='confirm'&&b.length===6){
      if(a===b){toast('PIN berhasil diganti');onClose();}
      else{setErr('PIN tidak sama. Ulangi dari awal.');setStep('new');setA('');setB('');}
    }
  },[a,b,step]);
  return html`<${Sheet} open=${open} onClose=${onClose} title="Ganti PIN">
    <div className="rs" style=${{textAlign:'center',marginBottom:12}}>${step==='new'?'Masukkan PIN baru 6 digit':'Ulangi PIN baru untuk konfirmasi'}</div>
    <div style=${{display:'flex',gap:16,justifyContent:'center',margin:'0 0 8px'}}>${Array.from({length:6},(_,i)=>html`<span key=${i} className=${'pdot'+(i<cur.length?' on':'')}></span>`)}</div>
    <div style=${{minHeight:20,textAlign:'center',color:'var(--red)',fontSize:13,fontWeight:600,marginBottom:6}}>${err}</div>
    <${Keypad} onKey=${press}/>
  <//>`;
}

const FAQ={
  warga:[['Bagaimana cara membayar iuran?','Buka Bayar, pilih QRIS atau kode bayar untuk kasir BUMDes. Struk muncul otomatis setelah lunas.'],['Ke mana uang iuran saya pergi?','70% untuk operasional BUMDes dan 30% untuk Kas Konservasi Belik yang menjaga sumber Tuk Bismo.'],['Pipa di depan rumah bocor, apa yang harus dilakukan?','Buka Lapor, ambil foto, lalu kirim. Lokasi terisi otomatis dan Anda bisa memantau status tiketnya.']],
  bumdes:[['Meteran warga tidak terbaca, bagaimana?','Foto ulang angka meteran dari jarak dekat. Jika tetap gagal, laporkan sebagai meteran rusak lewat admin PDAM.'],['Warga bayar tunai tapi tidak punya WhatsApp?','Cetak struk lewat printer termal, lalu serahkan langsung.'],['Kapan kas tunai disetor?','Setor ke bendahara BUMDes sesuai jadwal desa. Dasbor menampilkan total tunai yang masih Anda pegang.']],
  relawan:[['Tombol Mulai Patroli tidak aktif.','Anda berada di luar zona geofence. Masuk ke area Hutan Lindung Bismo lalu coba lagi.'],['Apa bedanya laporan insiden dan log reboisasi?','Insiden untuk gangguan seperti longsor atau sampah. Log reboisasi untuk mencatat bibit yang ditanam dan monitoring berkalanya.'],['Foto tidak terunggah.','Foto disimpan di HP dan terkirim otomatis saat sinyal kembali.']],
  donatur:[['Berapa nilai satu bibit?','Rp 25.000 untuk satu bibit Beringin atau Aren, sudah termasuk penanaman dan monitoring berkala.'],['Kapan sertifikat terbit?','Langsung setelah pembayaran QRIS diterima. Sertifikat bisa dibagikan dari halaman checkout.'],['Bagaimana saya tahu bibit saya tumbuh?','Buka Dampak untuk melihat foto relawan dan citra satelit pada setiap pemantauan.']],
  pdam:[['Kapan sebuah belik berstatus anomali?','Kekeruhan di atas 5 NTU atau debit turun lebih dari 30% dibanding rata-rata 24 jam.'],['Apa yang terjadi setelah laporan divalidasi?','Teknisi ditugaskan dan warga melihat tiketnya berubah di aplikasi.'],['Siapa yang bisa menyetujui pencairan dana?','Admin PDAM dengan verifikasi 2 langkah aktif.']],
};
function HelpSheet({open,onClose,role}){
  const [o,setO]=useState(0);
  return html`<${Sheet} open=${open} onClose=${onClose} title="Pusat bantuan">
    <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
      ${FAQ[role].map((q,i)=>html`<${F} key=${i}><button className="r" onClick=${()=>setO(o===i?-1:i)} aria-expanded=${o===i} style=${{padding:'12px 14px'}}><span className="rt" style=${{fontSize:15,flex:1}}>${q[0]}</span><${Icon} n=${o===i?'up':'down'} s=${18} c="rgba(15,23,42,.4)"/></button>${o===i&&html`<div className="r rs" style=${{display:'block',padding:'0 14px 13px',fontSize:14,lineHeight:1.45,color:'var(--slate)'}}>${q[1]}</div>`}<//>`)}
    </div>
  <//>`;
}
function ForgotSheet({open,onClose}){
  const [sent,setSent]=useState(false);
  useEffect(()=>{if(open)setSent(false);},[open]);
  return html`<${Sheet} open=${open} onClose=${onClose} title="Lupa PIN">
    ${!sent?html`<${F}>
      <div className="rs" style=${{fontSize:14.5,lineHeight:1.45,marginBottom:12}}>PIN petugas hanya bisa diatur ulang oleh bendahara BUMDes. Kami kirim permintaan berisi nama dan perangkat Anda.</div>
      <div className="g" style=${{margin:0,background:'var(--canvas)'}}>
        <${Row} icon="user" bg="#124734" title="Bu Wulan · Bendahara" sub="BUMDes Tirta Bismo"/>
        <${Row} icon="phone" bg="#D97706" title="WhatsApp" right="+62 811-2900-4417"/>
      </div>
      <button className="btn btn-p mt12" onClick=${()=>setSent(true)}><${Icon} n="chat" s=${20}/>Kirim Permintaan via WhatsApp</button>
    <//>`:html`<div style=${{textAlign:'center',padding:'6px 0 2px'}}>
      <div style=${{width:54,height:54,borderRadius:27,background:'var(--forest)',display:'inline-grid',placeItems:'center',animation:'pop .5s both'}}><${Icon} n="check" s=${30} c="#fff" w=${3}/></div>
      <div style=${{fontWeight:600,fontSize:17,margin:'8px 0 4px'}}>Permintaan terkirim</div>
      <div className="rs" style=${{fontSize:14,lineHeight:1.45,margin:'0 8px 14px'}}>Bendahara akan mengirim PIN sementara. Masuk dengan PIN itu, lalu ganti PIN dari menu Profil.</div>
      <button className="btn btn-p" onClick=${onClose}>Selesai</button>
    </div>`}
  <//>`;
}
function ConfirmSheet({open,onClose,onYes}){
  return html`<${Sheet} open=${open} onClose=${onClose} title="Keluar dari BelikHub?">
    <div className="rs" style=${{fontSize:14.5,lineHeight:1.45,marginBottom:14}}>Anda perlu masuk lagi untuk membuka data iuran, laporan, dan notifikasi.</div>
    <button className="btn btn-d" onClick=${onYes}>Keluar</button>
    <button className="btn btn-s mt8" onClick=${onClose}>Batal</button>
  <//>`;
}

/* ============================================================
   LAYAR PENDUKUNG
   ============================================================ */
function WNotif(){
  const {go,shared,patch}=useP();
  const paid=shared.paid.siti;
  const tk=shared.reports.find(r=>r.mine);
  const read=shared.notifRead;
  const tkText=!tk?'':tk.st==='ok'?'Teknisi ditugaskan ke lokasi Anda.':tk.st==='no'?'Laporan ditolak admin. Ajukan ulang dengan foto yang jelas.':'Menunggu validasi PDAM Batang.';
  const items=[
    paid?{ic:'check',bg:'#124734',t:'Pembayaran iuran diterima',s:'Iuran Nov 2026 lunas lewat '+paid+'. Struk sudah tersedia.',w:'Baru saja',to:'w-receipt',fresh:true}
        :{ic:'clock',bg:'#D97706',t:'Iuran November jatuh tempo 28 Nov',s:'Tagihan Rp 15.000 belum dibayar.',w:'Hari ini',to:'w-pay',fresh:true},
    tk?{ic:'alert',bg:tk.st==='no'?'#B42318':'#D97706',t:'Tiket '+tk.id+' · '+tk.t,s:tkText,w:tk.ago,to:'w-report',fresh:true}:null,
    {ic:'drop',bg:'#124734',t:'Tuk Bismo jernih dan normal',s:'Debit 4,8 L/dtk · kekeruhan 1,2 NTU',w:'09:40',to:'w-home'},
    {ic:'receipt',bg:'#475569',t:'Struk Oktober 2026 tersedia',s:'Iuran Rp 15.000 lunas lewat QRIS.',w:'21 Okt',to:'w-history'},
  ].filter(Boolean);
  return html`<${Shell}>
    <${NavBack} to="w-home" label="Beranda"/>
    <div style=${{display:'flex',alignItems:'flex-end',justifyContent:'space-between',paddingRight:20}}><h1 className="lt">Notifikasi</h1><button onClick=${()=>patch({notifRead:true})} disabled=${read} style=${{border:0,background:'none',color:read?'var(--mute)':'var(--forest)',fontWeight:600,fontSize:14,paddingBottom:6}}>${read?'Sudah dibaca':'Tandai dibaca'}</button></div>
    <p className="ls">Iuran, tiket laporan, dan kondisi sumber</p>
    <${Group} head="Terbaru">
      ${items.map((it,i)=>html`<button key=${i} className="r ic" style=${{padding:'11px 14px'}} onClick=${()=>{patch({notifRead:true,rcpt:'now'});go(it.to);}}><span className="ri" style=${{background:it.bg}}><${Icon} n=${it.ic} s=${18} w=${2}/></span><span className="col"><span className="rt" style=${{fontSize:15.5}}>${it.t}</span><span className="rs">${it.s}</span></span><span className="rv" style=${{flexDirection:'column',alignItems:'flex-end',gap:6}}><span style=${{fontSize:12}}>${it.w}</span>${it.fresh&&!read?html`<i className="unread"></i>`:html`<i style=${{width:9,height:9}}></i>`}</span></button>`)}
    <//>
  <//>`;
}

function WHistory(){
  const {go,interactive,shared,patch}=useP();
  const paidNow=shared.paid.siti;
  const rows=RCPTS.filter(r=>r.id!=='now');
  const n=rows.length+(paidNow?1:0);
  const cN=Math.round(useCountUp(n,interactive));
  const open=id=>{patch({rcpt:id});go('w-receipt');};
  return html`<${Shell}>
    <${NavBack} to="w-home" label="Beranda"/>
    <h1 className="lt">Riwayat Pembayaran</h1>
    <p className="ls">Iuran air · BLK 0412 0087</p>
    <div style=${{display:'flex',padding:'16px 20px 2px'}}>
      ${[[String(cN),'bulan lunas'],[rp(cN*15000),'total dibayar'],[rp(cN*4500),'untuk konservasi']].map((m,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep" style=${{margin:'0 14px'}}></span>`}<div><div className="num" style=${{fontSize:i?18:30,fontWeight:700,lineHeight:i?'30px':1.05}}>${m[0]}</div><div className="rs">${m[1]}</div></div><//>`)}
    </div>
    <${Group} head="Bulan ini">
      ${paidNow
        ?html`<${Row} icon="receipt" bg="#124734" title="November 2026" sub=${'12 m³ · '+paidNow} right=${rp(15000)} chev onClick=${()=>open('now')}/>`
        :html`<${Row} icon="clock" bg="#D97706" title="November 2026" sub="Jatuh tempo 28 Nov" right=${html`<${Pill} kind="warn">Belum lunas<//>`} chev onClick=${()=>go('w-pay')}/>`}
    <//>
    <${Group} head="Sebelumnya" foot="Ketuk bulan untuk membuka struk digitalnya.">
      ${rows.map(r=>html`<${Row} key=${r.id} icon="receipt" bg="#475569" title=${r.period} sub=${r.use+' m³ · '+r.method} right=${rp(15000)} chev onClick=${()=>open(r.id)}/>`)}
    <//>
  <//>`;
}

function BCustomers(){
  const {go,shared,patch}=useP();
  const [f,setF]=useState('belum');
  const [q,setQ]=useState('');
  const nb=CUSTOMERS.filter(c=>!payOf(c,shared)).length,nl=CUSTOMERS.length-nb;
  const list=CUSTOMERS.filter(c=>{const pm=payOf(c,shared);const m=f==='semua'||(f==='belum'?!pm:!!pm);return m&&(c.n+' '+c.no+' '+c.rt).toLowerCase().includes(q.toLowerCase());});
  const st=dashStats(shared);
  return html`<${Shell} tab="bumdes" active="b-customers">
    <h1 className="lt">Pelanggan</h1>
    <p className="ls num">${st.belum} dari 180 rumah belum lunas</p>
    <${Group} style=${{marginTop:12}}><div className="r"><${Icon} n="search" s=${18} c="rgba(15,23,42,.45)"/><input className="in" placeholder="Cari nama, nomor, atau RT" value=${q} onChange=${e=>setQ(e.target.value)} aria-label="Cari pelanggan"/></div><//>
    <div className="mt12"><${Seg} value=${f} onChange=${setF} items=${[{v:'belum',l:'Belum ('+nb+')'},{v:'lunas',l:'Lunas ('+nl+')'},{v:'semua',l:'Semua'}]}/></div>
    <${Group} foot=${'Contoh '+CUSTOMERS.length+' pelanggan. Daftar lengkap 180 sambungan dimuat dari server.'} style=${{marginTop:12}}>
      ${list.map(c=>{const pm=payOf(c,shared);return html`<button key=${c.id} className="r" style=${{padding:'9px 14px'}} onClick=${()=>{patch({cust:c.id});go('b-cash');}}><span className="av-s">${initials(c.n)}</span><span className="col"><span className="rt" style=${{fontSize:15.5}}>${c.n}</span><span className="rs">${c.no} · ${c.rt}</span></span><span className="rv">${pm?html`<${Pill} icon="check">${pm}<//>`:html`<span className="num strong" style=${{color:'var(--slate)',fontWeight:600}}>Rp 15.000</span>`}<${Icon} n="chr" s=${16} c="rgba(15,23,42,.3)" w=${2.4}/></span></button>`;})}
      ${list.length===0&&html`<div className="r rs">Tidak ada pelanggan di daftar ini.</div>`}
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function RHistory(){
  const {interactive,shared}=useP();
  const [tab,setTab]=useState('patroli');
  const kmTot=32.4+shared.patrols.reduce((a,p)=>a+p.km,0);
  const cP=useCountUp(15+shared.patrols.length,interactive),cK=useCountUp(kmTot,interactive),cB=useCountUp(shared.plant.total,interactive);
  const stp=s=>s==='wait'?html`<${Pill} kind="warn">Menunggu<//>`:s==='ok'?html`<${Pill} icon="check">Ditugaskan<//>`:html`<${Pill} kind="bad">Ditolak<//>`;
  const inc=shared.incidents.filter(x=>x.mine);
  const IC2={'Degradasi hutan':['leaf','#2F8F5B'],'Tumpukan sampah':['trash','#475569'],'Longsor lereng':['mountain','#D97706']};
  return html`<${Shell} tab="relawan" active="r-history">
    <h1 className="lt">Riwayat</h1>
    <p className="ls">Kegiatan Anda di Hutan Lindung Bismo</p>
    <div style=${{display:'flex',padding:'14px 20px 12px'}}>
      ${[[String(Math.round(cP)),'patroli'],[dec(cK,1),'km ditempuh'],[String(Math.round(cB)),'bibit ditanam']].map((m,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep" style=${{margin:'0 16px'}}></span>`}<div><div className="num serif" style=${{fontSize:30,fontWeight:500,lineHeight:1}}>${m[0]}</div><div className="rs">${m[1]}</div></div><//>`)}
    </div>
    <${Seg} value=${tab} onChange=${setTab} items=${[{v:'patroli',l:'Patroli'},{v:'insiden',l:'Insiden ('+inc.length+')'},{v:'reboisasi',l:'Reboisasi'}]}/>
    <${Group} style=${{marginTop:14}}>
      ${tab==='patroli'&&shared.patrols.map(p=>html`<${Row} key=${p.id} icon="route" bg="#124734" title=${p.when+' · '+dec(p.km,2)+' km'} sub=${p.cps+'/6 titik · '+p.dur} right=${p.cps>=6?html`<${Pill} icon="check">Tuntas<//>`:html`<${Pill} kind="warn">Sebagian<//>`}/>`)}
      ${tab==='insiden'&&(inc.length?inc.map(x=>{const m=IC2[x.t]||['alert','#D97706'];return html`<${Row} key=${x.id} icon=${m[0]} bg=${m[1]} title=${x.t+' · '+x.sev} sub=${x.id+' · '+x.ago} right=${stp(x.st)}/>`;}):html`<div className="r rs">Belum ada laporan insiden.</div>`)}
      ${tab==='reboisasi'&&shared.plant.logs.map(l=>html`<${Row} key=${l.id} icon="sprout" bg="#2F8F5B" title=${l.n+' bibit '+l.sp} sub=${l.when+' · '+l.note} right=${html`<${Pill} icon="check">Tercatat<//>`}/>`)}
    <//>
    <div style=${{height:12}}></div>
  <//>`;
}

function PMap(){
  const {go,patch,shared}=useP();
  const [mode,setMode]=useState('status');
  const b=BELIK.find(x=>x.id===shared.belik)||BELIK[3];
  const pos={bismo:[150,262],kalisari:[258,214],pandan:[205,352],gunung:[292,408],wonokerto:[104,372]};
  const near=belikReports(shared,b).length;
  const rings=Array.from({length:8},(_,i)=>html`<path key=${i} d=${contourPath(270,430,30+i*34,i+1)} fill="none" stroke="#124734" strokeOpacity=".13"/>`);
  return html`<${Shell} tab="pdam" active="p-map" under>
    <div style=${{position:'relative',height:'100%',background:'#E4ECE6'}}>
      <svg width="390" height="761" viewBox="0 0 390 761" style=${{position:'absolute',inset:0}} role="img" aria-label="Peta sebaran lima belik utama">
        <rect width="390" height="761" fill="#E4ECE6"/>
        <path d="M0 0H390V150C340 168 300 140 250 156C190 176 140 150 90 166C50 178 20 160 0 170Z" fill="#CFE3EC"/>
        <text x="30" y="96" fontSize="13" fontStyle="italic" fill="#5C8EA3" style=${{fontFamily:'var(--fd)'}}>Laut Jawa</text>
        ${rings}
        <path d="M30 190C80 178 160 185 230 181C300 177 350 196 360 236C370 289 350 348 330 408C300 461 200 488 120 475C50 461 20 415 25 345C28 292 20 216 30 190Z" fill="rgba(18,71,52,.06)" stroke="#124734" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="6 5"/>
        <g stroke="#9CC5DA" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M296 440C290 400 272 340 252 290C240 250 232 220 236 186"/><path d="M104 400C124 350 140 300 150 256C156 226 150 200 156 172"/></g>
        ${BELIK.map(x=>{const p=pos[x.id];const c=ST[x.st].c;const on=x.id===b.id;const lab=mode==='status'?null:mode==='q'?dec(x.q,1):dec(x.ntu,1);return html`<g key=${x.id} onClick=${()=>patch({belik:x.id})} style=${{cursor:'pointer'}} role="button" aria-label=${x.n+' · '+ST[x.st].l}>
          ${x.st==='bad'&&html`<circle cx=${p[0]} cy=${p[1]} r="16" fill=${c} opacity=".25"><animate attributeName="r" values="16;34" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0" dur="1.8s" repeatCount="indefinite"/></circle>`}
          <circle cx=${p[0]} cy=${p[1]} r=${on?20:16} fill=${c} stroke="#fff" strokeWidth=${on?4:3}/>
          ${lab?html`<text x=${p[0]} y=${p[1]+4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">${lab}</text>`:html`<path d=${x.st==='ok'?'M'+(p[0]-5)+' '+p[1]+'l3.6 3.8 6.6-7.4':'M'+p[0]+' '+(p[1]-5)+'v6M'+p[0]+' '+(p[1]+5)+'h.01'} stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>`}
          <g><rect x=${p[0]-40} y=${p[1]+(on?24:20)} width="80" height="20" rx="10" fill="#fff" opacity=".95"/><text x=${p[0]} y=${p[1]+(on?38:34)} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0F172A">${x.n.replace('Tuk ','')}</text></g>
        </g>`;})}
      </svg>
      <div style=${{position:'absolute',top:60,left:14,right:14,background:'rgba(255,255,255,.94)',backdropFilter:'blur(10px)',borderRadius:14,padding:5,boxShadow:'0 6px 18px -8px rgba(15,23,42,.35)'}}><${Seg} value=${mode} onChange=${setMode} style=${{margin:0}} items=${[{v:'status',l:'Status'},{v:'q',l:'Debit'},{v:'n',l:'Kekeruhan'}]}/></div>
      <div className="sheet">
        <div className="grab"></div>
        <div style=${{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span className="serif" style=${{fontSize:25,fontWeight:500}}>${b.n}</span><${Pill} kind=${ST[b.st].k} icon=${b.st==='bad'?'alert':null}>${ST[b.st].l}<//></div>
        <div className="rs">${b.d} · Kabupaten Batang</div>
        <div style=${{display:'flex',margin:'12px 0',padding:'10px 0',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
          ${[['Debit',dec(b.q,1),'L/dtk'],['Kekeruhan',dec(b.ntu,1),'NTU'],['Laporan warga',String(near),'menunggu']].map((s,i)=>html`<${F} key=${i}>${i>0&&html`<span className="sep"></span>`}<div style=${{flex:1,textAlign:'center'}}><div className="rs">${s[0]}</div><div className="num" style=${{fontSize:23,fontWeight:700}}>${s[1]} <span style=${{fontSize:11.5,color:'var(--mute)',fontWeight:500}}>${s[2]}</span></div></div><//>`)}
        </div>
        <button className="btn btn-p" onClick=${()=>go('p-agg')}><${Icon} n="chart" s=${19}/>Lihat grafik 24 jam</button>
      </div>
    </div><//>`;
}

/* ---------- Profil per peran ---------- */
function profileData(role,s){
  const dn=s.donations.concat(DON0);
  const nBibit=dn.reduce((a,d)=>a+d.qty,0),tot=dn.reduce((a,d)=>a+d.total,0);
  return {
    warga:{id:'w-profile',name:'Siti Aminah',sub:'Pelanggan Belik · RT 03 / RW 02 Desa Bismo',acct:[['home','#124734','No. pelanggan','BLK 0412 0087'],['phone','#D97706','WhatsApp','+62 812-3456-7890'],['pin','#2F8F5B','Alamat','Desa Bismo']],links:[['Kartu pelanggan digital','qr','w-home'],['Riwayat pembayaran','receipt','w-history'],['Notifikasi','bell','w-notif']]},
    bumdes:{id:'b-profile',name:'Pak Darto',sub:'Petugas lapangan · BUMDes Tirta Bismo',acct:[['users','#124734','Wilayah tugas','RT 01–04'],['phone','#D97706','Perangkat terdaftar','1 dari 2'],['printer','#475569','Printer struk','RPP02N · Bluetooth']],links:[['Daftar pelanggan','users','b-customers'],['Catat meteran','gauge','b-meter']]},
    relawan:{id:'r-profile',name:'Pak Slamet',sub:'Relawan · Regu 2 Hutan Lindung Bismo',acct:[['route','#124734','Patroli selesai',String(15+s.patrols.length)],['sprout','#2F8F5B','Bibit ditanam',String(s.plant.total)],['award','#D97706','Lencana','Penjaga Sumber · Level 2']],links:[['Riwayat kegiatan','clock','r-history'],['Peta patroli','route','r-map']]},
    donatur:{id:'d-profile',name:'Ratna Lestari',sub:'Donatur Hijau · ratna@hijaulestari.id',acct:[['heart','#124734','Total donasi',rp(tot)],['sprout','#2F8F5B','Bibit didanai',String(nBibit)],['mail','#475569','Surel','ratna@hijaulestari.id']],links:[['Jejak dampak','chart','d-impact'],['Program Sabuk Hijau','leaf','d-explore']]},
    pdam:{id:'p-profile',name:'Admin PDAM Batang',sub:'Validator belik · NIP 1984••••••••••1005',acct:[['shield','#124734','Verifikasi 2 langkah','Aktif'],['gauge','#D97706','Ambang waspada','> 3 NTU'],['alert','#B42318','Ambang anomali','> 5 NTU']],links:[['Antrean validasi','clip','p-queue'],['Peta belik','pin','p-map']]},
  }[role];
}
function Profile({role}){
  const {go,shared}=useP();
  const [push,setPush]=useState(true);const [saver,setSaver]=useState(false);
  const [help,setHelp]=useState(false);const [out,setOut]=useState(false);const [pin,setPin]=useState(false);
  const [oc,setOc]=useState(null);
  const P=profileData(role,shared);
  const certs=shared.donations.concat(DON0);
  const overlay=html`<${F}><${HelpSheet} open=${help} onClose=${()=>setHelp(false)} role=${role}/><${ConfirmSheet} open=${out} onClose=${()=>setOut(false)} onYes=${()=>{setOut(false);go('splash');}}/>${role==='bumdes'&&html`<${PinSheet} open=${pin} onClose=${()=>setPin(false)}/>`}<//>`;
  return html`<${Shell} tab=${role} active=${P.id} overlay=${overlay}>
    <div style=${{display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 20px 4px',textAlign:'center'}}>
      <div className="avatar">${initials(P.name)}</div>
      <div className="serif" style=${{fontSize:28,fontWeight:500,marginTop:8,lineHeight:1.1}}>${P.name}</div>
      <div className="rs" style=${{marginTop:2}}>${P.sub}</div>
    </div>
    <${Group} head="Akun">${P.acct.map((a,i)=>html`<${Row} key=${i} icon=${a[0]} bg=${a[1]} title=${a[2]} right=${a[3]} strong/>`)}<//>
    <${Group} head="Pintasan">${P.links.map((l,i)=>html`<${Row} key=${i} icon=${l[1]} bg="#124734" title=${l[0]} chev onClick=${()=>go(l[2])}/>`)}${role==='bumdes'&&html`<${Row} icon="lock" bg="#0F172A" title="Ganti PIN" chev onClick=${()=>setPin(true)}/>`}<//>
    ${role==='donatur'&&html`<${Group} head="Sertifikat saya">${certs.map(c=>html`<${F} key=${c.id}><${Row} icon="award" bg="#D97706" title=${c.qty+' bibit '+c.sp} sub=${c.date} right=${html`<${Icon} n=${oc===c.id?'up':'down'} s=${18} c="rgba(15,23,42,.4)"/>`} onClick=${()=>setOc(oc===c.id?null:c.id)}/>${oc===c.id&&html`<div className="r" style=${{display:'block',padding:'4px 12px 14px'}}><${Cert} name=${c.name} qty=${c.qty} sp=${c.sp} no=${c.no} date=${c.date} paid=${true}/></div>`}<//>`)}<//>`}
    <${Group} head="Pengaturan">
      <div className="r"><span className="rt">Notifikasi push</span><span className="rv"><${Toggle} on=${push} onChange=${setPush} label="Notifikasi push"/></span></div>
      <div className="r"><span className="rt">Mode hemat data</span><span className="rv"><${Toggle} on=${saver} onChange=${setSaver} label="Mode hemat data"/></span></div>
      <${Row} icon="info" bg="#475569" title="Pusat bantuan" chev onClick=${()=>setHelp(true)}/>
    <//>
    <div className="pad mt16"><button className="btn btn-d" onClick=${()=>setOut(true)}>Keluar</button></div>
    <div style=${{textAlign:'center',fontSize:12,color:'var(--mute)',padding:'12px 0 16px'}}>BelikHub 1.0 · bersama PDAM Batang</div>
  <//>`;
}
const ProfW=()=>html`<${Profile} role="warga"/>`;
const ProfB=()=>html`<${Profile} role="bumdes"/>`;
const ProfR=()=>html`<${Profile} role="relawan"/>`;
const ProfD=()=>html`<${Profile} role="donatur"/>`;
const ProfP=()=>html`<${Profile} role="pdam"/>`;

/* ============================================================
   REGISTRI LAYAR (18 layar utama + 10 layar pendukung · 6 alur)
   ============================================================ */
const FLOWS=[
  {id:'auth',n:1,title:'Onboarding & Auth',actor:'Semua peran',desc:'Splash, pilih peran, lalu masuk dengan metode yang sesuai: OTP WhatsApp, PIN petugas, magic link, atau NIP + 2FA.',screens:[
    {id:'splash',code:'1.1',title:'Splash & Pilih Peran',C:Splash,hint:'Pilih satu peran lalu tekan Lanjutkan. Warga, BUMDes dan Relawan menuju login. Donatur dan Admin PDAM menuju pintu masuk khusus.'},
    {id:'login',code:'1.2',title:'Login WhatsApp OTP / PIN Petugas',C:Login,hint:'Kirim kode, ketik 6 digit di keypad, lalu Verifikasi. Tab PIN Petugas BUMDes masuk otomatis setelah 6 digit. Lupa PIN membuka panduan reset ke bendahara.'},
    {id:'portal',code:'1.3',title:'Pintu Masuk Donatur & Admin PDAM',C:Portal,hint:'Donatur: kirim magic link lalu buka tautannya. Admin PDAM: NIP sudah terisi, ketik 6 digit 2FA lalu masuk.'},
  ]},
  {id:'warga',n:2,title:'Warga Batang',actor:'Pelanggan Belik · Desa Bismo',desc:'Kartu pelanggan, telemetri Tuk Bismo, iuran Rp 15.000, struk dengan alokasi dana, dan laporan kerusakan.',screens:[
    {id:'w-home',code:'2.1',title:'Beranda Warga',C:WHome,hint:'Lonceng membuka Notifikasi. Setelah iuran dibayar, tagihan berubah menjadi Lunas dan tombol berganti ke Lihat Struk.'},
    {id:'w-pay',code:'2.2',title:'Pembayaran Iuran',C:WPay,hint:'Countdown QRIS 15 menit berjalan. Saya sudah membayar memeriksa pembayaran lalu membuka struk. Beranda, notifikasi, riwayat, dan dasbor BUMDes ikut berubah.'},
    {id:'w-receipt',code:'2.3',title:'Struk Digital',C:WReceipt,hint:'Struk tercetak dengan animasi. Bagikan membuka lembar WhatsApp, salin, atau simpan gambar. Struk bulan lain dibuka dari Riwayat Pembayaran.'},
    {id:'w-notif',code:'2.5',title:'Notifikasi',C:WNotif,extra:true,hint:'Daftar disusun dari data nyata: status iuran dan tiket laporan. Ketuk satu notifikasi untuk membuka layar terkait.'},
    {id:'w-history',code:'2.6',title:'Riwayat Pembayaran',C:WHistory,extra:true,hint:'Ringkasan bulan lunas, total, dan porsi konservasi. Ketuk bulan untuk membuka struk digitalnya.'},
    {id:'w-profile',code:'2.7',title:'Profil Warga',C:ProfW,extra:true,hint:'Atur notifikasi, buka Pusat bantuan, atau Keluar untuk kembali ke Splash.'},
    {id:'w-report',code:'2.4',title:'Form Lapor Kerusakan',C:WReport,hint:'Ganti foto, pilih jenis, lalu kirim. Tiket masuk ke antrean Admin PDAM, dan statusnya berubah di sini setelah divalidasi atau ditolak.'},
  ]},
  {id:'bumdes',n:3,title:'Pengelola BUMDes',actor:'Petugas lapangan · BUMDes Tirta Bismo',desc:'Pantau penagihan per RT, catat meteran dengan verifikasi foto, dan terima bayar tunai dengan struk WhatsApp.',screens:[
    {id:'b-dash',code:'3.1',title:'Dashboard Lapangan',C:BDash,hint:'Cincin, kas tunai, dan progres per RT naik setiap ada pembayaran, baik tunai di kas maupun QRIS dari warga.'},
    {id:'b-meter',code:'3.2',title:'Form Catat Meteran Mandiri',C:BMeter,hint:'Ketuk baris pelanggan untuk memilih rumah lain. Angka di bawah meteran bulan lalu ditolak. Foto ulang memicu pembacaan OCR simulasi.'},
    {id:'b-customers',code:'3.4',title:'Daftar Pelanggan',C:BCustomers,extra:true,hint:'Cari nama, nomor, atau RT. Filter Belum, Lunas, atau Semua. Ketuk pelanggan untuk menagih tunai.'},
    {id:'b-profile',code:'3.5',title:'Profil Petugas',C:ProfB,extra:true,hint:'Ganti PIN dengan dua langkah konfirmasi 6 digit. Pusat bantuan dan Keluar juga berfungsi.'},
    {id:'b-cash',code:'3.3',title:'Catat Bayar Tunai',C:BCash,hint:'Pilih pelanggan dan uang diterima, tekan Terima Tunai, lalu kirim struk lewat WhatsApp atau cetak ke printer Bluetooth (simulasi).'},
  ]},
  {id:'relawan',n:4,title:'Relawan Konservasi',actor:'Patroli Hutan Lindung Bismo',desc:'Patroli dengan geofence sumber Tuk Bismo, laporan insiden bergeotag, dan log reboisasi dengan monitoring berkala.',screens:[
    {id:'r-map',code:'4.1',title:'Peta Patroli Hutan Lindung',C:RMap,hint:'Mulai Patroli menjalankan timer dan titik cek. Akhiri Patroli menyimpan ke Riwayat. Tombol lapisan dan lokasi berfungsi.'},
    {id:'r-incident',code:'4.2',title:'Form Insiden Belik',C:RIncident,hint:'Pilih jenis dan tingkat keparahan, tambah atau hapus foto, lalu kirim. Insiden muncul di Riwayat Anda dan di antrean Admin PDAM.'},
    {id:'r-history',code:'4.4',title:'Riwayat Relawan',C:RHistory,extra:true,hint:'Tiga tab: patroli, insiden, dan reboisasi. Statusnya mengikuti keputusan Admin PDAM.'},
    {id:'r-profile',code:'4.5',title:'Profil Relawan',C:ProfR,extra:true,hint:'Angka patroli dan bibit berasal dari riwayat Anda. Pusat bantuan dan Keluar berfungsi.'},
    {id:'r-plant',code:'4.3',title:'Log Reboisasi',C:RPlant,hint:'Atur jumlah bibit, centang monitoring, lalu simpan. Progres naik dan log tercatat di Riwayat.'},
  ]},
  {id:'donatur',n:5,title:'Donatur Hijau',actor:'Individu & organisasi',desc:'Rp 25.000 menjadi satu bibit Beringin atau Aren. Bayar QRIS, terima sertifikat digital, lalu pantau dampaknya.',screens:[
    {id:'d-explore',code:'5.1',title:'Eksplorasi Program Sabuk Hijau',C:DExplore,hint:'Pilih bibit dan jumlah. Total berubah per Rp 25.000 dan terbawa ke checkout.'},
    {id:'d-checkout',code:'5.2',title:'Checkout QRIS + Sertifikat',C:DCheckout,hint:'Ubah nama sertifikat, pilih Pribadi atau Organisasi, lalu tekan Saya sudah membayar. Sertifikat tersimpan di Profil dan jejaknya muncul di Dampak.'},
    {id:'d-profile',code:'5.4',title:'Profil Donatur',C:ProfD,extra:true,hint:'Total donasi, bibit yang didanai, dan semua sertifikat. Ketuk sertifikat untuk membukanya.'},
    {id:'d-impact',code:'5.3',title:'Timeline Dampak',C:DImpact,hint:'Pilih donasi, lalu ganti antara foto relawan dan citra satelit. Donasi baru Anda muncul di sini dengan jadwal tanam.'},
  ]},
  {id:'pdam',n:6,title:'Admin PDAM Batang',actor:'Pemantauan & validasi',desc:'Agregat debit dan kekeruhan lima belik utama, antrean laporan warga, dan pencairan dana pemeliharaan.',screens:[
    {id:'p-agg',code:'6.1',title:'Agregat Debit & Kekeruhan',C:PAgg,hint:'Pilih belik untuk melihat grafik 24 jam. Tindak lanjut membuka antrean laporan terkait atau peta belik.'},
    {id:'p-map',code:'6.3',title:'Peta Sebaran Belik',C:PMap,extra:true,hint:'Ketuk titik belik untuk melihat ringkasannya. Ganti tampilan Status, Debit, atau Kekeruhan.'},
    {id:'p-profile',code:'6.4',title:'Profil Admin',C:ProfP,extra:true,hint:'Verifikasi 2 langkah dan ambang peringatan. Pusat bantuan dan Keluar berfungsi.'},
    {id:'p-queue',code:'6.2',title:'Antrean Validasi',C:PQueue,hint:'Validasi atau tolak laporan warga dan insiden relawan. Di tab Pencairan, tinjau RAB lalu setujui. Hasilnya langsung terlihat di sisi warga dan relawan.'},
  ]},
];
FLOWS.forEach(f=>f.screens.sort((a,b)=>(a.extra?1:0)-(b.extra?1:0)));
const ALL=FLOWS.flatMap(f=>f.screens.map(s=>Object.assign({},s,{flow:f})));
const byId=Object.fromEntries(ALL.map(s=>[s.id,s]));
const N_MAIN=ALL.filter(s=>!s.extra).length,N_EXTRA=ALL.length-N_MAIN;


/* ============================================================
   APP: satu telepon penuh, layar pertama = splash
   ============================================================ */
function MobileApp(){
  const [cur,setCur]=useState('splash');
  const [shared,setShared]=useState(INIT);
  const patch=useCallback(p=>setShared(s=>Object.assign({},s,typeof p==='function'?p(s):p)),[]);
  const curRef=useRef(cur);curRef.current=cur;
  const hist=useRef([]);
  const nav=useRef({to:null,dir:'fade'});
  const go=useCallback(id=>{
    if(!byId[id])return;
    const from=curRef.current;
    if(id===from)return;
    const kindOf=k=>Object.keys(TABS).find(kk=>TABS[kk].some(t=>t.to===k));
    const kA=kindOf(from),kB=kindOf(id);
    const hi=hist.current.lastIndexOf(id);
    let dir;
    if(kA&&kA===kB)dir='tab';
    else if(hi>=0){dir='back';hist.current=hist.current.slice(0,hi);}
    else{dir='fwd';hist.current.push(from);}
    nav.current={to:id,dir};
    setCur(id);
  },[]);
  const dir=nav.current.to===cur?nav.current.dir:'fade';
  const S=byId[cur]||byId.splash;
  const desk=useDesktop();
  const phone=html`<${Phone} interactive=${true} dir=${dir} go=${go} shared=${shared} patch=${patch} desk=${desk} cur=${cur}><${S.C} key=${S.id}/><//>`;
  if(desk&&AUTH_IDS.includes(cur))return html`<div className="app-root auth-desk">
    <section className="auth-brand">
      <${Logo} s=${64}/>
      <h1>BelikHub</h1>
      <p className="tag">Mata air terjaga, iuran transparan.</p>
      <ul>${ROLES.map(r=>html`<li key=${r.id}><b>${r.t}</b><span>${r.s}</span></li>`)}</ul>
      <p className="foot">Kabupaten Batang · bersama PDAM Batang</p>
    </section>
    <div className="auth-card">${phone}</div>
  </div>`;
  return html`<div className=${'app-root'+(desk?' desk':'')}>${phone}</div>`;
}
function useDesktop(){
  const q='(min-width: 900px)';
  const get=()=>{try{return window.matchMedia(q).matches;}catch(e){return false;}};
  const [d,setD]=useState(get);
  useEffect(()=>{let m;try{m=window.matchMedia(q);}catch(e){return;}const f=()=>setD(m.matches);m.addEventListener?m.addEventListener('change',f):m.addListener(f);return()=>{m.removeEventListener?m.removeEventListener('change',f):m.removeListener(f);};},[]);
  return d;
}

export default MobileApp;
