import { Transformer } from '../types';

interface FormatResult {
	/** 已格式化的输出文本 */
	out: string;
	/** 该节点是否因输入被截断而未完整闭合 */
	truncated: boolean;
}

interface StringToken {
	value: string;
	/** 字符串是否被正常的结束引号闭合 */
	closed: boolean;
	/** 原始子串（含起始引号，截断时不含结束引号） */
	raw: string;
}

/**
 * 容错的 JSON 格式化器。
 *
 * 当输入是被截断（不完整）的 JSON 时：
 *  - 前面完整的部分会按正常缩进格式化；
 *  - 末尾残缺的部分（未闭合的字符串、缺失的值等）原样保留，
 *    且不会补全右引号、`}`、`]`，从而让用户一眼看出内容被截断。
 */
class LenientJsonFormatter {
	private i = 0;
	private readonly n: number;

	constructor(
		private readonly text: string,
		private readonly pretty: boolean,
		private readonly unit = '  ',
	) {
		this.n = text.length;
	}

	format(): string {
		this.skipWs();
		const result = this.parseValue(0);
		return result.out.replace(/\s+$/, '');
	}

	private skipWs(): void {
		while (this.i < this.n && /\s/.test(this.text[this.i])) {
			this.i++;
		}
	}

	/** 某一层的换行 + 缩进（minify 模式下为空） */
	private nl(level: number): string {
		return this.pretty ? '\n' + this.unit.repeat(level) : '';
	}

	/** 条目之间的分隔（逗号 + 换行缩进） */
	private entrySep(level: number): string {
		return this.pretty ? ',\n' + this.unit.repeat(level) : ',';
	}

	private get kvSep(): string {
		return this.pretty ? ': ' : ':';
	}

	private parseValue(level: number): FormatResult {
		this.skipWs();
		if (this.i >= this.n) {
			return { out: '', truncated: true };
		}
		const c = this.text[this.i];
		if (c === '{') {
			return this.parseObject(level);
		}
		if (c === '[') {
			return this.parseArray(level);
		}
		if (c === '"') {
			return this.parseStringValue();
		}
		if (c === '-' || (c >= '0' && c <= '9')) {
			return this.parseNumberValue();
		}
		if (this.matchLiteral('true')) {
			return { out: 'true', truncated: false };
		}
		if (this.matchLiteral('false')) {
			return { out: 'false', truncated: false };
		}
		if (this.matchLiteral('null')) {
			return { out: 'null', truncated: false };
		}
		// 无法识别，可能是被截断的字面量（如 "tru"、"nul"），原样保留
		return { out: this.text.slice(this.i), truncated: true };
	}

	private matchLiteral(literal: string): boolean {
		if (this.text.startsWith(literal, this.i)) {
			this.i += literal.length;
			return true;
		}
		return false;
	}

