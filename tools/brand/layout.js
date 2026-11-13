// Lays out one GIA logo variant into <svg id="s"> and sets document.title = "ready".
// build.py loads this page in headless Chromium with window.MODE = {layout, P, bg, grp, uni}
// and reads back the SVG. All sizes derive from the tile side T.
//
// Layouts: horizontal (tile + GiA, texts below), wordmark (GiA, texts below),
// side (tile, GiA and texts beside it within the tile height),
// vertical (tile over a GiA tile, group text vertical on the left), icon (tile alone).
const M = window.MODE, P = M.P, ns = 'http://www.w3.org/2000/svg', svg = document.getElementById('s');
const GROUP = 'Grupo de Inteligencia Artificial y Ciencia de Datos';
const G1 = 'Grupo de Inteligencia Artificial', G2 = 'y Ciencia de Datos', UNI = 'Universidad de La Habana';

const T = 300;               // tile side
const STEM = 0.14;           // width of the i stem, as a fraction of the GiA font size; also the dot diameter
const LETTER_GAP = 0.045;    // gap between G, i and A, fraction of font size
const I_TOP = 1.3;           // the stem starts this many stem widths below the cap line (dot + gap)
const WORD_GAP = 0.11;       // tile to GiA, fraction of T
const TEXT_GAP = 0.07;       // GiA to the group line, fraction of T
const UNI_SCALE = 0.8;       // university line size relative to the group line
const PAD = 0.08;            // margin around variants with a background, fraction of T

const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const cv = document.createElement('canvas').getContext('2d');
// Chromium rounds canvas text metrics to whole pixels, so measure at 1000px and scale down
const met = (t, font) => {
  const [w, size, fam] = font.split(' '), px = parseFloat(size), k = px / 1000;
  cv.font = `${w} 1000px ${fam}`; const m = cv.measureText(t), out = {};
  for (const key of ['width', 'actualBoundingBoxLeft', 'actualBoundingBoxRight', 'actualBoundingBoxAscent', 'actualBoundingBoxDescent']) out[key] = m[key] * k;
  return out;
};
const text = (str, x, y, fam, w, size, fill) => { const e = el('text', { x, y, 'font-family': fam, 'font-weight': w, 'font-size': size, fill }); e.textContent = str; return e; };
// font size at which `str` measures exactly `width` from its first to its last ink pixel
const fitInk = (str, weight, width) => { const m = met(str, `${weight} 40px AR`); return width * 40 / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight); };

// G and A bounds come from the font outlines (build.py), in ems: canvas bounds are off by about 1%
const GL = M.glyphs, gm = (ch, fs) => { const g = GL[ch]; return { width: g.width * fs, actualBoundingBoxLeft: g.left * fs, actualBoundingBoxRight: g.right * fs, actualBoundingBoxAscent: g.ascent * fs, actualBoundingBoxDescent: g.descent * fs }; };
// GiA font size whose G spans exactly `h` from top to bottom ink
const giaSize = (h) => h / (GL.G.ascent + GL.G.descent);
let DOT;  // tile circle diameter as a fraction of T: equal to the i dot when GiA is as tall as the tile

const tile = (x, y, S) => {
  const g = el('g', { transform: `translate(${x},${y}) scale(${S / 64})` });
  g.innerHTML = `<rect width="64" height="64" fill="${P.sq}"/><path d="M32 0L64 32L32 64L0 32Z" fill="${P.r1}"/><path d="M32 14L50 32L32 50L14 32Z" fill="${P.r2}"/>`;
  el('circle', { cx: x + S / 2, cy: y + S / 2, r: S * DOT / 2, fill: P.dot });
};

// draws GiA with its G spanning [y, y+h]; returns {left, right} ink edges
const gia = (x, y, h) => {
  const fs = giaSize(h), mG = gm('G', fs), mA = gm('A', fs);
  const base = y + mG.actualBoundingBoxAscent, cap = mA.actualBoundingBoxAscent, sw = fs * STEM, gap = fs * LETTER_GAP;
  text('G', x, base, 'BS', 900, fs, P.ink);
  let cx = x + mG.width + gap;
  el('circle', { cx: cx + sw / 2, cy: base - cap + sw / 2, r: sw / 2, fill: P.idot || P.dot });
  el('rect', { x: cx, y: base - cap + sw * I_TOP, width: sw, height: cap - sw * I_TOP, fill: P.ink });
  cx += sw + gap;
  text('A', cx, base, 'BS', 900, fs, P.ink);
  return { left: x - mG.actualBoundingBoxLeft, right: cx + mA.actualBoundingBoxRight, width: cx + mA.width - x };
};

