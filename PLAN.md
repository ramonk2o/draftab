# Plan

Stages ordered by risk: whatever could invalidate the idea comes first.

## Stage 1: Walking skeleton
- **Deliverable:** Vite + TypeScript project, MV3 manifest overriding the new tab, page with a basic Tiptap editor (StarterKit). Library versions pinned after checking the current Tiptap 3 docs.
- **How to verify:** `npm install && npm run build` with no errors; in chrome://extensions, "Load unpacked" pointing to `dist/`; open a new tab, type `# hi` and see a heading.
- **Status:** done (install, build and `npm test` with no errors; manual test in Chrome ok: `# hi` becomes a heading). Pinned versions: Tiptap 3.31.4, Vite 8.3.4, TypeScript 7.0.2, Vitest 5.0.3.

## Stage 2: Full block editor + drag
- **Deliverable:** every block in scope (headings, lists, checklist, code, quote, divider, inline marks, links), a DragHandle to the left of each block, and block CSS.
- **How to verify:** manual checklist — each markdown shortcut in the SPEC becomes the right block; dragging a block to the top and to the end of the note works; checklist is clickable.
- **Status:** done. Build ok; shortcuts and dragging tested in Chrome (automated script) and manual checklist approved. Beyond the plan: animated reordering, dragging whole lists and blocks across levels (see SPEC).

## Stage 3: Persistence and note list
- **Deliverable:** `src/storage.ts` (CRUD on `chrome.storage.local`), a new note per tab, empty notes discarded, automatic title from the first line until the note is renamed, collapsible sidebar with search, rename and delete, sync across tabs via `chrome.storage.onChanged`.
- **How to verify:** `npm test` passes (CRUD with a simulated `chrome.storage`). Manual: reloading keeps notes and block order; opening and closing a tab without typing creates no note; two tabs on the same note update each other; renaming fixes the title; collapsing the sidebar persists after reload.
- **Status:** done. `npm test`: 23 tests ok; manual script run in Chrome with the extension loaded (18 checks ok) and approved in use. Extra tweaks: minimalist icons, search with magnifier, checkbox and handle alignment.

## Stage 4: Manual backup
- **Deliverable:** export/import icons and gear at the top of the sidebar; Settings page with Export (JSON in the SPEC format, including markdown) and Import (validates `app`/`version`, confirms, replaces everything).
- **How to verify:** `npm test` passes (export → import returns identical data; invalid file is rejected). Manual: export, delete a note, import and see the note back.
- **Status:** done. `npm test`: 39 tests ok (export → import identical; 9 kinds of invalid file rejected); manual script in Chrome with the extension: 13 checks ok; approved in use. File name: `draftab_YYYY-MM-DD-HHhMM.json`.

## Stage 5: Automatic backup
- **Deliverable:** interval picker in Settings (off, every minute, hourly, daily, weekly, monthly), `chrome.alarms` + `chrome.downloads` in the service worker, skips when nothing changed, shows the date of the last backup. Settings in a lightbox, with a "Delete all notes" section (typed confirmation).
- **How to verify:** with the "every minute" interval, edit a note and see the file in `Downloads/draftab-backups/`; without editing, no new file appears. The lightbox closes with ×, Esc and a click outside; deleting everything only works with "delete everything" typed.
- **Status:** done. `npm test`: 52 tests ok; in Chrome with the extension: real every-minute backup (8 checks ok) and lightbox, intervals and delete-all (18 checks ok); approved in use.

## Stage 6: Dark theme
- **Deliverable:** interface colors in CSS variables, dark theme, "Theme" option in Settings (Automatic / Light / Dark) and a theme button next to the sidebar button, applied immediately to all tabs and without flashing the wrong theme on open.
- **How to verify:** `npm test` passes. In Chrome: with macOS in dark mode and the Automatic theme, the page opens dark; Light and Dark force the theme; changing it in one tab changes the others; every element (editor, blocks, sidebar, handles, lightbox, fields) is readable in both themes.
- **Status:** done. `npm test`: 56 tests ok; in Chrome with the extension: themes, sync, no flash on open, WCAG contrast, theme button and backup with all settings verified; approved in use.

