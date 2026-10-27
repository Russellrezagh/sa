import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import typeJson from '../../../tokens/typography.tokens.json';
import type {Caption as CaptionT} from '../types';
import {cadence, color, dur, ease, textStyle, type Mode, type Role} from '../tokens';

const norm = (w: string) => w.toLowerCase().replace(/[.,?!…:]/g, '');
const marker = typeJson.font['turn-marker'];

/**
 * template.caption@1.0.0: one centred line, words rise in with a stagger, emphasis by role.
 * Dialogue: guide lines are italic in caption-base, with a • on the first card of each new turn;
 * learner lines are upright in ink (the two-voice typesetting of the POE reel).
 */
export const Caption: React.FC<{caption: CaptionT; mode: Mode; y: number; speakerRole?: 'guide' | 'learner'}> = ({caption, mode, y, speakerRole}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const start = Math.round(caption.at * fps);
	const end = Math.round(caption.until * fps);
	const quick = dur('quick', fps);
	const stagger = Math.round((cadence['word-stagger'].$value * fps) / 30);
	if (frame < start || frame > end) return null;
	const out = interpolate(frame, [end - quick, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('exit')});
	const emph = new Map((caption.emph ?? []).map((e) => [norm(e.word), e.role]));
	const words = caption.text.split(' ');
	const learner = speakerRole === 'learner';
	const base = learner ? textStyle('caption-learner', width) : textStyle('caption', width);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: y,
				transform: 'translateY(-50%)',
				textAlign: 'center',
				...base,
				color: color(mode, learner ? 'ink' : 'caption-base'),
				opacity: out,
			}}
		>
			{caption.turn ? (
				<span style={{color: color(mode, marker.role as Role), fontSize: '0.7em', marginRight: '0.35em', verticalAlign: '0.15em'}}>{marker.glyph}</span>
			) : null}
			{words.map((w, i) => {
				const t0 = start + i * stagger;
				const p = interpolate(frame, [t0, t0 + quick], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('enter')});
				const role = emph.get(norm(w));
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							marginRight: '0.24em',
							opacity: p,
							transform: `translateY(${(1 - p) * 0.25}em)`,
							color: role ? color(mode, role as Role) : undefined,
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};
