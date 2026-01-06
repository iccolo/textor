import * as vscode from 'vscode';

export class TextorSidebarProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'textor.sidebarView';
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		// 获取保存的设置
		const savedSettings = this._context.globalState.get<Record<string, unknown>>('textorSettings', {});
		webviewView.webview.html = this._getHtmlContent(savedSettings);

		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'copy':
					await vscode.env.clipboard.writeText(message.text);
					vscode.window.showInformationMessage('已复制到剪贴板');
					break;
				case 'insert':
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						await editor.edit((editBuilder) => {
							editBuilder.insert(editor.selection.active, message.text);
						});
					}
					break;
				case 'saveSettings':
					// 立即保存到 globalState
					await this._context.globalState.update('textorSettings', message.settings);
					break;
			}
		});
	}

	private _getHtmlContent(savedSettings: Record<string, unknown>): string {
		const settingsJson = JSON.stringify(savedSettings);
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
			background-color: var(--vscode-sideBar-background);
			padding: 8px;
		}
		.section {
			margin-bottom: 4px;
			background-color: var(--vscode-editor-background);
			border-radius: 4px;
			overflow: hidden;
		}
		.section-header {
			display: flex;
			align-items: center;
			padding: 8px 10px;
			cursor: pointer;
			user-select: none;
			font-size: 0.9em;
			font-weight: 500;
			color: var(--vscode-foreground);
		}
		.section-header:hover {
			background-color: var(--vscode-list-hoverBackground);
		}
		.section-header .arrow {
			margin-right: 6px;
			transition: transform 0.15s;
			font-size: 0.8em;
		}
		.section.collapsed .arrow {
			transform: rotate(-90deg);
		}
		.section-content {
			padding: 0 10px 10px 10px;
		}
		.section.collapsed .section-content {
			display: none;
		}
		.row {
			display: flex;
			flex-direction: column;
			gap: 4px;
			margin-bottom: 8px;
		}
		.row:last-child {
			margin-bottom: 0;
		}
		label {
			font-size: 0.8em;
			color: var(--vscode-descriptionForeground);
		}
		input[type="number"], select {
			width: 100%;
			padding: 4px 8px;
			border: 1px solid var(--vscode-input-border);
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border-radius: 3px;
			font-family: var(--vscode-editor-font-family);
			font-size: 0.85em;
		}
		input:focus, select:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}
		button {
			padding: 4px 10px;
			border: none;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border-radius: 3px;
			cursor: pointer;
			font-size: 0.8em;
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
			padding: 6px 8px;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			word-break: break-all;
			min-height: 26px;
			font-size: 0.85em;
		}
		.btn-group {
			display: flex;
			flex-wrap: wrap;
			gap: 4px;
			margin-top: 6px;
		}
		.checkbox-group {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 6px;
		}
		.checkbox-group label {
			display: flex;
			align-items: center;
			gap: 3px;
			font-size: 0.8em;
			cursor: pointer;
		}
		.checkbox-group input[type="checkbox"] {
			width: 13px;
			height: 13px;
			cursor: pointer;
		}
		.symbol-row {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.symbol-row label {
			display: flex;
			align-items: center;
			gap: 3px;
			font-size: 0.8em;
			cursor: pointer;
		}
		.symbol-expand-btn {
			padding: 2px 6px;
			font-size: 0.75em;
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			border-radius: 3px;
			cursor: pointer;
		}
		.symbol-expand-btn:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}
		.symbol-dropdown {
			display: none;
			margin-top: 6px;
			padding: 8px;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
		}
		.symbol-dropdown.show {
			display: block;
		}
		.symbol-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
			gap: 4px;
		}
		.symbol-item {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 4px;
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			cursor: pointer;
			font-family: var(--vscode-editor-font-family);
			font-size: 0.85em;
		}
		.symbol-item.selected {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border-color: var(--vscode-button-background);
		}
		.symbol-item:hover {
			opacity: 0.8;
		}
	</style>
