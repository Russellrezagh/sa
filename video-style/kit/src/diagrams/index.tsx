import React from 'react';
import type {DiagramName} from '../assetRegistry';
import {Analogy} from './Analogy';
import {ArcTask, RuleCard} from './Arc';
import {Bars, Lines, Venn} from './Charts';
import {Alphabet, Codelets, Slipnet, Thermometer} from './Copycat';
import {Citation, Dimensions, Label} from './Misc';
import type {DiagramProps} from './common';

export const DIAGRAM_COMPONENTS: Record<DiagramName, React.FC<DiagramProps>> = {
	analogy: Analogy,
	alphabet: Alphabet,
	slipnet: Slipnet,
	thermometer: Thermometer,
	codelets: Codelets,
	lines: Lines,
	bars: Bars,
	venn: Venn,
	arc: ArcTask,
	rule: RuleCard,
	dimensions: Dimensions,
	citation: Citation,
	label: Label,
};
