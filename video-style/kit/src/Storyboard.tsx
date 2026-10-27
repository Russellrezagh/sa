import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {interpolatePaths} from '@remotion/paths';
import {resolveAsset, scalePath, THREAD_PATHS} from './assetRegistry';
import {Caption} from './components/Caption';
import {CastLayer, speaking} from './components/CastLayer';
import {Header} from './components/Header';
import {InkShape} from './components/InkShape';
import {Paper} from './components/Paper';
import {SetupPayoff} from './components/SetupPayoff';
import {pulsePath, Thread} from './components/Thread';
import {TrackBox} from './components/TrackBox';
import {seedFor} from './determinism';
import {ensureFonts} from './fonts';
import {camera, color, dialogueMotion, dur, ease, layout, spring as springTok, transitionFrames, type Mode, type Role} from './tokens';
import type {Board, Element, Scene} from './types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const flatten = (board: Board): Scene[] => board.beats.flatMap((b) => b.scenes);
const sceneMode = (board: Board, s: Scene): Mode => s.mode ?? board.meta.mode;

/** Where the thread is for scene `s` at local frame `t` (pixel path + visible range). */
const threadAt = (board: Board, s: Scene, t: number, w: number, h: number, fps: number) => {
	const paths = THREAD_PATHS[board.meta.format];
	const named = (n: string) => scalePath(paths[n] ?? paths.across, w, h);
	const z = layout(board.meta.format).zone;
	switch (s.motif.state) {
		case 'pulse':
		case 'strip': {
			const beat = (t / fps) * (board.meta.pulse.bpm / 60);
			const blipX = w * (0.1 + 0.8 * (beat % 1));
			const y = h * ((z.stage.y0 + z.stage.y1) / 2);
			return {d: pulsePath(-0.05 * w, 1.05 * w, y, blipX, h * 0.025), start: 0, end: 1};
		}
		case 'home':
		case 'knot':
			return {d: named('home'), start: 0, end: 1};
		case 'underline':
			return {d: named('underline'), start: 0, end: 1};
		case 'absent':
			return {d: named(s.motif.path ?? 'across'), start: 0, end: 0};
		default:
			return {d: named(s.motif.path ?? 'across'), start: 0, end: 1};
	}
};

/** Element in one scene. Handles enter animation, morph-from-previous and zoom-through exit. */
const ElementView: React.FC<{
	board: Board;
	scene: Scene;
	el: Element;
	mode: Mode;
	prev?: Element;
	morphFrames: number;
	zoomOut: number;
}> = ({board, scene, el, mode, prev, morphFrames, zoomOut}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const start = Math.round((el.at ?? 0) * fps);
	const local = frame - start;
	const seed = seedFor(board.meta.seed, `${scene.id}/${el.id}`);
	const asset = resolveAsset(el.asset);

	let x = (el.x ?? 0.5) * width;
	let y = (el.y ?? 0.38) * height;
	let sc = el.scale ?? 1;
	if (prev) {
		const m = interpolate(frame, [0, morphFrames], [0, 1], {...clamp, easing: ease('standard')});
		x = interpolate(m, [0, 1], [(prev.x ?? 0.5) * width, x]);
		y = interpolate(m, [0, 1], [(prev.y ?? 0.38) * height, y]);
		sc = interpolate(m, [0, 1], [prev.scale ?? 1, sc]);
	}
	sc *= interpolate(zoomOut, [0, 1], [1, camera.zoomThrough]);

	if (asset.kind === 'payoff') {
		const p = el.props as {setup: string; payoff: string; payoffRole?: Role};
		return <SetupPayoff setup={p.setup} payoff={p.payoff} payoffRole={p.payoffRole} mode={mode} x={x} y={y} delay={start} />;
	}
	if (asset.kind !== 'shape') return null;

	const shape = asset.shape(el.pose);
	const px = (sc * width) / 1080; // px per viewBox unit
	let draw = 1;
	let pop = 1;
	let opacity = 1;
	if (!prev) {
		if (el.enter === 'draw') draw = interpolate(local, [0, dur('slow', fps) * 2], [0, 1], {...clamp, easing: ease('draw')});
		else if (el.enter === 'pop') pop = spring({frame: local, fps, config: springTok('pop')});
		else opacity = interpolate(local, [0, dur('base', fps)], [0, 1], clamp);
	}
	const track = (el.props as {track?: boolean} | undefined)?.track;
	const bw = shape.viewBox[2] * px * pop * 0.9;
	const bh = shape.viewBox[3] * px * pop * 0.9;
	return (
		<>
			<InkShape shape={shape} mode={mode} x={x} y={y} scale={px * pop} draw={draw} opacity={opacity * (1 - zoomOut * 0.6)} seed={seed} roleOverride={el.role} />
			{track ? (
				<TrackBox x={x} y={y} w={bw} h={bh} mode={mode} frameWidth={width} opacity={interpolate(local, [dur('slow', fps), dur('slow', fps) + dur('quick', fps)], [0, 1], clamp)}
					label={`${(el.x ?? 0.5).toFixed(2)}, ${(el.y ?? 0.38).toFixed(2)}`} />
			) : null}
		</>
	);
};

