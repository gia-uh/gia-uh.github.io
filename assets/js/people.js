import { boot, load, t, L, esc, onLang, monogram } from './core.js';
import { coauthorGraph } from './graph.js';

await boot();
const [people, papers] = await Promise.all([load('people'), load('papers')]);
const CATEGORIES = ['researcher', 'senior', 'phd', 'master', 'collaborator'];

const graph = coauthorGraph(document.getElementById('graph'), document.querySelector('.graph-tip'), people, papers, {
  worksLabel: () => t('people.graph.papers'),
  onPick: (p) => { location.href = `/publications/?member=${encodeURIComponent(p.id)}`; },
});

function card(p) {
  const links = [];
  if (p.orcid) links.push(`<a href="https://orcid.org/${esc(p.orcid)}">ORCID</a>`);
  if (p.github) links.push(`<a href="https://github.com/${esc(p.github)}">GitHub</a>`);
  if (p.website) links.push(`<a href="${esc(p.website)}">Web</a>`);
  if (p.email) links.push(`<a href="mailto:${esc(p.email)}">Email</a>`);
  if (p.category !== 'collaborator' && papers.some((w) => w.members.includes(p.id) || (w.supervisors || []).includes(p.id))) {
    links.push(`<a href="/publications/?member=${esc(p.id)}">${t('people.works')}</a>`);
  }
  return `<li class="person" id="${esc(p.id)}">
    <canvas data-person="${esc(p.id)}" aria-hidden="true"></canvas>
    <div>
      <h3>${esc(p.name)}</h3>
      <p class="role">${esc(L(p.role))}</p>
      <p class="inst">${esc(p.institution)}</p>
      <p class="links">${links.join('')}</p>
    </div>
  </li>`;
}

function render() {
  const groups = document.getElementById('groups');
  groups.innerHTML = CATEGORIES.map((cat) => {
    const list = people.filter((p) => p.category === cat).sort((a, b) => (b.head ? 1 : 0) - (a.head ? 1 : 0));
    return list.length ? `<section class="wrap section" aria-labelledby="h-${cat}">
      <div class="section-head"><h2 id="h-${cat}">${t(`cat.${cat}`)}</h2></div>
      <ul class="people">${list.map(card).join('')}</ul>
    </section>` : '';
  }).join('');
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  groups.querySelectorAll('canvas[data-person]').forEach((c) => monogram(c, byId[c.dataset.person]));
}
render();
onLang(() => { render(); graph.redraw(); });
// Monograms and graph labels use the display fonts; redraw once those have loaded.
document.fonts.ready.then(() => { render(); graph.redraw(); });
