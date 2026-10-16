# Changelog

All notable changes to Draftab are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Block background colors**: a click on a block's handle (or on the whole-list bar) opens a small menu with "No color" and six colors (gray, red, orange, yellow, green, blue), each with its own shade in the light and dark themes. Paragraphs, headings, quotes, code blocks, list and checklist items and whole lists can be colored. The color is saved in the note and in backups, but not in the exported `.md`, copies or Copy for WhatsApp. Double-clicking the handle still copies the block.
- **Images** in notes, from web addresses: the note keeps only the address, never the file. Type `![description](url)`, paste an image address on an empty line, or paste an image copied from a page ("Copy image") or HTML with images. Images show at their natural size (at most the note's width), move with the block handle and, when they can't load, show their address in a box. Export as Markdown and plain-text copies write `![description](url)`, Copy for WhatsApp writes the address, and importing a `.md` file reads images on a line of their own. A pasted screenshot or file is ignored. A note with only images is saved like any other.
- **Save web pages**: clicking Draftab's toolbar icon saves the page's main text (without menus, ads or footers) as a new note, and "Save to Draftab" in the right-click menu saves just the selected passage (titled "Excerpt: <page title>", "Trecho:" in Portuguese). The note starts with the page title and a link to the page; headings, lists, quotes, code, links, formatting and images (minus tiny ones like icons and tracking pixels) are kept, tables' layout is not. It opens in a new Draftab tab, next to the page. When nothing can be saved (pages Chrome doesn't let extensions read, like `chrome://` pages and the Web Store, or no main text), no tab opens: the icon shows a red "!" with the reason in its tooltip, plus a notice in the corner of the page when Draftab can run there. New permissions: `activeTab`, `scripting`, `contextMenus`.

### Fixed
- Images whose description has `[` or `]`, or whose title has `"` or `\`, are now written as valid markdown (export, backup, plain-text copies); before, the exported file imported them back as text instead of an image.
- Opening a note that ends in an image no longer selects the image (typing replaced it): the cursor goes on a line after it. With a note open in two tabs, changes arriving from the other tab no longer leave the cursor outside the text.
- Plain-text copies (Cmd/Ctrl+C) keep line breaks made with Shift+Enter; they used to glue the two lines together.

## [1.2.0] — 2026-10-13

Submitted to the Chrome Web Store as an update.

### Added
- **Calculations after `=`**: typing a calculation without spaces followed by `=` (`2*5=`) writes the result right after it (`2*5=10`): `+ - * /`, parentheses and decimals, with the usual precedence. Nothing happens for invalid calculations (like `1/0=`), in code, or when pasting; Backspace right after removes the result. Settings → Calculations ("Cálculos" in Portuguese) turns them off and picks the decimal separator: Automatic (follows the interface language), `.` or `,`; both apply to every open tab and goes into backups.
- **Color swatches**: color codes in the note (`#fff`, `#3a7bd5`, `#3a7bd580`, `rgb(255, 0, 0)`, `rgba(0 0 0 / 50%)`) show a small sample of the color just before them, in text, inline code and code blocks. Nothing changes in the stored note, exports or copies; a code that is also a tag (`#cafe`) stays a tag. "Show color swatches" in Settings → Appearance (on by default) turns them off in every open tab; it goes into backups.
- **Note title in the browser tab**: the tab shows the open note's title, following renames and the first line as you type; a new blank note keeps "New tab".
- **Calendar** at the bottom of the sidebar: a month view (weeks starting on Sunday, today marked) with previous/next month buttons; clicking the month name goes back to the current month. Clicking a day inserts the date at the cursor in the note. In Settings, a "Calendar" section shows or hides it and picks the date format: numeric (`13/10/2026` / `10/13/2026`), ISO (`2026-10-13`), short month (`13 out 2026`) or long (`terça-feira, 13 de outubro de 2026`), following the interface language. Both settings apply to every open tab and go into backups.

### Changed
- The extension's description (Chrome and the store summary) now mentions tags, calculations and the calendar.
- **Copy for WhatsApp** leaves one blank line between blocks (paragraphs, lists, quotes…), so they no longer come out stuck together; list items stay together, and empty lines in the note don't add more.
- The note list now scrolls on its own between the search and the bottom of the sidebar (before, the whole sidebar scrolled).

## [1.1.0] — 2026-10-13

