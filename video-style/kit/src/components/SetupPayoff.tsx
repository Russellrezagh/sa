import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, dur, ease, spring as springTok, textStyle, type Mode, type Role} from '../tokens';

/** Small setup line + huge payoff word (Dunkirk-reel editorial pair). The payoff lands on a spring. */
export const SetupPayoff: React.FC<{setup: string; payoff: string; payoffRole?: Role; mode: Mode; x: number; y: number; delay?: number}> = ({
	setup,
	payoff,
	payoffRole = 'ink',
	mode,
	x,
	y,
	delay = 0,
}) => {
	const frame = useCurrentFrame() - delay;
	const {fps, width, height} = useVideoConfig();
	const short = Math.min(width, height);
	const a = interpolate(frame, [0, dur('base', fps)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('enter')});
	const s = spring({frame: frame - dur('base', fps), fps, config: springTok('settle')});
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', textAlign: 'left', whiteSpace: 'nowrap'}}>
			<div style={{...textStyle('setup', short), color: color(mode, 'ink-soft'), opacity: a, transform: `translateY(${(1 - a) * 12}px)`}}>{setup}</div>
			<div
				style={{
					...textStyle('payoff', short),
					color: color(mode, payoffRole),
					opacity: Math.min(1, s * 1.4),
					transform: `translateY(${(1 - s) * 40}px) scale(${0.94 + 0.06 * s})`,
					transformOrigin: 'left bottom',
				}}
			>
				{payoff}
			</div>
		</div>
	);
};
