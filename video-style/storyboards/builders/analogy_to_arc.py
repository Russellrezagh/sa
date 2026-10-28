"""Screenplay → storyboard for "The Relation Under the Surface" (≈10 min, 16:9, dialogue).

Four papers, one thread (the relation that should survive when the surface changes):
  1. Hofstadter & Mitchell (1995) The Copycat project
  2. Stevenson, Pafford, van der Maas & Mitchell (TACL 2026) letter-string transfer, children vs LLMs
  3. Beger, Yi, Fu, Denton, Moskvichev, Tsai, Rajamanickam & Mitchell (NeurIPS 2026) performance vs competence
  4. Beger, Yi & Mitchell (NeurIPS 2026) PotARCin

Every number on screen or in the dialogue was checked against the papers (arXiv 2411.02348v3,
2510.02125v5, 2609.27288v2); see FACTS.md next to this file.

    python3 -I video-style/storyboards/builders/analogy_to_arc.py   # → storyboards/analogy-to-arc.yaml
"""
import copy
import pathlib
import re

import yaml

OUT = pathlib.Path(__file__).resolve().parents[1] / "analogy-to-arc.yaml"
SAM, G = "sam", "guide"
STAGE = (0.56, 0.45)
SAM_AT = {"pose": "neutral", "x": 0.085, "y": 0.745, "scale": 0.55}


def L(who, text, say=None, emph=()):
    line = {"speaker": who, "text": text}
    if say:
        line["say"] = say
    if emph:
        line["emph"] = [{"word": w, "role": r} for w, r in emph]
    return line


def E(id, asset, x=STAGE[0], y=STAGE[1], scale=1.0, at=None, enter=None, **props):
    el = {"id": id, "asset": asset if "@" in asset else f"{asset}@1.0.0", "x": x, "y": y, "scale": scale}
    if at is not None:
        el["at"] = at
    if enter:
        el["enter"] = enter
    if props:
        el["props"] = props
    return el


def label(id, text, x=STAGE[0], y=STAGE[1], style="label", size=None, role="ink", scale=1.0, **kw):
    p = {"text": text, "style": style, "role": role, **kw}
    if size:
        p["size"] = size
    return E(id, "template.label", x, y, scale, **p)


def S(id, lines, els=(), *, header=None, motif="home", path=None, trans="auto", target=None, pose="neutral", sam=True,
      mode=None, layout="center-subject", dur=2.5, crumbs=None, sfx=None, notes=None, echoes=None, first_change=None, split=None):
    s = {"id": id, "duration": dur, "layout": layout, "lines": list(lines), "elements": list(els),
         "motif": {"state": motif, **({"path": path} if path else {})}, "transition_out": {"type": trans, **({"target": target} if target else {})}}
    if header:
        s["header"] = header
    if crumbs:
        s["breadcrumb"] = crumbs
    if mode:
        s["mode"] = mode
    if sam:
        s["cast"] = {SAM: {**SAM_AT, "pose": pose}}
    if sfx:
        s["sfx"] = [{"asset": a, "at": t} for a, t in sfx]
    if notes:
        s["notes"] = notes
    if echoes:
        s["echoes"] = echoes
    if first_change is not None:
        s["first_change"] = first_change
    if not s["elements"]:
        del s["elements"]
    if split:
        s["_split"] = split
    return s


ANCHOR = re.compile(r"^@(\d+)(.*)$")
FUTURE = 999.0  # "not yet": the event belongs to a later part of a split scene


def _remap(obj, a, b):
    """Re-index anchors for the part of a split scene that holds lines [a, b)."""
    if isinstance(obj, dict):
        return {k: _remap(v, a, b) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_remap(v, a, b) for v in obj]
    if isinstance(obj, str):
        m = ANCHOR.match(obj)
        if m:
            i = int(m.group(1))
            return 0 if i < a else FUTURE if i >= b else f"@{i - a}{m.group(2)}"
    return obj


def expand(scene):
    """A long dialogue scene becomes several scenes (same visuals, morph between them) split at line indices.
    Events already past become state; events still ahead wait for their part; elements enter in the part they belong to."""
    ks = scene.pop("_split", None)
    if not ks:
        return [scene]
    bounds = [0, *ks, len(scene["lines"])]
    parts = []
    for j in range(len(bounds) - 1):
        a, b = bounds[j], bounds[j + 1]
        part = copy.deepcopy(scene)
        part["id"] = scene["id"] if j == 0 else f"{scene['id']}-{j + 1}"
        part["lines"] = scene["lines"][a:b]
        els = []
        for el in scene.get("elements", []):
            el = _remap(el, a, b)
            if el.get("at") == FUTURE:
                continue
            els.append(el)
        if els:
            part["elements"] = els
        else:
            part.pop("elements", None)
        if "sfx" in scene:
            part["sfx"] = [x for x in _remap(scene["sfx"], a, b) if x["at"] not in (0, FUTURE)] or None
            if not part["sfx"]:
                del part["sfx"]
        if j:
            part.pop("first_change", None)
        if j < len(bounds) - 2:
            part["transition_out"] = {"type": "morph"}
            part.pop("echoes", None)
        parts.append(part)
    return parts


# ---------------------------------------------------------------------------- shared diagram states
PUZ = dict(x=0.56, y=0.42)
SLIP_NODES = [
    {"id": "a", "label": "a", "x": -560, "y": -40, "depth": 10},
    {"id": "z", "label": "z", "x": 560, "y": -40, "depth": 10},
    {"id": "first", "label": "first", "x": -330, "y": -150, "depth": 60, "x2": -170},
    {"id": "last", "label": "last", "x": 330, "y": -150, "depth": 60, "x2": 170},
    {"id": "opposite", "label": "opposite", "x": 0, "y": -300, "depth": 90},
    {"id": "succ", "label": "successor", "x": -330, "y": 130, "depth": 50, "x2": -170},
    {"id": "pred", "label": "predecessor", "x": 330, "y": 130, "depth": 50, "x2": 170},
    {"id": "same", "label": "sameness", "x": 0, "y": 250, "depth": 80},
]
SLIP_LINKS = [
    {"a": "first", "b": "last", "label": "opposite"}, {"a": "succ", "b": "pred", "label": "opposite"},
    {"a": "a", "b": "first"}, {"a": "z", "b": "last"}, {"a": "same", "b": "succ"}, {"a": "same", "b": "pred"},
]


def slipnet(id="slipnet", scale=0.88, **kw):
    return E(id, "template.slipnet", 0.56, 0.47, scale, nodes=SLIP_NODES, links=SLIP_LINKS, **kw)


LATIN = "a b c d e f g h i j k l"
GREEK = "α β γ δ ε ζ η θ ι κ λ μ"
SYMBOLS = "* @ % ! ^ # ~ $ { ? = :"  # the invented list from Stevenson et al. (2026), §2.1.1

P2_SERIES = [  # Stevenson et al. (2026), Table 2: mean proportion correct (Latin, Greek, Symbol)
    {"name": "adults", "role": "concept-2", "values": [0.88, 0.91, 0.89], "labelDy": -14},
    {"name": "children 7–9", "role": "concept-2", "values": [0.62, 0.66, 0.67], "dashed": True, "labelDy": -6},
    {"name": "GPT-4o", "role": "concept-3", "values": [0.85, 0.63, 0.48], "labelDy": -12},
    {"name": "Claude-3.5", "role": "concept-3", "values": [0.68, 0.62, 0.46], "dashed": True, "labelDy": 22},
    {"name": "Llama-3.1 405B", "role": "concept-3", "values": [0.79, 0.74, 0.27], "labelDy": 0},
    {"name": "Gemma-2 27B", "role": "concept-3", "values": [0.60, 0.39, 0.14], "dashed": True, "labelDy": 0},
]


