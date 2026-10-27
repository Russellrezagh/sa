import React from 'react';
import {interpolate} from 'remotion';
import {color, textStyle, type Role} from '../tokens';
import {arcColor, ramp, rampAt, type DiagramProps} from './common';

const mono = (size: number) => ({...textStyle('mono', 1080), fontSize: size});
const italic = (size: number) => ({...textStyle('caption', 1080), fontSize: size});

type Grid = string[];

/** One ARC grid: colour cells (what people see) or digit cells (what text-only models are fed). */
const GridView: React.FC<{d: DiagramProps; g: Grid | '?'; x: number; y: number; cell: number; digits: number; appear: number; outline?: Role; ghost?: boolean}> = ({d, g, x, y, cell, digits, appear, outline, ghost}) => {
	const {u, mode} = d;
	if (g === '?') {
		const s = cell * 4;
		return (
			<g opacity={appear}>
				<rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill="none" stroke={color(mode, 'ink-soft')} strokeWidth={2.5 * u} strokeDasharray={`${8 * u} ${7 * u}`} />
				<text x={x} y={y + 16 * u} textAnchor="middle" style={italic(56 * u)} fill={color(mode, 'ink-soft')}>?</text>
			</g>
		);
	}
	const rows = g.length;
	const cols = Math.max(...g.map((r) => r.length));
	const W = cols * cell;
	const H = rows * cell;
	const x0 = x - W / 2;
	const y0 = y - H / 2;
	return (
		<g opacity={appear * (ghost ? 0.35 : 1)}>
			{g.map((row, r) =>
				Array.from(row).map((ch, c) => {
					const code = Number(ch);
					return (
						<g key={`${r}-${c}`}>
							<rect x={x0 + c * cell} y={y0 + r * cell} width={cell} height={cell} fill={arcColor(code)} opacity={1 - digits} />
							<rect x={x0 + c * cell} y={y0 + r * cell} width={cell} height={cell} fill={color(mode, 'bg')} opacity={digits} />
							{digits > 0 ? (
								<text x={x0 + c * cell + cell / 2} y={y0 + r * cell + cell * 0.7} textAnchor="middle" style={mono(cell * 0.62)} fill={color(mode, 'concept-1')} opacity={digits}>{ch}</text>
							) : null}
						</g>
					);
				}),
			)}
			{Array.from({length: rows + 1}).map((_, r) => (
				<line key={`h${r}`} x1={x0} x2={x0 + W} y1={y0 + r * cell} y2={y0 + r * cell} stroke={color(mode, 'guide')} strokeWidth={1 * u} />
			))}
			{Array.from({length: cols + 1}).map((_, c) => (
				<line key={`v${c}`} x1={x0 + c * cell} x2={x0 + c * cell} y1={y0} y2={y0 + H} stroke={color(mode, 'guide')} strokeWidth={1 * u} />
			))}
			<rect x={x0} y={y0} width={W} height={H} fill="none" stroke={outline ? color(mode, outline) : color(mode, 'ink')} strokeWidth={(outline ? 5 : 2.5) * u}
				strokeDasharray={outline ? `${10 * u} ${7 * u}` : undefined} />
		</g>
	);
};

/**
 * template.arc@1.0.0: an ARC task — demonstration pairs (in → out) and a test input.
 * `digitsAt` cross-fades every grid from colours to integer codes (the textual modality).
 * `answer` / `answerAt` fills the test output; `bad` shows a malformed answer with a dashed outline.
 */
