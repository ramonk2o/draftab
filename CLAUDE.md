# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- Specification and decisions: `SPEC.md`
- Stages and status: `PLAN.md`

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
- Implement one PLAN.md stage at a time.
- Before declaring something done, run the stage's verification and show the result.
- When finished: update the **Status** in PLAN.md and commit.
- Any change of decision goes to SPEC.md before the code.

## Feature backlog

Feature ideas live in FEATURES.md, not in SPEC.md or PLAN.md. Read the file before changing it. An idea only becomes a PLAN.md stage when I decide to implement it.

- **Add an idea:** if it's vague, ask 2 or 3 short questions before saving (what problem does it solve? how do I imagine it working?); if it's clear, record it right away. Write the description and motivation based on what I said, without inventing requirements. Check whether an identical or similar feature already exists and, if so, ask whether to merge it or create a separate one. Put it in the right area; if none fits, propose a new section and confirm. Initial status: Idea. Only record it, don't implement it.
- **Present:** summary by area, with the name and status of each feature. Apply the filter I ask for (area, status). Detail a feature only if I ask.
- **Clean up:** identify duplicates, similar ones that could be merged, ones already implemented in the code, and discarded ones. Show what you intend to change and wait for my OK. Move implemented and discarded ones to "Archive", without deleting; only delete if I explicitly ask.
- **Reorganize:** if the areas stopped making sense (section too big, features in the wrong place), propose the new structure and apply it only after it's approved.
- **Change status:** update the field when I say so. If it becomes Implemented or Discarded, ask whether it should go to "Archive".