def p2chart(upto, frm, grow=0.3):
    return E("p2chart", "template.lines", 0.52, 0.4, 1.0, cats=["Latin", "Greek", "Symbols"], series=P2_SERIES, upto=upto, fromUpto=frm,
             growAt=grow, seriesAt=[0.2] * 6, w=1150, h=480, source="Stevenson, Pafford, van der Maas & Mitchell (TACL 2026), Table 2", yLabel="proportion correct")


ARC_DEMO = dict(  # an illustrative ConceptARC-style task ("fill the inside of the closed shape"), drawn for this video
    pairs=[[["00000", "02220", "02020", "02220", "00000"], ["00000", "02220", "02320", "02220", "00000"]],
           [["000000", "044440", "040040", "044440", "000000"], ["000000", "044440", "043340", "044440", "000000"]]],
    test=["0000000", "0111110", "0100010", "0100010", "0111110", "0000000"],
    answer=["0000000", "0111110", "0133310", "0133310", "0111110", "0000000"],
    label="illustrative task (inside / outside)", cell=30,
)

MODELS = ["GPT-5.4", "Gemini 3.1 Pro", "Claude Opus 4.6", "Kimi K2.5", "MiniMax M2.5"]
P4_ARC = [(84.2, 46.6), (89.1, 58.2), (87.6, 37.6), (63.4, 38.6), (72.9, 20.6)]  # PotARCin Table 3, ARC-AGI-1 train
P4_PARC = [(31.0, 6.0), (45.0, 4.0), (64.0, 8.0), (17.0, 2.0), (24.0, 1.0)]      # PotARCin Table 3, P-ARC


def p4bars(data, source, at=0.3):
    return E("p4bars", "template.bars", 0.56, 0.47, 0.85, barsAt=at, stagger=0.12, w=1500, h=420, source=source,
             legend=[{"name": "standard ARC: output grid", "role": "concept-1"}, {"name": "PotARCin: all five uses", "role": "concept-3"}],
             groups=[{"label": m, "bars": [{"v": a, "role": "concept-1"}, {"v": b, "role": "concept-3"}]} for m, (a, b) in zip(MODELS, data)])


# ---------------------------------------------------------------------------- the screenplay
# Visual event times use anchors resolved by tools/dialogue.py from the frozen audio:
#   "@1" start of line 1 · "@1:word" when line 1 says "word" · "@1$" end of line 1 · optional "+0.3"
beats = []

# HOOK ----------------------------------------------------------------------
beats.append(("hook", "HOOK", [
    S("hook-ijk", [
        L(SAM, "Quick puzzle. If abc becomes abd, what does ijk become?", say="Quick puzzle. If A B C becomes A B D, what does I J K become?", emph=[("abd", "emph")]),
        L(G, "Most people say ijl: the last letter moves one step forward.", say="Most people say I J L. The last letter moves one step forward."),
    ], [E("puz", "template.analogy", **PUZ, a="abc", b="abd", c="ijk", d="ijl", dAt="@1:ijl")], header="?", motif="travel", path="across", first_change=0),
    S("hook-iijjkk", [
        L(SAM, "And if it's iijjkk?", say="And if it's I I, J J, K K?"),
        L(G, "Most people say iijjll. They see three pairs, so the whole last pair moves.", say="Most people say I I, J J, L L. They see three pairs, so the whole last pair moves.",
          emph=[("pairs", "concept-5")]),
    ], [E("puz", "template.analogy", **PUZ, scale=0.82, a="abc", b="abd", c="iijjkk", d="iijjll", dAt="@1:iijjll", groupsAt="@1:pairs",
          groups={"c": [[0, 1], [2, 3], [4, 5]], "d": [[0, 1], [2, 3], [4, 5]]})], header="?"),
    S("hook-xyz", [
        L(SAM, "Okay. Then what does xyz become?", say="Okay. Then what does X Y Z become?"),
        L(G, "Careful. Here the alphabet doesn't wrap around. Z has no successor.", emph=[("successor", "thread")]),
    ], [E("puz", "template.analogy", **PUZ, a="abc", b="abd", c="xyz", wall={"index": 2, "at": "@1:successor", "label": "no successor"})], header="?", pose="shrug"),
    S("hook-stakes", [
        L(SAM, "So it's impossible?"),
        L(G, "Hold that thought. That old puzzle still says a lot about today's AI."),
    ], [E("puz", "template.analogy", **PUZ, a="abc", b="abd", c="xyz", wall={"index": 2, "at": 0, "label": "no successor"})], header="?", pose="shrug", trans="carry"),
    S("hook-title", [
        L(G, "Four papers. One question Melanie Mitchell has chased for thirty years."),
        L(SAM, "Which question?"),
        L(G, "Does a mind see the relation, or just the surface?", emph=[("relation", "thread"), ("surface", "concept-1")]),
    ], [label("title", "The Relation Under the Surface", 0.56, 0.36, style="headline", size=104),
        label("subtitle", "Copycat · children vs. LLMs · ConceptARC · PotARCin", 0.56, 0.5, style="mono", size=30, role="ink-soft")],
        motif="underline", path="underline", trans="carry"),
]))

# DEFINE --------------------------------------------------------------------
beats.append(("define", "DEFINE", [
    S("def-core", [
        L(G, "Hofstadter and Mitchell argued analogy isn't a party trick; it's the core of thinking.", say="Hofstatter and Mitchell argued analogy isn't a party trick. It's the core of thinking."),
        L(SAM, "The core? How?"),
    ], [label("claim", "analogy is the core of cognition", 0.56, 0.36, style="caption", size=78, role="concept-5"),
        label("who", "Douglas Hofstadter & Melanie Mitchell", 0.56, 0.5, style="mono", size=28, role="ink-soft")]),
    S("def-perception", [
        L(G, "Recognising anything new means mapping a familiar structure onto it. They called that high-level perception: seeing what the marks mean.",
          emph=[("high-level", "concept-5")]),
        L(SAM, "So seeing is already analogy."),
    ], [E("puz", "template.analogy", 0.56, 0.42, 0.9, a="abc", b="abd", bonds={"a": [[0, 1, "succ"], [1, 2, "succ"]]}, bondsAt="@0:mapping")], pose="point"),
    S("def-slippage", [
        L(SAM, "And when the old structure doesn't fit?"),
        L(G, "A concept slips to its neighbour. Successor slips to predecessor. A letter slips to a group.", emph=[("slips", "thread")]),
    ], [slipnet(activations=[{"at": "@1:Successor", "id": "succ", "v": 0.8}, {"at": "@1:predecessor", "id": "pred", "v": 0.8}],
                slips=[{"at": "@1:predecessor", "from": "succ", "to": "pred"}])]),
    S("def-transfer", [
        L(G, "A real relation shouldn't care what the symbols look like.", emph=[("relation", "thread")]),
        L(G, "a to b. Alpha to beta. Star to at. One step along the list.", say="A to B. Alpha to beta. Star, to at sign. One step along the list."),
    ], [E("latin", "template.alphabet", 0.58, 0.28, 0.85, tokens=LATIN, name="Latin", hops=[{"from": 0, "to": 1, "at": "@1:to", "label": "next"}]),
        E("greek", "template.alphabet", 0.58, 0.45, 0.85, tokens=GREEK, name="Greek", hops=[{"from": 0, "to": 1, "at": "@1:alpha+0.3", "label": "next"}]),
        E("symbols", "template.alphabet", 0.58, 0.62, 0.85, tokens=SYMBOLS, name="symbols", hops=[{"from": 0, "to": 1, "at": "@1:star+0.3", "label": "next"}])]),
    S("def-thread", [
        L(SAM, "So the relation is what stays the same."),
        L(G, "Exactly. A new alphabet is near transfer; arbitrary symbols, far transfer. That idea runs through all four papers.",
          emph=[("near", "concept-1"), ("far", "concept-1")]),
    ], [E("latin", "template.alphabet", 0.58, 0.28, 0.85, tokens=LATIN, name="Latin", hops=[{"from": 0, "to": 1, "at": 0, "label": "next"}]),
        E("greek", "template.alphabet", 0.58, 0.45, 0.85, tokens=GREEK, name="near", hops=[{"from": 0, "to": 1, "at": 0, "label": "next"}]),
        E("symbols", "template.alphabet", 0.58, 0.62, 0.85, tokens=SYMBOLS, name="far", hops=[{"from": 0, "to": 1, "at": 0, "label": "next"}])],
        motif="underline", path="underline", trans="carry"),
]))

