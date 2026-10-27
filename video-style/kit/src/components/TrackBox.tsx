import React from 'react';
import {color, textStyle, type Mode} from '../tokens';

/** Computer-vision style annotation: thin box + mono coordinates (Dunkirk-reel layer). */
export const TrackBox: React.FC<{x: number; y: number; w: number; h: number; label: string; mode: Mode; frameWidth: number; opacity?: number}> = ({
	x,
	y,
	w,
	h,
	label,
	mode,
	frameWidth,
	opacity = 1,
}) => (
	<div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, border: `1.5px solid ${color(mode, 'ink')}`, opacity}}>
		<div style={{position: 'absolute', top: -textStyle('mono', frameWidth).fontSize * 1.4, left: 0, ...textStyle('mono', frameWidth), color: color(mode, 'ink')}}>
			{label}
		</div>
	</div>
);
