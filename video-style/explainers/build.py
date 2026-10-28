"""Build a MAI explainer into ONE self-contained, hand-navigated HTML file.

    python3 -I video-style/explainers/build.py analogy-to-arc        # → explainers/out/analogy-to-arc.html
    python3 -I video-style/explainers/build.py analogy-to-arc --check # lint + hash check only

Inputs are all local and frozen: tokens/*.json (colours, motion, texture), the asset library's shape
objects (characters, icons), the explainer's ledger.json (media with sha256), data.json, and the JS/CSS
sources. The output has no timestamps and no network references, so the same inputs give the same bytes.
Content is linted (EXPLAINER.md, rules X1–X9) by loading it in Node and reading the scene list back.
"""
import argparse
import base64
import hashlib
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent  # video-style/
TOKENS = ROOT / "tokens"
ASSETS = ROOT / "assets"

FONT_FACES = {  # ledger font id → (family, style, weight range)
    "inter": ("MAI Sans", "normal", "100 900"),
    "serif": ("MAI Serif", "normal", "400"),
    "serif-italic": ("MAI Serif", "italic", "400"),
    "mono": ("MAI Mono", "normal", "100 800"),
    "hand": ("MAI Hand", "normal", "400 700"),
}
SHAPES = {  # asset id → shape payloads the page may draw
    "character.everyperson": {"base": "character/everyperson/poses/base.json", "neutral": "character/everyperson/poses/neutral.json",
                              "point": "character/everyperson/poses/point.json", "shrug": "character/everyperson/poses/shrug.json"},
    "icon.chip": {"shape": "icon/chip/shape.json"},
    "icon.facade": {"shape": "icon/facade/shape.json"},
    "icon.magnifier": {"shape": "icon/magnifier/shape.json"},
    "icon.eye": {"shape": "icon/eye/shape.json"},
    "icon.leaf": {"shape": "icon/leaf/shape.json"},
    "icon.watch": {"shape": "icon/watch/shape.json"},
}


def die(msg):
    sys.exit(f"build: {msg}")


def tokens_css():
    col = json.loads((TOKENS / "color.tokens.json").read_text())["color"]
    mot = json.loads((TOKENS / "motion.tokens.json").read_text())["motion"]
    tex = json.loads((TOKENS / "texture.tokens.json").read_text())["texture"]

    def mode_vars(mode):
        v = {k: x["$value"] for k, x in col[mode].items() if isinstance(x, dict) and "$value" in x}
        out = {f"--{k.replace('concept-', 'c')}": val for k, val in v.items()}
        out["--grid-line"] = mix(v["ink"], v["bg-shade"], 0.72)
        return out

    def mix(a, b, t):
        pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
        pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
        return "#" + "".join(f"{round(x * t + y * (1 - t)):02X}" for x, y in zip(pa, pb))

    paper, night = mode_vars("paper"), mode_vars("night")
    arc = {f"--arc{i}": c for i, c in enumerate(col["data"]["arc"]["$value"])}
    fps = mot["fps"]["$value"]
    dur = {f"--t-{k}": f"{round(v['$value'] * 1000 / fps)}ms" for k, v in mot["duration"].items()
           if isinstance(v, dict) and k in ("tick", "quick", "base", "morph", "slow", "breath")}
    ease = {f"--e-{k}": "cubic-bezier({})".format(", ".join(str(x) for x in v["$value"])) for k, v in mot["ease"].items() if isinstance(v, dict) and "$value" in v}
    g = tex["paper-grain"]
    grain_svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'>"
                 f"<feTurbulence type='fractalNoise' baseFrequency='{g['baseFrequency']}' numOctaves='{g['octaves']}' seed='7' stitchTiles='stitch'/>"
                 f"<feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")
    misc = {"--grain": f'url("data:image/svg+xml;base64,{base64.b64encode(grain_svg.encode()).decode()}")', "--grain-opacity": str(g["opacity"] * 2)}

    def block(sel, d):
        return sel + " {\n" + "".join(f"  {k}: {v};\n" for k, v in d.items()) + "}\n"

    return block(":root", {**paper, **arc, **dur, **ease, **misc}) + block("body.night", night)


def media(xdir, ledger):
    out = {}
    for aid, a in sorted(ledger["assets"].items()):
        p = xdir / a["file"]
        data = p.read_bytes()
        if hashlib.sha256(data).hexdigest() != a["sha256"]:
            die(f"{aid}: {a['file']} does not match its ledger sha256 (re-run media.py and review the change)")
        out[aid] = "data:image/webp;base64," + base64.b64encode(data).decode()
    return out