# LADDER 1: Copycat ---------------------------------------------------------
cc = []
cc.append(S("cc-cite", [
    L(G, "Paper one, 1995: Hofstadter and Mitchell's Copycat, a program built for exactly these puzzles.", say="Paper one, nineteen ninety-five. Hofstatter and Mitchell's Copycat, a program built for exactly these puzzles."),
    L(SAM, "Why not just write the rules down?"),
], [E("cite1", "template.citation", 0.56, 0.42, 1.0, kicker="PAPER 1 · 1995", title="The Copycat Project: A Model of Mental Fluidity and Analogy-Making",
      authors="Douglas R. Hofstadter & Melanie Mitchell", venue="in Fluid Concepts and Creative Analogies (Basic Books) · see also Mitchell, Analogy-Making as Perception (MIT Press, 1993)")],
    header="Paper 1 · Copycat"))
cc.append(S("cc-why", [
    L(G, "Fixed rules break on iijjkk and on xyz. Copycat bends its concepts instead, using four parts.",
      say="Fixed rules break on I I J J K K, and on X Y Z. Copycat bends its concepts instead, using four parts."),
    L(SAM, "Four parts?"),
], [label("p1", "Slipnet · long-term concepts", 0.38, 0.33, style="caption", size=50, role="concept-5", at="@0:four"),
    label("p2", "Workspace · working memory", 0.74, 0.33, style="caption", size=50, at="@0:four+0.15"),
    label("p3", "Coderack · tiny agents", 0.38, 0.55, style="caption", size=50, at="@0:four+0.3"),
    label("p4", "Temperature · how settled it is", 0.74, 0.55, style="caption", size=50, role="concept-4", at="@0:four+0.45")],
    header="Paper 1 · Copycat", trans="carry"))
cc.append(S("cc-slipnet", [
    L(G, "One: the Slipnet. Long-term memory, full of concepts: a, z, first, last, successor, sameness, opposite.",
      say="One. The Slip net. Long-term memory, full of concepts. A, Z, first, last, successor, sameness, opposite.", emph=[("Slipnet", "concept-5")]),
    L(SAM, "Are they all equal?"),
], [slipnet()], header="the Slipnet"))
cc.append(S("cc-depth", [
    L(G, "No. Shallow concepts, like the letter a, light up fast and fade fast.", say="No. Shallow concepts, like the letter A, light up fast, and fade fast."),
    L(SAM, "And deep ones, like opposite?"),
    L(G, "They need more evidence. But once active, they linger, and colour everything you see.", emph=[("linger", "concept-5")]),
], [slipnet(activations=[{"at": "@0:light", "id": "a", "v": 0.9}, {"at": "@0:fade", "id": "a", "v": 0.1}, {"at": "@2:once", "id": "opposite", "v": 0.95},
                         {"at": "@2:linger", "id": "same", "v": 0.6}])], header="the Slipnet", split=[2]))
cc.append(S("cc-shrink", [
    L(G, "And links have lengths. When opposite is active, every link labelled opposite shrinks.", emph=[("shrinks", "concept-5")]),
    L(SAM, "So first and last get closer?"),
    L(G, "Closer means easier to swap. That's conceptual slippage, built into the geometry.", emph=[("slippage", "thread")]),
], [slipnet(activations=[{"at": 0, "id": "opposite", "v": 0.95}, {"at": 0, "id": "same", "v": 0.6}], shrinkAt="@0:shrinks", slips=[{"at": "@2:slippage", "from": "first", "to": "last"}])],
    header="the Slipnet", split=[2]))
cc.append(S("cc-workspace", [
    L(G, "Two: the Workspace, where the letters sit, and where Copycat builds descriptions, bonds and groups.", emph=[("Workspace", "concept-1")]),
], [E("puz", "template.analogy", 0.56, 0.42, 0.9, a="abc", b="abd", c="xyz", bonds={"a": [[0, 1, "succ"], [1, 2, "succ"]], "c": [[0, 1, "succ"], [1, 2, "succ"]]}, bondsAt="@0:bonds")],
    header="the Workspace"))
cc.append(S("cc-bridges", [
    L(SAM, "And between the two strings?"),
    L(G, "Bridges map one string onto the other. And every object has a salience: how important, and how unhappy."),
    L(SAM, "Unhappy letters?", emph=[("Unhappy", "concept-4")]),
    L(G, "Not yet fitted into any structure. Unhappy things grab attention."),
], [E("puz", "template.analogy", 0.56, 0.42, 0.9, a="abc", b="abd", c="xyz", bonds={"a": [[0, 1, "succ"], [1, 2, "succ"]], "c": [[0, 1, "succ"], [1, 2, "succ"]]}, bondsAt=0)],
    header="the Workspace", pose="shrug", trans="carry", split=[2]))
cc.append(S("cc-codelets", [
    L(G, "Three: codelets. Tiny ant-like agents. Noticers wander bottom-up; seekers are sent top-down by active concepts."),
    L(SAM, "So who's in charge?"),
], [E("ants", "template.codelets", 0.56, 0.45, 1.0, count=44, w=1100, h=420, keys=[{"at": 0, "T": 80}])], header="the Coderack"))
cc.append(S("cc-terraced", [
    L(G, "Nobody. Many paths at once, with more effort on the promising ones. A parallel terraced scan, like ants foraging."),
], [E("ants", "template.codelets", 0.56, 0.45, 1.0, count=44, w=1100, h=420, keys=[{"at": 0, "T": 80}, {"at": "@0:promising", "T": 45}],
      targets=[[-300, -40], [-200, -40], [0, 40], [120, 40], [300, -20]])], header="the Coderack", trans="carry"))
TEMP_TARGETS = [[-300, -40], [-200, -40], [0, 40], [120, 40], [300, -20]]
cc.append(S("cc-temperature", [
    L(G, "Four: temperature. It measures how messy the workspace is, and how random the codelets act.", emph=[("temperature", "concept-4")]),
    L(SAM, "So hot means wild guessing?"),
    L(G, "And as structure forms, it cools, and the choices turn careful."),
], [E("thermo", "template.thermometer", 0.82, 0.45, 0.85, keys=[{"at": 0, "T": 96}, {"at": "@2:structure", "T": 70}, {"at": "@2:cools", "T": 30}]),
    E("ants", "template.codelets", 0.45, 0.45, 0.9, count=44, w=900, h=420, keys=[{"at": 0, "T": 96}, {"at": "@2:structure", "T": 70}, {"at": "@2:cools", "T": 30}],
      targets=TEMP_TARGETS)], header="Temperature", trans="carry", split=[2]))
