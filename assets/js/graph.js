// The co-authorship graph on /people/: members are tiles, sized by their number of works;
// an edge joins two members who share a paper or co-supervised a thesis.
import { INK, drawTile, setupCanvas } from './tiles.js';

const W = 1000, H = 560, ITERATIONS = 500;
export const CATEGORY_TILE = {
  senior: [3, 4, 2, 3, 0], researcher: [3, 0, 1, 0, 0], phd: [3, 1, 2, 1, 0], master: [3, 2, 0, 2, 0],
};

function build(people, papers) {
  const nodes = people.filter((p) => CATEGORY_TILE[p.category]).map((p) => ({ p, works: 0, x: 0, y: 0, vx: 0, vy: 0 }));
  const index = new Map(nodes.map((n, i) => [n.p.id, i]));
  const weights = new Map();
  for (const paper of papers) {
    const group = [...new Set([...paper.members, ...(paper.supervisors || [])])].filter((id) => index.has(id)).map((id) => index.get(id));
    group.forEach((i) => nodes[i].works++);
    for (let a = 0; a < group.length; a++) for (let b = a + 1; b < group.length; b++) {
      const key = Math.min(group[a], group[b]) * 1000 + Math.max(group[a], group[b]);
      weights.set(key, (weights.get(key) || 0) + 1);
    }
  }
  const keep = nodes.map((n, i) => (n.works ? i : -1)).filter((i) => i >= 0), remap = new Map(keep.map((old, i) => [old, i]));
  const edges = [...weights].map(([key, w]) => ({ a: remap.get(Math.floor(key / 1000)), b: remap.get(key % 1000), w }));
  return { nodes: keep.map((i) => nodes[i]), edges };
}

// Fruchterman–Reingold: repulsion k²/d between all pairs, attraction d²/k along edges
// (stronger for heavier edges), a pull towards the centre, and a cooling step limit.
// The result is then scaled to fill the canvas.
function layout(nodes, edges) {
  const k = Math.sqrt((W * H) / nodes.length) * 0.75;
  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * W * 0.25; n.y = H / 2 + Math.sin(a) * H * 0.25;
  });
  for (let it = 0; it < ITERATIONS; it++) {
    const temp = (W / 12) * (1 - it / ITERATIONS) + 0.5;
    for (const n of nodes) { n.vx = 0; n.vy = 0; }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.max(Math.hypot(dx, dy), 1);
      const f = (k * k) / d / d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
    for (const { a, b, w } of edges) {
      const na = nodes[a], nb = nodes[b], dx = na.x - nb.x, dy = na.y - nb.y, d = Math.max(Math.hypot(dx, dy), 1);
      const f = (d / k) * (0.6 + 0.4 * Math.log1p(w));
      na.vx -= dx * f; na.vy -= dy * f; nb.vx += dx * f; nb.vy += dy * f;
    }
    for (const n of nodes) {
      const dx = W / 2 - n.x, dy = H / 2 - n.y, d = Math.hypot(dx, dy) || 1;
      n.vx += (dx / d) * d * d / k * 0.08; n.vy += (dy / d) * d * d / k * 0.08;
      const v = Math.hypot(n.vx, n.vy) || 1, step = Math.min(v, temp);
      n.x += (n.vx / v) * step; n.y += (n.vy / v) * step;
    }
  }
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y), M = 60;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sx = (W - 2 * M) / Math.max(x1 - x0, 1), sy = (H - 2 * M) / Math.max(y1 - y0, 1);
  for (const n of nodes) { n.x = M + (n.x - x0) * sx; n.y = M + (n.y - y0) * sy; }
}

const shortName = (name) => { const w = name.split(' '); return w.length >= 3 ? `${w[0]} ${w[w.length - 2]}` : name; };

export function coauthorGraph(canvas, tip, people, papers, { worksLabel, onPick }) {
  canvas.dataset.ratio = String(H / W);
  const ctx = setupCanvas(canvas, W);
  const { nodes, edges } = build(people, papers);
  layout(nodes, edges);
  const size = (n) => Math.min(58, 20 + 6 * Math.sqrt(n.works));
  const maxW = Math.max(...edges.map((e) => e.w), 1);
  let hover = -1;

  function draw() {
    ctx.fillStyle = INK.paper;
    ctx.fillRect(0, 0, W, H);
    const near = new Set(hover < 0 ? [] : [hover, ...edges.filter((e) => e.a === hover || e.b === hover).map((e) => (e.a === hover ? e.b : e.a))]);
    const lit = (i) => hover < 0 || near.has(i);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const e of edges) {
      const on = hover < 0 || e.a === hover || e.b === hover;
      ctx.strokeStyle = on && hover >= 0 ? INK.red : INK.ink;
      ctx.globalAlpha = on ? 0.25 + 0.6 * (e.w / maxW) : 0.07;
      ctx.lineWidth = 1 + 3 * Math.sqrt(e.w / maxW);
      ctx.beginPath(); ctx.moveTo(nodes[e.a].x, nodes[e.a].y); ctx.lineTo(nodes[e.b].x, nodes[e.b].y); ctx.stroke();
    }
    ctx.restore();
    nodes.forEach((n, i) => {
      const s = size(n);
      ctx.globalAlpha = lit(i) ? 1 : 0.3;
      drawTile(ctx, n.x - s / 2, n.y - s / 2, s, CATEGORY_TILE[n.p.category], s / 30);
      if (i === hover) { ctx.strokeStyle = INK.ink; ctx.lineWidth = 3; ctx.strokeRect(n.x - s / 2 - 4, n.y - s / 2 - 4, s + 8, s + 8); }
      ctx.fillStyle = INK.ink;
      ctx.font = '600 13px Archivo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shortName(n.p.name), n.x, n.y + s / 2 + 16);
    });
    ctx.globalAlpha = 1;
  }

  const at = (ev) => {
    const r = canvas.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * W, y = ((ev.clientY - r.top) / r.height) * H;
    let best = -1, bd = Infinity;
    nodes.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < size(n) / 2 + 10 && d < bd) { bd = d; best = i; } });
    return { i: best, r };
  };
  canvas.addEventListener('pointermove', (ev) => {
    const { i, r } = at(ev);
    if (i !== hover) { hover = i; draw(); }
    canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
    if (i >= 0) {
      const n = nodes[i];
      tip.hidden = false;
      tip.textContent = `${n.p.name}, ${n.works} ${worksLabel()}`;
      tip.style.left = `${(n.x / W) * r.width}px`;
      tip.style.top = `${((n.y - size(n) / 2) / H) * r.height}px`;
    } else tip.hidden = true;
  });
  canvas.addEventListener('pointerleave', () => { hover = -1; tip.hidden = true; draw(); });
  canvas.addEventListener('click', (ev) => { const { i } = at(ev); if (i >= 0) onPick(nodes[i].p); });
  draw();
  return { redraw: draw, nodes };
}
