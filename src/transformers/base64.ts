import { Transformer } from '../types';

export const base64Transformers: Transformer[] = [
	{
		id: 'base64Encode',
		title: 'Base64 Encode',
		transform: (text) => Buffer.from(text, 'utf-8').toString('base64'),
	},
	{
		id: 'base64Decode',
		title: 'Base64 Decode',
		transform: (text) => Buffer.from(text, 'base64').toString('utf-8'),
	},
];