XYZ = dict(a="abc", b="abd", c="xyz", bonds={"a": [[0, 1, "succ"], [1, 2, "succ"]], "c": [[0, 1, "succ"], [1, 2, "succ"]]}, bondsAt=0, size=84)
cc.append(S("cc-xyz", [
    L(G, "Now xyz. Copycat builds successor groups, cools down, and reaches for the successor of z.",
      say="Now, X Y Z. Copycat builds successor groups, cools down, and reaches for the successor of Z."),
    L(SAM, "And hits the wall."),
], [E("puz", "template.analogy", 0.42, 0.42, 0.9, **XYZ, wall={"index": 2, "at": "@1:wall", "label": "no successor"}),
    E("thermo", "template.thermometer", 0.84, 0.45, 0.8, keys=[{"at": 0, "T": 55}, {"at": "@0:cools", "T": 22}])], header="abc → abd ; xyz → ?"))
cc.append(S("cc-snag", [
    L(G, "Right. The snag sends the temperature soaring. The rigid group breaks, and the concept last lights up.",
      say="Right. The snag sends the temperature soaring. The rigid group breaks, and the concept, last, lights up.", emph=[("snag", "concept-4"), ("last", "concept-5")]),
], [E("puz", "template.analogy", 0.42, 0.42, 0.9, **XYZ, wall={"index": 2, "at": 0, "label": "no successor"}),
    E("thermo", "template.thermometer", 0.84, 0.45, 0.8, keys=[{"at": 0, "T": 22}, {"at": "@0:soaring", "T": 88}])], header="abc → abd ; xyz → ?", pose="shrug", trans="carry"))
cc.append(S("cc-slips", [
    L(G, "With opposite active, first slips to last, and successor slips to predecessor.", emph=[("slips", "thread")]),
    L(SAM, "Like a mirror?"),
    L(G, "Exactly. xyz is seen again from the right: z is last, and the group runs backward.", say="Exactly. X Y Z is seen again from the right. Z is last, and the group runs backward."),
], [slipnet(activations=[{"at": 0, "id": "opposite", "v": 0.95}, {"at": 0, "id": "last", "v": 0.9}, {"at": "@0:first", "id": "first", "v": 0.7}, {"at": "@0:predecessor", "id": "pred", "v": 0.8}],
            shrinkAt=0.2, slips=[{"at": "@0:first+0.2", "from": "first", "to": "last"}, {"at": "@0:successor+0.2", "from": "succ", "to": "pred"}])], header="slippage", split=[1]))
cc.append(S("cc-wyz", [
    L(SAM, "So the first letter goes backward instead?"),
    L(G, "wyz. The mirror image of abc to abd. And as it fits, the temperature falls.", say="W Y Z. The mirror image of A B C to A B D. And as it fits, the temperature falls.",
      emph=[("wyz", "thread")]),
], [E("puz", "template.analogy", 0.42, 0.42, 0.9, a="abc", b="abd", c="xyz", d="wyz", dAt="@1:wyz", size=84, answerRole="thread"),
    E("thermo", "template.thermometer", 0.84, 0.45, 0.8, keys=[{"at": 0, "T": 88}, {"at": "@1:falls", "T": 12}])], header="abc → abd ; xyz → ?", pose="point",
    sfx=[("sfx.ripple-ping@1.0.0", "@1:wyz")], trans="carry"))
cc.append(S("cc-lesson", [
    L(G, "The lesson: keep roles, like successor and first, apart from fillers, the letters that play them.", emph=[("roles", "concept-5"), ("fillers", "concept-1")]),
    L(SAM, "So it would work with any alphabet."),
    L(G, "Hold on to that. It's the whole question of paper two."),
], [label("roles", "roles:  successor · first · group", 0.56, 0.36, style="caption", size=64, role="concept-5", at="@0:roles"),
    label("fillers", "fillers:  a · α · *", 0.56, 0.52, style="caption", size=64, role="concept-1", at="@0:fillers")], header="Paper 1 · Copycat", trans="carry", split=[1]))
beats.append(("copycat", "LADDER", cc))

# LADDER 2: children vs LLMs (setup) ----------------------------------------
p2 = []
p2.append(S("p2-claim", [
    L(G, "Fast forward to 2023. A Nature Human Behaviour paper reported GPT-3 solving these analogies better than college students.",
      say="Fast forward to twenty twenty-three. A Nature Human Behaviour paper reported G P T three solving these analogies better than college students.",
      emph=[("better", "concept-3")]),
    L(SAM, "So analogy just emerged from next-word prediction?"),
], [label("claim23", "“GPT-3 solves letter-string analogies\nbetter than college students”", 0.56, 0.4, style="caption", size=62, role="concept-3"),
    label("webb", "Webb, Holyoak & Lu (2023), Nature Human Behaviour", 0.56, 0.58, style="mono", size=26, role="ink-soft")], header="2023", split=[1]))
p2.append(S("p2-shortcut", [
    L(G, "Mitchell suspected a shortcut. The alphabet is everywhere in training text; maybe models know a, b, c, d by heart, not successor.",
      say="Mitchell suspected a shortcut. The alphabet is everywhere in training text. Maybe models know A, B, C, D by heart, not successor.",
      emph=[("shortcut", "concept-1")]),
], [E("latin", "template.alphabet", 0.56, 0.45, 1.0, tokens=LATIN, name="Latin",
      highlight=[{"i": 0, "role": "concept-1"}, {"i": 1, "role": "concept-1"}, {"i": 2, "role": "concept-1"}, {"i": 3, "role": "concept-1"}])], header="2023", trans="carry"))
p2.append(S("p2-cite", [
    L(SAM, "How would you even test that?"),
    L(G, "Ask children. Claire Stevenson's team tested 42 children aged seven to nine, 62 adults, and four language models.",
      say="Ask children. Claire Stevenson's team tested forty-two children aged seven to nine, sixty-two adults, and four language models.",
      emph=[("children", "concept-2")]),
], [E("cite2", "template.citation", 0.56, 0.42, 1.0, kicker="PAPER 2 · TACL 2026", title="Can Large Language Models Generalize Analogy Solving Like Children Can?",
      authors="Claire E. Stevenson, Alexandra Pafford, Han L. J. van der Maas & Melanie Mitchell", venue="Transactions of the ACL, vol. 14 · arXiv:2411.02348")],
    header="Paper 2 · children vs. LLMs"))
p2.append(S("p2-models", [
    L(SAM, "Kids versus GPT-4o?", say="Kids versus G P T four oh?"),
    L(G, "And Llama 3.1, Claude 3.5 and Gemma 2, with the same instructions the children heard.",
      say="And Lama three point one, Claude three point five, and Gemma two, with the same instructions the children heard."),
], [E("chip", "icon.chip", 0.42, 0.42, 0.7, enter="draw"),
    label("models", "GPT-4o\nLlama-3.1 405B\nClaude-3.5\nGemma-2 27B", 0.62, 0.42, style="mono", size=34, role="concept-3", align="left", w=600, at="@1")],
    header="Paper 2 · children vs. LLMs"))
p2.append(S("p2-alphabets", [
    L(G, "The twist: every puzzle came in three versions. Latin letters, Greek letters, and an invented list of symbols.", emph=[("versions", "concept-1")]),
    L(SAM, "Same puzzles, new alphabets."),
], [E("latin", "template.alphabet", 0.58, 0.28, 0.85, at="@0:Latin", tokens=LATIN, name="Latin"),
    E("greek", "template.alphabet", 0.58, 0.45, 0.85, at="@0:Greek", tokens=GREEK, name="Greek"),
    E("symbols", "template.alphabet", 0.58, 0.62, 0.85, at="@0:invented", tokens=SYMBOLS, name="symbols")], header="Paper 2 · children vs. LLMs"))
