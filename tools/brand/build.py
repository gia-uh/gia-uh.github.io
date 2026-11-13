# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]", "uharfbuzz"]
# ///
"""Build the GIA logo assets into assets/brand/{svg,png}.

Each variant is laid out by layout.js in headless Chromium (the same text metrics the
site uses), then every <text> is replaced by its outline, so the SVGs need no fonts.
PNGs are rendered from the outlined SVGs with rsvg-convert.

    uv run tools/brand/build.py            # all variants
    uv run tools/brand/build.py horizontal # only names containing "horizontal"

Needs chromium (or google-chrome) and rsvg-convert on PATH.
"""
import io, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = {"BS": ROOT / "assets/fonts/BigShouldersDisplay.woff2", "AR": ROOT / "assets/fonts/Archivo.woff2"}
OUT = ROOT / "assets/brand"
PNG_WIDTH = 2000

INDIGO, BLUE, BONE, YELLOW, WHITE, BLACK = "#22356E", "#3E5BA9", "#F1ECE2", "#FFB44C", "#FFFFFF", "#000000"
# sq: tile square, r1: big rhombus, r2: small rhombus, dot: circles, idot: the i's dot when it differs,
# ink: GiA, grp: group line, uni: university line
COLOR = dict(sq=INDIGO, r1=BONE, r2=BLUE, dot=YELLOW, ink=INDIGO, grp=INDIGO, uni=INDIGO)
NEGATIVE = dict(COLOR, ink=BONE, grp=BONE, uni=BONE)
MONO = dict(sq=BLACK, r1=WHITE, r2=BLACK, dot=WHITE, idot=BLACK, ink=BLACK, grp=BLACK, uni=BLACK)
BLUE_WHITE = dict(sq=INDIGO, r1=WHITE, r2=INDIGO, dot=WHITE, idot=INDIGO, ink=INDIGO, grp=INDIGO, uni=INDIGO)

def gray(h):
    r, g, b = (int(h[i:i + 2], 16) for i in (1, 3, 5))
    y = round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    return f"#{y:02X}{y:02X}{y:02X}"

GRAYSCALE = {k: gray(v) for k, v in COLOR.items()}

def variants():
    """(file name, layout, palette, background or None, group text, university text)"""
    v = []
    for name, pal, bg in [("hueso", COLOR, BONE), ("blanco", COLOR, WHITE), ("negativo", NEGATIVE, INDIGO),
                          ("bn", MONO, WHITE), ("grises", GRAYSCALE, WHITE), ("azul-blanco", BLUE_WHITE, WHITE)]:
        v.append((f"gia-horizontal-{name}-textos", "horizontal", pal, bg, True, True))
        v.append((f"gia-horizontal-{name}", "horizontal", pal, bg, False, False))
    v.append(("gia-lateral-hueso", "side", COLOR, BONE, True, True))
    for name, bg in [("hueso", BONE), ("blanco", WHITE)]:
        v.append((f"gia-palabra-{name}-textos", "wordmark", COLOR, bg, True, True))
        v.append((f"gia-vertical-{name}-textos", "vertical", COLOR, bg, True, True))
        v.append((f"gia-vertical-{name}-grupo", "vertical", COLOR, bg, True, False))
        v.append((f"gia-vertical-{name}", "vertical", COLOR, bg, False, False))
    v.append(("gia-horizontal-transparente", "horizontal", COLOR, None, False, False))  # site header and home poster
    v.append(("gia-losa", "icon", COLOR, None, False, False))
    return v

def chromium():
    for b in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(b): return b
    sys.exit("chromium not found on PATH")