</head>
<body>
	<!-- 时间工具 -->
	<div class="section collapsed" id="section-time">
		<div class="section-header" onclick="toggleSection('time')">
			<span class="arrow">▼</span>
			<span>时间工具</span>
		</div>
		<div class="section-content">
			<div class="row">
				<label>当前时间</label>
				<div class="result" id="currentTime">-</div>
			</div>
			<div class="row">
				<label>时间戳</label>
				<div class="result" id="currentTimestamp">-</div>
			</div>
			<div class="btn-group">
				<button onclick="refreshTime()">刷新</button>
				<button class="secondary" onclick="copyText('currentTimestamp')">复制</button>
				<button class="secondary" onclick="insertText('currentTimestamp')">插入</button>
			</div>
		</div>
	</div>

	<!-- 密码生成器 -->
	<div class="section collapsed" id="section-password">
		<div class="section-header" onclick="toggleSection('password')">
			<span class="arrow">▼</span>
			<span>密码生成器</span>
		</div>
		<div class="section-content">
			<div class="row">
				<label>长度</label>
				<input type="number" id="passwordLength" value="16" min="4" max="128" onchange="saveSettings()">
			</div>
			<div class="checkbox-group">
				<label><input type="checkbox" id="includeLower" checked onchange="saveSettings()"> 小写</label>
				<label><input type="checkbox" id="includeUpper" checked onchange="saveSettings()"> 大写</label>
				<label><input type="checkbox" id="includeNumber" checked onchange="saveSettings()"> 数字</label>
				<div class="symbol-row">
					<label><input type="checkbox" id="includeSymbol" checked onchange="toggleAllSymbols()"> 符号</label>
					<button class="symbol-expand-btn" onclick="toggleSymbolDropdown(event)">...</button>
				</div>
			</div>
			<div class="symbol-dropdown" id="symbolDropdown">
				<div class="symbol-grid" id="symbolGrid"></div>
			</div>
			<div class="row">
				<div class="result" id="generatedPassword">-</div>
			</div>
			<div class="btn-group">
				<button onclick="generatePassword()">生成</button>
				<button class="secondary" onclick="copyText('generatedPassword')">复制</button>
				<button class="secondary" onclick="insertText('generatedPassword')">插入</button>
			</div>
		</div>
	</div>

	<!-- UUID 生成器 -->
	<div class="section collapsed" id="section-uuid">
		<div class="section-header" onclick="toggleSection('uuid')">
			<span class="arrow">▼</span>
			<span>UUID 生成器</span>
		</div>
		<div class="section-content">
			<div class="row">
				<label>格式</label>
				<select id="uuidFormat" onchange="saveSettings()">
					<option value="standard">标准 (带连字符)</option>
					<option value="nohyphen">无连字符</option>
					<option value="uppercase">大写</option>
				</select>
			</div>
			<div class="row">
				<div class="result" id="generatedUuid">-</div>
			</div>
			<div class="btn-group">
				<button onclick="generateUuid()">生成</button>
				<button class="secondary" onclick="copyText('generatedUuid')">复制</button>
				<button class="secondary" onclick="insertText('generatedUuid')">插入</button>
			</div>
		</div>
	</div>

	<!-- HMAC-SHA256 生成器 -->
	<div class="section collapsed" id="section-sha256">
		<div class="section-header" onclick="toggleSection('sha256')">
			<span class="arrow">▼</span>
			<span>HMAC-SHA256</span>
		</div>
		<div class="section-content">
			<div class="row">
				<label>密钥 (Key)</label>
				<input type="text" id="hmacKey" style="width:100%;padding:4px 8px;border:1px solid var(--vscode-input-border);background-color:var(--vscode-input-background);color:var(--vscode-input-foreground);border-radius:3px;font-family:var(--vscode-editor-font-family);font-size:0.85em;" placeholder="输入密钥">
			</div>
			<div class="row">
				<label>消息 (Message)</label>
				<textarea id="sha256Input" rows="2" style="width:100%;padding:4px 8px;border:1px solid var(--vscode-input-border);background-color:var(--vscode-input-background);color:var(--vscode-input-foreground);border-radius:3px;font-family:var(--vscode-editor-font-family);font-size:0.85em;resize:vertical;" placeholder="输入要计算哈希的消息"></textarea>
			</div>
			<div class="row">
				<label>HMAC-SHA256</label>
				<div class="result" id="sha256Result" style="font-size:0.75em;">-</div>
			</div>
			<div class="btn-group">
				<button onclick="generateHmacSha256()">计算</button>
				<button class="secondary" onclick="copyText('sha256Result')">复制</button>
				<button class="secondary" onclick="insertText('sha256Result')">插入</button>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const allSymbols = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', '|', ';', ':', ',', '.', '<', '>', '?'];
		let selectedSymbols = new Set(allSymbols);
		
		// 从扩展传入的初始设置
		let savedSettings = ${settingsJson};

		// 初始化符号网格
		function initSymbolGrid() {
			const grid = document.getElementById('symbolGrid');
			grid.innerHTML = '';
			
			// 从保存的设置恢复
			if (savedSettings.selectedSymbols !== undefined) {
				selectedSymbols = new Set(savedSettings.selectedSymbols);
			}
			
			allSymbols.forEach(symbol => {
				const item = document.createElement('div');
				item.className = 'symbol-item' + (selectedSymbols.has(symbol) ? ' selected' : '');
				item.textContent = symbol;
				item.dataset.symbol = symbol;
				item.onclick = () => {
					if (selectedSymbols.has(symbol)) {
						selectedSymbols.delete(symbol);
						item.classList.remove('selected');
					} else {
						selectedSymbols.add(symbol);
						item.classList.add('selected');
					}
					updateSymbolCheckbox();
					saveSettings();
				};
				grid.appendChild(item);
			});
		}

		// 更新符号主复选框状态
		function updateSymbolCheckbox() {
			const checkbox = document.getElementById('includeSymbol');
			checkbox.checked = selectedSymbols.size > 0;
		}

		// 切换所有符号
		function toggleAllSymbols() {
			const checkbox = document.getElementById('includeSymbol');
			const items = document.querySelectorAll('.symbol-item');
			
			if (checkbox.checked) {
				// 全选
				selectedSymbols = new Set(allSymbols);
				items.forEach(item => item.classList.add('selected'));
			} else {
				// 全不选
				selectedSymbols.clear();
				items.forEach(item => item.classList.remove('selected'));
			}
			saveSettings();
		}

		// 切换符号下拉框
		function toggleSymbolDropdown(event) {
			event.stopPropagation();
			const dropdown = document.getElementById('symbolDropdown');
			dropdown.classList.toggle('show');
		}

		// 折叠/展开
		function toggleSection(name) {
			const section = document.getElementById('section-' + name);
			section.classList.toggle('collapsed');
			saveSettings();
		}

		// 保存设置到扩展
		function saveSettings() {
			const settings = {
				passwordLength: parseInt(document.getElementById('passwordLength').value) || 16,
				includeLower: document.getElementById('includeLower').checked,
				includeUpper: document.getElementById('includeUpper').checked,
				includeNumber: document.getElementById('includeNumber').checked,
				includeSymbol: document.getElementById('includeSymbol').checked,
				selectedSymbols: Array.from(selectedSymbols),
				uuidFormat: document.getElementById('uuidFormat').value,
				collapsedSections: {
					time: document.getElementById('section-time').classList.contains('collapsed'),
					password: document.getElementById('section-password').classList.contains('collapsed'),
					uuid: document.getElementById('section-uuid').classList.contains('collapsed'),
					sha256: document.getElementById('section-sha256').classList.contains('collapsed')
				}
			};
			
			// 发送到扩展保存
			vscode.postMessage({ command: 'saveSettings', settings: settings });
			
			// 同时保存到 webview state（用于 webview 隐藏后恢复）
			vscode.setState(settings);
		}

		// 恢复设置
		function restoreSettings() {
			// 优先使用 webview state，其次使用扩展传入的设置
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
			if (savedSettings.collapsedSections) {
				const cs = savedSettings.collapsedSections;
				if (cs.time === false) document.getElementById('section-time').classList.remove('collapsed');
				if (cs.password === false) document.getElementById('section-password').classList.remove('collapsed');
				if (cs.uuid === false) document.getElementById('section-uuid').classList.remove('collapsed');
				if (cs.sha256 === false) document.getElementById('section-sha256').classList.remove('collapsed');
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

			let chars = '';
			if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
			if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			if (includeNumber) chars += '0123456789';
			if (selectedSymbols.size > 0) {
				chars += Array.from(selectedSymbols).join('');
			}

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
			}

			document.getElementById('generatedUuid').textContent = uuid;
		}

		async function generateHmacSha256() {
			const key = document.getElementById('hmacKey').value;
			const message = document.getElementById('sha256Input').value;
			
			if (!key) {
				document.getElementById('sha256Result').textContent = '请输入密钥';
				return;
			}
			if (!message) {
				document.getElementById('sha256Result').textContent = '请输入消息';
				return;
			}
			
			try {
				const encoder = new TextEncoder();
				const keyData = encoder.encode(key);
				const messageData = encoder.encode(message);
				
				const cryptoKey = await crypto.subtle.importKey(
					'raw',
					keyData,
					{ name: 'HMAC', hash: 'SHA-256' },
					false,
					['sign']
				);
				
				const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
				const hashArray = Array.from(new Uint8Array(signature));
				const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
				document.getElementById('sha256Result').textContent = hashHex;
			} catch (e) {
				document.getElementById('sha256Result').textContent = '计算失败: ' + e.message;
			}
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
		initSymbolGrid();
		restoreSettings();
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
