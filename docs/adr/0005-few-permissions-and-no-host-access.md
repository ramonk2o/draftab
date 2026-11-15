# Few permissions, and no host access

The extension asks only for what its features need (the list and the reason for each are in `STORE.md`) and has no host permissions: `activeTab` gives access only to the tab where the user clicked the icon or the menu item, and only at that moment. A new permission is decided together with its feature, with its reason.

## Consequences

A new permission means updating the table in `STORE.md` and `PRIVACY.md`; `src/conventions.test.ts` checks that the manifest and `STORE.md` agree. Pages where extensions can't run (`chrome://`, the Chrome Web Store, the PDF viewer) can't be saved.
