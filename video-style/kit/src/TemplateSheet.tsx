import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {resolveAsset} from './assetRegistry';
import {InkShape} from './components/InkShape';
import {Paper} from './components/Paper';
import {DIAGRAM_COMPONENTS} from './diagrams';
import type {DiagramProps} from './diagrams/common';
import {ensureFonts} from './fonts';
import {color, unit, type Mode} from './tokens';
import type {DiagramName} from './assetRegistry';

type Item = {name: DiagramName; x: number; y: number; s: number; props: Record<string, unknown>; t?: number};

const SHEETS: Record<'A' | 'B', Item[]> = {
	A: [
		{name: 'analogy', x: 0.22, y: 0.24, s: 0.8, props: {a: 'abc', b: 'abd', c: 'iijjkk', d: 'iijjll', dAt: 0, groups: {c: [[0, 1], [2, 3], [4, 5]], d: [[0, 1], [2, 3], [4, 5]]}}},
		{name: 'analogy', x: 0.68, y: 0.24, s: 0.8, props: {a: 'abc', b: 'abd', c: 'xyz', bonds: {a: [[0, 1, 'succ'], [1, 2, 'succ']]}, wall: {index: 2, at: 0, label: 'no successor'}}},
		{name: 'alphabet', x: 0.5, y: 0.5, s: 0.8, props: {tokens: '* @ % ! ^ # ~ $ { ? = :', name: 'symbols', highlight: [{i: 1, role: 'concept-1'}], hops: [{from: 1, to: 2, at: 0, label: '+1'}]}},
		{name: 'slipnet', x: 0.25, y: 0.78, s: 0.55, props: {
			nodes: [{id: 'first', label: 'first', x: -260, y: -60, depth: 60, x2: -120}, {id: 'last', label: 'last', x: 260, y: -60, depth: 60, x2: 120},
				{id: 'succ', label: 'successor', x: -200, y: 120, depth: 50}, {id: 'pred', label: 'predecessor', x: 200, y: 120, depth: 50}, {id: 'opp', label: 'opposite', x: 0, y: -170, depth: 90}],
			links: [{a: 'first', b: 'last', label: 'opposite'}, {a: 'succ', b: 'pred', label: 'opposite'}, {a: 'opp', b: 'first'}, {a: 'opp', b: 'last'}],
			activations: [{at: 0, id: 'opp', v: 1}, {at: 0, id: 'last', v: 0.8}], shrinkAt: 0, slips: [{at: 0, from: 'first', to: 'last'}]}},
		{name: 'thermometer', x: 0.56, y: 0.8, s: 0.5, props: {keys: [{at: 0, T: 72}]}},
		{name: 'codelets', x: 0.82, y: 0.8, s: 0.5, props: {count: 30, keys: [{at: 0, T: 70}]}},
	],
	B: [
		{name: 'lines', x: 0.2, y: 0.26, s: 0.55, props: {cats: ['Latin', 'Greek', 'Symbols'], seriesAt: [0, 0, 0, 0],
			series: [{name: 'adults', role: 'concept-2', values: [0.88, 0.91, 0.89]}, {name: 'GPT-4o', role: 'concept-3', values: [0.85, 0.63, 0.48]}], source: 'Stevenson et al. 2026, Table 2'}},
		{name: 'bars', x: 0.55, y: 0.26, s: 0.5, props: {barsAt: 0, stagger: 0, groups: [{label: 'o3 · text', bars: [{v: 77.1, role: 'concept-3'}]}, {label: 'o3 · image', bars: [{v: 5.6, role: 'concept-3'}]}, {label: 'humans', bars: [{v: 73, role: 'concept-2'}]}], source: 'Beger et al. 2026, Table 1'}},
		{name: 'venn', x: 0.85, y: 0.26, s: 0.45, props: {a: {label: 'run 1', n: 185}, b: {label: 'run 2', n: 188}, both: 146, note: 'Jaccard 0.64'}},
		{name: 'arc', x: 0.22, y: 0.72, s: 0.55, props: {pairs: [[['000', '010', '000'], ['111', '121', '111']], [['0000', '0300', '0000'], ['1111', '1311', '1111']]], test: ['00000', '00400', '00000'], digitsAt: 0}},
		{name: 'rule', x: 0.52, y: 0.62, s: 0.55, props: {who: 'Gemini 2.5 Pro · text', text: 'Sort shapes by size, then by color value; remove the first two.', verdict: 'correct-unintended', verdictAt: 0}},
		{name: 'dimensions', x: 0.82, y: 0.72, s: 0.4, props: {center: 'rule', dims: ['Definition', 'Classification', 'Generation', 'Editing', 'Inversion'], marks: [{at: 0, i: 0, ok: true}, {at: 0, i: 4, ok: false}]}},
		{name: 'citation', x: 0.5, y: 0.88, s: 0.5, props: {kicker: 'PAPER 4 · NEURIPS 2026', title: 'PotARCin', authors: 'Beger, Yi & Mitchell', venue: 'arXiv:2609.27288'}},
	],
};

/** QA still for diagram templates (landscape). Render after any change to kit/src/diagrams. */
export const TemplateSheet: React.FC<{sheet: 'A' | 'B'; mode: Mode}> = ({sheet, mode}) => {
	ensureFonts();
	const {width, height, fps} = useVideoConfig();
	const u0 = unit(width, height);
	const facade = resolveAsset('icon.facade@1.0.0');
	const chip = resolveAsset('icon.chip@1.0.0');
	return (
		<AbsoluteFill>
			<Paper bg={color(mode, 'bg')} shade={color(mode, 'ink-dark')} seed={13} />
			{SHEETS[sheet].map((it, i) => {
				const D = DIAGRAM_COMPONENTS[it.name];
				const props: DiagramProps = {x: it.x * width, y: it.y * height, u: it.s * u0, mode, t: it.t ?? 600, fps, seed: 40 + i, persist: false, props: it.props};
				return (
					<AbsoluteFill key={i}>
						<D {...props} />
					</AbsoluteFill>
				);
			})}
			{sheet === 'A' && facade.kind === 'shape' && chip.kind === 'shape' ? (
				<>
					<InkShape shape={facade.shape()} mode={mode} x={0.88 * width} y={0.6 * height} scale={0.8 * u0} seed={3} />
					<InkShape shape={chip.shape()} mode={mode} x={0.1 * width} y={0.52 * height} scale={0.6 * u0} seed={4} />
				</>
			) : null}
		</AbsoluteFill>
	);
};