p2.append(S("p2-symbol-item", [
    L(SAM, "So star-at becomes star-percent, because percent comes after at?", say="So star, at-sign, becomes star percent, because percent comes after the at-sign?"),
    L(G, "In that list, yes. And the list was on screen every time."),
    L(SAM, "So what happened?"),
], [E("symbols", "template.alphabet", 0.58, 0.26, 0.85, tokens=SYMBOLS, name="symbols", hops=[{"from": 1, "to": 2, "at": "@0:because", "label": "next"}]),
    E("puzS", "template.analogy", 0.58, 0.55, 0.85, a="*@", b="*%", c="~$", d="~{", dAt="@1:yes")], header="Paper 2 · children vs. LLMs", pose="point", trans="wash"))
beats.append(("transfer-setup", "LADDER", p2))

# TURN: strip the alphabet (night) -----------------------------------------
NIGHT = dict(mode="night", motif="pulse", path="strip", layout="full-bleed-texture")
tn = []
tn.append(S("turn-latin", [
    L(G, "Listen. Familiar Latin letters first. Adults 88 percent. GPT-4o 85. Llama 79. Children 62.",
      say="Listen. Familiar Latin letters first. Adults, eighty-eight percent. G P T four oh, eighty-five. Lama, seventy-nine. Children, sixty-two.",
      emph=[("Children", "concept-2")]),
    L(SAM, "So the models beat the kids."),
], [p2chart(1, 0)], header="Latin", **NIGHT, split=[1]))
tn.append(S("turn-greek", [
    L(G, "Now take away the Latin letters. Greek: adults 91, children 66. GPT-4o drops to 63; Gemma to 39.",
      say="Now take away the Latin letters. Greek. Adults ninety-one, children sixty-six. G P T four oh drops to sixty-three. Gemma, to thirty-nine.",
      emph=[("Greek", "concept-1")]),
], [p2chart(2, 1, grow="@0:Greek")], header="Latin → Greek", **NIGHT))
tn.append(S("turn-symbols", [
    L(SAM, "And symbols?"),
    L(G, "Adults 89. Children 67. GPT-4o 48. Llama 27. Gemma 14.",
      say="Adults, eighty-nine. Children, sixty-seven. G P T four oh, forty-eight. Lama, twenty-seven. Gemma, fourteen."),
], [p2chart(3, 2, grow="@1")], header="Latin → Greek → Symbols", **NIGHT))
tn.append(S("turn-flat", [
    L(SAM, "The kids didn't even notice the change.", emph=[("kids", "concept-2")]),
    L(G, "Their lines stay flat. Every model's line falls, Latin to Greek, and again to symbols.", emph=[("flat", "concept-2"), ("falls", "concept-3")]),
], [p2chart(3, 3)], header="Latin → Greek → Symbols", **NIGHT))
tn.append(S("turn-why", [
    L(SAM, "But why? The list was right there."),
    L(G, "Repeating a symbol is fine. But two steps along the list, or one step back, and the models stumble.", emph=[("Repeating", "concept-1")]),
], [E("symbols", "template.alphabet", 0.56, 0.36, 1.0, tokens=SYMBOLS, name="symbols", hops=[{"from": 3, "to": 5, "at": "@1:two", "label": "+2"}, {"from": 8, "to": 7, "at": "@1:back", "label": "−1"}]),
    label("rep", "repeat ✓     +2 ✗     −1 ✗", 0.56, 0.58, style="mono", size=34, role="concept-3", at="@1:stumble")],
    header="why?", **NIGHT))
tn.append(S("turn-literal", [
    L(G, "Some even answered literally, copying the letter instead of shifting it. Adults never did."),
    L(SAM, "So kids carry the relation. Models leave it glued to letters.", emph=[("relation.", "thread")]),
], [label("glued", "successor( a ) = b", 0.56, 0.4, style="caption", size=80, role="concept-1"),
    label("free", "successor( x ) = the next item in this list", 0.56, 0.56, style="caption", size=56, role="concept-5", at="@1:carry")],
    header="why?", notes="The authors' reading: LLMs seem to need an in-weight representation of an ordered alphabet (Stevenson et al., §5).", trans="wash",
    **NIGHT))
beats.append(("turn", "TURN", tn))

# LADDER 3: performance vs competence ---------------------------------------
p3 = []
p3.append(S("p3-arc", [
    L(G, "Same question, harder world: a benchmark called ARC. A few example grids show a change; you produce the output for a new one.",
      say="Same question, harder world. A benchmark called Ark. A few example grids show a change. You produce the output for a new one."),
    L(SAM, "Like a visual IQ test."),
], [E("arc", "template.arc", 0.56, 0.47, 1.0, **ARC_DEMO, answerAt="@0:output")], header="ARC", trans="carry"))
p3.append(S("p3-cite", [
    L(G, "Paper three, from Claas Beger, Ryan Yi, Mitchell and colleagues. Reasoning models had already overtaken people on ARC.",
      say="Paper three, from Klaas Bayger, Ryan Yee, Mitchell and colleagues. Reasoning models had already overtaken people on Ark."),
    L(SAM, "So abstraction is solved?"),
], [E("cite3", "template.citation", 0.56, 0.42, 1.0, kicker="PAPER 3 · NEURIPS 2026", title="Distinguishing Performance From Competence in Evaluations of Humanlike Abstract Reasoning",
      authors="Claas Beger, Ryan Yi, Shuhao Fu, Kaleda Denton, Arseny Moskvichev, Sarah W. Tsai, Sivasankaran Rajamanickam & Melanie Mitchell", venue="NeurIPS 2026 · arXiv:2510.02125")],
    header="Paper 3 · performance vs. competence"))
p3.append(S("p3-pvc", [
    L(G, "That's the question. Performance is the score. Competence is the ability the score is meant to measure.",
      emph=[("Performance", "concept-1"), ("Competence", "concept-5")]),
    L(SAM, "Like memorising the answer key?"),
    L(G, "Exactly: performance without competence."),
], [label("perf", "performance", 0.38, 0.42, style="caption", size=90, role="concept-1", at="@0:Performance"),
    label("ne", "≠", 0.56, 0.42, style="caption", size=90, role="ink-soft", at="@0:Competence"),
    label("comp", "competence", 0.73, 0.42, style="caption", size=90, role="concept-5", at="@0:Competence")], header="Paper 3 · performance vs. competence", split=[1]))
p3.append(S("p3-conceptarc", [
    L(G, "ARC rests on core knowledge. ConceptARC isolates it: 480 easy tasks, each about one concept, like inside versus outside.",
      say="Ark rests on core knowledge. Concept Ark isolates it. Four hundred and eighty easy tasks, each about one concept, like inside versus outside.",
      emph=[("core", "concept-5")]),
    L(SAM, "Easy for people, then."),
], [label("carc", "ConceptARC: 16 concepts × 30 tasks = 480", 0.56, 0.24, style="mono", size=32, role="ink-soft"),
    E("arc", "template.arc", 0.56, 0.52, 0.85, **ARC_DEMO, answerAt=0)], header="Paper 3 · performance vs. competence", split=[1]))
