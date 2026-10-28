"""Precompute every grid the explainer shows, and assert the claims the pages make about them.

The page never computes a rule at view time: it animates the data written here. Each claim
the dialogue makes about a grid ("Gemini's rule fits every demo but misses the test") is an
assertion below, so a wrong claim fails the build instead of reaching the page.

    python3 -I video-style/explainers/analogy-to-arc/data.py   # → data.json (byte-stable)
"""
import json
import pathlib
import random

HERE = pathlib.Path(__file__).resolve().parent
TASKS = HERE / "tasks"
OUT = HERE / "data.json"


def load(name):
    return json.loads((TASKS / name).read_text())


def copy(g):
    return [row[:] for row in g]


def components(g, same_colour=True, diagonal=False):
    """Connected non-zero objects as lists of (r, c). Same-colour, 4-connected by default."""
    h, w = len(g), len(g[0])
    seen, out = set(), []
    steps = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (1, -1), (-1, 1), (-1, -1)] if diagonal else [])
    for r in range(h):
        for c in range(w):
            if g[r][c] == 0 or (r, c) in seen:
                continue
            col, stack, cells = g[r][c], [(r, c)], []
            seen.add((r, c))
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for dy, dx in steps:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and (ny, nx) not in seen and g[ny][nx] != 0 and (not same_colour or g[ny][nx] == col):
                        seen.add((ny, nx))
                        stack.append((ny, nx))
            out.append(sorted(cells))
    return out


def erase(g, objs):
    g = copy(g)
    for cells in objs:
        for y, x in cells:
            g[y][x] = 0
    return g


# ------------------------------------------------------------------ Beger et al. Figure 1, task 1
# Rules quoted in Beger et al. (2026), §3. Each is implemented as literally as its wording allows.
def rule_top_bottom(g):
    """Human / Claude Sonnet 4: remove the top object and the bottom object."""
    objs = components(g)
    top = min(objs, key=lambda o: min(y for y, _ in o))
    bottom = max(objs, key=lambda o: max(y for y, _ in o))
    return erase(g, [top, bottom])


def rule_gemini(g):
    """Gemini 2.5 Pro: sort shapes by size (cells) ascending, then by colour value; remove the first two."""
    objs = components(g)
    objs.sort(key=lambda o: (len(o), g[o[0][0]][o[0][1]]))
    return erase(g, objs[:2])


def rule_o3(g):
    """o3: remove every connected component that has the minimum area."""
    objs = components(g)
    m = min(len(o) for o in objs)
    return erase(g, [o for o in objs if len(o) == m])


def diff(a, b):
    if len(a) != len(b) or len(a[0]) != len(b[0]):
        return None
    return [[r, c] for r in range(len(a)) for c in range(len(a[0])) if a[r][c] != b[r][c]]


def run_rule(task, fn):
    rows = []
    for p in task["train"] + task["test"][:1]:
        got = fn(p["input"])
        rows.append({"output": got, "ok": got == p["output"], "wrong": diff(got, p["output"])})
    return rows


tb = load("conceptarc-TopBottom2D4.json")
TB_RULES = {
    "human": (rule_top_bottom, "Use the same grid size as in the input. There will be multiple objects. Simply remove the top object and the bottom object only."),
    "claude": (rule_top_bottom, "Remove the topmost and bottommost colored regions, keep all colored regions in between."),
    "gemini": (rule_gemini, "Identify all connected shapes of non-zero numbers. Sort these shapes first by their size (number of cells) in ascending order, then by their color value in ascending order as a tie-breaker. Remove the two shapes that come first in this sorted list, and keep all other shapes."),
    "o3": (rule_o3, "Remove all smallest objects: find each connected non-zero color component, count its cells, identify the minimum area, and delete every component having that minimum size (replace its cells with 0); leave every other cell unchanged."),
}
tb_runs = {k: run_rule(tb, fn) for k, (fn, _) in TB_RULES.items()}
n_demo = len(tb["train"])
assert all(r["ok"] for r in tb_runs["human"]), "human rule must solve every demo and the test"
assert all(r["ok"] for r in tb_runs["gemini"][:n_demo]) and not tb_runs["gemini"][n_demo]["ok"], \
    "paper: Gemini's rule fits the demonstrations (correct-unintended) but its output grid was incorrect"
assert not all(r["ok"] for r in tb_runs["o3"][:n_demo]), "paper: o3's rule does not account for all demonstrations (incorrect)"


