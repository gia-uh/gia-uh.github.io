import { boot, load, onLang, t } from './core.js';
import { projectCard, projectRow, drawBadges } from './project-card.js';

await boot();
const projects = await load('projects');
const GROUPS = ['library', 'tool', 'research', 'task'];

function render() {
  const featured = document.getElementById('featured');
  const order = (p) => p.home ?? 99;
  featured.innerHTML = projects.filter((p) => p.featured).sort((a, b) => order(a) - order(b)).map(projectCard).join('');
  drawBadges(featured);
  document.getElementById('groups').innerHTML = GROUPS.map((g) => {
    const rows = projects.filter((p) => !p.featured && p.group === g);
    if (!rows.length) return '';
    const text = g === 'tool' || g === 'research' ? `<p class="group-text">${t(`group.${g}.text`)}</p>` : '';
    return `<section class="section"><div class="section-head"><h2>${t(`group.${g}`)}</h2></div>${text}<ul class="others">${rows.map(projectRow).join('')}</ul></section>`;
  }).join('');
}
render();
onLang(render);
