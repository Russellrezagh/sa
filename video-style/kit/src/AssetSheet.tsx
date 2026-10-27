import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {resolveAsset, scalePath, THREAD_PATHS} from './assetRegistry';
import {InkShape} from './components/InkShape';
import {Lens} from './components/Lens';
import {Paper} from './components/Paper';
import {Thread} from './components/Thread';
import {ensureFonts} from './fonts';
import {color, textStyle, type Mode, type Role} from './tokens';

const ROLES: Role[] = ['ink', 'thread', 'caption-base', 'emph', 'concept-1', 'concept-2', 'concept-3', 'concept-4', 'concept-5'];
const SHAPES = ['icon.leaf@1.0.0', 'icon.eye@1.0.0', 'icon.watch@1.0.0', 'icon.magnifier@1.0.0'];
const POSES = ['neutral', 'point', 'shrug'];

/**
 * QA still: every published visual asset, both modes' palettes, and the type scale on one page.
 * Render after ANY change to tokens/ or assets/ and compare with docs/asset-sheet.png.
 */
export const AssetSheet: React.FC<{mode: Mode}> = ({mode}) => {
	ensureFonts();
	const {width, height} = useVideoConfig();
	const u = width / 1080;
	const label = {...textStyle('mono', width), color: color(mode, 'ink-soft')};
	return (
		<AbsoluteFill>
			<Paper bg={color(mode, 'bg')} shade={color(mode, 'ink-dark')} seed={11} />
			<div style={{position: 'absolute', left: 64 * u, top: 70 * u, ...textStyle('headline', width), color: color(mode, 'ink')}}>
				MAI asset sheet <span style={{color: color(mode, 'thread')}}>·</span> {mode}
			</div>
			{ROLES.map((r, i) => (
				<div key={r} style={{position: 'absolute', left: (64 + (i % 5) * 196) * u, top: (210 + Math.floor(i / 5) * 150) * u}}>
					<div style={{width: 168 * u, height: 84 * u, background: color(mode, r), borderRadius: 6 * u}} />
					<div style={label}>{r}</div>
					<div style={label}>{color(mode, r)}</div>
				</div>
			))}
			<div style={{position: 'absolute', left: 64 * u, top: 530 * u, ...textStyle('caption', width), color: color(mode, 'caption-base')}}>
				doing the <span style={{color: color(mode, 'emph')}}>looking</span> <span style={{color: color(mode, 'thread')}}>thread</span>
			</div>
			<div style={{position: 'absolute', left: 64 * u, top: 620 * u}}>
				<div style={{...textStyle('setup', width), color: color(mode, 'ink-soft')}}>the thread that runs through a</div>
				<div style={{...textStyle('payoff', width), color: color(mode, 'ink')}}>story.</div>
			</div>
			<div style={{position: 'absolute', left: 620 * u, top: 640 * u, ...textStyle('label', width), color: color(mode, 'ink')}}>Inter label 28</div>
			<div style={{position: 'absolute', left: 620 * u, top: 690 * u, ...textStyle('mono', width), color: color(mode, 'ink')}}>0.37, 0.32 mono</div>
			<div style={{position: 'absolute', left: 620 * u, top: 730 * u, fontFamily: '"Caveat"', fontSize: 44 * u, color: color(mode, 'ink')}}>a little more colour</div>
			{SHAPES.map((ref, i) => {
				const a = resolveAsset(ref);
				return a.kind === 'shape' ? (
					<React.Fragment key={ref}>
						<InkShape shape={a.shape()} mode={mode} x={(170 + i * 250) * u} y={1000 * u} scale={1.0 * u} seed={100 + i} />
						<div style={{...label, position: 'absolute', left: (90 + i * 250) * u, top: 1110 * u}}>{ref}</div>
					</React.Fragment>
				) : null;
			})}
			{POSES.map((pose, i) => {
				const a = resolveAsset('character.everyperson@1.0.0');
				return a.kind === 'shape' ? (
					<React.Fragment key={pose}>
						<InkShape shape={a.shape(pose)} mode={mode} x={(200 + i * 300) * u} y={1500 * u} scale={1.0 * u} seed={200 + i} />
						<div style={{...label, position: 'absolute', left: (150 + i * 300) * u, top: 1610 * u}}>pose: {pose}</div>
					</React.Fragment>
				) : null;
			})}
			<AbsoluteFill style={{transform: `translateY(${height * 0.78}px)`}}>
				<Thread d={scalePath(THREAD_PATHS.portrait.across, width, height * 0.25)} color={color(mode, 'thread')} width={7 * u}
					glow={mode === 'night' ? color(mode, 'thread') : undefined} />
			</AbsoluteFill>
			<Lens x={932 * u} y={402 * u} r={46 * u} mode={mode} seed={5} ripples={[-14]} />
			<div style={{...label, position: 'absolute', left: 868 * u, top: 470 * u}}>motif.lens</div>
		</AbsoluteFill>
	);
};
