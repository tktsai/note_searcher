import * as tmoq from "typemoq";

import { NoteSearcher } from './noteSearcher';
import { NoteIndex } from '../index/NoteIndex';
import { MockUi } from "../mocks/MockUi";
import { MockFile } from "../mocks/MockFile";
import { DelayedExecutor } from '../utils/delayedExecutor';
import { NewDeadLinkFinder, Link } from '../dead_links/NewDeadLinkFinder';
import { NoteSearcherConfigProvider, NoteSearcherConfig } from './NoteSearcherConfigProvider';

describe('NoteSearcher', () => {
  let ui: MockUi;
  let searcher: tmoq.IMock<NoteIndex>;
  let deadLinkFinder: tmoq.IMock<NewDeadLinkFinder>;
  let configProvider: tmoq.IMock<NoteSearcherConfigProvider>;
  let noteSearcher: NoteSearcher;

  const searcher_returns = (results: string[]) => {
    searcher.setup(s =>
      s.search(tmoq.It.isAnyString()))
      .returns(
        () => Promise.resolve(results)
      );
  };

  const defaultConfig = (): NoteSearcherConfig => ({
    search: {
      useLucene: false
    },
    deadLinks: {
      showOnSave: true
    }
  });

  describe('on extension activated', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('updates index if enabled', () => {
      ui.currentlyOpenDirReturns('some dir');
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => true);
      const index = spyOn(noteSearcher, 'index');

      noteSearcher.notifyExtensionActivated();

      expect(index).toHaveBeenCalled();
    });

    it('prompts user to enable in this directory', () => {
      ui.currentlyOpenDirReturns('some dir');
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => false);
      const promptToActivate = spyOn(noteSearcher, 'promptUserToEnable');

      noteSearcher.notifyExtensionActivated();

      expect(promptToActivate).toHaveBeenCalled();
    });

    it('does not prompt user to enable when no directory is open', () => {
      ui.currentlyOpenDirReturns(null);
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => false);
      const promptToActivate = spyOn(noteSearcher, 'promptUserToEnable');

      noteSearcher.notifyExtensionActivated();

      expect(promptToActivate).not.toHaveBeenCalled();
    });

    it('does not prompt user to enable when already enabled', () => {
      ui.currentlyOpenDirReturns('some dir');
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => true);
      const promptToActivate = spyOn(noteSearcher, 'promptUserToEnable');

      noteSearcher.notifyExtensionActivated();

      expect(promptToActivate).not.toHaveBeenCalled();
    });
  });

  describe('when user enables note searcher via prompt', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('calls enable', async () => {
      const enable = spyOn(noteSearcher, 'enable');
      ui.promptToEnableReturns(true);

      await noteSearcher.promptUserToEnable();

      expect(enable).toHaveBeenCalled();
    });
  });

  describe('when user does not enable note searcher via prompt', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('does not call enable', async () => {
      const enable = spyOn(noteSearcher, 'enable');
      ui.promptToEnableReturns(false);

      await noteSearcher.promptUserToEnable();

      expect(enable).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();
      configProvider.setup(c => c.getConfig()).returns(() => defaultConfig());

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('passes input to searcher', async () => {
      ui.promptForSearchReturns('search phrase');

      await noteSearcher.search();

      searcher.verify(s => s.search('search phrase'), tmoq.Times.once());
    });

    it('does nothing when input is empty', async () => {
      ui.promptForSearchReturns('');

      await noteSearcher.search();

      searcher.verify(s => s.search(tmoq.It.isAnyString()), tmoq.Times.never());
    });

    it('shows search results', async () => {
      ui.promptForSearchReturns('search phrase');
      searcher_returns(['a', 'b', 'c']);

      await noteSearcher.search();

      ui.showedSearchResults(['a', 'b', 'c']);
    });

    it('shows error when search throws', async () => {
      ui.promptForSearchReturns('search phrase');
      const error = new Error('boom');
      searcher.setup(s => s.search(tmoq.It.isAnyString())).throws(error);

      await noteSearcher.search();

      ui.didNotShowSearchResults();
      ui.showedError(error);
    });
  });

  describe('index', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();
      configProvider.setup(c => c.getConfig()).returns(() => defaultConfig());

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('shows indexing in progress', async () => {
      ui.currentlyOpenDirReturns('a directory');

      await noteSearcher.index();

      ui.notifiedIndexingStarted();
      searcher.verify(s => s.index(tmoq.It.isAnyString()), tmoq.Times.once());
    });

    it('displays message when no open folder', async () => {
      ui.currentlyOpenDirReturns(null);

      await noteSearcher.index();

      ui.showedAnyNotification();
      searcher.verify(s => s.index(tmoq.It.isAnyString()), tmoq.Times.never());
    });

    it('displays error when indexing throws', async () => {
      const error = new Error('oh no!');
      ui.currentlyOpenDirReturns('a directory');
      searcher.setup(s => s.index('a directory')).throws(error);

      await noteSearcher.index();

      ui.showedError(error);
    });
  });

  describe('create note id', () => {
    it('should be local time', () => {
      const now = new Date();
      const localHour = now.getHours().toString().padStart(2, '0');

      // ugh...
      const yearPattern = '20\\d\\d';
      const monthPattern = '\\d\\d';
      const dayPattern = '\\d\\d';
      const minutePattern = '\\d\\d';
      const expectedPattern = [
        yearPattern,
        monthPattern,
        dayPattern,
        localHour,
        minutePattern,
      ].join('');
      const regex = new RegExp(expectedPattern);

      // act and assert
      expect(noteSearcher.createNoteId()).toMatch(regex);
    });
  });

  describe('copy link', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('copies link relative to open file', () => {
      ui.getCurrentFileReturns(new MockFile('/a/b/c.md', ''));

      const link = noteSearcher.generateMarkdownLinkTo('/a/b/c/d.md');

      expect(link).toBe('[](c/d.md)');
    });

    it('copies filename only, when no file is open', () => {
      ui.getCurrentFileReturns(null);
      ui.currentlyOpenDirReturns('/a/b');

      const link = noteSearcher.generateMarkdownLinkTo('/a/b/c/d.md');

      expect(link).toBe('[](d.md)');
    });

    it('does not break when no file or directory is open', () => {
      ui.getCurrentFileReturns(null);
      ui.currentlyOpenDirReturns(null);

      noteSearcher.generateMarkdownLinkTo('/a/b/c/d.md');
    });
  });

  describe('show dead links', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();
      configProvider.setup(c => c.getConfig()).returns(() => defaultConfig());

      ui.currentlyOpenDirReturns('a directory');

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('shows dead links', () => {
      deadLinkFinder.setup(d => d.findAllDeadLinks()).returns(() => [
        new Link('/some/path', '/path/to/nowhere')
      ]);

      noteSearcher.showDeadLinks();

      ui.showedDeadLinks();
    });

    it('does not show anything when there are no dead links', () => {
      deadLinkFinder.setup(d => d.findAllDeadLinks()).returns(() => []);

      noteSearcher.showDeadLinks();

      ui.didNotShowDeadLinks();
    });
  });

  describe('when file is saved', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();
      configProvider.setup(c => c.getConfig()).returns(() => defaultConfig());
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => true);

      ui.currentlyOpenDirReturns('a directory');
      deadLinkFinder.setup(d => d.findAllDeadLinks()).returns(() => []);

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('updates index', () => {
      const file = new MockFile('path', 'content');
      const indexSpy = spyOn(noteSearcher, 'index');

      ui.saveFile(file);

      expect(indexSpy).toHaveBeenCalled();
    });

    it('checks for dead links', () => {
      const file = new MockFile('path', 'content');
      const showDeadLinks = spyOn(noteSearcher, 'showDeadLinks');

      ui.saveFile(file);

      expect(showDeadLinks).toHaveBeenCalled();
    });

    it('does not check for dead links when turned off in config', () => {
      const config = defaultConfig();
      config.deadLinks.showOnSave = false;
      configProvider.reset();
      configProvider.setup(c => c.getConfig()).returns(() => config);
      const showDeadLinks = spyOn(noteSearcher, 'showDeadLinks');

      ui.saveFile(new MockFile('path', 'content'));

      expect(showDeadLinks).not.toHaveBeenCalled();
    });

    it('does nothing if updates are disabled', () => {
      configProvider.reset();
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => false);
      const index = spyOn(noteSearcher, 'index');
      const showDeadLinks = spyOn(noteSearcher, 'showDeadLinks');

      ui.saveFile(new MockFile('path', 'content'));

      expect(index).not.toHaveBeenCalled();
      expect(showDeadLinks).not.toHaveBeenCalled();
    });
  });

  describe('when current document changes', () => {
    let delayedExecutor: tmoq.IMock<DelayedExecutor>;

    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();
      delayedExecutor = tmoq.Mock.ofType<DelayedExecutor>();

      ui.currentlyOpenDirReturns('a directory');
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => true);

      noteSearcher = new NoteSearcher(ui,
        searcher.object,
        deadLinkFinder.object,
        configProvider.object,
        delayedExecutor.object);
    });

    it('schedules show related files', async () => {
      ui.currentFileChanged(new MockFile('path', 'content'));

      delayedExecutor.verify(d => d.cancelAll(), tmoq.Times.once());
      delayedExecutor.verify(d =>
        d.executeInMs(tmoq.It.isAnyNumber(), tmoq.It.isAny()), tmoq.Times.once());
    });

    it('does not schedule show related files if disabled', () => {
      configProvider.reset();
      configProvider.setup(c => c.isEnabledInDir(tmoq.It.isAny())).returns(() => false);
      ui.currentFileChanged(new MockFile('path', 'content'));

      delayedExecutor.verify(d => d.cancelAll(), tmoq.Times.never());
      delayedExecutor.verify(d =>
        d.executeInMs(tmoq.It.isAnyNumber(), tmoq.It.isAny()), tmoq.Times.never());
    });
  });

  describe('update related files', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('does not include current file in related files', async () => {
      const currentFile = new MockFile('path/file/a', 'asdf');
      const relatedFiles = [currentFile.path(), 'path/file/b', 'path/file/c'];
      searcher_returns(relatedFiles);

      await noteSearcher.updateRelatedFiles(currentFile);

      ui.showedRelatedFiles(['path/file/b', 'path/file/c']);
    });

    it('does not update files if current file is empty', async () => {
      const currentFile = new MockFile('path/file/a', '');
      const relatedFiles = [currentFile.path(), 'path/file/b', 'path/file/c'];
      searcher_returns(relatedFiles);

      await noteSearcher.updateRelatedFiles(currentFile);

      ui.didNotShowRelatedFiles();
    });
  });

  describe('enable', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('updates config', () => {
      const currentDir = 'my dir';
      ui.currentlyOpenDirReturns(currentDir);

      noteSearcher.enable();

      configProvider.verify(c => c.enableInDir(currentDir), tmoq.Times.once());
    });

    it('runs index', () => {
      const currentDir = 'my dir';
      ui.currentlyOpenDirReturns(currentDir);
      const index = spyOn(noteSearcher, 'index');

      noteSearcher.enable();

      expect(index).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('updates config', () => {
      const currentDir = 'my dir';
      ui.currentlyOpenDirReturns(currentDir);

      noteSearcher.disable();

      configProvider.verify(c => c.disableInDir(currentDir), tmoq.Times.once());
    });
  });

  describe('createTagAndKeywordQuery', () => {
    beforeEach(() => {
      ui = new MockUi();
      searcher = tmoq.Mock.ofType<NoteIndex>();
      deadLinkFinder = tmoq.Mock.ofType<NewDeadLinkFinder>();
      configProvider = tmoq.Mock.ofType<NoteSearcherConfigProvider>();

      noteSearcher = new NoteSearcher(ui,
        searcher.object, deadLinkFinder.object, configProvider.object);
    });

    it('creates query', () => {
      const tags = ['a', 'b', 'c'];
      const keywords = ['d', 'e'];

      const query = noteSearcher.createTagAndKeywordQuery(tags, keywords);

      expect(query).toEqual('#a #b #c d e');
    });

    it('removes overlapping keywords', () => {
      const tags = ['a', 'b', 'c'];
      const keywords = ['c', 'd'];

      const query = noteSearcher.createTagAndKeywordQuery(tags, keywords);

      expect(query).toEqual('#a #b #c d');
    });
  });
});
