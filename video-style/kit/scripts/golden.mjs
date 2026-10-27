// Golden frames: bundle once, render the middle frame of every scene plus the asset sheets,
// and hash the pixels. Proves determinism and catches unintended visual drift.
//
//   node scripts/golden.mjs            # compare against ../golden/<composition>.json (fails on drift)
//   node scripts/golden.mjs --update   # (re)write the golden hashes after an intended change
//
// Each frame is stored as a perceptual signature (mean luminance per 18x18 px cell) plus an exact
// sha256. Comparison uses the signature with a tolerance of TOLERANCE/255 per cell: Chrome's rasteriser
// can flip a handful of antialiased pixels by ±2 levels between runs, which is not drift. Anything
// that moves, recolours or reshapes an element changes many cells by far more than the tolerance.
// Env: REMOTION_BROWSER=<path to chrome-headless-shell> if Remotion cannot download its own.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {mkdirSync, readFileSync, writeFileSync, existsSync, rmSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, '..');
const goldenDir = resolve(kit, '../golden');
const update = process.argv.includes('--update');
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const CELL = 18;
const TOLERANCE = 2;

// Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Chrome screenshots produce).
const decodePng = (buf) => {
	let pos = 8, width = 0, height = 0, channels = 4;
	const idat = [];
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos);
		const type = buf.toString('ascii', pos + 4, pos + 8);
		const data = buf.subarray(pos + 8, pos + 8 + len);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0); height = data.readUInt32BE(4);
			if (data[8] !== 8 || data[12] !== 0) throw new Error('unsupported PNG');
			channels = {2: 3, 6: 4}[data[9]];
		} else if (type === 'IDAT') idat.push(data);
		pos += 12 + len;
	}
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const px = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y++) {
		const f = raw[y * (stride + 1)];
		for (let x = 0; x < stride; x++) {
			const v = raw[y * (stride + 1) + 1 + x];
			const a = x >= channels ? px[y * stride + x - channels] : 0;
			const b = y ? px[(y - 1) * stride + x] : 0;
			const c = x >= channels && y ? px[(y - 1) * stride + x - channels] : 0;
			const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
			const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
			px[y * stride + x] = (v + pred) & 255;
		}
	}
	return {width, height, channels, px};
};

const signature = (buf) => {
	const {width, height, channels, px} = decodePng(buf);
	const cw = Math.ceil(width / CELL), ch = Math.ceil(height / CELL);
	const sum = new Float64Array(cw * ch), n = new Float64Array(cw * ch);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * channels;
			const k = Math.floor(y / CELL) * cw + Math.floor(x / CELL);
			sum[k] += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
			n[k]++;
		}
	return Buffer.from(Array.from(sum, (s, k) => Math.round(s / n[k]))).toString('base64');
};

const compare = (a, b) => {
	const x = Buffer.from(a, 'base64'), y = Buffer.from(b, 'base64');
	if (x.length !== y.length) return Infinity;
	let worst = 0;
	for (let i = 0; i < x.length; i++) worst = Math.max(worst, Math.abs(x[i] - y[i]));
	return worst;
};

const serveUrl = await bundle({entryPoint: join(kit, 'src/index.ts'), publicDir: resolve(kit, '../assets')});
const tmp = join(tmpdir(), `mai-golden-${process.pid}`);
mkdirSync(tmp, {recursive: true});
mkdirSync(goldenDir, {recursive: true});

const boards = {
	MaiDemo: JSON.parse(readFileSync(join(kit, 'src/storyboards/give-it-a-thread.json'), 'utf8')),
	MaiDialogue: JSON.parse(readFileSync(join(kit, 'src/storyboards/the-thread-dialogue.json'), 'utf8')),
};
const targets = [['AssetSheetPaper', [0]], ['AssetSheetNight', [0]]];
for (const [id, board] of Object.entries(boards)) {
	const frames = board.beats.flatMap((b) => b.scenes).map((s) => s.from + Math.floor(s.frames / 2));
	targets.push([id, [0, ...frames, board.meta.total_frames - 1]]);
}

let drift = 0;
for (const [id, frames] of targets) {
	const composition = await selectComposition({serveUrl, id, browserExecutable});
	const hashes = {};
	for (const frame of frames) {
		const output = join(tmp, `${id}-${frame}.png`);
		await renderStill({composition, serveUrl, output, frame, browserExecutable, imageFormat: 'png'});
		const png = readFileSync(output);
		hashes[frame] = {sha256: createHash('sha256').update(png).digest('hex'), sig: signature(png)};
	}
	const file = join(goldenDir, `${id}.json`);
	if (update || !existsSync(file)) {
		writeFileSync(file, JSON.stringify(hashes, null, 1) + '\n');
		console.log(`wrote ${id}: ${frames.length} frames`);
		continue;
	}
	const golden = JSON.parse(readFileSync(file, 'utf8'));
	for (const [frame, h] of Object.entries(hashes)) {
		const worst = golden[frame] ? compare(golden[frame].sig, h.sig) : Infinity;
		if (worst > TOLERANCE) {
			drift++;
			console.log(`DRIFT ${id} frame ${frame} (worst cell Δ${worst}): rendered ${join(tmp, `${id}-${frame}.png`)}`);
		} else if (golden[frame].sha256 !== h.sha256) {
			console.log(`ok    ${id} frame ${frame}: antialiasing jitter only (worst cell Δ${worst})`);
		}
	}
	console.log(`${id}: ${frames.length} frames checked`);
}
if (!drift) rmSync(tmp, {recursive: true, force: true});
process.exit(drift ? 1 : 0);
