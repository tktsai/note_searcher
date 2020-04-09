import * as vscode from 'vscode';
import { createService } from './searchService';
import { VsCode } from './ui/vscode';
import { NoteSearcher } from './noteSearcher';
import { DeadLinkFinder } from './DeadLinkFinder';
import { createDirWalker } from './utils/dirWalker';
import { createFileReader } from './utils/FileReader';

export function activate(context: vscode.ExtensionContext) {
  const ui = new VsCode();
  const searcher = createService(extensionDir()!);
  const deadLinkFinder = new DeadLinkFinder(createDirWalker(), createFileReader());
  const noteSearcher = new NoteSearcher(ui, searcher, deadLinkFinder);

  const search = vscode.commands.registerCommand(
    'noteSearcher.search', async () => await noteSearcher.search());

  const index = vscode.commands.registerCommand(
    'noteSearcher.index', async () => await noteSearcher.index());

  const openFile = vscode.commands.registerCommand(
    'noteSearcher.searchResults.openFile',
    file => vscode.window.showTextDocument(file));

  const docChangeHandler = ui.createOnDidChangeTextDocumentHandler();
  const docSaveHandler = ui.createOnDidSaveDocumentHandler();

  context.subscriptions.push(
    search,
    index,
    openFile,
    docChangeHandler,
    docSaveHandler
  );
}

export function deactivate() {}

const extensionDir = () => {
  return vscode.extensions.getExtension('uozuaho.note-searcher')?.extensionPath;
};
