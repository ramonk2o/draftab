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

### Tag autocomplete in search
- **Status:** In progress — implemented; `npm test` (138 passed, including 7 new tests for tagsOf, tagSuggestions and wordAt) and `npm run build` (with type check) OK. Waiting for the check in Chrome.
- **Description:** the search suggests the tags that exist in the notes while typing.
- **Motivation:** not recorded (direct request).
- **Deliverable:** a suggestion list under the search while the word at the cursor starts with `#` (rules in SPEC.md): matching tags from all notes, most used first, with the number of notes; keyboard (↑/↓, Enter/Tab, Esc) and mouse.
- **How to verify:** `npm test` (new tests: tags of a note, counting and ordering of suggestions, the word at the cursor) and `npm run build`; in Chrome: type `#` → every tag with its count; `#pr` → only tags starting with it; ↑/↓ and Enter/Tab complete the word and filter the list; with `abc #pr` the `abc` stays; a click on a suggestion completes; Esc and clicking outside close; tags inside code aren't suggested.

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
