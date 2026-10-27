# Reference analysis: four reels → one emergent style

Method: each reel was downloaded (yt-dlp), cut-detected (ffmpeg `scene>0.3`), sampled into timestamped contact sheets (1 fps; 0.5 fps for the 3-minute reel), colour-clustered (k-means on all pixels, and separately on chromatic pixels only), and measured for motion energy (mean absolute frame difference at 4 fps). Audio was analysed with librosa and transcribed with word timestamps (faster-whisper `small`). The raw numbers are in `fingerprints/*.json`. To redo or extend this work, run `tools/analyze_reference.py`. The media itself is **not** committed.

## 0. Measured side-by-side

| | **A · GraduateML**<br>"Loss function" | **B · Philosophy of Everything**<br>"Who are you?" | **C · AutoAE**<br>"What is a good video? Ep.3 · Dunkirk" | **D · AutoAE**<br>"Agent 3.0" promo |
|---|---|---|---|---|
| Link | [reel](https://www.instagram.com/reel/DeP8tjxpP6L/) | [reel](https://www.instagram.com/reel/Derh-N6ivLS/) | [reel](https://www.instagram.com/reel/De9SYDwhTG0/) | [reel](https://www.instagram.com/reel/De4KWbRByU_/) |
| Format | 1080×1920, 60 fps, 40 s | 1080×1920, 30 fps, 179 s | 1916×1078, 24 fps, 44 s | 960×720, 30 fps, 50 s |
| Hard cuts | **0** | **0** | 11 | 29 (a burst of stop-motion at 35–38 s) |
| Mean luminance (0–255) | 17 (dark) | 220 (paper) | 203 (off-white) | 94 (tungsten) |
| Mean saturation | 0.05 | 0.09 | 0.11 | 0.17 |
| Motion energy mean / p90 | 2.4 / 5.5 | 6.3 / 13.0 | 11.7 / 19.2 | 16.3 / 53.5 |
| Voice pace | **200 wpm**, 1 pause > 0.6 s | **120 wpm**, 36 pauses | **175 wpm**, 4 pauses | 137 wpm, 9 pauses |
| Background | `#090f13` | `#ede9dc` | `#f4f2f3` | wood `#784420` / dark `#201608` |
| Accents (chromatic clusters) | rust `#d96a4d`, teal `#4c99a2`, blue `#5dabe5`, green `#43934a` | rust `#c34832`, teal `#336665`, peach `#eabb8d`, ochre `#e8ad3c` | **one hue only**: blue `#002ca5` (81 % of chromatic px) | red `#700f0f`, brown `#7c4a24` |
| Likes (at capture) | 34.2 k | 27.8 k | 1.8 k | 17 |

Engagement is not a quality score, but it is a signal: the two reels that never cut (A, B) are also the two most-liked.

---

## A · GraduateML: "If you…, you get…"
**What it is:** a math-animation (Manim-like) explainer with one continuous camera shot. A number line becomes an error bar, then a squared-error *area*, then a loss parabola, then gradient steps, then shrinking squares, then a grid of many parabolas, then a fitted curve, then data × model × compute, then a galaxy, and finally it rewinds to a single prediction. The last frame equals the first frame, so the reel loops.

| Steal | Leave | Why |
|---|---|---|
| **Zero cuts: each object *becomes* the next** (the error bar literally grows into the e² square) | 200 wpm (just at the edge of comprehension) | Continuity makes abstraction feel inevitable instead of asserted |
| **Semantic colour**: ŷ is always blue and y is always green; error/loss red, gradient orange, model teal | Cold flat look, with no texture or warmth | The colour *is* the legend, so no labels are needed |
| A persistent **header equation** that updates in place | Tiny text in 9:16 (headers are ~3 % of height) | It anchors the viewer while the stage changes |
| **Anaphora ladder** script: "If X, you get Y" ×9, then "rewind → one prediction" | The bottom 40 % of the frame is empty | The ladder structure *is* the argument structure |
| Glow halos on key points; a perfect loop ending | | Halos guide the eye without arrows, and the loop makes the reel rewatchable |

## B · Philosophy of Everything: "Who are you?"
**What it is:** a contemplative Socratic monologue. A recurring line-drawn character ("John") stands on warm paper. Ink lines carry watercolour washes that *miss* the line. Captions are 2–4 words of serif italic, teal with one rust keyword. A glassy drop sits top-right as a persistent "observer" motif and ripples when the observer is named. Eliminated hypotheses appear struck through at top-left (~~face~~ · ~~eyes~~). The set pieces are embossed hands, marbled liquid and a cinema of seats.

| Steal | Leave | Why |
|---|---|---|
| **Paper + ink + off-register watercolour**: warm, human, forgiving | 3-minute runtime, where it sags in the middle | The tactile look buys patience for hard ideas |
| **Audience-surrogate character** who asks the viewer's questions | Some long static holds | Empathy, plus a consistent anchor across scenes |
| **Captions:** 2–4 words, serif italic, base colour plus **one keyword in an accent** | | The text reads in under 0.5 s and the keyword *is* the summary |
| **Persistent motif in a fixed home** (the drop) that reacts when named | | It is the visual thesis, always present |
| **Breadcrumb of struck-through eliminations** | | It shows the progress of an argument by negation |
| **Ring structure**: "Who are you?" → "I am." | | The ending re-reads the beginning |
| 120 wpm with real pauses after questions | | Room to think |

## C · AutoAE "What is a good video?" Ep.3 · Dunkirk
**What it is:** an editorial essay on one idea, *mài* (脉, the thread through a story). It uses **one blue** on off-white, a **literal blue thread** that runs through every scene and ties photos, portraits and words together, film stills treated as halftone/stipple, CV tracking boxes with coordinates ("0.37, 0.32"), visible dashed layout guides with corner crosshairs, multi-script typography (πaλμός, пульс, 맥박, 脈拍) as texture, setup/payoff type pairs ("the thread that runs through a / **story.**"), and a subtractive audio demo ("take away the voices, the gunfire, the music… a watch").

| Steal | Leave | Why |
|---|---|---|
| **The thread itself: the motif *is* the idea** and physically connects every scene | Landscape 16:9 on a vertical platform | It solves the cut problem *and* the thesis problem at once |
| **One-accent discipline** (81 % of chromatic pixels are one hue) | Some cuts are unmotivated | Restraint reads as confidence, and the accent always means "this matters" |
| **Treatment of all footage** (halftone, stipple, ASCII) | | Mixed sources look like one world |
| **Setup/payoff typography** (small grey lead-in, huge word) | | Rhythm without animation tricks |
| **CV tracking annotation** layer | | It says "look closer" and adds a precise, scientific texture |
| **"Listen." strip beat**: remove layers until only the pulse remains | | The most memorable 6 seconds; it demonstrates instead of telling |
| **Pulse** (watch tick) as the hidden rhythm | | You feel it before you notice it |

## D · AutoAE Agent 3.0 promo
**What it is:** tactile stop-motion on a wood table and red cloth. It uses sticker cut-outs with white borders, a notebook, paper cards with pencil sketches, hands entering frame, a vacuum cleaner that "erases" a word, a retro CRT, a cinematic silhouette by a window, film grain and a warm vignette. The type mixes a condensed serif italic with handwritten marker. It ends on the joke `final_REALLY_final.aep`.

| Steal | Leave | Why |
|---|---|---|
| **Tactile, physical imperfection** (paper, grain, hands, on-twos stutter) | 4:3 at 960×720, which looks muddy | Imperfection reads as handmade and trustworthy |
| **Hand-written marginalia** for asides | Product-ad structure and stock-like silhouettes | It gives the video a voice of its own |
| **Humour beat** right before the payoff (the stacked Save-As dialogs) | Busy wood texture behind text | A laugh resets attention before the CTA |
| **Physical-metaphor transitions** (vacuum erases text, a card tears to reveal the next) | 29 cuts | Transitions that *mean* something |

---

## 1. Why merging them makes something better than each

Each reel has a strength that patches another's weakness:

| Weakness in… | …is fixed by the strength of |
|---|---|
| A is cold, untextured and has tiny type | B's paper/ink/watercolour warmth, B's caption system, C's setup/payoff scale |
| B is long and sometimes static | A's continuous morphing and ladder pacing; C's 175 wpm editorial tempo |
| C cuts between unrelated sources | A's "object becomes object" rule; the thread from C now *carries* every transition |
| D is busy, ad-like and full of cuts | C's one-accent restraint; B's quiet negative space |
| A, B and C have no humour | D's comic beat before the payoff |

**Emergent properties**, which no single reel has:

1. **Precise diagrams, drawn by hand.** A's math-grade semantic diagrams are rendered in B's ink and watercolour. Rigour now reads as warmth, and warmth gains authority.
2. **The thread carries every transition.** C's motif plus A's no-cut rule means the motif physically *is* the transition. The video never cuts, yet it can travel between totally different worlds (paper → night → photo treatment).
3. **Semantic watercolour.** A's concept colour coding is applied as B's washes, so a concept looks the same as a caption keyword, as a diagram fill and as a character's prop.
4. **Two frame rates at once.** D's on-twos stutter applies to drawn things, while the thread and camera move on ones (A's smoothness). The result is a world that feels handmade with a guiding line that feels inevitable.
5. **The mode switch as the turn.** Paper is the default (B, C). The TURN beat flips to night (A) for C's "strip" demonstration, so the one big visual change marks the one big idea.
6. **Two eliminations make a ladder.** B's struck-through breadcrumb plus A's "If X, you get Y" gives two complementary argument engines: building up (ladder) and ruling out (elimination). Both are shown in the header zone.
7. **Ring structure everywhere.** All four reels end by echoing their opening (A: rewind to one prediction; B: "Who are you?" → "I am"; C: mài → "Give it a mài"; D: "things I want to create" → "things I really want to create"). This is the most universal pattern found, so it is a hard rule (N2).

The merged house style is called **MAI** (脉) after C's word, because the thread is the organising idea of the whole system.