// group line from ink edge L to ink edge R, university right-aligned to R; returns the new bottom
const textsBelow = (L, R, top) => {
  let y = top; if (!M.grp) return y;
  const f = fitInk(GROUP, 700, R - L), m = met(GROUP, `700 ${f}px AR`);
  y += T * TEXT_GAP + m.actualBoundingBoxAscent; text(GROUP, L + m.actualBoundingBoxLeft, y, 'AR', 700, f, P.grp); y += m.actualBoundingBoxDescent;
  if (M.uni) { const fu = f * UNI_SCALE, mu = met(UNI, `400 ${fu}px AR`); y += f * 0.35 + mu.actualBoundingBoxAscent; text(UNI, R - mu.actualBoundingBoxRight, y, 'AR', 400, fu, P.uni); y += mu.actualBoundingBoxDescent; }
  return y;
};

const layouts = {
  horizontal() { tile(0, 0, T); const g = gia(T * (1 + WORD_GAP), 0, T); return { x0: 0, W: g.right, H: textsBelow(0, g.right, T) }; },
  wordmark() { const g = gia(0, 0, T); return { x0: g.left, W: g.right, H: textsBelow(g.left, g.right, T) }; },
  icon() { tile(0, 0, T); return { x0: 0, W: T, H: T }; },
  side() { // GiA and the texts beside the tile, within its height
    tile(0, 0, T); const x = T * (1 + WORD_GAP), gh = T * 0.5, g = gia(x, 0, gh);
    const f = (T - gh - T * 0.09) / (3 * 1.12); let y = gh + T * 0.09 + f;
    text(G1, x, y, 'AR', 700, f, P.grp); y += f * 1.12; text(G2, x, y, 'AR', 700, f, P.grp);
    const fu = f * UNI_SCALE; text(UNI, x, T - met(UNI, `400 ${fu}px AR`).actualBoundingBoxDescent, 'AR', 400, fu, P.uni);
    return { x0: 0, W: x + Math.max(g.width, met(G1, `700 ${f}px AR`).width, met(UNI, `400 ${fu}px AR`).width), H: T };
  },
  vertical() { // the tile over a second tile holding GiA, grout between them, group text vertical on the left
    const grout = T * 0.02, line = T * 0.035, corner = T * 0.135, y2 = T + grout, Ht = y2 + T;
    const box = el('g', {});
    const put = (tag, a) => el(tag, a, box);
    const g0 = svg; // draw tile and GiA, then move them into the shifted group
    tile(0, 0, T);
    put('rect', { x: 0, y: y2, width: T, height: T, fill: P.r1 });
    const unit = (() => { const fs = giaSize(100); return (gm('G', fs).width + gm('A', fs).width + fs * (STEM + 2 * LETTER_GAP)) / 100; })();
    const h = T * 0.78 / unit, w = h * unit; gia((T - w) / 2, y2 + (T - h) / 2, h);
    put('rect', { x: line / 2, y: y2 + line / 2, width: T - line, height: T - line, fill: 'none', stroke: P.ink, 'stroke-width': line });
    for (const [a, b] of [[line, y2 + line], [T - line - corner, y2 + line], [line, y2 + T - line - corner], [T - line - corner, y2 + T - line - corner]])
      put('rect', { x: a, y: b, width: corner, height: corner, fill: P.r2 });
    const f = fitInk(GROUP, 700, Ht), m = met(GROUP, `700 ${f}px AR`);
    const ox = M.grp ? m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + T * 0.045 : 0;
    const wrap = el('g', { transform: `translate(${ox},0)` });
    [...g0.childNodes].filter(n => n !== wrap).forEach(n => wrap.appendChild(n));
    let H = Ht;
    if (M.grp) { const e = text(GROUP, m.actualBoundingBoxLeft, 0, 'AR', 700, f, P.grp); e.setAttribute('transform', `translate(${m.actualBoundingBoxAscent},${Ht}) rotate(-90)`); }
    if (M.uni) { // university line across the lower tile
      const fu = fitInk(UNI, 400, T), mu = met(UNI, `400 ${fu}px AR`), yb = Ht + T * 0.06 + mu.actualBoundingBoxAscent;
      text(UNI, ox + mu.actualBoundingBoxLeft, yb, 'AR', 400, fu, P.uni); H = yb + mu.actualBoundingBoxDescent;
    }
    return { x0: 0, W: ox + T, H };
  },
};

Promise.all(['900 100px BS', '700 100px AR', '400 100px AR'].map(f => document.fonts.load(f))).then(() => {
  DOT = STEM / (GL.G.ascent + GL.G.descent);
  const { x0, W, H } = layouts[M.layout]();
  const pad = M.bg ? T * PAD : 0, vb = [x0 - pad, -pad, W - x0 + 2 * pad, H + 2 * pad];
  svg.setAttribute('viewBox', vb.join(' '));
  if (M.bg) { const r = document.createElementNS(ns, 'rect'); ['x', 'y', 'width', 'height'].forEach((k, i) => r.setAttribute(k, vb[i])); r.setAttribute('fill', M.bg); svg.insertBefore(r, svg.firstChild); }
  document.title = 'ready';
});
