"""Fetch and treat every bitmap and font the explainer embeds, and write the asset ledger.

Run once when the media list changes; the outputs in media/ are committed and frozen, and the
ledger records each file's source, licence, recipe and sha256 so build.py can refuse a drift.

    python3 -I video-style/explainers/analogy-to-arc/media.py --cache <dir>   # needs network for a cold cache
    (font subsetting needs fontTools + brotli; without them the font step is skipped)

Treatments follow RULES §5: photos are never shown raw (duotone in ink on paper); paper figures are
data and are shown untouched as "clippings"; archival scans are toned to the paper colour.
"""
import argparse
import hashlib
import io
import json
import pathlib
import subprocess
import tarfile
import tempfile
import urllib.request

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
MEDIA = HERE / "media"
LEDGER = HERE / "ledger.json"
UA = "MAI-explainer/1.0 (https://github.com/russellrezagh/sa)"
INK, PAPER = "#1F1D1A", "#EDE9DC"

CC_BY = ("CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/")
STEVENSON = "Stevenson, Pafford, van der Maas & Mitchell, “Can large language models generalize analogy solving like children can?”, TACL 2026 (arXiv:2411.02348)"
BEGER = "Beger, Yi, Fu, Denton, Moskvichev, Tsai, Rajamanickam & Mitchell, “Distinguishing Performance From Competence in Evaluations of Humanlike Abstract Reasoning”, NeurIPS 2026 (arXiv:2510.02125)"
POTARCIN = "Beger, Yi & Mitchell, “PotARCin: Multi-Dimensional Evaluation of Skill Acquisition in Abstract Reasoning Tasks”, NeurIPS 2026 (arXiv:2609.27288)"
DTIC = "Hofstadter, “The Copycat Project: An Experiment in Nondeterminism and Creative Analogies”, MIT AI Memo 755 (1984), DTIC ADA142744"

