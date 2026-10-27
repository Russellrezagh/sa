# Assets: the deterministic nouns of every video

An **asset** is anything a storyboard can put on screen or into the mix. Assets are the reason two renders of the same storyboard are identical, and the reason video #12 looks like it belongs with video #1.

## 1. Principles

1. **Assets are objects, not files.** Each one has an identity (`id@version`), a kind, a lifecycle status, provenance, a licence and usage rules. Files are only its payload.
2. **Prefer structure over pixels.** Icons and characters are stored as *shape objects* (ink strokes, role-coloured washes and fills, plus an anchor), never as flat PNGs. That lets the kit draw them on, boil their lines, recolour them by role in both modes, and morph them. Bitmaps are a last resort, and must be hashed and treated.
3. **Immutable once published.** Any visual change means a new version. Old versions stay resolvable, so old storyboards still render identically.
4. **Generated once, frozen forever.** Anything made by a model (image, voice, music) is generated once, reviewed, and frozen with the exact `model`, `prompt` and `seed` in `provenance`. Nothing is generated at render time.
5. **Roles, not colours.** Asset files carry role names (`ink`, `concept-2`, `wash-skin`). The mode decides the hex value.

## 2. Layout

```
assets/
  ASSETS.md                 ← this file
  <kind>/<name>/asset.json  ← manifest (schema: ../schemas/asset.schema.json)
  <kind>/<name>/…           ← payload files listed in the manifest
../assets.lock.json         ← sha256 of every manifest + payload (tools/asset_lock.py)
```

| Kind | id prefix | Payload | Rendered by |
|---|---|---|---|
| motif | `motif.` | `paths.json` (named normalised paths) or none (procedural) | `Thread`, `Lens` |
| character | `character.` | `poses/base.json` + `poses/<pose>.json` + `SHEET.md` | `InkShape` |
| icon / prop | `icon.` / `prop.` | `shape.json` | `InkShape` |
| texture | `texture.` | none (procedural, seeded) | `Paper`, `InkShape` |
| treatment | `treatment.` | none or a LUT/pattern | (see §6) |
| footage | `footage.` | treated video/image file | `OffthreadVideo` / `Img` |
| font | `font.` | `.ttf` + `OFL.txt` | `fonts.ts` |
| sfx / bed / vo | `sfx.` `bed.` `vo.` | `.wav` (normalised) | `Audio` |
| template | `template.` | none (a kit component) | `Caption`, `SetupPayoff` |

## 3. The shape object format (`shape.json`)

```jsonc
{
  "viewBox": [0, 0, 200, 200],   // authoring space
  "anchor":  [100, 100],         // the point that lands on (x, y) in a storyboard
  "strokes": ["M…", "M…"],       // ink lines, drawn on in order, boiled on twos
  "threads": ["M…"],             // optional: lines drawn in THREAD colour (the motif inside an object)
  "washes":  [{ "d": "M…", "role": "concept-2", "opacity": 0.6 }],  // watercolour, off-register
  "fills":   [{ "d": "M…", "role": "ink-dark" }]                    // solid details (pupils, dots)
}
```
Authoring rules:
- Strokes are **open or closed paths, with no `stroke`/`fill` attributes**: style comes from tokens.
- Order strokes in the order a hand would draw them (outline → interior → details), because the draw-on follows that order.
- A wash path is the outline inset by ~2 units. The kit adds the bleed and the offset itself.
- Features on top of a wash use `ink-dark` (it does not change between modes).
- Keep each object under ~30 strokes. More detail is a sign it should be two objects.

## 4. Creating an asset (procedure for agents)

1. **Check that it is really missing**: search `assets.lock.json` for the id and its tags.
2. **Create the folder** at `assets/<kind>/<name>/` and add the payload. For a shape, author `shape.json` by hand. Alternatively, trace a frozen reference image into paths in a vector tool and export *paths only*.
3. **Write `asset.json`** with `status: "drafted"`, `version: "1.0.0"`, and full `provenance` (`source`, `author`, `created`, plus `tool`/`model`/`prompt`/`seed` if generated, and `reference` if it was inspired by something).
4. **Register it** in `kit/src/assetRegistry.ts` (a static import, so it is bundled).
5. **Look at it**: add it to `AssetSheet.tsx`, then render `AssetSheetPaper` and `AssetSheetNight`. Check it in both modes, next to its neighbours.
6. **Publish**: set `status: "published"`, run `python3 -I video-style/tools/asset_lock.py`, then `node kit/scripts/golden.mjs --update`. Commit everything together.

Changing a published asset follows the same steps, but bump the version: **patch** for an invisible fix, **minor** for an additive change (a new pose), **major** for anything that changes existing renders. Keep the old folder if any storyboard still uses it, either as `<name>@1/` or through a `files` path.

## 5. Characters (consistency)

A character is the hardest asset to keep consistent, so it gets the most structure:
- `SHEET.md` holds construction rules (proportions, features), palette roles, the pose list and the expression list.
- `poses/base.json` holds everything except arms and hands (and, later, the face). **Never edit it** without a major version.
- Each `poses/<pose>.json` holds only the parts that differ from the base. The kit merges them at render time.
- Storyboards change a character's pose *between* scenes, never by redrawing the character.
- If you use a generative model for a new character, generate a **turnaround sheet once**, trace it into `base.json` and pose files, and store the sheet as a `reference` file. Every later frame comes from the traced shapes, not from the model.

## 6. Footage and photos

Raw photos and footage are never shown (RULES V3). Treat them once, at ingest, then register the *result*:
```bash
# Pixel-halftone duotone: thread blue (#0B2FA6) for shadows → paper (#EDE9DC) for highlights.
# Deterministic (ffmpeg only). Cell size 7 px = texture.halftone.cell-px. Works on images and video.
ffmpeg -i in.mp4 -vf "format=gray,scale=iw/7:-1,scale=iw*7:-1:flags=neighbor,eq=contrast=1.3,format=rgb24,\
lutrgb=r='11+(237-11)*val/255':g='47+(233-47)*val/255':b='166+(220-166)*val/255'" -an treated.mp4
```
To use `ink` instead of `thread` for the shadows, replace `11/47/166` with the ink RGB values (`31/29/26`).
Record the exact command in `provenance.tool`. `treatment.halftone` is still `proposed`: a kit-native shader version is the next asset to build.

## 7. Audio

- `tools/gen_audio.py` synthesises the pulse, tick, ping and pencil sounds from seeds and rebuilds them byte-identically.
- Recorded or generated audio is normalised at ingest (pyloudnorm), and the measured LUFS goes in `description`.
- A VO is a `vo.<video-id>` asset. Its word timestamps (from `analyze_reference.py`'s `transcript`) drive caption timing.
