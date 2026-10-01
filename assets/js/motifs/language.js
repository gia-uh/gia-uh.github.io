// Language: a trigram model, trained in the page on tile "sentences" from a small grammar,
// chats in tiles. A user turn arrives, the model answers token by token, and the five most
// likely next tokens are shown as bars under the conversation. There is no text anywhere.
import { INK, drawTile, rnd, setupCanvas, animate, BONE, BLACK } from '../tiles.js';

export const meta = { id: 'language', line: 'language' };

const SIZE = 480, V = 16, END = 16, MAX_REPLY = 18, TEMPERATURE = 0.8, TICK_MS = 170;
const COLOURS = [0, 1, 2, BLACK];                 // token t = motif (t >> 2) in ink COLOURS[t & 3]
const tokGene = (t) => [BONE, COLOURS[t & 3], BONE, t >> 2, 0];

// The grammar behind the corpus: runs of one motif through the inks, palindromes, repeats.
function phrase() {
  const m = rnd(4), c = rnd(4), kind = rnd(3);
  if (kind === 0) return Array.from({ length: 3 + rnd(2) }, (_, i) => m * 4 + ((c + i) % 4));
  if (kind === 1) { const a = rnd(V), b = rnd(V), d = rnd(V); return [a, b, d, b, a]; }
  const a = rnd(V), b = m * 4 + c;
  return [a, b, a, b];
}
const sentence = () => [].concat(...Array.from({ length: 1 + rnd(3) }, phrase));

function train() {
  const counts = new Map();
  for (let n = 0; n < 900; n++) {
    const s = [END, END, ...sentence(), END];
    for (let i = 2; i < s.length; i++) {
      const key = s[i - 2] * 17 + s[i - 1];
      if (!counts.has(key)) counts.set(key, new Float32Array(17));
      counts.get(key)[s[i]]++;
    }
  }
  return (a, b) => {
    const c = counts.get(a * 17 + b) || new Float32Array(17);
    const p = Array.from(c, (v) => Math.pow(v + 0.02, 1 / TEMPERATURE));
    const z = p.reduce((x, y) => x + y, 0);
    return p.map((v) => v / z);
  };
}

export function start(canvas, { onStat = () => {}, still = false } = {}) {
  const ctx = setupCanvas(canvas, SIZE), W = SIZE, Hc = SIZE;
  const dist = train();
  const ts = W / 15, pad = ts * 0.6, perRow = 10, BAR = ts * 3.2;
  let msgs = [], cur, cand = [], chosen = -1, generated = 0, wait = 0;

  function newTurn() {
    msgs.push({ user: true, toks: sentence().slice(0, 14) });
    cur = { user: false, toks: [] };
    msgs.push(cur);
  }
  function step() {
    const [a, b] = [END, END, ...msgs[msgs.length - 2].toks, ...cur.toks].slice(-2);
    const p = dist(a, b);
    cand = p.map((v, t) => [t, v]).sort((x, y) => y[1] - x[1]).slice(0, 5);
    let r = Math.random(), t = 0;
    for (; t < V; t++) { r -= p[t]; if (r <= 0) break; }
    chosen = t;
    if (t >= END || cur.toks.length >= MAX_REPLY) { wait = 14; return; }
    cur.toks.push(t);
    generated++;
  }
  function layout() {   // bubble boxes, dropping the oldest turns that no longer fit
    const boxes = msgs.map((m) => ({ m, h: Math.max(1, Math.ceil(m.toks.length / perRow)) * ts + pad }));
    let total = boxes.reduce((a, o) => a + o.h + pad * 0.6, 0);
    while (total > Hc - BAR - pad && boxes.length > 2) { total -= boxes[0].h + pad * 0.6; boxes.shift(); msgs.shift(); }
    let y = pad;
    return boxes.map((o) => { const box = { ...o, y }; y += o.h + pad * 0.6; return box; });
  }
  function draw(now) {
    ctx.fillStyle = INK.paper;
    ctx.fillRect(0, 0, W, Hc);
    for (const { m, h, y } of layout()) {
      const bw = Math.min(perRow, Math.max(m.toks.length, 1)) * ts + pad;
      const x = m.user ? W - pad - bw : pad;
      if (m.user) {
        ctx.fillStyle = INK.bone; ctx.fillRect(x, y, bw, h);
        ctx.strokeStyle = INK.ink; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, h);
      } else {
        ctx.fillStyle = INK.red; ctx.fillRect(x - 5, y, 4, h);
      }
      m.toks.forEach((t, i) => drawTile(ctx, x + pad / 2 + (i % perRow) * ts, y + pad / 2 + Math.floor(i / perRow) * ts, ts - 2, tokGene(t), 0.7));
      if (m === cur && !wait && Math.floor(now / 300) % 2) {   // blinking cursor
        const i = m.toks.length;
        ctx.fillStyle = INK.ink;
        ctx.fillRect(x + pad / 2 + (i % perRow) * ts, y + pad / 2 + Math.floor(i / perRow) * ts + ts * 0.78, ts - 4, ts * 0.14);
      }
    }
    // the next-token distribution: five candidates, bar height is probability
    const by = Hc - BAR, barMax = BAR - ts - 16;
    ctx.fillStyle = INK.ink;
    ctx.fillRect(pad, by - 6, W - 2 * pad, 2);
    cand.forEach(([t, p], k) => {
      const x = pad + k * ts * 1.5, bh = barMax * p;
      ctx.fillStyle = INK.ochre;
      ctx.fillRect(x, by + 4 + barMax - bh, ts - 2, bh);
      if (t === END) { ctx.fillStyle = INK.ink; ctx.fillRect(x + ts * 0.3, Hc - ts - 6 + ts * 0.3, ts * 0.4, ts * 0.4); }
      else drawTile(ctx, x, Hc - ts - 6, ts - 2, tokGene(t), 0.7);
      if (t === chosen) { ctx.strokeStyle = INK.ink; ctx.lineWidth = 2.5; ctx.strokeRect(x - 3, Hc - ts - 9, ts + 4, ts + 4); }
    });
    const entropy = -cand.reduce((a, [, p]) => a + p * Math.log2(p), 0);
    onStat([['stat.tokens', generated], ['stat.entropy', entropy.toFixed(2) + ' bits']]);
  }

  newTurn();
  if (still) {
    for (let k = 0; k < 40; k++) { if (wait) { wait = 0; newTurn(); } else step(); }
    draw(0);
    return () => {};
  }
  let last = 0;
  return animate((now) => {
    if (now - last > TICK_MS) {
      last = now;
      if (wait) { if (--wait === 0) newTurn(); } else step();
    }
    draw(now);
  });
}
