import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "DeltaScope" is now active!');

	const disposable = vscode.commands.registerCommand('DeltaScope.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from deltascope!');
	});

	// ✅ Add this: File save event listener
	const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
		vscode.window.showInformationMessage(`DeltaScope: You saved ${document.fileName}`);
	});

	// Register both in context
	context.subscriptions.push(disposable, saveListener);
}

export function deactivate() {}