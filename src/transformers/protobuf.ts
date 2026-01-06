import { Transformer } from '../types';

interface DecodedField {
	fieldNumber: number;
	wireType: number;
	value: string | number | bigint | DecodedField[];
}

interface DecodeResult {
	fields: DecodedField[];
	error?: string;
}

function hexToBytes(hex: string): Uint8Array {
	// 移除空格、换行、0x前缀等
	const cleanHex = hex.replace(/[\s\n\r]/g, '').replace(/0x/gi, '');
	if (cleanHex.length % 2 !== 0) {
		throw new Error('十六进制字符串长度必须为偶数');
	}
	if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
		throw new Error('包含无效的十六进制字符');
	}
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array, start: number, length: number): string {
	let hex = '';
	for (let i = start; i < start + length && i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return hex;
}

class ProtobufDecoder {
	private data: Uint8Array;
	private offset: number = 0;
	private fields: DecodedField[] = [];
	private error?: string;

	constructor(data: Uint8Array) {
		this.data = data;
	}

	decode(): DecodeResult {
		try {
			while (this.offset < this.data.length) {
				const field = this.decodeField();
				if (field) {
					this.fields.push(field);
				}
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}

		return {
			fields: this.fields,
			error: this.error,
		};
	}

	private decodeField(): DecodedField | null {
		if (this.offset >= this.data.length) {
			return null;
		}

		const tag = this.decodeVarint();
		const fieldNumber = Number(tag >> 3n);
		const wireType = Number(tag & 0x7n);

		if (fieldNumber === 0) {
			throw new Error(`字段编号不能为 0`);
		}

		if (wireType > 5) {
			throw new Error(`无效的 wire type: ${wireType}`);
		}

		let value: string | number | bigint | DecodedField[];

		switch (wireType) {
			case 0: // Varint
				value = this.decodeVarint();
				break;

			case 1: // 64-bit (fixed64, sfixed64, double)
				if (this.offset + 8 > this.data.length) {
					throw new Error(`读取 FIXED64 时数据不足`);
				}
				value = this.decodeFixed64();
				break;

			case 2: { // Length-delimited (string, bytes, embedded messages, packed repeated fields)
				const length = Number(this.decodeVarint());
				if (this.offset + length > this.data.length) {
					throw new Error(`长度 ${length} 超出数据范围`);
				}
				const bytes = this.data.slice(this.offset, this.offset + length);
				const raw = bytesToHex(this.data, this.offset, length);
				this.offset += length;

				// 尝试解析为嵌套消息
				const nested = this.tryDecodeAsMessage(bytes);
				if (nested) {
					value = nested;
				} else {
					// 尝试解析为字符串
					const str = this.tryDecodeAsString(bytes);
					if (str !== null) {
						value = str;
					} else {
						value = `0x${raw}`;
					}
				}
				break;
			}

			case 3: // Start group (deprecated)
			case 4: // End group (deprecated)
				throw new Error(`不支持已废弃的 wire type`);

			case 5: // 32-bit (fixed32, sfixed32, float)
				if (this.offset + 4 > this.data.length) {
					throw new Error(`读取 FIXED32 时数据不足`);
				}
				value = this.decodeFixed32();
				break;

			default:
				throw new Error(`未知的 wire type: ${wireType}`);
		}

		return {
			fieldNumber,
			wireType,
			value,
		};
	}

	private decodeVarint(): bigint {
		let result = 0n;
		let shift = 0n;

		while (this.offset < this.data.length) {
			const byte = this.data[this.offset++];
			result |= BigInt(byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) {
				return result;
			}
			shift += 7n;
			if (shift > 63n) {
				throw new Error(`Varint 超过 64 位`);
			}
		}

		throw new Error(`Varint 未正确终止`);
	}

	private decodeFixed32(): number {
		const value = 
			this.data[this.offset] |
			(this.data[this.offset + 1] << 8) |
			(this.data[this.offset + 2] << 16) |
			(this.data[this.offset + 3] << 24);
		this.offset += 4;
		return value >>> 0; // 转为无符号
	}

	private decodeFixed64(): bigint {
		const low = BigInt(this.decodeFixed32());
		const high = BigInt(this.decodeFixed32());
		return (high << 32n) | low;
	}

	private tryDecodeAsMessage(bytes: Uint8Array): DecodedField[] | null {
		if (bytes.length === 0) {
			return null;
		}

		try {
			const decoder = new ProtobufDecoder(bytes);
			const result = decoder.decode();
			
			// 如果解析成功且有字段，认为是嵌套消息
			if (!result.error && result.fields.length > 0) {
				// 额外验证：检查字段编号是否合理
				for (const field of result.fields) {
					if (field.fieldNumber > 536870911) { // 2^29 - 1
						return null;
					}
				}
				return result.fields;
			}
		} catch {
			// 解析失败，不是嵌套消息
		}

		return null;
	}

	private tryDecodeAsString(bytes: Uint8Array): string | null {
		// 检查是否为有效的 UTF-8 字符串
		try {
			const decoder = new TextDecoder('utf-8', { fatal: true });
			const str = decoder.decode(bytes);
			
			// 检查是否包含不可打印字符（除了常见的空白字符）
			if (/^[\x20-\x7E\t\n\r\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]*$/.test(str)) {
				return `"${str}"`;
			}
		} catch {
			// 不是有效的 UTF-8
		}

		return null;
	}
}

function formatOutput(result: DecodeResult, indent: number = 0): string {
	const lines: string[] = [];
	const prefix = '  '.repeat(indent);

	for (const field of result.fields) {
		if (Array.isArray(field.value)) {
			// 嵌套消息：字段号后换行，子字段缩进
			lines.push(`${prefix}${field.fieldNumber}:`);
			const nestedOutput = formatOutput({ fields: field.value }, indent + 1);
			if (nestedOutput) {
				lines.push(nestedOutput);
			}
		} else if (typeof field.value === 'bigint') {
			lines.push(`${prefix}${field.fieldNumber}: ${field.value}`);
		} else {
			lines.push(`${prefix}${field.fieldNumber}: ${field.value}`);
		}
	}

	if (result.error) {
		lines.push('');
		lines.push(`${prefix}[错误] ${result.error}`);
	}

	return lines.join('\n');
}

// ============ Protobuf Encoder ============

interface ParsedField {
	fieldNumber: number;
	value: string | number | bigint | ParsedField[];
}

function getIndentLevel(line: string): number {
	const match = line.match(/^(\s*)/);
	return match ? match[1].length : 0;
}

function parseProtobufText(text: string, baseIndent: number = 0): ParsedField[] {
	const fields: ParsedField[] = [];
	const lines = text.split('\n');
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const trimmedLine = line.trim();
		
		if (!trimmedLine || trimmedLine.startsWith('[')) {
			i++;
			continue;
		}

		const currentIndent = getIndentLevel(line);
		
		// 跳过缩进小于基准的行（属于上层）
		if (currentIndent < baseIndent) {
			break;
		}
		
		// 跳过缩进大于基准的行（属于子级，会被递归处理）
		if (currentIndent > baseIndent) {
			i++;
			continue;
		}

		// 匹配 "fieldNumber: value" 或 "fieldNumber:" 格式
		const match = trimmedLine.match(/^(\d+):\s*(.*)$/);
		if (!match) {
			i++;
			continue;
		}

		const fieldNumber = parseInt(match[1], 10);
		const valueStr = match[2].trim();

		if (valueStr === '') {
			// 嵌套消息：收集后续缩进更深的行
			const nestedLines: string[] = [];
			const nestedIndent = baseIndent + 2; // 期望的子级缩进
			i++;
			
			while (i < lines.length) {
				const nextLine = lines[i];
				const nextTrimmed = nextLine.trim();
				
				if (!nextTrimmed) {
					i++;
					continue;
				}
				
				const nextIndent = getIndentLevel(nextLine);
				if (nextIndent < nestedIndent) {
					break;
				}
				
				nestedLines.push(nextLine);
				i++;
			}
			
			fields.push({
				fieldNumber,
				value: parseProtobufText(nestedLines.join('\n'), nestedIndent),
			});
		} else {
			// 普通值
			fields.push({
				fieldNumber,
				value: parseValue(valueStr),
			});
			i++;
		}
	}

	return fields;
}

function parseValue(valueStr: string): string | number | bigint {
	valueStr = valueStr.trim();

	// 字符串 "..."
	if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
		return valueStr.slice(1, -1);
	}

	// bytes 0x...
	if (valueStr.startsWith('0x')) {
		return valueStr; // 保持原样，编码时处理
	}

	// 数字
	if (/^-?\d+$/.test(valueStr)) {
		const num = BigInt(valueStr);
		if (num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER) {
			return Number(num);
		}
		return num;
	}

	// 其他当作字符串
	return valueStr;
}

