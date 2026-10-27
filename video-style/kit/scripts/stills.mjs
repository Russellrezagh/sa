// Render many stills of one composition with a single bundle (fast preview of key frames).
//   node scripts/stills.mjs <CompositionId> <outDir> <frame> [frame ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const kit = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, outDir, ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: join(kit, 'src/index.ts'), publicDir: resolve(kit, '../assets')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const f of frames.map(Number)) {
	await renderStill({composition, serveUrl, frame: f, output: join(outDir, `${id}-${String(f).padStart(6, '0')}.png`), browserExecutable});
	console.log('frame', f);
}
