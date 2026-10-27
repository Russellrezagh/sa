// Maps asset ids (id@version) from the locked library to what the kit renders.
// Shapes are imported statically: they are bundled, hashed by asset_lock.py and
// never fetched at render time.
import leaf from '../../assets/icon/leaf/shape.json';
import eye from '../../assets/icon/eye/shape.json';
import watch from '../../assets/icon/watch/shape.json';
import magnifier from '../../assets/icon/magnifier/shape.json';
import base from '../../assets/character/everyperson/poses/base.json';
import neutral from '../../assets/character/everyperson/poses/neutral.json';
import point from '../../assets/character/everyperson/poses/point.json';
import shrug from '../../assets/character/everyperson/poses/shrug.json';
import threadPaths from '../../assets/motif/thread/paths.json';

export type Shape = {
	viewBox: number[];
	anchor: number[];
	strokes: string[];
	threads?: string[];
	washes: Array<{d: string; role: string; opacity?: number}>;
	fills: Array<{d: string; role: string}>;
};

const merge = (a: Shape, b: Partial<Shape>): Shape => ({
	...a,
	strokes: [...a.strokes, ...(b.strokes ?? [])],
	washes: [...a.washes, ...(b.washes ?? [])],
	fills: [...a.fills, ...(b.fills ?? [])],
});

const POSES: Record<string, Partial<Shape>> = {neutral, point, shrug};

type Entry = {kind: 'shape'; shape: (pose?: string) => Shape} | {kind: 'payoff'} | {kind: 'audio'; file: string};

const REGISTRY: Record<string, Entry> = {
	'icon.leaf@1.0.0': {kind: 'shape', shape: () => leaf as Shape},
	'icon.eye@1.0.0': {kind: 'shape', shape: () => eye as Shape},
	'icon.watch@1.0.0': {kind: 'shape', shape: () => watch as Shape},
	'icon.magnifier@1.0.0': {kind: 'shape', shape: () => magnifier as Shape},
	'character.everyperson@1.0.0': {
		kind: 'shape',
		shape: (pose = 'neutral') => {
			const p = POSES[pose];
			if (!p) throw new Error(`character.everyperson@1.0.0 has no pose "${pose}"`);
			return merge(base as Shape, p);
		},
	},
	'template.caption@1.0.0': {kind: 'payoff'},
	'sfx.pulse-tick@1.0.0': {kind: 'audio', file: 'sfx/pulse-tick/tick.wav'},
	'sfx.ripple-ping@1.0.0': {kind: 'audio', file: 'sfx/ripple-ping/ping.wav'},
	'sfx.pencil@1.0.0': {kind: 'audio', file: 'sfx/pencil/pencil.wav'},
	'bed.pulse-70@1.0.0': {kind: 'audio', file: 'bed/pulse-70/pulse-70bpm-9bars.wav'},
};

export const resolveAsset = (ref: string): Entry => {
	const e = REGISTRY[ref];
	// Unknown refs are a hard error: the renderer may not invent assets.
	if (!e) throw new Error(`Asset ${ref} is not registered in kit/src/assetRegistry.ts`);
	return e;
};

export const THREAD_PATHS = threadPaths as unknown as Record<'portrait' | 'landscape', Record<string, string>>;

/** Scale a path authored in normalised (0..1) frame space to pixels. */
export const scalePath = (d: string, w: number, h: number) => {
	let i = 0;
	return d.replace(/-?\d*\.?\d+/g, (n) => {
		const v = parseFloat(n) * (i++ % 2 === 0 ? w : h);
		return v.toFixed(2);
	});
};

