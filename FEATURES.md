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

## Sidebar

### Hide the sidebar while typing
- **Status:** In progress — implemented; `npm test` (138 passed; no new unit tests, it's page behavior) and `npm run build` (with type check) OK. Waiting for the check in Chrome.
- **Description:** typing in the note hides the sidebar if it's showing; moving the mouse brings it back. If the sidebar was collapsed with the button, it stays collapsed until the user reopens it.
- **Motivation:** not recorded (direct request).
- **Deliverable:** automatic hiding on typing (not saved in Settings), shown again on mouse movement; the button's collapse keeps working as before.
- **How to verify:** `npm test` and `npm run build`; in Chrome: with the sidebar showing, type in the note → it hides; keep typing without touching the mouse → stays hidden; move the mouse → it comes back; collapse with the button, type and move the mouse → stays collapsed; reopen with the button → it works again; reload while auto-hidden → the sidebar shows.

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
