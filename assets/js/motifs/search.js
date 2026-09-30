// Search: A* crosses a tile floor between two tiles, around the black ones.
// Frontier tiles print ochre, visited tiles red, and the path is an indigo line in two inks.
import { INK, drawTile, rnd, setupCanvas, animate, RED, OCHRE, BONE, BLACK } from '../tiles.js';

export const meta = { id: 'search', line: 'search' };

const SIZE = 480, WALLS = 0.24;

export function start(canvas, { onStat = () => {}, still = false, n = 16 } = {}) {
  const N = n, ctx = setupCanvas(canvas, SIZE), s = SIZE / N;
  const key = (i, j) => i * N + j;
  const h = (a, b) => Math.abs(((a / N) | 0) - ((b / N) | 0)) + Math.abs((a % N) - (b % N));
  let wall, startK, goal, open, closed, came, gs, path, done;

  function reset() {
    wall = Array.from({ length: N * N }, () => Math.random() < WALLS);
    startK = key(rnd(3), rnd(3));
    goal = key(N - 1 - rnd(3), N - 1 - rnd(3));
    wall[startK] = wall[goal] = false;
    open = new Map([[startK, h(startK, goal)]]);
    closed = new Set(); came = new Map(); gs = new Map([[startK, 0]]); path = []; done = false;
  }
  function step() {
    if (done || !open.size) { done = true; return; }
    let cur = null, bf = Infinity;
    for (const [k, f] of open) if (f < bf) { bf = f; cur = k; }
    open.delete(cur);
    closed.add(cur);
    if (cur === goal) {
      for (let k = goal; k !== undefined; k = came.get(k)) path.unshift(k);
      done = true;
      return;
    }
    const i = (cur / N) | 0, j = cur % N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= N || b >= N) continue;
      const nk = key(a, b);
      if (wall[nk] || closed.has(nk)) continue;
      const g = gs.get(cur) + 1;
      if (g < (gs.get(nk) ?? Infinity)) { gs.set(nk, g); came.set(nk, cur); open.set(nk, g + h(nk, goal)); }
    }
  }
  const center = (k) => [(k % N) * s + s / 2, ((k / N) | 0) * s + s / 2];
  function draw() {
    ctx.fillStyle = INK.paper;
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let k = 0; k < N * N; k++) {
      const x = (k % N) * s, y = ((k / N) | 0) * s;
      if (wall[k]) { ctx.fillStyle = INK.ink; ctx.fillRect(x + 1, y + 1, s - 2, s - 2); continue; }
      const fg = closed.has(k) ? RED : open.has(k) ? OCHRE : BONE;
      drawTile(ctx, x + 1, y + 1, s - 2, [BONE, fg, BLACK, k % 4, (k * 7) % 4], 0.8);
    }
    if (path.length > 1) {
      ctx.save();
      ctx.lineCap = ctx.lineJoin = 'round';
      const line = () => { ctx.beginPath(); path.forEach((k, i) => { const [x, y] = center(k); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
      ctx.strokeStyle = INK.bone; ctx.lineWidth = s * 0.5; line();   // a bone underlay keeps the path legible over red tiles
      ctx.globalCompositeOperation = 'multiply';
      ctx.lineWidth = s * 0.32;
      for (const [dx, dy, col] of [[0, 0, INK.indigo], [2, -1.5, INK.red]]) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        path.forEach((k, i) => { const [x, y] = center(k); i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy); });
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const [k, col] of [[startK, INK.indigo], [goal, INK.red]]) {
      const [x, y] = center(k);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s * 0.33, 0, 7); ctx.fill();
    }
    onStat([['stat.visited', closed.size], ['stat.path', path.length || '…']]);
  }

  reset();
  if (still) {
    // show a finished search; a floor with no way through gets rebuilt
    for (let tries = 0; tries < 20; tries++) { while (!done) step(); if (path.length) break; reset(); }
    draw();
    return () => {};
  }
  let waitUntil = 0;
  return animate((t) => {
    if (done) {
      if (!waitUntil) waitUntil = t + 1600;
      else if (t > waitUntil) { waitUntil = 0; reset(); }
    } else { step(); step(); }
    draw();
  });
}
