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
	{
		id: 'base64ToHex',
		title: 'Base64 to Hex',
		transform: (text) => Buffer.from(text.trim(), 'base64').toString('hex'),
	},
	{
		id: 'hexToBase64',
		title: 'Hex to Base64',
		transform: (text) => {
			const clean = text.replace(/\s+/g, '').replace(/^0x/i, '');
			if (!/^[0-9a-fA-F]*$/.test(clean)) {
				throw new Error('Invalid hex string');
			}
			if (clean.length % 2 !== 0) {
				throw new Error('Hex string length must be even');
			}
			return Buffer.from(clean, 'hex').toString('base64');
		},
	},
];
