import * as tmoq from "typemoq";
import { NoteSearcherUi, FileChangeListener } from "../ui/NoteSearcherUi";
import { File } from "../utils/File";
import { MockFile } from "./MockFile";

export class MockUi implements NoteSearcherUi {
  private _mock: tmoq.IMock<NoteSearcherUi>;

  constructor() {
    this._mock = tmoq.Mock.ofType<NoteSearcherUi>();
  }

  public promptForNewNoteName = (noteId: string) => Promise.resolve('asdf');

  public startNewTextDocument = (noteName: string) => Promise.resolve();

  private _currentFile: File | null = null;

  public getCurrentFileReturns = (file: File | null) => {
    this._currentFile = file;
  };

  public getCurrentFile = () => this._currentFile;

  private _currentlyOpenDir: string | null = null;

  public currentlyOpenDirReturns = (dir: string | null) => {
    this._currentlyOpenDir = dir;
  };

  public currentlyOpenDir = () => this._currentlyOpenDir;

  private _enableReponse = false;

  public promptToEnableReturns = (response: boolean) => {
    this._enableReponse = response;
  };

  public promptToEnable = async () => {
    return Promise.resolve(this._enableReponse);
  };

  private _searchInput: string | undefined;

  public promptForSearchReturns = (input: string | undefined) => {
    this._searchInput = input;
  };

  public promptForSearch = (prefill: string) => Promise.resolve(this._searchInput);

  public showSearchResults = async (files: string[]) => {
    await this._mock.object.showSearchResults(files);
  };

  public showedSearchResults = (files: string[]) => {
    this._mock.verify(m => m.showSearchResults(files), tmoq.Times.once());
  };

  public didNotShowSearchResults = () => {
    this._mock.verify(m => m.showSearchResults(tmoq.It.isAny()), tmoq.Times.never());
  };

  public showNotification = async (message: string) => {
    await this._mock.object.showNotification(message);
  };

  public showedAnyNotification = async (times: number = 1) => {
    this._mock.verify(m => m.showNotification(tmoq.It.isAnyString()), tmoq.Times.exactly(times));
  };

  public showError = async (e: any) => {
    await this._mock.object.showError(e);
  };

  public showedError = (error?: Error) => {
    if (!error) {
      this._mock.verify(m => m.showError(tmoq.It.isAny()), tmoq.Times.once());
    } else {
      this._mock.verify(m => m.showError(error), tmoq.Times.once());
    }
  };

  public didNotShowError = () => {
    this._mock.verify(m => m.showError(tmoq.It.isAny()), tmoq.Times.never());
  };

  private _fileChangeListener: FileChangeListener | null = null;

  public addCurrentDocumentChangeListener = (listener: FileChangeListener) => {
    this._fileChangeListener = listener;
  };

  public currentFileChanged = (file: MockFile) => {
    if (this._fileChangeListener) {
      return this._fileChangeListener(file);
    }
  };

  public showRelatedFiles = (files: string[]) => {
    return this._mock.object.showRelatedFiles(files);
  };

  public showedRelatedFiles = (files: string[]) => {
    this._mock.verify(m => m.showRelatedFiles(files), tmoq.Times.once());
  };

  public didNotShowRelatedFiles = () => {
    this._mock.verify(m => m.showRelatedFiles(tmoq.It.isAny()), tmoq.Times.never());
  };

  private _fileSavedListener: FileChangeListener | null = null;

  public addDocumentSavedListener = (listener: FileChangeListener) => {
    this._fileSavedListener = listener;
  };

  public saveFile = (file: MockFile) => {
    if (this._fileSavedListener) {
      this._fileSavedListener(file);
    }
  };
}
