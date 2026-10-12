# Changelog

All notable changes to Draftab are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] — unreleased

Ready to upload to the Chrome Web Store as an update.

### Added
- **Note sort order** in Settings: last modified (default), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created. The date next to each note follows the order, and every open tab re-sorts immediately.
- **Note font** in Settings: sans-serif (default), serif or monospace, using system fonts (SF Pro / New York / SF Mono on macOS). Applies to note content only, in every open tab, without a flash of the wrong font on open.
- **Double-click a handle to copy**: double-clicking a block's handle selects its content and copies it like Cmd/Ctrl+C (formatted and plain text); double-clicking the whole-list bar copies the whole list. A small "Copied" label confirms it.
- **Export a note as Markdown**: a button on each note in the sidebar (on hover, between rename and delete) downloads it as a `.md` file named after its title. Unsaved typing in the open note is included.
- **Backspace undoes code blocks and quotes**: with the cursor at the start of a code block, Backspace turns it into normal text, one paragraph per line; at the start of a quote, the whole quote becomes normal paragraphs. Cmd/Ctrl+Z brings the block back.
- **Import a file as a note**: the import icon at the top of the sidebar now turns a `.md` file (read as markdown) or a `.txt` file (one paragraph per line) into a new note and opens it.
- The new settings are included in backups.

### Changed
- Backup export and import moved to Settings only; the sidebar's export backup icon is gone and its import icon now imports a single note (see above).
- Settings: manual and automatic backup are one "Backup" section, with shorter explanations in a slightly smaller font; the interval label reads "Automatic backup" instead of "Back up".
- **Typography** rewritten on the proportions of [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography), adapted for notes: quotes get breathing room above and below, clearer heading hierarchy, and more comfortable spacing for lists, code blocks and dividers. Paragraphs stay close together, since every Enter creates a paragraph.
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

Draftab was built in stages (see [PLAN.md](PLAN.md)), all on 2026-10-11. Early commit messages are in Portuguese; the project moved to English right before the first release.

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