p3.append(S("p3-text", [
    L(SAM, "How do the models see the grids?"),
    L(G, "Usually as text: rows of numbers, zero to nine, one per cell.", emph=[("numbers", "concept-1")]),
    L(SAM, "So we see shapes, and they see spreadsheets."),
], [label("carc", "ConceptARC: 16 concepts × 30 tasks = 480", 0.56, 0.24, style="mono", size=32, role="ink-soft"),
    E("arc", "template.arc", 0.56, 0.52, 0.85, **ARC_DEMO, answerAt=0, digitsAt="@1:rows")], header="Paper 3 · performance vs. competence", pose="point"))
p3.append(S("p3-design", [
    L(G, "They varied text or images, reasoning effort, and Python tools. And every solver had to state its rule.", emph=[("rule", "concept-5")]),
], [E("arc", "template.arc", 0.56, 0.52, 0.85, **ARC_DEMO, answerAt=0, digitsAt=0, digitsOutAt="@0:images"),
    label("carc", "ConceptARC: 16 concepts × 30 tasks = 480", 0.56, 0.24, style="mono", size=32, role="ink-soft")],
    header="Paper 3 · performance vs. competence", trans="carry"))
p3.append(S("p3-grades", [
    L(G, "People graded every rule. Correct and intended. Correct but unintended: right answer, wrong reason. Or just incorrect.",
      emph=[("intended.", "concept-5"), ("unintended:", "emph")]),
], [E("r1", "template.rule", 0.56, 0.24, 0.9, w=1050, who="a person", text="Remove the top object and the bottom object.", verdict="correct-intended", verdictAt="@0:intended", quoteStyle="serif"),
    E("r2", "template.rule", 0.56, 0.44, 0.9, w=1050, who="a model", text="Sort shapes by size, then by color code; delete the first two.", verdict="correct-unintended", verdictAt="@0:unintended"),
    E("r3", "template.rule", 0.56, 0.64, 0.9, w=1050, who="a model", text="Delete every smallest object.", verdict="incorrect", verdictAt="@0:incorrect")],
    header="grading the rules"))
P3SRC = "Beger et al. (NeurIPS 2026), Table 1: pass@1 on 480 ConceptARC tasks"
p3.append(S("p3-score", [
    L(G, "In text, o3 at medium effort solved 77 percent of grids. Humans, looking at pictures, 73.",
      say="In text, oh three at medium effort solved seventy-seven percent of grids. Humans, looking at pictures, seventy-three."),
    L(SAM, "So o3 wins.", say="So oh three wins."),
], [E("p3bars", "template.bars", 0.56, 0.47, 0.9, barsAt="@0:solved", stagger=1.6, w=900, h=420, source=P3SRC,
      groups=[{"label": "o3 · text", "bars": [{"v": 77.1, "role": "concept-3"}]}, {"label": "humans · images", "bars": [{"v": 73.0, "role": "concept-2"}]}])],
    header="Paper 3 · text"))
p3.append(S("p3-unintended", [
    L(G, "On output. But a quarter of o3's right answers rested on unintended or wrong rules. Humans: about seven percent.",
      say="On output. But a quarter of oh three's right answers rested on unintended or wrong rules. Humans, about seven percent.",
      emph=[("unintended", "emph")]),
], [E("p3bars", "template.bars", 0.56, 0.47, 0.9, barsAt=0, w=900, h=420, source="Beger et al. (NeurIPS 2026), §4: ~27% of o3's correct text outputs vs ~7% of humans'",
      groups=[{"label": "o3 · text", "bars": [{"v": 77.1, "role": "concept-3"}]}, {"label": "humans · images", "bars": [{"v": 73.0, "role": "concept-2"}]}]),
    label("q1", "≈ 27% of o3's right answers: unintended or wrong rule\n≈ 7% for humans", 0.56, 0.2, style="mono", size=28, role="emph", at="@0:quarter")],
    header="Paper 3 · text", trans="carry"))
p3.append(S("p3-example", [
    L(G, "One task: remove the top and bottom objects. A person says just that. Gemini sorted shapes by size, then colour number.",
      emph=[("Gemini", "concept-3")]),
    L(SAM, "But colour numbers are just labels!"),
    L(G, "Exactly. A pattern that exists only because colours became numbers."),
], [E("r1", "template.rule", 0.31, 0.42, 0.9, w=820, who="human · ConceptARC study", text="Simply remove the top object and the bottom object only.", verdict="correct-intended",
      verdictAt="@0:person", quoteStyle="serif"),
    E("r2", "template.rule", 0.76, 0.42, 0.9, w=820, who="Gemini 2.5 Pro · text, medium effort", at="@0:Gemini",
      text="Sort these shapes by size, then by color value as a tie-breaker. Remove the two shapes that come first.", verdict="correct-unintended", verdictAt="@1")],
    header="a shortcut", notes="Rule texts abridged from Beger et al. (2026), §3 (Figure 1 discussion).", split=[1]))
p3.append(S("p3-words", [
    L(G, "You can hear it in the words. People say object, shape, inside. Models say row, column, cell.", emph=[("object,", "concept-5"), ("cell.", "concept-1")]),
    L(SAM, "Objects versus cells."),
], [label("hw", "people:\nobject · shape · inside · border", 0.36, 0.42, style="caption", size=52, role="concept-5", at="@0:People"),
    label("mw", "models:\nrow · column · cell · index", 0.76, 0.42, style="mono", size=36, role="concept-1", at="@0:Models")], header="a shortcut", trans="carry"))
p3.append(S("p3-images", [
    L(SAM, "So show them pictures, like us."),
    L(G, "They did. With images and no tools, o3 fell below six percent.", say="They did. With images and no tools, oh three fell below six percent.", emph=[("fell", "concept-3")]),
], [E("p3vis", "template.bars", 0.56, 0.47, 0.9, barsAt="@1:images", stagger=1.2, w=1000, h=420, source="Beger et al. (NeurIPS 2026), Table 1 (o3, medium effort)",
      groups=[{"label": "o3 · text", "bars": [{"v": 77.1, "role": "concept-3"}]}, {"label": "o3 · images", "bars": [{"v": 5.6, "role": "concept-3"}]}])],
    header="Paper 3 · images"))
p3.append(S("p3-blind", [
    L(G, "Yet their rules were often right: the shape, the inside, the symmetry. Then they botched the grid.", emph=[("right:", "concept-5")]),
    L(SAM, "Botched it how?"),
    L(G, "Often they couldn't even read the grid's size off the picture.", emph=[("size", "concept-1")]),
], [E("arcbad", "template.arc", 0.56, 0.5, 0.85, **{k: v for k, v in ARC_DEMO.items() if k != "answer"},
      bad=["000000", "011110", "013310", "011110", "000000"], badAt="@2:size", badNote="right idea · wrong size (5×6, not 6×7)")],
    header="Paper 3 · images", notes="The malformed grid is illustrative; the paper reports models struggle to recognise grid size from image inputs.", split=[1]))
p3.append(S("p3-python", [
    L(G, "Give o3 Python, and its image score jumps to 29 percent. It writes computer-vision code to measure the grid.",
      say="Give oh three Python, and its image score jumps to twenty-nine percent. It writes computer vision code to measure the grid."),
    L(SAM, "A prosthetic eye!"),
], [E("p3vis2", "template.bars", 0.56, 0.47, 0.9, barsAt="@0:jumps", stagger=0.4, w=1100, h=420, source="Beger et al. (NeurIPS 2026), Table 1 (o3, medium effort)",
      groups=[{"label": "images", "bars": [{"v": 5.6, "role": "concept-3"}]}, {"label": "images + Python", "bars": [{"v": 29.2, "role": "concept-3"}]}])],
    header="Paper 3 · images"))
