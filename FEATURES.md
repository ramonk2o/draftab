# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Text highlight
- **Status:** Implemented, waiting for the user's test in Chrome. 2026-10-16: `npm test` passes (257 tests, 10 new in `highlight.test.ts`: mark kept in the JSON, only `span[data-highlight]` with a palette color read from HTML (`<mark>` from pages is plain text), no trace in markdown or WhatsApp, apply/replace/remove only on the selection, other marks kept, current color of the selection, not in code, typing after a highlight isn't highlighted); `npm run build` passes; a static preview of the built CSS showed the six colors readable in both themes, with bold, links, a heading, a list, a quote and a highlight across two lines. The bar (showing, positioning, Esc, dragging), Cmd/Ctrl+Shift+H (Chrome on Mac may keep it for the home page), syncing between tabs and undo weren't tested in Chrome yet.
- **Description:** highlight selected text with a background color, from a few preset colors that work in both light and dark mode. Selecting text shows a small bar above it with "No color" and the colors; Cmd/Ctrl+Shift+H highlights with the last color used.
- **Motivation:** highlight parts of a note (direct request). Replaces a first version that colored whole blocks from the handle (tried on 2026-10-16, reverted: highlighting by selection was preferred).
- **Decisions:** works in any text except code; the highlight lives only in Draftab: saved in the note and in backups, left out of the `.md`, copies and WhatsApp.
- **Deliverable:** the `highlight` mark, the floating color bar, the shortcut, the light/dark palette, tests and the SPEC.md rules.
- **How to verify:** `npm test` passes; in Chrome: select part of a paragraph → the bar shows above it → yellow → only that part is highlighted; same inside a heading, a list item and a quote, and together with bold/link; "No color" removes it; selecting a highlighted part marks its color in the bar; Cmd/Ctrl+Shift+H highlights with the last color and removes it when repeated; typing right after a highlight isn't highlighted; switching Light/Dark keeps it readable; the bar hides when the selection goes away, with Esc and while dragging a block; reloading the tab and another open tab keep the highlight; Cmd+Z undoes it; Export as Markdown has no trace of it.

### Tables
- **Status:** Idea
- **Description:** a table block in notes.
- **Motivation:** not recorded (came from the SPEC.md "Out of scope" list).
- **Notes (from a trial on 2026-10-12, not committed):**
  - Tiptap's official `@tiptap/extension-table` (same version as the rest) gives visual editing; the note stores it as a block like the others, export writes a markdown table (formatting inside cells kept, columns aligned) and importing a `.md` table reads it back.
  - Weight: JS goes from 621 KB to 668 KB (+47 KB, +7.5%; +15 KB gzipped). Not noticeable on a new tab.
  - Open decisions: how to create a table (e.g. typing `| a | b |` + Enter) and how to add/remove rows and columns (buttons on hover or shortcuts); the extension has no UI for this.
  - Markdown tables only hold formatted text in cells: lists, several paragraphs and merged cells would have to be blocked, or they'd be lost on export.
  - Check the custom drag-to-reorder and handles with tables (most likely the table moves whole), plus Copy for WhatsApp, character counts and Backspace at the start of the block.

## Backup and settings

### Sync across computers
- **Status:** Idea
- **Description:** keep the same notes on more than one computer.
- **Motivation:** today moving notes between computers is manual, via the JSON backup (SPEC.md).
- **Notes (options discussed on 2026-10-12, nothing decided):**
  - `chrome.storage.sync`: free, no server, uses the Chrome account, but limited to 100 KB total and 8 KB per item; fits only the settings (theme, font, language), not the notes.
  - Google Drive `appDataFolder` (preferred): notes in the user's own Drive, in an area only the extension sees; automatic, in the background; no cost and no server of ours (the privacy policy still says only the user has the data). Costs: the `identity` permission (record in SPEC.md), a Google Cloud project for the login credential, and possibly Google's app verification for Drive access.
  - A synced folder the user picks (Dropbox, iCloud, Google Drive for desktop), read and written by the extension: no new permission, account or server; the simplest to build. Costs: Chrome asks for folder access again from time to time, it only works with the tab open, and it depends on one of those apps being installed.
  - Own server (Firebase, Supabase): accounts, monthly cost, maintenance and a new privacy policy; too heavy for Draftab.
  - The hard part in any option is conflicts: merge note by note (each note has an id and a last-modified date, so the most recent version of each note wins), and deleted notes leave a dated "deleted" mark so they don't come back when the other computer syncs.

## Discarded

### Color picker
- **Description:** a button opens a color picker; the chosen color is inserted in the text as a hex code (e.g. `#3a7bd5`).
- **Why discarded:** removed from the backlog by the user on 2026-10-13.
