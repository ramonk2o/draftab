# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Power and remainder in calculations
- **Status:** Implemented, waiting for the user's test in Chrome. `npm test`: 17 files, 262 tests passed (new tests for power, remainder, invalid cases and the trigger regex). `npm run build`: ok.
- **Description:** calculations after `=` also do powers (`^` or `**`) and the remainder of a division (`%`).
- **Motivation:** direct request from the user (2026-10-16).
- **Decisions:** power is right-associative and comes before the sign (`2^3^2` = 512, `-2^2` = -4); the exponent may have a sign (`2^-1` = 0.5). `%` is at the level of `*` and `/`, has the sign of the first number (`-7%3` = -1) and accepts decimals. Remainder by zero, root of a negative and infinite results write nothing; `0^0` = 1; huge results come out with `e+`. The Settings hint shows the new operations.
- **Deliverable:** `calculate.ts` (parser and trigger regex) with `^`, `**` and `%`; tests; SPEC.md; Settings hint in English and Portuguese.
- **How to verify:** `npm test` and `npm run build` pass. In Chrome, typing `2^10=` → `1024`, `2**3=` → `8`, `7%3=` → `1`, `-2^2=` → `-4`, `2^3^2=` → `512`, `7%0=` → nothing; Settings → Calculations shows the new example.

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
