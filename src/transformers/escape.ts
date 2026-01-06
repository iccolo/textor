import { Transformer } from '../types';

export const escapeTransformers: Transformer[] = [
	{
		id: 'escape',
		title: 'Escape',
		transform: (text) => {
			return text
				.replace(/\\/g, '\\\\')
				.replace(/"/g, '\\"')
				.replace(/'/g, "\\'")
				.replace(/\n/g, '\\n')
				.replace(/\r/g, '\\r')
				.replace(/\t/g, '\\t');
		},
	},
	{
		id: 'unescape',
		title: 'Unescape',
		transform: (text) => {
			return text
				.replace(/\\n/g, '\n')
				.replace(/\\r/g, '\r')
				.replace(/\\t/g, '\t')
				.replace(/\\'/g, "'")
				.replace(/\\"/g, '"')
				.replace(/\\\\/g, '\\');
		},
	},
];