Published on the Chrome Web Store as an update.

### Added
- **Clickable tags**: `#tags` in notes (a letter after `#`, then letters, digits, `_` or `-`) show in gray monospace, like links (underline and hand cursor on hover); Cmd/Ctrl+click on one searches for it in the sidebar, opening the sidebar if it's collapsed. The note's content doesn't change.
- **Tag suggestions in the search**: typing `#` in the search lists the tags in the notes that start with what was typed, most used first, with the number of notes. ↑/↓ and Enter/Tab (or a click) complete the word, keeping the rest of the search; Esc closes the list.
- **The sidebar hides while typing**: typing in the note hides the sidebar, and moving the mouse brings it back. A sidebar collapsed with the button stays collapsed. Opening or closing the sidebar no longer moves the note's text, and the sidebar button shows when it's collapsed for good.
- **Portuguese interface**: "Language" in Settings — Automatic (follows Chrome; the default), English or Português. Every text of the interface and the date and number formats follow it; changing it reloads the open tabs in the new language. The language goes into backups.
- **Pin notes**: a pin button on each note in the sidebar, or at the top right of the note page, keeps it at the top of the list, with a pin in place of the date and a divider before the other notes. Pinned notes follow the chosen sort order among themselves. Pinning doesn't change the note's "last modified", syncs across open tabs and goes into backups.
- **Note sort order** in Settings: last modified (default), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created. The date next to each note follows the order, and every open tab re-sorts immediately.
- **Font per note**: sans-serif (default), serif or monospace, using system fonts (SF Pro / New York / SF Mono on macOS). The "Aa" button at the top right of the note page switches the open note's font; each note keeps its own, in every tab and in backups, without a flash of the wrong font on open. "Font of new notes" in Settings sets the font new notes start with. Notes from before keep the font that was set in Settings.
- **Double-click a handle to copy**: double-clicking a block's handle selects its content and copies it like Cmd/Ctrl+C (formatted and plain text); double-clicking the whole-list bar copies the whole list. A small "Copied" label confirms it.
- **Backspace undoes headings, code blocks and quotes**: with the cursor at the start of a heading, Backspace turns it into a paragraph with the same text; at the start of a code block, into normal text, one paragraph per line; at the start of a quote, the whole quote becomes normal paragraphs. Cmd/Ctrl+Z brings the block back.
- **Import a file as a note**: an import icon to the left of the New note button turns a `.md` file (read as markdown) or a `.txt` file (one paragraph per line) into a new note and opens it.
- **Export and copy buttons on the note page**: at the top right, Export as Markdown downloads the open note as a `.md` file named after its title (unsaved typing included), and Copy note copies it without the first line (the title) and the empty lines right after it, formatted for apps that accept formatting and as markdown for plain-text ones.
- **Copy for WhatsApp** on the note page: a chat-bubble button next to Copy note copies the note in WhatsApp's formatting (`*bold*`, `_italic_`, `~strikethrough~`, `` `code` ``, headings as bold lines, `- ` / `1. ` / `☐` lists, `> ` quotes), leaving out the first line (the title).
- **Character counts** at the bottom right of the note page: total characters with markdown marks (the same text as the exported file), without markdown, and, while text is selected, how many are selected.
- **Text size per note**: A− / A+ buttons at the top right of the note page, with the current size between them (also Cmd/Ctrl+Shift+, and Cmd/Ctrl+Shift+.), make the note's text smaller or bigger, from 80% to 150%. Each note keeps its own size, in every tab and in backups. "Text size of new notes" in Settings sets the size new notes start with; existing notes keep theirs.
- **Strikethrough and underline shortcuts**: typing or pasting `++text++` underlines it (before, only Cmd/Ctrl+U did), and `~~text~~` strikes it through (already worked, now documented). In `.md` files they are `~~` and `++` too.
- The new settings are included in backups.

### Changed
- A little more space between paragraphs in notes (0.5em instead of 0.25em); list items stay as close as before.
- Backup export and import moved to Settings only; the sidebar's backup icons are gone.
- Settings: the import button reads "Import backup" (no ellipsis).
- The sidebar is a little wider (300 px instead of 260 px), and the row with the search sits between two dividers (inset from the edges, like the one after the pinned notes). While the search has the focus or any text, it widens to the whole row, hiding the import and new note buttons.

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

First public version, published on the Chrome Web Store.

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