/** One scene: stage (with camera push and enter/exit transitions), header, captions, sfx. */
const SceneView: React.FC<{board: Board; scene: Scene; prevScene?: Scene}> = ({board, scene, prevScene}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const mode = sceneMode(board, scene);
	const L = layout(board.meta.format);
	const tOut = transitionFrames(scene.transition_out.type, fps);
	const tIn = prevScene ? transitionFrames(prevScene.transition_out.type, fps) : 0;
	// 0-frame transitions (cut) have no exit animation; interpolate() needs a strictly increasing range.
	const exitP = tOut > 0 ? interpolate(frame, [scene.frames - tOut, scene.frames], [0, 1], {...clamp, easing: ease('exit')}) : 0;
	const enterP = tIn ? interpolate(frame, [0, tIn], [0, 1], {...clamp, easing: ease('enter')}) : 1;
	const push = interpolate(frame, [0, scene.frames], [1, camera.push], clamp);

	let tx = 0;
	let ty = 0;
	let fade = 1;
	switch (scene.transition_out.type) {
		case 'carry': tx -= exitP * width * 0.35; fade *= 1 - exitP; break;
		case 'push': ty -= exitP * height * 0.22; fade *= 1 - exitP; break;
		case 'wash': case 'draw-through': case 'end-loop': fade *= 1 - exitP; break;
		case 'zoom-through': break;
		default: break;
	}
	switch (prevScene?.transition_out.type) {
		case 'carry': tx += (1 - enterP) * width * 0.35; fade *= enterP; break;
		case 'push': ty += (1 - enterP) * height * 0.22; fade *= enterP; break;
		case 'morph': case 'cut': case undefined: break;
		default: fade *= enterP;
	}

	const prevEls = new Map((prevScene?.transition_out.type === 'morph' ? prevScene.elements ?? [] : []).map((e) => [e.id, e]));
	const zoomTarget = scene.transition_out.type === 'zoom-through' ? scene.transition_out.target : undefined;
	const zoomP = zoomTarget ? exitP : 0;

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${push})`, opacity: fade, transformOrigin: '50% 38%'}}>
				{(scene.elements ?? []).map((el) => (
					<ElementView key={el.id} board={board} scene={scene} el={el} mode={mode} prev={prevEls.get(el.id)} morphFrames={tIn || dur('morph', fps)}
						zoomOut={el.id === zoomTarget ? zoomP : 0} />
				))}
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: zoomTarget ? 1 - zoomP : 1}}>
				<Header text={scene.header} breadcrumb={scene.breadcrumb} mode={mode} y={height * (L.zone.header.y0 + L.zone.header.y1) / 2} marginX={width * L['margin-x'].$value} />
				{(scene.captions ?? []).map((c, i) => (
					<Caption key={i} caption={c} mode={mode} y={height * (L.zone.caption.y0 + L.zone.caption.y1) / 2}
						speakerRole={board.meta.dialogue?.speakers.find((s) => s.id === c.speaker)?.role} />
				))}
			</AbsoluteFill>
			{(scene.sfx ?? []).map((s, i) => {
				const a = resolveAsset(s.asset);
				return a.kind === 'audio' ? (
					<Sequence key={i} from={Math.round(s.at * fps)} layout="none">
						<Audio src={staticFile(a.file)} />
					</Sequence>
				) : null;
			})}
		</AbsoluteFill>
	);
};

export const StoryboardVideo: React.FC<{board: Board}> = ({board}) => {
	ensureFonts();
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const scenes = flatten(board);
	const idx = Math.max(0, scenes.findIndex((s) => frame >= s.from && frame < s.from + s.frames));
	const cur = scenes[idx];
	const prev = scenes[idx - 1];
	const t = frame - cur.from;

	// Background: crossfade, or a circular 'wash' reveal, when the mode changes.
	const curMode = sceneMode(board, cur);
	const prevMode = prev ? sceneMode(board, prev) : curMode;
	const tIn = prev ? Math.max(transitionFrames(prev.transition_out.type, fps), dur('base', fps)) : 0;
	const bgP = prev && prevMode !== curMode ? interpolate(t, [0, tIn], [0, 1], {...clamp, easing: ease('enter')}) : 1;
	const wash = prev?.transition_out.type === 'wash';

	// The thread: ONE object for the whole video, morphing between scene paths.
	const th = threadAt(board, cur, t, width, height, fps);
	let d = th.d;
	let end = th.end;
	if (prev && t < tIn) {
		const from = threadAt(board, prev, prev.frames, width, height, fps);
		const m = interpolate(t, [0, tIn], [0, 1], {...clamp, easing: ease('draw')});
		d = interpolatePaths(m, [0, 1], [from.d, th.d]);
		end = interpolate(m, [0, 1], [from.end, th.end]);
	}
	if (idx === 0) end *= interpolate(t, [0, dur('slow', fps) * 2], [0, 1], {...clamp, easing: ease('draw')});
	// end-loop: rewind the thread (tail chases head off the line) so the last frame is the empty
	// paper of frame 0 and the reel loops seamlessly.
	let start = 0;
	if (cur.transition_out.type === 'end-loop') {
		const tOut = transitionFrames('end-loop', fps) * 2;
		start = interpolate(t, [cur.frames - tOut, cur.frames - 1], [0, 1], {...clamp, easing: ease('draw')});
	}
	const threadColor = interpolateColors(bgP, [0, 1], [color(prevMode, 'thread'), color(curMode, 'thread')]);
	// The guide has no body: the thread is the guide. It swells while the guide speaks.
	const guide = board.meta.dialogue?.speakers.find((s) => s.role === 'guide');
	const swell = guide ? 1 + dialogueMotion.swell * speaking(cur, guide.id, t, fps) : 1;
	const vo = board.meta.voice.asset ? resolveAsset(board.meta.voice.asset) : undefined;

	const bed = resolveAsset(board.meta.pulse.asset);
	return (
		<AbsoluteFill>
			<Paper bg={color(prevMode, 'bg')} shade={color(prevMode, 'ink-dark')} seed={board.meta.seed} />
			{prevMode !== curMode ? (
				<AbsoluteFill style={{opacity: wash ? 1 : bgP}}>
					<Paper
						bg={color(curMode, 'bg')}
						shade={color(curMode, 'ink-dark')}
						seed={board.meta.seed}
						clip={wash ? `circle(${bgP * 120}% at 50% 40%)` : undefined}
					/>
				</AbsoluteFill>
			) : null}
			<Thread d={d} start={start} end={end} color={threadColor} width={(7 * width * swell) / 1080} glow={curMode === 'night' ? threadColor : undefined} />
			<CastLayer board={board} scenes={scenes} idx={idx} t={t} mode={curMode} />
			{scenes.map((s, i) => (
				<Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={`${s.beat} · ${s.id}`}>
					<SceneView board={board} scene={s} prevScene={scenes[i - 1]} />
				</Sequence>
			))}
			{/* bed ≈ 18 LU under the VO (audio.loudness.vo-over-bed-lu) */}
			{bed.kind === 'audio' ? <Audio src={staticFile(bed.file)} loop volume={vo ? 0.8 : 0.9} /> : null}
			{vo?.kind === 'audio' ? <Audio src={staticFile(vo.file)} /> : null}
		</AbsoluteFill>
	);
};
