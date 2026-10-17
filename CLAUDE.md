# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- How it behaves today (rules, not visuals), data model and technical decisions: `SPEC.md`
- Ideas and the feature in progress: `BACKLOG.md`, managed with the `backlog` skill

## Commands
- Install: `npm install`
- Develop (build in watch mode): `npm run dev`
- Build: `npm run build` (output in `dist/`)
- Store package: `npm run zip` (builds `draftab-<version>.zip`; bump the version in `package.json` and `public/manifest.json` first, see STORE.md)
- Tests: `npm test` (Vitest)
- Load in Chrome: chrome://extensions → Developer mode → "Load unpacked" → `dist/`. After a rebuild, click ↻ on the extension and reopen the tab.

## Conventions
- Strict TypeScript; no React or other UI framework.
- All `chrome.storage` access goes through `src/storage.ts`.
- The Tiptap JSON is the source of truth for notes; markdown only on export.
- Manifest permissions: only those in SPEC.md → Technical decisions; a new one needs a reason in the feature's Decisions.
- Everything in the project is in English: code, identifiers, comments, UI text and docs.
- The user reads basic JS: prefer direct, readable code over abstractions.

## Working rules
- Always reply to the user in Brazilian Portuguese, including intermediate messages.
- A feature's How to verify is `npm test` plus what to check in Chrome.
- SPEC.md is updated when a feature goes to In review, describing what was built, in the same commit. SPEC.md describes rules, not visual details.
- CHANGELOG.md entries say what changed for the user in one or two sentences; the detailed rules live only in SPEC.md.

## Development cycle
1. **Idea:** when I describe a feature idea, start a `grilling` interview right away. If I say "just note it" or similar ("anota aí", "guarda essa ideia", "depois a gente vê"), skip it and record the idea with the `backlog` skill, with the doubts as Open questions.
2. **Record:** the interview's final summary is the draft of the backlog entry (Motivation, Description, Decisions…). One OK from me and the `backlog` skill writes and commits it: Idea, or Approved if I said I want it built. When the feature changes an existing behavior, its Decisions say which SPEC.md rule changes and how.
3. **Build:** when I decide to implement a feature, use the `build` skill.
