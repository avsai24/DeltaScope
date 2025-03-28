import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('DeltaScope is ACTIVE!');

	const saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
		const fullPath = document.fileName;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder) return;

		const relativePath = path.relative(workspaceFolder.uri.fsPath, fullPath);

		
		exec(`git show HEAD:${relativePath}`, { cwd: workspaceFolder.uri.fsPath }, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`DeltaScope: Cannot diff "${relativePath}" — is it committed to Git?`);
				console.error(stderr);
				return;
			}

			
			const tempFile = tmp.fileSync({ postfix: path.extname(fullPath) });
			fs.writeFileSync(tempFile.name, stdout);

			const oldUri = vscode.Uri.file(tempFile.name);
			const newUri = document.uri;

			vscode.commands.executeCommand(
			'vscode.diff',
			oldUri,
			newUri,
			`DeltaScope: ${relativePath}`,
			{ viewColumn: vscode.ViewColumn.Beside }
			);
		});
	});

	context.subscriptions.push(saveListener);
}

export function deactivate() {}
