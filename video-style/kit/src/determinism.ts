// Every pixel is f(frame, storyboard, assets, seed). These helpers are the only
// sanctioned sources of variation. Math.random(), Date and network calls are banned.
import {random} from 'remotion';

/** FNV-1a 32-bit. Stable across machines, so element seeds never drift. */
export const hashSeed = (...parts: Array<string | number>): number => {
	let h = 0x811c9dc5;
	const s = parts.join('|');
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
};

/** Per-element seed: hash(globalSeed, elementId). Adding an element never reshuffles others. */
export const seedFor = (globalSeed: number, id: string) => hashSeed(globalSeed, id);

/** Deterministic float in [0,1) for (seed, ...keys). */
export const rand = (seed: number, ...keys: Array<string | number>) => random(`${seed}|${keys.join('|')}`);

/** Quantise time for things that move "on twos" (hand-drawn cadence). */
export const onTwos = (frame: number, step = 2) => frame - (frame % step);

/** Which boil variant is showing at this frame (cycles 0..variants-1, changing every `step` frames). */
export const boilVariant = (frame: number, variants: number, step = 2) => Math.floor(frame / step) % variants;
