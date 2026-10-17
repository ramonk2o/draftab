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
- Minimal manifest permissions: `storage`, `unlimitedStorage`, `alarms`, `downloads`. Don't add others without recording it in SPEC.md.
- Everything in the project is in English: code, identifiers, comments, UI text and docs.
- The user reads basic JS: prefer direct, readable code over abstractions.

## Working rules
- Always reply to the user in Brazilian Portuguese, including intermediate messages.
- Use the `backlog` skill for everything about features: recording ideas, starting, finishing and approving them. Ideas go to BACKLOG.md, not SPEC.md.
- To implement a feature, use the `build` skill.
- Any change of behavior or decision goes to SPEC.md before the code. SPEC.md describes rules, not visual details.
- A feature's How to verify is `npm test` plus what to check in Chrome.
- CHANGELOG.md entries go under the version in progress, in Added / Changed / Fixed.
- Commit when a feature is finished (code, SPEC.md, BACKLOG.md and CHANGELOG.md together).
