import React from 'react';
import {getLength} from '@remotion/paths';

/**
 * The mài (motif.thread@1.0.0). Shows the segment [start, end] (0..1 of length)
 * of a pixel-space path. Moves on ones: it is the one perfectly smooth thing in
 * a hand-drawn world.
 */
export const Thread: React.FC<{
	d: string;
	start?: number;
	end?: number;
	color: string;
	width: number;
	opacity?: number;
	glow?: string;
}> = ({d, start = 0, end = 1, color, width, opacity = 1, glow}) => {
	if (end <= start || opacity <= 0) return null;
	const len = getLength(d);
	const visible = (end - start) * len;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}}>
			{glow ? (
				<path d={d} fill="none" stroke={glow} strokeWidth={width * 3.2} strokeLinecap="round" strokeOpacity={0.18}
					strokeDasharray={`0 ${start * len} ${visible} ${len}`} />
			) : null}
			<path
				d={d}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={`0 ${start * len} ${visible} ${len}`}
			/>
		</svg>
	);
};

/** A flat line with a single heartbeat blip travelling along it, in time with the pulse bpm. */
export const pulsePath = (x0: number, x1: number, y: number, blipX: number, amp: number) => {
	const w = amp * 1.6;
	const bx = Math.min(Math.max(blipX, x0 + w * 2), x1 - w * 2);
	return [
		`M ${x0} ${y}`,
		`L ${bx - w * 2} ${y}`,
		`L ${bx - w} ${y - amp * 0.25}`,
		`L ${bx - w * 0.4} ${y + amp * 0.35}`,
		`L ${bx} ${y - amp}`,
		`L ${bx + w * 0.5} ${y + amp * 0.5}`,
		`L ${bx + w} ${y}`,
		`L ${x1} ${y}`,
	].join(' ');
};
