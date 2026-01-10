import * as vscode from 'vscode';
import { transformers } from './transformers';
import { getSelectedText, replaceSelectedText } from './utils/editor';
import { detectTextType, getRecommendedTransformers } from './utils/detector';
import { TextorPanel } from './webview/panel';
import { TextorSidebarProvider } from './webview/sidebarProvider';

interface TransformQuickPickItem extends vscode.QuickPickItem {
	transformerId: string;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "textor" is now active!');

	// 注册侧边栏视图
	const sidebarProvider = new TextorSidebarProvider(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TextorSidebarProvider.viewType, sidebarProvider)
	);

	// 注册打开 UI 面板的命令
	const openPanelCmd = vscode.commands.registerCommand('textor.openPanel', () => {
		TextorPanel.show(context.extensionUri, context);
	});
	context.subscriptions.push(openPanelCmd);

	// 注册智能转换命令（Quick Pick）
	const smartTransformCmd = vscode.commands.registerCommand('textor.smartTransform', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('没有打开的编辑器');
			return;
		}

		const selected = getSelectedText(editor);
		if (!selected) {
			vscode.window.showWarningMessage('请先选中文本');
			return;
		}

		// 检测文本类型
		const detections = detectTextType(selected.text);
		const recommended = getRecommendedTransformers(detections);

		// 检查文件类型，如果是 .proto 文件，优先推荐 Proto Format
		const fileName = editor.document.fileName;
		const isProtoFile = fileName.endsWith('.proto');

		// 构建 Quick Pick 项目
		const items: TransformQuickPickItem[] = [];
		const addedIds = new Set<string>();

		// 如果是 proto 文件，优先添加 Proto Format
		if (isProtoFile) {
			const protoFormatter = transformers.find(t => t.id === 'protoFormat');
			if (protoFormatter) {
				items.push({
					label: `$(star-full) ${protoFormatter.title}`,
					description: '检测到 Proto 文件',
					transformerId: protoFormatter.id,
				});
				addedIds.add(protoFormatter.id);
			}
		}

		// 添加推荐项（带星标）
		for (const id of recommended) {
			const transformer = transformers.find(t => t.id === id);
			if (transformer && !addedIds.has(id)) {
				const detection = detections.find(d => getRecommendedTransformers([d]).includes(id));
				items.push({
					label: `$(star-full) ${transformer.title}`,
					description: detection?.description || '推荐',
					transformerId: id,
				});
				addedIds.add(id);
			}
		}

		// 添加分隔符
		if (items.length > 0) {
			items.push({
				label: '',
				kind: vscode.QuickPickItemKind.Separator,
				transformerId: '',
			});
		}

		// 添加其他转换器
		for (const transformer of transformers) {
			if (!addedIds.has(transformer.id)) {
				items.push({
					label: transformer.title,
					transformerId: transformer.id,
				});
			}
		}

		// 显示 Quick Pick
		const picked = await vscode.window.showQuickPick(items, {
			placeHolder: '选择转换操作',
			matchOnDescription: true,
		});

		if (picked && picked.transformerId) {
			const transformer = transformers.find(t => t.id === picked.transformerId);
			if (transformer) {
				try {
					const result = await transformer.transform(selected.text);
					await replaceSelectedText(editor, selected.selection, result);
					vscode.window.showInformationMessage(`${transformer.title} 成功`);
				} catch (error) {
					vscode.window.showErrorMessage(`${transformer.title} 失败: ${error}`);
				}
			}
		}
	});
	context.subscriptions.push(smartTransformCmd);

	// 注册文本转换命令
	for (const t of transformers) {
		const cmd = vscode.commands.registerCommand(`textor.${t.id}`, async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showWarningMessage('没有打开的编辑器');
				return;
			}

			const selected = getSelectedText(editor);
			if (!selected) {
				return;
			}

			try {
				const result = await t.transform(selected.text);
				await replaceSelectedText(editor, selected.selection, result);
				vscode.window.showInformationMessage(`${t.title} 成功`);
			} catch (error) {
				vscode.window.showErrorMessage(`${t.title} 失败: ${error}`);
			}
		});
		context.subscriptions.push(cmd);
	}
}

export function deactivate() {}
