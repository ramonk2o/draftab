# Draftab features

Features from idea to done: the backlog of ideas and the one being built.

How a feature moves:
- **Idea** → **Approved** (decided, not started) → **In progress** → done.
- When work starts (on an idea from here or on a direct request), the entry becomes **In progress** and gets two more fields: **Deliverable** (what will exist at the end) and **How to verify** (`npm test` plus what to check in Chrome). One feature in progress at a time.
- When it's implemented, the status records the verification results and waits for the user's test in Chrome.
- Once done, it **leaves this file**: what changed goes to CHANGELOG.md (under the version in progress) and the rules to SPEC.md. The full detail stays in the git history.
- A discarded idea goes to a "Discarded" section at the end, so it isn't proposed again.

## Editor

### Copy for WhatsApp
- **Status:** In progress — implemented; `npm test` 113/113 passing (10 new in `whatsapp.test.ts`), `npm run build` OK; waiting for the test in Chrome / WhatsApp Web
- **Description:** a button on the note page that copies the note in WhatsApp's formatting, leaving out the first line (the title).
- **Motivation:** "Copy note" uses standard markdown (`**bold**`, `# heading`), which WhatsApp doesn't understand.
- **Deliverable:** a "Copy for WhatsApp" button next to Copy note; `src/whatsapp.ts` converts the note; tests in `src/whatsapp.test.ts`.
- **How to verify:** `npm test` and `npm run build`; in Chrome, copy a note with a title, bold/italic/strike/code, lists, checklist, quote, code block and link, paste it into WhatsApp Web, and check that the first line is gone and the formatting shows correctly.

### Copy note without the first line
- **Status:** In progress — implemented; `npm test` 116/116 passing (3 new in `notes.test.ts`), `npm run build` OK; waiting for the test in Chrome
- **Description:** "Copy note" leaves out the first line (the title) and the empty lines right after it, like Copy for WhatsApp.
- **Motivation:** direct request.
- **Deliverable:** `withoutFirstLine` in `src/notes.ts`, used by Copy note (formatted and markdown) and by Copy for WhatsApp; tests in `src/notes.test.ts`.
- **How to verify:** `npm test` and `npm run build`; in Chrome, on a note with a title, empty lines and text, click Copy note and paste into a formatted app (Google Docs) and a plain-text one: the title and the empty lines after it are gone.

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
