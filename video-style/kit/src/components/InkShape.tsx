import React from 'react';
import {useCurrentFrame} from 'remotion';
import {evolvePath} from '@remotion/paths';
import type {Shape} from '../assetRegistry';
import {boilVariant} from '../determinism';
import {boil, color, colorRule, texture, type Mode, type Role} from '../tokens';

/**
 * Renders a shape object (strokes + washes + fills) in the house line style:
 * ink strokes that boil on twos, watercolour washes that miss the line.
 * Coordinates: (x, y) is where the shape's anchor lands, in frame pixels.
 */
export const InkShape: React.FC<{
	shape: Shape;
	mode: Mode;
	x: number;
	y: number;
	/** px per viewBox unit */
	scale: number;
	/** 0..1 stroke draw-on progress */
	draw?: number;
	opacity?: number;
	seed: number;
	roleOverride?: Role;
	threadColor?: string;
}> = ({shape, mode, x, y, scale, draw = 1, opacity = 1, seed, roleOverride, threadColor}) => {
	const frame = useCurrentFrame();
	const [vx, vy, vw, vh] = shape.viewBox;
	const [ax, ay] = shape.anchor;
	const variant = boilVariant(frame, boil.variants);
	const lineW = texture['ink-line']['width-px'] / scale;
	const wc = texture.watercolor;
	const boilId = `boil-${seed}-${variant}`;
	const washId = `wash-${seed}`;
	const n = shape.strokes.length;
	// Strokes draw in sequence with overlap; washes bloom once the outline is mostly drawn.
	const strokeProgress = (i: number) => Math.min(1, Math.max(0, draw * (n + 2) / 3 - i / 3));
	const washOpacity = Math.min(1, Math.max(0, (draw - 0.55) / 0.35));

	return (
		<svg
			width={vw * scale}
			height={vh * scale}
			viewBox={`${vx} ${vy} ${vw} ${vh}`}
			style={{position: 'absolute', left: x - (ax - vx) * scale, top: y - (ay - vy) * scale, opacity, overflow: 'visible'}}
		>
			<defs>
				<filter id={boilId} x="-10%" y="-10%" width="120%" height="120%">
					<feTurbulence type="turbulence" baseFrequency={0.035} numOctaves={1} seed={(seed + variant * 17) % 997} />
					<feDisplacementMap in="SourceGraphic" scale={(boil.amplitude * 2) / scale} />
				</filter>
				<filter id={washId} x="-15%" y="-15%" width="130%" height="130%">
					<feTurbulence type="fractalNoise" baseFrequency={wc.turbulence * 4} numOctaves={2} seed={seed % 991} />
					<feDisplacementMap in="SourceGraphic" scale={wc['bleed-px'] / scale * 1.6} />
					<feGaussianBlur stdDeviation={0.6 / scale} />
				</filter>
			</defs>
			<g filter={`url(#${washId})`} transform={`translate(${(wc['bleed-px'] * 0.45) / scale} ${(wc['bleed-px'] * 0.3) / scale})`} opacity={washOpacity}>
				{shape.washes.map((w, i) => {
					const c = color(mode, (roleOverride && w.role.startsWith('concept') ? roleOverride : w.role) as Role);
					return (
						<path
							key={i}
							d={w.d}
							fill={c}
							fillOpacity={(w.opacity ?? 1) * colorRule(mode === 'night' ? 'wash-opacity-night' : 'wash-opacity')}
							stroke={c}
							strokeOpacity={wc['edge-darken']}
							strokeWidth={3 / scale}
						/>
					);
				})}
			</g>
			<g filter={`url(#${boilId})`}>
				{shape.fills.map((f, i) => (
					<path key={`f${i}`} d={f.d} fill={color(mode, f.role as Role)} opacity={washOpacity} />
				))}
				{shape.strokes.map((d, i) => {
					const p = strokeProgress(i);
					if (p <= 0) return null;
					const ev = evolvePath(p, d);
					return (
						<path
							key={`s${i}`}
							d={d}
							fill="none"
							stroke={color(mode, 'ink')}
							strokeWidth={lineW}
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeDasharray={ev.strokeDasharray}
							strokeDashoffset={ev.strokeDashoffset}
						/>
					);
				})}
				{(shape.threads ?? []).map((d, i) => {
					const ev = evolvePath(Math.min(1, Math.max(0, draw * 1.4 - 0.4)), d);
					return (
						<path
							key={`t${i}`}
							d={d}
							fill="none"
							stroke={threadColor ?? color(mode, 'thread')}
							strokeWidth={lineW * 1.6}
							strokeLinecap="round"
							strokeDasharray={ev.strokeDasharray}
							strokeDashoffset={ev.strokeDashoffset}
						/>
					);
				})}
			</g>
		</svg>
	);
};
