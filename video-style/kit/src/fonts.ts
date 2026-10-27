// Fonts come from the vendored, hashed asset library. Never from a CDN.
import {continueRender, delayRender, staticFile} from 'remotion';

const FACES: Array<[family: string, file: string, descriptors: FontFaceDescriptors]> = [
	['Instrument Serif', 'font/instrument-serif/InstrumentSerif-Regular.ttf', {style: 'normal', weight: '400'}],
	['Instrument Serif', 'font/instrument-serif/InstrumentSerif-Italic.ttf', {style: 'italic', weight: '400'}],
	['Inter', 'font/inter/Inter-Variable.ttf', {style: 'normal', weight: '100 900'}],
	['JetBrains Mono', 'font/jetbrains-mono/JetBrainsMono-Variable.ttf', {style: 'normal', weight: '100 800'}],
	['Caveat', 'font/caveat/Caveat-Variable.ttf', {style: 'normal', weight: '400 700'}],
];

let loaded = false;

export const ensureFonts = () => {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('Loading vendored fonts');
	Promise.all(
		FACES.map(async ([familyName, file, descriptors]) => {
			const face = new FontFace(familyName, `url(${staticFile(file)})`, descriptors);
			await face.load();
			(document.fonts as unknown as Set<FontFace>).add(face);
		}),
	)
		.then(() => continueRender(handle))
		.catch((err) => {
			// Fail loudly: a silent fallback font would break determinism.
			throw err;
		});
};
