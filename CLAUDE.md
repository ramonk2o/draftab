# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- How it works today: `SPEC.md`. Ideas and the feature in progress: `BACKLOG.md`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install` (also turns on the pre-commit hook in `.githooks/`: tests and type check before every commit that touches code)
- Develop (build in watch mode): `npm run dev`
- Build: `npm run build` (type-checks, output in `dist/`)
- Store package: `npm run zip` (builds `draftab-<version>.zip`; release steps in STORE.md → Publishing an update)
- Tests: `npm test` (Vitest)
- Load in Chrome: chrome://extensions → Developer mode → "Load unpacked" → `dist/`. After a rebuild, click ↻ on the extension and reopen the tab.

## Conventions
- Strict TypeScript; no React or other UI framework.
- All `chrome.storage` access goes through `src/storage.ts`.
- The Tiptap JSON is the source of truth for notes; markdown only on export.
- Manifest permissions: only those in SPEC.md → Technical decisions; a new one needs a reason in the feature's Decisions, and goes into SPEC.md, the justification table in STORE.md and PRIVACY.md (`src/conventions.test.ts` checks that the manifest, SPEC and STORE agree).
- Everything in the project is in English: code, identifiers, comments, UI text and docs.
- The user reads basic JS: prefer direct, readable code over abstractions.

## Tests
- Tests live next to the code they test: `src/<module>.test.ts`.
- `chrome.*` APIs (storage, alarms, downloads) are faked by `src/fake-chrome.ts`.
- Editor rules that change the document (commands, shortcuts, conversions, pasting) are tested with `EditorState` and the real schema, as in `src/unwrap-block.test.ts`. Only what needs a real browser (focus, dragging, clipboard, visuals) goes into "To check by hand".

## Working rules
- Always reply to the user in Brazilian Portuguese, including intermediate messages.
- The user checks things in Chrome; use the browser only when they ask.

## Development cycle
Uses the `grilling`, `product` and `build` skills and the `feature-tester` agent, installed globally in `~/.claude/`. When a step needs one that isn't available, tell the user and stop; don't imitate it from memory.

1. **Idea:** if the idea is clear, record it with `product`. If it leaves behavior open (decisions that would change what gets built), start a `grilling` interview; before its final summary, load `product` and write the summary as the backlog entry, so my OK approves the text that will be recorded. "Just note it" ("anota aí", "depois a gente vê") always skips the interview.
2. **Build:** `build`.
3. **Bugs:** no backlog entry or tester. If the bug can be reproduced in a test (editor rules included, see Tests), write the test and show it fails, then fix it. If it needs a real browser, put the steps to reproduce it in the commit message's `To check by hand:` block. Record it with `product` (CHANGELOG under Fixed; SPEC.md if a rule changed) and commit. If the fix needs a decision about behavior, it's a feature: go to step 1.
4. **Release:** follow STORE.md → Publishing an update.
