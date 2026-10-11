# Draftab

## Goal
Chrome extension that replaces the new tab with a local notepad, with a markdown-friendly block editor and drag-to-reorder blocks. Published on the Chrome Web Store as open source.

## Hypothesis to test
A reorderable block editor with reliable backups replaces New Tab Draft in daily use.
Success: ~2 weeks of real use without losing a single note and without going back to New Tab Draft.

## MVP scope
- A new tab opens a blank note with the cursor in the editor.
- Markdown shortcuts turn into formatted blocks while typing: `#`/`##`/`###`, `-`, `1.`, `- [ ]`, `>`, ` ``` `, `---`, `**bold**`, `*italic*`, `` `code` ``, links.
- Each block shows a handle on the left on hover; dragging the handle moves the block and the new order is saved.
  - List items have their own handle, before the marker.
  - While dragging, neighboring blocks slide with an animation to open space where the block will land; the block shows faded in that space.
  - Hovering over a list shows a thin bar on its left that drags the whole list.
  - Items and paragraphs can change level: the mouse height picks the position; at the edges of a list, horizontal movement decides whether the block goes inside (right) or outside (left) of it.
  - Conversions when changing level: an item that leaves a list stays an item, in a list of its own; a paragraph that enters a list becomes an item; list item ↔ checklist item depending on the target list. Adjacent lists of the same type are merged.
  - Headings, quotes, code, dividers and whole lists don't go into lists (they only move among the note's blocks).
- The sidebar lists notes by last edit, with search (title and content), a "new note" button, rename (double-click the title or the ✎ button) and delete with confirmation.
  - Sort order, chosen in Settings: last modified (default, newest first), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created (newest first). The date shown next to each note follows the order: the creation date when sorting by date created, the last edit otherwise. Applies immediately to every open tab.
  - The sidebar can be collapsed; its state (open/collapsed) is remembered.
- Note title: while the user hasn't set a title, it follows the first line of text. Renaming fixes the title; renaming to empty goes back to the automatic title.
- An empty note (no text and no user-set title) isn't saved: opening and closing a tab leaves no clutter, and a saved note that becomes empty leaves the list.
- Reloading the tab reopens the same note (the id is kept in the tab's `sessionStorage`, which survives reloads and is cleared when the tab closes).
- Autosave with a ~500 ms debounce. Changes made in another tab show up in this one (last write wins).
- Next to the sidebar toggle (always visible): a theme button (moon in light mode, sun in dark mode) that switches to the opposite of the theme on screen; "Automatic" is in Settings.
- Top of the sidebar (visible only when open): export and import backup icons next to the sidebar and theme buttons, and a gear on the right that opens Settings.
- Settings in a lightbox over the notes page (closes with the × button, Esc or a click outside):
  - Export backup now (downloads a JSON with all notes and all settings; importing restores both).
  - Import backup: validates the file, asks for confirmation and replaces everything. Open Draftab tabs reload by themselves after the import (none writes old content over it).
  - Automatic backup: off / every minute / hourly / daily / weekly / monthly (30 days), showing the date of the last automatic backup (manual exports don't count). Old values outside this list move to the closest interval.
  - Delete all notes: the button only works after typing "delete everything" in a confirmation field. Open tabs reload, as with an import.
  - Theme: Automatic (follows the system's light/dark mode), Light or Dark. Default: Automatic. Applies immediately to all open tabs, and the page opens in the right theme (no flash of the wrong theme).
- Backup file name (manual and automatic): `draftab_YYYY-MM-DD-HHhMM.json` (e.g. `draftab_2026-10-11-15h05.json`).
- Automatic backup saves to `Downloads/draftab-backups/` without asking, and only if something changed since the last backup.

## Publishing (Chrome Web Store)
- Published right away, before the 2-week test (the test continues with the store version).
- Store listing in English (en-US) and Brazilian Portuguese (pt-BR); the extension UI stays English-only.
- Version 1.0.0. Icons at 16, 32, 48 and 128 px in `public/icons/` (the 128 px one is also the store icon).
- Privacy policy in `PRIVACY.md` in the repository; its public GitHub URL is the policy URL in the store. Nothing is collected or sent anywhere.
- Store texts (descriptions, single purpose, permission justifications, data disclosure) in `STORE.md`, in both languages.
- Store images: 1280×800 screenshots and a 440×280 small promo tile, generated from the real extension.
- `npm run zip` builds the package for upload, including a notices file with the licenses of the bundled dependencies (required by their MIT licenses).

## Out of scope (for now)
Everything not in the scope above. Ideas for after the MVP go to the backlog, in `FEATURES.md`.

## Stack and technical decisions
- Manifest V3 with `chrome_url_overrides.newtab`: the current standard for extensions.
- Vite + TypeScript: simple build, types catch errors, libraries via npm.
- Tiptap 3 (StarterKit, TaskList/TaskItem, DragHandle, Markdown): mature, ready-made markdown shortcuts and drag handle.
- No React or other UI framework: the interface around the editor is small; fewer layers to read.
- `chrome.storage.local` + the `unlimitedStorage` permission: no ~5 MB localStorage limit, not wiped when clearing cookies, and reachable from the service worker.
- One key per note (`note:<id>`): avoids rewriting everything on every keystroke.
- `chrome.alarms` + `chrome.downloads` in the service worker: backups run even with the tab closed. The file is generated as a `data:` URL (there's no `URL.createObjectURL` in the service worker).
- Vitest for the data and backup layers; the editor is checked manually.
- MIT license (open source): free use, modification and redistribution, only requiring the copyright notice to be kept (credit). Every dependency shipped in the extension is MIT too.
- Language: English everywhere in the project (code, comments, UI, docs).

## Data model
- `Note { id: string (uuid), doc: TiptapJSON, title: string, titleManual: boolean, createdAt: number, updatedAt: number }`
  `titleManual` = the user renamed the note; while it's `false`, `title` follows the first line.
  The Tiptap JSON is the source of truth (no conversion losses).
- `settings { autoBackupMinutes: 0 | 1 | 60 | 1440 | 10080 | 43200, sidebarCollapsed: boolean, theme: 'auto' | 'light' | 'dark', noteSort: 'updated' | 'title' | 'created' }` (0 = off)
- `meta { lastChangeAt: number, lastBackupAt: number, lastImportAt: number }` (`lastImportAt` marks an import or the deletion of all notes, and tells open tabs to reload)
- Backup file:
  `{ app: "draftab", version: 1, exportedAt, settings, notes: [{ id, title, titleManual, markdown, doc, createdAt, updatedAt }] }`
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
