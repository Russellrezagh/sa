// Mirrors schemas/storyboard.schema.json plus the timing fields added by
// tools/lint_storyboard.py --emit (from, frames, beat, meta.total_frames).
import type {Format, Mode, Role} from './tokens';

export type MotifState = 'home' | 'travel' | 'underline' | 'knot' | 'pulse' | 'carry' | 'strip' | 'absent';
export type TransitionType = 'morph' | 'carry' | 'push' | 'draw-through' | 'zoom-through' | 'wash' | 'cut' | 'end-loop';

export type Caption = {text: string; at: number; until: number; emph?: Array<{word: string; role: Role}>};

export type Element = {
	id: string;
	asset: string;
	x?: number;
	y?: number;
	scale?: number;
	role?: Role;
	pose?: string;
	state?: string;
	enter?: 'draw' | 'pop' | 'fade';
	exit?: string;
	at?: number;
	props?: Record<string, unknown>;
};

export type Scene = {
	id: string;
	duration: number;
	mode?: Mode;
	layout: string;
	header?: string;
	breadcrumb?: string[];
	vo: string;
	first_change?: number;
	captions: Caption[];
	elements?: Element[];
	motif: {state: MotifState; path?: string};
	transition_out: {type: TransitionType; target?: string};
	echoes?: string;
	sfx?: Array<{asset: string; at: number}>;
	// compiled
	from: number;
	frames: number;
	beat: string;
};

export type Board = {
	meta: {
		id: string;
		title: string;
		format: Format;
		fps: 24 | 25 | 30 | 60;
		mode: Mode;
		seed: number;
		voice: {register: string; asset?: string};
		pulse: {bpm: number; asset: string};
		fonts?: string[];
		total_frames: number;
	};
	motif: {asset: string; meaning: string};
	concepts: Array<{name: string; role: Role; symbol?: string}>;
	cast?: string[];
	beats: Array<{id: string; type: string; scenes: Scene[]}>;
};