p3.append(S("p3-intended", [
    L(G, "And there, 40 percent of its rules were the intended ones: more than the 29 percent of grids it got right.",
      say="And there, forty percent of its rules were the intended ones. More than the twenty-nine percent of grids it got right.", emph=[("intended", "concept-5")]),
    L(SAM, "So it understood more than it showed."),
], [E("p3vis3", "template.bars", 0.56, 0.47, 0.9, barsAt="@0:40", stagger=1.8, w=1100, h=420, source="Beger et al. (NeurIPS 2026), §4: o3, images, medium effort + tools",
      groups=[{"label": "intended rule", "bars": [{"v": 40.0, "role": "concept-5"}]}, {"label": "correct grid", "bars": [{"v": 29.2, "role": "concept-3"}]}])],
    header="Paper 3 · images", trans="carry"))
p3.append(S("p3-lesson", [
    L(SAM, "So accuracy misleads both ways?"),
    L(G, "Yes. In text it overestimates understanding. In images it underestimates it.", emph=[("overestimates", "concept-1"), ("underestimates", "concept-5")]),
], [label("over", "text: accuracy overestimates competence", 0.56, 0.38, style="caption", size=64, role="concept-1", at="@1:text"),
    label("under", "images: accuracy underestimates competence", 0.56, 0.52, style="caption", size=64, role="concept-5", at="@1:images")],
    header="Paper 3 · performance vs. competence", trans="carry"))
beats.append(("competence", "LADDER", p3))

# LADDER 4: PotARCin ---------------------------------------------------------
p4 = []
p4.append(S("p4-potemkin", [
    L(SAM, "So what does real understanding look like?"),
    L(G, "Start with a legend. In 1787, Catherine the Great toured Crimea, and supposedly Potemkin built fake village fronts for her.",
      say="Start with a legend. In seventeen eighty-seven, Catherine the Great toured Crimea, and supposedly Potemkin built fake village fronts for her."),
], [E("facade", "icon.facade", 0.56, 0.6, 1.5, enter="draw", at="@1:fake")], header="Potemkin villages"))
p4.append(S("p4-pu", [
    L(G, "Perfect facades, nothing behind. Potemkin understanding means acing the hard question while failing easy uses of the same idea.",
      emph=[("facades,", "concept-3")]),
], [E("facade", "icon.facade", 0.56, 0.6, 1.5),
    label("pu", "Potemkin understanding (Mancoridis et al., 2025)", 0.56, 0.2, style="mono", size=30, role="ink-soft", at="@0:Potemkin")], header="Potemkin villages", trans="carry"))
p4.append(S("p4-cite", [
    L(G, "Paper four: PotARCin, Potemkin plus ARC. If you've truly learned a rule, you can use it in more than one way.",
      say="Paper four. Pot Arkin. That is, Potemkin, plus Ark. If you've truly learned a rule, you can use it in more than one way."),
    L(SAM, "Like what?"),
], [E("cite4", "template.citation", 0.56, 0.42, 1.0, kicker="PAPER 4 · NEURIPS 2026", title="PotARCin: Multi-Dimensional Evaluation of Skill Acquisition in Abstract Reasoning Tasks",
      authors="Claas Beger, Ryan Yi & Melanie Mitchell", venue="NeurIPS 2026 · arXiv:2609.27288 · data: P-ARC on Hugging Face")],
    header="Paper 4 · PotARCin"))
DIMS = ["Definition", "Classification", "Generation", "Editing", "Inversion"]
NOTES = ["write the rule as code", "spot the broken pairs", "invent a new example", "repair a broken pair", "output → input"]
p4.append(S("p4-dims-a", [
    L(G, "Five ways. Definition: write the rule as code. Classification: spot which examples break it.", emph=[("Definition:", "concept-5"), ("Classification:", "concept-5")]),
], [E("dims", "template.dimensions", 0.56, 0.47, 0.8, center="one rule", dims=DIMS, notes=NOTES)], header="Paper 4 · five uses of one rule"))
p4.append(S("p4-dims-b", [
    L(G, "Generation: invent a valid new example. Editing: minimally repair a broken one. Inversion: from an output, build an input.",
      emph=[("Inversion:", "concept-5")]),
    L(SAM, "So: define it, check it, make one, fix one, reverse it."),
], [E("dims", "template.dimensions", 0.56, 0.47, 0.8, center="one rule", dims=DIMS, notes=NOTES)], header="Paper 4 · five uses of one rule", split=[1]))
p4.append(S("p4-verifier", [
    L(SAM, "Who grades all that?"),
    L(G, "Code. Each task has a generator for fresh examples, and a verifier that checks any pair.", emph=[("verifier", "concept-5")]),
    L(G, "The broken examples are subtle. The hardest to catch? Real human mistakes."),
], [E("arcbad2", "template.arc", 0.56, 0.5, 0.8, pairs=ARC_DEMO["pairs"], test=ARC_DEMO["test"], cell=30,
      bad=["0000000", "0111110", "0133310", "0131310", "0111110", "0000000"], badAt="@2:subtle", badNote="a near miss: one cell wrong")],
    header="Paper 4 · generators & verifiers", trans="carry", split=[2]))
p4.append(S("p4-models", [
    L(G, "Five frontier models took the test, including GPT-5.4, Gemini 3.1 Pro and Claude Opus 4.6.",
      say="Five frontier models took the test, including G P T five point four, Gemini three point one Pro, and Claude Opus four point six."),
    L(SAM, "The big names."),
], [E("chip", "icon.chip", 0.36, 0.45, 0.7, enter="draw"),
    label("models4", "\n".join(MODELS), 0.56, 0.45, style="mono", size=34, role="concept-3", align="left", w=600, at="@0:test")], header="Paper 4 · PotARCin"))
P4SRC = "Beger, Yi & Mitchell (NeurIPS 2026), Table 3: ARC-AGI-1 training set, pooled over two runs"
p4.append(S("p4-result", [
    L(G, "On the public ARC set, the big three get the output grid right 84 to 89 percent of the time.",
      say="On the public Ark set, the big three get the output grid right eighty-four to eighty-nine percent of the time."),
    L(SAM, "And all five uses?"),
    L(G, "The best model, 58 percent. The weakest, 21.", say="The best model, fifty-eight percent. The weakest, twenty-one.", emph=[("weakest,", "concept-3")]),
], [p4bars(P4_ARC, P4SRC, at="@0:output")], header="Paper 4 · ARC-AGI-1", split=[1]))
p4.append(S("p4-rank", [
    L(SAM, "Same models, different ranking?"),
    L(G, "Yes. Gemini and Claude tie on the standard test, but Gemini leads by twenty points on all five."),
], [p4bars(P4_ARC, P4SRC, at=0)], header="Paper 4 · ARC-AGI-1", trans="carry"))
p4.append(S("p4-luck", [
    L(SAM, "Isn't that just five chances to get unlucky?"),
    L(G, "They checked. Five different questions caught more failures than one question asked five times: 25.5 percent against 20.",
      say="They checked. Five different questions caught more failures than one question asked five times. Twenty-five and a half percent, against twenty."),
], [E("luck", "template.bars", 0.56, 0.47, 0.9, barsAt="@1:caught", stagger=1.0, w=1000, h=400, source="Beger, Yi & Mitchell (NeurIPS 2026), §3.1: GPT-5.4, 20 tasks × 10 repeats (p = 0.030)",
      groups=[{"label": "five different dimensions", "bars": [{"v": 25.5, "role": "concept-3"}]}, {"label": "one dimension × 5", "bars": [{"v": 20.2, "role": "concept-1"}]}])],
    header="Paper 4 · is it just luck?", split=[1]))