function encodeVarint(value: bigint): number[] {
	const bytes: number[] = [];
	let v = value < 0n ? value + 0x10000000000000000n : value; // 处理负数
	while (v > 0x7fn) {
		bytes.push(Number(v & 0x7fn) | 0x80);
		v >>= 7n;
	}
	bytes.push(Number(v));
	return bytes;
}

function encodeField(field: ParsedField): number[] {
	const bytes: number[] = [];
	const fieldNumber = field.fieldNumber;

	if (Array.isArray(field.value)) {
		// 嵌套消息 - wireType 2
		const tag = (fieldNumber << 3) | 2;
		bytes.push(...encodeVarint(BigInt(tag)));

		const nestedBytes: number[] = [];
		for (const nestedField of field.value) {
			nestedBytes.push(...encodeField(nestedField));
		}
		bytes.push(...encodeVarint(BigInt(nestedBytes.length)));
		bytes.push(...nestedBytes);
	} else if (typeof field.value === 'string') {
		if (field.value.startsWith('0x')) {
			// bytes - wireType 2
			const tag = (fieldNumber << 3) | 2;
			bytes.push(...encodeVarint(BigInt(tag)));

			const hexStr = field.value.slice(2);
			const byteArray = hexToBytes(hexStr);
			bytes.push(...encodeVarint(BigInt(byteArray.length)));
			bytes.push(...Array.from(byteArray));
		} else {
			// string - wireType 2
			const tag = (fieldNumber << 3) | 2;
			bytes.push(...encodeVarint(BigInt(tag)));

			const encoder = new TextEncoder();
			const strBytes = encoder.encode(field.value);
			bytes.push(...encodeVarint(BigInt(strBytes.length)));
			bytes.push(...Array.from(strBytes));
		}
	} else {
		// 数字 - wireType 0 (varint)
		const tag = (fieldNumber << 3) | 0;
		bytes.push(...encodeVarint(BigInt(tag)));

		const value = typeof field.value === 'bigint' ? field.value : BigInt(field.value);
		bytes.push(...encodeVarint(value));
	}

	return bytes;
}

