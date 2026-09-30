// Shared by every page: data loading, the ES/EN switch, header and footer, small render helpers.
import { drawTile, geneFor, setupCanvas } from './tiles.js';

const cache = new Map();
export function load(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(`/data/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`data/${name}.json: HTTP ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(name);
}

let dict = {};
let lang = localStorage.getItem('lang') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
const listeners = [];

export const getLang = () => lang;
export const t = (key, vars = {}) => {
  const entry = dict[key];
  let s = entry ? entry[lang] : key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
};
// Pick the current language out of an {es, en} object; plain strings pass through.
export const L = (v) => (v && typeof v === 'object' ? v[lang] ?? v.es : v ?? '');

export function onLang(fn) { listeners.push(fn); }
export function setLang(next) {
  lang = next;
  localStorage.setItem('lang', lang);
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

// Elements carrying data-i18n get their text; data-i18n-attr="attr:key" sets an attribute.
function applyStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr, t(key));
    }
  });
  const title = document.body.dataset.title;
  document.title = title ? `${t(title)} · ${t('site.short')}` : `${t('site.name')} · ${t('site.uh')}`;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NAV = [['/', 'nav.home'], ['/people/', 'nav.people'], ['/publications/', 'nav.publications'], ['/projects/', 'nav.projects']];

function header() {
  const here = location.pathname.replace(/index\.html$/, '');
  const current = (href) => (href === '/' ? here === '/' : here.startsWith(href));
  const el = document.getElementById('site-header');
  el.innerHTML = `
    <a class="skip" href="#main" data-i18n="nav.skip"></a>
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">GIA</span><span data-i18n="site.uh"></span></a>
    <nav aria-label="Main">
      ${NAV.slice(1).map(([href, key]) => `<a href="${href}"${current(href) ? ' aria-current="page"' : ''} data-i18n="${key}"></a>`).join('')}
    </nav>
    <button class="lang" type="button" data-i18n="nav.lang" data-i18n-attr="aria-label:nav.lang.label"></button>`;
  el.querySelector('.lang').addEventListener('click', () => setLang(lang === 'es' ? 'en' : 'es'));
}

function footer() {
  document.getElementById('site-footer').innerHTML = `
    <div class="footer-grid">
      <div><strong data-i18n="site.name"></strong><br><span data-i18n="footer.address"></span></div>
      <div><a href="https://github.com/gia-uh">github.com/gia-uh</a><br><a href="https://github.com/gia-uh/gia-uh.github.io" data-i18n="footer.code"></a></div>
    </div>`;
}

// A person's monogram: a tile seeded by their id, with the initials on a bone plate.
export function monogram(canvas, person) {
  const size = 72, ctx = setupCanvas(canvas, size);
  drawTile(ctx, 0, 0, size, geneFor(person.id), 1.6);
  const initials = person.name.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map((w) => w[0]).join('');
  ctx.fillStyle = '#F1ECE2';
  ctx.fillRect(size * 0.22, size * 0.26, size * 0.56, size * 0.48);
  ctx.font = `900 ${size * 0.4}px "Big Shoulders Display", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1B1A18';
  ctx.fillText(initials, size / 2, size / 2 + 2);
}

// One paper, rendered as a list item. Group members' names get marked.
export function paperItem(p, peopleById, { showTheses = false } = {}) {
  const isMember = (a) => p.members.some((id) => peopleById[id] && sameName(a, peopleById[id].name));
  const authors = (p.authors || []).map((a) => (isMember(a) ? `<mark>${esc(a)}</mark>` : esc(a))).join(', ');
  const title = p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title);
  const kind = p.type === 'thesis' ? t(`level.${p.level || 'diploma'}`) : t(`type.${p.type}`);
  const sup = showTheses && p.supervisors?.length
    ? `<span class="sup">${t('pubs.supervisors')}: ${p.supervisors.map((id) => esc(peopleById[id]?.name || id)).join(', ')}</span>` : '';
  const tags = (p.tags || []).includes('gensie') ? '<span class="tag">GenSIE</span>' : '';
  return `<li class="paper">
    <p class="paper-title">${title}</p>
    <p class="paper-authors">${authors}</p>
    <p class="paper-meta"><span class="kind">${esc(kind)}</span>${p.venue ? ` <span class="venue">${esc(p.venue)}</span>` : ''}${p.year ? ` <span class="year">${p.year}</span>` : ''} ${tags}</p>
    ${sup}
  </li>`;
}

const fold = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/-/g, ' ');
// "A. Piad-Morffis" and "Alejandro Piad Morffis" are the same person: compare surname and initial.
function sameName(author, name) {
  const a = fold(author).split(/[\s.,]+/).filter(Boolean), n = fold(name).split(/\s+/);
  const sur = n.length >= 3 ? n[n.length - 2] : n[n.length - 1];
  const i = a.indexOf(sur);
  return i > 0 && a.slice(0, i).some((w) => w === n[0] || (w.length === 1 && w === n[0][0]));
}

export async function boot() {
  dict = await load('i18n');
  header();
  footer();
  applyStatic();
}
