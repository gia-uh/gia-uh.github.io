#!/usr/bin/env python3
"""Consistency checks for uhgia.org. Standard library only; exits 1 on any failure.

Run from the repository root:  python3 tools/check.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
errors = []


def fail(msg):
    errors.append(msg)


def load(name):
    try:
        return json.loads((ROOT / "data" / f"{name}.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        fail(f"data/{name}.json: {e}")
        return None


def bilingual(value, where):
    if not (isinstance(value, dict) and value.get("es") and value.get("en")):
        fail(f"{where}: needs non-empty 'es' and 'en'")


people, papers, projects, i18n = (load(n) for n in ("people", "papers", "projects", "i18n"))
if None in (people, papers, projects, i18n):
    print("\n".join(errors))
    sys.exit(1)

# ---- people
CATEGORIES = {"senior", "researcher", "phd", "master", "collaborator"}
ids = [p["id"] for p in people]
for dup in {i for i in ids if ids.count(i) > 1}:
    fail(f"people.json: duplicate id {dup!r}")
for p in people:
    if p.get("category") not in CATEGORIES:
        fail(f"people.json {p['id']}: unknown category {p.get('category')!r}")
    bilingual(p.get("role"), f"people.json {p['id']}.role")
    if p.get("orcid") and not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]", p["orcid"]):
        fail(f"people.json {p['id']}: malformed ORCID {p['orcid']!r}")
if sum(1 for p in people if p.get("head")) != 1:
    fail("people.json: exactly one person must have head: true")
people_ids = set(ids)

# ---- papers
TYPES = {"journal", "conference", "chapter", "book", "preprint", "thesis", "talk", "other"}
pids = [p["id"] for p in papers]
for dup in {i for i in pids if pids.count(i) > 1}:
    fail(f"papers.json: duplicate id {dup!r}")
for p in papers:
    where = f"papers.json {p.get('id')}"
    if p.get("type") not in TYPES:
        fail(f"{where}: unknown type {p.get('type')!r}")
    if not p.get("title"):
        fail(f"{where}: empty title")
    if "year" in p and not isinstance(p["year"], int):
        fail(f"{where}: year must be an integer")
    for field in ("members", "supervisors"):
        for pid in p.get(field, []):
            if pid not in people_ids:
                fail(f"{where}: {field} names unknown person {pid!r}")
    if p.get("type") == "thesis" and p.get("level") not in (None, "diploma", "master", "phd"):
        fail(f"{where}: unknown thesis level {p.get('level')!r}")

# ---- projects
for p in projects:
    bilingual(p.get("tagline"), f"projects.json {p.get('id')}.tagline")
    bilingual(p.get("description"), f"projects.json {p.get('id')}.description")

# ---- i18n: every entry bilingual, every key used exists
for key, value in i18n.items():
    bilingual(value, f"i18n.json {key!r}")

used = set()
html_files = sorted(ROOT.glob("**/*.html"))
js_files = sorted((ROOT / "assets" / "js").glob("**/*.js"))
for f in html_files:
    text = f.read_text(encoding="utf-8")
    used |= set(re.findall(r'data-i18n="([^"]+)"', text))
    for attr in re.findall(r'data-i18n-attr="([^"]+)"', text):
        used |= {pair.split(":", 1)[1] for pair in attr.split(",")}
for f in js_files:
    text = f.read_text(encoding="utf-8")
    used |= set(re.findall(r"""\bt\(\s*['"]([a-z0-9.]+)['"]""", text))
    used |= set(re.findall(r"""\[\s*['"]((?:stat|shape)\.[a-z]+)['"]""", text))
    used |= {k for k in re.findall(r'data-i18n="([^"]+)"', text) if "${" not in k}
# keys built at runtime from data
for f in (ROOT / "assets" / "js" / "motifs").glob("*.js"):
    motif = re.search(r"id: '([a-z]+)'", f.read_text(encoding="utf-8")).group(1)
    used |= {f"motif.{motif}", f"motif.{motif}.how"}
learning = (ROOT / "assets" / "js" / "motifs" / "learning.js").read_text(encoding="utf-8")
shapes_block = learning[learning.index("const SHAPES = {"):learning.index("const NAMES")]
used |= {f"shape.{k}" for k in re.findall(r"^  ([a-z]+): \(", shapes_block, re.M)}
used |= {f"cat.{c}" for c in CATEGORIES}
used |= {f"type.{p['type']}" for p in papers}
used |= {f"level.{p['level']}" for p in papers if p.get("level")}
for key in sorted(used - set(i18n)):
    fail(f"i18n.json: missing key {key!r}")

# ---- internal links resolve to files
def resolves(href):
    path = href.split("?")[0].split("#")[0]
    target = ROOT / path.lstrip("/")
    return target.is_file() or (target / "index.html").is_file()

hrefs = []
for f in html_files + js_files:
    hrefs += [(f.relative_to(ROOT), h) for h in re.findall(r'(?:href|src)="(/[^"]*)"', f.read_text(encoding="utf-8")) if "${" not in h]
hrefs += [("data/projects.json", p["url"]) for p in projects if p.get("url", "").startswith("/")]
for where, href in hrefs:
    if not resolves(href):
        fail(f"{where}: internal link {href!r} does not resolve to a file")

# ---- other gia-uh repos publish GitHub Pages under uhgia.org/<repo>/; never shadow them
PROJECT_PAGES = {"argo", "gensie", "lingo", "pathos", "logos", "cecilia", "autogoal-docs", "automl-survey"}
for d in ROOT.iterdir():
    if d.is_dir() and d.name in PROJECT_PAGES:
        fail(f"/{d.name}/ would shadow the {d.name} repo's GitHub Pages site at uhgia.org/{d.name}/")

if errors:
    print("\n".join(errors))
    print(f"\n{len(errors)} problem(s)")
    sys.exit(1)
print(f"ok: {len(people)} people, {len(papers)} works, {len(projects)} projects, {len(i18n)} strings, {len(hrefs)} internal links")
