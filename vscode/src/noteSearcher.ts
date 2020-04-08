import { NoteSearcherUi, File } from "./ui/NoteSearcherUi";
import { SearchService } from "./searchService";
import { extractTags } from "./text_processing/tagExtractor";
import { extractKeywords } from "./text_processing/keywordExtractor";
import { newDiagnostics, Diagnostics } from "./diagnostics/diagnostics";
import { DelayedExecutor } from "./utils/delayedExecutor";
import { GoodSet } from "./utils/goodSet";
import { DeadLinkFinder } from "./DeadLinkFinder";

const UPDATE_RELATED_FILES_DELAY_MS = 500;

export class NoteSearcher {
  private previousQuery = '';
  private diagnostics: Diagnostics;

  constructor(
    private ui: NoteSearcherUi,
    private searcher: SearchService,
    private deadLinkFinder: DeadLinkFinder,
    private delayedExecutor: DelayedExecutor = new DelayedExecutor())
  {
    ui.addCurrentDocumentChangeListener(this.notifyCurrentFileChanged);
    ui.addDocumentSavedListener(this.notifyFileSaved);
    this.diagnostics = newDiagnostics('noteSearcher');
  }

  public search = async () => {
    const input = await this.ui.promptForSearch(this.previousQuery);
    if (!input) {
      return;
    }
    this.previousQuery = input;
    try {
      const results = await this.searcher.search(input);
      await this.ui.showSearchResults(results);
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

    this.ui.showNotification('indexing current folder...');

    try {
      await this.searcher.index(folder);
      this.ui.showNotification('indexing complete');
      this.diagnostics.trace('indexing complete');
    }
    catch (e) {
      await this.ui.showError(e);
    }
  };

  public updateRelatedFiles = async (file: File) => {
    this.diagnostics.trace('updating related files');

    const text = file.text();

    if (text.length === 0) { return; }

    const relatedFiles = await this
      .searchForRelatedFiles(text)
      .then(results => results
        .filter(r => r !== file.path()));

    this.diagnostics.trace('showing related files');
    this.ui.showRelatedFiles(relatedFiles);
  };

  public showDeadLinks = () => {
    this.diagnostics.trace('show dead links');
    const root = this.ui.currentlyOpenDir();
    if (!root) {
      this.diagnostics.trace('show dead links: no open directory');
      return;
    }

    const deadLinks = this.deadLinkFinder.findDeadLinks(root);
    if (deadLinks.length === 0) {
      this.diagnostics.trace('show dead links: no dead links');
      return;
    }

    const deadLinkMessage = deadLinks
      .map(d => `${d.sourcePath}:${d.sourceLine}: dead link to ${d.targetPath}`)
      .join('\n');

    this.ui.showError(new Error(deadLinkMessage));
  };

  public createTagAndKeywordQuery = (tags: string[], keywords: string[]) => {
    const keywordsMinusTags = Array.from(
      new GoodSet(keywords).difference(new GoodSet(tags))
    );
    const tagsWithHashes = tags.map(tag => '#' + tag);
    return tagsWithHashes.concat(keywordsMinusTags).join(' ');
  };

  private notifyCurrentFileChanged = (file: File) => {
    this.diagnostics.trace('file changed');

    this.delayedExecutor.cancelAll();
    this.delayedExecutor.executeInMs(UPDATE_RELATED_FILES_DELAY_MS,
      () => this.updateRelatedFiles(file));
  };

  private notifyFileSaved = (file: File) => {
    this.diagnostics.trace('file saved');
    this.index();
    this.showDeadLinks();
  };

  private searchForRelatedFiles = async (text: string) => {
    const tags = extractTags(text);
    const keywords = await extractKeywords(text);
    const query = this.createTagAndKeywordQuery(tags, keywords);

    return await this.searcher.search(query);
  };
}
