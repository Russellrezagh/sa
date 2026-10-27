---
name: mai-video
description: Make a short explainer or essay video in the MAI house style (one persistent thread motif, warm paper with ink and watercolour, semantic colour, continuity transitions, ring structure, two-voice guide/learner dialogue narration) as a deterministic Remotion render. Use when asked to make, script, storyboard, animate or render a video, reel, short or explainer, to add a reference video to the style, or to create a video asset (character pose, icon, sound, texture).
---

# MAI video skill

You are making a video with a **closed, deterministic system**. The look comes from tokens, the nouns come from a locked asset library, and the story comes from a linted storyboard. The renderer only *executes*: it never invents a colour, a duration, a font or an asset.

Everything lives in `video-style/`:

| File | Read when |
|---|---|
| `video-style/DOMAIN.md` | **Always first.** Defines the entities (Storyboard, Beat, Scene, Motif, Asset, Token) and their invariants. |
| `video-style/RULES.md` | **Always.** Every rule has an ID; the linter reports these IDs. |
| `video-style/analysis/REFERENCE_ANALYSIS.md` | When you need the *why* behind a rule, or are adding a new reference. |
| `video-style/assets/ASSETS.md` | Before creating or changing any asset. |
| `video-style/storyboards/give-it-a-thread.yaml` | The worked example. Copy its shape. |
| `video-style/tokens/*.tokens.json` | When you need an actual value (colour, size, duration, ease). |

## Workflow

Work through these stages in order. Each one has a gate, and you do not move on until the gate passes.

### 1 · Model the idea (no visuals yet)
Write these down before any scene:
- **`motif.meaning`**: one sentence saying what the thread *is* in this video (RULES M3). If you can't write it, ask the user. Do not guess.
- **`concepts`**: ≤ 5 nouns the video manipulates, each with a `concept-N` role that it keeps for the whole video (K1). Example: prediction → concept-1, truth → concept-2, error → concept-3.
- **Register**: `explainer` (160–185 wpm) or `contemplative` (115–140 wpm).
- **Format**: `portrait` (default) or `landscape`.

### 2 · Script with the beat grammar
HOOK → DEFINE → LADDER → TURN → RULE → RETURN (RULES §2).
- The HOOK is a question or an unfamiliar word, and something changes by 0.5 s.
- The LADDER either builds ("If X, you get Y") or eliminates (Socratic "Are you this? No.", with a `breadcrumb`).
- The TURN is the single surprise, usually a **strip**: take things away until only the thread or pulse remains. It is the only beat in `mode: night`.
- The RETURN echoes the HOOK's words, so the last frame loops into the first.
- Budget the words per scene as `duration × wpm / 60`. Split captions into cards of 1–4 words (≤ 28 characters each).

### 2b · Dialogue (the default narration)
Unless the user asks for a single narrator, write the script as a **conversation** (RULES §2b):
- Declare `meta.dialogue` with `mode: curious` (the learner asks, the guide explains) or `socratic` (the guide leads by asking). Use a `guide` with `voice.joe@1.0.0` and a `learner` with `voice.alba@1.0.0` and `character.everyperson@1.0.0`.
- Write `lines:` per scene instead of `vo:`, and give each scene a `cast:` entry for the learner (pose plus position at the side of the stage).
- Follow the per-beat grammar: the learner asks the HOOK, the guide names the idea, the two build a two-voice ladder, the guide takes the TURN, **the learner states the RULE** and the guide confirms, and the learner answers their own question in the RETURN.
- Keep learner lines ≤ 12 words and guide lines ≤ 24, and let the guide speak 55–80 % of the words.
- Then voice and time it. Each line is synthesised once, frozen and hashed, and the captions are timed to the real audio:
```bash
python3 -I video-style/tools/dialogue.py video-style/storyboards/<id>.yaml   # → <id>.timed.yaml + vo.<id> asset
```
Lint and emit the **`.timed.yaml`**. The worked example is `storyboards/the-thread-dialogue.yaml`.

### 3 · Storyboard → lint (gate)
Copy `video-style/storyboards/give-it-a-thread.yaml` to `video-style/storyboards/<id>.yaml` and fill it in. Then run:
```bash
python3 -I video-style/tools/lint_storyboard.py video-style/storyboards/<id>.yaml
```
Fix every **ERROR**. Fix each **WARN** too, or justify it in the scene's `notes:`. The linter also runs the asset-lock check.

