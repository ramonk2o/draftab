# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- Vocabulary: `GLOSSARY.md`. Decisions and why: `docs/adr/`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install` (also turns on the pre-commit hook in `.githooks/`: tests and type check before every commit that touches code)
- Develop (build in watch mode): `npm run dev`
- Build: `npm run build` (type-checks, output in `dist/`)
- Type check only: `npm run typecheck`
- Store package: `npm run zip` (builds `draftab-<version>.zip`; release steps in STORE.md → Publishing an update)
- Tests: `npm test` (Vitest); a single file: `npx vitest run src/<module>.test.ts`
- Load in Chrome: chrome://extensions → Developer mode → "Load unpacked" → `dist/`. After a rebuild, click ↻ on the extension and reopen the tab.

## Conventions
- Strict TypeScript; no React or other UI framework.
- All `chrome.storage` access goes through `src/storage.ts`.
- The Tiptap JSON is the source of truth for notes; markdown only on export.
- Manifest permissions: only those justified in the STORE.md table (see `docs/adr/0005`); a new one needs a reason in its issue and PR, and goes into that table and PRIVACY.md (`src/conventions.test.ts` checks that the manifest and STORE agree).
- Everything in the project is in English: code, identifiers, comments, UI text, docs, issues, PRs and commit messages.
- The user reads basic JS: prefer direct, readable code over abstractions.
- Changelog: every PR with a change the people who use the extension notice adds a line under `[Unreleased]` in CHANGELOG.md. Refactoring, tests and tooling don't.

## Tests
- Tests live next to the code they test: `src/<module>.test.ts`.
- Where tests go in:
  - Pure logic (`calculate`, `markdown`, `markdown-paste`, `tags`, `backup`, `notes`…): call the module's exported functions.
  - Editor rules that change the document (commands, shortcuts, conversions, pasting): `EditorState` and the real schema, as in `src/unwrap-block.test.ts`.
  - Anything that touches `chrome.*` (storage, alarms, downloads): through `src/storage.ts` or the module itself, with the fake in `src/fake-chrome.ts`.
- Not tested: the page wiring in `src/newtab.ts` and the `*-ui.ts` files, and what needs a real browser (focus, dragging, clipboard, visuals). The user checks those in Chrome. Logic that needs a test goes into a module, not into those files.

## Working rules
- Always reply to the user in Brazilian Portuguese, including intermediate messages.
- The user checks things in Chrome; use the browser only when they ask.
- Releases: follow STORE.md → Publishing an update.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `ramonk2o/draftab` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
