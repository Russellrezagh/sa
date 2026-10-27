import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, dur, ease, textStyle, type Mode} from '../tokens';

/** Persistent question / equation line in the header zone, plus the struck-through breadcrumb of eliminated ideas. */
export const Header: React.FC<{text?: string; breadcrumb?: string[]; mode: Mode; y: number; marginX: number; still?: boolean}> = ({text, breadcrumb, mode, y, marginX, still}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const short = Math.min(width, height);
	// an unchanged header carries over between scenes without re-animating
	const p = still ? 1 : interpolate(frame, [0, dur('base', fps)], [0, 1], {extrapolateRight: 'clamp', easing: ease('enter')});
	return (
		<>
			{breadcrumb && breadcrumb.length ? (
				<div style={{position: 'absolute', top: y - short * 0.07, left: marginX, ...textStyle('breadcrumb', short), color: color(mode, 'ink-soft')}}>
					{breadcrumb.map((b, i) => (
						<span key={i}>
							{i ? <span style={{textDecoration: 'none'}}> · </span> : null}
							<span style={{textDecoration: 'line-through'}}>{b}</span>
						</span>
					))}
				</div>
			) : null}
			{text ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: y,
						transform: `translateY(-50%) translateY(${(1 - p) * 10}px)`,
						textAlign: 'center',
						...textStyle('headline', short, 'header'),
						color: color(mode, 'ink-soft'),
						opacity: p,
					}}
				>
					{text}
				</div>
			) : null}
		</>
	);
};
