import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, dur, ease, texture, type Mode} from '../tokens';

/** motif.lens@1.0.0: glassy observer drop with ripple rings fired at `ripples` (frames). */
export const Lens: React.FC<{x: number; y: number; r: number; mode: Mode; seed: number; ripples?: number[]}> = ({x, y, r, mode, seed, ripples = []}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const rp = texture.ripple;
	const id = `lens-${seed}`;
	const life = dur('breath', fps) * 1.5;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<radialGradient id={`${id}-g`} cx="38%" cy="34%" r="70%">
					<stop offset="0%" stopColor={color(mode, 'highlight')} stopOpacity={0.95} />
					<stop offset="45%" stopColor={color(mode, 'bg')} stopOpacity={0.9} />
					<stop offset="100%" stopColor={color(mode, 'bg-shade')} stopOpacity={1} />
				</radialGradient>
				<filter id={`${id}-f`} x="-40%" y="-40%" width="180%" height="180%">
					<feTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={1} seed={seed % 997} />
					<feDisplacementMap in="SourceGraphic" scale={r * 0.22} />
					<feDropShadow dx={r * 0.05} dy={r * 0.12} stdDeviation={r * 0.08} floodColor={color(mode, 'ink')} floodOpacity={0.22} />
				</filter>
			</defs>
			{ripples.map((t0, i) => {
				const p = interpolate(frame, [t0, t0 + life], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('enter')});
				if (frame < t0 || p >= 1) return null;
				return Array.from({length: rp.rings}).map((_, k) => (
					<circle key={`${i}-${k}`} cx={x} cy={y} r={r + (rp['spacing-px'] * (k + 1) + r) * p} fill="none"
						stroke={color(mode, 'concept-4')} strokeWidth={rp['stroke-px']} opacity={rp.opacity * (1 - p)} />
				));
			})}
			<ellipse cx={x} cy={y} rx={r} ry={r * 0.86} fill={`url(#${id}-g)`} filter={`url(#${id}-f)`} />
			<ellipse cx={x - r * 0.35} cy={y - r * 0.32} rx={r * 0.22} ry={r * 0.12} fill={color(mode, 'highlight')} opacity={0.7} transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.32})`} />
		</svg>
	);
};
