# Change Log

All notable changes to the "note-searcher" extension will be documented in this
file. Format inspired by https://keepachangelog.com/en/1.0.0/


## [Unreleased]

## [0.0.13] - 2020-05-24
### Fixed
- deleted tags showing up in tag completion

## [0.0.12] - 2020-05-10
### Added
- tag completion within notes

### Changed
- Show search results container when search completes. Only works if there's
  at least one search result :(

## [0.0.11] - 2020-05-06
### Changed
- created note is saved in same directory is currently open note
- if notes are open, created note is saved in root directory

## [0.0.10] - 2020-05-03
### Added
- copy markdown link from search result

## [0.0.9] - 2020-05-02
### Added
- create a new note

## [0.0.8] - 2020-04-26
### Changed
- Removed Java dependency by using lunr search engine
- Added config option `noteSearcher.search.useLucene` (defaults to false)

## [0.0.7] - 2020-04-19
### Added
- support for hyphenated tags, eg. #public-speaking

## [0.0.6] - 2020-04-12
### Added
- commands to enable/disable indexing in the current directory
- prompt to enable indexing in current directory

### Fixed
- search doesn't work after opening new folder: index is now updated on activation

## [0.0.5] - 2020-04-10
### Added
- Show dead links on save (undocumented)

## [0.0.4] - 2020-04-05
### Fixed
- remove local search index from distributed package

## [0.0.3] - 2020-04-05
### Fixed
- 'command not found' on any extension action

## [0.0.2] - 2020-04-04
- Initial release (broken!)
