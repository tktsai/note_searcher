# Notes searcher

Full-text and tag-based searching of arbitrary directories and files.
Lets you make your own zettelkasten! Inspired by https://zettelkasten.de/.

Runs in VS code as an extension.


# projects

See each project dir for detailed docs. To build the whole lot:

> ./build.all.sh

This will build a vscode extension (vsix) in this directory, which
you can install from vscode.

## vscode

VS code extension

## cli

Console app that does indexing and searching


# todo
- ci pipeline
- feature: copy link from editor tab
- feature: suggest tags in search
    - not yet available: https://github.com/microsoft/vscode/issues/35785
- dead links: don't show as error
    - then document the feature
- moving indexing progress to status bar
    - https://code.visualstudio.com/updates/v1_22#_show-long-running-operations-as-notifications-with-cancellation-support
- feature: extract text to new note
- show view container on search complete, even if no search results
- choose search engine:
    - lunr:   pros: no deps, simple implementation
              cons: slow, no incremental index (must rebuild from scratch)
    - lucene: pros: fast, powerful
              cons: needs java, complex impl (compared to lunr)
- e2e test throws unhandled promise rejection after test completes
- support wiki-style links, with id only (for archive users)
- docs
    - get readme working in extension preview in vscode
    - make screenshot show in extension preview
    - prevent github link replacement in example file links
- separate view for search results + related files etc.
    - I want to see file tree at same time
    - search box in results view. not supported in tree view
- bug: '+' operator not working as expected:
    - using lucene
    - search for #work: no results
    - search for book: many results
    - search for +#work book:
        - expected: no results
        - actual:   many results
- bug: search before index breaks - re-index if there's an index problem
- dead links: strip root path when showing dead links
- highlight dead links while editing
- show incoming/outgoing links
