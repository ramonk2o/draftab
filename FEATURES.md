# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Strikethrough and underline shortcuts
- **Status:** Implemented, waiting for the test in Chrome. `npm test`: 156 tests passing (new: the `++` pattern while typing and pasting, including `C++`, `1 ++ 2 ++` and spaces just inside the marks left alone; `~~` / `++` in markdown export and import). `npm run build` OK. The Chrome check is pending.
- **Description:** markdown shortcuts for strikethrough (`~~text~~`) and underline (`++text++`), while typing and when pasting.
- **Motivation:** the two marks existed only through Cmd+Shift+S and Cmd+U; strikethrough already worked with `~~` but wasn't documented, and underline had no shortcut.
- **Deliverable:** `++text++` becomes underlined while typing and when pasting; `~~text~~` (Tiptap's) recorded in SPEC.md; both read from and written to `.md` files (`~~` / `++`).
- **How to verify:** `npm test` (new tests for the `++` pattern and for `~~` / `++` in markdown import and export). In Chrome: type `++word++` and `~~word~~` in a note, paste `a ++b++ c`, and export the note as Markdown.

### Tables
- **Status:** Idea
- **Description:** a table block in notes.
- **Motivation:** not recorded (came from the SPEC.md "Out of scope" list).

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
