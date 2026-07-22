/**
 * 文本类型检测器
 * 用于智能识别文本类型，为 Quick Pick 提供排序依据
 */

import * as vscode from 'vscode';

export interface DetectionResult {
	type: string;
	confidence: number; // 0-1，置信度
	description: string;
}

// Base64 检测
function isBase64(text: string): DetectionResult | null {
	const trimmed = text.trim();
	// Base64 正则：只包含 A-Za-z0-9+/= 且长度是 4 的倍数（允许末尾 padding）
	const base64Regex = /^[A-Za-z0-9+/]+=*$/;
	
	if (trimmed.length >= 4 && trimmed.length % 4 === 0 && base64Regex.test(trimmed)) {
		// 尝试解码验证
		try {
			const decoded = atob(trimmed);
			// 检查解码后是否为可打印字符
			const printableRatio = decoded.split('').filter(c => {
				const code = c.charCodeAt(0);
				return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
			}).length / decoded.length;
			
			if (printableRatio > 0.8) {
				return {
					type: 'base64',
					confidence: Math.min(0.9, 0.5 + printableRatio * 0.4),
					description: vscode.l10n.t('Detected Base64 encoding')
				};
			}
		} catch {
			// 解码失败，不是有效 base64
		}
	}
	return null;
}

// URL 编码检测
function isUrlEncoded(text: string): DetectionResult | null {
	const trimmed = text.trim();
	// 包含 %XX 格式
	const urlEncodedPattern = /%[0-9A-Fa-f]{2}/g;
	const matches = trimmed.match(urlEncodedPattern);
	
	if (matches && matches.length > 0) {
		const ratio = (matches.length * 3) / trimmed.length;
		return {
			type: 'urlEncoded',
			confidence: Math.min(0.9, 0.4 + ratio),
			description: vscode.l10n.t('Detected URL encoding')
		};
	}
	return null;
}

// JSON 检测
function isJson(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
		(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
		try {
			JSON.parse(trimmed);
			// 检查是否已格式化
			const isFormatted = trimmed.includes('\n');
			return {
				type: isFormatted ? 'jsonFormatted' : 'jsonMinified',
				confidence: 0.95,
				description: isFormatted ? vscode.l10n.t('Detected formatted JSON') : vscode.l10n.t('Detected minified JSON')
			};
		} catch {
			// 可能是无效 JSON，但看起来像
			if (trimmed.includes(':') || trimmed.includes(',')) {
				return {
					type: 'jsonLike',
					confidence: 0.3,
					description: vscode.l10n.t('Possibly JSON')
				};
			}
		}
	}
	return null;
}

// Unicode 转义检测
function isUnicodeEscaped(text: string): DetectionResult | null {
	const trimmed = text.trim();
	// \\uXXXX 格式
	const unicodePattern = /\\u[0-9A-Fa-f]{4}/g;
	const matches = trimmed.match(unicodePattern);
	
	if (matches && matches.length > 0) {
		const ratio = (matches.length * 6) / trimmed.length;
		return {
			type: 'unicodeEscaped',
			confidence: Math.min(0.9, 0.4 + ratio),
			description: vscode.l10n.t('Detected Unicode escape')
		};
	}
	return null;
}

// 时间戳检测
function isTimestamp(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	// 10 位数字（秒级时间戳）
	if (/^\d{10}$/.test(trimmed)) {
		const ts = parseInt(trimmed, 10);
		// 合理的时间戳范围：2000-01-01 到 2100-01-01
		if (ts >= 946684800 && ts <= 4102444800) {
			return {
				type: 'timestampSeconds',
				confidence: 0.85,
				description: vscode.l10n.t('Detected seconds timestamp')
			};
		}
	}
	
	// 13 位数字（毫秒级时间戳）
	if (/^\d{13}$/.test(trimmed)) {
		const ts = parseInt(trimmed, 10);
		if (ts >= 946684800000 && ts <= 4102444800000) {
			return {
				type: 'timestampMillis',
				confidence: 0.85,
				description: vscode.l10n.t('Detected milliseconds timestamp')
			};
		}
	}
	
	return null;
}

