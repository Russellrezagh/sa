import React from 'react';
import {interpolate} from 'remotion';
import {onTwos, rand} from '../determinism';
import {color, textStyle, type Role} from '../tokens';
import {keyed, ramp, rampAt, tokensOf, type DiagramProps} from './common';

const mono = (size: number) => ({...textStyle('mono', 1080), fontSize: size});
const italic = (size: number) => ({...textStyle('caption', 1080), fontSize: size});

/**
 * template.alphabet@1.0.0: a reference list ("alphabet") as small tiles, with a mono name on the left.
 * `hops` draw thread-coloured arcs from i to j: "successor = one step right in THIS list".
 */
export const Alphabet: React.FC<DiagramProps> = (d) => {
	const p = d.props as {tokens: string; name?: string; size?: number; highlight?: Array<{i: number; role: Role}>; hops?: Array<{from: number; to: number; at: number; label?: string}>; dimAt?: number};
	const {x, y, u, mode} = d;
	const toks = tokensOf(p.tokens);
	const size = (p.size ?? 52) * u;
	const gap = 8 * u;
	const total = toks.length * size + (toks.length - 1) * gap;
	const x0 = x - total / 2;
	const hl = new Map((p.highlight ?? []).map((h) => [h.i, h.role]));
	const dim = p.dimAt !== undefined ? 1 - 0.7 * rampAt(d, p.dimAt, 12) : 1;
	const cx = (i: number) => x0 + size / 2 + i * (size + gap);
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{p.name ? <text x={x0 - 24 * u} y={y + 8 * u} textAnchor="end" style={mono(24 * u)} fill={color(mode, 'ink-soft')} opacity={ramp(d, 0, 8)}>{p.name}</text> : null}
			{toks.map((ch, i) => {
				const a = ramp(d, i * 1, 6);
				const role = hl.get(i);
				return (
					<g key={i} opacity={a * dim}>
						<rect x={cx(i) - size / 2} y={y - size / 2} width={size} height={size} rx={7 * u} fill={role ? color(mode, role) : color(mode, 'bg')}
							fillOpacity={role ? 0.3 : 1} stroke={color(mode, 'ink')} strokeWidth={2 * u} />
						<text x={cx(i)} y={y + size * 0.2} textAnchor="middle" fill={color(mode, 'ink')}
							style={{...textStyle('caption-learner', 1080), fontSize: size * 0.6}}>{ch}</text>
					</g>
				);
			})}
			{(p.hops ?? []).map((h, k) => {
				const hp = rampAt(d, h.at, 14, 'draw');
				if (hp <= 0) return null;
				const x1 = cx(h.from);
				const x2 = cx(h.to);
				const top = y - size / 2 - 6 * u;
				const arc = `M ${x1} ${top} Q ${(x1 + x2) / 2} ${top - 70 * u} ${x2} ${top}`;
				return (
					<g key={k}>
						<path d={arc} fill="none" stroke={color(mode, 'thread')} strokeWidth={4.5 * u} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - hp} />
						{h.label ? <text x={(x1 + x2) / 2} y={top - 50 * u} textAnchor="middle" style={mono(22 * u)} fill={color(mode, 'thread')} opacity={hp}>{h.label}</text> : null}
					</g>
				);
			})}
		</svg>
	);
};

type SNode = {id: string; label: string; x: number; y: number; depth?: number; x2?: number; y2?: number};
type SLink = {a: string; b: string; label?: string};

/**
 * template.slipnet@1.0.0: Copycat's long-term concept network. Node size ~ conceptual depth;
 * activation glows in concept-5 (concepts); links whose label is activated SHRINK (nodes move to
 * x2/y2 at shrinkAt); a slippage is drawn as a thread-coloured arc jumping between two nodes.
 */