## Stage 7: Ready to publish
- **Deliverable:** extension icons in the manifest, version 1.0.0, `npm run zip` (package + third-party license notices), `PRIVACY.md`, `STORE.md` (en-US and pt-BR listing texts, single purpose, permission justifications, data disclosure), store images (1280×800 screenshots in both languages, 440×280 promo tile), and a step-by-step submission guide.
- **How to verify:** `npm test` passes; `npm run zip` produces a .zip that loads in Chrome with the icons showing and everything working; store images have the exact required sizes; every field the store asks for has a ready text. Then the user submits it in the Chrome Web Store dashboard.
- **Status:** 1.0.0 submitted to the Chrome Web Store by the user. `npm test`: 56 tests ok; `npm run zip` builds the package (icons, localized description, LICENSE, third-party notices); the unzipped package loads in Chrome with the 4 icons and works; every E2E script passes; 10 screenshots at 1280×800 and 2 promo tiles at 440×280 (user's artwork). Next upload: 1.1.0, with stages 8–10.

## Stage 8: Note sort order
- **Deliverable:** "Sort notes by" in Settings (Last modified / Title A–Z / Date created), default last modified; the sidebar list and its dates follow the choice in every open tab; the setting goes into backups.
- **How to verify:** `npm test` passes (sorting rules, setting saved/read/validated, included in the backup). In Chrome: each option reorders the list correctly; switching in one tab updates the others; the choice survives a reload.
- **Status:** implemented (`npm test`: 63 tests ok, 7 new for sorting and the setting; in Chrome with the extension: each option, sync across tabs, persistence after reload, editing under date-created order, search keeping the order — 9 checks ok; the setting goes in and out of backups; earlier E2E scripts still pass); waiting for the user's test in Chrome.

## Stage 9: Note typography
- **Deliverable:** "Note font" in Settings (Sans-serif / Serif / Monospace, system fonts), applied to note content in every tab without flashing on open and included in backups; note typography rewritten on Tailwind Typography's proportions, adapted for notes (quotes with breathing room, clearer heading hierarchy, lists, code and dividers).
- **How to verify:** `npm test` passes. In Chrome: the three fonts apply and sync across tabs; before/after screenshots of the same note in each font; quotes have space above and below; drag handles and checkboxes stay aligned with the text in all three fonts (measured); earlier E2E scripts still pass.
- **Status:** implemented (`npm test`: 65 tests ok; in Chrome with the extension: the three fonts apply, sync across tabs, keep the sidebar sans-serif and open without flashing — 7 checks ok; drag handles and checkboxes within 1 px of the text line in all three fonts; drag-and-drop scenarios pass in all three fonts after fixing two slot-choice bugs the new spacing exposed and a list-handle drag that could be cancelled; earlier E2E scripts pass; store and README screenshots regenerated); waiting for the user's test in Chrome.

## Stage 10: Double-click a handle to select and copy
- **Deliverable:** double-clicking a block handle (or the whole-list bar) selects the block's content and copies it like Cmd/Ctrl+C, with a brief "Copied" confirmation.
- **How to verify:** in Chrome: double-clicking the handle of a paragraph, heading, list item, checklist item, quote, code block and whole list selects exactly that content and the clipboard holds it (plain text and formatted); a divider is copied whole; a single click or a drag still behaves as before; earlier E2E scripts pass.
- **Status:** implemented (in Chrome with the extension: double-clicking the handle of a heading, paragraph, list item, checklist item, quote and code block selects and copies exactly its content, formatted and plain; a divider is copied whole; the list bar copies the whole list; the "Copied" label shows; a single click doesn't copy — 11 checks ok; plain-text copies now use one line per block; `npm test` and every earlier E2E script pass); waiting for the user's test in Chrome.

## Stage 11: Export a note as Markdown
- **Deliverable:** a button on each note in the sidebar (shown on hover, between rename and delete) that downloads the note as `<title>.md`, with the title cleaned of characters not allowed in file names; the open note's unsaved typing is saved first.
- **How to verify:** `npm test` passes (markdown of a note with every block type; file names with forbidden characters, long titles and untitled notes). In Chrome: exporting the open note right after typing includes the last keystrokes; exporting another note doesn't open it; the downloaded file opens in a text editor with headings, lists, checklists, quotes, code and dividers in markdown.
- **Status:** implemented (`npm test`: 71 tests ok, 6 new for the markdown and the file name; in headless Chrome with the extension: exporting the open note right after typing includes the last keystrokes, every block type comes out in markdown, exporting another note doesn't open it, forbidden characters leave the file name, hover shows rename/export/delete — 13 checks ok); waiting for the user's test in Chrome.

## Stage 12: Backspace turns code blocks and quotes back into text
- **Deliverable:** Backspace with the cursor at the start of a code block replaces it with one paragraph per line; at the start of a quote's first paragraph, the whole quote becomes normal paragraphs. Backspace right after a markdown shortcut behaves as before; Cmd/Ctrl+Z undoes the change.
- **How to verify:** `npm test` passes (code block with several lines, empty lines, quote with several paragraphs, cases where the rule doesn't apply). In Chrome: Backspace at the start of a code block and of a quote, between other paragraphs, turns them into text without merging into the previous block; Cmd+Z restores them; Backspace right after a shortcut behaves as before; earlier E2E scripts pass.
- **Status:** implemented (`npm test`: 80 tests ok, 9 new; in headless Chrome with the extension: code block → one paragraph per line with the cursor at the start, quote → paragraphs without merging into the previous block, later quote paragraph keeps Tiptap's behavior, Cmd+Z restores each block, Backspace right after `> ` unchanged — 9 checks ok; copy and drag E2E scripts pass); waiting for the user's test in Chrome.

## Stage 13: Import a file as a note; backup only in Settings
- **Deliverable:** the sidebar's backup icons are removed; an import icon to the left of "New note" imports a `.md` or `.txt` file as a new note (markdown parsed for `.md`, one paragraph per line for `.txt`, automatic title) and opens it. Backup export and import stay only in Settings. In Settings, manual and automatic backup become a single "Backup" section (the interval label reads "Automatic backup" instead of "Back up"), with shorter explanations in a slightly smaller font. Sidebar layout: 300 px wide, no theme button (theme only in Settings), the search row between two dividers.
- **How to verify:** `npm test` passes (markdown file with every block type, `.txt` lines, Windows line breaks, empty file, markdown the editor can't hold falls back to text). In Chrome: the sidebar top shows only sidebar, theme and gear, with import next to New note; the sidebar is 300 px wide; importing a `.md` and a `.txt` creates and opens the note, which shows up in the list and survives a reload; an empty file shows a message and creates nothing; Settings export/import and the interval still work; screenshot of the new Settings in both themes; earlier E2E scripts pass.
- **Status:** implemented (`npm test`: 88 tests ok, 8 new for file import; in headless Chrome with the extension: sidebar top has only import and settings, `.md` and `.txt` become notes that open, show in the list and survive a reload, an empty file shows a message and creates nothing, Settings has one Backup section with smaller hints, export and the interval still work — 16 checks ok; screenshots in both themes; earlier E2E scripts pass); waiting for the user's test in Chrome.
