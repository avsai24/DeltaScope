import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';

const openedDiffs: string[] = [];
const MAX_DIFFS = 3;

export function activate(context: vscode.ExtensionContext) {
	console.log('DeltaScope is ACTIVE!');

	const saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
		const fullPath = document.fileName;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder) return;

		const relativePath = path.relative(workspaceFolder.uri.fsPath, fullPath);

		// Fetch old version using Git
		exec(`git show HEAD:${relativePath}`, { cwd: workspaceFolder.uri.fsPath }, async (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`DeltaScope: Cannot diff "${relativePath}" — is it committed to Git?`);
				console.error(stderr);
				return;
			}

			// Write old content to temp file
			const tempFile = tmp.fileSync({ postfix: path.extname(fullPath) });
			fs.writeFileSync(tempFile.name, stdout);

			const oldUri = vscode.Uri.file(tempFile.name);
			const newUri = document.uri;

			// Rolling window: close oldest if over limit
			const alreadyOpenIndex = openedDiffs.indexOf(relativePath);
			if (alreadyOpenIndex !== -1) {
				console.log(`DeltaScope: Diff for "${relativePath}" already open — revealing tab.`);
				const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
				const tabToFocus = tabs.find(tab =>
				  tab.label.includes(relativePath) && tab.label.startsWith('DeltaScope:')
				);
				if (tabToFocus && 'input' in tabToFocus) {
				  const input = (tabToFocus as any).input;
				  if (input?.modified?.uri) {
					vscode.window.showTextDocument(input.modified.uri, { viewColumn: vscode.ViewColumn.Beside });
				  }
				}
				return;
			  }

			// Limit to 3 open diffs
			if (openedDiffs.length >= MAX_DIFFS) {
			const oldestPath = openedDiffs.shift();
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const tabToClose = tabs.find(tab =>
				tab.label.includes(oldestPath || '') && tab.label.startsWith('DeltaScope:')
			);
			if (tabToClose) {
				await vscode.window.tabGroups.close(tabToClose);
			}
			}

			// Add to list and open diff
			openedDiffs.push(relativePath);

			// Open the diff
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