# id: (source key, member or page, kind, title, credit, licence, extra recipe)
ITEMS = {
    # --- Stevenson et al. (CC BY 4.0)
    "p2-title": ("arxiv:2411.02348:pdf", "page1:0.05,0.085,0.95,0.22", "title", "First page of the paper", STEVENSON, CC_BY, {}),
    "p2-item-latin": ("arxiv:2411.02348", "images/item1_Latin.jpg", "figure", "Item 1 as shown to participants: Latin", STEVENSON + ", Figure 2a", CC_BY, {"w": 820}),
    "p2-item-greek": ("arxiv:2411.02348", "images/item1_Greek.jpg", "figure", "Item 1: Greek (near transfer)", STEVENSON + ", Figure 2b", CC_BY, {"w": 820}),
    "p2-item-symbol": ("arxiv:2411.02348", "images/item1_Symbol.jpg", "figure", "Item 1: Symbol list (far transfer)", STEVENSON + ", Figure 2c", CC_BY, {"w": 820}),
    "p2-results": ("arxiv:2411.02348", "images/results_letstr_kids_adults_models.jpg", "figure", "Human vs LLM performance across alphabets", STEVENSON + ", Figure 1", CC_BY, {"w": 900}),
    "p2-rulecheck": ("arxiv:2411.02348", "images/results_rulecheck.jpg", "figure", "Rule Check task: each rule in isolation", STEVENSON + ", Figure 5", CC_BY, {"w": 900}),
    # --- Beger et al. (CC BY 4.0)
    "p3-title": ("arxiv:2510.02125:pdf", "page1:0.15,0.105,0.85,0.43", "title", "First page of the paper", BEGER, CC_BY, {}),
    "p3-examples": ("arxiv:2510.02125", "figures/ConceptARCExamples.png", "figure", "Two ConceptARC tasks", BEGER + ", Figure 1", CC_BY, {"w": 1400}),
    "p3-rules": ("arxiv:2510.02125", "figures/combined_models_cropped.pdf", "figure", "Rule evaluations, text vs visual", BEGER + ", Figure 2", CC_BY, {"w": 1300, "dpi": 220}),
    "p3-terms": ("arxiv:2510.02125", "figures/PerLLMProportions-WithTools.png", "figure", "Objectness vs grid-specific words in rules", BEGER + ", Figure 3", CC_BY, {"w": 1100}),
    "p3-numeric": ("arxiv:2510.02125", "figures/RuleExample_NumericalEncoding.png", "figure", "A correct-unintended rule that exploits colour numbers", BEGER + ", Appendix figure", CC_BY, {"w": 1400}),
    "p3-errors": ("arxiv:2510.02125", "figures/error_types.pdf", "figure", "o3 error types by setting", BEGER + ", Appendix figure", CC_BY, {"w": 1000, "dpi": 220}),
    # --- PotARCin (CC BY 4.0)
    "p4-title": ("arxiv:2609.27288:pdf", "page1:0.15,0.105,0.85,0.325", "title", "First page of the paper", POTARCIN, CC_BY, {}),
    "p4-overview": ("arxiv:2609.27288", "figures/PotARCin_Overview_cropped.pdf", "figure", "The five PotARCin dimensions (task 890034e9)", POTARCIN + ", Figure 1", CC_BY, {"w": 1300, "dpi": 240}),
    "p4-performance": ("arxiv:2609.27288", "figures/potarcin_performance_v2.pdf", "figure", "Performance on all seven measures", POTARCIN + ", Figure 2", CC_BY, {"w": 1300, "dpi": 300}),
    "p4-human": ("arxiv:2609.27288", "figures/H_ARC_examples_v2_cropped.pdf", "figure", "Corruption: human errors (H-ARC)", POTARCIN + ", Figure 4", CC_BY, {"w": 520, "dpi": 220}),
    "p4-verifier": ("arxiv:2609.27288", "figures/Corrupted_Verifier_Examples_v2_cropped.pdf", "figure", "Corruption: corrupted verifier", POTARCIN + ", Figure 4", CC_BY, {"w": 520, "dpi": 220}),
    "p4-mismatch": ("arxiv:2609.27288", "figures/Instance_Mismatch_examples_v2_cropped.pdf", "figure", "Corruption: instance mismatch", POTARCIN + ", Figure 4", CC_BY, {"w": 520, "dpi": 220}),
    "p4-flip": ("arxiv:2609.27288", "figures/Color_Flip_examples_v2_cropped.pdf", "figure", "Corruption: colour flip", POTARCIN + ", Figure 5", CC_BY, {"w": 900, "dpi": 220}),
    "p4-retrieval": ("arxiv:2609.27288", "figures/Retrieval_Examples_v2_cropped.pdf", "figure", "Corruption: retrieval", POTARCIN + ", Figure 5", CC_BY, {"w": 900, "dpi": 220}),
    "p4-sampling": ("arxiv:2609.27288", "figures/Deep_Investigation_cropped.pdf", "figure", "More samples, fewer survivors", POTARCIN + ", Figure 3", CC_BY, {"w": 900, "dpi": 220}),
    # --- Internet Archive: the 1984 Copycat memo (DTIC: “Distribution of this document is unlimited”)
    "memo-title": ("ia:DTIC_ADA142744", "page4:0.06,0.07,0.97,0.73", "scan", "The Copycat Project, MIT AI Memo 755 (January 1984)", DTIC + ", via the Internet Archive",
                   ("© 1984 MIT; distribution unlimited (DTIC). Shown for commentary.", "https://archive.org/details/DTIC_ADA142744"), {"w": 900}),
    "memo-slipnet": ("ia:DTIC_ADA142744", "page21:0.05,0.07,0.98,0.93", "scan", "Hofstadter’s hand-drawn Slipnet, memo p. 18", DTIC + ", p. 18, via the Internet Archive",
                     ("© 1984 MIT; distribution unlimited (DTIC). Shown for commentary.", "https://archive.org/details/DTIC_ADA142744"), {"w": 900}),
    # --- Wikimedia Commons photos (duotone treatment)
    "photo-hofstadter": ("commons:Hofstadter2002.jpg", None, "photo", "Douglas Hofstadter, Bologna, 2002", "Maurizio Codogno, via Wikimedia Commons",
                         ("CC BY 2.5", "https://creativecommons.org/licenses/by/2.5/"), {"w": 520, "box": (0.0, 0.0, 1.0, 0.86)}),
    "photo-mitchell": ("commons:SD_2025_-_Melanie_Mitchell_01_(cropped).jpg", None, "photo", "Melanie Mitchell, San Diego, 2025", "Xuthoria, via Wikimedia Commons",
                       ("CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"), {"w": 520, "box": (0.0, 0.0, 1.0, 0.82)}),
}

SOURCES = {
    "arxiv:2411.02348": "https://arxiv.org/e-print/2411.02348",
    "arxiv:2510.02125": "https://arxiv.org/e-print/2510.02125",
    "arxiv:2609.27288": "https://arxiv.org/e-print/2609.27288",
    "arxiv:2411.02348:pdf": "https://arxiv.org/pdf/2411.02348v3",
    "arxiv:2510.02125:pdf": "https://arxiv.org/pdf/2510.02125v5",
    "arxiv:2609.27288:pdf": "https://arxiv.org/pdf/2609.27288v2",
    "ia:DTIC_ADA142744": "https://archive.org/download/DTIC_ADA142744/DTIC_ADA142744.pdf",
    "commons:Hofstadter2002.jpg": "https://commons.wikimedia.org/wiki/Special:FilePath/Hofstadter2002.jpg",
    "commons:SD_2025_-_Melanie_Mitchell_01_(cropped).jpg": "https://commons.wikimedia.org/wiki/Special:FilePath/SD_2025_-_Melanie_Mitchell_01_(cropped).jpg?width=960",
}
PAGES = {
    "commons:Hofstadter2002.jpg": "https://commons.wikimedia.org/wiki/File:Hofstadter2002.jpg",
    "commons:SD_2025_-_Melanie_Mitchell_01_(cropped).jpg": "https://commons.wikimedia.org/wiki/File:SD_2025_-_Melanie_Mitchell_01_(cropped).jpg",
}

