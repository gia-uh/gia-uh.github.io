import { t, L, esc } from './core.js';
import { drawTile, setupCanvas, geneFor } from './tiles.js';

function links(p) {
  const out = [];
  if (p.url) out.push(`<a href="${esc(p.url)}">${t('projects.site')}</a>`);
  if (p.repo) out.push(`<a href="https://github.com/${esc(p.repo)}">${t('projects.code')}</a>`);
  return out.join('');
}

export const projectCard = (p) => `
  <article class="project">
    <canvas class="badge" data-id="${esc(p.id)}" aria-hidden="true"></canvas>
    <h3>${esc(p.name)}</h3>
    <p class="tagline">${esc(L(p.tagline))}</p>
    <p class="desc">${esc(L(p.description))}</p>
    <p class="links">${links(p)}</p>
  </article>`;

export const projectRow = (p) => `
  <li>
    <h3>${esc(p.name)}</h3>
    <p class="tagline">${esc(L(p.tagline))}</p>
    <p class="desc">${esc(L(p.description))}</p>
    <p class="links">${links(p)}</p>
  </li>`;

export function drawBadges(root) {
  // each project wears a tile seeded by its name
  root.querySelectorAll('canvas.badge').forEach((c) => drawTile(setupCanvas(c, 64), 0, 0, 64, geneFor(c.dataset.id), 1.2));
}
