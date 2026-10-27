// Shared plumbing for diagram templates (template.*). A diagram is a pure function of
// (local frame, props, mode, seed): no hidden state, no randomness outside determinism.ts.
import {interpolate} from 'remotion';
import colorJson from '../../../tokens/color.tokens.json';
import {ease, type Mode} from '../tokens';

export type DiagramProps = {
	/** anchor in frame px */
	x: number;
	y: number;
	/** px per token-px (frame short side / 1080) × element scale */
	u: number;
	mode: Mode;
	/** frames since the element appeared in this scene */
	t: number;
	fps: number;
	seed: number;
	/** true when the element continues from the previous scene (morph): skip entry animations */
	persist: boolean;
	props: Record<string, unknown>;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 progress starting at `start` frames, lasting `len` frames, eased. Fully on when persisted. */
export const ramp = (d: DiagramProps, start: number, len: number, curve: 'enter' | 'draw' | 'standard' = 'enter') =>
	d.persist ? 1 : interpolate(d.t, [start, start + Math.max(1, len)], [0, 1], {...clamp, easing: ease(curve)});

/** Same, but keyed to an absolute "at" in seconds (events that happen inside a scene). */
export const rampAt = (d: DiagramProps, atSeconds: number | undefined, len: number, curve: 'enter' | 'draw' | 'standard' = 'enter') =>
	atSeconds === undefined ? 1 : d.persist && atSeconds <= 0 ? 1 : interpolate(d.t, [atSeconds * d.fps, atSeconds * d.fps + Math.max(1, len)], [0, 1], {...clamp, easing: ease(curve)});

/** Keyframed scalar: [{at (s), v}] → value at local frame, eased between keys. */
export const keyed = (d: DiagramProps, keys: Array<{at: number; v: number}>, len = 12) => {
	if (!keys.length) return 0;
	keys = [...keys].sort((a, b) => a.at - b.at);
	let v = keys[0].v;
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i].at * d.fps;
		v = interpolate(d.t, [a, a + len], [v, keys[i].v], {...clamp, easing: ease('standard')});
	}
	return v;
};

/** ARC data palette (index = ARC colour code). Same in both modes: the colours are content. */
export const arcColor = (code: number) => (colorJson.color.data.arc.$value as string[])[code] ?? (colorJson.color.data.arc.$value as string[])[0];

/** "a b c" → [a,b,c]; "abc" → [a,b,c] (unicode-safe). */
export const tokensOf = (s: unknown): string[] => {
	const str = String(s ?? '');
	return str.includes(' ') ? str.split(' ').filter(Boolean) : Array.from(str);
};

export const pct = (v: number) => `${Math.round(v * (v <= 1 ? 100 : 1))}%`;
