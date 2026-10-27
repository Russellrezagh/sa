# Everyperson: character sheet (v1.0.0)

**Role:** the audience surrogate. They ask the viewer's questions, get things wrong, and shrug. They never lecture.

## Construction (in `poses/base.json` coordinates, viewBox 200×400)
- The head is a soft rounded square, 80 units wide, with its top at y≈38 and chin at y=128. The head is 1/3 of the total height, which reads as "cute but adult".
- Eyes are two solid ink dots (r 4.5) at y=76, 32 units apart. They have **no eyelids and no pupils highlight**.
- The nose is a single "J" stroke. The mouth is a short shallow curve. Cheeks carry a `concept-3` blush at 35 % opacity.
- Hair is a short tuft: one outline plus four flick strokes, with a `concept-4` wash.
- The t-shirt has short sleeves and a chest pocket on the viewer's right, with a `wash-cloth` wash.
- Legs are plain trousers outline. Feet are flat wedges.

## Palette roles
`ink` (all lines) · `wash-skin` (face) · `wash-cloth` (shirt) · `concept-4` (hair) · `concept-3` (cheeks).
**Never** put a hex value on the character. Night mode re-maps these roles automatically.

## Poses (v1.0.0)
| pose | file | use |
|---|---|---|
| neutral | `poses/neutral.json` | listening, default |
| point | `poses/point.json` | "this one", introducing an object to the right |
| shrug | `poses/shrug.json` | "not really", elimination beats |

## Adding a pose or expression
1. Copy `neutral.json` and change only the arm, hand or face strokes. **Never change base.json** without a major version bump.
2. Add it to `poses` in `asset.json`, bump the minor version, and run `python3 video-style/tools/asset_lock.py`.
3. Render `AssetSheet` (see kit README) and check the new pose next to the existing ones.
