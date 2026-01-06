import * as vscode from 'vscode';

export class TextorPanel {
	public static currentPanel: TextorPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._panel.webview.html = this._getHtmlContent();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'copy':
						await vscode.env.clipboard.writeText(message.text);
						vscode.window.showInformationMessage('已复制到剪贴板');
						break;
					case 'insert':
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							await editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, message.text);
							});
						}
						break;
				}
			},
			null,
			this._disposables
		);
	}

	public static show(extensionUri: vscode.Uri) {
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
			}
		);

		TextorPanel.currentPanel = new TextorPanel(panel, extensionUri);
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

	private _getHtmlContent(): string {
		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Textor Tools</title>
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
			font-family: var(--vscode-editor-font-family);
			padding: 8px 12px;
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			word-break: break-all;
			min-height: 36px;
			display: flex;
			align-items: center;
		}
		.btn-group {
			display: flex;
			gap: 8px;
		}
	</style>
</head>
<body>
	<h1>Textor Tools</h1>

	<!-- 时间工具 -->
	<div class="section">
		<div class="section-title">时间工具</div>
		<div class="row">
			<label>当前时间:</label>
			<div class="result" id="currentTime">-</div>
		</div>
		<div class="row">
			<label>时间戳:</label>
			<div class="result" id="currentTimestamp">-</div>
		</div>
		<div class="row">
			<div class="btn-group">
				<button onclick="refreshTime()">刷新</button>
				<button class="secondary" onclick="copyText('currentTime')">复制时间</button>
				<button class="secondary" onclick="copyText('currentTimestamp')">复制时间戳</button>
				<button class="secondary" onclick="insertText('currentTime')">插入时间</button>
				<button class="secondary" onclick="insertText('currentTimestamp')">插入时间戳</button>
			</div>
		</div>
	</div>

	<!-- 密码生成器 -->
	<div class="section">
		<div class="section-title">密码生成器</div>
		<div class="row">
			<label>长度:</label>
			<input type="number" id="passwordLength" value="16" min="4" max="128" style="max-width: 80px;">
			<label style="min-width: auto;">
				<input type="checkbox" id="includeLower" checked> 小写
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeUpper" checked> 大写
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeNumber" checked> 数字
			</label>
			<label style="min-width: auto;">
				<input type="checkbox" id="includeSymbol" checked> 符号
			</label>
		</div>
		<div class="row">
			<label>密码:</label>
			<div class="result" id="generatedPassword">-</div>
		</div>
		<div class="row">
			<div class="btn-group">
				<button onclick="generatePassword()">生成密码</button>
				<button class="secondary" onclick="copyText('generatedPassword')">复制</button>
				<button class="secondary" onclick="insertText('generatedPassword')">插入</button>
			</div>
		</div>
	</div>

	<!-- UUID 生成器 -->
	<div class="section">
		<div class="section-title">UUID 生成器</div>
		<div class="row">
			<label>格式:</label>
			<select id="uuidFormat" style="max-width: 200px;">
				<option value="standard">标准 (带连字符)</option>
				<option value="nohyphen">无连字符</option>
				<option value="uppercase">大写</option>
				<option value="braces">带花括号</option>
			</select>
		</div>
		<div class="row">
			<label>UUID:</label>
			<div class="result" id="generatedUuid">-</div>
		</div>
		<div class="row">
			<div class="btn-group">
				<button onclick="generateUuid()">生成 UUID</button>
				<button class="secondary" onclick="copyText('generatedUuid')">复制</button>
				<button class="secondary" onclick="insertText('generatedUuid')">插入</button>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		function formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			const seconds = String(date.getSeconds()).padStart(2, '0');
			return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
		}

		function refreshTime() {
			const now = new Date();
			document.getElementById('currentTime').textContent = formatDate(now);
			document.getElementById('currentTimestamp').textContent = Math.floor(now.getTime() / 1000);
		}

		function generatePassword() {
			const length = parseInt(document.getElementById('passwordLength').value) || 16;
			const includeLower = document.getElementById('includeLower').checked;
			const includeUpper = document.getElementById('includeUpper').checked;
			const includeNumber = document.getElementById('includeNumber').checked;
			const includeSymbol = document.getElementById('includeSymbol').checked;

			let chars = '';
			if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
			if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			if (includeNumber) chars += '0123456789';
			if (includeSymbol) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

			if (!chars) {
				document.getElementById('generatedPassword').textContent = '请至少选择一种字符类型';
				return;
			}

			let password = '';
			const array = new Uint32Array(length);
			crypto.getRandomValues(array);
			for (let i = 0; i < length; i++) {
				password += chars[array[i] % chars.length];
			}
			document.getElementById('generatedPassword').textContent = password;
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

			document.getElementById('generatedUuid').textContent = uuid;
		}

		function copyText(elementId) {
			const text = document.getElementById(elementId).textContent;
			if (text && text !== '-') {
				vscode.postMessage({ command: 'copy', text: text });
			}
		}

		function insertText(elementId) {
			const text = document.getElementById(elementId).textContent;
			if (text && text !== '-') {
				vscode.postMessage({ command: 'insert', text: text });
			}
		}

		// 初始化
		refreshTime();
		generatePassword();
		generateUuid();

		// 每秒更新时间
		setInterval(refreshTime, 1000);
	</script>
</body>
</html>`;
	}
}
