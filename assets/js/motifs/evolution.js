// Evolution: a genetic algorithm breeds tile floors. Fitness rewards four-tile junctions whose
// corners share a colour (they form rosettes) and floors that are mirror-symmetric.
import { INK, drawTile, randGene, cornerColor, rnd, setupCanvas, animate } from '../tiles.js';

export const meta = { id: 'evolution', line: 'search' };

const SIZE = 480, N = 6, POP = 48, MUTATION = 0.03;

function fitness(f) {
  let score = 0, max = 0;
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
    const cs = [f[i * N + j], f[i * N + j + 1], f[(i + 1) * N + j], f[(i + 1) * N + j + 1]].map(cornerColor);
    score += cs.filter((c) => c === cs[0]).length - 1;
    max += 3;
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const a = f[i * N + j], b = f[i * N + (N - 1 - j)], c = f[(N - 1 - i) * N + j];
    score += (a[3] === b[3] && a[0] === b[0]) + (a[3] === c[3] && a[1] === c[1]);
    max += 2;
  }
  const inks = new Set(f.map((g) => g[0])).size;   // a floor needs at least three inks
  return (score / max) * (inks >= 3 ? 1 : 0.6);
}

export function start(canvas, { onStat = () => {}, still = false } = {}) {
  const ctx = setupCanvas(canvas, SIZE), s = SIZE / N;
  let pop, gen, best, restartAt = 0;
  const reset = () => { pop = Array.from({ length: POP }, () => Array.from({ length: N * N }, randGene)); gen = 0; restartAt = 0; };
  const pick = (scored) => { const a = scored[rnd(POP)], b = scored[rnd(POP)]; return a.fit > b.fit ? a.f : b.f; };

  function step() {
    const scored = pop.map((f) => ({ f, fit: fitness(f) })).sort((a, b) => b.fit - a.fit);
    best = scored[0];
    const next = [scored[0].f, scored[1].f];
    while (next.length < POP) {
      const a = pick(scored), b = pick(scored);
      next.push(a.map((g, k) => (Math.random() < MUTATION ? randGene() : (Math.random() < 0.5 ? g : b[k])).slice()));
    }
    pop = next;
    gen++;
  }
  function draw() {
    ctx.fillStyle = INK.paper;
    ctx.fillRect(0, 0, SIZE, SIZE);
    best.f.forEach((g, k) => drawTile(ctx, (k % N) * s + 1, Math.floor(k / N) * s + 1, s - 2, g, s / 40));
    onStat([['stat.generation', gen], ['stat.fitness', best.fit.toFixed(2)]]);
  }

  reset();
  if (still) { for (let k = 0; k < 120; k++) step(); draw(); return () => {}; }
  let last = 0;
  return animate((t) => {
    if (t - last < 140) return;
    last = t;
    if (restartAt) { if (t > restartAt) reset(); else return; }
    step();
    draw();
    if (best.fit > 0.97 || gen > 260) restartAt = t + 1800;   // admire the floor, then breed a new one
  });
}