def layout(tmp, name, mode):
    page = tmp / f"{name}.html"
    page.write_text(f"""<!doctype html><meta charset=utf-8><style>
@font-face{{font-family:BS;src:url({FONTS['BS'].as_uri()});font-weight:700 900}}
@font-face{{font-family:AR;src:url({FONTS['AR'].as_uri()});font-weight:400 700}}
</style><svg id="s" xmlns="http://www.w3.org/2000/svg"></svg>
<script>window.MODE={json.dumps(mode)};</script><script src="{(Path(__file__).parent / 'layout.js').as_uri()}"></script>""")
    dom = subprocess.run([chromium(), "--headless", "--no-sandbox", "--disable-gpu", "--allow-file-access-from-files",
                          "--virtual-time-budget=5000", "--dump-dom", page.as_uri()],
                         capture_output=True, text=True, check=True).stdout
    if "<title>ready</title>" not in dom: sys.exit(f"{name}: layout.js did not finish")
    return re.search(r'<svg id="s".*?</svg>', dom, re.S).group(0)

_fonts = {}
def font(fam, weight):
    if (fam, weight) not in _fonts:
        tt = TTFont(FONTS[fam])
        axes = {a.axisTag: a for a in tt["fvar"].axes}
        loc = {"wght": max(axes["wght"].minValue, min(axes["wght"].maxValue, weight))}
        if "wdth" in axes: loc["wdth"] = axes["wdth"].defaultValue
        tt = instantiateVariableFont(tt, loc); tt.flavor = None
        buf = io.BytesIO(); tt.save(buf)
        _fonts[fam, weight] = (tt, hb.Font(hb.Face(buf.getvalue())))
    return _fonts[fam, weight]

def outline(match):
    a = dict(re.findall(r'([\w-]+)="([^"]*)"', match.group(1)))
    s = match.group(2).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    tt, hbf = font(a["font-family"], int(a["font-weight"]))
    k = float(a["font-size"]) / tt["head"].unitsPerEm
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties(); hb.shape(hbf, buf, {"kern": True, "liga": True})
    glyphs, order, pen = tt.getGlyphSet(), tt.getGlyphOrder(), None
    pen = SVGPathPen(glyphs); x, y, adv = float(a["x"]), float(a["y"]), 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        glyphs[order[info.codepoint]].draw(TransformPen(pen, (k, 0, 0, -k, x + (adv + pos.x_offset) * k, y - pos.y_offset * k)))
        adv += pos.x_advance
    tr = f' transform="{a["transform"]}"' if "transform" in a else ""
    return f'<path data-text="{s}" fill="{a["fill"]}"{tr} d="{pen.getCommands()}"/>'

def glyph_metrics():
    """Exact outline bounds and advances of G and A (Big Shoulders at 900), in units of the em."""
    tt, _ = font("BS", 900); upem = tt["head"].unitsPerEm; gs = tt.getGlyphSet(); cmap = tt.getBestCmap()
    from fontTools.pens.boundsPen import BoundsPen
    out = {}
    for ch in "GA":
        name = cmap[ord(ch)]; pen = BoundsPen(gs); gs[name].draw(pen); x0, y0, x1, y1 = pen.bounds
        out[ch] = dict(left=-x0 / upem, right=x1 / upem, ascent=y1 / upem, descent=-y0 / upem, width=gs[name].width / upem)
    return out

def main():
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    (OUT / "svg").mkdir(parents=True, exist_ok=True); (OUT / "png").mkdir(parents=True, exist_ok=True)
    built = 0
    gm = glyph_metrics()
    # under $HOME: a snap-packaged Chromium cannot read /tmp
    cache = Path.home() / ".cache"; cache.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=cache) as t:
        for name, lay, pal, bg, grp, uni in variants():
            if only not in name: continue
            svg = layout(Path(t), name, dict(layout=lay, P=pal, bg=bg, grp=grp, uni=uni, glyphs=gm))
            svg = re.sub(r"<text ([^>]*)>([^<]*)</text>", outline, svg)
            svg = re.sub(r"(\d+\.\d{3})\d+", r"\1", svg).replace('<svg id="s" ', "<svg ", 1)
            path = OUT / "svg" / f"{name}.svg"
            path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + svg + "\n")
            subprocess.run(["rsvg-convert", "-w", str(PNG_WIDTH), "-o", str(OUT / "png" / f"{name}.png"), str(path)], check=True)
            if name == "gia-losa": (ROOT / "assets/favicon.svg").write_text(path.read_text())  # the site favicon is the tile
            built += 1
    print(f"{built} variants built in {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