export const Slipnet: React.FC<DiagramProps> = (d) => {
	const p = d.props as {nodes: SNode[]; links: SLink[]; activations?: Array<{at: number; id: string; v: number}>; shrinkAt?: number; slips?: Array<{at: number; from: string; to: string}>; labelLinks?: boolean};
	const {x, y, u, mode} = d;
	const shrink = p.shrinkAt === undefined ? 0 : rampAt(d, p.shrinkAt, 30, 'standard');
	const pos = (n: SNode) => ({
		px: x + interpolate(shrink, [0, 1], [n.x, n.x2 ?? n.x]) * u,
		py: y + interpolate(shrink, [0, 1], [n.y, n.y2 ?? n.y]) * u,
	});
	const byId = new Map(p.nodes.map((n) => [n.id, n]));
	const act = (id: string) => keyed(d, [...(d.persist ? [] : [{at: 0, v: 0}]), ...(p.activations ?? []).filter((a) => a.id === id).map((a) => ({at: a.at, v: a.v}))], 14);
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{p.links.map((l, i) => {
				const A = byId.get(l.a)!;
				const B = byId.get(l.b)!;
				const a = pos(A);
				const b = pos(B);
				const lp = ramp(d, 6 + i * 2, 12, 'draw');
				return (
					<g key={i} opacity={lp}>
						<line x1={a.px} y1={a.py} x2={a.px + (b.px - a.px) * lp} y2={a.py + (b.py - a.py) * lp} stroke={color(mode, 'ink-soft')} strokeWidth={2 * u}
							strokeDasharray={l.label ? `${6 * u} ${6 * u}` : undefined} />
						{l.label && p.labelLinks !== false ? (
							<text x={(a.px + b.px) / 2} y={(a.py + b.py) / 2 - 8 * u} textAnchor="middle" style={mono(18 * u)} fill={color(mode, 'ink-soft')}>{l.label}</text>
						) : null}
					</g>
				);
			})}
			{p.nodes.map((n, i) => {
				const {px, py} = pos(n);
				const depth = n.depth ?? 30;
				const r = (22 + depth * 0.22) * u;
				const a = act(n.id);
				const appear = ramp(d, i * 2, 10);
				return (
					<g key={n.id} opacity={appear}>
						<circle cx={px} cy={py} r={r * (1.6 + 0.5 * a)} fill={color(mode, 'concept-5')} opacity={0.22 * a} />
						<circle cx={px} cy={py} r={r} fill={color(mode, 'concept-5')} fillOpacity={0.12 + 0.55 * a} stroke={color(mode, 'ink')} strokeWidth={2.2 * u} />
						{depth >= 70 ? <circle cx={px} cy={py} r={r * 0.78} fill="none" stroke={color(mode, 'ink')} strokeWidth={1.4 * u} /> : null}
						<text x={px} y={py + r + 28 * u} textAnchor="middle" style={italic(30 * u)} fill={color(mode, 'ink')}>{n.label}</text>
					</g>
				);
			})}
			{(p.slips ?? []).map((s, k) => {
				const sp = rampAt(d, s.at, 18, 'draw');
				if (sp <= 0) return null;
				const a = pos(byId.get(s.from)!);
				const b = pos(byId.get(s.to)!);
				const mx = (a.px + b.px) / 2;
				const my = Math.min(a.py, b.py) - 90 * u;
				return (
					<path key={k} d={`M ${a.px} ${a.py} Q ${mx} ${my} ${b.px} ${b.py}`} fill="none" stroke={color(mode, 'thread')} strokeWidth={6 * u} strokeLinecap="round"
						pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sp} />
				);
			})}
		</svg>
	);
};

/** template.thermometer@1.0.0: Copycat's computational temperature T ∈ [0, 100], keyed over time. */
export const Thermometer: React.FC<DiagramProps> = (d) => {
	const p = d.props as {keys: Array<{at: number; T: number}>; height?: number; labels?: boolean};
	const {x, y, u, mode} = d;
	const T = keyed(d, p.keys.map((k) => ({at: k.at, v: k.T})), 18);
	const h = (p.height ?? 420) * u;
	const w = 46 * u;
	const top = y - h / 2;
	const bulbR = 40 * u;
	const fillTop = top + h * (1 - T / 100);
	const heat = color(mode, 'concept-4');
	const appear = ramp(d, 0, 10);
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}} opacity={appear}>
			<rect x={x - w / 2 + 9 * u} y={fillTop} width={w - 18 * u} height={top + h - fillTop + bulbR} fill={heat} opacity={0.35 + 0.55 * (T / 100)} />
			<circle cx={x} cy={top + h + bulbR * 0.7} r={bulbR - 9 * u} fill={heat} opacity={0.35 + 0.55 * (T / 100)} />
			<rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2} fill="none" stroke={color(mode, 'ink')} strokeWidth={3 * u} />
			<circle cx={x} cy={top + h + bulbR * 0.7} r={bulbR} fill="none" stroke={color(mode, 'ink')} strokeWidth={3 * u} />
			{[0, 25, 50, 75, 100].map((v) => (
				<line key={v} x1={x + w / 2} x2={x + w / 2 + 14 * u} y1={top + h * (1 - v / 100)} y2={top + h * (1 - v / 100)} stroke={color(mode, 'ink-soft')} strokeWidth={2 * u} />
			))}
			<text x={x + w / 2 + 26 * u} y={fillTop + 9 * u} style={mono(30 * u)} fill={color(mode, 'ink')}>T = {Math.round(T)}</text>
			{p.labels !== false ? (
				<>
					<text x={x} y={top - 28 * u} textAnchor="middle" style={italic(30 * u)} fill={color(mode, 'ink-soft')}>explore</text>
					<text x={x} y={top + h + bulbR * 2 + 34 * u} textAnchor="middle" style={italic(30 * u)} fill={color(mode, 'ink-soft')}>commit</text>
				</>
			) : null}
		</svg>
	);
};

