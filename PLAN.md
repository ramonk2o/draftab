# Plan

Development stages. One stage at a time: each has a deliverable, how to verify it and a status. Once the user approves a stage in use, it moves to the **Done** list as one line; its full description and verification results stay in the git history (commits "Stage N: …").

## In progress

Nothing right now. The next stage comes from FEATURES.md when the user decides to implement an idea.

<!-- Template for a new stage:
## Stage N: <name>
- **Deliverable:** what will exist at the end.
- **How to verify:** `npm test` plus what to check in Chrome.
- **Status:** in progress / implemented (verification results); waiting for the user's test / done.
-->

## Done

1. Walking skeleton
2. Full block editor + drag
3. Persistence and note list
4. Manual backup
5. Automatic backup
6. Dark theme
7. Ready to publish (1.0.0 submitted to the Chrome Web Store, in review)
8. Note sort order
9. Note typography
10. Double-click a handle to select and copy
11. Export a note as Markdown
12. Backspace turns code blocks and quotes back into text
13. Import a file as a note; backup only in Settings
14. Export and copy buttons on the note page
15. Character counts on the note page
16. Text size per note

Stages 8–16 go to the store in 1.1.0 (see CHANGELOG.md).
