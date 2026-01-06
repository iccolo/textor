import { Transformer } from '../types';

/**
 * ASCII 字符串转十六进制
 */
function asciiToHex(text: string): string {
	return Array.from(text)
		.map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
		.join('');
}

/**
 * 十六进制转 ASCII 字符串
 */
function hexToAscii(hex: string): string {
	// 移除可能的空格和 0x 前缀
	const cleanHex = hex.replace(/\s+/g, '').replace(/^0x/i, '');
	
	if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
		throw new Error('无效的十六进制字符串');
	}
	
	if (cleanHex.length % 2 !== 0) {
		throw new Error('十六进制字符串长度必须为偶数');
	}
	
	let result = '';
	for (let i = 0; i < cleanHex.length; i += 2) {
		const byte = parseInt(cleanHex.substring(i, i + 2), 16);
		result += String.fromCharCode(byte);
	}
	return result;
}

export const hexTransformers: Transformer[] = [
	{
		id: 'asciiToHex',
		title: 'ASCII to Hex',
		transform: async (text: string) => asciiToHex(text),
	},
	{
		id: 'hexToAscii',
		title: 'Hex to ASCII',
		transform: async (text: string) => hexToAscii(text),
	},
];