function encodeProtobuf(fields: ParsedField[]): Uint8Array {
	const bytes: number[] = [];
	for (const field of fields) {
		bytes.push(...encodeField(field));
	}
	return new Uint8Array(bytes);
}

// ============ Protobuf Format ============

interface ProtoLine {
	indent: number;
	content: string;
	beforeEquals: string;  // 等号前的部分
	afterEquals: string;   // 等号后、注释前的部分
	comment: string;       // 注释部分
	isField: boolean;      // 是否是字段定义行
	isBlockStart: boolean; // message/enum/service 开始
	isBlockEnd: boolean;   // } 结束
	isEmpty: boolean;
}

function parseProtoLine(line: string, indentLevel: number): ProtoLine {
	const trimmed = line.trim();
	const indentStr = '  ';
	
	if (!trimmed) {
		return {
			indent: indentLevel,
			content: '',
			beforeEquals: '',
			afterEquals: '',
			comment: '',
			isField: false,
			isBlockStart: false,
			isBlockEnd: trimmed === '}',
			isEmpty: true,
		};
	}

	const isBlockStart = /^(message|enum|service|oneof|extend|rpc)\s+/.test(trimmed);
	const isBlockEnd = trimmed.startsWith('}');
	
	// 检查是否是字段定义行（包含 = 和 ; 的行，如 int32 id = 1;）
	const fieldMatch = trimmed.match(/^(.+?)\s*=\s*(\d+[^;]*);(\s*\/\/.*)?$/);
	
	if (fieldMatch) {
		let comment = fieldMatch[3] ? fieldMatch[3].trim() : '';
		// 规范化注释格式：// 与内容之间必须空一格
		if (comment && comment.startsWith('//')) {
			const commentContent = comment.slice(2).trim();
			comment = commentContent ? `// ${commentContent}` : '//';
		}
		return {
			indent: indentLevel,
			content: trimmed,
			beforeEquals: fieldMatch[1].trim(),
			afterEquals: fieldMatch[2].trim(),
			comment,
			isField: true,
			isBlockStart: false,
			isBlockEnd: false,
			isEmpty: false,
		};
	}

	// 检查是否有行尾注释（非字段行）
	const commentMatch = trimmed.match(/^(.+?)\s*(\/\/.*)$/);
	
	let comment = commentMatch ? commentMatch[2] : '';
	// 规范化注释格式：// 与内容之间必须空一格
	if (comment && comment.startsWith('//')) {
		const commentContent = comment.slice(2).trim();
		comment = commentContent ? `// ${commentContent}` : '//';
	}
	
	return {
		indent: indentLevel,
		content: trimmed,
		beforeEquals: commentMatch ? commentMatch[1] : trimmed,
		afterEquals: '',
		comment,
		isField: false,
		isBlockStart,
		isBlockEnd,
		isEmpty: false,
	};
}

