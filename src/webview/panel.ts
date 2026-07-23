import * as vscode from 'vscode';
import { getWebviewL10n } from '../utils/l10n';
import { getWebviewAssets } from './assets';

export class TextorPanel {
	public static currentPanel: TextorPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _context: vscode.ExtensionContext;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._context = context;

		// 获取保存的设置
		const savedSettings = this._context.globalState.get<Record<string, unknown>>('textorPanelSettings', {});
		this._panel.webview.html = this._getHtmlContent(savedSettings);

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'copy':
						await vscode.env.clipboard.writeText(message.text);
						vscode.window.showInformationMessage(vscode.l10n.t('Copied to clipboard'));
						break;
					case 'insert':
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							await editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, message.text);
							});
						}
						break;
					case 'saveSettings':
						await this._context.globalState.update('textorPanelSettings', message.settings);
						break;
				}
			},
			null,
			this._disposables
		);
	}

	public static show(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (TextorPanel.currentPanel) {
			TextorPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'textorPanel',
			'Textor Tools',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri],
			}
		);

		TextorPanel.currentPanel = new TextorPanel(panel, extensionUri, context);
	}

	public dispose() {
		TextorPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _getHtmlContent(savedSettings: Record<string, unknown>): string {
		const settingsJson = JSON.stringify(savedSettings);
		const t = getWebviewL10n();
		const assets = getWebviewAssets(this._panel.webview, this._extensionUri);
		return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Textor Tools</title>
	<link href="${assets.codiconsCss}" rel="stylesheet">
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			padding: 20px;
		}
		h1 {
			font-size: 1.5em;
			margin-bottom: 20px;
			color: var(--vscode-titleBar-activeForeground);
		}
		.section {
			margin-bottom: 24px;
			padding: 16px;
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border-radius: 6px;
		}
		.section-title {
			font-size: 1.1em;
			font-weight: bold;
			margin-bottom: 12px;
			color: var(--vscode-textLink-foreground);
		}
		.row {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 10px;
		}
		.row:last-child {
			margin-bottom: 0;
		}
		label {
			min-width: 80px;
		}
		input, select {
			flex: 1;
			padding: 6px 10px;
			border: 1px solid var(--vscode-input-border);
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border-radius: 4px;
			font-family: var(--vscode-editor-font-family);
		}
		input:focus, select:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}
		input[readonly] {
			background-color: var(--vscode-editor-background);
		}
		button {
			padding: 6px 14px;
			border: none;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
		}
		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		button.secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}
		button.secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}
		.result {
			width: 100%;
			font-family: var(--vscode-editor-font-family);
			padding: 8px 12px;
			background-color: var(--vscode-editor-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-size: 13px;
			box-sizing: border-box;
			cursor: text;
			outline: none;
		}
		.btn-group {
			display: flex;
			gap: 8px;
		}
		.input-with-suffix {
			position: relative;
			flex: 1;
			display: flex;
			align-items: center;
		}
		.input-with-suffix input {
			width: 100%;
			padding: 6px 72px 6px 10px;
			flex: none;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: clip;
		}
		.input-actions {
			position: absolute;
			right: 4px;
			top: 0;
			height: 100%;
			display: flex;
			align-items: center;
			gap: 2px;
		}
		.input-actions .icon-btn {
			background: transparent;
			border: none;
			color: var(--vscode-foreground);
			padding: 2px 4px;
			font-size: 14px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 3px;
		}
		.input-actions .icon-btn:hover {
			background-color: var(--vscode-toolbar-hoverBackground, var(--vscode-list-hoverBackground));
		}
		.result-with-suffix {
			position: relative;
			flex: 1;
			display: flex;
			align-items: center;
		}
		.result-with-suffix .result {
			padding: 8px 48px 8px 12px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: clip;
		}
		.result-actions {
			position: absolute;
			right: 4px;
			top: 0;
			height: 100%;
			display: flex;
			align-items: center;
			gap: 2px;
		}
		.result-actions .icon-btn {
			background: transparent;
			border: none;
			color: var(--vscode-foreground);
			padding: 2px 4px;
			font-size: 14px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 3px;
		}
		.result-actions .icon-btn:hover {
			background-color: var(--vscode-toolbar-hoverBackground, var(--vscode-list-hoverBackground));
		}
	</style>
</head>
<body>
	<h1>Textor Tools</h1>

	<!-- 时间工具 -->
	<div class="section">
		<div class="section-title">${t.timeTools}</div>
		<div class="row">
			<label>${t.timeString}:</label>
			<div class="input-with-suffix">
				<input type="text" id="timeInput" placeholder="${t.timePlaceholder}" oninput="onTimeInput()">
				<div class="input-actions">
					<button class="icon-btn" onclick="setCurrentTime()" title="${t.refresh}"><i class="codicon codicon-refresh"></i></button>
				<button class="icon-btn" onclick="copyValue('timeInput')" title="${t.copy}"><i class="codicon codicon-copy"></i></button>
				</div>
			</div>
		</div>
		<div class="row">
			<label>${t.timestamp}:</label>
			<div class="input-with-suffix">
				<input type="text" id="timestampInput" placeholder="${t.timestampPlaceholder}" oninput="onTimestampInput()">
				<div class="input-actions">
					<button class="icon-btn" onclick="setCurrentTime()" title="${t.refresh}"><i class="codicon codicon-refresh"></i></button>
				<button class="icon-btn" onclick="copyValue('timestampInput')" title="${t.copy}"><i class="codicon codicon-copy"></i></button>
				</div>
			</div>
		</div>
	</div>

	<!-- 密码生成器 -->
	<div class="section">
		<div class="section-title">${t.passwordGenerator}</div>
		<div class="row">
			<label>${t.length}:</label>
			<input type="number" id="passwordLength" value="16" min="4" max="128" style="max-width: 80px;" onchange="saveSettings()">
			<label style="min-width: auto;">
				<input type="checkbox" id="includeLower" checked onchange="saveSettings()"> ${t.lowercase}
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeUpper" checked onchange="saveSettings()"> ${t.uppercase}
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeNumber" checked onchange="saveSettings()"> ${t.numbers}
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeSymbol" checked onchange="saveSettings()"> ${t.symbols}
			</label>
		</div>
		<div class="row">
			<label>${t.password}:</label>
			<div class="result-with-suffix">
				<input type="text" readonly class="result" id="generatedPassword" value="-">
				<div class="result-actions">
				<button class="icon-btn" onclick="copyText('generatedPassword')" title="${t.copy}"><i class="codicon codicon-copy"></i></button>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="btn-group">
				<button onclick="generatePassword()">${t.generatePassword}</button>
			</div>
		</div>
	</div>

	<!-- UUID 生成器 -->
	<div class="section">
		<div class="section-title">${t.uuidGenerator}</div>
		<div class="row">
			<label>${t.format}:</label>
			<select id="uuidFormat" style="max-width: 200px;" onchange="saveSettings()">
				<option value="standard">${t.uuidStandard}</option>
				<option value="nohyphen">${t.uuidNoHyphen}</option>
				<option value="uppercase">${t.uppercase}</option>
				<option value="braces">${t.uuidBraces}</option>
			</select>
		</div>
		<div class="row">
			<label>${t.uuid}:</label>
			<div class="result-with-suffix">
				<input type="text" readonly class="result" id="generatedUuid" value="-">
				<div class="result-actions">
				<button class="icon-btn" onclick="copyText('generatedUuid')" title="${t.copy}"><i class="codicon codicon-copy"></i></button>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="btn-group">
				<button onclick="generateUuid()">${t.generateUuid}</button>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const L = ${JSON.stringify(t)};

		// 从扩展传入的初始设置
		let savedSettings = ${settingsJson};

		// 保存设置
		function saveSettings() {
			const settings = {
				passwordLength: parseInt(document.getElementById('passwordLength').value) || 16,
				includeLower: document.getElementById('includeLower').checked,
				includeUpper: document.getElementById('includeUpper').checked,
				includeNumber: document.getElementById('includeNumber').checked,
				includeSymbol: document.getElementById('includeSymbol').checked,
				uuidFormat: document.getElementById('uuidFormat').value
			};
			vscode.postMessage({ command: 'saveSettings', settings: settings });
			vscode.setState(settings);
		}

		// 恢复设置
		function restoreSettings() {
			const state = vscode.getState();
			if (state) {
				savedSettings = state;
			}

			if (savedSettings.passwordLength) {
				document.getElementById('passwordLength').value = savedSettings.passwordLength;
			}
			if (savedSettings.includeLower !== undefined) {
				document.getElementById('includeLower').checked = savedSettings.includeLower;
			}
			if (savedSettings.includeUpper !== undefined) {
				document.getElementById('includeUpper').checked = savedSettings.includeUpper;
			}
			if (savedSettings.includeNumber !== undefined) {
				document.getElementById('includeNumber').checked = savedSettings.includeNumber;
			}
			if (savedSettings.includeSymbol !== undefined) {
				document.getElementById('includeSymbol').checked = savedSettings.includeSymbol;
			}
			if (savedSettings.uuidFormat) {
				document.getElementById('uuidFormat').value = savedSettings.uuidFormat;
			}
		}

		function formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			const seconds = String(date.getSeconds()).padStart(2, '0');
			return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
		}

		function setCurrentTime() {
			const now = new Date();
			document.getElementById('timeInput').value = formatDate(now);
			document.getElementById('timestampInput').value = Math.floor(now.getTime() / 1000);
		}

		function convertToTimestamp() {
			const timeStr = document.getElementById('timeInput').value.trim();
			if (!timeStr) {
				return;
			}
			try {
				const date = new Date(timeStr.replace(/-/g, '/'));
				if (isNaN(date.getTime())) {
					document.getElementById('timestampInput').value = L.invalidTimeFormat;
					return;
				}
				document.getElementById('timestampInput').value = Math.floor(date.getTime() / 1000);
			} catch (e) {
				document.getElementById('timestampInput').value = L.invalidTimeFormat;
			}
		}

		function convertToTime() {
			const tsStr = document.getElementById('timestampInput').value.trim();
			if (!tsStr) {
				return;
			}
			try {
				let ts = parseInt(tsStr, 10);
				if (isNaN(ts)) {
					document.getElementById('timeInput').value = L.invalidTimestamp;
					return;
				}
				// 自动判断秒级或毫秒级
				if (ts > 9999999999) {
					// 毫秒级
				} else {
					ts = ts * 1000;
				}
				const date = new Date(ts);
				if (isNaN(date.getTime())) {
					document.getElementById('timeInput').value = L.invalidTimestamp;
					return;
				}
				document.getElementById('timeInput').value = formatDate(date);
			} catch (e) {
				document.getElementById('timeInput').value = L.invalidTimestamp;
			}
		}

		let isUpdating = false;

		function onTimeInput() {
			if (isUpdating) { return; }
			isUpdating = true;
			convertToTimestamp();
			isUpdating = false;
		}

		function onTimestampInput() {
			if (isUpdating) { return; }
			isUpdating = true;
			convertToTime();
			isUpdating = false;
		}

		function copyValue(elementId) {
			const text = document.getElementById(elementId).value;
			if (text) {
				vscode.postMessage({ command: 'copy', text: text });
			}
		}

		function generatePassword() {
			const length = parseInt(document.getElementById('passwordLength').value) || 16;
			const includeLower = document.getElementById('includeLower').checked;
			const includeUpper = document.getElementById('includeUpper').checked;
			const includeNumber = document.getElementById('includeNumber').checked;
			const includeSymbol = document.getElementById('includeSymbol').checked;

			const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
			const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const numberChars = '0123456789';
			const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

			let allChars = '';
			const requiredChars = [];

			if (includeLower) {
				allChars += lowerChars;
				requiredChars.push(lowerChars);
			}
			if (includeUpper) {
				allChars += upperChars;
				requiredChars.push(upperChars);
			}
			if (includeNumber) {
				allChars += numberChars;
				requiredChars.push(numberChars);
			}
			if (includeSymbol) {
				allChars += symbolChars;
				requiredChars.push(symbolChars);
			}

			if (!allChars) {
				document.getElementById('generatedPassword').value = L.selectAtLeastOne;
				return;
			}

			if (length < requiredChars.length) {
				document.getElementById('generatedPassword').value = L.passwordLengthInsufficient;
				return;
			}

			// 生成密码：先确保每种类型至少一个
			let password = [];
			const array = new Uint32Array(length + requiredChars.length);
			crypto.getRandomValues(array);

			// 判断是否需要首字符为字母
			const letterChars = (includeLower ? lowerChars : '') + (includeUpper ? upperChars : '');

			// 每种必选类型随机取一个
			for (let i = 0; i < requiredChars.length; i++) {
				const charSet = requiredChars[i];
				password.push(charSet[array[i] % charSet.length]);
			}

			// 剩余位置从所有字符中随机
			for (let i = requiredChars.length; i < length; i++) {
				password.push(allChars[array[i] % allChars.length]);
			}

			// 打乱顺序（如果需要首字符为字母，则从索引1开始打乱）
			const shuffleStart = letterChars ? 1 : 0;
			for (let i = password.length - 1; i > shuffleStart; i--) {
				const j = shuffleStart + (array[length + i] % (i - shuffleStart + 1));
				[password[i], password[j]] = [password[j], password[i]];
			}

			// 确保首字符为字母
			if (letterChars) {
				password[0] = letterChars[array[length] % letterChars.length];
			}

			document.getElementById('generatedPassword').value = password.join('');
		}

		function generateUuid() {
			const format = document.getElementById('uuidFormat').value;
			let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				const r = Math.random() * 16 | 0;
				const v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});

			switch (format) {
				case 'nohyphen':
					uuid = uuid.replace(/-/g, '');
					break;
				case 'uppercase':
					uuid = uuid.toUpperCase();
					break;
				case 'braces':
					uuid = '{' + uuid + '}';
					break;
			}

			document.getElementById('generatedUuid').value = uuid;
		}

		function copyText(elementId) {
			const text = document.getElementById(elementId).value;
			if (text && text !== '-') {
				vscode.postMessage({ command: 'copy', text: text });
			}
		}

		// 初始化
		restoreSettings();
		setCurrentTime();
		generatePassword();
		generateUuid();
	</script>
</body>
</html>`;
	}
}
