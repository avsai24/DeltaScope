"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const tmp = __importStar(require("tmp"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    console.log('DeltaScope is ACTIVE!');
    const saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const fullPath = document.fileName;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder)
            return;
        const relativePath = path.relative(workspaceFolder.uri.fsPath, fullPath);
        (0, child_process_1.exec)(`git show HEAD:${relativePath}`, { cwd: workspaceFolder.uri.fsPath }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`DeltaScope: Cannot diff "${relativePath}" — is it committed to Git?`);
                console.error(stderr);
                return;
            }
            const tempFile = tmp.fileSync({ postfix: path.extname(fullPath) });
            fs.writeFileSync(tempFile.name, stdout);
            const oldUri = vscode.Uri.file(tempFile.name);
            const newUri = document.uri;
            vscode.commands.executeCommand('vscode.diff', oldUri, newUri, `DeltaScope: ${relativePath}`, { viewColumn: vscode.ViewColumn.Beside });
        });
    });
    context.subscriptions.push(saveListener);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map