FONTS = {  # vendored OFL fonts → subset WOFF2 (glyphs the page can show: Latin, Greek, arrows, maths, ticks)
    "inter": ROOT / "assets/font/inter/Inter-Variable.ttf",
    "serif": ROOT / "assets/font/instrument-serif/InstrumentSerif-Regular.ttf",
    "serif-italic": ROOT / "assets/font/instrument-serif/InstrumentSerif-Italic.ttf",
    "mono": ROOT / "assets/font/jetbrains-mono/JetBrainsMono-Variable.ttf",
    "hand": ROOT / "assets/font/caveat/Caveat-Variable.ttf",
}
UNICODES = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DC,U+0370-03FF,U+2010-2027,U+2030-205E,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+25A0-25FF,U+2713-2717"


def fetch(cache, key):
    path = cache / (key.replace(":", "_").replace("/", "_"))
    if not path.exists():
        req = urllib.request.Request(SOURCES[key], headers={"User-Agent": UA})
        path.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    return path


def member(cache, key, name):
    with tarfile.open(fetch(cache, key)) as tf:
        return tf.extractfile(name).read()


def pdf_page(pdf, page, dpi):
    """Rasterise one page; pdftoppm writes the PNG to stdout when no output root is given."""
    out = subprocess.run(["pdftoppm", "-r", str(dpi), "-png", "-f", str(page), "-l", str(page), "-singlefile", str(pdf)],
                         check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(out))


def pdf_bytes(data, dpi):
    with tempfile.TemporaryDirectory() as tmp:
        pdf = pathlib.Path(tmp) / "figure.pdf"
        pdf.write_bytes(data)
        return pdf_page(pdf, 1, dpi)


def frac_crop(im, spec):
    x0, y0, x1, y1 = [float(v) for v in spec.split(",")]
    w, h = im.size
    return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))


def flatten(im):
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, "white")
        im = Image.alpha_composite(bg, im)
    return im.convert("RGB")


def fit(im, w):
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    return im


def duotone(im, dark=INK, light="#F3EEE1"):
    g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=1)
    return ImageOps.colorize(g, dark, light)


def save(im, name, q=82):
    MEDIA.mkdir(exist_ok=True)
    path = MEDIA / f"{name}.webp"
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=6)
    path.write_bytes(buf.getvalue())
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", required=True, type=pathlib.Path)
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    ledger = json.loads(LEDGER.read_text()) if LEDGER.exists() else {"assets": {}, "fonts": {}}
    ledger["assets"] = {k: v for k, v in ledger["assets"].items() if k in ITEMS}

    for aid, (src, what, kind, title, credit, (lic, lic_url), rx) in ITEMS.items():
        if args.only and aid not in args.only:
            continue
        if kind == "title":
            page, crop = what.split(":")
            im = frac_crop(pdf_page(fetch(args.cache, src), int(page[4:]), 160), crop)
            im = fit(flatten(im), 1000)
        elif kind == "scan":
            page, crop = what.split(":")
            im = frac_crop(pdf_page(fetch(args.cache, src), int(page[4:]), 200), crop)
            g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(2, 6))
            im = fit(ImageOps.colorize(g, INK, PAPER), rx["w"])
        elif kind == "figure":
            raw = member(args.cache, src, what)
            im = pdf_bytes(raw, rx.get("dpi", 200)) if what.endswith(".pdf") else Image.open(io.BytesIO(raw))
            im = fit(flatten(im), rx["w"])
        else:  # photo
            im = Image.open(fetch(args.cache, src))
            if "box" in rx:
                im = frac_crop(im, ",".join(map(str, rx["box"])))
            im = fit(duotone(flatten(im)), rx["w"])
        path = save(im, aid, q=80 if kind == "photo" else 84)
        ledger["assets"][aid] = {
            "file": f"media/{path.name}", "kind": kind, "title": title, "credit": credit, "licence": lic, "licence_url": lic_url,
            "source": PAGES.get(src, SOURCES[src].replace("/e-print/", "/abs/")), "member": what,
            "treatment": {"photo": "duotone ink→paper", "scan": "greyscale, autocontrast, toned ink→paper", "figure": "none (clipping)",
                          "title": "page-1 crop"}[kind],
            "size": list(im.size), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        print(f"{aid:18s} {im.size[0]}×{im.size[1]}  {path.stat().st_size // 1024} KB")

    try:
        from fontTools import subset
    except ImportError:
        print("fontTools not installed: fonts left as they are")
    else:
        for fid, src in FONTS.items():
            if args.only and fid not in args.only:
                continue
            out = MEDIA / f"font-{fid}.woff2"
            subset.main([str(src), f"--unicodes={UNICODES}", "--flavor=woff2", f"--output-file={out}", "--layout-features=*", "--no-hinting"])
            ledger["fonts"][fid] = {"file": f"media/{out.name}", "source": str(src.relative_to(ROOT)), "licence": "OFL-1.1",
                                    "unicodes": UNICODES, "sha256": hashlib.sha256(out.read_bytes()).hexdigest()}
            print(f"font {fid:13s} {out.stat().st_size // 1024} KB")

    LEDGER.write_text(json.dumps(ledger, indent=1, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