# ------------------------------------------------------------------ Beger et al. Figure 1, task 2
def rule_middle(row):
    return row[len(row) // 2]


def rule_claude_center(row):
    """Claude: values with the minimum frequency, sorted ascending; the second smallest if several, else the only one."""
    freq = {v: row.count(v) for v in row}
    m = min(freq.values())
    vals = sorted(v for v in freq if freq[v] == m)
    return vals[1] if len(vals) > 1 else vals[0]


ce = load("conceptarc-Center2.json")
ce_items = [p["input"][0] for p in ce["train"] + ce["test"]]
ce_truth = [p["output"][0][0] for p in ce["train"] + ce["test"]]
ce_claude = [rule_claude_center(r) for r in ce_items]
assert [rule_middle(r) for r in ce_items] == ce_truth
assert ce_claude[: len(ce["train"]) + 1] == ce_truth[: len(ce["train"]) + 1], "paper: Claude's rule gives the correct output on the test"
assert any(a != b for a, b in zip(ce_claude, ce_truth)), "the unintended rule must break on some other input of the same task"


# ------------------------------------------------------------------ ARC-AGI-1 00d62c1b (fill what green encloses)
GREEN, YELLOW = 3, 4


def fill_enclosed(g):
    """The verifier: black cells that cannot reach the border through black (4-connected) become yellow."""
    h, w = len(g), len(g[0])
    out = copy(g)
    reach = set()
    stack = [(r, c) for r in range(h) for c in range(w) if (r in (0, h - 1) or c in (0, w - 1)) and g[r][c] == 0]
    reach.update(stack)
    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and g[ny][nx] == 0 and (ny, nx) not in reach:
                reach.add((ny, nx))
                stack.append((ny, nx))
    for r in range(h):
        for c in range(w):
            if g[r][c] == 0 and (r, c) not in reach:
                out[r][c] = YELLOW
    return out


def fill_single_holes_only(g):
    """A corrupted verifier: the branch for holes larger than one cell has been deleted."""
    good = fill_enclosed(g)
    out = copy(g)
    holes = components([[1 if good[r][c] == YELLOW else 0 for c in range(len(g[0]))] for r in range(len(g))])
    for cells in holes:
        if len(cells) == 1:
            y, x = cells[0]
            out[y][x] = YELLOW
    return out


def enclosed_regions(g):
    f = fill_enclosed(g)
    mask = [[1 if f[r][c] == YELLOW and g[r][c] == 0 else 0 for c in range(len(g[0]))] for r in range(len(g))]
    return components(mask)


def ring(g, top, left, hgt, wid):
    for c in range(left, left + wid):
        g[top][c] = g[top + hgt - 1][c] = GREEN
    for r in range(top, top + hgt):
        g[r][left] = g[r][left + wid - 1] = GREEN


def gen_input(rng, size=10, rings=2, noise=4):
    """Generator: non-overlapping green rings plus a few stray green cells that enclose nothing."""
    while True:
        g = [[0] * size for _ in range(size)]
        boxes = []
        for _ in range(rings):
            for _ in range(50):
                hh, ww = rng.randint(3, 5), rng.randint(3, 5)
                t, l = rng.randint(0, size - hh), rng.randint(0, size - ww)
                if all(t + hh + 1 <= bt or bt + bh + 1 <= t or l + ww + 1 <= bl or bl + bw + 1 <= l for bt, bl, bh, bw in boxes):
                    boxes.append((t, l, hh, ww))
                    ring(g, t, l, hh, ww)
                    break
        for _ in range(noise):
            r, c = rng.randrange(size), rng.randrange(size)
            if g[r][c] == 0 and all(g[y][x] == 0 for y, x in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)) if 0 <= y < size and 0 <= x < size):
                g[r][c] = GREEN
        if len(enclosed_regions(g)) == len(boxes) == rings:
            return g


arc = load("arc-agi-1-00d62c1b.json")
for p in arc["train"] + arc["test"]:
    assert fill_enclosed(p["input"]) == p["output"], "verifier must reproduce every published pair"

rng = random.Random(1995)  # Copycat's year; the only seed in this file
cand_in = [gen_input(rng) for _ in range(4)]
valid_a = {"input": cand_in[0], "output": fill_enclosed(cand_in[0])}
valid_b = {"input": cand_in[1], "output": fill_enclosed(cand_in[1])}

flip_out = copy(fill_enclosed(cand_in[2]))  # colour flip: one filled cell turned back to black
fy, fx = next((r, c) for r in range(10) for c in range(10) if flip_out[r][c] == YELLOW)
flip_out[fy][fx] = 0
colour_flip = {"input": cand_in[2], "output": flip_out, "mark": [[fy, fx]]}

