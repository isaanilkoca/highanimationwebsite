// Halftone dot-field engine (vanilla port of the halftone wordmark idea).
// Any source (SVG illustration or text) is rasterised to a mask, sampled into a grid of
// dots whose radius follows coverage and tone, and kept alive on a light spring simulation:
// the pointer parts the dots, a click sends a shock ring, scroll can disperse the whole field,
// and a new source can morph the existing dots into a new shape.

// Per-dot slots: x y vx vy | hx hy | r tr | R G B | tR tG tB | k delay
const S = 16;
const X = 0, Y = 1, VX = 2, VY = 3, HX = 4, HY = 5, R = 6, TR = 7, CR = 8, CG = 9, CB = 10, TCR = 11, TCG = 12, TCB = 13, K = 14, DL = 15;
const STEP = 1000 / 60;

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return [233, 228, 218];
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const imgCache = new Map();
export function loadSVG(markup) {
  if (imgCache.has(markup)) return imgCache.get(markup);
  const p = new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
  });
  imgCache.set(markup, p);
  return p;
}

export const svgSource = (img, pad = 0.08) => (m, w, h) => {
  const box = Math.min(w, h) * (1 - pad * 2);
  const s = Math.min(box / img.width, box / img.height);
  const dw = img.width * s, dh = img.height * s;
  m.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
};

export const textSource = (word, { font, weight = 800, color = "#ECE7D6", crop = 0.2 }) => (m, w, h) => {
  m.font = `${weight} 100px ${font}`;
  const fit = (w * 1.02) / Math.max(1, m.measureText(word).width) * 100;
  m.font = `${weight} ${fit}px ${font}`;
  const box = m.measureText(word);
  const cap = box.actualBoundingBoxAscent || fit * 0.72;
  m.fillStyle = color;
  m.textBaseline = "alphabetic";
  m.fillText(word, (w - box.width) / 2, h + cap * Math.max(0, Math.min(0.6, crop)));
};

export class Halftone {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.o = { gap: 6, radius: 90, strength: 2.6, warm: "#D9A441", interactive: true, reduced: false, zone: null, ...opts };
    this.warm = hexToRgb(this.o.warm);
    this.d = new Float32Array(0);
    this.n = 0;
    this.w = 0; this.h = 0; this.dpr = 1;
    this.px = -1e5; this.py = -1e5;
    this.ring = { x: 0, y: 0, t: -1e9 };
    this.disp = 0; this.dispTarget = 0;
    this.drawFn = null;
    this.visible = true; this.raf = 0; this.last = 0; this.acc = 0;
    this.assembleUntil = 0;