	private parseObject(level: number): FormatResult {
		this.i++; // 跳过 '{'
		const parts: string[] = [];
		while (true) {
			this.skipWs();
			if (this.i >= this.n) {
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			if (this.text[this.i] === '}') {
				this.i++;
				return { out: this.buildContainer('{', '}', parts, level, true), truncated: false };
			}
			if (this.text[this.i] !== '"') {
				// 非法内容，作为残缺尾部原样保留
				const tail = this.text.slice(this.i).replace(/\s+$/, '');
				if (tail) {
					parts.push(tail);
				}
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			const key = this.parseStringToken();
			if (!key.closed) {
				// 键被截断，原样保留（含起始引号）
				parts.push(key.raw.replace(/\s+$/, ''));
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			this.skipWs();
			if (this.i >= this.n || this.text[this.i] !== ':') {
				// 键完整但缺少冒号/值，保留键
				parts.push(JSON.stringify(key.value));
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			this.i++; // 跳过 ':'
			this.skipWs();
			if (this.i >= this.n) {
				// 缺少值，保留 "键":
				parts.push(JSON.stringify(key.value) + this.kvSep);
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			const value = this.parseValue(level + 1);
			if (value.truncated) {
				parts.push(JSON.stringify(key.value) + this.kvSep + value.out);
				return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
			}
			parts.push(JSON.stringify(key.value) + this.kvSep + value.out);
			this.skipWs();
			if (this.i < this.n && this.text[this.i] === ',') {
				this.i++;
				continue;
			}
			if (this.i < this.n && this.text[this.i] === '}') {
				this.i++;
				return { out: this.buildContainer('{', '}', parts, level, true), truncated: false };
			}
			// 输入结束但缺少闭合括号
			return { out: this.buildContainer('{', '}', parts, level, false), truncated: true };
		}
	}

	private parseArray(level: number): FormatResult {
		this.i++; // 跳过 '['
		const parts: string[] = [];
		while (true) {
			this.skipWs();
			if (this.i >= this.n) {
				return { out: this.buildContainer('[', ']', parts, level, false), truncated: true };
			}
			if (this.text[this.i] === ']') {
				this.i++;
				return { out: this.buildContainer('[', ']', parts, level, true), truncated: false };
			}
			const value = this.parseValue(level + 1);
			if (value.truncated) {
				if (value.out) {
					parts.push(value.out);
				}
				return { out: this.buildContainer('[', ']', parts, level, false), truncated: true };
			}
			parts.push(value.out);
			this.skipWs();
			if (this.i < this.n && this.text[this.i] === ',') {
				this.i++;
				continue;
			}
			if (this.i < this.n && this.text[this.i] === ']') {
				this.i++;
				return { out: this.buildContainer('[', ']', parts, level, true), truncated: false };
			}
			return { out: this.buildContainer('[', ']', parts, level, false), truncated: true };
		}
	}

	private buildContainer(
		open: string,
		close: string,
		parts: string[],
		level: number,
		closed: boolean,
	): string {
		if (parts.length === 0) {
			return closed ? open + close : open;
		}
		const head = open + this.nl(level + 1) + parts.join(this.entrySep(level + 1));
		return closed ? head + this.nl(level) + close : head;
	}

	private parseStringValue(): FormatResult {
		const token = this.parseStringToken();
		if (token.closed) {
			// 完整字符串：规范化输出
			return { out: JSON.stringify(token.value), truncated: false };
		}
		// 被截断的字符串：原样保留（含起始引号、不补结束引号）
		return { out: token.raw.replace(/\s+$/, ''), truncated: true };
	}

	private parseStringToken(): StringToken {
		const start = this.i;
		this.i++; // 跳过起始的 '"'
		let value = '';
		while (this.i < this.n) {
			const c = this.text[this.i];
			if (c === '\\') {
				if (this.i + 1 >= this.n) {
					// 末尾是孤立的反斜杠（被截断）
					this.i = this.n;
					break;
				}
				const next = this.text[this.i + 1];
				switch (next) {
					case '"': value += '"'; break;
					case '\\': value += '\\'; break;
					case '/': value += '/'; break;
					case 'b': value += '\b'; break;
					case 'f': value += '\f'; break;
					case 'n': value += '\n'; break;
					case 'r': value += '\r'; break;
					case 't': value += '\t'; break;
					case 'u': {
						const hex = this.text.slice(this.i + 2, this.i + 6);
						if (/^[0-9a-fA-F]{4}$/.test(hex)) {
							value += String.fromCharCode(parseInt(hex, 16));
							this.i += 4;
						} else {
							// \u 序列被截断
							this.i = this.n;
							return { value, closed: false, raw: this.text.slice(start, this.i) };
						}
						break;
					}
					default:
						value += next;
						break;
				}
				this.i += 2;
				continue;
			}
			if (c === '"') {
				this.i++;
				return { value, closed: true, raw: this.text.slice(start, this.i) };
			}
			value += c;
			this.i++;
		}
		// 到达文本末尾但字符串未闭合（被截断）
		return { value, closed: false, raw: this.text.slice(start, this.i) };
	}

	private parseNumberValue(): FormatResult {
		const start = this.i;
		if (this.text[this.i] === '-') {
			this.i++;
		}
		while (this.i < this.n && /[0-9]/.test(this.text[this.i])) {
			this.i++;
		}
		if (this.i < this.n && this.text[this.i] === '.') {
			this.i++;
			while (this.i < this.n && /[0-9]/.test(this.text[this.i])) {
				this.i++;
			}
		}
		if (this.i < this.n && (this.text[this.i] === 'e' || this.text[this.i] === 'E')) {
			this.i++;
			if (this.i < this.n && (this.text[this.i] === '+' || this.text[this.i] === '-')) {
				this.i++;
			}
			while (this.i < this.n && /[0-9]/.test(this.text[this.i])) {
				this.i++;
			}
		}
		const token = this.text.slice(start, this.i);
		if (Number.isNaN(Number(token))) {
			// 数字被截断或不合法（如单独的 "-"），原样保留
			return { out: token, truncated: true };
		}
		return { out: token, truncated: false };
	}
}

function formatJson(text: string, pretty: boolean): string {
	try {
		// 优先使用标准解析，保证完整 JSON 的行为完全一致
		return JSON.stringify(JSON.parse(text), null, pretty ? 2 : undefined);
	} catch {
		// 标准解析失败，尝试容错格式化（处理被截断的 JSON，保留残缺尾部）
		return new LenientJsonFormatter(text, pretty).format();
	}
}

export const jsonTransformers: Transformer[] = [
	{
		id: 'jsonFormat',
		title: 'JSON Format',
		transform: (text) => formatJson(text, true),
	},
	{
		id: 'jsonMinify',
		title: 'JSON Minify',
		transform: (text) => formatJson(text, false),
	},
];