### 4 · Resolve assets (never improvise)
Every `asset:` must be an `id@x.y.z` that exists in `video-style/assets.lock.json` with status `published`.
- **The asset exists:** use it. Characters take a `pose` from their `poses` list.
- **The asset is missing:** create it following `video-style/assets/ASSETS.md`. That means a shape object (strokes, washes, fills) with roles and no hex values, a manifest with provenance, and an entry in `kit/src/assetRegistry.ts`. Then run `python3 -I video-style/tools/asset_lock.py` and render `AssetSheetPaper` to look at it.
- **AI-generated media** (images, VO, music) is generated **once**, reviewed, and frozen with `provenance.model/prompt/seed` (RULES D5). Never regenerate it at render time.

### 5 · Compile and render
```bash
python3 -I video-style/tools/lint_storyboard.py video-style/storyboards/<id>.yaml --emit video-style/kit/src/storyboards/<id>.json
# register it in video-style/kit/src/Root.tsx with boardComposition('<Id>', board)
cd video-style/kit && npm ci && npx tsc --noEmit
npx remotion still <Id> out/<id>-f60.png --frame=60      # check key frames first: cheap
npx remotion render <Id> out/<id>.mp4                    # then the full render
python3 -I ../tools/master.py out/<id>.mp4               # → out/<id>.master.mp4 at -14 LUFS / -1 dBTP (RULES A1)
../tools/contact_sheet.sh out/<id>.mp4                   # review sheet
```
Look at the stills and the contact sheet yourself (open the PNGs) before reporting that the video is done. If Remotion can't find Chrome in a sandbox, pass `--browser-executable=<path to chrome-headless-shell>`.

### 6 · Voice-over (optional)
If there is a VO track, register it as a `vo.*` asset. Transcribe it with word timestamps (see `tools/analyze_reference.py`, function `transcript`), then **re-time the captions to the real words** and re-lint. Captions follow the voice; the voice never follows the captions.

### 7 · Review (gate)
Go through the checklist in RULES §9 against the contact sheet. Report to the user:
- the render path,
- the lint summary line,
- any rule you broke on purpose, and why.

## Kit components (video-style/kit/src)

| Component | Asset / role | Notes |
|---|---|---|
| `StoryboardVideo` | renders a compiled storyboard | Renders the thread once for the whole video and morphs it between scenes with `interpolatePaths`. |
| `Thread`, `pulsePath` | `motif.thread@1.0.0` | States: travel, underline, home, pulse, strip, absent. |
| `InkShape` | icons and characters | Ink boils on twos; washes sit off-register. |
| `Caption` | `template.caption@1.0.0` | Word-stagger entry; keywords coloured by role. Guide lines italic with a `•` turn marker; learner lines upright. |
| `CastLayer`, `speaking` | `character.*` per speaker | Persistent characters that walk between scenes and bob while speaking. |
| `SetupPayoff` | payoff words | Small setup line above a sprung payoff word. |
| `Header` | header and breadcrumb | Struck-through eliminations. |
| `Lens` | `motif.lens@1.0.0` | Alternative primary motif with ripple rings. |
| `TrackBox` | annotation | Set `props.track: true` on an element. |
| `Paper` | `texture.paper-grain@1.0.0` | Seeded grain and vignette. |

To **extend the kit**, add a component that reads only from `tokens.ts` and `determinism.ts`, register its asset in `assetRegistry.ts`, show it on `AssetSheet`, and bump the asset's version.

## Multi-agent setup (when several agents work on one video)

| Agent | Owns | Reads | Writes |
|---|---|---|---|
| **Director** | stages 1–3 | DOMAIN, RULES, analysis | `storyboards/<id>.yaml` |
| **Asset smith** | stage 4 | ASSETS.md, tokens | `assets/**`, `assets.lock.json`, `kit/src/assetRegistry.ts` |
| **Renderer** | stage 5 | kit, compiled JSON | `kit/src/storyboards/*.json`, renders |
| **Critic** | stage 7 | RULES §9, contact sheet | review notes; sends the work back to whichever stage failed |

The agents hand off through files only. The lint and lock tools are the contract between them.

## Related upstream skills (optional)
- `npx skills add remotion-dev/skills` gives you Remotion API knowledge (rendering, captions, best practices).
- HeyGen HyperFrames (`npx hyperframes init`) is an HTML-plus-GSAP alternative renderer. If you port the kit to it, keep tokens, assets and storyboards unchanged: only `kit/` is renderer-specific.

## Do not
- Put a hex colour, px size, font name or duration directly in a storyboard or a component.
- Use `Math.random()`, `Date.now()`, a CDN font, or a network fetch in the kit.
- Hard-cut more than 3 times a minute, or cut away from the thread.
- Edit a published asset in place: bump its version instead.
- Show a raw photo or video frame.
