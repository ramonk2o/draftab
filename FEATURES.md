# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Backspace undoes headings
- **Status:** In progress — implemented; `npm test` (147 passed, including 3 new heading tests) and `npm run build` (with type check) OK. Waiting for the check in Chrome.
- **Description:** a way to turn a heading back into a paragraph: Backspace at the start of the heading, like code blocks and quotes.
- **Motivation:** there was no visible way to undo a heading (only Tiptap's Cmd/Ctrl+Option/Alt+0 shortcut).
- **Deliverable:** Backspace at the start of a heading (any level, also inside a quote) turns it into a paragraph with the same text and marks; its own undo step.
- **How to verify:** `npm test` (new tests in unwrap-block.test.ts) and `npm run build`; in Chrome: `# Title`, cursor at the start, Backspace → paragraph "Title"; again Backspace → joins with the block above, as usual; Cmd/Ctrl+Z brings the heading back; right after typing `# `, Backspace still gives back the `# `.

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
