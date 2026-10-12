# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Font per note
- **Status:** In progress — implemented; `npm test` 122/122 passing (6 new across `notes`, `storage`, `backup` and `markdown` tests), typecheck and `npm run build` OK; waiting for the test in Chrome
- **Description:** each note has its own font (sans-serif, serif or monospace), like the text size; the Settings font becomes the font new notes start with.
- **Motivation:** direct request: the font should be set per note, the same way as the size, with the same "default for new notes" in Settings.
- **Deliverable:** an "Aa" button at the top right of the note page that switches the open note's font (Sans → Serif → Mono → Sans) and shows its name; `font` in the note (storage and backups); "Font of new notes" in Settings; existing notes keep the font set in Settings before the update.
- **How to verify:** `npm test` and `npm run build`; in Chrome: switch the font of one note and check another note keeps its own; reload the tab (no flash of another font); open the same note in two tabs and switch the font in one; change "Font of new notes" and create a note; check existing notes kept the font they had; export and import a backup and check each note's font.

### Tables
- **Status:** Idea
- **Description:** a table block in notes.
- **Motivation:** not recorded (came from the SPEC.md "Out of scope" list).

## Interface

### Portuguese translation
- **Status:** Idea
- **Description:** translate the extension's interface into Portuguese, following the Chrome language (Portuguese when Chrome is in Portuguese).
- **Motivation:** not recorded (direct request).

## Backup and settings

### Sync across computers
- **Status:** Idea
- **Description:** keep the same notes on more than one computer.
- **Motivation:** today moving notes between computers is manual, via the JSON backup (SPEC.md).

## Administrative

### Publishing on the Chrome Web Store
- **Status:** Approved — 1.0.0 submitted, in review; leaves this file once it's live on the store
- **Description:** publish Draftab on the Chrome Web Store.
- **Motivation:** not recorded (came from the SPEC.md "Out of scope" list).
