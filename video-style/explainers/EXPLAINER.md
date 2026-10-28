# MAI explainer pages: hand-navigated, no narration

A **MAI explainer** is a single HTML file that the reader steps through by hand (→ / ← / space, or swipe). Nothing is voiced. Two characters talk in a side panel, and the **stage animates the idea**: each step changes the picture, and the lines only name what the picture shows. There are no interactive widgets: navigation is the only input.

It is the same house style as the videos (warm paper, Klein-blue thread, semantic colour, beat grammar, guide and learner), moved from time to steps. Read `../DOMAIN.md` and `../RULES.md` first; this file adds the **page** context.

Worked example: `analogy-to-arc/`, which builds `out/analogy-to-arc.html` (58 scenes, 165 steps, four papers).

---

## 1. Domain model (the PAGE context)

```
STYLE (tokens) ─┐
ASSETS (shapes) ├──▶ PAGE: Explainer ─▶ Chapter ─▶ Scene ─▶ Step ─▶ Cue + Lines
MEDIA (ledger) ─┘                         │           │
DATA (data.py) ───────────────────────────┘           └─ View (build once, apply a state)
```

| Concept | Kind | Shape | Invariants |
|---|---|---|---|
| **Explainer** | aggregate root | `MAI.meta {id, title, description}` plus the cast, cites, chapters and scenes registered by `content.js` | It builds to ONE self-contained HTML file with no network references. The same inputs give the same bytes. |
| **Chapter** | entity | `{id, nav?, title, beat, mode?}` | `beat` follows the grammar HOOK → DEFINE → LADDER → TURN → RULE → RETURN. Only the TURN chapter is in `mode: 'night'`. Chapters without `nav` fold into the previous navigation label. |
| **Scene** | entity | `{id, chapter, view, props, title, kicker?, steps[]}` | Exactly one view per scene. A scene change crossfades; a step change animates in place. |
| **Step** | value object | `{cue, say, cite?, head?}` | **Position is pure.** The stage at step *k* is `fold(cues[0..k])` (a deep merge), so going back, deep-linking (`#scene-id/3`) and replaying all land on the same picture. Adjacent moves animate, and jumps apply instantly. |
| **Cue** | value object | a patch of view state, e.g. `{rows: {tgt: 'lr'}, change: {...}}` | It is plain data with no functions. `null` removes a key. Arrays replace and objects merge. |
| **Line** | value object | `['mai' \| 'sam', text]` with inline markup `[[role\|text]]`, `**b**`, `*serif*`, `` `code` `` | ≤ 3 per step. The learner speaks ≤ 18 words and the guide ≤ 34. The guide speaks 55–80 % of all words. |
| **Speaker** | entity | `MAI.cast[id] = {name, role, avatar()}` | Exactly two. The guide *is* the thread (a blue knot); the learner *is* `character.everyperson` (their head is drawn from the asset's shape objects). |
| **View** | strategy | `MAI.view(name, {build(ctx), apply(inst, state, ctx)})` | `build` creates every element once. `apply` maps a state onto classes, attributes and transforms, and must be idempotent. Motion lives in CSS transitions keyed to motion tokens. No `Math.random`, no `Date`. |
| **Media item** | entity | `ledger.json → assets[id] {file, kind, title, credit, licence, source, treatment, sha256}` | `kind` is `figure` (paper figure, shown untouched as a clipping with its credit), `scan` (archive page, toned to paper), `photo` (never raw: duotone ink → paper) or `title` (page-1 crop). `build.py` refuses a hash mismatch. |
| **Cite** | value object | `MAI.cites[key] {short, long?, url?}`; a step's `cite: key \| [key, locator]` | Any line with a number needs a cite on that step or an earlier step of the scene. The cite renders under the stage. |
| **Data** | value object | `data.json`, written by `data.py` | Grids, rule outputs and generated examples are computed at build time, and **every claim about them is an assertion** in `data.py`. |

### Generic views (`engine/views.js`)

| View | Shows | Main cue keys |
|---|---|---|
| `strings` | letter-string analogies, an alphabet strip, travelling relation tag | `rows {id: 'l'\|'l?'\|'lr'}`, `r`, `change`, `groups`, `walls`, `bridges`, `brackets`, `relation`, `strip`, `hl`, `bad`, `strike` |
| `figure` | clippings (figures, scans, photos) that move, mark a region, or zoom into it | `show`, `at {id: {x,y,w,rot,scale,z}}`, `mark {id: box}`, `zoom {id: box}` |
| `cards` | positioned text objects (card, quote, code, stamp, big, plain), optional ink icon | `show`, `hl`, `dim`, `at`, `text` |
| `lines` | slope chart across categories with collision-free labels | `upto`, `focus`, `labels` |
| `bars` | grouped bars growing in layers, with a legend per layer | `layer`, `hl` |
| `arc` | ARC task boards (columns or rows); runs a rule over demos and tests with ✓/✗ and wrong-cell marks | `pairs`, `test`/`tests`, `answer: 'fill'`, `rule`, `runTest` |
| `title` | cover / end card with paper cards | `show` |

Every view also takes `notes` (handwritten asides, max one or two at a time). The page chrome adds the thread progress line, chapter navigation, step dots, the conversation panel and the source line.

---

## 2. Rules (IDs are what `build.py` reports)

| ID | Rule | Checked |
|---|---|---|
| X1 | A scene has 1–8 steps. More means it is two scenes. | lint (error) |
| X2 | Every step has 1–3 lines. | lint (error) |
| X3 | The learner speaks ≤ 18 words per line and the guide ≤ 34. | lint (error) |
| X4 | Any line with a number (≥ 2 digits, %, "percent", "points") has a cite on screen. | lint (error) |
| X5 | **The picture changes on every step.** A step with an empty cue is a talking head: cut it or give it a visual. | lint (error) |
| X6 | The guide speaks 55–80 % of the words. The learner proposes rungs, restates and asks. | lint (error) |
| X7 | Every media item in the ledger is shown somewhere, and every shown item is in the ledger. | lint (warning / error) |
| X8 | **The motion explains, the words name.** Describe the change the reader just saw ("b became c") and don't narrate what isn't on stage. | review |
| X9 | **No interactive widgets.** No inputs, sliders or hover-only content. Navigation is the only interaction, so a reader on any device gets the full explanation. | review |
| X10 | Photos are treated (duotone), never raw. Paper figures are untouched clippings with author, figure number and licence in the caption. Archival scans are toned to paper. | `media.py` |
| X11 | Factual explainers keep a `FACTS.md` (claim → source → correction). Claims about computed objects (grids, rule runs) are `assert`s in `data.py`. | review + build |
| X12 | Labels on a picture stay *away from the lines they label*; nothing overlaps at 1440×900 or 390×844. | `tools/explainer_walk.js` + contact sheet |
| X13 | Rules from the video still apply: one motif (the progress thread is always on screen), ≤ 5 concept roles, night mode only for the TURN, and the RETURN echoes the HOOK. | review |

---

## 3. Workflow

1. **Model first.** Write the chapter list (beat grammar) and the scene list with one view each. Decide what *moves* in each step before writing a single line.
2. **Facts.** Read the primary sources (alphaXiv, arXiv source tarballs) and write `FACTS.md`.
3. **Media.** Add items to `ITEMS` in `media.py`. Prefer CC BY figures from arXiv e-prints (`/e-print/<id>` holds the original figure files), Wikimedia Commons (with author and licence) and Internet Archive scans with clear terms. Run it once with a cache dir, then commit `media/` and `ledger.json`:
   ```bash
   python3 -I video-style/explainers/<id>/media.py --cache /tmp/media-cache      # needs Pillow; fonts need fontTools + brotli
   ```
4. **Data.** Vendor task files under `tasks/` with their licences, compute every grid in `data.py`, and assert each claim:
   ```bash
   python3 -I video-style/explainers/<id>/data.py
   ```
5. **Content.** Write `content.js` (cast, cites, chapters, scenes). Put explainer-specific views in `<id>/views.js` and motion in `<id>/style.css`.
6. **Build (gate).** The linter runs first and the build stops on any error:
   ```bash
   python3 -I video-style/explainers/build.py <id>          # → explainers/out/<id>.html
   ```
7. **QA (gate).** Run the walk-through, fix every overlap, and re-run:
   ```bash
   node video-style/tools/explainer_walk.js video-style/explainers/out/<id>.html /tmp/walk 1440 900
   node video-style/tools/explainer_walk.js video-style/explainers/out/<id>.html /tmp/walk-phone 390 844
   ```
   For motion, record a Playwright video of a few scenes and sample frames with ffmpeg. That is how the night-mode contrast bug and the black ARC grids were caught in the worked example.

## 4. Files

```
explainers/
  EXPLAINER.md          ← this file
  build.py              ← lint + inline → out/<id>.html (deterministic)
  engine/explainer.js   ← runtime: navigation, fold, conversation, chrome, ink shapes, clippings, grids
  engine/views.js       ← generic views
  engine/explainer.css  ← chrome + shared vocabulary; every value is a token variable
  <id>/content.js       ← the explainer (data)
  <id>/views.js, style.css
  <id>/media.py, ledger.json, media/   ← frozen media with provenance
  <id>/data.py, data.json, tasks/      ← computed objects with assertions
  <id>/FACTS.md
  out/<id>.html         ← the deliverable (committed)
```
