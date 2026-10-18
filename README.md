# Draftab

A Chrome extension ([Chrome Web Store](https://chromewebstore.google.com/detail/draftab/oamemjkhgfcoelilpnjpemllbmladaog)) that turns the **new tab** into a local notepad. The editor is made of blocks: you type markdown and it becomes formatting right away, and you can **drag any block** to reorder it. Everything is stored in your browser, with JSON backups (manual and automatic).

![Draftab in the light theme](docs/screenshots/light.png)

<details>
<summary>Dark theme</summary>

![Draftab in the dark theme](docs/screenshots/dark.png)

</details>

## Features

An overview; every rule is in [SPEC.md](SPEC.md).

- **Notes**: each new tab is a new note, saved as you type. Empty notes are never kept, the title follows the first line until you rename it, and open tabs stay in sync.
- **Writing**: markdown shortcuts as you type (headings, lists, checklists, quotes, code, links, formatting), highlight colors, images from web addresses, `#tags`, calculations after `=`, color swatches and a calendar that inserts dates.
- **Drag to reorder**: every block has a handle; lists, items and paragraphs also move in and out of lists.
- **Sidebar**: search with tag suggestions, sorting, pinned notes, rename, delete, and importing `.md` or `.txt` files as notes.
- **Note page**: font and text size per note, export as Markdown, copy (formatted, or for WhatsApp) and character counts.
- **Saving web pages**: the toolbar icon saves a page's main text as a note; right-click saves a selected passage.
- **Settings and backup**: JSON backups, manual and automatic; light, dark or automatic theme; English or Portuguese.
- **Privacy**: nothing leaves your computer. No account, no server, no analytics.

## Install

**[Install Draftab from the Chrome Web Store](https://chromewebstore.google.com/detail/draftab/oamemjkhgfcoelilpnjpemllbmladaog)** and open a new tab. Chrome keeps it up to date.

### From the source

To run the latest code (it may have features not yet in the store):

1. Install [Node.js](https://nodejs.org) (20.19+ or 22.12+; the current LTS works) and have Google Chrome.
2. Get the code and build the extension:
   ```sh
   git clone https://github.com/ramonk2o/draftab.git
   cd draftab
   npm install
   npm run build
   ```
3. Open `chrome://extensions`, turn on **Developer mode** (top-right corner), click **Load unpacked** and choose the `dist/` folder.
4. Open a new tab.

To update later: `git pull`, `npm run build` and click ↻ on the Draftab card in `chrome://extensions`.

> **Important:** notes are stored inside the extension. **Uninstalling Draftab deletes all notes.** Export a backup before uninstalling or switching computers.

### Automatic backup and the "where to save" question

If Chrome's **"Ask where to save each file before downloading"** option is on (`chrome://settings/downloads`), Chrome will ask on every automatic backup. For silent backups, turn that option off.

## Development

### Stack

- **Chrome Extension Manifest V3** (`chrome_url_overrides.newtab` + service worker).
- Strict **TypeScript**, **no UI framework** (no React or similar): the interface around the editor is small and written directly against the DOM.
- **[Tiptap 3](https://tiptap.dev)** (on top of ProseMirror) for the editor, with `StarterKit`, `TaskList/TaskItem`, `DragHandle` and `@tiptap/markdown` (export only).
- **[Vite](https://vite.dev)** for the build and **[Vitest](https://vitest.dev)** for tests.

### Commands

| Command | What it does |
|---|---|
| `npm install` | Installs dependencies |
| `npm run dev` | Build in *watch* mode: rebuilds on every change (then ↻ on the extension and reopen the tab) |
| `npm run build` | Type-checks and builds the extension into `dist/` |
| `npm test` | Runs the tests (Vitest) |
| `npm run zip` | Builds `draftab-<version>.zip` for the Chrome Web Store, with license notices (see [STORE.md](STORE.md)) |

### Structure

- `src/`: one module per feature, with its tests next to it (`<module>.test.ts`); `storage.ts` is the single access point to `chrome.storage`.
- `public/`: the manifest, icons, `_locales/` and `theme-init.js`, copied as they are to `dist/`.
- `scripts/`: the store package (`zip.mjs`) and the screenshots (`screenshots.mjs`).
- `docs/`: images for this README and the Chrome Web Store.

### How data is stored

Notes and settings stay in this browser (`chrome.storage.local`). The data model, the backup file format and the reasons behind them are in [SPEC.md](SPEC.md) (Data model, Technical decisions).

### Permissions

The permissions are listed in [SPEC.md](SPEC.md) (Technical decisions), and what each one is for in [STORE.md](STORE.md) (Privacy practices).

### Tests

`npm test` (Vitest) covers everything that doesn't need a browser, editor rules included, with `chrome.storage`, alarms and downloads simulated in `src/fake-chrome.ts`. What needs a real browser (focus, dragging, clipboard, visuals) is checked in Chrome: each change lists it under "To check by hand:" in its commit message, and those lists are confirmed before every release (see [STORE.md](STORE.md)). A pre-commit hook (turned on by `npm install`) runs the tests and the type check before every commit that touches code.

### Project documents

| File | Contents |
|---|---|
| [SPEC.md](SPEC.md) | How Draftab behaves today (rules by area), data model and technical decisions |
| [BACKLOG.md](BACKLOG.md) | Ideas, by area, and the feature in progress; done features move to CHANGELOG.md |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [STORE.md](STORE.md) | Chrome Web Store listing texts (en-US and pt-BR), privacy answers and how to submit or update |
| [PRIVACY.md](PRIVACY.md) | Privacy policy (English and Portuguese) |
| [CLAUDE.md](CLAUDE.md) | Project instructions and conventions for [Claude Code](https://claude.com/claude-code) (they apply to humans too) |

### Conventions

The code conventions, test conventions and development cycle are in [CLAUDE.md](CLAUDE.md).

## Contributing

Contributions are welcome. To propose a change:

1. Open an *issue* describing the problem or the idea (ideas can also go into [BACKLOG.md](BACKLOG.md)).
2. *Fork* the repo, create a branch and follow the conventions in [CLAUDE.md](CLAUDE.md).
3. Make sure `npm run build` and `npm test` pass, and test what changed in Chrome.
4. Open a *pull request* explaining what changed and how to verify it.

### Known limitations

Notes only exist in this browser, with no sync across computers (the JSON backup covers moving them manually). The rest are in [SPEC.md](SPEC.md) (Known limitations).

## License

[MIT](LICENSE) © 2026 Ramon K.

You may use, copy, modify, merge with other projects, publish, distribute, sublicense and sell copies of Draftab, including in commercial projects. The only requirement is keeping the copyright notice and the license text (the [LICENSE](LICENSE) file) in copies or substantial portions of the code: that's the credit. The software is provided "as is", without warranty.
