'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
let fzfTerminal: vscode.Terminal | undefined = undefined;
let fzfTerminalPwd: vscode.Terminal | undefined = undefined;
export const TERMINAL_NAME = "fzf terminal";
export const TERMINAL_NAME_PWD = "fzf pwd terminal";

function showFzfTerminal(name: string, fzfTerminal: vscode.Terminal | undefined): vscode.Terminal {
	if (!fzfTerminal) {
		// Look for an existing terminal
		fzfTerminal = vscode.window.terminals.find((term) => { return term.name === name; });
	}
	if (!fzfTerminal) {
		// Create an fzf terminal
		let cwd = vscode.workspace.getConfiguration('fzf-quick-open').get('initialWorkingDirectory') as string;

		if (!cwd && vscode.window.activeTextEditor) {
			cwd = path.dirname(vscode.window.activeTextEditor.document.fileName);
		}
		cwd = cwd || '';
		fzfTerminal = vscode.window.createTerminal({
			cwd: cwd,
			name: name
		});
	}
	fzfTerminal.show();
	return fzfTerminal;
}

function moveToPwd(term: vscode.Terminal) {
	if (vscode.window.activeTextEditor) {
		let cwd = path.dirname(vscode.window.activeTextEditor.document.fileName);
		term.sendText(`cd ${cwd}`);
	}
}

export function activate(context: vscode.ExtensionContext) {
	let codeCmd = vscode.workspace.getConfiguration('fzf-quick-open').get('codeCmd') as string ?? "code";
	let codeOpenFileCmd = `fzf | xargs -r ${codeCmd}`;
	let codeOpenFolderCmd = `fzf | xargs -r ${codeCmd} -a`;
	context.subscriptions.push(vscode.commands.registerCommand('fzf-quick-open.runFzfFile', () => {
		let term = showFzfTerminal(TERMINAL_NAME, fzfTerminal);
		term.sendText(codeOpenFileCmd, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('fzf-quick-open.runFzfFilePwd', () => {
		let term = showFzfTerminal(TERMINAL_NAME_PWD, fzfTerminalPwd);
		moveToPwd(term);
		term.sendText(codeOpenFileCmd, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('fzf-quick-open.runFzfAddWorkspaceFolder', () => {
		let term = showFzfTerminal(TERMINAL_NAME, fzfTerminal);
		let findCmd = vscode.workspace.getConfiguration('fzf-quick-open').get('findDirectoriesCmd') as string;
		term.sendText(`${findCmd} | ${codeOpenFolderCmd}`, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('fzf-quick-open.runFzfAddWorkspaceFolderPwd', () => {
		let term = showFzfTerminal(TERMINAL_NAME_PWD, fzfTerminalPwd);
		let findCmd = vscode.workspace.getConfiguration('fzf-quick-open').get('findDirectoriesCmd') as string;
		moveToPwd(term);
		term.sendText(`${findCmd} | ${codeOpenFolderCmd}`, true);
	}));

	vscode.window.onDidCloseTerminal((terminal) => {
		switch (terminal.name) {
			case TERMINAL_NAME:
				fzfTerminal = undefined;
				break;

			case TERMINAL_NAME_PWD:
				fzfTerminalPwd = undefined
				break;
		}
	});
}
