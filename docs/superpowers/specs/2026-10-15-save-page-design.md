# Save a page to Draftab — design

Date: 2026-10-15 · Status: approved in conversation, waiting for review of this document

## Goal
Turn web content into a Draftab note in one click:
- **Toolbar icon:** clicking Draftab's icon saves the page's main text as a new note.
- **Context menu:** selecting a passage, right-clicking and choosing "Save to Draftab" saves only the selection.

The HTML is converted into Draftab blocks (the Tiptap JSON stays the source of truth; markdown shows up on export as usual).

## Decisions (from the conversation)
- After saving, **a new Draftab tab opens with the note**.
- The note is **page title + link to the source + content**.
- Main text is found with **Mozilla Readability** (`@mozilla/readability`, Apache 2.0). It's an exception to "every dependency is MIT", recorded in SPEC.md; its license goes into `THIRD_PARTY_NOTICES.txt`, which `npm run zip` already builds from every shipped dependency.

## Behavior (goes to SPEC.md)
- Clicking the toolbar icon on a web page saves its main text as a new note and opens it in a new Draftab tab.
- Right-clicking a text selection shows "Save to Draftab" (only when there's a selection). It saves just the selection, the same way.
- The note:
  1. a `#` heading with the page title (the domain when the page has no title);
  2. a paragraph with the page's address, as a link;
  3. the content.
- Content headings move down a level so the page title is the only `#`: `h1`/`h2` → `##`, `h3`–`h6` → `###`.
- Kept: paragraphs, lists (also nested), quotes, code blocks, dividers, links, bold, italic, strikethrough, underline, inline code, line breaks. Links become absolute addresses.
- Dropped: images, video, iframes, forms. Tables lose their structure; their text stays as paragraphs.
- The title is automatic (the first line). Font and text size come from the "new notes" settings, like an imported file.
- Errors open the Draftab tab with a message, and no note is created:
  - a page extensions can't run on (`chrome://`, the Chrome Web Store, the PDF viewer, Draftab itself): "This page can't be saved";
  - Readability finds no main text: "Couldn't find the main text of this page. Select a passage and use right-click → Save to Draftab".
  - a selection with no text left after conversion (e.g. only an image): the same as no main text.

## Architecture
```
icon click / context menu (service worker, background.ts)
  └─ chrome.scripting.executeScript on the tab (activeTab)
       ├─ icon: clip-page.js → Readability on a clone of the document → { title, url, html }
       └─ menu: a small function → HTML of the selection's ranges → { title, url, html }
  └─ saves { title, url, html, createdAt } to chrome.storage.local as `clip:<uuid>` (through storage.ts)
     (or `{ error: 'unavailable' | 'empty' }`)
  └─ chrome.tabs.create({ url: 'newtab.html?clip=<uuid>' })

newtab.ts on load with ?clip=<uuid>
  └─ reads and deletes `clip:<uuid>`
  └─ clipToNote(clip, textSize, font): HTML → Tiptap JSON (generateJSON with the content
     schema, so only Draftab blocks survive) + heading shift + title/link blocks
  └─ empty content → message; otherwise saveNote + open it
  └─ removes `?clip=` from the address (a reload doesn't create the note again)
```
- The conversion runs in the new tab because the service worker has no DOM. No offscreen document and no extra permission.
- Leftover `clip:*` keys older than 10 minutes (the tab was closed before it loaded) are deleted — only old ones, so two quick captures don't delete each other — when the service worker starts and before each new capture.
- `clip:*` keys never go into backups (backups only read `note:*`) and don't count as notes.
- Manifest: `"action": {}` (no popup; the tooltip is set by the service worker), plus the permissions `activeTab`, `scripting` and `contextMenus`. Readability is bundled into a separate entry (`clip-page.js`), injected only on click, so the new tab doesn't load it.

## New permissions (SPEC.md first, then STORE.md and PRIVACY.md)
| Permission | Why |
|---|---|
| `activeTab` | Read the current tab only, and only when the user clicks the icon or the menu item. No access to any site otherwise. |
| `scripting` | Run the capture code in that tab at that moment. |
| `contextMenus` | The "Save to Draftab" item on selected text. |

PRIVACY.md changes "does not read the pages you visit" to: it reads only the page (or selection) you ask it to save, at that moment, and keeps it as a local note; nothing is sent anywhere. The store's single purpose gains "and saves web pages or passages into notes".

## Files
- `src/clip.ts`: `clipToNote(clip, textSize, font)` and the HTML → blocks rules (pure, testable).
- `src/clip-page.ts`: injected script; Readability → `{ title, url, html }`.
- `src/background.ts`: action click, context menu, executeScript, saving the pending clip, opening the tab, cleanup.
- `src/storage.ts`: `saveClip`, `takeClip` (read + delete), `deleteOldClips`.
- `src/newtab.ts`: `?clip=` handling on load.
- `src/i18n.ts`: menu text, action title, the two messages (EN/PT).
- `public/manifest.json`, `vite.config.ts` (new entry), `SPEC.md`, `STORE.md`, `PRIVACY.md`, `README.md`, `FEATURES.md`, `CHANGELOG.md`.
- The menu item and the icon's tooltip follow the interface language: the service worker sets them from our dictionary (`chrome.contextMenus.update`, `chrome.action.setTitle`) at startup and when the language changes. No `_locales` changes.

## Testing
- Vitest (`clip.test.ts`, with a DOM test environment `happy-dom`, MIT, dev only): heading shift, lists and nesting, links made absolute, marks kept, images/iframes dropped, table text kept, title/link blocks, title fallback to the domain, empty content → null.
- Vitest (`storage.test.ts`): saveClip/takeClip deletes the key; old clips are cleaned; clips don't appear in `listNotes` or backups.
- Chrome, by hand: a blog article, a news page, a selection with a list and a link, a `chrome://` page (message), Draftab's own page (message), reload of the opened note doesn't duplicate it.

## Out of scope
- Images, tables as tables, saving into an existing note, a popup, keyboard shortcut.
