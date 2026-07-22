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
		// 单次逐字符扫描，只脱掉最外层的一层转义。
		// 深层已转义的内容（如嵌套 JSON 里的 \" 、\\ ）只会被剥掉一层，
		// 从而保证脱层后仍是合法的、可继续格式化的 JSON。
		transform: (text) => {
			let result = '';
			for (let i = 0; i < text.length; i++) {
				if (text[i] === '\\' && i + 1 < text.length) {
					const next = text[i + 1];
					switch (next) {
						case 'n':
							result += '\n';
							break;
						case 'r':
							result += '\r';
							break;
						case 't':
							result += '\t';
							break;
						case '"':
							result += '"';
							break;
						case "'":
							result += "'";
							break;
						case '\\':
							result += '\\';
							break;
						default:
							// 未知转义序列原样保留，避免误伤更深层的内容
							result += '\\' + next;
							break;
					}
					i++;
				} else {
					result += text[i];
				}
			}
			return result;
		},
	},
];
