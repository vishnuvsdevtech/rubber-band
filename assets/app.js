/* Rubber band.
 *
 * Two mechanisms, one idea: a limit you can feel.
 *   vertical  — wheel/drag feeds a raw target; display = rubber(target), spring home on idle
 *   horizontal — drag with velocity, friction decay, bounce at the ends
 * Resistance is sub-linear (36% of the excess), so the pull gets harder the
 * further you go without ever becoming impossible.
 */
(() => {
  const vp = document.getElementById('vp');
  const content = document.getElementById('content');
  const tTop = document.getElementById('tTop');
  const tBot = document.getElementById('tBot');
  const shelfWrap = document.getElementById('shelfWrap');
  const shelf = document.getElementById('shelf');
  const mOff = document.getElementById('mOff');
  const mV = document.getElementById('mV');
  const mT = document.getElementById('mT');

  const RESIST = 0.36;
  const rubber = (v, lo) => (v > 0 ? v * RESIST : v < lo ? lo + (v - lo) * RESIST : v);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- vertical ---------------- */
  let target = 0, disp = 0, idle = null, vRaf = null;

  function vMin() { return Math.min(0, vp.clientHeight - content.scrollHeight); }

  function renderV() {
    disp = rubber(target, vMin());
    content.style.transform = `translate3d(0,${disp.toFixed(2)}px,0)`;
    const lo = vMin();
    const over = disp > 0 ? disp : disp < lo ? lo - disp : 0;
    const pct = Math.min(100, Math.abs(over) * 1.6);
    tTop.style.width = disp > 0 ? pct + '%' : '0';
    tBot.style.width = disp < lo ? pct + '%' : '0';
    mOff.textContent = Math.round(disp);
    mT.textContent = Math.round(over);
  }

  function springHome() {
    const lo = vMin();
    const goal = clamp(target, lo, 0);
    target += (goal - target) * 0.2;
    renderV();
    if (Math.abs(target - goal) > 0.4) vRaf = requestAnimationFrame(springHome);
    else { target = goal; renderV(); vRaf = null; }
  }

  function bump() {
    if (vRaf) cancelAnimationFrame(vRaf);
    clearTimeout(idle);
    idle = setTimeout(springHome, 130);
  }

  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    target -= e.deltaY;
    renderV();
    bump();
    mV.textContent = Math.round(Math.abs(e.deltaY));
  }, { passive: false });

  let dY = 0, dStart = 0, dragging = false, lastT = 0, vel = 0;
  vp.addEventListener('pointerdown', (e) => {
    dragging = true; dStart = e.clientY; dY = target; lastT = performance.now(); vel = 0;
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    target = dY + (e.clientY - dStart);
    vel = ((e.clientY - dStart) - (dY * 0)) / 1;   // kept simple: use delta/dt below
    vel = (e.movementY || 0) / dt * 16;
    lastT = now;
    renderV();
    mV.textContent = Math.round(Math.abs(vel));
  });
  vp.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    // momentum, then spring home — the same loop handles both
    let v = vel;
    (function glide() {
      v *= 0.94;
      target += v;
      renderV();
      if (Math.abs(v) > 0.4) requestAnimationFrame(glide);
      else springHome();
    })();
  });

  /* ---------------- horizontal ---------------- */
  let hx = 0, hTarget = 0, hDrag = false, hStartX = 0, hBase = 0, hv = 0, hLast = 0, hIdle = null;
  const tiles = [...shelf.querySelectorAll('.tile')];

  function hMin() { return Math.min(0, shelfWrap.clientWidth - shelf.scrollWidth); }

  function renderH() {
    const lo = hMin();
    hx = rubber(hTarget, lo);
    shelf.style.transform = `translate3d(${hx.toFixed(2)}px,0,0)`;
    const tilt = clamp(hv * 0.35, -10, 10);
    tiles.forEach((t) => { t.style.transform = `rotate(${tilt.toFixed(2)}deg)`; });
    mOff.textContent = Math.round(hx);
  }

  function hSpring() {
    const lo = hMin();
    const goal = clamp(hTarget, lo, 0);
    hTarget += (goal - hTarget) * 0.18;
    renderH();
    if (Math.abs(hTarget - goal) > 0.4) hIdle = requestAnimationFrame(hSpring);
    else { hTarget = goal; renderH(); hIdle = null; }
  }

  shelfWrap.addEventListener('pointerdown', (e) => {
    hDrag = true; hStartX = e.clientX; hBase = hTarget; hLast = performance.now(); hv = 0;
    if (hIdle) { cancelAnimationFrame(hIdle); hIdle = null; }
    shelfWrap.setPointerCapture(e.pointerId);
  });
  shelfWrap.addEventListener('pointermove', (e) => {
    if (!hDrag) return;
    const now = performance.now();
    const dt = Math.max(1, now - hLast);
    const dx = e.clientX - hStartX;
    hv = ((e.clientX - hStartX) - (hTarget - hBase)) / dt * 16;
    hTarget = hBase + dx;
    hLast = now;
    renderH();
    mV.textContent = Math.round(Math.abs(hv));
  });
  shelfWrap.addEventListener('pointerup', () => {
    if (!hDrag) return;
    hDrag = false;
    let v = hv;
    (function glide() {
      v *= 0.94;
      hTarget += v;
      renderH();
      if (Math.abs(v) > 0.4) requestAnimationFrame(glide);
      else hSpring();
    })();
  });

  addEventListener('resize', () => { renderV(); renderH(); });
  renderV(); renderH();
})();
