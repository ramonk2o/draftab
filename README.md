# Draftab

A Chrome extension ([Chrome Web Store](https://chromewebstore.google.com/detail/draftab/oamemjkhgfcoelilpnjpemllbmladaog)) that turns the **new tab** into a local notepad. The editor is made of blocks: you type markdown and it becomes formatting right away, and you can **drag any block** to reorder it. Everything is stored in your browser, with JSON backups (manual and automatic).

![Draftab in the light theme](docs/screenshots/light.png)

<details>
<summary>Dark theme</summary>

![Draftab in the dark theme](docs/screenshots/dark.png)

</details>

## Features

Everything below is described as rules in [SPEC.md](SPEC.md); this is the overview.

### Notes

- **New tab = new note**, with the cursor already in the editor, on a first line that starts as a heading (the note's title; Backspace makes it a normal line, and Settings can turn this off). An empty note (no text and no title of its own) is never saved, so opening and closing tabs leaves no clutter; a note that becomes empty leaves the list.
- **Autosave**: the first keystroke creates the note; after that it saves ~500 ms after typing stops, and pending typing is saved when the tab is hidden or closed.
- **Automatic title**: until you rename a note, its title is its first line (up to 80 characters). Renaming to empty goes back to automatic. The browser tab shows the open note's title.
- **Several tabs at once**: a change in one tab shows up in the others (last write wins); a note deleted elsewhere is replaced by a blank one. Reloading a tab reopens the same note.

### Writing

- **Markdown as you type**: headings, lists, checklists, quotes, code, dividers, bold, italic, strikethrough, underline, inline code and links ([table below](#markdown-shortcuts)). Pasted `~~text~~` and `++text++` get the same marks.
- **Backspace undoes blocks**: at the start of a heading it becomes a paragraph; at the start of a code block, normal text (one paragraph per line); at the start of a quote, normal paragraphs. Backspace right after a shortcut undoes the shortcut. Cmd/Ctrl+Z brings the block back.
- **Highlight**: select text and a small bar above it offers six colors (gray, red, orange, yellow, green, blue), each with its own shade in the light and dark themes; "No color" removes it. Cmd/Ctrl+Shift+H highlights with the last color used. Works in any text except code. The highlight is saved in the note and in backups, but left out of the exported `.md`, copies and Copy for WhatsApp.
- **Images** from web addresses (the note keeps only the address, never the file): type `![description](url)`, paste an image address on an empty line, or paste an image copied from a page. They show at their natural size (at most the note's width) and move with the block handle; one that can't load shows its address. Export and plain-text copies write `![description](url)`; importing a `.md` reads images on a line of their own.
- **Links**: Cmd/Ctrl+click opens a link in a new tab (an address without a protocol gets `https://`); a plain click edits it.
- **Tags**: `#` followed by a letter, then letters, digits, `_` or `-` (`#idea`, `#project-x`), at the start of a line or after a space, outside code. They're shown like links; Cmd/Ctrl+click puts the tag in the sidebar search. Tags are plain text: nothing changes in the stored note or exports.
- **Calculations**: typing `=` right after a calculation without spaces writes the result (`2*5=` → `2*5=10`). `+ - * /`, parentheses, signs and decimals, with the usual precedence; results are rounded to 12 significant digits (`0.1+0.2=` → `0.3`). Invalid calculations (`1/0=`, `5=`), pasted text and code are left alone; Backspace right after removes the result. The decimal separator follows the interface language or is chosen in Settings, where calculations can also be turned off.
- **Color swatches**: color codes (`#fff`, `#3a7bd5`, `#3a7bd580`, `rgb(255, 0, 0)`, `rgba(0 0 0 / 50%)`) show a small sample of the color before them, in code too. Display only, like tags; can be turned off in Settings.
- **Calendar** at the bottom of the sidebar: a month view (today marked, previous/next month); clicking a day inserts the date at the cursor, as numeric (`13/10/2026` / `10/13/2026`), ISO (`2026-10-13`), short (`13 Oct 2026`) or long (`Tuesday, October 13, 2026`), following the interface language. Can be hidden in Settings.

### Drag to reorder

- Hover a block and drag the handle (⠿) on its left; the other blocks slide to open space where it will land.
- List items have their own handle; a thin bar to the left of a list moves the whole list; inside a quote, the handle moves the whole quote.
- Items and paragraphs change level: at the edge of a list, moving left takes the block out and moving right puts it in. A paragraph that enters a list becomes an item, list ↔ checklist items convert to the target list, and adjacent lists of the same type merge. Headings, quotes, code, dividers and whole lists don't go into lists.
- **Double-click a handle** to select the block and copy it like Cmd/Ctrl+C (formatted and plain text); on the list bar, the whole list. A "Copied" label confirms it.

### The sidebar

- Notes sorted by last modified, title A–Z (ignoring case and accents, numbers in natural order) or date created, chosen in Settings.
- **Search** across titles and content, ignoring case and accents. Typing `#` suggests the tags in your notes that start with what was typed, most used first, with the number of notes (↑/↓, Enter/Tab or click to complete, Esc to close).
- **Pin** notes to the top (a pin on each note, or on the note page); pinning doesn't change "last modified".
- Rename (double-click or the pencil), delete (with confirmation), **New note** and **import a file as a note**: `.md` is read as markdown, `.txt` as one paragraph per line.
- It collapses with its button and **steps aside while you type**, coming back when the mouse moves; neither moves the note's text.

### The note page

Buttons at the top right of the note (disabled while it's empty):

- **Font** ("Aa"): sans-serif, serif or monospace, using system fonts (SF Pro / New York / SF Mono on macOS). Each note keeps its own; Settings sets the font new notes start with.
- **Text size** (A− / A+, or Cmd/Ctrl+Shift+, and Cmd/Ctrl+Shift+.): 80% to 150%, per note; Settings sets the size of new notes.
- **Pin**, **Export as Markdown** (downloads `<title>.md`), **Copy note** (without its first line, the title: formatted for apps that accept it, markdown for plain-text ones) and **Copy for WhatsApp** (in WhatsApp's formatting: `*bold*`, `_italic_`, `~strikethrough~`, headings as bold lines, `☐` checklists, `> ` quotes).

At the bottom right, **character counts**: the note as markdown (the same text as the exported file), without markdown, and how many are selected.

### Saving web pages

- **Toolbar icon**: click Draftab's icon on any page to save its main text (without menus, ads or footers, found with Mozilla Readability) as a new note.
- **Right-click → Save to Draftab** on selected text saves just that passage, as a note titled "Excerpt: <page title>".
- The note starts with the page title and a link to the page, then the content as Draftab blocks: headings, lists, quotes, code, links, formatting and images are kept (minus tiny ones like icons); table layouts are not. It opens in a new Draftab tab, next to the page.
- The page is read only when you click, only that tab, and nothing is sent anywhere. When nothing can be saved, no tab opens: the icon shows a red "!" for a few seconds, with the reason in its tooltip (pages Chrome doesn't let extensions read, like `chrome://` pages and the Web Store), or a notice appears in the corner of the page (no main text found).

### Settings, backup and privacy

- **Backup**: export and import a JSON file with every note and setting (each note also in markdown, readable without Draftab). Importing validates the file, asks for confirmation and replaces everything; open tabs reload.
- **Automatic backup** to `Downloads/draftab-backups/`: every minute, hour, day, week or month, only when something changed, even with no tab open (as long as Chrome is running). Files are named `draftab_YYYY-MM-DD-HHhMM.json`.
- **Appearance**: light, dark or automatic theme (follows the system, live); interface in English or Portuguese (automatic follows Chrome); font and text size of new notes; whether new notes start with a heading; sort order; color swatches on/off.
- **Calendar** (show it, date format) and **Calculations** (on/off, decimal separator).
- **Delete all notes**, after typing a confirmation phrase; settings are kept.
- Every setting applies to all open tabs immediately and goes into backups.
- **Privacy**: nothing leaves your computer. No account, no server, no analytics. The only network requests are the images in your notes, loaded from the sites that host them (like any web page with images).

### Markdown shortcuts

| Type | Becomes |
|---|---|
| `# `, `## `, `### ` | Heading level 1, 2 or 3 |
| `- ` or `* ` | Bulleted list |
| `1. ` | Numbered list |
| `[ ] ` or `- [ ] ` | Checklist (`[x] ` creates an already checked item) |
| `> ` | Quote |
| ` ``` ` + space | Code block |
| `---` | Divider |
| `**text**` | **Bold** |
| `*text*` | *Italic* |
| `~~text~~` | ~~Strikethrough~~ |
| `++text++` | Underline (also Cmd/Ctrl+U) |
| `` `text` `` | `Code` |
| `[text](address)` | Link (opens with Cmd/Ctrl + click) |

Pasted or typed addresses (`https://...`) also become links. In lists, **Tab** indents the item. In `.md` files (export and import), strikethrough and underline are `~~` and `++` too.

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

```
public/
  manifest.json          extension manifest (copied to dist/)
  theme-init.js          applies the theme and the open note's font before the page shows up (avoids flashing)
  icons/                 extension icons (16, 32, 48, 128 px)
  _locales/              extension description in English and Portuguese (store summary)
newtab.html              new tab page (editor, sidebar, Settings lightbox)
src/
  newtab.ts              tab logic: opening/saving notes, sidebar, sync across tabs
  editor.ts              creates the Tiptap editor: extra shortcuts, links, drag handle
  extensions.ts          content extensions (blocks and marks), shared with the backup
  reorder.ts             animated drag and drop, across levels (lists, items, paragraphs)
  list-handle.ts         handle that moves a whole list
  copy-block.ts          double-click on a handle: select and copy the block
  unwrap-block.ts        Backspace at the start of a heading, code block or quote turns it into text
  underline-shortcut.ts  ++text++ becomes underlined (typing and pasting)
  tags.ts                #tags: finding, highlighting, Cmd/Ctrl+click, search suggestions
  colors.ts              color swatches next to #hex and rgb() codes
  highlight.ts           highlight mark (selected text with a color) and Cmd/Ctrl+Shift+H
  highlight-bar.ts       bar of highlight colors above the selected text
  images.ts              image blocks: web addresses only, markdown, plain-text copies, cursor off images
  image-paste.ts         pasting image addresses and images copied from pages
  calculate.ts           calculations after "=" and the decimal separator
  calendar.ts            month grid and date formats (pure)
  calendar-ui.ts         the calendar at the bottom of the sidebar
  whatsapp.ts            note → WhatsApp formatting (Copy for WhatsApp)
  char-count.ts          character counts (with and without markdown, selection)
  i18n.ts                interface texts in English and Portuguese, locale for dates and numbers
  markdown.ts            note ↔ markdown: export a note, import a .md/.txt file
  notes.ts               note model and pure rules (title, empty note, search)
  storage.ts             the single access point to chrome.storage
  dom.ts                 finding page elements
  backup.ts              backup file format: create, validate, restore
  backup-ui.ts           downloads and file picking from a page (backup, note export)
  auto-backup.ts         decides on and makes the automatic backup (runs in the service worker)
  background.ts          service worker: automatic backup alarms, toolbar icon and right-click menu (saving pages)
  clip-page.ts           injected into a page on the icon click: finds the main text with Readability
  clip.ts                captured HTML → note (title, link, Draftab blocks)
  settings.ts            Settings lightbox
  theme.ts               light/dark/automatic theme and note font
  icons.ts               SVG icons
  newtab.css             styles (colors are variables at the top, once per theme)
  *.test.ts              tests; fake-chrome.ts simulates the chrome APIs in tests
scripts/zip.mjs          builds the store package (npm run zip)
scripts/screenshots.mjs  generates the store and README screenshots from dist/
docs/screenshots/        images for this README
docs/store/              Chrome Web Store images (en and pt-BR)
```

### How data is stored

Notes and settings stay in this browser (`chrome.storage.local`). The data model, the backup file format and the reasons behind them are in [SPEC.md](SPEC.md) (Data model, Technical decisions).

### Permissions

The permissions are listed in [SPEC.md](SPEC.md) (Technical decisions), and what each one is for in [STORE.md](STORE.md) (Privacy practices).

### Tests

`npm test` (Vitest) covers everything that doesn't need a browser, with `chrome.storage`, alarms and downloads simulated in `src/fake-chrome.ts`. The editor and the interface are checked in Chrome, following the "To check by hand" list of the feature in progress in [BACKLOG.md](BACKLOG.md). A pre-commit hook (turned on by `npm install`) runs the tests and the type check before every commit that touches code.

### Project documents

| File | Contents |
|---|---|
| [SPEC.md](SPEC.md) | How Draftab behaves today (rules by area), data model and technical decisions |
| [BACKLOG.md](BACKLOG.md) | Ideas, by area, and the feature in progress with what to check by hand; done features move to CHANGELOG.md |
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

- Notes only exist in this browser; there's no sync across computers (the JSON backup covers moving them manually).

## License

[MIT](LICENSE) © 2026 Ramon K.

You may use, copy, modify, merge with other projects, publish, distribute, sublicense and sell copies of Draftab, including in commercial projects. The only requirement is keeping the copyright notice and the license text (the [LICENSE](LICENSE) file) in copies or substantial portions of the code: that's the credit. The software is provided "as is", without warranty.
