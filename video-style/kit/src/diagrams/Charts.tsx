import React from 'react';
import {color, textStyle, type Role} from '../tokens';
import {pct, ramp, rampAt, type DiagramProps} from './common';

const mono = (size: number) => ({...textStyle('mono', 1080), fontSize: size});
const sans = (size: number, weight = 500) => ({...textStyle('label', 1080), fontSize: size, fontWeight: weight});
const italic = (size: number) => ({...textStyle('caption', 1080), fontSize: size});

/** Every chart prints its source: no number on screen without a citation (RULES K8). */
const Source: React.FC<{d: DiagramProps; text?: string; x: number; y: number}> = ({d, text, x, y}) =>
	text ? <text x={x} y={y} textAnchor="end" style={mono(18 * d.u)} fill={color(d.mode, 'ink-soft')} opacity={ramp(d, 10, 12)}>{text}</text> : null;

type Series = {name: string; role: Role; values: number[]; labelDy?: number; dashed?: boolean};

/**
 * template.lines@1.0.0: values across ordered conditions (e.g. Latin → Greek → Symbols).
 * Lines draw on one series at a time (stagger) so the story of each group can be told in turn.
 */
export const Lines: React.FC<DiagramProps> = (d) => {
	const p = d.props as {cats: string[]; series: Series[]; yMax?: number; w?: number; h?: number; source?: string; seriesAt?: number[]; showValues?: boolean; yLabel?: string; upto?: number; fromUpto?: number; growAt?: number};
	const {x, y, u, mode} = d;
	const W = (p.w ?? 900) * u;
	const H = (p.h ?? 460) * u;
	const left = x - W / 2;
	const top = y - H / 2;
	const yMax = p.yMax ?? 1;
	const px = (i: number) => left + (W * (i + 0.5)) / p.cats.length;
	const py = (v: number) => top + H * (1 - v / yMax);
	const axis = ramp(d, 0, 12, 'draw');
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<g opacity={axis}>
				<line x1={left} y1={top + H} x2={left + W} y2={top + H} stroke={color(mode, 'ink')} strokeWidth={2.5 * u} />
				<line x1={left} y1={top} x2={left} y2={top + H} stroke={color(mode, 'ink')} strokeWidth={2.5 * u} />
				{[0, 0.5, 1].map((f) => (
					<g key={f}>
						<line x1={left} x2={left + W} y1={py(f * yMax)} y2={py(f * yMax)} stroke={color(mode, 'guide')} strokeWidth={1.5 * u} strokeDasharray={`${6 * u} ${8 * u}`} />
						<text x={left - 14 * u} y={py(f * yMax) + 7 * u} textAnchor="end" style={mono(20 * u)} fill={color(mode, 'ink-soft')}>{pct(f * yMax)}</text>
					</g>
				))}
				{p.cats.map((lab, i) => (
					<text key={lab} x={px(i)} y={top + H + 44 * u} textAnchor="middle" style={italic(34 * u)} fill={color(mode, 'ink')}>{lab}</text>
				))}
				{p.yLabel ? <text x={left} y={top - 22 * u} style={mono(20 * u)} fill={color(mode, 'ink-soft')}>{p.yLabel}</text> : null}
			</g>
			{p.series.map((s, k) => {
				const upto = p.upto ?? s.values.length;
				const from = p.fromUpto ?? 0;
				// first appearance draws on per series (stagger); later scenes extend every series together
				const sp = from > 0 ? rampAt(d, p.growAt ?? 0.2, 22, 'draw') : rampAt(d, p.seriesAt?.[k] ?? 0.4 + k * 0.5, 22, 'draw');
				if (sp <= 0 && from === 0) return null;
				const visible = Math.max(1, from + (upto - from) * sp); // in points
				const all = s.values.map((v, i) => [px(i), py(v)] as const);
				const n = Math.floor(visible);
				const frac = visible - n;
				const pts = all.slice(0, n).concat(frac > 0 && n < all.length ? [[all[n - 1][0] + (all[n][0] - all[n - 1][0]) * frac, all[n - 1][1] + (all[n][1] - all[n - 1][1]) * frac] as const] : []);
				const path = pts.map(([a, b], i) => `${i ? 'L' : 'M'} ${a} ${b}`).join(' ');
				const c = color(mode, s.role);
				const last = all[Math.max(0, Math.min(n, all.length) - 1)];
				return (
					<g key={s.name}>
						<path d={path} fill="none" stroke={c} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? `${10 * u} ${9 * u}` : undefined} />
						{all.slice(0, n).map(([a, b], i) => (
							<g key={i}>
								<circle cx={a} cy={b} r={8 * u} fill={c} stroke={color(mode, 'bg')} strokeWidth={2 * u} />
								{p.showValues ? <text x={a + 14 * u} y={b - 12 * u} style={mono(19 * u)} fill={c}>{s.values[i].toFixed(2)}</text> : null}
							</g>
						))}
						<text x={last[0] + 24 * u} y={last[1] + 8 * u + (s.labelDy ?? 0) * u} style={sans(26 * u, 600)} fill={c} opacity={Math.min(1, visible / Math.max(1, upto))}>{s.name}</text>
					</g>
				);
			})}
			<Source d={d} text={p.source} x={left + W} y={top + H + 92 * u} />
		</svg>
	);
};

type Bar = {v: number; role: Role; tag?: string};

