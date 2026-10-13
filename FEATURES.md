# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

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

### Hex colors
- **Status:** Idea
- **Description:**
  - Color picker: a button opens a color picker; the chosen color is inserted in the text as a hex code (e.g. `#3a7bd5`).
  - Color swatch: RGB hex codes written in the note show a small sample of the color next to them, so the user sees what the code stands for.
- **Motivation:** quick access to colors.
- **Button:** in the note page bar, on the left side, apart from the note's settings (font and text size).

## Sidebar

### Calendar
- **Status:** Implemented on 2026-10-13, waiting for the user's test in Chrome. `npm test`: 172 tests pass (new: month grid, the 4 formats in Portuguese and English, settings validation and sync, calendar settings in backups). `npm run build`: OK. The Chrome checks weren't run (the browser automation extension wasn't connected).
- **Description:** a calendar fixed at the bottom of the note list, to look at quickly. Clicking a day inserts that date where the cursor is in the note, in a configurable format.
- **Motivation:** quick access to a calendar view while taking notes.
- **Decisions (2026-10-13):** date format picked from a fixed list in Settings (numeric, ISO, short month, long with weekday; following the interface language); weeks start on Sunday; a Settings option shows or hides the calendar (shown by default).
- **Deliverable:** a month calendar at the bottom of the sidebar (previous/next month, the month name goes back to the current month, today marked); clicking a day inserts the date at the cursor in the note; a "Calendar" section in Settings with "Show calendar" and "Date format"; both settings sync across tabs and go into backups.
- **How to verify:** `npm test` (month grid and date formats in both languages; settings validation); `npm run build`; in Chrome: the calendar shows the current month with today marked, ‹ › change month and the month name comes back to today; clicking a day with the cursor in the middle of a line inserts the date there and the note is saved; changing the format in Settings changes what's inserted; turning "Show calendar" off hides it in every open tab; the note list scrolls above the calendar with many notes.

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
