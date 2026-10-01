import { boot, load, onLang, paperItem } from './core.js';

await boot();
const [people, papers] = await Promise.all([load('people'), load('papers')]);
const byId = Object.fromEntries(people.map((p) => [p.id, p]));
const gensie = papers.filter((p) => (p.tags || []).includes('gensie'));

function render() {
  document.getElementById('overview').innerHTML = gensie.filter((p) => p.tags.includes('overview')).map((p) => paperItem(p, byId)).join('');
  document.getElementById('teams').innerHTML = gensie.filter((p) => !p.tags.includes('overview')).map((p) => paperItem(p, byId)).join('');
}
render();
onLang(render);
