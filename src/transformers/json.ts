import { Transformer } from '../types';

export const jsonTransformers: Transformer[] = [
	{
		id: 'jsonFormat',
		title: 'JSON Format',
		transform: (text) => JSON.stringify(JSON.parse(text), null, 2),
	},
	{
		id: 'jsonMinify',
		title: 'JSON Minify',
		transform: (text) => JSON.stringify(JSON.parse(text)),
	},
];
