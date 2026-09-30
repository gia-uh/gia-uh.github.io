// Learning: a 2-16-16-1 perceptron (tanh, sigmoid output, Adam) learns to separate two classes.
// Each tile takes the class the network predicts at its centre; doubtful tiles become the ochre
// seam of the boundary. When it converges the problem changes and the same weights refit it.
import { INK, drawTile, rnd, setupCanvas, animate, RED, INDIGO, OCHRE, BONE } from '../tiles.js';

export const meta = { id: 'learning', line: 'learning' };

const SIZE = 480, H = 16, T = 18, LR = 0.02, SCALE = 2.5, STEPS_PER_FRAME = 3;
const CONVERGED = 0.06, HOLD_FRAMES = 90, GIVE_UP = 2400;

const jit = () => (Math.random() - 0.5) * 0.06, U = () => Math.random() * 1.8 - 0.9;
const SHAPES = {
  spirals: () => {
    const d = [];
    for (let c = 0; c < 2; c++) for (let n = 0; n < 110; n++) {
      const r = (n / 110) * 0.9, t = 1.75 * (n / 110) * 2 * Math.PI + c * Math.PI;
      d.push([r * Math.sin(t) + jit(), r * Math.cos(t) + jit(), c]);
    }
    return d;
  },
  circles: () => Array.from({ length: 220 }, (_, k) => {
    const c = k % 2, r = c ? 0.1 + Math.random() * 0.3 : 0.6 + Math.random() * 0.25, t = Math.random() * 7;
    return [r * Math.cos(t), r * Math.sin(t), c];
  }),
  xor: () => Array.from({ length: 220 }, () => { const x = U(), y = U(); return [x, y, +((x > 0) !== (y > 0))]; }),
  moons: () => Array.from({ length: 220 }, (_, k) => {
    const c = k % 2, t = Math.random() * Math.PI;
    return c ? [0.55 * Math.cos(t) - 0.25 + jit(), 0.55 * Math.sin(t) - 0.15 + jit(), 1]
             : [0.3 - 0.55 * Math.cos(t) + jit(), 0.15 - 0.55 * Math.sin(t) + jit(), 0];
  }),
  checkerboard: () => Array.from({ length: 240 }, () => {
    const x = U(), y = U();
    return [x, y, (Math.floor((x + 0.9) / 0.6) + Math.floor((y + 0.9) / 0.6)) % 2];
  }),
  blobs: () => {
    const cs = Array.from({ length: 4 }, (_, k) => [Math.random() * 1.2 - 0.6, Math.random() * 1.2 - 0.6, k % 2]);
    return Array.from({ length: 220 }, (_, k) => {
      const [cx, cy, c] = cs[k % 4];
      return [cx + (Math.random() - 0.5) * 0.35, cy + (Math.random() - 0.5) * 0.35, c];
    });
  },
};
const NAMES = Object.keys(SHAPES);

const init = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => (Math.random() * 2 - 1) * Math.sqrt(1 / c)));

