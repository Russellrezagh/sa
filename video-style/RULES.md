# MAI Video Rules

> **One thread. Warm paper. Precise ink. Every scene becomes the next.**

These are the house rules for every video made with this system. They come from the analysis in `analysis/REFERENCE_ANALYSIS.md` (four reference reels, merged), and they use the vocabulary defined in `DOMAIN.md`.

- **MUST** rules are non-negotiable. **SHOULD** rules need a written reason (a `notes:` field in the scene) to break.
- Rules tagged **`[lint]`** are enforced by `tools/lint_storyboard.py`. The rest are checked at review against the contact sheet.
- If a rule and a token disagree, the **token file wins**, because tokens are the measured source of truth. Fix the rule text.

---

## 1. The thread (motif): rules M

| ID | Rule |
|---|---|
| **M1** `[lint]` | Every video MUST have **exactly one primary motif** (`motif.*` asset), and it MUST be visible or audible for **≥ 80 % of the runtime**. |
| **M2** `[lint]` | The thread colour (`thread` role) is reserved. It may be used for the motif, plus **at most one caption word per scene**: the word that *is* the idea. Never use it for decoration or UI. |
| M3 | Write `motif.meaning` in one sentence before anything else. If you cannot, there is no video yet. |
| M4 | The motif MUST physically take part in transitions. The thread travels, morphs, underlines, pulses, or carries the next scene in. It is rendered **once, at storyboard level**, so it never cuts. |
| M5 | When idle, the motif rests at **home** (top-right of the stage, `layout.*.motif-home`). When the idea is *named* in the VO, the motif reacts with a ripple, knot or pulse, and the reaction is paired with `sfx.ripple-ping`. |
| M6 | The motif has an **audible twin**, the **pulse**: a watch tick or heartbeat bed at 60–80 bpm, mixed about 18 LU under the voice. The pulse blip in `pulse` state is synced to `meta.pulse.bpm`. |

## 2. Narrative grammar: rules N

Beat types, in order: **HOOK → DEFINE → LADDER → TURN → RULE → RETURN**. DEFINE and LADDER may repeat or swap.

| Beat | Job | Pattern (from the references) |
|---|---|---|
| HOOK | Pose the question or an unfamiliar word in ≤ 3 s | "Who are you?" · "There's a Chinese word every editor should know" |
| DEFINE | Make the idea *visible* through a physical metaphor | the veins of a leaf → the thread |
| LADDER | Build up ("If X, you get Y") **or** rule out (Socratic elimination plus a struck-through breadcrumb) | the GraduateML ladder · the POE eliminations |
| TURN | The one surprising demonstration. Usually a **strip** (remove layers until only the thread or pulse remains). It is the only place the **mode switches** | "Listen. Take away the voices…" |
| RULE | One sentence the viewer can repeat | "Give it a mài." |
| RETURN | Echo the HOOK so that the last frame can loop into the first | "Who are you?" → "I am." |

| ID | Rule |
|---|---|
| **N1** `[lint]` | The first beat is HOOK and the last is RETURN. There is **exactly one TURN** and at least one DEFINE or LADDER. A RULE beat SHOULD exist. |
| **N2** `[lint]` | The RETURN scene MUST declare `echoes: <hook scene id>` and share a content word with it. The last transition SHOULD be `end-loop`, and the last frame SHOULD match the first frame's composition. |
| **N3** `[lint]` | Voice pace: **contemplative 115–140 wpm**, **explainer 160–185 wpm**, and never more than 200. Leave ≥ 0.6 s of silence after a question. |
| **N4** `[lint]` | Something visibly changes within **0.5 s** of frame 0, and no stretch longer than **2.5 s** passes without a visible change. |
| N5 | One idea per video. If the script needs "and also", split it into two videos. |
| N6 | Target length is 25–60 s (explainer) or ≤ 90 s (contemplative). If the target is longer, LADDER is the beat to cut. |
| N7 | Put **one humour or surprise beat** just before RULE (the reference is the stacked `final_REALLY_final.aep` dialogs). It resets attention before the takeaway. |
| N8 | Use the viewer's words. When a surrogate character speaks, they ask the *viewer's* question and are allowed to be wrong ("Kind of, I think…"). |

