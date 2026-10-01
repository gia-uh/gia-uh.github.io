import { boot, load, onLang } from './core.js';
import { projectCard, projectRow, drawBadges } from './project-card.js';

await boot();
const projects = await load('projects');

function render() {
  const featured = document.getElementById('featured');
  featured.innerHTML = projects.filter((p) => p.featured).map(projectCard).join('');
  drawBadges(featured);
  document.getElementById('others').innerHTML = projects.filter((p) => !p.featured).map(projectRow).join('');
}
render();
onLang(render);
