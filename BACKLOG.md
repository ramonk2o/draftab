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

### Paste markdown as blocks
- **Status:** Idea
- **Motivation:** pasted markdown "sometimes" keeps its symbols (`#`, `-`, `>`…). It's formatted only when the copy brings HTML along (a rendered page, a chat's answer on screen); copies from code editors, the terminal, `.md` files or a chat's copy button arrive as plain text, and then only inline marks are formatted.
- **Description:** pasting markdown text turns it into Draftab blocks (headings, lists, checklists, quotes, code, dividers, images, marks, links), as if it had been typed with the shortcuts.
- **Decisions:**
  - Any paste that arrives as plain text only (no HTML) is read as markdown, with no guessing whether it "looks like" markdown. Pastes with HTML work as today.
  - Copies from VS Code (marked with its own clipboard type) ignore their colored HTML and are read as plain text.
  - One line = one block (a paragraph, or a new item inside a list), unlike standard markdown, which joins consecutive lines; a plain line right after a list becomes a paragraph, not part of the last item. Blank lines vanish, as today.
  - Same rules as the `.md` import: headings smaller than `###` become `###`; an image alone on a line becomes an image block, one inside text stays as its `![…](…)` text. If the text can't become Draftab blocks, it's pasted as plain text, as today.
  - Markdown tables (Draftab has no table block) stay as text, one line per block (`| a | b |`, `|---|---|`, …); nothing is lost.
  - Inside a code block, the text is pasted as-is.
  - Cmd/Ctrl+Shift+V pastes the raw text, with its symbols, anywhere.
  - Pasting in the middle of a line or a list follows the editor's normal behavior: the first block joins the cursor's line, the rest follows, and what was after the cursor ends up at the end of the last block. A single line like `**x**` only gets its marks.
  - Cmd/Ctrl+Z undoes the whole paste in one step.
  - The `.md` file import (button and dragging files) follows the same rules: one line per block and tables as text. Changes the SPEC.md rule "`.md` / `.markdown` is read as markdown…": today it joins consecutive lines into one paragraph (with a hidden line break inside the text) and silently drops tables.
- **Notes (found on 2026-10-28):**
  - The markdown reader used by the import drops tables without warning, and joins `linha um⏎linha dois` into a single paragraph containing a `\n`.
  - If the Tables idea is built, tables pasted or imported would become table blocks instead of text.

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

## Discarded

### Color picker
- **Description:** a button opens a color picker; the chosen color is inserted in the text as a hex code (e.g. `#3a7bd5`).
- **Why discarded:** removed from the backlog by the user on 2026-10-13.
