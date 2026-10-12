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
- **Status:** In progress — round 2 after the user's test: gray instead of purple, smaller, underline and hand cursor on hover. `npm test` (131 passed) and `npm run build` OK. Waiting for the check in Chrome.
- **Description:** the editor formats tags (`#example`) as links; clicking one puts the hashtag in the sidebar search.
- **Motivation:** not recorded (direct request).
- **Deliverable:** tags (rules in SPEC.md) shown in monospace and in their own color, without changing the stored note; Cmd/Ctrl+click puts the tag in the sidebar search and opens the sidebar if collapsed.
- **How to verify:** `npm test` (new tests for what counts as a tag) and `npm run build`; in Chrome: type `#idea`, `#project-x`, `#ação` → monospace and colored while typing; `C#`, `site.com/#x`, `#2026`, `# heading` and tags inside code aren't; plain click puts the cursor in the tag; Cmd/Ctrl+click fills the search with the tag and filters the list (with the sidebar collapsed, it opens); export and copy still give the plain `#idea`.

## Sidebar

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
