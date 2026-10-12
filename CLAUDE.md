# Draftab

Chrome extension (Manifest V3) that replaces the new tab with a notepad with a markdown block editor (Tiptap 3) and drag-to-reorder.
- How it behaves today (rules, not visuals), data model and technical decisions: `SPEC.md`
- Ideas and the feature in progress: `FEATURES.md`

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
- Implement one feature at a time. Before starting, mark it **In progress** in FEATURES.md (create the entry if it was a direct request) with **Deliverable** and **How to verify**.
- Before declaring something done, run its How to verify and show the result.
- When finished: record the verification results in its status in FEATURES.md, record the change in CHANGELOG.md under the version in progress (Added / Changed / Fixed), and commit.
- Once I approve it in use, remove it from FEATURES.md: implemented features live only in CHANGELOG.md (and SPEC.md, git history).
- Any change of behavior or decision goes to SPEC.md before the code. SPEC.md describes rules, not visual details.

## Feature backlog

Feature ideas live in FEATURES.md, not in SPEC.md. Read the file before changing it. An idea only becomes In progress when I decide to implement it.

- **Add an idea:** if it's vague, ask 2 or 3 short questions before saving (what problem does it solve? how do I imagine it working?); if it's clear, record it right away. Write the description and motivation based on what I said, without inventing requirements. Check whether an identical or similar feature already exists and, if so, ask whether to merge it or create a separate one. Put it in the right area; if none fits, propose a new section and confirm. Initial status: Idea. Only record it, don't implement it.
- **Present:** summary by area, with the name and status of each feature. Apply the filter I ask for (area, status). Detail a feature only if I ask.
- **Clean up:** identify duplicates, similar ones that could be merged, ones already implemented in the code, and discarded ones. Show what you intend to change and wait for my OK. Implemented ones leave the file (checking they're in CHANGELOG.md); discarded ones go to "Discarded".
- **Reorganize:** if the areas stopped making sense (section too big, features in the wrong place), propose the new structure and apply it only after it's approved.
- **Change status:** update the field when I say so. Done (approved in use) → it leaves the file and goes to CHANGELOG.md; Discarded → "Discarded" section.
