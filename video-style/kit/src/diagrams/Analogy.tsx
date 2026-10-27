import React from 'react';
import {color, textStyle} from '../tokens';
import {rampAt, ramp, tokensOf, type DiagramProps} from './common';

type Pair = [number, number];
type Bond = [number, number, string];

/**
 * template.analogy@1.0.0: the Copycat letter-string analogy "A → B ; C → D".
 * Tiles are paper cards with ink borders; the changed tile carries a thread-coloured underline
 * (the relation made visible). Optional sameness groups, labelled bonds and a "wall" mark.
 */
export const Analogy: React.FC<DiagramProps> = (d) => {
	const p = d.props as {
		a: string; b: string; c?: string; d?: string; dAt?: number; size?: number;
		groups?: {c?: Pair[]; d?: Pair[]}; groupsAt?: number;
		bonds?: {a?: Bond[]; c?: Bond[]}; bondsAt?: number;
		wall?: {index: number; at: number; label?: string};
		answerRole?: 'thread' | 'concept-1' | 'concept-2' | 'concept-3' | 'concept-5' | 'emph';
		dim?: boolean;
	};
	const {x, y, u, mode} = d;
	const size = (p.size ?? 92) * u;
	const gap = 14 * u;
	const arrowGap = 120 * u;
	const rowGap = 56 * u;
	const rows: Array<[string[], string[] | null]> = [[tokensOf(p.a), tokensOf(p.b)]];
	if (p.c) rows.push([tokensOf(p.c), p.d ? tokensOf(p.d) : null]);
	const w = (n: number) => n * size + Math.max(0, n - 1) * gap;
	const maxL = Math.max(...rows.map(([l]) => w(l.length)));
	const maxR = Math.max(...rows.map(([l, r]) => w(r?.length ?? l.length)));
	const arrowX = x - (maxL + arrowGap + maxR) / 2 + maxL + arrowGap / 2;
	const top = y - (rows.length * size + (rows.length - 1) * rowGap) / 2;
	const ink = color(mode, 'ink');
	const paper = color(mode, 'bg');
	const answerC = color(mode, p.answerRole ?? 'thread');
	const font = {...textStyle('caption-learner', 1080), fontSize: size * 0.62};
	const dP = rampAt(d, p.dAt ?? 1.2, 10);

	const tile = (ch: string, cx: number, cy: number, appear: number, key: string, opts: {changed?: boolean; unknown?: boolean} = {}) => {
		if (appear <= 0) return null;
		const s = 0.85 + 0.15 * appear;
		return (
			<g key={key} transform={`translate(${cx} ${cy}) scale(${s})`} opacity={appear * (p.dim ? 0.45 : 1)}>
				<rect x={-size / 2} y={-size / 2} width={size} height={size} rx={10 * u} fill={paper} stroke={ink} strokeWidth={2.5 * u}
					strokeDasharray={opts.unknown ? `${8 * u} ${7 * u}` : undefined} />
				<text x={0} y={size * 0.2} textAnchor="middle" fill={opts.unknown ? color(mode, 'ink-soft') : ink} style={font}>{ch}</text>
				{opts.changed ? <line x1={-size * 0.3} x2={size * 0.3} y1={size * 0.36} y2={size * 0.36} stroke={answerC} strokeWidth={6 * u} strokeLinecap="round" /> : null}
			</g>
		);
	};

	const row = (tokens: string[], right: boolean, cy: number, startF: number, rowKey: string, changedAgainst?: string[], unknown = false, appearOverride?: number) => {
		const x0 = right ? arrowX + arrowGap / 2 : arrowX - arrowGap / 2 - w(tokens.length);
		return tokens.map((ch, i) => {
			const appear = appearOverride ?? ramp(d, startF + i * 2, 8);
			const changed = !!changedAgainst && changedAgainst.length === tokens.length && changedAgainst[i] !== ch;
			return tile(ch, x0 + size / 2 + i * (size + gap), cy, appear, `${rowKey}${i}`, {changed, unknown});
		});
	};
	const centerOf = (tokens: string[], right: boolean, i: number) =>
		(right ? arrowX + arrowGap / 2 : arrowX - arrowGap / 2 - w(tokens.length)) + size / 2 + i * (size + gap);

	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{rows.map(([l, r], ri) => {
				const cy = top + size / 2 + ri * (size + rowGap);
				const start = ri * 16;
				const arrowP = ramp(d, start + 6, 10, 'draw');
				const isAnswerRow = ri === 1;
				const right = r ?? l;
				return (
					<g key={ri}>
						{row(l, false, cy, start, `l${ri}`)}
						<g opacity={arrowP}>
							<line x1={arrowX - arrowGap * 0.32} x2={arrowX - arrowGap * 0.32 + arrowGap * 0.64 * arrowP} y1={cy} y2={cy} stroke={ink} strokeWidth={3 * u} strokeLinecap="round" />
							<path d={`M ${arrowX + arrowGap * 0.2} ${cy - 10 * u} L ${arrowX + arrowGap * 0.32} ${cy} L ${arrowX + arrowGap * 0.2} ${cy + 10 * u}`} fill="none" stroke={ink} strokeWidth={3 * u} strokeLinecap="round" strokeLinejoin="round" />
						</g>
						{isAnswerRow
							? r
								? <>
									{row(['?'], true, cy, start + 8, `q${ri}`, undefined, true, ramp(d, start + 8, 8) * (1 - dP))}
									{row(r, true, cy, start + 8, `r${ri}`, l, false, dP)}
								</>
								: row(['?'], true, cy, start + 8, `q${ri}`, undefined, true)
							: row(right, true, cy, start + 8, `r${ri}`, l)}
					</g>
				);
			})}
			{/* sameness groups: soft brackets around tile ranges */}
			{(['c', 'd'] as const).map((which) => (p.groups?.[which] ?? []).map(([i, j], k) => {
				const ri = 1;
				const tokens = which === 'c' ? rows[1]?.[0] : rows[1]?.[1];
				if (!tokens) return null;
				const gP = rampAt(d, which === 'd' ? Math.max(p.dAt ?? 0, p.groupsAt ?? 0) : p.groupsAt ?? 0, 10) * (which === 'd' ? dP : 1);
				const cy = top + size / 2 + ri * (size + rowGap);
				const x1 = centerOf(tokens, which === 'd', i) - size / 2 - 6 * u;
				const x2 = centerOf(tokens, which === 'd', j) + size / 2 + 6 * u;
				return <rect key={`${which}${k}`} x={x1} y={cy - size / 2 - 8 * u} width={x2 - x1} height={size + 16 * u} rx={18 * u} fill="none"
					stroke={color(mode, 'concept-5')} strokeWidth={3 * u} opacity={gP} />;
			}))}
			{/* bonds: arcs above a row with a tiny label */}
			{(['a', 'c'] as const).map((which) => (p.bonds?.[which] ?? []).map(([i, j, label], k) => {
				const ri = which === 'a' ? 0 : 1;
				const tokens = rows[ri]?.[0];
				if (!tokens) return null;
				const bP = rampAt(d, (p.bondsAt ?? 0) + k * 0.12, 10, 'draw');
				const cy = top + ri * (size + rowGap);
				const x1 = centerOf(tokens, false, i);
				const x2 = centerOf(tokens, false, j);
				const h = 34 * u;
				return (
					<g key={`${which}b${k}`} opacity={bP}>
						<path d={`M ${x1} ${cy - 4 * u} Q ${(x1 + x2) / 2} ${cy - h * 1.6} ${x2} ${cy - 4 * u}`} fill="none" stroke={color(mode, 'thread')} strokeWidth={3 * u}
							strokeDasharray={`${400 * u}`} strokeDashoffset={400 * u * (1 - bP)} strokeLinecap="round" />
						<text x={(x1 + x2) / 2} y={cy - h * 0.95} textAnchor="middle" style={{...textStyle('mono', 1080), fontSize: 20 * u}} fill={color(mode, 'thread')}>{label}</text>
					</g>
				);
			}))}
			{/* the wall: a slash through the tile that has nowhere to go */}
			{p.wall && rows[1] ? (() => {
				const wP = rampAt(d, p.wall.at, 8);
				const cy = top + size / 2 + (size + rowGap);
				const cx = centerOf(rows[1][0], false, p.wall.index);
				const r = size * 0.62;
				return (
					<g opacity={wP}>
						<line x1={cx - r} y1={cy + r} x2={cx - r + 2 * r * wP} y2={cy + r - 2 * r * wP} stroke={color(mode, 'concept-4')} strokeWidth={7 * u} strokeLinecap="round" />
						{p.wall.label ? <text x={cx} y={cy + size * 0.95} textAnchor="middle" style={{...textStyle('mono', 1080), fontSize: 22 * u}} fill={color(mode, 'concept-4')}>{p.wall.label}</text> : null}
					</g>
				);
			})() : null}
		</svg>
	);
};