/**
 * template.codelets@1.0.0: an ant-like swarm of tiny agents. Wander amplitude follows the same
 * temperature keys as the thermometer; as T falls they settle on `targets` (structures being built).
 * Moves on twos (hand-drawn cadence); every path is seeded, so every render is identical.
 */
export const Codelets: React.FC<DiagramProps> = (d) => {
	const p = d.props as {count?: number; w?: number; h?: number; keys?: Array<{at: number; T: number}>; targets?: Array<[number, number]>};
	const {x, y, u, mode, seed} = d;
	const n = p.count ?? 36;
	const W = (p.w ?? 700) * u;
	const H = (p.h ?? 300) * u;
	const T = p.keys ? keyed(d, p.keys.map((k) => ({at: k.at, v: k.T})), 24) : 80;
	const heat = T / 100;
	const tt = onTwos(d.t) / d.fps;
	const targets = p.targets ?? [];
	const appear = ramp(d, 0, 12);
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}} opacity={appear}>
			{Array.from({length: n}).map((_, i) => {
				const hx = x + (rand(seed, i, 'x') - 0.5) * W;
				const hy = y + (rand(seed, i, 'y') - 0.5) * H;
				const tgt = targets.length ? targets[i % targets.length] : null;
				const settle = tgt ? 1 - heat : 0;
				const bx = tgt ? hx + (x + tgt[0] * u - hx) * settle : hx;
				const by = tgt ? hy + (y + tgt[1] * u - hy) * settle : hy;
				const f1 = 0.6 + rand(seed, i, 'f1') * 1.2;
				const f2 = 0.5 + rand(seed, i, 'f2') * 1.1;
				const ph = rand(seed, i, 'ph') * Math.PI * 2;
				const amp = (14 + 70 * heat) * u;
				const px = bx + amp * Math.sin(f1 * tt * (0.5 + heat) * Math.PI + ph);
				const py = by + amp * 0.6 * Math.cos(f2 * tt * (0.5 + heat) * Math.PI + ph * 1.3);
				const vx = f1 * Math.cos(f1 * tt * (0.5 + heat) * Math.PI + ph);
				const vy = -0.6 * f2 * Math.sin(f2 * tt * (0.5 + heat) * Math.PI + ph * 1.3);
				const ang = (Math.atan2(vy, vx) * 180) / Math.PI;
				const s = 5 * u;
				return (
					<g key={i} transform={`translate(${px} ${py}) rotate(${ang})`} fill={color(mode, 'ink')}>
						<ellipse cx={-s * 1.6} cy={0} rx={s * 1.1} ry={s * 0.8} />
						<ellipse cx={0} cy={0} rx={s * 0.7} ry={s * 0.55} />
						<ellipse cx={s * 1.3} cy={0} rx={s * 0.65} ry={s * 0.6} />
						<path d={`M ${-s * 0.4} ${-s * 1.6} L ${s * 0.4} ${s * 1.6} M ${s * 0.4} ${-s * 1.6} L ${-s * 0.4} ${s * 1.6}`} stroke={color(mode, 'ink')} strokeWidth={0.9 * u} />
					</g>
				);
			})}
		</svg>
	);
};
