// The home hero: one of four AI motifs runs on the canvas, a random one first, and every
// ROTATE_MS the hero moves on to the next. With reduced motion it shows one still frame.
import * as evolution from './motifs/evolution.js';
import * as search from './motifs/search.js';
import * as learning from './motifs/learning.js';
import * as language from './motifs/language.js';
import { t, esc, onLang } from './core.js';
import { drawTile, setupCanvas } from './tiles.js';

const MOTIFS = [evolution, search, learning, language];
const ROTATE_MS = 30000, FADE_MS = 350;
// the tile that stands for each motif in the picker
const MOTIF_TILE = { evolution: [3, 0, 1, 0, 0], search: [3, 2, 4, 1, 0], learning: [3, 1, 0, 3, 0], language: [3, 4, 2, 2, 0] };

export function hero(root) {
  const canvas = root.querySelector('canvas');
  const name = root.querySelector('.motif-name'), how = root.querySelector('.motif-how'), stat = root.querySelector('.motif-stat');
  const picker = root.querySelector('.motif-picker');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = Math.floor(Math.random() * MOTIFS.length), stop = () => {}, timer = null, lastStat = [], seq = 0;

  picker.innerHTML = MOTIFS.map((m, i) => `<button type="button" data-i="${i}"><canvas aria-hidden="true"></canvas></button>`).join('');
  picker.querySelectorAll('canvas').forEach((c, i) => drawTile(setupCanvas(c, 28), 0, 0, 28, MOTIF_TILE[MOTIFS[i].meta.id], 0.8));
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { show(+b.dataset.i); schedule(); }
  });

  const renderStat = (entries) => {
    lastStat = entries;
    stat.innerHTML = entries.map(([k, v]) => `<span>${esc(t(k))}${v === undefined ? '' : ` <b>${esc(v)}</b>`}</span>`).join('');
  };
  function labels() {
    const id = MOTIFS[index].meta.id;
    name.textContent = t(`motif.${id}`);
    how.textContent = t(`motif.${id}.how`);
    picker.querySelectorAll('button').forEach((b, i) => {
      b.setAttribute('aria-label', `${t('motif.next')}: ${t(`motif.${MOTIFS[i].meta.id}`)}`);
      b.setAttribute('aria-pressed', String(i === index));
    });
    renderStat(lastStat);
  }
  function show(i) {
    stop();
    index = i;
    canvas.classList.add('fading');
    const mine = ++seq;   // a second click during the fade must not start two motifs on one canvas
    setTimeout(() => {
      if (mine !== seq) return;
      stop = MOTIFS[index].start(canvas, { onStat: renderStat, still: reduced });
      canvas.classList.remove('fading');
    }, FADE_MS);
    labels();
    document.dispatchEvent(new CustomEvent('motif', { detail: MOTIFS[index].meta }));
  }
  function schedule() {
    if (reduced) return;
    clearInterval(timer);
    timer = setInterval(() => show((index + 1) % MOTIFS.length), ROTATE_MS);
  }
  onLang(labels);
  show(index);
  schedule();
}
