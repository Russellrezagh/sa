import React from 'react';
import {AbsoluteFill} from 'remotion';
import {texture} from '../tokens';

/**
 * Paper ground: flat role colour + static seeded grain + soft vignette (texture.paper-grain@1.0.0).
 * `shade` is the vignette colour and must darken in every mode (pass ink-dark).
 */
export const Paper: React.FC<{bg: string; shade: string; seed: number; clip?: string}> = ({bg, shade, seed, clip}) => {
	const g = texture['paper-grain'];
	const v = texture.vignette;
	const id = `grain-${seed}`;
	return (
		<AbsoluteFill style={{backgroundColor: bg, clipPath: clip}}>
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
				<filter id={id}>
					<feTurbulence type="fractalNoise" baseFrequency={g.baseFrequency} numOctaves={g.octaves} seed={seed % 1000} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${id})`} opacity={g.opacity} style={{mixBlendMode: 'multiply'}} />
			</svg>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at 50% 45%, transparent ${v.radius * 70}%, ${shade} 150%)`,
					opacity: v.strength * 2.5,
				}}
			/>
		</AbsoluteFill>
	);
};
