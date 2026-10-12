# Draftab

## Goal
Chrome extension that replaces the new tab with a local notepad, with a markdown-friendly block editor and drag-to-reorder blocks. Published on the Chrome Web Store as open source.

## Hypothesis to test
A reorderable block editor with reliable backups replaces New Tab Draft in daily use.
Success: ~2 weeks of real use without losing a single note and without going back to New Tab Draft.

## MVP scope
- A new tab opens a blank note with the cursor in the editor.
- Markdown shortcuts turn into formatted blocks while typing: `#`/`##`/`###`, `-`, `1.`, `- [ ]`, `>`, ` ``` `, `---`, `**bold**`, `*italic*`, `` `code` ``, links.
  - Backspace with the cursor at the start of a code block or a quote turns it back into normal text, keeping the content: each line of a code block becomes a paragraph; a quote's paragraphs become normal paragraphs (at the start of its first paragraph the whole quote is undone; at the start of a later one, that paragraph leaves the quote, splitting it). Backspace right after typing a shortcut works as before (Tiptap's own undo of the shortcut). The change is its own undo step: Cmd/Ctrl+Z brings the block back.
- Each block shows a handle on the left on hover; dragging the handle moves the block and the new order is saved.
  - List items have their own handle, before the marker.
  - While dragging, neighboring blocks slide with an animation to open space where the block will land; the block shows faded in that space.
  - Hovering over a list shows a thin bar on its left that drags the whole list.
  - Items and paragraphs can change level: the mouse height picks the position; at the edges of a list, horizontal movement decides whether the block goes inside (right) or outside (left) of it.
  - Conversions when changing level: an item that leaves a list stays an item, in a list of its own; a paragraph that enters a list becomes an item; list item ↔ checklist item depending on the target list. Adjacent lists of the same type are merged.
  - Headings, quotes, code, dividers and whole lists don't go into lists (they only move among the note's blocks).
  - Double-clicking a block's handle selects the block's content and copies it to the clipboard, exactly like selecting it and pressing Cmd/Ctrl+C (formatted for apps that accept it, plain text for the others; plain text has one line per block, for Cmd/Ctrl+C too). Double-clicking the whole-list bar does the same for the whole list. Blocks without text (a divider) are selected and copied whole. A small "Copied" label shows above the handle for about a second.
- The sidebar lists notes (sorted as chosen in Settings, see below), with search (title and content), a "new note" button, rename (double-click the title or the ✎ button) and delete with confirmation.
  - Export a note as Markdown: only from the button on the note page (see below), which downloads the open note as a `.md` file through a normal browser download. The note list has only rename and delete. The file name is the note's title, without characters that aren't allowed in file names (`/ \ : * ? " < > |` and control characters), at most 100 characters, or `Untitled.md` when nothing is left. The content is the same markdown the backup's `markdown` field gets; if the open note has unsaved typing, it's saved first so the file has everything.
  - Sort order, chosen in Settings: last modified (default, newest first), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created (newest first). The date shown next to each note follows the order: the creation date when sorting by date created, the last edit otherwise. Applies immediately to every open tab.
  - The sidebar can be collapsed; its state (open/collapsed) is remembered.
