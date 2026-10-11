# Plan

Stages ordered by risk: whatever could invalidate the idea comes first.

## Stage 1: Walking skeleton
- **Deliverable:** Vite + TypeScript project, MV3 manifest overriding the new tab, page with a basic Tiptap editor (StarterKit). Library versions pinned after checking the current Tiptap 3 docs.
- **How to verify:** `npm install && npm run build` with no errors; in chrome://extensions, "Load unpacked" pointing to `dist/`; open a new tab, type `# hi` and see a heading.
- **Status:** done (install, build and `npm test` with no errors; manual test in Chrome ok: `# hi` becomes a heading). Pinned versions: Tiptap 3.31.4, Vite 8.3.4, TypeScript 7.0.2, Vitest 5.0.3.

## Stage 2: Full block editor + drag
- **Deliverable:** every block in scope (headings, lists, checklist, code, quote, divider, inline marks, links), a DragHandle to the left of each block, and block CSS.
- **How to verify:** manual checklist — each markdown shortcut in the SPEC becomes the right block; dragging a block to the top and to the end of the note works; checklist is clickable.
- **Status:** done. Build ok; shortcuts and dragging tested in Chrome (automated script) and manual checklist approved. Beyond the plan: animated reordering, dragging whole lists and blocks across levels (see SPEC).

## Stage 3: Persistence and note list
- **Deliverable:** `src/storage.ts` (CRUD on `chrome.storage.local`), a new note per tab, empty notes discarded, automatic title from the first line until the note is renamed, collapsible sidebar with search, rename and delete, sync across tabs via `chrome.storage.onChanged`.
- **How to verify:** `npm test` passes (CRUD with a simulated `chrome.storage`). Manual: reloading keeps notes and block order; opening and closing a tab without typing creates no note; two tabs on the same note update each other; renaming fixes the title; collapsing the sidebar persists after reload.
- **Status:** done. `npm test`: 23 tests ok; manual script run in Chrome with the extension loaded (18 checks ok) and approved in use. Extra tweaks: minimalist icons, search with magnifier, checkbox and handle alignment.

## Stage 4: Manual backup
- **Deliverable:** export/import icons and gear at the top of the sidebar; Settings page with Export (JSON in the SPEC format, including markdown) and Import (validates `app`/`version`, confirms, replaces everything).
- **How to verify:** `npm test` passes (export → import returns identical data; invalid file is rejected). Manual: export, delete a note, import and see the note back.
- **Status:** done. `npm test`: 39 tests ok (export → import identical; 9 kinds of invalid file rejected); manual script in Chrome with the extension: 13 checks ok; approved in use. File name: `draftab_YYYY-MM-DD-HHhMM.json`.

## Stage 5: Automatic backup
- **Deliverable:** interval picker in Settings (off, every minute, hourly, daily, weekly, monthly), `chrome.alarms` + `chrome.downloads` in the service worker, skips when nothing changed, shows the date of the last backup. Settings in a lightbox, with a "Delete all notes" section (typed confirmation).
- **How to verify:** with the "every minute" interval, edit a note and see the file in `Downloads/draftab-backups/`; without editing, no new file appears. The lightbox closes with ×, Esc and a click outside; deleting everything only works with "delete everything" typed.
- **Status:** done. `npm test`: 52 tests ok; in Chrome with the extension: real every-minute backup (8 checks ok) and lightbox, intervals and delete-all (18 checks ok); approved in use.

## Stage 6: Dark theme
- **Deliverable:** interface colors in CSS variables, dark theme, "Theme" option in Settings (Automatic / Light / Dark) and a theme button next to the sidebar button, applied immediately to all tabs and without flashing the wrong theme on open.
- **How to verify:** `npm test` passes. In Chrome: with macOS in dark mode and the Automatic theme, the page opens dark; Light and Dark force the theme; changing it in one tab changes the others; every element (editor, blocks, sidebar, handles, lightbox, fields) is readable in both themes.
- **Status:** done. `npm test`: 56 tests ok; in Chrome with the extension: themes, sync, no flash on open, WCAG contrast, theme button and backup with all settings verified; approved in use.

## Stage 7: Ready to publish
- **Deliverable:** extension icons in the manifest, version 1.0.0, `npm run zip` (package + third-party license notices), `PRIVACY.md`, `STORE.md` (en-US and pt-BR listing texts, single purpose, permission justifications, data disclosure), store images (1280×800 screenshots in both languages, 440×280 promo tile), and a step-by-step submission guide.
- **How to verify:** `npm test` passes; `npm run zip` produces a .zip that loads in Chrome with the icons showing and everything working; store images have the exact required sizes; every field the store asks for has a ready text. Then the user submits it in the Chrome Web Store dashboard.
- **Status:** ready for submission. `npm test`: 56 tests ok; `npm run zip` builds draftab-1.0.0.zip (icons, localized description, LICENSE, third-party notices); the unzipped package loads in Chrome with the 4 icons and works; every E2E script passes; 10 screenshots at 1280×800 and 2 promo tiles at 440×280. Waiting for the user to submit in the Chrome Web Store dashboard.

## Stage 8: Note sort order
- **Deliverable:** "Sort notes by" in Settings (Last modified / Title A–Z / Date created), default last modified; the sidebar list and its dates follow the choice in every open tab; the setting goes into backups.
- **How to verify:** `npm test` passes (sorting rules, setting saved/read/validated, included in the backup). In Chrome: each option reorders the list correctly; switching in one tab updates the others; the choice survives a reload.
- **Status:** implemented (`npm test`: 63 tests ok, 7 new for sorting and the setting; in Chrome with the extension: each option, sync across tabs, persistence after reload, editing under date-created order, search keeping the order — 9 checks ok; the setting goes in and out of backups; earlier E2E scripts still pass); waiting for the user's test in Chrome.