## 2b. Dialogue narration: rules G

The preferred narration is a **two-voice conversation**. The **guide** leads and explains. The **learner** speaks for the viewer: they ask, guess, are sometimes wrong, and finally say the idea in their own words. This comes from the Philosophy of Everything reel's Socratic exchange ("Who are you?" / "I'm John." / "John is just a sound."), merged with the explainer ladder of the GraduateML reel.

**Two modes** (set in `meta.dialogue.mode`):
| Mode | Who asks | Who leads | Feel |
|---|---|---|---|
| `curious` | the learner asks; the guide explains | guide | warm explainer (the default) |
| `socratic` | the guide asks leading questions; the learner answers | guide | contemplative, philosophical |

**Conversation grammar per beat:**
| Beat | Curious mode | Socratic mode |
|---|---|---|
| HOOK | Learner asks the naive question ("Why do some videos pull you in?"). Guide gives a teaser answer. | Guide asks the big question ("Who are you?"). Learner gives the obvious answer ("I'm John."). |
| DEFINE | Guide names the idea with a metaphor. Learner guesses ("Like a pulse?"). Guide corrects ("Closer. …"). | Guide pokes at the answer ("John is just a sound."). |
| LADDER | **Two-voice ladder:** the learner proposes each rung ("So if I draw a line?") and the guide completes it ("Then you get a path."). | **Elimination:** the guide asks "Are you X?", the learner says "No…", and X goes into the struck-through breadcrumb. |
| TURN | Guide takes over ("Listen."). The learner falls silent, then reacts in one short line. | Same. |
| RULE | **The learner states the rule** and the guide confirms ("Exactly."). That shows the learning worked. | The learner arrives at it, or the guide states it and the learner repeats it. |
| RETURN | The learner answers their own HOOK question. | The learner answers the HOOK question differently than at the start. |

| ID | Rule |
|---|---|
| **G0** `[lint]` | Dialogue lines are timed by `tools/dialogue.py`. Always lint the generated `*.timed.yaml`, never the source. |
| **G1** `[lint]` | Exactly two speakers: one `guide` and one `learner`. Every line, caption and cast entry names a declared speaker. |
| **G2** `[lint]` | The guide leads: **55–80 %** of the words are the guide's. |
| **G3** `[lint]` | Learner lines have ≤ 12 words and guide lines ≤ 24. Short turns keep it a conversation. |
| **G4** `[lint]` | The HOOK contains a question from the asker of the chosen mode. |
| **G5** `[lint]` | The learner speaks in the RULE beat (they state the takeaway). |
| **G6** `[lint]` | No more than 3 lines in a row by the same speaker. |
| **G7** `[lint]` | Captions are verbatim chunks of their speaker's lines, and each carries `speaker`. |
| G8 | **Typesetting:** guide lines are *Instrument Serif Italic* in `caption-base`, and the first card of each new guide turn gets a `•` in `emph`. Learner lines are upright Instrument Serif in `ink`. Both share the one caption line, so attribution comes from type alone and there are no speech bubbles. |
| G9 | **Embodiment:** the learner is the on-stage character (`speakers[].character`). They live on the persistent **cast layer**, walk between per-scene positions (`scene.cast`), and bob while speaking. The guide has **no body: the guide is the thread**, which swells while the guide speaks. The guide "pulls them forward" (Dunkirk reel). |
| G10 | **Staging:** the learner stands to one side of the stage (x ≈ 0.2–0.3, smaller than the subject), so the subject keeps the optical centre (V9). The learner may leave the stage for the TURN. |
| G11 | **Casting:** the two voices must contrast in pitch *and* accent, so a listener can tell them apart within one second (default: `voice.joe` as guide, `voice.alba` as learner). Each line is generated once and frozen (D5). Use `say:` for pronunciation; captions always use `text`. |
| G12 | **Timing:** 0.30 s between speakers, 0.15 s within a speaker, and +0.30 s after any question. Captions follow the frozen audio (speech-only clock); the audio never follows the captions. |

