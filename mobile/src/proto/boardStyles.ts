// Generated from belikhub-design-board.html (<style>), plus app-mode overrides at the end.
export const BOARD_CSS = `
:root{
  /* Layout: sticky bar, token strip, six flow rows of 390x844 frames on a dotted canvas; device mode = screen rail + one live phone + notes */
  --canvas:#F8FAFC; --forest:#124734; --sage:#E2ECE9; --amber:#D97706; --slate:#0F172A;
  --board:#EDF1F0; --line:rgba(15,23,42,.10); --mute:rgba(15,23,42,.60); --red:#B42318; --blue:#0A84FF;
  --fd:'Newsreader',Georgia,'Times New Roman',serif;
  --fb:'Figtree',-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif;
  --fm:'DM Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--board);color:var(--slate);font-family:var(--fb);-webkit-font-smoothing:antialiased;color-scheme:light}
button{font-family:inherit;color:inherit;cursor:pointer}
button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
.num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1,"lnum" 1}
.serif{font-family:var(--fd)}
.mono{font-family:var(--fm)}
#root{min-height:100%}

/* ---------- board chrome ---------- */
.dots{background-image:radial-gradient(rgba(15,23,42,.13) 1px,transparent 1px);background-size:22px 22px}
.topbar{position:sticky;top:0;z-index:40;background:rgba(237,241,240,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.mseg{display:inline-flex;background:rgba(15,23,42,.08);border-radius:12px;padding:3px}
.mseg button{border:0;background:transparent;height:34px;padding:0 14px;border-radius:9px;font-weight:600;font-size:14px;color:var(--slate);white-space:nowrap}
.mseg button.on{background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.18)}
.mseg.sm button{height:28px;padding:0 10px;font-size:13px}
.fhead{display:flex;align-items:baseline;gap:10px;margin:0 0 4px}
.fnum{font-family:var(--fm);font-size:12px;color:var(--forest);background:var(--sage);border-radius:6px;padding:2px 7px}
.flowrule{height:1px;background:var(--line);margin:0 0 22px}
.pv{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:15px;border:1px solid rgba(18,71,52,.25);background:#fff;color:var(--forest);font-weight:600;font-size:13px}
.pv:hover{background:var(--sage)}
.swatch{width:36px;height:36px;border-radius:10px;border:1px solid var(--line)}

/* ---------- phone ---------- */
.phone{position:relative;width:390px;height:844px;border-radius:52px;background:var(--canvas);overflow:hidden;box-shadow:0 0 0 9px #0F172A,0 0 0 10.5px #475569,0 40px 70px -24px rgba(15,23,42,.45);font-size:15px;line-height:1.35;color:var(--slate)}
.phone.static{pointer-events:none}
.phone .island{position:absolute;top:11px;left:50%;width:122px;height:35px;margin-left:-61px;border-radius:20px;background:#000;z-index:30}
.shell{display:flex;flex-direction:column;height:100%;position:relative}
.sb{height:54px;flex:none;display:flex;align-items:flex-end;justify-content:space-between;padding:0 30px 9px 40px;font-weight:600;font-size:16px;position:relative;z-index:5}
.sb .sbr{display:flex;gap:6px;align-items:center}
.sb-abs{position:absolute;top:0;left:0;right:0;z-index:12}
.scroll{flex:1;min-height:0;position:relative;scrollbar-width:none;overflow-x:hidden}
.scroll::-webkit-scrollbar{display:none}
.live .scroll{overflow-y:auto}
.static .scroll{overflow:hidden}
.live button,.live input,.live textarea{pointer-events:auto}
.home{height:34px;flex:none;display:flex;justify-content:center;align-items:flex-end;padding-bottom:8px}
.home i,.hbar{display:block;width:134px;height:5px;border-radius:3px;background:var(--slate)}
.tabbar{flex:none;height:83px;position:relative;display:flex;padding:7px 4px 0;border-top:1px solid var(--line);background:rgba(248,250,252,.95);backdrop-filter:blur(14px)}
.tabbar .hbar{position:absolute;bottom:8px;left:50%;margin-left:-67px}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:transparent;font-size:10.5px;font-weight:600;color:rgba(15,23,42,.45);height:48px}
.tab.on{color:var(--forest)}
.toast{position:absolute;top:60px;left:16px;right:16px;z-index:40;background:rgba(15,23,42,.94);color:#fff;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:center;font-size:14px;font-weight:500;animation:drop .3s cubic-bezier(.2,.8,.2,1),toastout .3s 2.1s ease-in forwards}
@keyframes drop{from{transform:translateY(-16px);opacity:0}to{transform:none;opacity:1}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(18,71,52,.45)}100%{box-shadow:0 0 0 10px rgba(18,71,52,0)}}
@keyframes pulseb{0%{box-shadow:0 0 0 0 rgba(10,132,255,.5)}100%{box-shadow:0 0 0 16px rgba(10,132,255,0)}}
@keyframes rise{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes print{from{transform:translateY(-102%)}to{transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes draw{from{stroke-dashoffset:60}to{stroke-dashoffset:0}}
@keyframes bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.pulse-dot{width:10px;height:10px;border-radius:50%;background:#16A34A;animation:pulse 1.6s infinite;flex:none}

/* ---------- type & lists (iOS inset grouped) ---------- */
.lt{font-family:var(--fd);font-size:34px;font-weight:500;letter-spacing:-.012em;line-height:1.08;padding:6px 20px 2px;margin:0}
.ls{padding:0 20px;color:var(--mute);font-size:14px;margin:0}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.gh{font-size:12.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mute);padding:20px 20px 7px;display:flex;justify-content:space-between;align-items:baseline}
.g{margin:0 16px;background:#fff;border-radius:14px;overflow:hidden}
.gf{font-size:12.5px;color:var(--mute);padding:7px 20px 0;line-height:1.4}
.r{display:flex;align-items:center;gap:12px;padding:10px 14px;min-height:48px;position:relative;width:100%;text-align:left;border:0;background:transparent}
.r+.r::before{content:'';position:absolute;top:0;left:var(--inset,14px);right:0;height:1px;background:var(--line)}
.r.ic{--inset:56px}
.ri{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:#fff;flex:none}
.rt{font-weight:500;font-size:16px;line-height:1.25}
.rs{font-size:13px;color:var(--mute);line-height:1.3}
.rv{margin-left:auto;display:flex;align-items:center;gap:6px;color:var(--mute);font-size:15px;flex:none}
.rv.strong{color:var(--slate);font-weight:600}
.col{display:flex;flex-direction:column;min-width:0}
.back{display:flex;align-items:center;gap:2px;border:0;background:transparent;color:var(--forest);font-size:16px;font-weight:500;padding:4px 12px 2px 10px;height:36px}
.in{border:0;outline:0;background:transparent;font:500 16px var(--fb);width:100%;color:var(--slate);min-width:0}
.in::placeholder{color:rgba(15,23,42,.35)}
textarea.in{resize:none;line-height:1.4}
.btn{height:52px;border-radius:14px;border:0;font:600 16px var(--fb);width:100%;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s,filter .12s,opacity .12s}
.btn:active{transform:scale(.98)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-p{background:var(--forest);color:#fff}
.btn-s{background:var(--sage);color:var(--forest)}
.btn-a{background:var(--amber);color:#fff}
.btn-d{background:rgba(180,35,24,.1);color:var(--red)}
.btn.sm{height:40px;font-size:14.5px;border-radius:11px}
.pad{padding:0 16px}
.pill{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:11px;font-size:12px;font-weight:600;white-space:nowrap}
.pill.ok{background:var(--sage);color:var(--forest)}
.pill.warn{background:#FDF0DC;color:#9A5200}
.pill.bad{background:#FDE7E4;color:var(--red)}
.pill.mute{background:rgba(15,23,42,.07);color:var(--mute)}
.seg{display:flex;position:relative;background:rgba(15,23,42,.07);border-radius:10px;padding:2px;margin:0 16px}
.seg-thumb{position:absolute;top:2px;bottom:2px;left:2px;width:calc((100% - 4px)/var(--n,2));border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.16);transform:translateX(calc(var(--i,0)*100%));transition:transform .3s cubic-bezier(.3,.9,.3,1)}
.seg button{flex:1;height:32px;border:0;background:transparent;border-radius:8px;font:600 13.5px var(--fb);color:var(--slate);position:relative;z-index:1;transition:opacity .2s}
.seg button:not(.on){opacity:.72}
.seg button.on{background:transparent}
.chips{display:flex;gap:8px;padding:0 16px;flex-wrap:wrap}
.chip{height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--line);background:#fff;font:600 13.5px var(--fb);color:var(--slate)}
.chip.on{background:var(--forest);border-color:var(--forest);color:#fff}
.track{height:6px;border-radius:3px;background:rgba(15,23,42,.08);overflow:hidden}
.fill{height:100%;border-radius:3px;background:var(--forest);transform-origin:left;animation:bar .9s cubic-bezier(.2,.8,.2,1) both}
.sep{width:1px;background:var(--line);align-self:stretch}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}

/* keypad + code boxes */
.kp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 12px;padding:0 30px}
.k{height:54px;border-radius:12px;border:0;background:#fff;font:500 24px var(--fb);box-shadow:0 1px 0 rgba(15,23,42,.08)}
.k:active{background:var(--sage)}
.k.ghost{background:transparent;box-shadow:none}
.obox{width:46px;height:56px;border-radius:12px;background:#fff;display:grid;place-items:center;font:600 26px var(--fb);box-shadow:inset 0 0 0 1px var(--line)}
.obox.cur{box-shadow:inset 0 0 0 2px var(--forest)}
.pdot{width:16px;height:16px;border-radius:50%;border:2px solid var(--forest)}
.pdot.on{background:var(--forest)}

/* special objects */
.idcard{position:relative;margin:0 16px;height:176px;border-radius:20px;overflow:hidden;color:#fff;background:linear-gradient(135deg,#1B6048 0%,#124734 55%,#0B2F23 100%);box-shadow:0 14px 28px -14px rgba(18,71,52,.7)}
.paper{position:relative;width:304px;background:#FFFEFA;color:#1c1917;font-family:var(--fm);font-size:11.5px;line-height:1.5;padding:18px 18px 22px;box-shadow:0 8px 24px -10px rgba(15,23,42,.35)}
.paper::after{content:"";position:absolute;left:0;bottom:-8px;width:100%;height:8px;background:linear-gradient(135deg,#FFFEFA 4px,transparent 0),linear-gradient(225deg,#FFFEFA 4px,transparent 0);background-size:8px 8px}
.paper .ln{display:flex;justify-content:space-between;gap:8px}
.paper hr{border:0;border-top:1px dashed rgba(28,25,23,.45);margin:8px 0}
.cert{position:relative;background:#FFFDF6;border-radius:6px;padding:14px;box-shadow:0 10px 24px -14px rgba(15,23,42,.5);font-family:var(--fd);color:#1c1917;text-align:center}
.cert::before{content:"";position:absolute;inset:6px;border:1.5px solid var(--forest);border-radius:3px;pointer-events:none}
.cert::after{content:"";position:absolute;inset:10px;border:1px solid rgba(18,71,52,.35);border-radius:2px;pointer-events:none}
.stamp{position:absolute;right:16px;bottom:14px;border:2px solid var(--forest);color:var(--forest);border-radius:6px;padding:2px 8px;font:700 11px var(--fb);letter-spacing:.14em;transform:rotate(-8deg);animation:pop .5s both;background:rgba(255,253,246,.85)}
.bubble{background:#DDF3E4;border-radius:14px 14px 4px 14px;padding:10px 12px;font-size:13px;line-height:1.4;position:relative;max-width:300px;margin-left:auto}
.tl{position:relative;padding-left:26px}
.tl::before{content:'';position:absolute;left:7px;top:6px;bottom:-16px;width:2px;background:var(--line)}
.tl:last-child::before{display:none}
.tl .nd{position:absolute;left:0;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--forest);display:grid;place-items:center}
.tl .nd.f{background:var(--forest)}
.tl .nd.u{border-style:dashed;border-color:rgba(15,23,42,.35)}
.step{display:flex;gap:12px;align-items:flex-start;padding:9px 14px;position:relative}
.step .nd{width:18px;height:18px;border-radius:50%;border:2px solid rgba(15,23,42,.25);flex:none;margin-top:1px;display:grid;place-items:center;background:#fff}
.step .nd.f{background:var(--forest);border-color:var(--forest)}
.step .nd.c{border-color:var(--amber);box-shadow:0 0 0 4px rgba(217,119,6,.18)}
.step+.step::before{content:'';position:absolute;left:22px;top:-9px;height:18px;width:2px;background:rgba(15,23,42,.14)}
.step+.step.d::before{background:var(--forest)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:26px 26px 0 0;box-shadow:0 -10px 30px -12px rgba(15,23,42,.35);padding:8px 18px 14px;z-index:6}
.grab{width:38px;height:5px;border-radius:3px;background:rgba(15,23,42,.18);margin:0 auto 10px}
.cb{width:22px;height:22px;border-radius:7px;border:2px solid rgba(15,23,42,.28);display:grid;place-items:center;flex:none;background:#fff;transition:all .15s}
.cb.on{background:var(--forest);border-color:var(--forest)}
.stepper{display:flex;align-items:center;gap:0;background:rgba(15,23,42,.06);border-radius:10px;overflow:hidden}
.stepper button{width:40px;height:34px;border:0;background:transparent;font-size:20px;font-weight:500}
.stepper span{min-width:40px;text-align:center;font-weight:600}
.odo{display:flex;gap:3px}
.odo b{width:34px;height:48px;border-radius:5px;background:#0b1220;color:#fff;display:grid;place-items:center;font:500 28px var(--fm)}
.odo b.red{background:#7f1d1d}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.sheet-wrap{position:absolute;inset:0;z-index:25;background:rgba(15,23,42,.4);display:flex;align-items:flex-end;animation:fade .2s both}
.sheet-wrap.out{animation:fadeout .22s ease-in both;pointer-events:none}
.sheet2{width:100%;background:#fff;border-radius:26px 26px 0 0;padding:8px 18px 30px;max-height:84%;overflow-y:auto;scrollbar-width:none}
.sheet2.in{animation:rise .34s cubic-bezier(.2,.8,.2,1) both}
.sheet2.out{animation:sink .24s cubic-bezier(.5,0,1,.6) both}
.sheet-grab{padding:6px 0 4px;margin:-2px 0 0;touch-action:none;cursor:grab}
.sheet-grab .grab{margin:0 auto}
.sheet2::-webkit-scrollbar{display:none}
.sw{width:51px;height:31px;border-radius:16px;border:0;background:rgba(15,23,42,.18);position:relative;transition:background .2s;flex:none;padding:0}
.sw::after{content:'';position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(15,23,42,.3);transition:transform .2s}
.sw.on{background:var(--forest)}
.sw.on::after{transform:translateX(20px)}
.avatar{width:76px;height:76px;border-radius:50%;background:var(--forest);color:#fff;display:grid;place-items:center;font:500 30px var(--fd)}
.av-s{width:38px;height:38px;border-radius:50%;background:var(--sage);color:var(--forest);display:grid;place-items:center;font-weight:700;font-size:13px;flex:none}
.spin{width:24px;height:24px;border-radius:50%;border:3px solid rgba(15,23,42,.12);border-top-color:var(--forest);animation:spin .8s linear infinite;flex:none}
.unread{width:9px;height:9px;border-radius:50%;background:var(--amber);flex:none}
/* ===== sistem gerak ===== */
@keyframes riseS{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
@keyframes scr-fwd{from{transform:translateX(32px);opacity:0}to{transform:none;opacity:1}}
@keyframes scr-back{from{transform:translateX(-32px);opacity:0}to{transform:none;opacity:1}}
@keyframes scr-tab{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@keyframes sink{to{transform:translateY(105%)}}
@keyframes fadeout{to{opacity:0}}
@keyframes toastout{to{opacity:0;transform:translateY(-10px)}}
@keyframes drift{from{transform:translate(-9px,7px) scale(1.02)}to{transform:translate(9px,-7px) scale(1.07)}}
@keyframes draw1{to{stroke-dashoffset:0}}
@keyframes belring{0%,100%{transform:rotate(0)}12%{transform:rotate(-16deg)}30%{transform:rotate(13deg)}48%{transform:rotate(-9deg)}66%{transform:rotate(5deg)}84%{transform:rotate(-2deg)}}
@keyframes stampin{from{transform:rotate(-6deg) scale(2.6);opacity:0}60%{opacity:1}to{transform:rotate(-6deg) scale(1);opacity:1}}
@keyframes zoomin{from{transform:scale(.94) translateY(10px);opacity:0}to{transform:none;opacity:1}}
.live[data-dir=fwd] .shell{animation:scr-fwd .38s cubic-bezier(.2,.8,.2,1) both}
.live[data-dir=back] .shell{animation:scr-back .38s cubic-bezier(.2,.8,.2,1) both}
.live[data-dir=fade] .shell{animation:fade .26s both}
.live[data-dir=tab] .scroll{animation:scr-tab .28s cubic-bezier(.2,.8,.2,1) both}
.live .scroll>*{animation:riseS .44s cubic-bezier(.2,.8,.2,1) both}
.live .scroll>*:nth-child(2){animation-delay:.04s}.live .scroll>*:nth-child(3){animation-delay:.08s}.live .scroll>*:nth-child(4){animation-delay:.12s}
.live .scroll>*:nth-child(5){animation-delay:.16s}.live .scroll>*:nth-child(6){animation-delay:.2s}.live .scroll>*:nth-child(7){animation-delay:.24s}
.live .scroll>*:nth-child(8){animation-delay:.28s}.live .scroll>*:nth-child(n+9){animation-delay:.32s}
.live .draw-line{stroke-dasharray:1;stroke-dashoffset:1;animation:draw1 1.1s .12s cubic-bezier(.3,.7,.2,1) forwards}
.live .area-in{animation:fade .9s .25s both}
.live .dot-in{animation:pop .45s .95s both;transform-box:fill-box;transform-origin:center}
.live .cp-pop{animation:pop .5s both;transform-box:fill-box;transform-origin:center}
.live .bell-ring svg{transform-origin:50% 8%;animation:belring 1.1s .6s both}
.live .stamp-in{animation:stampin .4s 1.8s cubic-bezier(.2,.9,.3,1.25) both}
.live .drift{animation:drift 22s ease-in-out infinite alternate}
.zoomin{animation:zoomin .34s cubic-bezier(.2,.8,.2,1) both}
.modefade{animation:fade .3s both}
.frames>figure{animation:rise .55s cubic-bezier(.2,.8,.2,1) both}
.frames>figure:nth-child(2){animation-delay:.06s}.frames>figure:nth-child(3){animation-delay:.12s}.frames>figure:nth-child(4){animation-delay:.18s}.frames>figure:nth-child(n+5){animation-delay:.24s}
.fill{transition:width .7s cubic-bezier(.2,.8,.2,1)}
.chip{transition:background .2s,color .2s,border-color .2s,transform .12s}
.chip:active{transform:scale(.95)}
.tab svg{transition:transform .25s cubic-bezier(.3,.9,.3,1)}
.tab.on svg{transform:translateY(-1px) scale(1.08)}
.tab:active svg{transform:scale(.9)}
button.r{transition:background .15s}
button.r:active{background:rgba(15,23,42,.06)}
.k{transition:transform .1s,background .15s}
.k:active{transform:scale(.93);background:var(--sage)}
.stepper button{transition:background .15s,transform .1s}
.stepper button:active{background:rgba(15,23,42,.1);transform:scale(.92)}
.pdot{transition:background .15s,transform .15s}
.pdot.on{transform:scale(1.12)}
.pv{transition:background .15s,transform .12s}
.pv:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001s!important;scroll-behavior:auto!important}}

/* ===== app mode: the board's phone, made the real app ===== */
html,body,#root{height:100%}
body{overscroll-behavior:none}
.app-root{position:fixed;inset:0;display:flex;justify-content:center;align-items:center;background:var(--board)}
.app-root .phone{width:100%;max-width:430px;height:100%;border-radius:0;box-shadow:none}
.app-root .phone .island{display:none}
@media (min-width:600px){
  .app-root{background:var(--board)}
  .app-root .phone{height:min(844px,calc(100% - 32px));max-width:390px;border-radius:52px;box-shadow:0 0 0 9px #0F172A,0 0 0 10.5px #475569,0 40px 70px -24px rgba(15,23,42,.45)}
  .app-root .phone .island{display:block}
}
@media (max-width:599px){
  .app-root .sb>*{display:none}
  .app-root .sb{height:max(env(safe-area-inset-top),14px)}
  .app-root .home{height:max(env(safe-area-inset-bottom),10px)}
  .app-root .home i,.app-root .tabbar .hbar{display:none}
  .app-root .tabbar{height:calc(58px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom)}
}

/* ===== laptop / desktop (>= 900px): real web layout, no phone frame ===== */
.app-root.desk{display:block;background:var(--canvas)}
.phone.desk{width:100%;max-width:none;height:100%;border-radius:0;box-shadow:none;background:var(--canvas);font-size:15px}
.phone.desk .island,.phone.desk .sb,.phone.desk .sb-abs,.phone.desk .home,.phone.desk .tabbar{display:none}
.phone.desk .shell.dsk{flex-direction:row}
.side{width:248px;flex:none;background:var(--forest);color:#fff;display:flex;flex-direction:column;padding:22px 14px 18px;gap:6px}
.side-brand{display:flex;align-items:center;gap:10px;padding:2px 10px 18px;font-family:var(--fd);font-size:25px;font-weight:500}
.side-role{padding:10px 12px;margin-bottom:12px;border-radius:12px;background:rgba(255,255,255,.09);display:flex;flex-direction:column;gap:2px;font-size:14.5px}
.side-role .eyebrow{color:rgba(255,255,255,.62)}
.side nav{display:flex;flex-direction:column;gap:4px;flex:1}
.side-item{display:flex;align-items:center;gap:12px;height:46px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:rgba(255,255,255,.8);font:600 15px var(--fb);text-align:left;transition:background .15s,color .15s}
.side-item:hover{background:rgba(255,255,255,.1);color:#fff}
.side-item.on{background:#fff;color:var(--forest)}
.side-item.out{color:rgba(255,255,255,.66);flex:none}
.dmain{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--canvas)}
.dmain .scroll{overflow-y:auto}
.col-w{max-width:720px;margin:0 auto;padding:18px 32px 64px}
.phone.desk .toast{position:fixed;top:20px;left:50%;right:auto;margin-left:-190px;width:380px;max-width:calc(100vw - 32px)}
.phone.desk .sheet-wrap{position:fixed;inset:0;align-items:center;justify-content:center;padding:24px}
.phone.desk .sheet2{max-width:520px;border-radius:22px;padding-bottom:22px;max-height:86vh}
.phone.desk .sheet-grab{display:none}

/* sign-in on desktop: brand panel + card */
.app-root.auth-desk{background:var(--forest);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch;color:#fff}
.auth-brand{display:flex;flex-direction:column;justify-content:center;padding:48px 8vw 48px 10vw;position:relative}
.auth-brand h1{font-family:var(--fd);font-weight:500;font-size:clamp(46px,5vw,72px);letter-spacing:-.02em;line-height:1.02;margin:14px 0 0}
.auth-brand .tag{font-size:19px;opacity:.85;margin:10px 0 32px}
.auth-brand ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;max-width:420px}
.auth-brand li{display:flex;flex-direction:column;gap:1px;padding-left:14px;border-left:2px solid rgba(255,255,255,.3)}
.auth-brand li b{font-weight:600;font-size:16px}
.auth-brand li span{font-size:14px;opacity:.7}
.auth-brand .foot{margin-top:36px;font-size:13px;opacity:.55}
.auth-card{display:flex;align-items:center;justify-content:center;padding:24px}
.auth-card .phone.desk{width:100%;max-width:430px;height:min(860px,100%);border-radius:28px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.45)}
@media (min-width:900px) and (max-width:1100px){.auth-brand{padding-left:6vw;padding-right:4vw}}
`;
