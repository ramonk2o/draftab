# Draftab

## Goal
Chrome extension that replaces the new tab with a local notepad: a markdown-friendly block editor with drag-to-reorder blocks. Open source, published on the Chrome Web Store.

## About this document
How Draftab behaves today, as rules (not visual details), plus the data model and the technical decisions. A change of behavior or decision is written here before the code. Ideas live in FEATURES.md; what changed and when lives in CHANGELOG.md and the git history.

## Behavior

### Notes and the sidebar
- A new tab opens a blank note with the cursor in the editor.
- An empty note (no text and no user-set title) isn't saved: opening and closing a tab leaves no clutter, and a saved note that becomes empty leaves the list.
- Autosave: the first keystroke creates the note right away; after that, ~500 ms after typing stops. Pending typing is saved when the tab is hidden or closed.
- Several tabs at once: changes made in one tab show up in the others (last write wins). A note deleted in another tab is replaced by a blank note.
- Reloading the tab reopens the same note (its id is kept in the tab's `sessionStorage`, which survives reloads and is cleared when the tab closes).
- Title: while the user hasn't set one, it follows the first line of text (up to 80 characters). Renaming fixes it; renaming to empty goes back to the automatic title.
- The sidebar lists the notes, with search (title and content, ignoring case and accents), New note, rename (double-click the title or the pencil button; Enter confirms, Esc cancels) and delete with confirmation.
- Sort order (chosen in Settings): last modified (default, newest first), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created (newest first). The date next to each note follows the order: the creation date when sorting by date created, the last edit otherwise.
- Pinned notes: a pin button on each note in the sidebar, and one at the top right of the note page (for the open note, marked while it's pinned), pins or unpins it. Pinned notes come first, sorted among themselves by the chosen order, then the others; a divider separates the two groups when both have notes. A pinned note shows a pin instead of its date. Search keeps the same grouping. Pinning or unpinning doesn't count as an edit ("last modified" doesn't change); it applies to every open tab and goes into backups.
- The sidebar can be collapsed; its state is remembered.
  - Typing in the note hides the sidebar if it's showing; moving the mouse brings it back. This automatic hiding isn't remembered (a reload shows the sidebar). A sidebar collapsed with the button stays collapsed until reopened with the button (or a tag search).
- Import a file as a note (next to New note): one `.md` or `.txt` file becomes a new note, which opens.
  - `.md` / `.markdown` is read as markdown (headings, lists, checklists, quotes, code, dividers, marks, links); headings smaller than `###` become `###`. If something in it can't become a Draftab block, the file is read as plain text instead.
  - `.txt` is plain text: each line becomes a paragraph. Windows and old Mac line breaks are accepted.
  - The title is automatic and the text size is the one set for new notes. An empty file creates nothing and shows a message.

### Editor
- Markdown shortcuts turn into blocks while typing: `#`/`##`/`###`, `-`, `1.`, `- [ ]`, `>`, ` ``` `, `---`, `**bold**`, `*italic*`, `` `code` ``, links. Cmd/Ctrl+click opens a link in a new tab (an address without a protocol gets `https://`).
- Backspace at the start of a code block turns it into normal text, one paragraph per line. At the start of a quote's first paragraph, the whole quote becomes normal paragraphs; at the start of a later one, that paragraph leaves the quote, splitting it. Backspace right after typing a shortcut undoes the shortcut (Tiptap's behavior). Each change is its own undo step.
- Dragging blocks: each block shows a handle on hover; dragging it moves the block and the new order is saved.
  - List items have their own handle. A bar to the left of a list drags the whole list. Inside a quote, the handle moves the whole quote.
  - While dragging, neighboring blocks slide to open space where the block will land.
  - Items and paragraphs can change level: the mouse height picks the position; at the edges of a list, moving right puts the block inside it and moving left takes it out.
  - Conversions: an item that leaves a list stays an item, in a list of its own; a paragraph that enters a list becomes an item; list item ↔ checklist item depending on the target list. Adjacent lists of the same type are merged.
  - Headings, quotes, code, dividers and whole lists don't go into lists.
- Double-clicking a block's handle selects the block's content and copies it exactly like Cmd/Ctrl+C (formatted, plus plain text). The whole-list bar does the same for the whole list. A block without text (a divider) is selected and copied whole. A "Copied" label confirms it.
- Plain-text copies (including Cmd/Ctrl+C) have one line per block.
- Tags: `#` followed by a letter, then letters, digits, `_` or `-` (e.g. `#idea`, `#project-x`), at the start of a line or after a space. Not in code (inline or block). Tags stay plain text in the note (nothing changes in the stored content or in exports); the editor only shows them differently, like links. Cmd/Ctrl+click on a tag puts it in the sidebar search (opening the sidebar if it's collapsed); a plain click places the cursor, so the tag can be edited. The search stays a text search: `#proj` also finds `#project`.
- Tag suggestions in the search: while the word at the cursor in the search starts with `#`, a list under the field suggests the tags in the notes that start with it (ignoring case and accents; `#` alone shows all), most used first (number of notes, shown next to each), ties A–Z, up to 8. Tags that differ only in case or accents are one tag. A tag that's exactly what was typed isn't suggested. ↑/↓ move through the list, Enter or Tab (or a click) replace the word with the tag, keeping the rest of the search; Esc or leaving the field closes the list.

### The note page
- Export as Markdown: downloads the open note as `<title>.md` through a normal browser download, with the same markdown the backup's `markdown` field gets. Pending typing is saved first. The file name drops characters not allowed in file names (`/ \ : * ? " < > |` and control characters), has at most 100 characters, and is `Untitled.md` when nothing is left. Exporting is only on the note page, not in the note list.
- Copy note: copies the note without its first block (the first line, usually the title) and the empty lines right after it, formatted (HTML) for apps that accept it and as markdown for plain-text apps. A "Copied" label confirms it. Export as Markdown still includes the whole note.
- Copy for WhatsApp: copies the note as plain text in WhatsApp's formatting, without its first block (the first line, usually the title) and the empty lines right after it. A "Copied" label confirms it.
  - Bold `*x*`, italic `_x_`, strikethrough `~x~`, inline code `` `x` ``; underline has no equivalent and becomes plain text. Spaces at the edges of a formatted piece stay outside the marks (WhatsApp ignores marks next to a space).
  - Headings become a bold line. Bullet list `- `, numbered list `1. `, checklist `☐ ` / `☑ `; nested levels are indented 2 spaces per level. Quote: each line starts with `> `. Code block between ` ``` `. Divider `———`.
  - Link: `text (url)`, or only the url when the text is the url itself.
  - One line per block, like the plain-text copy; an empty paragraph is an empty line.
- Export, copy and pin are disabled while the note is empty (an empty note isn't saved).
- Text size of the note: smaller (A−) and bigger (A+) buttons with the current size between them, also Cmd/Ctrl+Shift+, (smaller) and Cmd/Ctrl+Shift+. (bigger). Cmd/Ctrl + and − stay Chrome's zoom.
  - Steps, relative to the note font's normal size: 80%, 90%, 100%, 110%, 120%, 135%, 150%. One step per click; the button is disabled at the end of the range.
  - The size belongs to the note: each note keeps its own, in every tab and in backups. Changing it counts as an edit (saved right away, updates "last modified"). On a new note not saved yet, the size is saved with the first keystroke.
  - Only the note content changes size (headings, lists, code… keep their proportions).
- Font of the note: an "Aa" button to the left of the text size switches the open note's font to the next one (Sans-serif → Serif → Monospace → Sans-serif); a small label shows the new font's name. Same fonts as described under "Settings and backup".
  - The font belongs to the note, like the text size: each note keeps its own, in every tab and in backups. Changing it counts as an edit (saved right away, updates "last modified"). On a new note not saved yet, the font is saved with the first keystroke.
  - Notes from before fonts were per note (no `font` of their own) use the font that was set in Settings at the time ("note font" before this change).
- Character counts at the bottom of the page, e.g. "1,234 characters · 1,180 without markdown · 42 selected":
  - Characters: the whole note as markdown, marks included — the same text as the exported file.
  - Without markdown: the plain text, with one line break between blocks — the same text as a plain-text copy.
  - Selected: only while there's a text selection, counted like "without markdown".
  - Spaces and line breaks count; line breaks at the end of the note (or of the selection) don't. An emoji or accented letter counts as one character. Numbers use the browser's language separators.
  - Hidden while the note is empty. The totals update ~300 ms after typing stops; the selection count right away.

### Settings and backup
- Settings open in a lightbox over the page (closes with ×, Esc or a click outside). Every setting applies immediately to all open tabs.
- Backup export: downloads a JSON with all notes (each also in markdown, for humans to read) and all settings.
- Backup import: validates the file (app, version, ids, dates, content the editor can open), asks for confirmation and replaces everything, settings included. Open Draftab tabs reload by themselves, discarding pending typing so nothing old is written over the backup.
- Automatic backup: off / every minute / hourly / daily / weekly / monthly (30 days). Runs even with no tab open, only if something changed since the last one, and saves to `Downloads/draftab-backups/` without asking. Settings show the date of the last automatic backup (manual exports don't count). `lastBackupAt` is the moment generation started, so a change made during generation goes into the next backup. Old interval values outside this list move to the closest one, never turning backup off.
- Backup file name (manual and automatic): `draftab_YYYY-MM-DD-HHhMM.json`, in local time.
- Delete all notes: only after typing "delete everything" in a confirmation field. Settings are kept; open tabs reload, as with an import.
- Theme: Automatic (follows the system's light/dark mode, live), Light or Dark. Default Automatic.
- Font of new notes: Sans-serif (default), Serif or Monospace, using system fonts (no downloads): SF Pro / New York / SF Mono on macOS, Segoe UI / Georgia / Consolas and similar elsewhere. Only the note content uses it. New notes (new tab, New note, imported file) start with it; changing it doesn't change existing notes. Until it's first changed, it's the "note font" set before fonts were per note.
- Theme and the open note's font are applied before the page shows up (no flash of the wrong ones).
- Text size of new notes: 80% to 150% (the note's steps), default 100%. New notes (new tab, New note, imported file) start with it; changing it doesn't change existing notes. Notes from before this setting existed are 100%.
- Sort notes by: see "Notes and the sidebar".

## Data model
- `Note { id: string (uuid), doc: TiptapJSON, title: string, titleManual: boolean, textSize?: number, font?: 'sans' | 'serif' | 'mono', pinned?: boolean, createdAt: number, updatedAt: number }`
  `titleManual` = the user renamed the note; while it's `false`, `title` follows the first line.
  `textSize` = the note's text size in percent (80, 90, 100, 110, 120, 135 or 150); missing or any other value = 100.
  `font` = the note's font; missing or any other value = the `noteFont` setting (notes from before fonts were per note).
  `pinned` = the note is pinned in the sidebar; missing = not pinned.
  The Tiptap JSON is the source of truth (no conversion losses).
- `settings { autoBackupMinutes: 0 | 1 | 60 | 1440 | 10080 | 43200, sidebarCollapsed: boolean, theme: 'auto' | 'light' | 'dark', noteSort: 'updated' | 'title' | 'created', noteFont: 'sans' | 'serif' | 'mono', newNoteFont: 'sans' | 'serif' | 'mono', newNoteTextSize: number }` (0 = off; `newNoteTextSize` = text size of new notes, in percent, default 100; `newNoteFont` = font of new notes, missing = `noteFont`; `noteFont` = the font of notes without their own, no longer changed from Settings). Invalid stored values fall back to the defaults (an unknown interval moves to the closest one).
- `meta { lastChangeAt: number, lastBackupAt: number, lastImportAt: number }` (`lastImportAt` marks an import or the deletion of all notes, and tells open tabs to reload)
- Backup file:
  `{ app: "draftab", version: 1, exportedAt, settings, notes: [{ id, title, titleManual, textSize, font, pinned, markdown, doc, createdAt, updatedAt }] }`
  `markdown` is for humans to read; importing restores from `doc`. Backups without `textSize` import as 100%; without `pinned`, as not pinned; notes without `font` use the backup's `noteFont`.

## Technical decisions
- Manifest V3 with `chrome_url_overrides.newtab`: the current standard for extensions.
- Permissions: `storage`, `unlimitedStorage`, `alarms`, `downloads` — nothing else (justifications in STORE.md). A new permission is recorded here first.
- Vite + TypeScript: simple build, types catch errors, libraries via npm.
- Tiptap 3 (StarterKit, TaskList/TaskItem, DragHandle, Markdown): mature, ready-made markdown shortcuts and drag handle.
- No React or other UI framework: the interface around the editor is small; fewer layers to read.
- `chrome.storage.local` + `unlimitedStorage` is the source of truth for notes and settings: no ~5 MB localStorage limit, not wiped when clearing cookies, and reachable from the service worker.
- One key per note (`note:<id>`): avoids rewriting everything on every keystroke. Open tabs update their list with just the note that changed.
- The theme and the font of new notes are also copied to the page's `localStorage`, and the open note's font to the tab's `sessionStorage` (next to the open note's id), which can be read synchronously, so `theme-init.js` applies them before the first paint. `chrome.storage` remains the source of truth.
- `chrome.alarms` + `chrome.downloads` in the service worker: backups run even with the tab closed. The file is generated as a `data:` URL (there's no `URL.createObjectURL` in the service worker).
- Markdown is only an export format (backup, exported file, copy, counts); notes are stored as Tiptap JSON.
- Vitest for the data, markdown and backup layers; the editor and the UI are checked in Chrome (by hand, plus automated browser scripts during development).
- Note typography modeled on Tailwind Typography ("prose", MIT), adapted for notes: paragraphs stay close together, because every Enter creates a paragraph.
- MIT license; every dependency shipped in the extension is MIT too.
- Language: English everywhere in the project (code, comments, UI, docs). The store listing also has a Brazilian Portuguese version.

## Known limitations
- If Chrome's "Ask where to save each file" option is on, each automatic backup opens the save dialog (documented in the README).
- Each automatic backup briefly shows Chrome's download icon.
- Search runs in memory, which is fine for a few hundred notes.
- Markdown conversion can lose small details (it's only for export); restoring a backup uses the Tiptap JSON, without losses.