def fonts_css(xdir, ledger):
    css = []
    for fid, (family, style, weight) in FONT_FACES.items():
        f = ledger["fonts"].get(fid)
        if not f:
            die(f"font {fid} missing from ledger")
        data = (xdir / f["file"]).read_bytes()
        if hashlib.sha256(data).hexdigest() != f["sha256"]:
            die(f"font {fid} does not match its ledger sha256")
        css.append(f"@font-face {{ font-family: '{family}'; font-style: {style}; font-weight: {weight}; font-display: block; "
                   f"src: url(data:font/woff2;base64,{base64.b64encode(data).decode()}) format('woff2'); }}")
    return "\n".join(css) + "\n"


def shapes():
    out = {}
    for aid, files in SHAPES.items():
        out[aid] = {k: json.loads((ASSETS / v).read_text()) for k, v in files.items()}
    return out


def load_scenes(engine_js, inject, content_js):
    """Run the content in Node (no DOM needed to register scenes) and return the scene list as plain data."""
    prelude = "globalThis.window = globalThis; globalThis.document = { addEventListener(){} };\n"
    dump = ("process.stdout.write(JSON.stringify({meta: MAI.meta, chapters: MAI.chapters, cast: Object.keys(MAI.cast), "
            "cites: MAI.cites, views: Object.keys(MAI.views), scenes: MAI.scenes.map(s => ({id: s.id, chapter: s.chapter, view: s.view, "
            "title: s.title, props: s.props || {}, steps: s.steps.map(t => ({say: t.say || [], cue: t.cue || {}, cite: t.cite || null, head: t.head ?? null}))}))}));")
    script = prelude + "\n".join(p.read_text() for p in engine_js) + "\n" + inject + "\n" + "\n".join(p.read_text() for p in content_js) + "\n" + dump
    r = subprocess.run(["node", "-"], input=script, capture_output=True, text=True)
    if r.returncode:
        die("content failed to load in node:\n" + r.stderr[-3000:])
    return json.loads(r.stdout)


NUM = re.compile(r"(?<![\w.])\d+(?:\.\d+)?\s*(?:%|percent|points?)|\b\d{2,}(?:\.\d+)?\b")


def lint(doc, ledger):
    """EXPLAINER.md rules. Errors stop the build; warnings are printed."""
    errs, warns = [], []
    cast = set(doc["cast"])
    roles = {}
    words = {k: 0 for k in cast}
    ids = set()
    ch_ids = [c["id"] for c in doc["chapters"]]
    for sc in doc["scenes"]:
        sid = sc["id"]
        if sid in ids:
            errs.append(f"{sid}: duplicate scene id")
        ids.add(sid)
        if sc["chapter"] not in ch_ids:
            errs.append(f"{sid}: unknown chapter {sc['chapter']}")
        if sc["view"] not in doc["views"]:
            errs.append(f"{sid}: unknown view {sc['view']}")
        if not 1 <= len(sc["steps"]) <= 8:
            errs.append(f"{sid}: X1 a scene has 1–8 steps (has {len(sc['steps'])})")
        prev_cue = None
        for k, st in enumerate(sc["steps"], 1):
            where = f"{sid}/{k}"
            say = st["say"]
            if not 1 <= len(say) <= 3:
                errs.append(f"{where}: X2 each step has 1–3 lines")
            for who, text in say:
                if who not in cast:
                    errs.append(f"{where}: unknown speaker {who}")
                    continue
                n = len(text.split())
                words[who] += n
                limit = 34 if who == "mai" else 18
                if n > limit:
                    errs.append(f"{where}: X3 {who} line has {n} words (max {limit})")
                if NUM.search(re.sub(r"\[\[[a-z0-9-]+\|", "", text)) and not (st["cite"] or any(s2["cite"] for s2 in sc["steps"][:k])):
                    errs.append(f"{where}: X4 a number needs a source on screen (step or earlier step `cite`)")
            if st["cite"]:
                key = st["cite"][0] if isinstance(st["cite"], list) else st["cite"]
                if key not in doc["cites"]:
                    errs.append(f"{where}: unknown cite {key}")
            cue = json.dumps(st["cue"], sort_keys=True)
            if prev_cue is not None and cue == "{}" and st["head"] is None:
                errs.append(f"{where}: X5 the picture must change on every step (empty cue)")
            prev_cue = cue
        if sc["view"] == "figure":
            for mid in (sc["props"].get("items") or {}):
                if mid not in ledger["assets"]:
                    errs.append(f"{sid}: X7 shows media {mid}, which is not in the ledger")
    total = sum(words.values())
    guide = [k for k in cast if k == "mai"]
    share = words["mai"] / total if total else 0
    if not 0.55 <= share <= 0.8:
        errs.append(f"X6 guide share of words is {share:.0%} (55–80%)")
    used = set()
    blob = json.dumps(doc["scenes"])
    for mid in ledger["assets"]:
        if f'"{mid}"' in blob:
            used.add(mid)
    for mid in sorted(set(ledger["assets"]) - used):
        warns.append(f"X7 media {mid} is in the ledger but no scene shows it")
    stats = {"scenes": len(doc["scenes"]), "steps": sum(len(s["steps"]) for s in doc["scenes"]), "words": total,
             "guide_share": round(share, 3), "media": len(used)}
    return errs, warns, stats


TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{desc}">
<title>{title}</title>
<style>
{fonts}{tokens}{css}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="boil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed="1"><animate attributeName="seed" values="1;2;3;4" dur="0.334s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter>
</defs></svg>
<div id="app"></div>
<noscript><p style="padding:2em">This explainer needs JavaScript to step through its scenes.</p></noscript>
<script>
{js}
MAI.media = {media};
MAI.ledger = {ledger};
MAI.shapes = {shapes};
MAI.data = {data};
{content}
MAI.start();
</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("explainer")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--fragment", type=pathlib.Path, help="also write the page without its document wrapper (for hosts that add their own, e.g. Artifacts)")
    args = ap.parse_args()
    xdir = HERE / args.explainer
    ledger = json.loads((xdir / "ledger.json").read_text())
    engine_js = [HERE / "engine/explainer.js", HERE / "engine/views.js"]
    content_js = [xdir / "views.js", xdir / "content.js"]
    for p in engine_js + content_js:
        if not p.exists():
            die(f"missing {p.relative_to(ROOT)}")

    data_js = (xdir / "data.json").read_text().strip()
    shapes_js = json.dumps(shapes(), separators=(",", ":"), sort_keys=True)
    lean_ledger = {k: {f: v[f] for f in ("kind", "title", "credit", "licence", "licence_url", "source", "size")} for k, v in sorted(ledger["assets"].items())}
    ledger_js = json.dumps(lean_ledger, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    inject = f"MAI.ledger = {ledger_js};\nMAI.shapes = {shapes_js};\nMAI.data = {data_js};"
    doc = load_scenes(engine_js, inject, content_js)
    errs, warns, stats = lint(doc, ledger)
    for w in warns:
        print("warning:", w)
    for e in errs:
        print("error:", e)
    print(f"{len(errs)} error(s), {len(warns)} warning(s) {stats}")
    if errs:
        sys.exit(1)
    med = media(xdir, ledger)
    fonts = fonts_css(xdir, ledger)
    if args.check:
        return

    html = TEMPLATE.format(
        title=doc["meta"]["title"], desc=doc["meta"]["description"].replace('"', "&quot;"),
        fonts=fonts, tokens=tokens_css(),
        css=(HERE / "engine/explainer.css").read_text() + ((xdir / "style.css").read_text() if (xdir / "style.css").exists() else ""),
        js="\n".join(p.read_text() for p in engine_js),
        media=json.dumps(med, separators=(",", ":"), sort_keys=True),
        ledger=ledger_js, shapes=shapes_js, data=data_js,
        content="\n".join(p.read_text() for p in content_js),
    )
    out = HERE / "out" / f"{args.explainer}.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html)
    print(f"wrote {out.relative_to(ROOT)}  {len(html.encode()) / 1e6:.2f} MB  sha256 {hashlib.sha256(html.encode()).hexdigest()[:16]}")
    if args.fragment:
        body = html.split("<head>\n", 1)[1].replace("</head>\n<body>\n", "", 1).rsplit("</body>", 1)[0]
        body = re.sub(r'<meta charset="utf-8">\n<meta name="viewport"[^>]*>\n', "", body)
        frag = f"<title>{doc['meta']['title']}</title>\n" + body.replace(f"<title>{doc['meta']['title']}</title>\n", "", 1)
        args.fragment.write_text(frag)
        print(f"wrote fragment {args.fragment}  {len(frag.encode()) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
