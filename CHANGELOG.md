# Changelog

All notable changes to Draftab are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] — unreleased

Ready to upload to the Chrome Web Store as an update.

### Added
- **Clickable tags**: `#tags` in notes (a letter after `#`, then letters, digits, `_` or `-`) show in monospace and in their own color; Cmd/Ctrl+click on one searches for it in the sidebar, opening the sidebar if it's collapsed. The note's content doesn't change.
- **Pin notes**: a pin button on each note in the sidebar, or at the top right of the note page, keeps it at the top of the list, with a pin in place of the date and a divider before the other notes. Pinned notes follow the chosen sort order among themselves. Pinning doesn't change the note's "last modified", syncs across open tabs and goes into backups.
- **Note sort order** in Settings: last modified (default), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created. The date next to each note follows the order, and every open tab re-sorts immediately.
- **Font per note**: sans-serif (default), serif or monospace, using system fonts (SF Pro / New York / SF Mono on macOS). The "Aa" button at the top right of the note page switches the open note's font; each note keeps its own, in every tab and in backups, without a flash of the wrong font on open. "Font of new notes" in Settings sets the font new notes start with. Notes from before keep the font that was set in Settings.
- **Double-click a handle to copy**: double-clicking a block's handle selects its content and copies it like Cmd/Ctrl+C (formatted and plain text); double-clicking the whole-list bar copies the whole list. A small "Copied" label confirms it.
- **Backspace undoes code blocks and quotes**: with the cursor at the start of a code block, Backspace turns it into normal text, one paragraph per line; at the start of a quote, the whole quote becomes normal paragraphs. Cmd/Ctrl+Z brings the block back.
- **Import a file as a note**: an import icon to the left of the New note button turns a `.md` file (read as markdown) or a `.txt` file (one paragraph per line) into a new note and opens it.
- **Export and copy buttons on the note page**: at the top right, Export as Markdown downloads the open note as a `.md` file named after its title (unsaved typing included), and Copy note copies it without the first line (the title) and the empty lines right after it, formatted for apps that accept formatting and as markdown for plain-text ones.
- **Copy for WhatsApp** on the note page: a chat-bubble button next to Copy note copies the note in WhatsApp's formatting (`*bold*`, `_italic_`, `~strikethrough~`, `` `code` ``, headings as bold lines, `- ` / `1. ` / `☐` lists, `> ` quotes), leaving out the first line (the title).
- **Character counts** at the bottom right of the note page: total characters with markdown marks (the same text as the exported file), without markdown, and, while text is selected, how many are selected.
- **Text size per note**: A− / A+ buttons at the top right of the note page, with the current size between them (also Cmd/Ctrl+Shift+, and Cmd/Ctrl+Shift+.), make the note's text smaller or bigger, from 80% to 150%. Each note keeps its own size, in every tab and in backups. "Text size of new notes" in Settings sets the size new notes start with; existing notes keep theirs.
- The new settings are included in backups.

### Changed
- Backup export and import moved to Settings only; the sidebar's backup icons are gone.
- Settings: the import button reads "Import backup" (no ellipsis).
- The sidebar is a little wider (300 px instead of 260 px), and the row with the search sits between two dividers.

### Removed
- The light/dark button next to the sidebar toggle; the theme is chosen in Settings.
- Settings: manual and automatic backup are one "Backup" section, with shorter explanations in a slightly smaller font; the interval label reads "Automatic backup" instead of "Back up".
- **Typography** rewritten on the proportions of [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography), adapted for notes: quotes get breathing room above and below, clearer heading hierarchy, and more comfortable spacing for lists, code blocks and dividers. Paragraphs stay close together, since every Enter creates a paragraph.
- Drag handles sit a little further from the text and have a bigger clickable area, which the mouse can reach without the handle disappearing; the whole-list bar sits closer to its list.
- Open tabs update their note list with just the note that changed, instead of reading every note again after each autosave.
- Plain-text copies (including Cmd/Ctrl+C) now put one line per block instead of separating blocks with blank lines.

### Fixed
- Drag and drop: when two drop positions were at the same indentation, the first one in the list won instead of the one closest to the mouse.
- Drag and drop: checklists were measured by their checkbox edge, which made them easy to confuse with the note level when taking an item out of a list.
- Dragging a whole list could be cancelled if the first mouse movement left the list's height.

## [1.0.0] — 2026-10-11

First public version, submitted to the Chrome Web Store.

### Added
- **New tab notepad**: every new tab opens a blank note with the cursor ready; blank notes are never saved.
- **Markdown block editor** (Tiptap 3): headings, bulleted and numbered lists, checklists (`[ ]` and `- [ ]`), quotes, code blocks, dividers, bold, italic, inline code and links (`[text](url)`, opened with Cmd/Ctrl + click; addresses without a protocol get `https://`).
- **Drag to reorder** with an animation that opens space where the block will land; list items have their own handle, a bar moves whole lists, and items and paragraphs can move in and out of lists (with conversions between list, checklist and paragraph, and adjacent lists merged).
- **Sidebar** with notes by last edit, accent-insensitive search across titles and content, rename (automatic title from the first line until renamed), delete with confirmation, and collapse.
- **Sync across tabs**: edits in one tab show up in the others (last write wins); reloading reopens the same note.
- **Backup**: export and import a JSON file with all notes and settings (each note also in markdown); importing validates the file, asks for confirmation and reloads open tabs. File name: `draftab_YYYY-MM-DD-HHhMM.json`.
- **Automatic backup** to `Downloads/draftab-backups/` every minute, hour, day, week or month, only when something changed, even with the tab closed.
- **Settings** in a lightbox, including **delete all notes** with a typed confirmation.
- **Light, dark and automatic theme**, with a quick toggle next to the sidebar button and no flash on open.
- Store listing, privacy policy, icons and `npm run zip` packaging with third-party license notices.
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
