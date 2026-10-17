# Changelog

All notable changes to Draftab are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Power and remainder in calculations**: `2^10=` (or `2**10=`) and `7%3=` now work, following the usual math rules.

### Changed
- **Feature backlog** (project docs only, the extension doesn't change): `FEATURES.md` is now `BACKLOG.md`, managed with the `backlog` skill.

## [1.3.0] — 2026-10-16

Submitted to the Chrome Web Store as an update.

### Added
- **New notes start with a heading**: a blank note opens with an empty level-1 heading as its first line; a setting turns it off.
- **Highlight**: selecting text shows a bar with six colors (also Cmd/Ctrl+Shift+H); highlights are kept in notes and backups.
- **Images** from web addresses: typed as `![description](url)` or pasted; the note keeps only the address, never the file.
- **Save web pages**: the toolbar icon saves the page's main text as a new note, and "Save to Draftab" in the right-click menu saves the selected passage. New permissions: `activeTab`, `scripting`, `contextMenus`.

### Changed
- The extension's description now mentions highlights, images and saving web pages.

### Fixed
- The store package no longer includes a macOS `.DS_Store` file.
- The block handle no longer shows in the corner of the note when a tab opens with the mouse outside the note.
- Images whose description or title has special characters export as valid markdown, so they import back as images.
- Opening a note that ends in an image no longer selects the image (typing replaced it), and changes from another tab no longer leave the cursor outside the text.
- Plain-text copies keep line breaks made with Shift+Enter.

## [1.2.0] — 2026-10-13

Submitted to the Chrome Web Store as an update.

### Added
- **Calculations after `=`**: typing `2*5=` writes the result after it; a setting turns them off and picks the decimal separator.
- **Color swatches**: color codes in the note (`#3a7bd5`, `rgb(…)`) show a sample of the color next to them.
- **Note title in the browser tab**, following renames and the first line as you type.
- **Calendar** at the bottom of the sidebar: clicking a day inserts the date in the note, in the format chosen in Settings.

### Changed
- The extension's description now mentions tags, calculations and the calendar.
- **Copy for WhatsApp** leaves a blank line between blocks, so they no longer come out stuck together.
- The note list scrolls on its own, instead of the whole sidebar.

## [1.1.0] — 2026-10-13

Published on the Chrome Web Store as an update.

### Added
- **Clickable tags**: Cmd/Ctrl+click on a `#tag` searches for it in the sidebar.
- **Tag suggestions in the search**: typing `#` lists the tags in the notes, most used first.
- **The sidebar hides while typing** and comes back when the mouse moves.
- **Portuguese interface**, chosen in Settings (automatic by default).
- **Pin notes** to keep them at the top of the list.
- **Note sort order** in Settings: last modified, title A–Z or date created.
- **Font per note**: sans-serif, serif or monospace, plus a font for new notes in Settings.
- **Double-click a handle to copy** a block or a whole list.
- **Backspace undoes headings, code blocks and quotes** when the cursor is at their start.
- **Import a file as a note**: a `.md` or `.txt` file becomes a new note.
- **Export and copy buttons on the note page**: download the note as `.md`, or copy it without its title.
- **Copy for WhatsApp**: copies the note in WhatsApp's formatting.
- **Character counts** at the bottom of the note page, with and without markdown, and for the selection.
- **Text size per note** (80% to 150%), plus a size for new notes in Settings.
- **Strikethrough and underline shortcuts**: `~~text~~` and `++text++`.
- The new settings are included in backups.

### Changed
- A little more space between paragraphs.
- Backup export and import moved to Settings; manual and automatic backup are one section there.
- The sidebar is a little wider, and the search widens to the whole row while in use.
- **Typography** based on Tailwind Typography, adapted for notes.
- Drag handles have a bigger clickable area.
- Open tabs update only the note that changed, instead of reading every note again.
- Plain-text copies put one line per block instead of blank lines between blocks.

### Removed
- The light/dark button next to the sidebar toggle; the theme is chosen in Settings.

### Fixed
- Drag and drop picks the drop position closest to the mouse, measures checklists correctly, and no longer cancels a whole-list drag on the first movement.

## [1.0.0] — 2026-10-11

First public version, published on the Chrome Web Store.

### Added
- **New tab notepad**: every new tab opens a blank note; blank notes are never saved.
- **Markdown block editor** (Tiptap 3): headings, lists, checklists, quotes, code, dividers, formatting and links.
- **Drag to reorder** blocks, list items and whole lists.
- **Sidebar** with search, rename, delete and collapse.
- **Sync across tabs**, and reloading reopens the same note.
- **Backup**: export and import a JSON file with all notes and settings.
- **Automatic backup** to `Downloads/draftab-backups/`, even with the tab closed.
- **Settings**, including deleting all notes.
- **Light, dark and automatic theme**, with a quick toggle next to the sidebar button.
- Store listing, privacy policy, icons and `npm run zip` packaging.
- Open source under the **MIT license**.

## Development history before 1.0.0

Draftab was built in stages (commits named "Stage N: …"), all on 2026-10-11. Early commit messages are in Portuguese; the project moved to English right before the first release.

| Stage | What came in | Commits |
|---|---|---|
| Setup | Specification, plan and project configuration | `6c35f12` |
| 1. Walking skeleton | Vite + TypeScript, MV3 new tab override, basic Tiptap editor | `703792c` |
| 2. Block editor + drag | All markdown blocks, drag handle on every block, animated reordering, whole lists and blocks across levels; fixed links without a protocol and handles missing on non-list blocks | `42e46c6` … `05785e2` |
| 3. Persistence and note list | `chrome.storage` layer, sidebar with search, rename and delete, sync across tabs, minimalist icons; fixed lost keystrokes when typing fast right after creating a note | `9665354` … `ce3af66` |
| 4. Manual backup | Export and import with validation; fixed an extra reload on the very first save | `4bb8973`, `c402538` |
| — | Feature backlog (`FEATURES.md`) | `cef0a23`, `fae7bb6` |
| 5. Automatic backup | Service worker with alarms and downloads, Settings lightbox, delete all notes | `dcaefc8` … `b4d0945` |
| 6. Dark theme | Color variables, dark and automatic themes, theme toggle, settings in backups | `c7bdc91` … `d1c6d3a` |
| — | MIT license, README for GitHub | `844afe9` … `28b0f90` |
| — | Whole project translated to English | `65a6879` |
| 7. Ready to publish | Version 1.0.0, icons, localized description, privacy policy, store texts and images, `npm run zip` | `18f6994` … `fc81b6b` |

[1.1.0]: https://github.com/ramonk2o/draftab/compare/1.0.0...HEAD
[1.0.0]: https://github.com/ramonk2o/draftab/tree/fc81b6b
