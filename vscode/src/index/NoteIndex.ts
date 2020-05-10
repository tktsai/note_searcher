import * as path from 'path';

import { CliNoteIndex } from './CliNoteIndex';
import { NoteSearcherConfigProvider } from '../note_searcher/NoteSearcherConfigProvider';
import { LunrNoteIndex } from './lunrNoteIndex';
import { createFileSystem } from '../utils/FileSystem';

export interface NoteIndex {
  search: (query: string) => Promise<string[]>;
  index: (dir: string) => Promise<void>;
}

/**
 * @param extensionDir location of this vscode extension's directory
 */
export const createNoteIndex = (
  extensionDir: string,
  config: NoteSearcherConfigProvider
): NoteIndex =>
{
  if (config.getConfig().search.useLucene) {
    const jarPath = path.join(extensionDir, 'dist/note_searcher.jar');
    return new CliNoteIndex(jarPath);
  } else {
    return new LunrNoteIndex(createFileSystem());
  }
};
