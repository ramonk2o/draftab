# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- How it works today: `SPEC.md`. Ideas and the feature in progress: `BACKLOG.md`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install`
- Develop (build in watch mode): `npm run dev`
- Build: `npm run build` (type-checks, output in `dist/`)
- Store package: `npm run zip` (builds `draftab-<version>.zip`; release steps in STORE.md → Publishing an update)
- Tests: `npm test` (Vitest)
- Load in Chrome: chrome://extensions → Developer mode → "Load unpacked" → `dist/`. After a rebuild, click ↻ on the extension and reopen the tab.

## Conventions
- Strict TypeScript; no React or other UI framework.
- All `chrome.storage` access goes through `src/storage.ts`.
- The Tiptap JSON is the source of truth for notes; markdown only on export.
- Manifest permissions: only those in SPEC.md → Technical decisions; a new one needs a reason in the feature's Decisions.
- Everything in the project is in English: code, identifiers, comments, UI text and docs.
- The user reads basic JS: prefer direct, readable code over abstractions.

## Tests
- Tests live next to the code they test: `src/<module>.test.ts`.
- `chrome.*` APIs (storage, alarms, downloads) are faked by `src/fake-chrome.ts`.
- The editor and the UI have no unit tests: their rules go into "To check by hand".

## Working rules
- Always reply to the user in Brazilian Portuguese, including intermediate messages.
- A feature's How to verify is `npm test` plus what to check in Chrome. The user checks in Chrome; use the browser only when they ask.

## Skills
The cycle below uses the `build`, `product` and `grilling` skills and the `feature-tester` agent. They are installed globally in `~/.claude/` (not in this repo). When a step needs one that isn't available, tell the user and stop; don't imitate it from memory. Reading the docs needs no skill.

## Development cycle
1. **Idea:** when I describe a feature idea, start a `grilling` interview right away. Before its final summary, load `product` and write the summary as the backlog entry, so my OK approves the text that will be recorded. If I say "just note it" or similar ("anota aí", "guarda essa ideia", "depois a gente vê"), skip the interview and record the idea with `product`.
2. **Record:** `product` records what was decided in the backlog.
3. **Build:** when I decide to implement a feature, use `build`.
4. **Bugs:** write a test that reproduces the bug and show it fails, fix it, record it with `product` (CHANGELOG under Fixed; SPEC.md if a rule changed) and commit. No backlog entry or tester. If the fix needs a decision about behavior, it's a feature: go to step 1.
5. **Release:** follow STORE.md → Publishing an update (version bump, `product` release, zip, submit).

Outside the cycle too, any change to BACKLOG.md, SPEC.md or CHANGELOG.md, even a one-word fix, goes through `product`. Reading them needs no skill.
