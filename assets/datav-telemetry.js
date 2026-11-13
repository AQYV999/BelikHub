// assets/datav-telemetry.js - BelikHub 3D Hydrological Spatial Telemetry Canvas Engine (DataV Command Center)

export function initDataVTelemetry() {
  const container = document.getElementById('bh-datav-container');
  const canvas = document.getElementById('bh-datav-canvas');
  if (!container || !canvas) return;

  const ctx = canvas.getContext('2d');
  const waveCanvas = document.getElementById('bh-hud-wave-canvas');
  const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
  const rotBtn = document.getElementById('bh-rot-toggle');

  let isRotating = true;
  let isVisible = true;
  let animId = null;

  if (rotBtn) {
    rotBtn.addEventListener('click', () => {
      isRotating = !isRotating;
      rotBtn.textContent = isRotating ? 'PAUSE' : 'PLAY';
      rotBtn.setAttribute('aria-pressed', (!isRotating).toString());
    });
  }

  // Handle visibility to save CPU when off-screen
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    observer.observe(container);
  }

  let width = 0;
  let height = 0;
  const resize = () => {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    if (width === 0 || height === 0) return;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Generate Geospatial Dotted Matrix Points (Archipelago + Continental Coordinates)
  const points = [];
  const numLat = 18;
  const numLon = 36;
  for (let i = 0; i < numLat; i++) {
    const lat = ((i / (numLat - 1)) - 0.5) * Math.PI * 0.92;
    const count = Math.max(6, Math.floor(Math.cos(lat) * numLon));
    for (let j = 0; j < count; j++) {
      const lon = (j / count) * Math.PI * 2;
      points.push({ lat, lon });
    }
  }

  // Indonesian Mountain Springshed Coordinates (Central Java & Archipelago Hubs)
  const springs = [
    { name: 'TUK BISMO', lat: -0.126, lon: 1.918, debit: '260 L/s', color: '#f59e0b', pulsePhase: 0 },
    { name: 'SIKUCING', lat: -0.124, lon: 1.922, debit: '85 L/s', color: '#2dd4bf', pulsePhase: 1 },
    { name: 'WATULUMBUNG', lat: -0.128, lon: 1.914, debit: '38 L/s', color: '#2dd4bf', pulsePhase: 2 },
    { name: 'WONOMERTO', lat: -0.127, lon: 1.919, debit: '4.5 L/s', color: '#38bdf8', pulsePhase: 3 },
    { name: 'SUMATERA HULU', lat: -0.015, lon: 1.78, debit: '120 L/s', color: '#2dd4bf', pulsePhase: 4 },
    { name: 'BALI BELIK', lat: -0.146, lon: 2.01, debit: '42 L/s', color: '#2dd4bf', pulsePhase: 5 }
  ];

  let rotY = 1.82;
  const tiltX = 0.32;
  let time = 0;

  // Waveform oscilloscope renderer
  function drawWave() {
    if (!waveCtx) return;
    waveCtx.clearRect(0, 0, 96, 22);
    waveCtx.strokeStyle = '#2dd4bf';
    waveCtx.lineWidth = 1.3;
    waveCtx.beginPath();
    for (let x = 0; x < 96; x++) {
      const y = 11 + Math.sin((x * 0.16) + (time * 0.11)) * 4.5 * Math.sin((x * 0.04) + (time * 0.04));
      if (x === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }

  function render() {
    animId = requestAnimationFrame(render);
    if (!isVisible) return;

    time++;
    if (isRotating) rotY += 0.0065;

    ctx.clearRect(0, 0, width, height);
    if (width === 0 || height === 0) return;

    const cx = width / 2;
    const cy = (height / 2) + 2;
    const R = Math.min(width, height) * 0.385;

    // 1. Globe Atmosphere Aura
    const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.35);
    glowGrad.addColorStop(0, 'rgba(45, 212, 191, 0.15)');
    glowGrad.addColorStop(0.65, 'rgba(45, 212, 191, 0.04)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2. Telemetry Orbit Rings & Coordinate Ticks
    ctx.save();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2 + (time * 0.002);
      const r1 = R * 1.12;
      const r2 = R * 1.17;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx.strokeStyle = (a % 3 === 0) ? 'rgba(45, 212, 191, 0.55)' : 'rgba(45, 212, 191, 0.22)';
      ctx.stroke();
    }

    // Radar scan cone
    const radarAng = time * 0.035;
    const radarGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    radarGrad.addColorStop(0, 'rgba(45, 212, 191, 0.32)');
    radarGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = radarGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, radarAng, radarAng + 0.52);
    ctx.closePath();
    ctx.fill();

    // Latitude 3D Grids
    const drawLatRing = (latAngle, alpha) => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
      ctx.lineWidth = 1;
      const steps = 48;
      let started = false;
      for (let s = 0; s <= steps; s++) {
        const l = (s / steps) * Math.PI * 2;
        const x0 = R * Math.cos(latAngle) * Math.sin(l + rotY);
        const y0 = R * Math.sin(latAngle);
        const z0 = R * Math.cos(latAngle) * Math.cos(l + rotY);
        const y1 = y0 * Math.cos(tiltX) - z0 * Math.sin(tiltX);
        const z1 = y0 * Math.sin(tiltX) + z0 * Math.cos(tiltX);
        if (z1 > -R * 0.15) {
          if (!started) { ctx.moveTo(cx + x0, cy - y1); started = true; }
          else ctx.lineTo(cx + x0, cy - y1);
        } else {
          started = false;
        }
      }
      ctx.stroke();
    };
    drawLatRing(0, 0.26);             // Equator
    drawLatRing(Math.PI * 0.22, 0.14); // Tropic North
    drawLatRing(-Math.PI * 0.22, 0.14); // Tropic South

    // 3. Dot Grid Points on Sphere
    points.forEach((p) => {
      const x0 = R * Math.cos(p.lat) * Math.sin(p.lon + rotY);
      const y0 = R * Math.sin(p.lat);
      const z0 = R * Math.cos(p.lat) * Math.cos(p.lon + rotY);

      const y1 = y0 * Math.cos(tiltX) - z0 * Math.sin(tiltX);
      const z1 = y0 * Math.sin(tiltX) + z0 * Math.cos(tiltX);

      if (z1 > -R * 0.35) {
        const depth = (z1 + R) / (2 * R);
        const rad = Math.max(0.7, depth * 2.1);
        const alpha = Math.max(0.08, depth * 0.72);
        ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + x0, cy - y1, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Springs & Trajectory Arcs
    const projectedSprings = [];
    springs.forEach((sp, idx) => {
      const x0 = R * Math.cos(sp.lat) * Math.sin(sp.lon + rotY);
      const y0 = R * Math.sin(sp.lat);
      const z0 = R * Math.cos(sp.lat) * Math.cos(sp.lon + rotY);

      const y1 = y0 * Math.cos(tiltX) - z0 * Math.sin(tiltX);
      const z1 = y0 * Math.sin(tiltX) + z0 * Math.cos(tiltX);

      if (z1 > 0) {
        const sx = cx + x0;
        const sy = cy - y1;
        projectedSprings.push({ ...sp, sx, sy, z1, idx });

        // Beacon Center
        ctx.beginPath();
        ctx.fillStyle = sp.color;
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Beacon Pulse Ring
        const ringR = 5 + Math.sin((time * 0.08) + sp.pulsePhase) * 3.5;
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // Primary Pin Annotation for Central Java pilot spring (Tuk Bismo)
        if (idx === 0) {
          ctx.fillStyle = '#f1f6f8';
          ctx.font = '600 9px "JetBrains Mono", monospace';
          ctx.fillText(sp.name, sx + 9, sy - 5);
          ctx.fillStyle = '#f59e0b';
          ctx.font = '700 8.5px "JetBrains Mono", monospace';
          ctx.fillText(sp.debit, sx + 9, sy + 6);

          // Crosshair
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.beginPath();
          ctx.moveTo(sx - 7, sy); ctx.lineTo(sx + 7, sy);
          ctx.moveTo(sx, sy - 7); ctx.lineTo(sx, sy + 7);
          ctx.stroke();
        }
      }
    });

    // 5. Central Hub: GRID 5KM PRIVACY SHIELD
    const hubX = cx;
    const hubY = cy - 35;

    // Draw Ballistic Trajectory Arcs to Hub
    projectedSprings.slice(0, 3).forEach((sp, i) => {
      ctx.beginPath();
      const isPrimary = (sp.idx === 0);
      ctx.strokeStyle = isPrimary ? 'rgba(245, 158, 11, 0.85)' : 'rgba(45, 212, 191, 0.55)';
      ctx.lineWidth = isPrimary ? 1.8 : 1.2;

      const midX = (sp.sx + hubX) / 2 + (isPrimary ? -25 : 20);
      const midY = Math.min(sp.sy, hubY) - 32;

      ctx.moveTo(sp.sx, sp.sy);
      ctx.quadraticCurveTo(midX, midY, hubX, hubY);
      ctx.stroke();

      // Flying Particle Light Packet
      const tVal = ((time * 0.018) + (i * 0.33)) % 1;
      const qx = (1 - tVal) * (1 - tVal) * sp.sx + 2 * (1 - tVal) * tVal * midX + tVal * tVal * hubX;
      const qy = (1 - tVal) * (1 - tVal) * sp.sy + 2 * (1 - tVal) * tVal * midY + tVal * tVal * hubY;

      ctx.fillStyle = isPrimary ? '#fbbf24' : '#2dd4bf';
      ctx.shadowColor = isPrimary ? '#f59e0b' : '#2dd4bf';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(qx, qy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Hub Badge
    ctx.fillStyle = 'rgba(8, 14, 20, 0.92)';
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hubX - 44, hubY - 11, 88, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2dd4bf';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GRID 5 KM', hubX, hubY + 3.5);
    ctx.textAlign = 'left';

    ctx.restore();
    drawWave();
  }

  render();
}
