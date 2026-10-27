# MAI Video System: Domain Model

Read this before writing any video code. It names the things that exist in this system and the rules that tie them together. `RULES.md` holds the style rules, `SKILL.md` holds the agent workflow, and this file holds the vocabulary both of them use.

> **脉 (mài)**: the veins in a leaf, the thread that runs through a story. The house style is named after the idea that one of the reference videos teaches and all four practise: **every video has one visible thread that carries the idea from the first frame to the last.**

---

## 1. Bounded contexts

```
┌──────────────────┐   ┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│  STYLE           │   │  ASSET LIBRARY   │   │  STORY            │   │  RENDER          │
│  (what it looks  │──▶│  (the nouns we   │──▶│  (what happens,   │──▶│  (pure function  │
│   and moves like)│   │   are allowed to │   │   in what order)  │   │   frame → pixels)│
│                  │   │   put on screen) │   │                   │   │                  │
│  Token           │   │  Asset           │   │  Storyboard       │   │  Composition     │
│  Palette/Role    │   │  Motif           │   │  Beat             │   │  Lockfile        │
│  Mode            │   │  Character       │   │  Scene            │   │  Seed            │
│  Layout grid     │   │  Texture         │   │  Caption          │   │  Golden frames   │
│  Motion curve    │   │  Font / Sound    │   │  Transition       │   │                  │
└──────────────────┘   └──────────────────┘   └───────────────────┘   └──────────────────┘
   tokens/*.json         assets/registry.json   storyboards/*.yaml      kit/ (Remotion)
```

Dependencies only point to the right. A storyboard can refer to tokens and assets. Tokens and assets never refer to a storyboard. The renderer reads all three and may not invent anything that is missing from them. That one-way flow is what keeps the system deterministic.

---

## 2. Entities and value objects

### Style context

| Concept | Kind | Identity / shape | Invariants |
|---|---|---|---|
| **Token** | value object | `group.name` (e.g. `color.paper.bg`), DTCG `{$type,$value}` | Tokens are the only place a raw hex, ms, px or font name may appear. Code reads tokens and never hard-codes these values. |
| **Mode** | enum | `paper` (default, light) · `night` (dark) | Every colour *role* has a value in both modes. A scene sits in exactly one mode. |
| **Role** | value object | semantic colour slot: `ink`, `bg`, `thread`, `emph`, `concept.1..5`, `danger` | Content picks a role, never a hex value. A concept keeps its role for the whole video (ŷ is always `concept.1`). |
| **Motion curve** | value object | `motion.ease.*`, `motion.duration.*` in frames | Durations are stored in **frames at 30 fps** and converted for other fps. |
| **Layout zone** | value object | `layout.zone.header/stage/caption/safe` as fractions of the frame | Key information never sits inside `safe` (the platform UI area). |

### Asset-library context

| Concept | Kind | Identity | Invariants |
|---|---|---|---|
| **Asset** | entity | `id@version` (e.g. `motif.thread@1.0.0`) plus a `sha256` per file | Immutable once published. A change means a new version, and the old version stays resolvable. |
| **Motif** *(an Asset subtype)* | entity | `motif.*` | **Exactly one primary motif per video** (the mài). It has a home position, a set of states, and must be on screen or audible in ≥ 80 % of the runtime. |
| **Character** *(an Asset subtype)* | entity | `character.*` | Ships with a character sheet: construction rules, palette roles, pose list and expression list. Poses are discrete sub-assets, so nobody re-draws the character freehand. |
| **Prop / Icon** | entity | `prop.*`, `icon.*` | Drawn in the house line style: ink stroke plus watercolour fill on a role colour. |
| **Texture** | entity | `texture.*` | Procedural, from a seed plus parameters. Bitmap textures are allowed only when hashed. |
| **Footage** | entity | `footage.*` | Never shown raw. It always goes through a **treatment** (`halftone`, `stipple`, `ascii`, `duotone`). |
| **Font** | entity | `font.*` | Vendored file plus licence. Never loaded from a CDN at render time. |
| **Sound** | entity | `sfx.*`, `bed.*`, `vo.*` | Loudness-normalised at ingest, with LUFS recorded in the manifest. |
| **Provenance** | value object | `{source, tool, model, prompt, seed, author, licence, created}` | Required for every asset. Generated assets record the exact prompt, model and seed, and are **never regenerated at render time**. |

### Story context

