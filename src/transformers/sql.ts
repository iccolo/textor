import { Transformer } from '../types';

const keywords = [
	'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'INTO', 'VALUES',
	'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD',
	'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS',
	'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
	'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'BETWEEN', 'LIKE',
	'IN', 'NOT', 'NULL', 'IS', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE',
	'END', 'ASC', 'DESC', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
	'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE', 'CASCADE', 'TRUNCATE',
];

const newLineKeywords = [
	'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
	'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
	'INNER JOIN', 'OUTER JOIN', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
	'DELETE', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
];

function formatSQL(sql: string): string {
	// 移除多余空白
	let formatted = sql.replace(/\s+/g, ' ').trim();

	// 将关键字转为大写
	for (const keyword of keywords) {
		const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
		formatted = formatted.replace(regex, keyword);
	}

	// 在特定关键字前添加换行
	for (const keyword of newLineKeywords) {
		const regex = new RegExp(`\\s+(${keyword})\\b`, 'gi');
		formatted = formatted.replace(regex, `\n$1`);
	}

	// 处理逗号后的换行（在 SELECT 字段列表中）
	formatted = formatted.replace(/,\s*/g, ',\n  ');

	// 处理括号
	formatted = formatted.replace(/\(\s*/g, '(\n  ');
	formatted = formatted.replace(/\s*\)/g, '\n)');

	// 清理多余的空行
	formatted = formatted.replace(/\n\s*\n/g, '\n');

	// 添加缩进
	const lines = formatted.split('\n');
	let indent = 0;
	const result: string[] = [];

	for (let line of lines) {
		line = line.trim();
		if (!line) {
			continue;
		}

		// 减少缩进的关键字
		if (line.startsWith(')')) {
			indent = Math.max(0, indent - 1);
		}

		result.push('  '.repeat(indent) + line);

		// 增加缩进的关键字
		if (line.endsWith('(')) {
			indent++;
		}
	}

	return result.join('\n');
}

function minifySQL(sql: string): string {
	// 移除注释
	let minified = sql
		.replace(/--.*$/gm, '') // 单行注释
		.replace(/\/\*[\s\S]*?\*\//g, ''); // 多行注释

	// 将所有空白字符替换为单个空格
	minified = minified.replace(/\s+/g, ' ').trim();

	// 移除逗号、括号周围的多余空格
	minified = minified.replace(/\s*,\s*/g, ',');
	minified = minified.replace(/\s*\(\s*/g, '(');
	minified = minified.replace(/\s*\)\s*/g, ')');

	// 移除运算符周围的多余空格
	minified = minified.replace(/\s*=\s*/g, '=');
	minified = minified.replace(/\s*<>\s*/g, '<>');
	minified = minified.replace(/\s*!=\s*/g, '!=');
	minified = minified.replace(/\s*>=\s*/g, '>=');
	minified = minified.replace(/\s*<=\s*/g, '<=');

	return minified;
}

export const sqlTransformers: Transformer[] = [
	{
		id: 'sqlFormat',
		title: 'SQL Format',
		transform: (text) => formatSQL(text),
	},
	{
		id: 'sqlMinify',
		title: 'SQL Minify',
		transform: (text) => minifySQL(text),
	},
];