- Note title: while the user hasn't set a title, it follows the first line of text. Renaming fixes the title; renaming to empty goes back to the automatic title.
- An empty note (no text and no user-set title) isn't saved: opening and closing a tab leaves no clutter, and a saved note that becomes empty leaves the list.
- Reloading the tab reopens the same note (the id is kept in the tab's `sessionStorage`, which survives reloads and is cleared when the tab closes).
- Autosave with a ~500 ms debounce. Changes made in another tab show up in this one (last write wins).
- Top right of the note page (always visible, fixed while scrolling): two icon buttons for the open note.
  - Export as Markdown: downloads the note as a `.md` file (see "Export a note as Markdown" above).
  - Copy note: copies the whole note to the clipboard, formatted (HTML) for apps that accept it and as markdown (the same as the exported file) for plain-text apps. A small "Copied" label shows under the button.
  - Both are disabled while the note is empty.
  - Text size of the note, to their left: two buttons, smaller (A−) and bigger (A+), also on the keyboard: Cmd/Ctrl+Shift+, (smaller) and Cmd/Ctrl+Shift+. (bigger). Cmd/Ctrl + and − stay Chrome's zoom.
    - Sizes, relative to the note font's normal size: 80%, 90%, 100%, 110%, 120%, 135%, 150%. Each click moves one step; the button is disabled at the end of the range. A small label with the new size (e.g. "120%") shows under the buttons.
    - The size belongs to the note: each note keeps its own, in every tab and in backups. Changing it counts as an edit to the note (it's saved right away and updates the "last modified" date). On a new note that hasn't been saved yet, the size is kept and saved with the first keystroke.
    - Only the note content changes size (headings, lists, code… keep their proportions); the sidebar, buttons and counts don't.
- Bottom right of the note page (always visible, fixed while scrolling): character counts for the open note, in small muted text, e.g. "1,234 characters · 1,180 without markdown · 42 selected".
  - Characters: the whole note as markdown, marks included (`#`, `**`, `-`, `- [ ]`, `>`, ` ``` `…), the same text as the exported file.
  - Without markdown: the note's plain text, with one line break between blocks (the same text as a plain-text copy).
  - Selected: shown only while there's a text selection, counted like "without markdown".
  - Spaces and line breaks count; line breaks at the end of the note don't. An emoji or accented letter counts as one character. Numbers use the browser's language separators.
  - Hidden while the note is empty. The totals update a moment after typing stops (~300 ms); the selection count updates right away.
- The sidebar toggle is always visible, at the top left. The theme is chosen only in Settings (there's no theme button).
- Top of the sidebar (visible only when open): a gear on the right that opens Settings (the sidebar toggle sits on the left). Backup export and import live only in Settings. The sidebar is 300 px wide.
- The row with the search, import and new note sits between two dividers (thin lines like the sidebar's border), separating it from the top buttons and from the note list.
  - Import a file as a note: an icon to the left of the "new note" button, next to the search, asks for one `.md` or `.txt` file and creates a new note with its content, which opens in the tab. A `.md` (or `.markdown`) file is read as markdown (headings, lists, checklists, quotes, code, dividers, marks, links); if something in it can't become a Draftab block, the file is read as plain text instead. A `.txt` file is plain text: each line becomes a paragraph. The title is automatic (first line), like any new note. An empty file creates nothing and shows a message.
- Settings in a lightbox over the notes page (closes with the × button, Esc or a click outside). Explanations are short and in a slightly smaller font than the options. Manual and automatic backup are one "Backup" section:
  - Export backup now (downloads a JSON with all notes and all settings; importing restores both).
  - Import backup: validates the file, asks for confirmation and replaces everything. Open Draftab tabs reload by themselves after the import (none writes old content over it).
  - Automatic backup: off / every minute / hourly / daily / weekly / monthly (30 days), showing the date of the last automatic backup (manual exports don't count). Old values outside this list move to the closest interval.
  - Delete all notes: the button only works after typing "delete everything" in a confirmation field. Open tabs reload, as with an import.
  - Theme: Automatic (follows the system's light/dark mode), Light or Dark. Default: Automatic. Applies immediately to all open tabs, and the page opens in the right theme (no flash of the wrong theme).
  - Text size of new notes: 80% to 150% (same steps as the note's buttons), default 100%. A new note (new tab, New note button, imported file) starts with this size; changing it doesn't change existing notes, which keep their own size. Notes from before this setting existed are 100%.
  - Note font: Sans-serif (default), Serif or Monospace, using system fonts (no downloads): on macOS SF Pro / New York / SF Mono, with Segoe UI / Georgia / Consolas and similar as fallbacks elsewhere. Applies to the note content only (the sidebar and Settings stay sans-serif), immediately in every open tab, and the page opens with the right font (no flash).
- Backup file name (manual and automatic): `draftab_YYYY-MM-DD-HHhMM.json` (e.g. `draftab_2026-10-11-15h05.json`).
- Automatic backup saves to `Downloads/draftab-backups/` without asking, and only if something changed since the last backup.

## Publishing (Chrome Web Store)
- Published right away, before the 2-week test (the test continues with the store version).
- Store listing in English (en-US) and Brazilian Portuguese (pt-BR); the extension UI stays English-only.
- Versions: 1.0.0 submitted to the store; 1.1.0 (note sort order, note fonts and typography, double-click to copy, export a note as Markdown, Backspace to undo code blocks and quotes, import a .md/.txt file as a note, backup export/import only in Settings, sidebar layout without the theme button, export and copy buttons on the note page) ready to upload as an update. Icons at 16, 32, 48 and 128 px in `public/icons/` (the 128 px one is also the store icon).
- Privacy policy in `PRIVACY.md` in the repository; its public GitHub URL is the policy URL in the store. Nothing is collected or sent anywhere.
- Store texts (descriptions, single purpose, permission justifications, data disclosure) in `STORE.md`, in both languages.
- Store images: 1280×800 screenshots generated from the real extension, and a 440×280 small promo tile from the user's artwork (en and pt-BR).
- `npm run zip` builds the package for upload, including a notices file with the licenses of the bundled dependencies (required by their MIT licenses).

## Out of scope (for now)
Everything not in the scope above. Ideas for after the MVP go to the backlog, in `FEATURES.md`.

## Stack and technical decisions
- Manifest V3 with `chrome_url_overrides.newtab`: the current standard for extensions.
- Vite + TypeScript: simple build, types catch errors, libraries via npm.
- Tiptap 3 (StarterKit, TaskList/TaskItem, DragHandle, Markdown): mature, ready-made markdown shortcuts and drag handle.
- No React or other UI framework: the interface around the editor is small; fewer layers to read.
- `chrome.storage.local` + the `unlimitedStorage` permission (the source of truth for notes and settings): no ~5 MB localStorage limit, not wiped when clearing cookies, and reachable from the service worker.
- One key per note (`note:<id>`): avoids rewriting everything on every keystroke.
- The theme and note font are also copied to the page's `localStorage`, which can be read synchronously, so `theme-init.js` applies them before the first paint (no flash). `chrome.storage` remains the source of truth.
- `chrome.alarms` + `chrome.downloads` in the service worker: backups run even with the tab closed. The file is generated as a `data:` URL (there's no `URL.createObjectURL` in the service worker).
- Vitest for the data and backup layers; the editor and the UI are checked in Chrome (by hand, plus automated browser scripts during development).
- Note typography modeled on Tailwind Typography ("prose", MIT): its proportions for headings, quotes, lists, code blocks and dividers, adapted for notes — paragraphs stay close together, because in the editor every Enter creates a paragraph (prose's 1.25em paragraph spacing would look double-spaced).
- MIT license (open source): free use, modification and redistribution, only requiring the copyright notice to be kept (credit). Every dependency shipped in the extension is MIT too.
- Language: English everywhere in the project (code, comments, UI, docs).

## Data model
- `Note { id: string (uuid), doc: TiptapJSON, title: string, titleManual: boolean, textSize?: number, createdAt: number, updatedAt: number }`
  `textSize` = the note's text size in percent (80, 90, 100, 110, 120, 135 or 150); missing or any other value = 100.
  `titleManual` = the user renamed the note; while it's `false`, `title` follows the first line.
  The Tiptap JSON is the source of truth (no conversion losses).
- `settings { autoBackupMinutes: 0 | 1 | 60 | 1440 | 10080 | 43200, sidebarCollapsed: boolean, theme: 'auto' | 'light' | 'dark', noteSort: 'updated' | 'title' | 'created', noteFont: 'sans' | 'serif' | 'mono', newNoteTextSize: number }` (0 = off; `newNoteTextSize` = text size of new notes, in percent, default 100)
- `meta { lastChangeAt: number, lastBackupAt: number, lastImportAt: number }` (`lastImportAt` marks an import or the deletion of all notes, and tells open tabs to reload)
- Backup file:
  `{ app: "draftab", version: 1, exportedAt, settings, notes: [{ id, title, titleManual, textSize, markdown, doc, createdAt, updatedAt }] }`
  `markdown` is for humans to read; importing restores from `doc`.

## Main flows
1. **Write:** I open a new tab → type `# Ideas` → it becomes a heading → on the first keystroke the note is created and shows up in the sidebar.
2. **Reorder:** I hover a paragraph → drag the handle above another block → drop → the order persists after reloading.
3. **Automatic backup:** the alarm fires → the service worker compares `lastChangeAt` with `lastBackupAt` → if something changed, it downloads the JSON and sets `lastBackupAt` to the moment it started generating the backup (so a change made during generation goes into the next one).

## Assumptions and open questions
- If Chrome's "Ask where to save each file" option is on, the automatic backup will open the save dialog. Documented in the README.
- Each automatic backup briefly shows Chrome's download icon.
- In-memory search is enough for a few hundred notes.
- Markdown conversion is only used for export; small losses don't affect restoring.
