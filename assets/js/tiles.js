// The shared tile renderer: Havana cement tiles printed like silkscreen,
// each ink layer overprinted with `multiply` and slightly off register.

export const INK = {
  paper: '#D6D2C8', red: '#B8322A', indigo: '#22356E',
  ochre: '#E0AE2E', bone: '#F1ECE2', ink: '#1B1A18',
};
// Tile colours are indices into this list.
export const INKS = [INK.red, INK.indigo, INK.ochre, INK.bone, INK.ink];
export const RED = 0, INDIGO = 1, OCHRE = 2, BONE = 3, BLACK = 4;

export const rnd = (n) => Math.floor(Math.random() * n);

// Four motifs. A genome is [background, figure, accent, motif, quarter turns].
export const CORNER = 0, DIAMOND = 1, STAR = 2, FRAME = 3;

export function drawTile(ctx, x, y, s, g, reg = 1.4) {
  const [bg, fg, acc, motif, rot] = g;
  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);
  ctx.rotate(rot * Math.PI / 2);
  ctx.translate(-s / 2, -s / 2);
  ctx.fillStyle = INKS[bg];
  ctx.fillRect(0, 0, s, s);
  ctx.globalCompositeOperation = 'multiply';

  ctx.translate(reg, -reg * 0.6);
  ctx.fillStyle = INKS[fg];
  ctx.beginPath();
  if (motif === CORNER) {
    ctx.moveTo(0, 0); ctx.lineTo(s / 2, 0); ctx.lineTo(0, s / 2);
    ctx.moveTo(s, 0); ctx.lineTo(s, s / 2); ctx.lineTo(s / 2, 0);
    ctx.moveTo(0, s); ctx.lineTo(0, s / 2); ctx.lineTo(s / 2, s);
    ctx.moveTo(s, s); ctx.lineTo(s / 2, s); ctx.lineTo(s, s / 2);
  } else if (motif === DIAMOND) {
    ctx.moveTo(s / 2, s * 0.08); ctx.lineTo(s * 0.92, s / 2);
    ctx.lineTo(s / 2, s * 0.92); ctx.lineTo(s * 0.08, s / 2);
  } else if (motif === STAR) {
    ctx.moveTo(s / 2, 0);
    ctx.quadraticCurveTo(s * 0.7, s * 0.3, s, s / 2);
    ctx.quadraticCurveTo(s * 0.7, s * 0.7, s / 2, s);
    ctx.quadraticCurveTo(s * 0.3, s * 0.7, 0, s / 2);
    ctx.quadraticCurveTo(s * 0.3, s * 0.3, s / 2, 0);
  } else {
    ctx.rect(0, 0, s, s);
    ctx.rect(s * 0.8, s * 0.2, -s * 0.6, s * 0.6);
  }
  ctx.fill('evenodd');

  ctx.translate(-reg * 1.6, reg);
  ctx.fillStyle = INKS[acc];
  ctx.beginPath();
  if (motif === CORNER) ctx.arc(s / 2, s / 2, s * 0.18, 0, 7);
  else if (motif === STAR) ctx.arc(s / 2, s / 2, s * 0.09, 0, 7);
  else {
    ctx.moveTo(s / 2, s * 0.3); ctx.lineTo(s * 0.7, s / 2);
    ctx.lineTo(s / 2, s * 0.7); ctx.lineTo(s * 0.3, s / 2);
  }
  ctx.fill();
  ctx.restore();
}

// Colour of a tile's corners, which is what neighbouring tiles share at a junction.
export const cornerColor = (g) => (g[3] === CORNER || g[3] === FRAME ? g[1] : g[0]);

// A random genome. Black stays rare and never sits on indigo, where overprinting turns to mud.
export function randGene() {
  const bg = rnd(4);
  let fg = rnd(4);
  if (fg === bg) fg = (bg + 1) % 4;
  let acc = Math.random() < 0.15 && bg !== INDIGO && fg !== INDIGO ? BLACK : rnd(4);
  if (acc === fg) acc = (fg + 2) % 4;
  return [bg, fg, acc, rnd(4), rnd(4)];
}

// A deterministic genome from a string, for monograms and project badges. Light grounds and
// no frame motif, so the tile never prints dark.
export function geneFor(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0;
  // FNV's low bits barely move between similar ids; murmur3's finaliser spreads them
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
  const bg = h % 2 ? BONE : OCHRE;
  const figures = bg === BONE ? [RED, INDIGO, OCHRE] : [RED, BONE];
  const fg = figures[(h >>> 3) % figures.length];
  const acc = [RED, INDIGO, OCHRE, BONE].filter((c) => c !== fg)[(h >>> 6) % 3];
  return [bg, fg, acc, [CORNER, DIAMOND, STAR][(h >>> 9) % 3], (h >>> 12) % 4];
}

// Size a canvas for its CSS box at device resolution; drawing happens in `size` logical units.
export function setupCanvas(canvas, size) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * (canvas.dataset.ratio ? +canvas.dataset.ratio : 1) * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Run `frame(t)` on every animation frame until the returned stop function is called.
export function animate(frame) {
  let alive = true;
  const loop = (t) => { if (!alive) return; frame(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return () => { alive = false; };
}
