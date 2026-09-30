import { boot, load, t, esc, onLang, paperItem } from './core.js';
import { hero } from './hero.js';
import { projectCard, drawBadges } from './project-card.js';

await boot();
const [people, papers, projects] = await Promise.all([load('people'), load('papers'), load('projects')]);
const byId = Object.fromEntries(people.map((p) => [p.id, p]));

document.addEventListener('motif', (e) => {
  document.querySelectorAll('.line').forEach((el) => el.classList.toggle('active', el.dataset.line === e.detail.line));
});
hero(document.querySelector('.stage'));

function render() {
  const head = people.find((p) => p.head);
  const others = people.filter((p) => p.category === 'researcher' && !p.head);
  const n = (cat) => people.filter((p) => p.category === cat).length;
  document.getElementById('credits').innerHTML =
    `<b>${t('home.credits.head')}</b> ${esc(head.name)}, <b>${t('home.credits.with')}</b> ${others.map((p) => esc(p.name)).join(', ')} ` +
    `<b>${t('home.credits.and')}</b> ${t('home.credits.rest', { phd: n('phd'), master: n('master') })}.`;

  const featured = document.getElementById('featured');
  featured.innerHTML = projects.filter((p) => p.featured).map(projectCard).join('');
  drawBadges(featured);

  const latest = papers.filter((p) => !['thesis', 'talk', 'other'].includes(p.type) && p.members.length).slice(0, 6);
  document.getElementById('latest').innerHTML = latest.map((p) => paperItem(p, byId)).join('');
}
render();
onLang(render);
