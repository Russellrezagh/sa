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
import facade from '../../assets/icon/facade/shape.json';
import chip from '../../assets/icon/chip/shape.json';

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

export type DiagramName =
	| 'analogy' | 'alphabet' | 'slipnet' | 'thermometer' | 'codelets' | 'lines' | 'bars' | 'venn'
	| 'arc' | 'rule' | 'dimensions' | 'citation' | 'label';

type Entry = {kind: 'shape'; shape: (pose?: string) => Shape} | {kind: 'payoff'} | {kind: 'audio'; file: string} | {kind: 'diagram'; name: DiagramName};

const DIAGRAMS: DiagramName[] = ['analogy', 'alphabet', 'slipnet', 'thermometer', 'codelets', 'lines', 'bars', 'venn', 'arc', 'rule', 'dimensions', 'citation', 'label'];

const REGISTRY: Record<string, Entry> = {
	'icon.leaf@1.0.0': {kind: 'shape', shape: () => leaf as Shape},
	'icon.eye@1.0.0': {kind: 'shape', shape: () => eye as Shape},
	'icon.watch@1.0.0': {kind: 'shape', shape: () => watch as Shape},
	'icon.magnifier@1.0.0': {kind: 'shape', shape: () => magnifier as Shape},
	'icon.facade@1.0.0': {kind: 'shape', shape: () => facade as Shape},
	'icon.chip@1.0.0': {kind: 'shape', shape: () => chip as Shape},
	...Object.fromEntries(DIAGRAMS.map((n) => [`template.${n}@1.0.0`, {kind: 'diagram', name: n} as Entry])),
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

const VO_FILES: Record<string, string> = {'the-thread-dialogue': 'dialogue.wav'};

export const resolveAsset = (ref: string): Entry => {
	// Dialogue VO tracks are generated per video by tools/dialogue.py: vo.<id>@x.y.z → vo/<id>/dialogue.wav
	const vo = /^vo\.([a-z0-9-]+)@\d+\.\d+\.\d+$/.exec(ref);
	// FLAC from tools/dialogue.py (lossless); older boards froze WAV
	if (vo) return {kind: 'audio', file: `vo/${vo[1]}/${VO_FILES[vo[1]] ?? 'dialogue.flac'}`};
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

