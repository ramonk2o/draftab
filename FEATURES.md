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

## Interface

### Portuguese translation
- **Status:** In progress — implemented; `npm test` (144 passed, including 6 new i18n tests and the backup/storage tests updated for the `language` setting) and `npm run build` (with type check) OK. Waiting for the check in Chrome.
- **Description:** translate the extension's interface into Portuguese, following the Chrome language (Portuguese when Chrome is in Portuguese), as an option in Settings.
- **Motivation:** not recorded (direct request).
- **Deliverable:** "Language" in Settings (Automatic / English / Português, default Automatic); every interface text in both languages through `src/i18n.ts`; dates and numbers in the chosen language; changing it reloads the open tabs in the new language (rules in SPEC.md).
- **How to verify:** `npm test` (new tests: language resolution, both dictionaries with the same keys and placeholders, Portuguese plurals) and `npm run build`; in Chrome: with Automatic and Chrome in Portuguese everything is in Portuguese; choose English → every open tab reloads in English, with typing kept; walk through the sidebar (empty list, search, tag suggestions, pin, rename, delete confirmation), note page buttons and tooltips, character counts, "Copied", Settings (every section, backup messages, delete phrase "apagar tudo"), import errors; export a backup → `"language"` in its settings; import a backup with another language → tabs reload in it.

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