| Concept | Kind | Identity | Invariants |
|---|---|---|---|
| **Storyboard** | aggregate root | file path, `meta.id` | Owns beats and scenes. Declares `mode`, `fps`, `size`, `seed`, `motif`, `cast`. It validates against `schemas/storyboard.schema.json` and passes `tools/lint_storyboard.py`. |
| **Beat** | entity | `beats[i].id` | Its type is one of `HOOK, DEFINE, LADDER, TURN, RULE, RETURN` (see RULES §2). Order is constrained: HOOK comes first, RETURN comes last, TURN comes exactly once. |
| **Scene** | entity | `scene.id` | Belongs to one beat and uses one layout template. Lists the assets it uses (`id@version`), its captions, its motif state and its transition *out*. |
| **Caption** | value object | `{text, start, end, emph[]}` | 1–4 words, ≤ 28 characters, held ≥ 0.4 s, and at most one word marked `thread`. |
| **Transition** | value object | `{type, frames}` from the catalogue | It is continuity by default (`morph`, `carry`, `push`, `draw-through`). A hard `cut` is a punctuation mark, used at most 3 times a minute. |
| **Breadcrumb** | value object | list of eliminated ideas | Rendered in the header with a strike-through, to show the hypotheses the story has ruled out. |
| **Dialogue** | value object | `meta.dialogue {mode, speakers}` | Mode is `curious` or `socratic`. Exactly two speakers. |
| **Speaker** | entity | `speakers[].id` | Its role is `guide` (leads; embodied by the thread) or `learner` (asks; embodied by a `character.*` on the cast layer). It has a frozen `voice.*` asset. |
| **Line** | value object | `{speaker, text, say?, emph?}` → timed `{at, until, audio}` | One utterance. It is synthesised once and frozen as `assets/vo/<video>/lines/<speaker>-<hash>.wav`. Captions are verbatim chunks of it. |
| **Cast state** | value object | `scene.cast[speakerId] {pose, x, y, scale}` | Where a speaker's character is during a scene. Characters persist across scenes, like the thread, and walk between states. |

### Render context

| Concept | Kind | Invariants |
|---|---|---|
| **Composition** | function | `frame → pixels` is pure. No `Math.random`, `Date`, network calls or unseeded noise. |
| **Seed** | value object | One global `meta.seed`. An element's seed is `hash(meta.seed, element.id)`, so adding an element never reshuffles the others. |
| **Lockfile** | entity | `assets.lock.json` maps `id@version → sha256` for every file. The renderer refuses to run on a mismatch. |
| **Golden frames** | value object | Key frames (the first frame of each scene) are rendered and hashed, then compared in CI after any change to tokens, assets or the kit. |

---

## 3. Lifecycle of a video

```
 brief ──▶ script ──▶ storyboard.yaml ──lint──▶ asset resolution ──lock──▶ render ──▶ QA ──▶ publish
            │             │                         │                                  │
            │             └─ beats, scenes,         └─ missing asset? create it ONCE,  └─ contact sheet,
            │                captions, motif           register it with provenance,      loudness, golden
            └─ RULES §2 narrative grammar              hash it, never regenerate          frame diff
```

States of a **Storyboard**: `draft → linted → locked → rendered → approved`. Each state is reached only through its tool:

| Transition | Gate |
|---|---|
| draft → linted | `python3 video-style/tools/lint_storyboard.py <file>` exits with 0 |
| linted → locked | `python3 video-style/tools/asset_lock.py --check <file>` verifies that every referenced `id@version` exists and its hash matches |
| locked → rendered | the kit renders it (`kit/`), with no network access |
| rendered → approved | human review of the contact sheet (`tools/contact_sheet.sh`) |

States of an **Asset**: `proposed → drafted → reviewed → published (frozen) → deprecated`. Only `published` assets may be referenced in a storyboard that is `locked`.

---

## 4. Ubiquitous language (use these words in code and docs)

- **Thread / mài**: the primary motif. It is not decoration: it *is* the idea, made visible.
- **Home**: the motif's resting position (top-right of the stage) while another element has focus.
- **Pulse**: the motif's audible counterpart, a low tick or heartbeat bed (60–80 bpm) under the voice-over.
- **Ladder**: an escalating chain (“If X, you get Y…”) where each rung visibly *becomes* the next.
- **Elimination**: a Socratic step (“Are you this face? No.”) that sends an idea to the breadcrumb, struck through.
- **Strip**: subtractive demonstration (“take away the voices, take away the gunfire…”). Layers are removed until the thread is the only thing left.
- **Return**: the final beat, which echoes the hook so the last frame can loop into the first.
- **Guide / learner**: the two dialogue voices. The guide leads and *is* the thread; the learner asks and *is* the character.
- **Turn marker**: the `•` that opens each new guide turn in the captions.
- **Two-voice ladder**: the learner proposes the rung ("So if…?") and the guide completes it ("…then you get…").
- **Treatment**: the mandatory stylisation applied to any photo or footage.
- **Boil**: seeded per-frame jitter of ink lines, stepped on twos, which makes drawings feel alive.
- **On twos**: hand-drawn elements update every 2nd frame (12 fps feel) while the camera and the thread move on ones (smooth). This mix is the house signature.
