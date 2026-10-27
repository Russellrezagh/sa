import React from 'react';
import {color, textStyle, type Role} from '../tokens';
import {ramp, rampAt, type DiagramProps} from './common';

const mono = (size: number) => ({...textStyle('mono', 1080), fontSize: size});
const italic = (size: number) => ({...textStyle('caption', 1080), fontSize: size});

const Check: React.FC<{x: number; y: number; s: number; ok: boolean; c: string; p: number}> = ({x, y, s, ok, c, p}) =>
	ok ? (
		<path d={`M ${x - s} ${y} L ${x - s * 0.3} ${y + s * 0.7} L ${x + s} ${y - s * 0.8}`} fill="none" stroke={c} strokeWidth={s * 0.32} strokeLinecap="round" strokeLinejoin="round"
			pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
	) : (
		<path d={`M ${x - s * 0.8} ${y - s * 0.8} L ${x + s * 0.8} ${y + s * 0.8} M ${x + s * 0.8} ${y - s * 0.8} L ${x - s * 0.8} ${y + s * 0.8}`} fill="none" stroke={c} strokeWidth={s * 0.32}
			strokeLinecap="round" opacity={p} />
	);

/**
 * template.dimensions@1.0.0: PotARCin's five uses of one inferred rule, as spokes around it.
 * `marks` stamp ✓ / ✗ on each dimension at a time; `values` print a number under a label.
 */
export const Dimensions: React.FC<DiagramProps> = (d) => {
	const p = d.props as {center: string; dims: string[]; notes?: string[]; marks?: Array<{at: number; i: number; ok: boolean}>; values?: Array<string | null>; radius?: number; highlight?: number};
	const {x, y, u, mode} = d;
	const R = (p.radius ?? 300) * u;
	const n = p.dims.length;
	const cR = 92 * u;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{p.dims.map((label, i) => {
				const a = (-90 + (i * 360) / n) * (Math.PI / 180);
				const sp = ramp(d, 6 + i * 4, 12, 'draw');
				const nx = x + R * Math.cos(a);
				const ny = y + R * Math.sin(a);
				const hl = p.highlight === i;
				return (
					<g key={label}>
						<line x1={x + cR * Math.cos(a)} y1={y + cR * Math.sin(a)} x2={x + cR * Math.cos(a) + (R - cR - 54 * u) * Math.cos(a) * sp} y2={y + cR * Math.sin(a) + (R - cR - 54 * u) * Math.sin(a) * sp}
							stroke={color(mode, hl ? 'thread' : 'ink-soft')} strokeWidth={(hl ? 4.5 : 2.5) * u} />
						<circle cx={nx} cy={ny} r={54 * u} fill={color(mode, 'bg')} stroke={color(mode, hl ? 'thread' : 'ink')} strokeWidth={(hl ? 4 : 2.5) * u} opacity={sp} />
						{(() => {
							// labels sit OUTSIDE the node, away from the hub, so they never cross a spoke
							const c = Math.cos(a);
							const sn = Math.sin(a);
							const lx = nx + c * 70 * u;
							const ly = ny + sn * 70 * u + (sn < -0.5 ? -40 * u : sn > 0.5 ? 34 * u : 0);
							const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
							return (
								<g opacity={sp}>
									<text x={lx} y={ly} textAnchor={anchor} style={italic(36 * u)} fill={color(mode, 'ink')}>{label}</text>
									{p.notes?.[i] ? <text x={lx} y={ly + 30 * u} textAnchor={anchor} style={mono(20 * u)} fill={color(mode, 'ink-soft')}>{p.notes[i]}</text> : null}
								</g>
							);
						})()}
						{p.values?.[i] ? <text x={nx} y={ny + 11 * u} textAnchor="middle" style={mono(28 * u)} fill={color(mode, 'ink')} opacity={sp}>{p.values[i]}</text> : null}
					</g>
				);
			})}
			<circle cx={x} cy={y} r={cR} fill={color(mode, 'concept-5')} fillOpacity={0.18} stroke={color(mode, 'ink')} strokeWidth={3 * u} opacity={ramp(d, 0, 10)} />
			<text x={x} y={y + 12 * u} textAnchor="middle" style={italic(36 * u)} fill={color(mode, 'ink')} opacity={ramp(d, 0, 10)}>{p.center}</text>
			{(p.marks ?? []).map((m, k) => {
				const a = (-90 + (m.i * 360) / n) * (Math.PI / 180);
				const mp = rampAt(d, m.at, 10, 'draw');
				return <Check key={k} x={x + R * Math.cos(a)} y={y + R * Math.sin(a)} s={26 * u} ok={m.ok} c={color(mode, m.ok ? 'concept-5' : 'concept-3')} p={mp} />;
			})}
		</svg>
	);
};

/** template.citation@1.0.0: the paper on screen (kicker · title · authors · venue). */
export const Citation: React.FC<DiagramProps> = (d) => {
	const p = d.props as {kicker?: string; title: string; authors: string; venue: string; w?: number; align?: 'left' | 'center'};
	const {x, y, u, mode} = d;
	const a = ramp(d, 0, 12);
	const W = (p.w ?? 1100) * u;
	return (
		<div style={{position: 'absolute', left: p.align === 'left' ? x : x - W / 2, top: y, width: W, transform: `translateY(-50%) translateY(${(1 - a) * 16 * u}px)`, opacity: a,
			textAlign: p.align === 'left' ? 'left' : 'center'}}>
			{p.kicker ? <div style={{...mono(22 * u), color: color(mode, 'emph'), letterSpacing: '0.08em', marginBottom: 10 * u}}>{p.kicker}</div> : null}
			<div style={{...textStyle('headline', 1080), fontSize: 58 * u, lineHeight: 1.05, color: color(mode, 'ink')}}>{p.title}</div>
			<div style={{...textStyle('label', 1080), fontSize: 26 * u, color: color(mode, 'ink-soft'), marginTop: 16 * u}}>{p.authors}</div>
			<div style={{...mono(22 * u), color: color(mode, 'ink-soft'), marginTop: 6 * u}}>{p.venue}</div>
		</div>
	);
};

/** template.label@1.0.0: a free text label in a named type style and role. */
export const Label: React.FC<DiagramProps> = (d) => {
	const p = d.props as {text: string; style?: 'headline' | 'label' | 'mono' | 'setup' | 'payoff' | 'caption' | 'caption-learner'; size?: number; role?: Role; align?: 'left' | 'center' | 'right'; w?: number; strike?: number};
	const {x, y, u, mode} = d;
	const a = ramp(d, 0, 10);
	const st = textStyle(p.style ?? 'label', 1080);
	const W = (p.w ?? 1400) * u;
	const left = p.align === 'left' ? x : p.align === 'right' ? x - W : x - W / 2;
	const strike = p.strike === undefined ? 0 : rampAt(d, p.strike, 10, 'draw');
	return (
		<div style={{position: 'absolute', left, top: y, width: W, transform: `translateY(-50%) translateY(${(1 - a) * 10 * u}px)`, opacity: a, textAlign: p.align ?? 'center'}}>
			<span style={{...st, fontSize: (p.size ?? parseFloat(String(st.fontSize))) * u, color: color(mode, p.role ?? 'ink'), position: 'relative', whiteSpace: 'pre-line'}}>
				{p.text}
				{strike > 0 ? <span style={{position: 'absolute', left: 0, top: '55%', height: 4 * u, width: `${strike * 100}%`, background: color(mode, 'concept-3')}} /> : null}
			</span>
		</div>
	);
};
