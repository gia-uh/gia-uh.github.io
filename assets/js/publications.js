import { boot, load, t, esc, onLang, paperItem } from './core.js';

await boot();
const [people, papers] = await Promise.all([load('people'), load('papers')]);
const byId = Object.fromEntries(people.map((p) => [p.id, p]));
const TYPES = ['journal', 'conference', 'chapter', 'book', 'talk', 'preprint', 'other'];

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const state = {
  tab: params.get('tab') === 'theses' ? 'theses' : 'papers',
  q: params.get('q') || '',
  member: params.get('member') || '',
  type: params.get('type') || '',
};

const fold = (s) => (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const involves = (p, id) => p.members.includes(id) || (p.supervisors || []).includes(id);

function syncUrl() {
  const q = new URLSearchParams();
  if (state.tab === 'theses') q.set('tab', 'theses');
  for (const k of ['q', 'member', 'type']) if (state[k]) q.set(k, state[k]);
  history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
}

function controls() {
  const members = people.filter((p) => p.category !== 'collaborator' && papers.some((w) => involves(w, p.id)))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  $('member').innerHTML = `<option value="">${t('pubs.member.all')}</option>` +
    members.map((p) => `<option value="${esc(p.id)}"${p.id === state.member ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  $('type').innerHTML = `<option value="">${t('pubs.type.all')}</option>` +
    TYPES.filter((ty) => papers.some((p) => p.type === ty)).map((ty) => `<option value="${ty}"${ty === state.type ? ' selected' : ''}>${t(`type.${ty}`)}</option>`).join('');
  $('q').value = state.q;
  $('type-wrap').hidden = state.tab === 'theses';
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
}

function list() {
  const q = fold(state.q);
  const shown = papers.filter((p) => (state.tab === 'theses' ? p.type === 'thesis' : p.type !== 'thesis' && p.members.length))
    .filter((p) => !state.member || involves(p, state.member))
    .filter((p) => state.tab === 'theses' || !state.type || p.type === state.type)
    .filter((p) => !q || fold(`${p.title} ${(p.authors || []).join(' ')} ${p.venue || ''}`).includes(q));
  $('count').textContent = shown.length === 1 ? t('pubs.count.one') : t('pubs.count', { n: shown.length });
  if (!shown.length) { $('list').innerHTML = `<p class="empty">${t('pubs.empty')}</p>`; return; }
  const years = [...new Set(shown.map((p) => p.year || 0))].sort((a, b) => b - a);
  $('list').innerHTML = years.map((y) => `<section class="year-group">
    <h2>${y || '—'}</h2>
    <ul class="papers">${shown.filter((p) => (p.year || 0) === y).map((p) => paperItem(p, byId, { showTheses: state.tab === 'theses' })).join('')}</ul>
  </section>`).join('');
}

function update() { syncUrl(); list(); }
$('q').addEventListener('input', (e) => { state.q = e.target.value; update(); });
$('member').addEventListener('change', (e) => { state.member = e.target.value; update(); });
$('type').addEventListener('change', (e) => { state.type = e.target.value; update(); });
$('clear').addEventListener('click', () => { state.q = state.member = state.type = ''; controls(); update(); });
document.querySelector('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) { state.tab = b.dataset.tab; controls(); update(); }
});

controls();
list();
onLang(() => { controls(); list(); });