// 日期时间格式检测
function isDateTime(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	// 常见日期格式
	const datePatterns = [
		/^\d{4}-\d{2}-\d{2}$/,                          // 2024-01-01
		/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/,      // 2024-01-01 12:00:00
		/^\d{4}\/\d{2}\/\d{2}$/,                        // 2024/01/01
		/^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}$/,    // 2024/01/01 12:00:00
	];
	
	for (const pattern of datePatterns) {
		if (pattern.test(trimmed)) {
			return {
				type: 'dateTime',
				confidence: 0.9,
				description: vscode.l10n.t('Detected date-time')
			};
		}
	}
	
	return null;
}

// IP 地址检测
function isIpAddress(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	// IPv4
	const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
	const match = trimmed.match(ipv4Pattern);
	if (match) {
		const parts = [match[1], match[2], match[3], match[4]].map(Number);
		if (parts.every(p => p >= 0 && p <= 255)) {
			return {
				type: 'ipAddress',
				confidence: 0.95,
				description: vscode.l10n.t('Detected IP address')
			};
		}
	}
	
	return null;
}

// 整数检测（可能是 IP 整数形式）
function isInteger(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	if (/^\d+$/.test(trimmed)) {
		const num = parseInt(trimmed, 10);
		// IP 整数范围：0 到 4294967295
		if (num >= 0 && num <= 4294967295 && trimmed.length <= 10) {
			// 排除时间戳
			if (trimmed.length !== 10 && trimmed.length !== 13) {
				return {
					type: 'integer',
					confidence: 0.5,
					description: vscode.l10n.t('Detected integer')
				};
			}
		}
	}
	
	return null;
}

// Hex 字符串检测（可能是 Protobuf）
function isHexString(text: string): DetectionResult | null {
	const trimmed = text.trim().toLowerCase();
	
	// 纯十六进制字符串，长度为偶数
	if (/^[0-9a-f]+$/.test(trimmed) && trimmed.length >= 4 && trimmed.length % 2 === 0) {
		return {
			type: 'hexString',
			confidence: 0.6,
			description: vscode.l10n.t('Detected hex string')
		};
	}
	
	return null;
}

// 转义字符串检测
function isEscaped(text: string): DetectionResult | null {
	const trimmed = text.trim();
	
	// 包含转义序列
	const escapePatterns = /\\[nrtbf"'\\]/g;
	const matches = trimmed.match(escapePatterns);
	
	if (matches && matches.length > 0) {
		return {
			type: 'escaped',
			confidence: 0.7,
			description: vscode.l10n.t('Detected escape characters')
		};
	}
	
	return null;
}

/**
 * 检测文本类型
 * 返回所有匹配的类型，按置信度排序
 */
export function detectTextType(text: string): DetectionResult[] {
	const detectors = [
		isBase64,
		isUrlEncoded,
		isJson,
		isUnicodeEscaped,
		isTimestamp,
		isDateTime,
		isIpAddress,
		isInteger,
		isHexString,
		isEscaped,
	];
	
	const results: DetectionResult[] = [];
	
	for (const detector of detectors) {
		const result = detector(text);
		if (result) {
			results.push(result);
		}
	}
	
	// 按置信度降序排序
	results.sort((a, b) => b.confidence - a.confidence);
	
	return results;
}

/**
 * 根据检测结果返回推荐的转换命令 ID 列表
 */
export function getRecommendedTransformers(detections: DetectionResult[]): string[] {
	const recommended: string[] = [];
	
	for (const detection of detections) {
		switch (detection.type) {
			case 'base64':
				recommended.push('base64Decode');
				break;
			case 'urlEncoded':
				recommended.push('urlDecode');
				break;
			case 'jsonMinified':
				recommended.push('jsonFormat');
				break;
			case 'jsonFormatted':
				recommended.push('jsonMinify');
				break;
			case 'jsonLike':
				recommended.push('jsonFormat');
				break;
			case 'unicodeEscaped':
				recommended.push('unicodeDecode');
				break;
			case 'timestampSeconds':
			case 'timestampMillis':
				recommended.push('timestampToDate');
				break;
			case 'dateTime':
				recommended.push('dateToTimestamp');
				break;
			case 'ipAddress':
				recommended.push('ipToInt');
				break;
			case 'integer':
				recommended.push('intToIp');
				break;
		case 'hexString':
			recommended.push('hexToAscii');
			recommended.push('hexToProtobuf');
			break;
			case 'escaped':
				recommended.push('unescape');
				break;
		}
	}
	
	return recommended;
}