export function start(canvas, { onStat = () => {}, still = false } = {}) {
  const ctx = setupCanvas(canvas, SIZE), ts = SIZE / T;
  let shape = NAMES[rnd(NAMES.length)], data = SHAPES[shape](), onShape = 0;
  const W1 = init(H, 2), b1 = new Array(H).fill(0), W2 = init(H, H), b2 = new Array(H).fill(0), W3 = init(1, H)[0], b3 = [0];
  const adam = new Map();
  let t = 0, epoch = 0, loss = 1, hold = 0;

  function nextShape() {
    let n;
    do n = NAMES[rnd(NAMES.length)]; while (n === shape);
    shape = n; data = SHAPES[n](); onShape = 0; loss = 1;
  }
  function forward(x, y) {
    x *= SCALE; y *= SCALE;   // spread the inputs so the tanh units can bend
    const h1 = b1.map((b, i) => Math.tanh(W1[i][0] * x + W1[i][1] * y + b));
    const h2 = b2.map((b, i) => Math.tanh(W2[i].reduce((s, w, j) => s + w * h1[j], b)));
    const z = W3.reduce((s, w, j) => s + w * h2[j], b3[0]);
    return { h1, h2, p: 1 / (1 + Math.exp(-z)) };
  }
  function adamStep(name, arr, grad) {
    let st = adam.get(name);
    if (!st) { st = { m: grad.map(() => 0), v: grad.map(() => 0) }; adam.set(name, st); }
    for (let k = 0; k < grad.length; k++) {
      st.m[k] = 0.9 * st.m[k] + 0.1 * grad[k];
      st.v[k] = 0.999 * st.v[k] + 0.001 * grad[k] ** 2;
      arr[k] -= LR * (st.m[k] / (1 - 0.9 ** t)) / (Math.sqrt(st.v[k] / (1 - 0.999 ** t)) + 1e-8);
    }
  }
  function trainStep() {
    t++; epoch++; onShape++;
    const gW1 = W1.map((r) => r.map(() => 0)), gb1 = b1.map(() => 0);
    const gW2 = W2.map((r) => r.map(() => 0)), gb2 = b2.map(() => 0), gW3 = W3.map(() => 0);
    let gb3 = 0, total = 0;
    for (const [x, y, c] of data) {
      const { h1, h2, p } = forward(x, y);
      total -= c ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9);
      const dz = p - c;
      gb3 += dz;
      const d2 = h2.map((h, i) => { gW3[i] += dz * h; return dz * W3[i] * (1 - h * h); });
      const d1 = h1.map((h, j) => d2.reduce((s, d, i) => s + d * W2[i][j], 0) * (1 - h * h));
      d2.forEach((d, i) => { gb2[i] += d; h1.forEach((h, j) => { gW2[i][j] += d * h; }); });
      d1.forEach((d, i) => { gb1[i] += d; gW1[i][0] += d * x * SCALE; gW1[i][1] += d * y * SCALE; });
    }
    const n = data.length, mean = (a) => a.map((v) => v / n);
    W1.forEach((r, i) => adamStep('W1' + i, r, mean(gW1[i])));
    adamStep('b1', b1, mean(gb1));
    W2.forEach((r, i) => adamStep('W2' + i, r, mean(gW2[i])));
    adamStep('b2', b2, mean(gb2));
    adamStep('W3', W3, mean(gW3));
    adamStep('b3', b3, [gb3 / n]);
    return total / n;
  }
  const toPx = (v) => ((v + 1) / 2) * SIZE;
  function draw() {
    ctx.fillStyle = INK.paper;
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
      const p = forward(((j + 0.5) / T) * 2 - 1, ((i + 0.5) / T) * 2 - 1).p, m = Math.abs(p - 0.5) * 2;
      const cls = p > 0.5 ? RED : INDIGO;
      const g = m > 0.75 ? [BONE, cls, cls === RED ? INDIGO : RED, 3, 0]
              : m > 0.35 ? [BONE, cls, OCHRE, 2, (i + j) % 4]
              : [OCHRE, BONE, cls, 1, 0];
      drawTile(ctx, j * ts + 0.5, i * ts + 0.5, ts - 1, g, 0.7);
    }
    ctx.lineWidth = 1.2;
    for (const [x, y, c] of data) {
      ctx.fillStyle = c ? INK.bone : INK.ink;
      ctx.strokeStyle = c ? INK.ink : INK.bone;
      ctx.beginPath(); ctx.arc(toPx(x), toPx(y), 3.2, 0, 7); ctx.fill(); ctx.stroke();
    }
    onStat([['shape.' + shape], ['stat.epoch', epoch], ['stat.loss', loss.toFixed(3)]]);
  }

  if (still) {
    for (let k = 0; k < 1500 && loss >= 0.1; k++) loss = trainStep();
    draw();
    return () => {};
  }
  return animate(() => {
    if (loss < CONVERGED) {
      if (++hold > HOLD_FRAMES) { hold = 0; nextShape(); }   // converged: hold it, then a new problem
    } else {
      if (onShape > GIVE_UP) nextShape();                      // stuck in a local minimum: move on
      for (let k = 0; k < STEPS_PER_FRAME; k++) loss = trainStep();
    }
    draw();
  });
}
