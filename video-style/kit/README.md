# MAI render kit (Remotion 4.0.539)

Renders compiled storyboards (`src/storyboards/*.json`, produced by `tools/lint_storyboard.py --emit`).
The public dir is `../assets`, the locked asset library itself.

| Command | Does |
|---|---|
| `npm ci` | install exact pinned versions (package-lock.json) |
| `npx remotion studio` | interactive preview |
| `npx remotion render MaiDemo out/mai-demo.mp4` | render the example video |
| `npx remotion still AssetSheetPaper out/sheet.png` | QA still with every asset (also `AssetSheetNight`) |
| `node scripts/golden.mjs [--update]` | determinism and regression check on key frames |
| `npx tsc --noEmit` | typecheck |

Sandbox without a downloadable Chrome: add `--browser-executable=/path/to/chrome-headless-shell`
(CLI), or set `REMOTION_BROWSER` (golden script).

## Source map
- `src/tokens.ts`: the only door to token values (colour roles, type styles, durations, eases).
- `src/determinism.ts`: `seedFor`, `rand`, `onTwos`, `boilVariant`. No other randomness is allowed.
- `src/assetRegistry.ts`: maps `id@version` → renderable. An unknown ref throws.
- `src/Storyboard.tsx`: scene sequencing, transitions, and the single persistent thread.
- `src/components/*`: Paper, InkShape, Thread, Caption, Header, SetupPayoff, Lens, TrackBox.
- `src/AssetSheet.tsx`: QA still.

Licensing: Remotion is free for individuals and small teams, but companies of 4+ people need a company licence (see remotion.dev/license).
