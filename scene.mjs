// Perihelion scene: dependency-free hand-projected 3D. Canvas 2D, no WebGL, no libraries.
// mountScene(container, projects, options) -> { destroy() }
// Each project: { num, name, role, stack, meta, note, url, shape, orbit:{r, speed, phase, tilt, y} }

const SHAPES = {
  tetra: { v: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]], e: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] },
  cube: { v: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
          e: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]] },
  octa: { v: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
          e: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]] },
  pyramid: { v: [[-1,-0.7,-1],[1,-0.7,-1],[1,-0.7,1],[-1,-0.7,1],[0,1,0]],
             e: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]] },
  prism: { v: [[-1,-1,-0.9],[1,-1,-0.9],[0,1,-0.9],[-1,-1,0.9],[1,-1,0.9],[0,1,0.9]],
           e: [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]] },
  bipyramid: { v: (() => { const ring = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ring.push([Math.cos(a), 0, Math.sin(a)]); } ring.push([0, 1.3, 0]); ring.push([0, -1.3, 0]); return ring; })(),
               e: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,5],[2,5],[3,5],[4,5],[0,6],[1,6],[2,6],[3,6],[4,6]] },
};

const LINKS = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,4]];

export function mountScene(container, projects, options = {}) {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = {
    bg0: '#14100c', bg1: '#0b0806',
    ink: '#f2ece3', faint: '#9c8f81', dim: '#6e6357',
    accent: '#ff5c34', line: 'rgba(156,143,129,0.16)', wire: 'rgba(226,213,199,0.85)',
  };

  container.classList.add('p3d');
  const stage = document.createElement('div');
  stage.className = 'p3d-stage';
  const canvas = document.createElement('canvas');
  canvas.className = 'p3d-canvas';
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', 'Interactive 3D scene: six builds orbit a core. Use left and right arrow keys to move between builds, Enter to focus one, Escape to reset.');
  if (options.hero) {
    const hero = document.createElement('div');
    hero.className = 'p3d-hero';
    const nav = document.createElement('div'); nav.className = 'p3d-hero-nav';
    nav.innerHTML = '<span class="p3d-hero-mark">' + options.hero.mark + '</span><span>' + options.hero.nav + '</span>';
    const mid = document.createElement('div'); mid.className = 'p3d-hero-mid';
    const nm = document.createElement('div'); nm.className = 'p3d-hero-name'; nm.textContent = options.hero.name;
    const tag = document.createElement('div'); tag.className = 'p3d-hero-tag'; tag.textContent = options.hero.tagline;
    mid.appendChild(nm); mid.appendChild(tag);
    const meta = document.createElement('div'); meta.className = 'p3d-hero-meta'; meta.textContent = options.hero.meta;
    hero.appendChild(nav); hero.appendChild(mid); hero.appendChild(meta);
    stage.appendChild(hero);
  }
  const hint = document.createElement('div');
  hint.className = 'p3d-hint';
  hint.textContent = reduced ? 'a still frame of the scene - tap a build below to read it' : 'drag to orbit · tap a build · esc to reset';
  const panel = document.createElement('div');
  panel.className = 'p3d-panel';
  panel.setAttribute('aria-live', 'polite');
  stage.appendChild(canvas);
  stage.appendChild(hint);
  container.appendChild(stage);
  container.appendChild(panel);

  const ctx = canvas.getContext('2d');
  if (!ctx) { container.classList.add('p3d-fallback'); return { destroy() {} }; }

  let W = 0, H = 0, dpr = 1, dbgTick = 0;
  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(280, r.width);
    H = Math.max(340, Math.min(640, Math.round(W * (W < 640 ? 1.34 : 0.56))));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(() => { resize(); if (reduced) draw(0); });
  ro.observe(stage);
  resize();

  // particles: warm dust in a sphere
  const P_COUNT = W < 640 ? 190 : 380;
  const particles = [];
  for (let i = 0; i < P_COUNT; i++) {
    const r = 240 + Math.random() * 460;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    particles.push({ x: r * Math.sin(p) * Math.cos(t), y: r * Math.cos(p) * 0.62, z: r * Math.sin(p) * Math.sin(t), s: 0.5 + Math.random() * 1.4 });
  }

  const nodes = projects.map((p, i) => ({
    p, shape: SHAPES[p.shape] || SHAPES.cube,
    orbit: p.orbit, spin: Math.random() * Math.PI * 2, spinSpeed: 0.0016 + Math.random() * 0.0012,
    pos: [0, 0, 0], screen: [0, 0, 0],
  }));

  // camera
  const baseCamR = W < 640 ? 780 : 640;
  let theta = 0.6, phi = 0.32, camR = baseCamR;
  let vTheta = 0.00016, vPhi = 0;
  let dragging = false, moved = 0, lastX = 0, lastY = 0;
  let focus = -1;
  const focusPos = [0, 0, 0];
  let camTarget = [0, 0, 0];
  let camRCur = camR, camRTarget = camR;

  function nodePos(n, t) {
    const rScale = W < 640 ? 0.62 : 1;
    const a = n.orbit.phase + t * n.orbit.speed;
    const x = Math.cos(a) * n.orbit.r * rScale;
    const z = Math.sin(a) * n.orbit.r * rScale;
    const tilt = n.orbit.tilt;
    return [x, n.orbit.y * rScale + z * Math.sin(tilt), z * Math.cos(tilt)];
  }

  function project(pt, t) {
    // world -> camera space
    const tx = pt[0] - camTarget[0], ty = pt[1] - camTarget[1], tz = pt[2] - camTarget[2];
    const ct = Math.cos(theta), st = Math.sin(theta), cp = Math.cos(phi), sp = Math.sin(phi);
    const x1 = tx * ct - tz * st;
    const z1 = tx * st + tz * ct;
    const y2 = ty * cp - z1 * sp;
    const z2 = ty * sp + z1 * cp + camRCur;
    const f = 560;
    const s = f / Math.max(60, z2);
    const xOff = W > 900 ? W * 0.1 : 0;
    return [W / 2 + xOff + x1 * s, H / 2 - y2 * s, s, z2];
  }

  function draw(t) {
    // track the focused build as it keeps orbiting
    if (focus >= 0) {
      const fp = nodePos(nodes[focus], t);
      focusPos[0] = fp[0]; focusPos[1] = fp[1]; focusPos[2] = fp[2];
    }
    // ease camera
    if (!dragging) {
      theta += vTheta;
      phi += vPhi;
      vPhi *= 0.95;
      vTheta = vTheta * 0.95 + 0.00016 * 0.05;
      phi += (0.32 - phi) * 0.004;
    }
    camRCur += (camRTarget - camRCur) * 0.06;
    const want = focus >= 0 ? focusPos : [0, 0, 0];
    camTarget[0] += (want[0] - camTarget[0]) * 0.06;
    camTarget[1] += (want[1] - camTarget[1]) * 0.06;
    camTarget[2] += (want[2] - camTarget[2]) * 0.06;

    // background
    const g = ctx.createRadialGradient(W / 2, H * 0.46, 20, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, C.bg0); g.addColorStop(1, C.bg1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // particles
    const drift = t * 0.00002;
    const cd = Math.cos(drift), sd = Math.sin(drift);
    for (const p of particles) {
      const x = p.x * cd - p.z * sd, z = p.x * sd + p.z * cd;
      const [sx, sy, s] = project([x, p.y, z], t);
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
      const a = Math.max(0.04, Math.min(0.5, (s - 0.4) * 0.5));
      ctx.fillStyle = `rgba(214,199,181,${a})`;
      ctx.fillRect(sx, sy, p.s * s, p.s * s);
    }

    // core glow
    const [cx, cy, cs] = project([0, 0, 0], t);
    const coreR = 26 * cs;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 4.2);
    glow.addColorStop(0, 'rgba(255,92,52,0.5)');
    glow.addColorStop(0.35, 'rgba(255,92,52,0.14)');
    glow.addColorStop(1, 'rgba(255,92,52,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, coreR * 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9c9';
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(2.5, coreR * 0.32), 0, Math.PI * 2); ctx.fill();

    // node positions
    for (const n of nodes) {
      n.pos = nodePos(n, t);
      n.screen = project(n.pos, t);
    }

    // links between builds
    ctx.lineWidth = 1;
    for (const [a, b] of LINKS) {
      const A = nodes[a], B = nodes[b];
      if (!A || !B) continue;
      const hot = focus === a || focus === b;
      ctx.strokeStyle = hot ? 'rgba(255,92,52,0.5)' : C.line;
      ctx.beginPath();
      ctx.moveTo(A.screen[0], A.screen[1]);
      ctx.lineTo(B.screen[0], B.screen[1]);
      ctx.stroke();
    }

    // shapes, far to near
    const order = nodes.slice().sort((m, n) => n.screen[3] - m.screen[3]);
    for (const n of order) {
      n.spin += reduced ? 0 : n.spinSpeed * 16;
      const sc = 30 * n.screen[2];
      const cs = Math.cos(n.spin), sn = Math.sin(n.spin);
      const pts = n.shape.v.map(([x, y, z]) => {
        const x1 = x * cs - z * sn, z1 = x * sn + z * cs;
        const y2 = y * Math.cos(n.spin * 0.7) - z1 * Math.sin(n.spin * 0.7) * 0.4;
        return project([n.pos[0] + x1 * 30, n.pos[1] + y2 * 30, n.pos[2] + z1 * 30], t);
      });
      const sel = focus === nodes.indexOf(n);
      ctx.lineWidth = sel ? 1.6 : 1;
      for (const [a, b] of n.shape.e) {
        const A = pts[a], B = pts[b];
        const depth = Math.min(1, Math.max(0.25, (A[2] + B[2]) / 2 - 0.35));
        ctx.strokeStyle = sel ? C.accent : `rgba(226,213,199,${0.28 + depth * 0.5})`;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      // selection ring
      if (sel) {
        ctx.strokeStyle = 'rgba(255,92,52,0.55)';
        ctx.beginPath(); ctx.arc(n.screen[0], n.screen[1], sc + 10, 0, Math.PI * 2); ctx.stroke();
      }
      // collect label for decluttered drawing below
      n.label = { x: n.screen[0], y: n.screen[1] + sc + 16, sel };
    }

    const items = order.map((n) => ({ n, x: n.label.x, y: n.label.y, sel: n.label.sel }));
    if (W < 640) {
      // small screens: fixed bottom row of number chips with leader lines; deterministic, never overlapping
      const byNum = items.slice().sort((a, b) => a.n.p.num.localeCompare(b.n.p.num));
      byNum.forEach((it, i) => { it.x = W * (0.13 + i * 0.148); it.y = H - 96; it.n.chip = [it.x, it.y]; });
      ctx.textAlign = 'center';
      ctx.lineWidth = 1;
      for (const it of byNum) {
        const nSc = 30 * it.n.screen[2];
        ctx.strokeStyle = it.sel ? 'rgba(255,92,52,0.6)' : 'rgba(156,143,129,0.35)';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - 8);
        ctx.lineTo(it.n.screen[0], it.n.screen[1] + nSc + 4);
        ctx.stroke();
      }
      for (const it of byNum) {
        ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = it.sel ? C.accent : 'rgba(201,185,168,0.95)';
        ctx.fillText(it.n.p.num, it.x, it.y);
        if (it.sel) {
          ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.fillStyle = C.ink;
          ctx.fillText(it.n.p.name.toLowerCase(), it.x, it.y + 15);
        }
      }
      return;
    }
    const labelTop = options.hero ? 96 : 78;
    const labelBottom = H - 64;
    ctx.textAlign = 'center';
    // measured label rects: number baseline at y, name baseline at y+15
    const pad = 8;
    for (const it of items) {
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      const wNum = ctx.measureText(it.n.p.num).width;
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      const wName = ctx.measureText(it.n.p.name.toLowerCase()).width;
      it.w = Math.max(wNum, wName) + 10;
    }
    const rect = (it) => ({ x0: it.x - it.w / 2, x1: it.x + it.w / 2, y0: it.y - 10, y1: it.y + 20 });
    const clampIt = (it) => {
      it.x = Math.max(it.w / 2 + 6, Math.min(W - it.w / 2 - 6, it.x));
      it.y = Math.max(labelTop + 10, Math.min(labelBottom - 20, it.y));
    };
    // obstacle boxes: every build's shape, plus the hero name block
    const obstacles = nodes.map((m) => {
      const s = 30 * m.screen[2] + 8;
      return { x0: m.screen[0] - s, x1: m.screen[0] + s, y0: m.screen[1] - s, y1: m.screen[1] + s, own: m };
    });
    if (options.hero) {
      const cr = canvas.getBoundingClientRect();
      // tight text rects (Range) instead of full-width block boxes, so labels
      // may sit beside the name/tagline/meta instead of under whole bands
      for (const sel of ['.p3d-hero-nav', '.p3d-hero-name', '.p3d-hero-tag', '.p3d-hero-meta', '.p3d-hint']) {
        const el = stage.querySelector(sel);
        if (!el) continue;
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const mr = rg.getBoundingClientRect();
        if (mr.width < 2 || mr.height < 2) continue;
        obstacles.push({ x0: mr.left - cr.left - 8, x1: mr.right - cr.left + 8, y0: mr.top - cr.top - 8, y1: mr.bottom - cr.top + 8, own: null });
      }
    }
    for (const it of items) clampIt(it);
    // deterministic 2D resolve: process top-to-bottom; each label scans downward
    // from its desired y (wrapping to the top), trying small x offsets at each row,
    // and takes the first slot free of placed labels, shapes and hero text
    const overlapsAny = (it, placed) => {
      const r = rect(it);
      for (const p of placed) {
        const q = rect(p);
        if (Math.min(r.x1, q.x1) - Math.max(r.x0, q.x0) + pad > 0 && Math.min(r.y1, q.y1) - Math.max(r.y0, q.y0) + pad > 0) return true;
      }
      for (const ob of obstacles) {
        if (Math.min(r.x1, ob.x1) - Math.max(r.x0, ob.x0) + pad > 0 && Math.min(r.y1, ob.y1) - Math.max(r.y0, ob.y0) + pad > 0) return true;
      }
      return false;
    };
    const xOffsets = [0, -30, 30, -60, 60, -90, 90, -120, 120];
    const yMin = labelTop + 10, yMax = labelBottom - 20;
    const span = Math.max(1, yMax - yMin);
    const order2 = items.slice().sort((a, b) => a.y - b.y);
    const placed = [];
    for (const it of order2) {
      const dx = it.x, dy = it.y;
      let best = null, bestCost = Infinity;
      for (let step = 0; step * 6 <= span; step++) {
        const y = yMin + ((dy - yMin + step * 6) % span);
        let rowFree = false;
        for (const xo of xOffsets) {
          it.x = dx + xo; it.y = y; clampIt(it);
          if (Math.abs(it.x - (dx + xo)) > 1) continue; // clamp moved it: slot invalid
          if (!overlapsAny(it, placed)) { rowFree = true;
            const cost = step * 4 + Math.abs(xo) / 30;
            if (cost < bestCost) { bestCost = cost; best = { x: it.x, y: it.y }; }
          }
        }
        if (rowFree) break; // first row with any free slot wins
      }
      if (best) { it.x = best.x; it.y = best.y; } else { it.x = dx; it.y = dy; clampIt(it); }
      placed.push(it);
    }
    // debug/verification hook: final label rects + hero block (throttled DOM attribute)
    dbgTick = (dbgTick + 1) % 10;
    if (dbgTick === 0) { const zones = obstacles.filter((o) => o.own === null); stage.setAttribute('data-p3d-dbg', JSON.stringify({ labels: items.map((it) => ({ num: it.n.p.num, ...rect(it) })), zones })); }
    // leader lines when a label had to move away from its build
    ctx.lineWidth = 1;
    for (const it of items) {
      const nSc = 30 * it.n.screen[2];
      const d = Math.hypot(it.x - it.n.screen[0], it.y - it.n.screen[1]);
      if (d > nSc + 30) {
        ctx.strokeStyle = 'rgba(156,143,129,0.35)';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - 6);
        ctx.lineTo(it.n.screen[0], it.n.screen[1] + nSc + 4);
        ctx.stroke();
      }
    }
    for (const it of items) {
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = it.sel ? C.accent : 'rgba(201,185,168,0.95)';
      ctx.fillText(it.n.p.num, it.x, it.y);
      if (it.sel || W > 620) {
        ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = it.sel ? C.ink : 'rgba(226,213,199,0.92)';
        ctx.fillText(it.n.p.name.toLowerCase(), it.x, it.y + 15);
      }
    }
  }

  function renderPanel() {
    if (focus < 0) {
      panel.innerHTML = '<div class="p3d-panel-idle"><b>six builds in orbit.</b> each solid is one public repo. focus one to read its facts, or read the full register below.</div>';
      return;
    }
    const p = nodes[focus].p;
    panel.innerHTML = '';
    const top = document.createElement('div'); top.className = 'p3d-panel-top';
    const num = document.createElement('span'); num.className = 'p3d-panel-num'; num.textContent = p.num;
    const name = document.createElement('span'); name.className = 'p3d-panel-name'; name.textContent = p.name;
    const role = document.createElement('span'); role.className = 'p3d-panel-role'; role.textContent = p.role;
    top.appendChild(num); top.appendChild(name); top.appendChild(role);
    const desc = document.createElement('p'); desc.className = 'p3d-panel-desc'; desc.textContent = p.desc;
    const meta = document.createElement('div'); meta.className = 'p3d-panel-meta';
    meta.innerHTML = '<span>' + p.stack + '</span><span>' + p.meta + '</span>';
    const note = document.createElement('div'); note.className = 'p3d-panel-note'; note.textContent = p.note;
    const link = document.createElement('a'); link.className = 'p3d-panel-link'; link.href = p.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'repo';
    panel.appendChild(top); panel.appendChild(desc); panel.appendChild(meta); panel.appendChild(note); panel.appendChild(link);
  }

  function select(i) {
    focus = i;
    if (i >= 0) {
      const n = nodes[i];
      focusPos[0] = n.pos[0]; focusPos[1] = n.pos[1]; focusPos[2] = n.pos[2];
      camRTarget = W < 640 ? 560 : 430;
      hint.textContent = reduced ? 'a still frame of the scene - tap a build below to read it' : 'drag to orbit · esc to reset';
    } else {
      camRTarget = baseCamR;
      hint.textContent = reduced ? 'a still frame of the scene - tap a build below to read it' : 'drag to orbit · tap a build · esc to reset';
    }
    stage.classList.toggle('p3d-focused', i >= 0);
    renderPanel();
    if (reduced) draw(performance.now());
  }

  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX; lastY = e.clientY;
    theta += dx * 0.004;
    phi = Math.max(-0.1, Math.min(0.9, phi + dy * 0.003));
    vTheta = dx * 0.0004;
  });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 6) {
      // pick nearest node within radius
      let best = -1, bestD = W < 640 ? 48 : 40;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.screen[0] - mx, n.screen[1] - my);
        const rr = Math.max(bestD, 34 * n.screen[2]);
        if (d < rr && (best < 0 || d < bestD)) { best = i; bestD = Math.min(d, bestD); }
        if (n.chip) {
          const dc = Math.hypot(n.chip[0] - mx, n.chip[1] - my);
          if (dc < 22) { best = i; }
        }
      });
      select(best === focus ? -1 : best);
    }
  });
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { select(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const d = e.key === 'ArrowRight' ? 1 : -1;
      select(((focus < 0 ? (d > 0 ? -1 : nodes.length) : focus) + d + nodes.length) % nodes.length);
      e.preventDefault();
    }
    if (e.key === 'Enter' || e.key === ' ') { if (focus < 0) select(0); e.preventDefault(); }
  });

  renderPanel();

  let raf = 0;
  if (reduced) {
    draw(1200);
  } else {
    const loop = (t) => { if (!document.hidden) draw(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  if (typeof options.initialFocus === 'number') select(options.initialFocus);

  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); container.innerHTML = ''; }, select };
      }