    const zone = this.o.zone || canvas;
    this._move = (e) => {
      if (!this.o.interactive || this.o.reduced) return;
      const b = canvas.getBoundingClientRect();
      this.px = e.clientX - b.left;
      this.py = e.clientY - b.top;
      this.wake();
    };
    this._leave = () => { this.px = this.py = -1e5; this.wake(); };
    this._down = (e) => {
      if (!this.o.interactive || this.o.reduced || e.target.closest?.("a,button")) return;
      const b = canvas.getBoundingClientRect();
      this.pulse(e.clientX - b.left, e.clientY - b.top);
    };
    zone.addEventListener("pointermove", this._move);
    zone.addEventListener("pointerleave", this._leave);
    zone.addEventListener("pointerdown", this._down);
    this._zone = zone;

    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver((en) => {
      this.visible = en[0] ? en[0].isIntersecting : true;
      if (this.visible) this.wake();
    });
    this.io.observe(canvas);
    this._loop = (t) => this.loop(t);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this._zone.removeEventListener("pointermove", this._move);
    this._zone.removeEventListener("pointerleave", this._leave);
    this._zone.removeEventListener("pointerdown", this._down);
  }

  layout() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 2 || h < 2) return;
    if (w === this.w && h === this.h && this.n) return;
    this.w = w; this.h = h;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    if (this.drawFn) this.apply(this.sample(), { morph: false, assemble: false });
    this.wake();
  }

  sample() {
    const { w, h } = this;
    const mask = document.createElement("canvas");
    mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    this.drawFn(m, w, h);
    const img = m.getImageData(0, 0, w, h).data;
    const gap = Math.max(3, this.o.gap);
    const cols = Math.ceil(w / gap), rows = Math.ceil(h / gap);
    const out = [];
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        let sa = 0, sr = 0, sg = 0, sb = 0;
        for (let sy = 0; sy < 3; sy++) {
          for (let sx = 0; sx < 3; sx++) {
            const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
            const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
            const i = (y * w + x) * 4, a = img[i + 3];
            if (a) { sa += a; sr += img[i] * a; sg += img[i + 1] * a; sb += img[i + 2] * a; }
          }
        }
        const cov = sa / (9 * 255);
        if (cov < 0.05) continue;
        const r = sr / sa, g = sg / sa, b = sb / sa;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        out.push({
          hx: gx * gap + gap / 2, hy: gy * gap + gap / 2,
          r: Math.sqrt(cov) * gap * 0.56 * (0.38 + 0.62 * Math.pow(lum, 0.7)),
          R: r, G: g, B: b,
        });
      }
    }
    return out.sort((a, b) => a.hx - b.hx || a.hy - b.hy);
  }

  async setSource(drawFn, { morph = false, assemble = false } = {}) {
    this.drawFn = drawFn;
    if (!this.w) this.layout();
    if (!this.w) return;
    this.apply(this.sample(), { morph, assemble: assemble && !this.o.reduced });
    this.wake();
  }

  apply(cells, { morph, assemble }) {
    const old = this.d, oldN = this.n, newN = cells.length;
    const cx = this.w / 2, cy = this.h / 2, maxD = Math.hypot(cx, cy) || 1;
    if (!newN) { this.d = new Float32Array(0); this.n = 0; return; }

    if (morph && oldN && !this.o.reduced) {
      const N = Math.max(oldN, newN);
      const nd = new Float32Array(N * S);
      for (let i = 0; i < N; i++) {
        const oi = Math.floor((i * oldN) / N), ni = Math.floor((i * newN) / N);
        const firstOld = i === 0 || Math.floor(((i - 1) * oldN) / N) !== oi;
        const firstNew = i === 0 || Math.floor(((i - 1) * newN) / N) !== ni;
        const o = oi * S, j = i * S, c = cells[ni];
        for (let s = 0; s < S; s++) nd[j + s] = old[o + s];
        nd[j + R] = firstOld ? old[o + R] : 0;
        nd[j + HX] = c.hx; nd[j + HY] = c.hy;
        nd[j + TR] = firstNew ? c.r : 0;
        nd[j + TCR] = c.R; nd[j + TCG] = c.G; nd[j + TCB] = c.B;
        nd[j + DL] = 0;
      }
      this.d = nd; this.n = N;
      return;
    }

    const d = new Float32Array(newN * S);
    for (let i = 0; i < newN; i++) {
      const c = cells[i], j = i * S;
      d[j + HX] = c.hx; d[j + HY] = c.hy; d[j + TR] = c.r;
      d[j + TCR] = c.R; d[j + TCG] = c.G; d[j + TCB] = c.B;
      d[j + CR] = c.R; d[j + CG] = c.G; d[j + CB] = c.B;
      d[j + K] = 0.35 + Math.random() * 0.65;
      if (assemble) {
        const dx = c.hx - cx, dy = c.hy - cy;
        d[j + X] = c.hx + dx * (0.5 + Math.random() * 1.2) + (Math.random() - 0.5) * 80;
        d[j + Y] = c.hy + dy * (0.5 + Math.random() * 1.2) + (Math.random() - 0.5) * 80 + 60;
        d[j + R] = 0;
        d[j + DL] = (Math.hypot(dx, dy) / maxD) * 700 + Math.random() * 350;
      } else {
        d[j + X] = c.hx; d[j + Y] = c.hy; d[j + R] = c.r;
      }
    }
    this.d = d; this.n = newN;
  }

  setDisperse(v) { this.dispTarget = Math.max(0, Math.min(1, v)); this.wake(); }
  pulse(x, y) { if (this.o.reduced) return; this.ring = { x, y, t: performance.now() }; this.wake(); }
  wake() { this.awake = true; if (!this.raf && this.visible && this.n) { this.last = 0; this.raf = requestAnimationFrame(this._loop); } }

  loop(now) {
    this.raf = 0;
    if (!this.visible) return;
    const dt = this.last ? Math.min(64, now - this.last) : STEP;
    this.last = now;
    this.acc += dt;
    let moving = false;
    while (this.acc >= STEP) { moving = this.step(now, STEP) || moving; this.acc -= STEP; }
    this.render();
    const near = this.px > -1e4 || now - this.ring.t < 1000;
    if (moving || near) this.raf = requestAnimationFrame(this._loop);
  }

  step(now, dt) {
    const d = this.d, o = this.o;
    const cx = this.w / 2, cy = this.h / 2;
    const r = o.interactive && !o.reduced ? o.radius : 0;
    const ringAge = now - this.ring.t, ringR = ringAge * 0.85, ringOn = ringAge < 900;
    this.disp += (this.dispTarget - this.disp) * 0.1;
    if (Math.abs(this.dispTarget - this.disp) < 0.001) this.disp = this.dispTarget;
    const disp = this.disp;
    let moving = Math.abs(this.dispTarget - this.disp) > 0;

    for (let i = 0; i < this.n; i++) {
      const j = i * S;
      if (d[j + DL] > 0) { d[j + DL] -= dt; moving = true; if (d[j + DL] > 0) continue; }
      const k = d[j + K];
      const hx = d[j + HX], hy = d[j + HY];
      const ex = hx + (hx - cx) * k * disp * 1.5;
      const ey = hy + (hy - cy) * k * disp * 1.5 - disp * 90 * k;
      let x = d[j + X], y = d[j + Y], vx = d[j + VX], vy = d[j + VY];

      if (r > 0) {
        const dx = x - this.px, dy = y - this.py, d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          const dist = Math.sqrt(d2) + 0.001, f = (1 - dist / r) * o.strength;
          vx += (dx / dist) * f; vy += (dy / dist) * f;
        }
      }
      if (ringOn) {
        const dx = ex - this.ring.x, dy = ey - this.ring.y, dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const band = 1 - Math.min(1, Math.abs(dist - ringR) / 28);
        if (band > 0) { const f = band * 3 * (1 - ringAge / 900); vx += (dx / dist) * f; vy += (dy / dist) * f; }
      }
      vx = (vx + (ex - x) * 0.05) * 0.84;
      vy = (vy + (ey - y) * 0.05) * 0.84;
      x += vx; y += vy;

      const tr = d[j + TR] * (1 - disp * 0.85);
      d[j + R] += (tr - d[j + R]) * 0.12;
      d[j + CR] += (d[j + TCR] - d[j + CR]) * 0.1;
      d[j + CG] += (d[j + TCG] - d[j + CG]) * 0.1;
      d[j + CB] += (d[j + TCB] - d[j + CB]) * 0.1;

      if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - ex) + Math.abs(y - ey) > 0.05 || Math.abs(d[j + R] - tr) > 0.01 || Math.abs(d[j + CR] - d[j + TCR]) > 0.6) moving = true;
      else { x = ex; y = ey; vx = vy = 0; }
      d[j + X] = x; d[j + Y] = y; d[j + VX] = vx; d[j + VY] = vy;
    }
    return moving;
  }

  render() {
    const { ctx, d, warm } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const cx = this.w / 2, cy = this.h / 2, disp = this.disp;
    let cur = "";
    for (let i = 0; i < this.n; i++) {
      const j = i * S;
      const rad = d[j + R];
      if (rad < 0.15 || d[j + DL] > 0) continue;
      const k = d[j + K], hx = d[j + HX], hy = d[j + HY];
      const ex = hx + (hx - cx) * k * disp * 1.5, ey = hy + (hy - cy) * k * disp * 1.5 - disp * 90 * k;
      const w = Math.min(1, Math.hypot(d[j + X] - ex, d[j + Y] - ey) / 30) * 0.9;
      const r = Math.round(d[j + CR] + (warm[0] - d[j + CR]) * w);
      const g = Math.round(d[j + CG] + (warm[1] - d[j + CG]) * w);
      const b = Math.round(d[j + CB] + (warm[2] - d[j + CB]) * w);
      const col = `rgb(${r},${g},${b})`;
      if (col !== cur) { if (cur) ctx.fill(); ctx.beginPath(); ctx.fillStyle = col; cur = col; }
      ctx.moveTo(d[j + X] + rad, d[j + Y]);
      ctx.arc(d[j + X], d[j + Y], rad, 0, 6.2832);
    }
    if (cur) ctx.fill();
  }
}