export const ArcTask: React.FC<DiagramProps> = (d) => {
	const p = d.props as {
		pairs: Array<[Grid, Grid]>; test?: Grid; answer?: Grid; answerAt?: number; bad?: Grid; badAt?: number; badNote?: string;
		cell?: number; digitsAt?: number; digitsOutAt?: number; label?: string; colGap?: number;
	};
	const {x, y, u, mode} = d;
	const cell = (p.cell ?? 26) * u;
	const digits = p.digitsAt === undefined ? 0 : rampAt(d, p.digitsAt, 18, 'standard') * (p.digitsOutAt === undefined ? 1 : 1 - rampAt(d, p.digitsOutAt, 18, 'standard'));
	const cols = [...p.pairs, ...(p.test ? [[p.test, p.answer && rampAt(d, p.answerAt ?? 0, 2) >= 1 ? p.answer : '?'] as [Grid, Grid | '?']] : [])];
	const maxW = Math.max(...cols.flat().filter((g): g is Grid => g !== '?').map((g) => Math.max(...g.map((r) => r.length)))) * cell;
	const maxH = Math.max(...cols.flat().filter((g): g is Grid => g !== '?').map((g) => g.length)) * cell;
	const colW = maxW + (p.colGap ?? 70) * u;
	const x0 = x - (cols.length * colW) / 2 + colW / 2;
	const rowGap = maxH / 2 + 60 * u;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{cols.map(([gi, go], k) => {
				const cx = x0 + k * colW;
				const appear = ramp(d, k * 5, 10);
				const isTest = !!p.test && k === cols.length - 1;
				const badP = isTest && p.bad ? rampAt(d, p.badAt ?? 0, 8) : 0;
				return (
					<g key={k}>
						{isTest ? (
							<line x1={cx - colW / 2} x2={cx - colW / 2} y1={y - maxH - 50 * u} y2={y + maxH + 50 * u} stroke={color(mode, 'guide')} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${8 * u}`} opacity={appear} />
						) : null}
						<GridView d={d} g={gi} x={cx} y={y - rowGap / 2 - 10 * u} cell={cell} digits={digits} appear={appear} />
						<text x={cx} y={y + 8 * u} textAnchor="middle" style={italic(34 * u)} fill={color(mode, 'ink-soft')} opacity={appear}>↓</text>
						{badP > 0 && p.bad ? (
							<>
								<GridView d={d} g={p.bad} x={cx} y={y + rowGap / 2 + 10 * u} cell={cell} digits={digits} appear={badP} outline="concept-3" />
								{p.badNote ? <text x={cx} y={y + rowGap + maxH / 2 + 50 * u} textAnchor="middle" style={mono(22 * u)} fill={color(mode, 'concept-3')} opacity={badP}>{p.badNote}</text> : null}
							</>
						) : (
							<GridView d={d} g={go} x={cx} y={y + rowGap / 2 + 10 * u} cell={cell} digits={digits} appear={appear} />
						)}
						<text x={cx} y={y - rowGap - maxH / 2 - 14 * u} textAnchor="middle" style={mono(20 * u)} fill={color(mode, 'ink-soft')} opacity={appear}>
							{isTest ? 'test' : `demo ${k + 1}`}
						</text>
					</g>
				);
			})}
			{p.label ? <text x={x + (cols.length * colW) / 2} y={y + rowGap + maxH / 2 + 92 * u} textAnchor="end" style={mono(18 * u)} fill={color(mode, 'ink-soft')}>{p.label}</text> : null}
		</svg>
	);
};

const VERDICT: Record<string, Role> = {'correct-intended': 'concept-5', 'correct-unintended': 'emph', incorrect: 'ink'};

/**
 * template.rule@1.0.0: a stated rule as a card ("who" + quote), stamped with its grade.
 * Grades follow the paper: correct-intended (concept-5), correct-unintended (emph), incorrect (ink).
 */
export const RuleCard: React.FC<DiagramProps> = (d) => {
	const p = d.props as {who: string; text: string; verdict?: string; verdictAt?: number; w?: number; quoteStyle?: 'mono' | 'serif'};
	const {x, y, u, mode} = d;
	const W = (p.w ?? 720) * u;
	const appear = ramp(d, 0, 10);
	const vp = p.verdict ? rampAt(d, p.verdictAt ?? 0.8, 10) : 0;
	const vRole = VERDICT[p.verdict ?? 'incorrect'] ?? 'ink';
	const stampScale = interpolate(vp, [0, 1], [1.6, 1]);
	return (
		<div style={{position: 'absolute', left: x - W / 2, top: y, transform: `translateY(-50%) translateY(${(1 - appear) * 14 * u}px)`, width: W, opacity: appear}}>
			<div style={{background: color(mode, 'bg'), border: `${2.5 * u}px solid ${color(mode, 'ink')}`, borderRadius: 12 * u, padding: `${22 * u}px ${28 * u}px`, boxShadow: `${5 * u}px ${6 * u}px 0 ${color(mode, 'bg-shade')}`}}>
				<div style={{...textStyle('mono', 1080), fontSize: 20 * u, color: color(mode, 'ink-soft'), marginBottom: 10 * u}}>{p.who}</div>
				<div style={{...(p.quoteStyle === 'serif' ? {...textStyle('caption', 1080), fontSize: 36 * u} : {...textStyle('mono', 1080), fontSize: 25 * u, lineHeight: 1.35}), color: color(mode, 'ink')}}>
					“{p.text}”
				</div>
			</div>
			{p.verdict ? (
				<div style={{position: 'absolute', right: -18 * u, bottom: -30 * u, transform: `rotate(-7deg) scale(${stampScale})`, opacity: vp,
					border: `${3.5 * u}px solid ${color(mode, vRole)}`, borderRadius: 8 * u, padding: `${6 * u}px ${14 * u}px`, background: color(mode, 'bg'),
					...textStyle('mono', 1080), fontSize: 22 * u, fontWeight: 700, letterSpacing: '0.04em', color: color(mode, vRole), textTransform: 'uppercase'}}>
					{p.verdict}
				</div>
			) : null}
		</div>
	);
};
