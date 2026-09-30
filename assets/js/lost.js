import { boot } from './core.js';
import { start } from './motifs/search.js';

// Addresses of the old Jekyll site, which may still be linked from elsewhere.
const OLD = { members: '/people/', papers: '/publications/', projects: '/projects/', research: '/', resources: '/projects/', news: '/' };
const old = location.pathname.match(/^\/(en|es)(?:\/([a-z]+))?\/?$/);
if (old) {
  localStorage.setItem('lang', old[1]);
  location.replace(OLD[old[2]] || '/');
} else {
  await boot();
  start(document.getElementById('astar'), { still: matchMedia('(prefers-reduced-motion: reduce)').matches, n: 12 });
}