## 3. Colour: rules K

| ID | Rule |
|---|---|
| **K1** `[lint]` | ≤ 5 **concepts** per video. Each concept owns one `concept-N` role **for the whole video**: in diagrams, washes, and caption keywords alike. |
| **K2** `[lint]` | A caption keyword takes the colour **of the concept it names**. Keywords that name no concept use `emph`. Concept roles must be declared in `concepts`. |
| **K3** `[lint]` | ≤ 3 accent roles visible in a scene (`thread` not counted). |
| **K4** `[lint]` | Storyboards and kit code contain **no raw colour values**: only roles. Hex values live only in `tokens/color.tokens.json`. |
| K5 | Default **paper** mode: warm paper `bg`, ink lines, and one blue thread. **Night** mode belongs to the TURN beat (or to a whole video that is diagram-only). |
| K6 | Text roles must meet contrast ≥ 3:1 at caption size and ≥ 4.5:1 below 40 px. The token values are tuned so they pass, so do not tint text with opacity. |
| K7 | Features drawn *on top of* a wash (eyes, pupils) use `ink-dark`, which does not change between modes, so characters look identical in paper and night. |

## 4. Typography and captions: rules C

| ID | Rule |
|---|---|
| **C1** `[lint]` | A caption card has **1–4 words and ≤ 28 characters**, and fits on a single line. |
| **C2** `[lint]` | Each card is held ≥ 0.4 s. Words rise in with a 3-frame stagger, and the card fades out over 6 frames. |
| **C3/C4** `[lint]` | Captions stay inside their scene and never overlap each other. |
| **C5** `[lint]` | Every `emph` word must actually appear in its caption. |
| **C6** `[lint]` | VO without captions is a warning, because most viewers watch muted. |
| C7 | Faces: **Instrument Serif Italic** (captions, headlines) · **Inter** (labels, setup/payoff) · **JetBrains Mono** (tracking boxes, data) · **Caveat** (≤ 1 handwritten aside per scene) · KaTeX (math only). At most 2 families per frame, not counting math. |
| C8 | **Setup/payoff** pairs: a small Inter setup line (34 px) above a huge Inter payoff word (168 px). The ratio is ≥ 4×. Use them for the DEFINE word and the RULE line. |
| C9 | The caption line sits in `zone.caption` (y ≈ 0.63 in portrait), centred. Nothing important goes below y = 0.78 (platform UI) or into the right-hand button strip. |
| C10 | Headers (the question, the equation, the current ladder rung) persist through a beat and update *in place*. |

## 5. Drawing and texture: rules V

| ID | Rule |
|---|---|
| V1 | Ink lines are 4 px, with round caps and joins, and **boil on twos** (seeded displacement, 3 variants, 0.9 px amplitude). |
| V2 | Fills are **watercolour washes** in a role colour at 55 % opacity (90 % in night mode), edge-displaced and **offset a few px from the line**. Never use flat vector fills for drawn objects. |
| V3 | Photos and footage are **never shown raw**: they must go through a `treatment.*` (halftone, stipple, ASCII or duotone) in ink or thread colour. |
| V4 | Paper grain is static (seeded) at 6 %, with a soft vignette. Film grain (animated, on twos) is for tactile or stop-motion scenes only. |
| V5 | **Two cadences:** drawn things update on twos, while the thread, camera and text move on ones. Never boil the thread. |
| V6 | Key points get a soft **halo** (2.2× radius, 28 %), never an arrow, unless the arrow *is* the concept (for example a gradient). |
| V7 | Annotation layer (optional): thin tracking boxes with mono coordinates when the message is "look closer". |
| V8 | Characters come from the registry, in a listed pose, and are never redrawn freehand. New poses follow `assets/character/*/SHEET.md`. |
| V9 | Composition: one subject at the stage's optical centre (y ≈ 0.38), generous paper around it. If two things compete, one of them goes to *home* or leaves. |

