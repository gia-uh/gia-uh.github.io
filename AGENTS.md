# AGENTS.md — uhgia.org

The public website of GIA-UH. Readers are prospective students, collaborators and
reviewers looking for the group's people, papers and projects.

- Content is data: `data/*.json`. Code in `assets/js/` renders it; do not hard-code
  people or papers in HTML.
- Every visible string exists in Spanish and English (`{"es", "en"}` in the data,
  `data/i18n.json` for the interface).
- Done means `python3 tools/check.py` passes and the page was looked at in a browser in
  both languages and at phone width.
- `master` is what GitHub Pages serves: merging a PR publishes it.
- The design (palette, type, motifs) is in the workspace spec
  `vault/Atlas/Architecture/2026-09-30-uhgia-site-rebuild-design.md` of apiad/Workspace.
