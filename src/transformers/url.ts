import { Transformer } from '../types';

export const urlTransformers: Transformer[] = [
	{
		id: 'urlEncode',
		title: 'URL Encode',
		transform: (text) => encodeURIComponent(text),
	},
	{
		id: 'urlDecode',
		title: 'URL Decode',
		transform: (text) => decodeURIComponent(text),
	},
];
