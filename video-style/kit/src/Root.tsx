import React from 'react';
import {Composition, Still} from 'remotion';
import {AssetSheet} from './AssetSheet';
import {StoryboardVideo} from './Storyboard';
import {layout} from './tokens';
import type {Board} from './types';
import demo from './storyboards/give-it-a-thread.json';

const boardComposition = (id: string, board: Board) => {
	const [width, height] = layout(board.meta.format).size.$value as number[];
	return (
		<Composition
			id={id}
			component={StoryboardVideo}
			durationInFrames={board.meta.total_frames}
			fps={board.meta.fps}
			width={width}
			height={height}
			defaultProps={{board}}
		/>
	);
};

export const RemotionRoot: React.FC = () => (
	<>
		{/* Add new storyboards here after `lint_storyboard.py --emit src/storyboards/<id>.json`. */}
		{boardComposition('MaiDemo', demo as unknown as Board)}
		<Still id="AssetSheetPaper" component={AssetSheet} width={1080} height={1920} defaultProps={{mode: 'paper' as const}} />
		<Still id="AssetSheetNight" component={AssetSheet} width={1080} height={1920} defaultProps={{mode: 'night' as const}} />
	</>
);
