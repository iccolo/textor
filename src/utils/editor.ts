import * as vscode from 'vscode';

export function getSelectedText(editor: vscode.TextEditor): { text: string; selection: vscode.Selection } | null {
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showWarningMessage('请先选中要处理的文本');
		return null;
	}
	const text = editor.document.getText(selection);
	return { text, selection };
}

export async function replaceSelectedText(
	editor: vscode.TextEditor,
	selection: vscode.Selection,
	newText: string
): Promise<void> {
	await editor.edit(editBuilder => {
		editBuilder.replace(selection, newText);
	});
}