big = next(g for g in (gen_input(rng) for _ in range(200)) if any(len(o) > 1 for o in enclosed_regions(g)))
corrupt_ver = {"input": big, "output": fill_single_holes_only(big)}
corrupt_ver["mark"] = diff(corrupt_ver["output"], fill_enclosed(big))
assert corrupt_ver["mark"], "the corrupted verifier must disagree with the true one on this input"

mismatch = {"input": cand_in[3], "output": fill_enclosed(cand_in[0])}  # instance mismatch: another instance's output
mismatch["mark"] = diff(mismatch["output"], fill_enclosed(cand_in[3]))

classification = [
    {"pair": valid_a, "valid": True, "kind": "valid"},
    {"pair": colour_flip, "valid": False, "kind": "colour flip"},
    {"pair": valid_b, "valid": True, "kind": "valid"},
    {"pair": corrupt_ver, "valid": False, "kind": "corrupted verifier"},
    {"pair": mismatch, "valid": False, "kind": "instance mismatch"},
]
for c in classification:
    assert (fill_enclosed(c["pair"]["input"]) == c["pair"]["output"]) == c["valid"]

# Constrained generation: "a new pair with exactly three enclosed regions"
gen3 = next(g for g in (gen_input(rng, rings=3, noise=3) for _ in range(500)))
generation = {"input": gen3, "output": fill_enclosed(gen3), "regions": len(enclosed_regions(gen3))}
assert generation["regions"] == 3

# Editing: a corrupted pair (one hole left black, one outside cell painted yellow) and its minimal repair
ed_in = gen_input(rng)
ed_true = fill_enclosed(ed_in)
ed_bad = copy(ed_true)
hy, hx = next((r, c) for r in range(10) for c in range(10) if ed_true[r][c] == YELLOW)
oy, ox = next((r, c) for r in range(9, -1, -1) for c in range(9, -1, -1) if ed_true[r][c] == 0 and ed_in[r][c] == 0)
ed_bad[hy][hx], ed_bad[oy][ox] = 0, YELLOW
edit_dist = len(diff(ed_bad, ed_true)) / (10 * 10)
assert edit_dist <= 0.70  # PotARCin: normalised Hamming distance of the repair ≤ 0.70
editing = {"input": ed_in, "broken": ed_bad, "fixed": ed_true, "mark": [[hy, hx], [oy, ox]], "distance": edit_dist}

# Inversion: given an output, build an input the verifier maps onto it
inv_out = fill_enclosed(gen_input(rng))
inv_in = [[0 if v == YELLOW else v for v in row] for row in inv_out]
assert fill_enclosed(inv_in) == inv_out
inversion = {"output": inv_out, "input": inv_in}

DEFINITION = (
    "def rule(grid):\n"
    "    # black cells that can't reach the border\n"
    "    # through black cells turn yellow\n"
    "    outside = flood(grid, from_border=True, through=BLACK)\n"
    "    return [[YELLOW if v == BLACK and (r, c) not in outside else v\n"
    "             for c, v in enumerate(row)] for r, row in enumerate(grid)]"
)

data = {
    "conceptarc_topbottom": {
        "id": "ConceptARC TopBottom2D4",
        "train": tb["train"],
        "test": tb["test"][0],
        "rules": {k: {"text": text, "runs": tb_runs[k]} for k, (_, text) in TB_RULES.items()},
    },
    "conceptarc_center": {
        "id": "ConceptARC Center2",
        "items": ce_items,
        "truth": ce_truth,
        "claude": ce_claude,
        "n_train": len(ce["train"]),
        "claude_text": "Find all values that appear with the minimum frequency in the input grid, sort them in ascending order, then return the second smallest value if multiple values exist, or the only value if just one exists.",
    },
    "arc_fill": {
        "id": "ARC-AGI-1 00d62c1b",
        "train": arc["train"],
        "test": arc["test"][0],
        "definition": DEFINITION,
        "classification": classification,
        "generation": generation,
        "editing": editing,
        "inversion": inversion,
    },
}
OUT.write_text(json.dumps(data, separators=(",", ":"), sort_keys=True) + "\n")
print(f"wrote {OUT.name}: {OUT.stat().st_size} bytes; gemini wrong cells on test = {len(tb_runs['gemini'][n_demo]['wrong'])}; "
      f"o3 fails demo(s) {[i for i, r in enumerate(tb_runs['o3'][:n_demo]) if not r['ok']]}; claude centre = {ce_claude} vs {ce_truth}")
