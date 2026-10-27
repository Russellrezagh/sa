import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {resolveAsset} from '../assetRegistry';
import {onTwos, seedFor} from '../determinism';
import {dialogueMotion, dur, ease, transitionFrames, type Mode} from '../tokens';
import type {Board, CastState, Scene} from '../types';
import {InkShape} from './InkShape';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0..1 envelope: is `speaker` talking in `scene` at local frame `t`? Ramps in/out over a few frames. */
export const speaking = (scene: Scene | undefined, speaker: string, t: number, fps: number) => {
	let env = 0;
	const r = Math.round((dialogueMotion.ramp * fps) / 30);
	for (const l of scene?.lines ?? []) {
		if (l.speaker !== speaker) continue;
		const a = Math.round(l.at * fps);
		const b = Math.round(l.until * fps);
		env = Math.max(env, interpolate(t, [a - r, a, b, b + r], [0, 1, 1, 0], clamp));
	}
	return env;
};

/**
 * The persistent cast: speakers with a character stay on stage across scenes (like the thread),
 * walking between per-scene positions instead of being redrawn. Drawn on at first appearance,
 * faded when they leave, pose cross-faded at scene changes, and bobbing while they speak.
 */
export const CastLayer: React.FC<{board: Board; scenes: Scene[]; idx: number; t: number; mode: Mode}> = ({board, scenes, idx, t, mode}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const cur = scenes[idx];
	const prev = scenes[idx - 1];
	const speakers = (board.meta.dialogue?.speakers ?? []).filter((s) => s.character);
	return (
		<>
			{speakers.map((spk) => {
				const a: CastState | undefined = prev?.cast?.[spk.id];
				const b: CastState | undefined = cur.cast?.[spk.id];
				if (!a && !b) return null;
				const asset = resolveAsset(spk.character!);
				if (asset.kind !== 'shape') return null;
				const tIn = prev ? Math.max(transitionFrames(prev.transition_out.type, fps), dur('morph', fps)) : 1;
				const m = prev ? interpolate(t, [0, tIn], [0, 1], {...clamp, easing: ease('standard')}) : 1;
				const A = a ?? b!;
				const B = b ?? a!;
				const x = interpolate(m, [0, 1], [A.x ?? 0.25, B.x ?? 0.25]) * width;
				const y = interpolate(m, [0, 1], [A.y ?? 0.47, B.y ?? 0.47]) * height;
				const sc = interpolate(m, [0, 1], [A.scale ?? 1, B.scale ?? 1]);
				const firstEver = !scenes.slice(0, idx).some((s) => s.cast?.[spk.id]);
				const draw = b && firstEver ? interpolate(t, [0, dur('slow', fps) * 2], [0, 1], {...clamp, easing: ease('draw')}) : 1;
				const opacity = !a && b && !firstEver ? m : a && !b ? 1 - m : 1;
				const talk = speaking(cur, spk.id, t, fps);
				const bob = -talk * dialogueMotion.bobPx * (width / 1080) * Math.abs(Math.sin((onTwos(frame) / fps) * Math.PI * dialogueMotion.bobHz));
				const px = (sc * width) / 1080;
				const poseA = A.pose ?? 'neutral';
				const poseB = B.pose ?? poseA;
				const seed = seedFor(board.meta.seed, `cast/${spk.id}`);
				const layers = poseA === poseB ? [[poseB, 1]] : [[poseA, 1 - m], [poseB, m]];
				return layers.map(([pose, o]) => (
					<InkShape key={`${spk.id}-${pose}`} shape={asset.shape(pose as string)} mode={mode} x={x} y={y + bob} scale={px} draw={draw}
						opacity={opacity * (o as number)} seed={seed} />
				));
			})}
		</>
	);
};