p4.append(S("p4-self", [
    L(G, "Stranger still: a model can write correct code for the rule, then, in another window, contradict its own code.", emph=[("contradict", "concept-3")]),
    L(SAM, "It doesn't believe its own code?"),
    L(G, "It doesn't use it. When its other answer was wrong, it agreed with its own correct code only one time in five."),
], [E("dims", "template.dimensions", 0.56, 0.5, 0.8, center="one rule", dims=DIMS, notes=NOTES, highlight=0,
      marks=[{"at": "@0:correct", "i": 0, "ok": True}, {"at": "@0:contradict", "i": 1, "ok": False}, {"at": "@0:contradict+0.4", "i": 2, "ok": False},
             {"at": "@0:contradict+0.8", "i": 4, "ok": False}]),
    label("agree", "agreement with its own correct program when the other answer is wrong: 21%", 0.56, 0.08, style="mono", size=24, role="ink-soft", at="@2")],
    pose="shrug", notes="21.1% pooled on ARC-AGI-1 (PotARCin, §3.4 / Table 4).", split=[1]))
p4.append(S("p4-churn", [
    L(G, "Even the wins wobble. GPT-5.4 passed 185 tasks in one run, 188 in another. Only 146 were the same.",
      say="Even the wins wobble. G P T five point four passed a hundred and eighty-five tasks in one run, a hundred and eighty-eight in another. Only a hundred and forty-six were the same."),
    L(SAM, "So the passes aren't stable."),
], [E("venn", "template.venn", 0.56, 0.47, 0.9, at="@0:passed", a={"label": "run 1: tasks passed", "n": 185}, b={"label": "run 2: tasks passed", "n": 188}, both=146,
      note="Jaccard similarity 0.64", source="PotARCin, Table 7 (GPT-5.4, all five dimensions)")], header="Paper 4 · the wins wobble", trans="carry", split=[1]))
P4PSRC = "Beger, Yi & Mitchell (NeurIPS 2026), Table 3: P-ARC, 50 held-out tasks, two runs"
p4.append(S("p4-parc", [
    L(SAM, "And on puzzles they've never seen?"),
    L(G, "They built a new set, P-ARC: fifty new hand-made tasks. Passing all five uses: between one and eight percent.",
      say="They built a new set, called P, Ark. Fifty new, hand-made tasks. Passing all five uses: between one and eight percent.", emph=[("eight", "concept-3")]),
], [p4bars(P4_PARC, P4PSRC, at="@1:Passing")], header="Paper 4 · P-ARC (never seen)"))
p4.append(S("p4-joke", [
    L(SAM, "So it's a Potemkin village with a leaderboard."),
], [p4bars(P4_PARC, P4PSRC, at=0), E("facade", "icon.facade", 0.86, 0.36, 0.6, enter="draw", at="@0:Potemkin")],
    header="Paper 4 · P-ARC (never seen)", pose="shrug", trans="carry"))
beats.append(("potarcin", "LADDER", p4))

# RULE ------------------------------------------------------------------------
beats.append(("rule", "RULE", [
    S("rule-1", [
        L(SAM, "So a right answer isn't proof. Test the relation, not the surface.", emph=[("relation,", "thread"), ("surface.", "concept-1")]),
        L(G, "Exactly. Change the alphabet, the format, the question, and see whether the rule survives."),
    ], [label("rule", "performance ≠ competence", 0.56, 0.4, style="caption", size=96, role="ink")], motif="underline", path="underline", split=[1]),
    S("rule-2", [
        L(G, "Copycat showed what that takes: roles kept apart from fillers, and the freedom to see a problem anew.", emph=[("roles", "concept-5"), ("fillers,", "concept-1")]),
    ], [label("s1", "1995 · Copycat: roles apart from fillers", 0.56, 0.24, style="mono", size=30),
        label("s2", "2026 · children carry the relation to new symbols; LLMs don't", 0.56, 0.34, style="mono", size=30),
        label("s3", "2026 · read the rule, not just the grid", 0.56, 0.44, style="mono", size=30),
        label("s4", "2026 · one rule, five uses: P-ARC 1–8%", 0.56, 0.54, style="mono", size=30)],
        motif="home", trans="carry"),
]))

# RETURN ----------------------------------------------------------------------
beats.append(("return", "RETURN", [
    S("ret-wyz", [
        L(SAM, "So if abc becomes abd... xyz becomes wyz.", say="So if A B C becomes A B D... X Y Z becomes W Y Z.", emph=[("wyz.", "thread")]),
        L(G, "You made the slip yourself. That's a relation surviving the wall."),
    ], [E("puz", "template.analogy", **PUZ, a="abc", b="abd", c="xyz", d="wyz", dAt="@0:wyz", answerRole="thread")], header="?",
        motif="travel", path="across", echoes="hook-ijk", trans="end-loop", pose="point"),
]))


def build():
    meta = {
        "id": "analogy-to-arc", "title": "The Relation Under the Surface", "format": "landscape", "fps": 30, "mode": "paper", "seed": 1995,
        "voice": {"register": "explainer"}, "pulse": {"bpm": 70, "asset": "bed.pulse-70@1.0.0"},
        "fonts": ["font.instrument-serif@1.0.0", "font.inter@1.0.0", "font.jetbrains-mono@1.0.0"],
        "dialogue": {"mode": "curious", "speakers": [
            {"id": G, "role": "guide", "name": "Guide", "voice": "voice.joe@1.0.0", "length_scale": 0.81},
            {"id": SAM, "role": "learner", "name": "Sam", "voice": "voice.alba@1.0.0", "character": "character.everyperson@1.0.0", "length_scale": 0.95}]},
    }
    board = {
        "meta": meta,
        "motif": {"asset": "motif.thread@1.0.0", "meaning": "The relation itself: the structure that should stay the same while the surface (letters, symbols, pixels, formats) changes."},
        "concepts": [
            {"name": "surface (tokens, digits, pixels)", "role": "concept-1"},
            {"name": "humans", "role": "concept-2"},
            {"name": "models", "role": "concept-3"},
            {"name": "pressure / temperature", "role": "concept-4"},
            {"name": "concepts / competence", "role": "concept-5"},
        ],
        "cast": ["character.everyperson@1.0.0"],
        "beats": [{"id": bid, "type": t, "scenes": [p for sc in scenes for p in expand(sc)]} for bid, t, scenes in beats],
    }
    # "auto" transitions: morph when an element carries over to the next scene, otherwise draw-through
    flat = [sc for be in board["beats"] for sc in be["scenes"]]
    for cur, nxt in zip(flat, flat[1:] + [None]):
        if cur["transition_out"]["type"] == "auto":
            ids = lambda x: {e["id"] for e in (x or {}).get("elements", [])}
            cur["transition_out"]["type"] = "morph" if ids(cur) & ids(nxt) else "draw-through"
    header = ("# GENERATED by storyboards/builders/analogy_to_arc.py: edit the builder, not this file.\n"
              "# Next: python3 -I video-style/tools/dialogue.py video-style/storyboards/analogy-to-arc.yaml\n")
    OUT.write_text(header + yaml.safe_dump(board, sort_keys=False, allow_unicode=True, width=160))
    n = sum(len(b["scenes"]) for b in board["beats"])
    words = sum(len(l["text"].split()) for _, _, ss in beats for s in ss for l in s["lines"])
    gw = sum(len(l["text"].split()) for _, _, ss in beats for s in ss for l in s["lines"] if l["speaker"] == G)
    print(f"wrote {OUT.name}: {n} scenes, {words} words (guide {gw / words:.0%})")


if __name__ == "__main__":
    build()
