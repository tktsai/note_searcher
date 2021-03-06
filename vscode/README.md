# Note Searcher

Tool for managing a knowledge base of text files, such as a zettelkasten. Works
with a flat or hierarchical file structure. Similar to:

- [The Archive](https://zettelkasten.de/the-archive/)
- [Zettlr](https://www.zettlr.com/)
- [Foam](https://foambubble.github.io/foam/)


## Feature summary

- Full text search
- Quick-create notes
- Tag autocompletion
- Copy markdown link to note from search results
- Copy markdown link to note from editor tab
- Shows backlinks in sidebar
- Shows dead links in sidebar
- Shows all tags in sidebar


## How to use this extension

![extension screenshot](./img/ext_screenshot.png)

![create a new note](./img/new_note.png)

![tag autocompletion](./img/tag_autocomplete.png)


### Full text search

When active, this extension indexes all .md, .txt and .log files in the
currently open folder.

You can search for files by pressing `ctrl+alt+s`. Some example queries:

```
apple banana +carrot  # file contains the word carrot, and possibly apple or banana
apple banana -carrot  # file does not contain carrot, but either apple and/or banana
apple banana #food    # file contains apple, banana, and/or the tag #food
```


### Tags

Any word starting with a '#' character is considered a tag, allowing for
tag-based searching. #hyphenated-tags are supported.

When note searcher is enabled, typing '#' will show a list of tags which have
been found in other files.

All existing tags are shown in the sidebar, as per the screenshot.


### Creating notes

Press `ctrl+alt+n` to create a new note in the same directory as the currently
open note.


### Linking notes

With VS Code, you can add links to local files using markdown
syntax. These become hyperlinks to your local files. Examples:

- `[](path/relative/to/file)`

You can copy a markdown-style link to a search result by right-clicking on
the search result. You can also copy this link from an editor tab.


### Backlinks

Links to the currently open note are shown in backlinks section of the sidebar.


### Find dead links

Markdown links to files that can't be found are shown in the dead links section
of the sidebar.


## UNDER CONSTRUCTION

This extension is still under development, and has a bunch of rough edges.
If you find any problems or have any questions, please create an issue at
https://github.com/uozuAho/note_searcher/issues
