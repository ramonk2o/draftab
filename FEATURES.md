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

### Clickable tags
- **Status:** Idea
- **Description:** the editor formats tags (`#example`) as links; clicking one puts the hashtag in the sidebar search.
- **Motivation:** not recorded (direct request).

## Sidebar

### Pin notes
- **Status:** In progress — implemented; `npm test` (124 passed, including the new sorting and backup tests) and `npm run build` (with type check) OK. Waiting for the check in Chrome.
- **Description:** pin notes; when several are pinned, they follow the default sort order among themselves.
- **Motivation:** not recorded (direct request).
- **Deliverable:** a pin button on each note in the sidebar (on hover, next to rename and delete) pins/unpins it. Pinned notes come first, sorted by the chosen order, with a divider before the others; a pinned note shows a pin instead of its date. Pinning doesn't change "last modified", syncs to other tabs and goes into backups (`pinned` field, SPEC.md).
- **How to verify:** `npm test` (new tests for the sorting with pinned notes and for `pinned` in backups) and `npm run build`; in Chrome: pin two notes → they go to the top with a pin and a divider below; switch the sort order in Settings → pinned stay on top, sorted among themselves; search → pinned matches first; date and order by last modified don't change when pinning; unpin → it goes back to its place; pin in one tab → the other tab updates, and typing in the other tab doesn't undo the pin; export a backup → `"pinned": true` in the file.

### Tag autocomplete in search
- **Status:** Idea
- **Description:** the search suggests the tags that exist in the notes while typing.
- **Motivation:** not recorded (direct request). Depends on "Clickable tags" (Editor).

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
