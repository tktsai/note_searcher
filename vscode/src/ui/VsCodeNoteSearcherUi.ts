import * as vscode from 'vscode';
import { SearchResultTree } from './searchResultTree';
import { NoteSearcherUi, FileChangeListener } from './NoteSearcherUi';
import { File } from "../utils/File";
import { Link } from '../dead_links/DeadLinkFinder';
import { DeadLinksTree } from './DeadLinksTree';
import { BacklinksTree } from './BacklinksTree';

export class VsCodeNoteSearcherUi implements NoteSearcherUi {
  private currentNoteModifiedListener: FileChangeListener | null = null;
  private noteSavedListener: FileChangeListener | null = null;
  private movedViewToDifferentNoteListener: FileChangeListener | null = null;

  public copyToClipboard = async (text: string) => {
    return await vscode.env.clipboard.writeText(text);
  };

  public getCurrentFile = () => 
    vscode.window.activeTextEditor
      ? new VsCodeFile(vscode.window.activeTextEditor.document)
      : null;

  public currentlyOpenDir = () =>
    vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : null;

  public promptToEnable = async (): Promise<boolean> => {
    const msg = 'Enable Note Searcher in this directory? Note Searcher can ' +
                'also be enabled/disabled via the command palette';

    const enable = 'Enable';
    const dontEnable = 'Do not enable';

    const response = await vscode.window.showInformationMessage(msg, enable, dontEnable);

    return response === enable;
  };

  public promptForSearch = async (prefill: string) => {
    return await vscode.window.showInputBox({
      value: prefill,
      prompt: "Search for documents"
    });
  };

  public showSearchResults = async (files: string[]) => {
    const uris = files.map(f => vscode.Uri.file(f));
    const searchResults = new SearchResultTree(uris);
    const view = vscode.window.createTreeView('noteSearcher-results', {
      treeDataProvider: searchResults,
    });

    // Hack: Show the view container if it's not currently visible.
    //       Doesn't work if there's no search results :(
    //       todo: find a way to show the container regardless of search results
    if (uris.length > 0) {
      const children = await searchResults.getChildren();
      return view.reveal(children[0]);
    }
  };

  public promptForNewNoteName = async (noteId: string) => {
    return await vscode.window.showInputBox({
      value: noteId,
      prompt: "Create a new note",
      valueSelection: [noteId.length, noteId.length]
    });
  };

  public startNewNote = async (path: string) => {
    const uri = vscode.Uri.parse(`untitled:${path}`);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    return;
  };

  public showRelatedFiles = (files: string[]) => {
    const uris = files.map(f => vscode.Uri.file(f));
    vscode.window.createTreeView('noteSearcher-related', {
      treeDataProvider: new SearchResultTree(uris)
    });
  };

  public showNotification = async (message: string) => {
    await vscode.window.showInformationMessage(message);
  };

  public showDeadLinks = async (links: Link[]) => {
    const deadLinks = new DeadLinksTree(links);

    vscode.window.createTreeView('noteSearcher-deadLinks', {
      treeDataProvider: deadLinks
    });
  };

  public showBacklinks = async (links: string[]) => {
    const uris = links.map(l => vscode.Uri.file(l));
    const backlinks = new BacklinksTree(uris);

    vscode.window.createTreeView('noteSearcher-backlinks', {
      treeDataProvider: backlinks
    });
  };

  public notifyIndexingStarted = (indexingTask: Promise<void>) => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      title: 'Note Searcher: indexing...',
    }, () => indexingTask);
  };

  public showError = async (e: any) => {
    let msg = 'Note Searcher: Argh! Something broke. Sorry!\n\n' +
              'If you have time, please create an issue at https://github.com/uozuAho/note_searcher/issues\n\n' +
              'Please include the error details: \n\n' + e;
    await openInNewEditor(msg);
  };

  public addCurrentNoteModifiedListener = (listener: FileChangeListener) => {
    this.currentNoteModifiedListener = listener;
  };

  public addNoteSavedListener = (listener: FileChangeListener) => {
    this.noteSavedListener = listener;
  };

  public addMovedViewToDifferentNoteListener = (listener: FileChangeListener) => {
    this.movedViewToDifferentNoteListener = listener;
  };

  public createCurrentNoteModifiedHandler = () => {
    return vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        if (this.currentNoteModifiedListener) {
          const file = new VsCodeFile(e.document);
          this.currentNoteModifiedListener(file);
        }
      }
    });
  };

  public createNoteSavedHandler = () => {
    return vscode.workspace.onDidSaveTextDocument(doc => {
      if (this.noteSavedListener) {
        const file = new VsCodeFile(doc);
        this.noteSavedListener(file);
      }
    });
  };

  public createMovedViewToDifferentNoteHandler = () => {
    return vscode.window.onDidChangeActiveTextEditor(e => {
      if (!e) { return; }
      if (this.movedViewToDifferentNoteListener) {
        const file = new VsCodeFile(e.document);
        this.movedViewToDifferentNoteListener(file);
      }
    });
  };
}

class VsCodeFile implements File {
  constructor(private doc: vscode.TextDocument) {}

  text = () => this.doc.getText();
  path = () => this.doc.fileName;
}

async function openInNewEditor(content: string, language?: string) {
  const document = await vscode.workspace.openTextDocument({
    language,
    content,
  });
  return await vscode.window.showTextDocument(document);
}
