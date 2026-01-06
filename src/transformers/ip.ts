import { Transformer } from '../types';

function ipToInt(ip: string): number {
	const parts = ip.trim().split('.');
	if (parts.length !== 4) {
		throw new Error('无效的 IP 地址格式');
	}
	let result = 0;
	for (const part of parts) {
		const num = parseInt(part, 10);
		if (isNaN(num) || num < 0 || num > 255) {
			throw new Error('无效的 IP 地址格式');
		}
		result = result * 256 + num;
	}
	return result >>> 0; // 转为无符号整数
}

function intToIp(num: number): string {
	if (num < 0 || num > 4294967295) {
		throw new Error('无效的整数，范围应为 0 ~ 4294967295');
	}
	return [
		(num >>> 24) & 255,
		(num >>> 16) & 255,
		(num >>> 8) & 255,
		num & 255,
	].join('.');
}

export const ipTransformers: Transformer[] = [
	{
		id: 'ipToInt',
		title: 'IP to Integer',
		transform: (text) => ipToInt(text).toString(),
	},
	{
		id: 'intToIp',
		title: 'Integer to IP',
		transform: (text) => {
			const num = parseInt(text.trim(), 10);
			if (isNaN(num)) {
				throw new Error('无效的整数');
			}
			return intToIp(num);
		},
	},
];
