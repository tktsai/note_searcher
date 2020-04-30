const path = require('path');

import { expect } from 'chai';

import {
  Workbench,
  VSBrowser,
  InputBox,
  EditorView,
  TextEditor
} from 'vscode-extension-tester';
import { waitFor, waitForAsync } from './wait';

export class VsCodeDriver {
  constructor(
    private driver = VSBrowser.instance.driver,
    private workbench = new Workbench()
  ) { }

  public openDemoDirectory = () => {
    return this.openDirectory(this.getDemoDirectory());
  };

  public getDemoDirectory = () => {
    return path.resolve(__dirname, '../../demo_dir');
  };

  public openDirectory = async (dir: string) => {
    await this.workbench.executeCommand('Extest: Open Folder');
    const input = await InputBox.create();
    await input.setText(dir);
    await input.confirm();
  };

  public runCommand = (command: string) => {
    return this.workbench.executeCommand(command);
  };

  public isShowingInputBox = async () => {
    const input = await InputBox.create();
    expect(await input.isDisplayed()).to.be.true;
  };

  public enterInputText = async (text: string) => {
    const input = await InputBox.create();
    await input.sendKeys(text);
    await input.confirm();
  };

  public closeAllEditors = async () => {
    const editorView = new EditorView();
    await editorView.closeAllEditors();
  };

  public getOnlyOpenEditor = async () => {
    const editorView = new EditorView();
    const titles = await editorView.getOpenEditorTitles();
    if (titles.length === 0) {
      expect.fail('no editors open');
    }
    if (titles.length > 1) {
      expect.fail('more than one editor open');
    }
    const title = titles[0];
    return await editorView.openEditor(title) as TextEditor;
  };

  public getOpenEditorTitles = () => {
    return new EditorView().getOpenEditorTitles();
  };

  public findEditorByTitle = async (matcher: (editorTitle: string) => boolean) => {
    const editorView = new EditorView();
    // Was getting 'no editor found with title X' errors here without the delay.
    // There is a noticeable delay after the file is clicked on before the
    // editor opens.
    // Note: this seems to be causing a rejected promise after the end of the
    //       test run :(
    let matchedTitle: string | null = null;
    await waitForAsync(async () => {
      const titles = await editorView.getOpenEditorTitles();
      for (const title of titles) {
        if (matcher(title)) {
          matchedTitle = title;
          return true;
        }
      }
      return false;
    });
    if (!matchedTitle) { return null; }
    return await editorView.openEditor(matchedTitle) as TextEditor;
  };
}
