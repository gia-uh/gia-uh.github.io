# uhgia.org

The website of the Artificial Intelligence Group (GIA) of the University of Havana,
served by GitHub Pages at [uhgia.org](https://uhgia.org).

Plain HTML, CSS and JavaScript: no framework, no build step. The pages are shells in
`index.html`, `people/`, `publications/`, `projects/` and `404.html`; the content lives in
`data/*.json` and is rendered in the browser by the ES modules in `assets/js/`.

## Run it locally

```bash
python3 -m http.server 8000
```

and open <http://127.0.0.1:8000>. Absolute paths (`/data/...`, `/assets/...`) need the
repository root as the server root.

## Update the content

| To change | Edit |
|---|---|
| a person, a role, a link | `data/people.json` |
| publications and theses | `data/papers.json` (`members` and `supervisors` are ids from `people.json`) |
| projects | `data/projects.json` |
| any interface text, in both languages | `data/i18n.json` |

Every visible string is an `{"es": ..., "en": ...}` pair. Then run the checks:

```bash
python3 tools/check.py
```

CI runs the same script on every pull request.

## The home page

The hero runs one of four AI algorithms, drawn as Havana cement tiles: a genetic algorithm
breeding tile floors, A* crossing a floor, a neural network learning a changing boundary,
and a trigram language model chatting in tiles. One starts at random and the hero moves to
the next every 30 seconds. Each lives in `assets/js/motifs/` and shares the tile renderer
in `assets/js/tiles.js`.

Other gia-uh repositories publish their own GitHub Pages under this domain
(`uhgia.org/gensie/`, `/argo/`, `/lingo/`, `/pathos/`, `/logos/`, ...). Do not create
top-level folders with those names; `tools/check.py` fails if you do.
