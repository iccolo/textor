import * as vscode from 'vscode';

/**
 * Central place for all static assets consumed by webviews.
 *
 * Assets are copied into `dist/` at build time by esbuild-plugin-copy
 * (see esbuild.js). Update paths here only — do NOT reference
 * `node_modules/**` from webviews, since node_modules is excluded from
 * the VSIX via `.vscodeignore`.
 */
export interface WebviewAssets {
    /** URI of the codicons stylesheet (font is loaded relatively by the CSS). */
    codiconsCss: vscode.Uri;
}

export function getWebviewAssets(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
): WebviewAssets {
    return {
        codiconsCss: webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, 'dist', 'codicons', 'codicon.css')
        ),
    };
}
