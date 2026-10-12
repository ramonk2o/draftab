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

### Handle position and size
- **Status:** In progress — implemented; `npm test` (122 passed) and `npm run build` OK. Waiting for the check in Chrome.
- **Description:** move the drag handles a bit further to the left and make their clickable area slightly bigger.
- **Motivation:** not recorded (direct request).
- **Deliverable:** block handles 24×28 px (were 20×26) with 8 px of gap to the text (was 4 px); the whole-list bar 20 px wide (was 16) and further out (52 px from the list, was 44), so it doesn't overlap the list items' handles.
- **How to verify:** `npm test` and `npm run build` pass; in Chrome, the handle of paragraphs, headings and list items sits further from the text and is easier to hit; the whole-list bar is still to the left of the item handles, without overlapping; dragging and double-click to copy still work.

## Sidebar

### Pin notes
- **Status:** Idea
- **Description:** pin notes; when several are pinned, they follow the default sort order among themselves.
- **Motivation:** not recorded (direct request).

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
