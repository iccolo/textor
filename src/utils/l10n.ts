import * as vscode from 'vscode';

/**
 * 收集 Webview（侧边栏面板与工具面板）需要用到的本地化文案。
 *
 * 默认走英文（源字符串即默认值），当 IDE 显示语言为中文时，
 * VSCode 会根据 l10n/bundle.l10n.zh-cn.json 自动替换为中文。
 *
 * 返回的对象会被序列化后注入 Webview，供 HTML 与页面内脚本使用。
 */
export function getWebviewL10n() {
	return {
		lang: vscode.env.language,

		// 时间工具
		timeTools: vscode.l10n.t('Time Tools'),
		timeString: vscode.l10n.t('Time string'),
		timestamp: vscode.l10n.t('Timestamp'),
		timePlaceholder: vscode.l10n.t('e.g. 2025-01-10 12:00:00'),
		timestampPlaceholder: vscode.l10n.t('e.g. 1736481600'),
		setCurrentTime: vscode.l10n.t('Current Time'),

		// 密码生成器
		passwordGenerator: vscode.l10n.t('Password Generator'),
		length: vscode.l10n.t('Length'),
		lowercase: vscode.l10n.t('Lowercase'),
		uppercase: vscode.l10n.t('Uppercase'),
		numbers: vscode.l10n.t('Numbers'),
		symbols: vscode.l10n.t('Symbols'),
		password: vscode.l10n.t('Password'),
		generatePassword: vscode.l10n.t('Generate Password'),

		// UUID 生成器
		uuidGenerator: vscode.l10n.t('UUID Generator'),
		format: vscode.l10n.t('Format'),
		uuid: vscode.l10n.t('UUID'),
		generateUuid: vscode.l10n.t('Generate UUID'),
		uuidStandard: vscode.l10n.t('Standard (with hyphens)'),
		uuidNoHyphen: vscode.l10n.t('No hyphens'),
		uuidBraces: vscode.l10n.t('With braces'),

		// HMAC-SHA256
		hmacSha256: vscode.l10n.t('HMAC-SHA256'),
		key: vscode.l10n.t('Key'),
		message: vscode.l10n.t('Message'),
		enterKey: vscode.l10n.t('Enter key'),
		enterMessage: vscode.l10n.t('Enter message to hash'),
		compute: vscode.l10n.t('Compute'),

		// 通用按钮
		copy: vscode.l10n.t('Copy'),
		insert: vscode.l10n.t('Insert'),
		generate: vscode.l10n.t('Generate'),
		refresh: vscode.l10n.t('Refresh'),

		// 页面脚本内动态显示
		invalidTimeFormat: vscode.l10n.t('Invalid time format'),
		invalidTimestamp: vscode.l10n.t('Invalid timestamp'),
		selectAtLeastOne: vscode.l10n.t('Please select at least one character type'),
		passwordLengthInsufficient: vscode.l10n.t('Password length is insufficient for selected character types'),
		passwordLengthTooShort: vscode.l10n.t('Password length is too short'),
		enterKeyMsg: vscode.l10n.t('Please enter a key'),
		enterMessageMsg: vscode.l10n.t('Please enter a message'),
		computationFailed: vscode.l10n.t('Computation failed: '),
	};
}

export type WebviewL10n = ReturnType<typeof getWebviewL10n>;