function formatProtoContent(text: string): string {
	const lines = text.split('\n');
	const parsedLines: ProtoLine[] = [];
	let indentLevel = 0;
	const indentStr = '  ';

	// 第一遍：解析所有行并计算缩进
	for (const line of lines) {
		const trimmed = line.trim();
		
		// 处理闭合括号 - 先减少缩进
		if (trimmed.startsWith('}')) {
			indentLevel = Math.max(0, indentLevel - 1);
		}

		const parsed = parseProtoLine(line, indentLevel);
		parsedLines.push(parsed);

		// 处理开括号 - 增加缩进
		if (trimmed.endsWith('{') && !trimmed.startsWith('//')) {
			indentLevel++;
		}
	}

	// 第二遍：按块分组，对齐字段
	const result: string[] = [];
	let i = 0;

	while (i < parsedLines.length) {
		const line = parsedLines[i];

		if (line.isEmpty) {
			result.push('');
			i++;
			continue;
		}

		if (!line.isField) {
			// 非字段行直接输出
			let output = indentStr.repeat(line.indent) + line.content;
			result.push(output);
			i++;
			continue;
		}

		// 收集连续的字段行（同一缩进级别）
		const fieldGroup: ProtoLine[] = [];
		const startIndent = line.indent;
		
		while (i < parsedLines.length) {
			const current = parsedLines[i];
			if (current.isEmpty) {
				// 空行中断字段组
				break;
			}
			if (!current.isField || current.indent !== startIndent) {
				break;
			}
			fieldGroup.push(current);
			i++;
		}

		// 计算对齐宽度
		let maxBeforeEquals = 0;
		let maxFieldEnd = 0;  // 等号 + 字段编号 + 分号的总长度
		
		for (const f of fieldGroup) {
			maxBeforeEquals = Math.max(maxBeforeEquals, f.beforeEquals.length);
			// 计算 " = xxx;" 的长度用于注释对齐
			const fieldEndLen = 3 + f.afterEquals.length + 1; // " = " + afterEquals + ";"
			maxFieldEnd = Math.max(maxFieldEnd, fieldEndLen);
		}

		// 输出对齐后的字段
		for (const f of fieldGroup) {
			const prefix = indentStr.repeat(f.indent);
			const paddedBefore = f.beforeEquals.padEnd(maxBeforeEquals);
			
			// 分号紧跟字段编号，不留空格
			const fieldPart = `${prefix}${paddedBefore} = ${f.afterEquals};`;
			
			if (f.comment) {
				// 计算需要填充的空格数以对齐注释（分号后2格起）
				const currentFieldEnd = 3 + f.afterEquals.length + 1;
				const padding = maxFieldEnd - currentFieldEnd + 2; // +2 保证至少2格
				result.push(fieldPart + ' '.repeat(padding) + f.comment);
			} else {
				result.push(fieldPart);
			}
		}
	}

	// 第三遍：规范化 message/enum/service 之间的空行为1行
	const finalResult: string[] = [];
	let prevWasBlockEnd = false;
	let emptyLineCount = 0;

	for (let j = 0; j < result.length; j++) {
		const line = result[j];
		const trimmed = line.trim();
		const isBlockStart = /^(message|enum|service|extend)\s+/.test(trimmed);
		const isBlockEnd = trimmed === '}';
		const isEmpty = trimmed === '';

		if (isEmpty) {
			emptyLineCount++;
			continue;
		}

		// 在块结束后、新块开始前，插入恰好1个空行
		if (prevWasBlockEnd && isBlockStart) {
			finalResult.push('');
		} else if (emptyLineCount > 0 && finalResult.length > 0) {
			// 其他情况保留最多1个空行
			finalResult.push('');
		}

		finalResult.push(line);
		prevWasBlockEnd = isBlockEnd;
		emptyLineCount = 0;
	}

	return finalResult.join('\n');
}

export const protobufTransformers: Transformer[] = [
	{
		id: 'hexToProtobuf',
		title: 'Hex to Protobuf',
		transform: (text) => {
			const bytes = hexToBytes(text);
			const decoder = new ProtobufDecoder(bytes);
			const result = decoder.decode();
			
			if (result.fields.length === 0 && result.error) {
				throw new Error(result.error);
			}

			return formatOutput(result);
		},
	},
	{
		id: 'protobufToHex',
		title: 'Protobuf to Hex',
		transform: (text) => {
			const fields = parseProtobufText(text);
			if (fields.length === 0) {
				throw new Error('未找到有效的 protobuf 字段');
			}
			const bytes = encodeProtobuf(fields);
			let hex = '';
			for (const byte of bytes) {
				hex += byte.toString(16).padStart(2, '0');
			}
			return hex;
		},
	},
	{
		id: 'protoFormat',
		title: 'Proto Format',
		transform: (text) => {
			return formatProtoContent(text);
		},
	},
];
