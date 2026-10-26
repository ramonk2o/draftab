# Backlog

Feature ideas and the feature being built, managed with the `document` skill. Implemented features leave this file: what changed goes to CHANGELOG.md and the rules to SPEC.md.

Status: **Idea** → **In progress** (one at a time) → done (leaves the file in the commit that implements it). Discarded ideas go to the last section.

## Editor

### Tables
- **Status:** Idea
- **Motivation:** not recorded (came from the SPEC.md "Out of scope" list).
- **Description:** a table block in notes.
- **Open questions:**
  - How to create a table (e.g. typing `| a | b |` + Enter).
  - How to add and remove rows and columns (buttons on hover or shortcuts); the extension has no UI for this.
  - Markdown tables only hold formatted text in cells: lists, several paragraphs and merged cells would have to be blocked, or they'd be lost on export.
- **Notes (from a trial on 2026-10-12, not committed):**
  - Tiptap's official `@tiptap/extension-table` (same version as the rest) gives visual editing; the note stores it as a block like the others, export writes a markdown table (formatting inside cells kept, columns aligned) and importing a `.md` table reads it back.
  - Weight: JS goes from 621 KB to 668 KB (+47 KB, +7.5%; +15 KB gzipped). Not noticeable on a new tab.
  - To check: the custom drag-to-reorder and handles with tables (most likely the table moves whole), plus Copy for WhatsApp, character counts and Backspace at the start of the block.

## Backup and settings

### Sync across computers
- **Status:** Idea
- **Motivation:** moving notes between computers is manual today, through the JSON backup.
- **Description:** keep the same notes on more than one computer.
- **Open questions:**
  - Which storage to use (options below; Google Drive `appDataFolder` is preferred, nothing decided).
- **Notes (options discussed on 2026-10-12, nothing decided):**
  - `chrome.storage.sync`: free, no server, uses the Chrome account, but limited to 100 KB total and 8 KB per item; fits only the settings (theme, font, language), not the notes.
  - Google Drive `appDataFolder` (preferred): notes in the user's own Drive, in an area only the extension sees; automatic, in the background; no cost and no server of ours (the privacy policy still says only the user has the data). Costs: the `identity` permission (record in SPEC.md), a Google Cloud project for the login credential, and possibly Google's app verification for Drive access.
  - A synced folder the user picks (Dropbox, iCloud, Google Drive for desktop), read and written by the extension: no new permission, account or server; the simplest to build. Costs: Chrome asks for folder access again from time to time, it only works with the tab open, and it depends on one of those apps being installed.
  - Own server (Firebase, Supabase): accounts, monthly cost, maintenance and a new privacy policy; too heavy for Draftab.
  - The hard part in any option is conflicts: merge note by note (each note has an id and a last-modified date, so the most recent version of each note wins), and deleted notes leave a dated "deleted" mark so they don't come back when the other computer syncs.

## Notes and the sidebar

### Import by dragging files
- **Status:** Idea
- **Motivation:** importing a `.md` takes the Import button and a file picker, one file at a time; dragging files from the desktop or Finder would be faster, especially to bring several notes from another app. Today, dropping a file on the tab makes Chrome open it, leaving Draftab.
- **Description:** dragging `.md`, `.markdown` or `.txt` files onto the Draftab page imports each one as a new note, the same as the Import button.
- **Decisions:**
  - Same file types and the same conversion as the Import button; each file becomes a new note (nothing is inserted into the open note).
  - The drop works anywhere on the page: the note, the sidebar, empty areas, also with Settings open.
  - Several files at once: each valid file becomes a note and the first file's note opens. Invalid files are skipped and a message gives the count (e.g. "2 notes imported, 1 file skipped").
  - Other file types (PDF, images…): Chrome is kept from opening the file, nothing is imported and a message says only `.md` and `.txt` files can be imported.
  - An empty file creates no note and shows the same message as the Import button; among several files it counts as skipped.
  - While a file is dragged over the page, a layer covering it says "Drop to import"; it hides on drop or when the file leaves the window. It doesn't show when dragging blocks or text.
  - Dragging text or links (no files) works as today: the text goes into the note.
  - No new permission.
  - SPEC.md: the "Import a file as a note" rule gains dropping files as a second way in, with the rules above.

## Discarded

### Color picker
- **Description:** a button opens a color picker; the chosen color is inserted in the text as a hex code (e.g. `#3a7bd5`).
- **Why discarded:** removed from the backlog by the user on 2026-10-13.
