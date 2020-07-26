const path = require('path');

import { NoteSearcherUi } from "../ui/NoteSearcherUi";
import { File } from "../utils/File";
import { NoteIndex } from "../index/NoteIndex";
import { createDiagnostics, Diagnostics } from "../diagnostics/diagnostics";
import { DeadLinkFinder } from "../dead_links/DeadLinkFinder";
import { NoteSearcherConfigProvider } from "./NoteSearcherConfigProvider";
import { TimeProvider, createTimeProvider } from "../utils/timeProvider";
import { formatDateTime_YYYYMMddhhmm } from "../utils/timeFormatter";
import { posixRelativePath } from "../utils/FileSystem";

export class NoteSearcher {
  private previousQuery = '';
  private diagnostics: Diagnostics;

  constructor(
    private ui: NoteSearcherUi,
    private noteIndex: NoteIndex,
    private deadLinkFinder: DeadLinkFinder,
    private configProvider: NoteSearcherConfigProvider,
    private timeProvider: TimeProvider = createTimeProvider())
  {
    ui.addNoteSavedListener(this.notifyNoteSaved);
    ui.addMovedViewToDifferentNoteListener(this.notifyMovedViewToDifferentNote);
    this.diagnostics = createDiagnostics('noteSearcher');
  }

  public search = async () => {
    this.diagnostics.trace('search');

    const input = await this.ui.promptForSearch(this.previousQuery);
    if (!input) {
      return;
    }
    this.previousQuery = input;
    try {
      const results = await this.noteIndex.search(input);
      await this.ui.showSearchResults(results);

      this.diagnostics.trace('search complete');
    }
    catch (e) {
      await this.ui.showError(e);
    }
  };

  public index = async () => {
    this.diagnostics.trace('index');
    const folder = this.ui.currentlyOpenDir();
    if (!folder) {
      await this.ui.showNotification('open a folder first');
      this.diagnostics.trace('index: no directory open');
      return;
    }

    try {
      const indexingTask = this.noteIndex.index(folder);
      this.ui.notifyIndexingStarted(indexingTask);
      await indexingTask;
      this.diagnostics.trace('indexing complete');
    }
    catch (e) {
      await this.ui.showError(e);
    }
  };

  public createNote = async () => {
    const noteId = this.createNoteId();
    const noteName = await this.ui.promptForNewNoteName(noteId);
    if (!noteName) { return; }
    const notePath = this.createNotePath(noteName);
    this.ui.startNewNote(notePath);
  };

  public createNoteId = (): string => {
    const now = this.timeProvider.millisecondsSinceEpochLocal();
    return formatDateTime_YYYYMMddhhmm(now);
  };

  private createNotePath = (name: string) => {
    const activeFile = this.ui.getCurrentFile();
    const dir = activeFile
      ? path.dirname(activeFile.path())
      : this.ui.currentlyOpenDir();
    return path.join(dir, name);
  };

  public showDeadLinks = () => {
    this.diagnostics.trace('show dead links');
    const root = this.ui.currentlyOpenDir();
    if (!root) {
      return;
    }

    const deadLinks = this.deadLinkFinder.findAllDeadLinks();

    this.ui.showDeadLinks(deadLinks);
    this.diagnostics.trace('show dead links completed');
  };

  public enable = () => {
    this.diagnostics.trace('enable');
    const currentDir = this.ui.currentlyOpenDir();

    if (!currentDir) {
      this.ui.showNotification('open a directory first!');
      return;
    }

    this.configProvider.enableInDir(currentDir);
    this.index();
  };

  public disable = () => {
    this.diagnostics.trace('disable');
    const currentDir = this.ui.currentlyOpenDir();

    if (!currentDir) {
      this.ui.showNotification('open a directory first!');
      return;
    }

    this.configProvider.disableInDir(currentDir);
  };

  public notifyExtensionActivated = async () => {
    if (!this.ui.currentlyOpenDir()) { return; }

    if (this.isEnabledInCurrentDir()) {
      await this.index();
      this.showTags();
    } else {
      this.promptUserToEnable();
    }
  };

  public promptUserToEnable = async () => {
    const shouldEnable = await this.ui.promptToEnable();

    if (shouldEnable) { this.enable(); }
  };

  public markdownLinkToClipboard = (filePath: string) => {
    const link = this.generateMarkdownLinkTo(filePath);
    this.ui.copyToClipboard(link);
  };

  public generateMarkdownLinkTo = (filePath: string) => {
    const currentFilePath = this.ui.getCurrentFile()?.path();

    let relPath = currentFilePath
      ? posixRelativePath(currentFilePath, filePath)
      : path.basename(filePath);

    return `[](${relPath})`;
  };

  public showBacklinks = () => {
    const currentFilePath = this.ui.getCurrentFile()?.path();
    if (!currentFilePath) { return; }
    const backlinks = this.noteIndex.linksTo(currentFilePath);
    this.ui.showBacklinks(backlinks);
  };

  private showTags = () => {
    const tags = this.noteIndex.allTags();
    this.ui.showTags(tags);
  };

  private notifyNoteSaved = async (file: File) => {
    this.diagnostics.trace('note saved');

    if (!this.isEnabledInCurrentDir()) {
      this.diagnostics.trace('updates disabled, doing nothing');
      return;
    }

    await this.index();
    this.showDeadLinks();
  };

  private notifyMovedViewToDifferentNote = async (file: File) => {
    this.showBacklinks();
  };

  private isEnabledInCurrentDir = () => {
    const currentDir = this.ui.currentlyOpenDir();
    return currentDir && this.configProvider.isEnabledInDir(currentDir);
  };
}
