// Typed access to video-style/tokens/*.json. Components read values ONLY through
// this module: no hex codes, pixel sizes or durations are hard-coded elsewhere.
import {Easing} from 'remotion';
import colorJson from '../../tokens/color.tokens.json';
import typeJson from '../../tokens/typography.tokens.json';
import motionJson from '../../tokens/motion.tokens.json';
import layoutJson from '../../tokens/layout.tokens.json';
import textureJson from '../../tokens/texture.tokens.json';

export type Mode = 'paper' | 'night';
export type Format = 'portrait' | 'landscape';
export type Role =
	| 'bg' | 'bg-shade' | 'ink' | 'ink-soft' | 'guide' | 'thread' | 'caption-base' | 'emph'
	| 'concept-1' | 'concept-2' | 'concept-3' | 'concept-4' | 'concept-5' | 'wash-skin' | 'wash-cloth' | 'highlight' | 'ink-dark';

type ColorGroup = Record<string, {$value: string}>;

export const color = (mode: Mode, role: Role): string => {
	const group = colorJson.color[mode] as unknown as ColorGroup;
	const v = group[role]?.$value;
	if (!v) throw new Error(`Unknown colour role "${role}" in mode "${mode}"`);
	return v;
};

export const colorRule = (name: 'max-concept-roles-per-video' | 'max-accent-roles-per-scene' | 'thread-words-per-scene-max' | 'wash-opacity' | 'wash-opacity-night' | 'halo-opacity'): number =>
	(colorJson.color.rules as unknown as Record<string, {$value: number}>)[name].$value;

// --- typography -------------------------------------------------------------
type StyleName = keyof typeof typeJson.font.style;
const family = (k: string) => (typeJson.font.family as Record<string, {$value: string}>)[k].$value;

/** Px per token-px: tokens are authored for a frame whose SHORT side is 1080 px (portrait or landscape). */
export const unit = (width: number, height: number) => Math.min(width, height) / 1080;

/** CSS for a named text style. `short` is the frame's short side (Math.min(width, height)). */
export const textStyle = (name: StyleName, short: number, sizeName?: keyof typeof typeJson.font.size) => {
	const s = typeJson.font.style[name] as {family: string; style: string; weight: number; lineHeight: number; letterSpacing: string; decoration?: string};
	const sizeKey = (sizeName ?? name) as keyof typeof typeJson.font.size;
	const px = parseFloat(typeJson.font.size[sizeKey].$value) * (short / 1080);
	return {
		fontFamily: `"${family(s.family)}"`,
		fontStyle: s.style,
		fontWeight: s.weight,
		lineHeight: s.lineHeight,
		letterSpacing: s.letterSpacing,
		fontSize: px,
		textDecoration: s.decoration ?? 'none',
	} as const;
};

// --- motion -----------------------------------------------------------------
const M = motionJson.motion;
/** Duration token converted from 30-fps frames to the composition's fps. */
export const dur = (name: keyof typeof M.duration, fps: number) =>
	Math.round((M.duration[name].$value * fps) / 30);

export const ease = (name: keyof typeof M.ease) => {
	const [a, b, c, d] = M.ease[name].$value as number[];
	return Easing.bezier(a, b, c, d);
};

export const spring = (name: keyof typeof M.spring) => M.spring[name].$value;
export const cadence = M.cadence;
export const boil = {amplitude: M.boil['amplitude-px'].$value, variants: M.boil.variants.$value};
export const camera = {push: M.camera['push-scale'].$value, zoomThrough: M.camera['zoom-through'].$value};
export const dialogueMotion = {
	bobPx: M.dialogue['talk-bob-px'].$value,
	bobHz: M.dialogue['talk-bob-hz'].$value,
	swell: M.dialogue['thread-swell'].$value,
	ramp: M.dialogue['speak-ramp-frames'].$value,
};

type TransitionName = keyof typeof M.transition;
export const transitionFrames = (name: string, fps: number) => {
	const t = (M.transition as Record<string, {frames?: number}>)[name as TransitionName];
	return Math.round(((t?.frames ?? 0) * fps) / 30);
};

// --- layout -----------------------------------------------------------------
export const layout = (format: Format) => layoutJson.layout[format];

// --- texture ----------------------------------------------------------------
export const texture = textureJson.texture;