## 6. Motion and transitions: rules T

| ID | Rule |
|---|---|
| **T1** `[lint]` | Scenes last **1.2–5 s**. |
| **T2** `[lint]` | Hard cuts are **punctuation**: ≤ 3 per minute, and each one lands on a sound hit. The default transition is continuity. |
| T3 | The continuity catalogue, in order of preference: `morph` (an element with the same id in consecutive scenes interpolates) · `carry` (the thread pulls the next scene in) · `push` (the camera climbs the ladder) · `zoom-through` (push into a detail until it becomes the next ground) · `draw-through` · `wash` (a circular bleed, used to switch mode). |
| **T4** `[lint]` | A `morph` or `zoom-through` names a `target` element. For a morph, that element must exist in the next scene too. |
| T5 | Use the eases from `tokens/motion.tokens.json`: `standard` for morphs and camera, `enter` for arrivals, `exit` for departures, `draw` for strokes and the thread, and springs `settle` and `pop` for payoff words. No linear moves except the pulse and slow drift. |
| T6 | Every scene has a slow camera push (1.0 → 1.06). Captions and header sit outside the camera and never move with it. |
| T7 | Durations are tokens in **frames at 30 fps**, converted for other fps. Never hand-tune a duration in code. |

## 7. Audio: rules A

| ID | Rule |
|---|---|
| A1 | Master to **−14 LUFS integrated, −1 dBTP** with `tools/master.py`, which runs after the render because the renderer's mixer attenuates summed tracks. The pulse bed sits about 18 LU under VO. A video with **no VO** (pulse only) cannot reach −14 without crushing the ticks, so it masters to about −19 LUFS, and the tool reports when it had to limit. |
| A2 | Caption onsets and transition starts land on a pulse subdivision (½ or ¼ beat) whenever the VO allows. |
| A3 | SFX vocabulary: `sfx.pencil` under draw-ons, `sfx.ripple-ping` when the idea is named, `sfx.pulse-tick` for single beats. Each strip step is a **hard drop-out**, not a fade. |
| A4 | Sound assets are generated by code (`tools/gen_audio.py`) or recorded and then frozen. They are loudness-normalised at ingest, with the value written in the manifest. |

## 8. Assets and determinism: rules D

| ID | Rule |
|---|---|
| **D1** `[lint]` | Storyboards reference assets as **`id@x.y.z`**, and only `published` ones (checked via `asset_lock.py --check`). |
| D2 | `frame → pixels` is a pure function. **Banned in kit code:** `Math.random`, `Date`, `performance.now`, network fetches and CDN fonts. Use `determinism.ts` (`seedFor`, `rand`, `onTwos`). |
| D3 | Element seeds are `hash(meta.seed, scene/element id)`, so adding an element never changes the others. |
| D4 | Published assets are **immutable**. Any visual change means a version bump. `assets.lock.json` holds the sha256 of every file, and CI fails on drift. |
| D5 | AI-generated images, voices or music are generated **once**, reviewed, frozen into the registry with their full provenance (`tool`, `model`, `prompt`, `seed`), and **never regenerated at render time**. |
| D6 | Fonts are vendored files (OFL), never CDN links. Toolchain versions are pinned exactly in `kit/package.json`. For pixel-identical renders across machines, render inside one Docker image. |
| D7 | Golden frames: after any change to tokens, assets or the kit, render `AssetSheetPaper`, `AssetSheetNight` and the middle frame of each scene, then compare against the previous output before publishing. |

## 9. Review checklist (human, against the contact sheet)
- [ ] Can I say the motif's meaning out loud, and does the thread visibly carry it?
- [ ] Does each scene *become* the next one (no unexplained jumps)?
- [ ] Is one colour doing one job everywhere it appears?
- [ ] Does each caption read in under half a second? Is the coloured word the right one?
- [ ] Does the TURN feel different (mode, sound and pace all change)?
- [ ] Does the last frame loop into the first?
- [ ] Muted test: does it still make sense? Eyes-closed test: does the audio pulse carry it?