/** template.bars@1.0.0: grouped bars (percent), e.g. output-grid accuracy vs full-task accuracy per model. */
export const Bars: React.FC<DiagramProps> = (d) => {
	const p = d.props as {groups: Array<{label: string; bars: Bar[]}>; legend?: Array<{name: string; role: Role}>; yMax?: number; w?: number; h?: number; source?: string; barsAt?: number; stagger?: number};
	const {x, y, u, mode} = d;
	const W = (p.w ?? 1100) * u;
	const H = (p.h ?? 440) * u;
	const left = x - W / 2;
	const top = y - H / 2;
	const yMax = p.yMax ?? 100;
	const gw = W / p.groups.length;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<line x1={left} y1={top + H} x2={left + W} y2={top + H} stroke={color(mode, 'ink')} strokeWidth={2.5 * u} opacity={ramp(d, 0, 10)} />
			{p.groups.map((g, gi) => {
				const bw = Math.min(110 * u, (gw * 0.7) / g.bars.length);
				const gx = left + gi * gw + (gw - bw * g.bars.length - 10 * u * (g.bars.length - 1)) / 2;
				return (
					<g key={gi}>
						{g.bars.map((b, bi) => {
							const bp = rampAt(d, (p.barsAt ?? 0.3) + (gi * g.bars.length + bi) * (p.stagger ?? 0.15), 16, 'enter');
							const bh = (H * b.v * bp) / yMax;
							const bx = gx + bi * (bw + 10 * u);
							const c = color(mode, b.role);
							return (
								<g key={bi}>
									<rect x={bx + 4 * u} y={top + H - bh + 3 * u} width={bw} height={bh} fill={c} opacity={0.5} />
									<rect x={bx} y={top + H - bh} width={bw} height={bh} fill="none" stroke={c} strokeWidth={2.5 * u} />
									<text x={bx + bw / 2} y={top + H - bh - 12 * u} textAnchor="middle" style={mono(22 * u)} fill={c} opacity={bp >= 1 ? 1 : 0}>
										{Number.isInteger(b.v) ? b.v : b.v.toFixed(1)}%
									</text>
									{b.tag ? <text x={bx + bw / 2} y={top + H + 30 * u} textAnchor="middle" style={mono(17 * u)} fill={color(mode, 'ink-soft')}>{b.tag}</text> : null}
								</g>
							);
						})}
						<text x={left + gi * gw + gw / 2} y={top + H + (g.bars.some((b) => b.tag) ? 70 : 46) * u} textAnchor="middle" style={italic(30 * u)} fill={color(mode, 'ink')}
							opacity={ramp(d, 4, 10)}>{g.label}</text>
					</g>
				);
			})}
			{(p.legend ?? []).map((l, i, all) => {
				// legend entries are spaced by their text length (≈ 0.55 em per character)
				const lx = left + all.slice(0, i).reduce((acc, e) => acc + (e.name.length * 13.5 + 90) * u, 0);
				return (
					<g key={l.name} opacity={ramp(d, 8, 10)}>
						<rect x={lx} y={top - 46 * u} width={26 * u} height={26 * u} fill={color(mode, l.role)} opacity={0.6} />
						<text x={lx + 38 * u} y={top - 25 * u} style={sans(24 * u)} fill={color(mode, 'ink')}>{l.name}</text>
					</g>
				);
			})}
			<Source d={d} text={p.source} x={left + W} y={top + H + 118 * u} />
		</svg>
	);
};

/** template.venn@1.0.0: two runs of the same model and the overlap of what they solved. */
export const Venn: React.FC<DiagramProps> = (d) => {
	const p = d.props as {a: {label: string; n: number}; b: {label: string; n: number}; both: number; note?: string; role?: Role; source?: string};
	const {x, y, u, mode} = d;
	const r = 190 * u;
	const off = 120 * u;
	const c = color(mode, p.role ?? 'concept-3');
	const a = ramp(d, 0, 18, 'draw');
	const b = ramp(d, 8, 18, 'draw');
	const mid = ramp(d, 22, 12);
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<circle cx={x - off} cy={y} r={r} fill={c} fillOpacity={0.15 * a} stroke={c} strokeWidth={3 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - a} />
			<circle cx={x + off} cy={y} r={r} fill={c} fillOpacity={0.15 * b} stroke={c} strokeWidth={3 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - b} />
			<text x={x - off - r * 0.55} y={y - r - 26 * u} textAnchor="middle" style={sans(26 * u)} fill={color(mode, 'ink')} opacity={a}>{p.a.label}</text>
			<text x={x + off + r * 0.55} y={y - r - 26 * u} textAnchor="middle" style={sans(26 * u)} fill={color(mode, 'ink')} opacity={b}>{p.b.label}</text>
			<text x={x - off - r * 0.5} y={y + 14 * u} textAnchor="middle" style={mono(40 * u)} fill={c} opacity={a}>{p.a.n}</text>
			<text x={x + off + r * 0.5} y={y + 14 * u} textAnchor="middle" style={mono(40 * u)} fill={c} opacity={b}>{p.b.n}</text>
			<text x={x} y={y + 6 * u} textAnchor="middle" style={mono(44 * u)} fill={color(mode, 'ink')} opacity={mid}>{p.both}</text>
			<text x={x} y={y + 44 * u} textAnchor="middle" style={mono(18 * u)} fill={color(mode, 'ink-soft')} opacity={mid}>in both</text>
			{p.note ? <text x={x} y={y + r + 56 * u} textAnchor="middle" style={italic(34 * u)} fill={color(mode, 'ink')} opacity={mid}>{p.note}</text> : null}
			<Source d={d} text={p.source} x={x + off + r} y={y + r + 100 * u} />
		</svg>
	);
};
