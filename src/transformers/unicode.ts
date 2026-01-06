import { Transformer } from '../types';

export const unicodeTransformers: Transformer[] = [
	{
		id: 'unicodeEncode',
		title: 'Unicode Encode',
		transform: (text) => {
			return text.split('').map(char => {
				const code = char.charCodeAt(0);
				if (code > 127) {
					return '\\u' + code.toString(16).padStart(4, '0');
				}
				return char;
			}).join('');
		},
	},
	{
		id: 'unicodeDecode',
		title: 'Unicode Decode',
		transform: (text) => {
			return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
				return String.fromCharCode(parseInt(hex, 16));
			});
		},
	},
];
