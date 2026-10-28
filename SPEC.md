# Draftab

How Draftab works today, as rules (not visual details), plus its data and technical decisions. Managed with the `document` skill: it's updated when a feature is finished, describing what was built. Ideas live in BACKLOG.md; what changed and when lives in CHANGELOG.md.

## Goal
Chrome extension that replaces the new tab with a local notepad: a markdown-friendly block editor with drag-to-reorder blocks. Open source, published on the Chrome Web Store.

## Behavior

### Notes and the sidebar
- A new tab opens a blank note with the cursor in the editor.
- Blank notes (new tab, New note) start with an empty level-1 heading as the first line, with the cursor in it, as if `# ` had just been typed. It's only how the note starts: Backspace turns it into a normal line like any heading, and nothing puts it back later (not even when the note is emptied). Imported files and saved pages keep their own first line. "New notes start with a heading" in Settings (on by default) turns it off; changing it doesn't change a blank note already open.
- An empty note (no text, no images and no user-set title) isn't saved: opening and closing a tab leaves no clutter, and a saved note that becomes empty leaves the list.
- Autosave: the first keystroke creates the note right away; after that, ~500 ms after typing stops. Pending typing is saved when the tab is hidden or closed.
- Several tabs at once: changes made in one tab show up in the others (last write wins). A note deleted in another tab is replaced by a blank note.
- Reloading the tab reopens the same note (its id is kept in the tab's `sessionStorage`, which survives reloads and is cleared when the tab closes).
- Title: while the user hasn't set one, it follows the first line of text (up to 80 characters). Renaming fixes it; renaming to empty goes back to the automatic title.
- The sidebar lists the notes, with search (title and content, ignoring case and accents; while the search has the focus or any text, it takes the whole row and the import and New note buttons are hidden), New note, rename (double-click the title or the pencil button; Enter confirms, Esc cancels) and delete with confirmation.
- Sort order (chosen in Settings): last modified (default, newest first), title A–Z (ignoring case and accents, numbers in natural order, untitled notes last) or date created (newest first). The date next to each note follows the order: the creation date when sorting by date created, the last edit otherwise.
- Pinned notes: a pin button on each note in the sidebar, and one at the top right of the note page (for the open note, marked while it's pinned), pins or unpins it. Pinned notes come first, sorted among themselves by the chosen order, then the others; a divider separates the two groups when both have notes. A pinned note shows a pin instead of its date. Search keeps the same grouping. Pinning or unpinning doesn't count as an edit ("last modified" doesn't change); it applies to every open tab and goes into backups.
- The sidebar can be collapsed; its state is remembered.
  - Typing in the note hides the sidebar if it's showing; moving the mouse brings it back. This automatic hiding isn't remembered (a reload shows the sidebar). A sidebar collapsed with the button stays collapsed until reopened with the button (or a tag search).
  - Opening or closing the sidebar (by the button or automatically) doesn't move the note's text.
  - While collapsed by the button, the sidebar button shows it (a different icon); hidden while typing, it doesn't.
- Import a file as a note (next to New note): one `.md` or `.txt` file becomes a new note, which opens.
  - `.md` / `.markdown` is read as markdown (headings, lists, checklists, quotes, code, dividers, marks, links, images); an image on a line of its own becomes an image block; an image in the middle of a line of text (or in a list item), or whose address isn't `http`/`https` (e.g. a relative `img.png`), stays as its `![description](address)` text; headings smaller than `###` become `###`. It follows the same line rules as pasting markdown (see Editor → Pasting markdown): one block per line, tables and link reference definitions kept as text. If something in it can't become a Draftab block, the file is read as plain text instead.
  - `.txt` is plain text: each line becomes a paragraph. Windows and old Mac line breaks are accepted.
  - The title is automatic and the text size is the one set for new notes. An empty file creates nothing and shows a message.
  - Dragging files onto the page does the same, for one or several files at once, dropped anywhere (note, sidebar, empty areas, also with Settings open). The type comes from the name's extension (`.md`, `.markdown`, `.txt`, any case), not from the type the system reports.
    - Each valid file becomes a note, in the order they were dropped, and the first one opens; importing at least one note closes Settings.
    - Files of other types and empty files are skipped. Messages: only one empty file → the same message as the Import button; only files of other types → only `.md` and `.txt` files can be imported; any other case with skipped files → the counts, e.g. "2 notes imported, 1 file skipped" ("No notes imported, …" when none was). Nothing skipped → no message.
    - Chrome never opens a dropped file in place of Draftab, and the file never goes into the note's text.
    - While files are dragged over the page, a layer over everything (Settings included) says "Drop to import"; it hides on drop or when the files leave the window.
    - Drags that start on the page (blocks, selected text, an image in the note) and drags of text or links from elsewhere work as before: no layer, no import.

### Calendar
- A month calendar at the bottom of the sidebar, below the note list (the list scrolls above it). It hides with the sidebar.
- Weeks start on Sunday. Days of the previous and next months fill the first and last weeks (always 6 weeks, so the height doesn't change). Today is marked.
- Buttons go to the previous and next month; clicking the month name goes back to the current month. The month shown isn't remembered: a new tab opens on the current month.
- Clicking a day inserts that date in the note at the cursor (replacing the selection, if any), as typed text: it counts as an edit and the note is saved as usual. The editor keeps the focus.
- Date formats (Settings → Calendar → "Date format"), following the interface language:
  - Numeric (default): `13/10/2026` in Portuguese, `10/13/2026` in English.
  - ISO: `2026-10-13`.
  - Short month: `13 out 2026` / `13 Oct 2026`.
  - Long: `terça-feira, 13 de outubro de 2026` / `Tuesday, October 13, 2026`.
- "Show calendar" in Settings (on by default) shows or hides it, in every open tab.

### Editor
- Markdown shortcuts turn into blocks while typing: `#`/`##`/`###`, `-`, `1.`, `- [ ]`, `>`, ` ``` `, `---`, `**bold**`, `*italic*`, `~~strikethrough~~`, `++underline++`, `` `code` ``, links. Pasted text with `~~…~~` or `++…++` gets the same marks. Strikethrough and underline are `~~` and `++` in `.md` files too (export and import). Cmd/Ctrl+click opens a link in a new tab (an address without a protocol gets `https://`).
- Images: an image is a block of its own (like a divider) that shows a picture from a web address. The note stores only the address (and the description, `alt`, when there is one), never the file; only `http`/`https` addresses are accepted (`data:` and other schemes are dropped).
  - It shows at its natural size, at most the width of the note; no resizing.
  - A click selects it; Backspace/Delete removes it; its handle drags it like any block. Images don't go into lists by dragging (like dividers).
  - When the picture can't load (gone from the site, no internet), a discreet box shows its address in its place.
  - How images get in: typing `![description](url)`; pasting, alone on an empty line outside lists and quotes, an `http`/`https` address ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` or `.avif` (a `?query` or `#fragment` after it is fine): the image goes in above the line, and the cursor stays on the empty line below it (anywhere else, the address stays a normal link); pasting an image copied from a page (Chrome's "Copy image"), using the address in the copied HTML; pasting HTML that has images. A pasted image with no web address (a screenshot, a file) is ignored.
  - The cursor never lands on an image by itself (typing would replace it): opening a note puts it in a line of text (the empty line after the last block when that block is an image), and content that arrives from another tab keeps it in the nearest line of text.
  - Opening a note loads its images from their sites, so those sites see the request (like any page with external images).
- Pasting markdown: a paste that arrives as plain text only (no HTML) is read as markdown and becomes blocks (headings, lists, checklists, quotes, code, dividers, images, marks, links), with no guessing whether it "looks like" markdown. Pastes with HTML (a formatted page) work as before; copies from VS Code (marked with its own clipboard type) ignore their colored HTML and are read as plain text.
  - One line = one block, unlike standard markdown: consecutive lines are separate paragraphs (inside a quote, separate paragraphs of the quote); a plain line right after a list is a paragraph after it; items of a list stay in one list. Blank lines vanish. A line ending in two spaces or `\` (what export writes for Shift+Enter) is a line break inside the same block, except over a `---`/`===` line.
  - Same rules as importing a `.md` file: headings smaller than `###` become `###`; an image alone on a line becomes an image block, one inside text stays as its `![…](…)` text.
  - Kept as text so nothing is lost: tables (one line per block) and link reference definitions (`[x]: https://…`). A paste that would leave nothing (a lone `-`, `*` or `#`) or that can't become Draftab blocks is pasted as plain text, as before.
  - Otherwise standard markdown: a line indented by 4 spaces or a tab is code (as is everything after a ` ``` ` that never closes); an indented line right after an item is a second paragraph of that item; a list followed by a checklist, or a change of bullet character, starts a new list; two quotes separated by a blank line stay two quotes.
  - Where it goes: in the middle of a line, the first block joins the line, the rest follows, and what was after the cursor ends up at the end of the last block (a single line like `**x**` only gets its marks). Inside a list item, each line becomes a new item of that list (pasted list items take its type; a checked checklist item stays checked); a heading becomes plain text there; a quote, code block or divider splits the list around it. Inside a code block, the text goes in as it came.
  - Cmd/Ctrl+Shift+V pastes the raw text anywhere: one paragraph per line, symbols untouched, without the `~~`/`++`/link paste rules.
  - Cmd/Ctrl+Z undoes the whole paste in one step.
- Backspace at the start of a heading turns it into a paragraph, keeping its text and formatting (Cmd/Ctrl+Option/Alt+0 does the same, Tiptap's shortcut).
- Backspace at the start of a code block turns it into normal text, one paragraph per line. At the start of a quote's first paragraph, the whole quote becomes normal paragraphs; at the start of a later one, that paragraph leaves the quote, splitting it. Backspace right after typing a shortcut undoes the shortcut (Tiptap's behavior). Each change is its own undo step.
- Dragging blocks: each block shows a handle on hover; dragging it moves the block and the new order is saved.
  - List items have their own handle. A bar to the left of a list drags the whole list. Inside a quote, the handle moves the whole quote.
  - While dragging, neighboring blocks slide to open space where the block will land.
  - Items and paragraphs can change level: the mouse height picks the position; at the edges of a list, moving right puts the block inside it and moving left takes it out.
  - Conversions: an item that leaves a list stays an item, in a list of its own; a paragraph that enters a list becomes an item; list item ↔ checklist item depending on the target list. Adjacent lists of the same type are merged.
  - Headings, quotes, code, dividers and whole lists don't go into lists.
- Double-clicking a block's handle selects the block's content and copies it exactly like Cmd/Ctrl+C (formatted, plus plain text). The whole-list bar does the same for the whole list. A block without text (a divider) is selected and copied whole. A "Copied" label confirms it.
- Highlight: selected text can get a background color. While there's a text selection in the note, a small bar above it shows "No color" and six preset colors: gray, red, orange, yellow, green, blue. Picking a color highlights the selected text with it; "No color" removes the highlight from it. When all of the selected text has the same color, it's marked in the bar. The bar hides when the selection goes away, with Esc and while dragging a block.
  - Cmd/Ctrl+Shift+H highlights the selection with the last color used (yellow at first, remembered only while the tab is open); when all of the selection already has that color, it removes it.
  - Works in any text (paragraphs, headings, lists, quotes) and together with bold, italic, strikethrough, underline and links; not in code (inline or block). Typing right after highlighted text isn't highlighted.
  - Each color has its own shade in the light and in the dark theme; the note stores only the color's name. A name that isn't in the palette counts as no highlight.
  - Highlighting counts as an edit (saved, updates "last modified", shows in other tabs) and is its own undo step.
  - The highlight only exists in Draftab: it goes into the note and backups, not into the exported `.md`, copies (formatted or plain text) or Copy for WhatsApp. Pasting inside Draftab keeps it.
- Plain-text copies (including Cmd/Ctrl+C) have one line per block.
- Plain-text copies of an image give `![description](url)`.
- Wherever an image is written as markdown (export, backup, plain-text copies), `[` and `]` in its description and `"` and `\` in its title are escaped with `\`, so the markdown stays valid and importing it gives back the same description and title.
- Tags: `#` followed by a letter, then letters, digits, `_` or `-` (e.g. `#idea`, `#project-x`), at the start of a line or after a space. Not in code (inline or block). Tags stay plain text in the note (nothing changes in the stored content or in exports); the editor only shows them differently, like links. Cmd/Ctrl+click on a tag puts it in the sidebar search (opening the sidebar if it's collapsed); a plain click places the cursor, so the tag can be edited. The search stays a text search: `#proj` also finds `#project`.
- Color swatches: color codes show a small sample of the color just before them: `#` + 3, 4, 6 or 8 hex digits (`#fff`, `#3a7bd5`, `#3a7bd580`) and `rgb(…)`/`rgba(…)` with three values from 0 to 255 (or 0%–100%) separated by commas or spaces, plus an optional alpha (0–1 or a percentage, after a comma or `/`). Case doesn't matter. The code can't be glued to a letter, digit, `_` or `-` on either side (`a#fff`, `#fffx` aren't colors). They show everywhere, including inline code and code blocks. Like tags, it's only how the editor shows them: nothing changes in the stored content, exports or copies. A code that is also a tag (`#cafe`) gets the swatch and stays a tag. "Show color swatches" in Settings (on by default) turns them on or off, in every open tab.
- Calculations: typing `=` right after a math expression writes its result after the `=` (`2*5=` → `2*5=10`).
  - The expression has numbers, `+ - * /`, power (`^` or `**`), remainder (`%`) and parentheses, with no spaces, and at least one operation between two numbers (`5=` and `-5=` do nothing). It starts at the start of the line or after a space (`a2*5=` does nothing). Usual precedence (power, then `*` `/` `%`, then `+` `-`); a `-` or `+` before a number or parenthesis is its sign.
  - Power comes before the sign and groups from the right, as in math: `-2^2=` → `-4`, `2^3^2=` → `512`. The exponent may have a sign (`2^-1=` → `0.5`). `0^0=` → `1`.
  - Remainder: `%` is the remainder of the division, with the sign of the first number (`7%3=` → `1`, `-7%3=` → `-1`), decimals included (`5.5%2=` → `1.5`).
  - Decimals use the chosen decimal separator; the other character (`,` or `.`) makes it not an expression (no thousands separators). The result uses the same separator, without thousands separators, rounded to 12 significant digits (`0.1+0.2=` → `0.3`).
  - Anything invalid (division or remainder by zero, unbalanced parentheses, two separators in a number, a root of a negative number like `(-8)^0.5`, a result too big to represent) adds nothing: the `=` stays as typed. Very big or very small results are written in `e` notation (`2^100=` → `1.26765060023e+30`).
  - Only while typing (not when pasting), and not in code (inline or block). Backspace right after removes the result and keeps the `=`. The result is normal text in the note.
  - An option in Settings → Calculations (on by default) turns them on or off, in every open tab.
  - Decimal separator (Settings): Automatic (default: the one of the interface language's number format, `,` in Portuguese), `.` or `,`. It applies in every open tab.
- Tag suggestions in the search: while the word at the cursor in the search starts with `#`, a list under the field suggests the tags in the notes that start with it (ignoring case and accents; `#` alone shows all), most used first (number of notes, shown next to each), ties A–Z, up to 8. Tags that differ only in case or accents are one tag. A tag that's exactly what was typed isn't suggested. ↑/↓ move through the list, Enter or Tab (or a click) replace the word with the tag, keeping the rest of the search; Esc or leaving the field closes the list.

### The note page
- Browser tab title: the open note's title (automatic or renamed). While the note has no title (a new blank note, or one emptied), the tab shows the normal title ("New tab" / "Nova guia", in the interface language). It follows renaming, switching notes, changes from other tabs and the automatic title as it is saved.
- Export as Markdown: downloads the open note as `<title>.md` through a normal browser download, with the same markdown the backup's `markdown` field gets. Pending typing is saved first. The file name drops characters not allowed in file names (`/ \ : * ? " < > |` and control characters), has at most 100 characters, and is `Untitled.md` when nothing is left. Exporting is only on the note page, not in the note list.
- Copy note: copies the note without its first block (the first line, usually the title) and the empty lines right after it, formatted (HTML) for apps that accept it and as markdown for plain-text apps. A "Copied" label confirms it. Export as Markdown still includes the whole note.
- Copy for WhatsApp: copies the note as plain text in WhatsApp's formatting, without its first block (the first line, usually the title) and the empty lines right after it. A "Copied" label confirms it.
  - Bold `*x*`, italic `_x_`, strikethrough `~x~`, inline code `` `x` ``; underline has no equivalent and becomes plain text. Spaces at the edges of a formatted piece stay outside the marks (WhatsApp ignores marks next to a space).
  - Headings become a bold line. Bullet list `- `, numbered list `1. `, checklist `☐ ` / `☑ `; nested levels are indented 2 spaces per level. Quote: each line starts with `> `. Code block between ` ``` `. Divider `———`.
  - Link: `text (url)`, or only the url when the text is the url itself.
  - Image: its address on a line of its own.
  - Top-level blocks are separated by one blank line; the lines inside a block (list items, quote lines, code lines, line breaks in a paragraph) stay together. Empty paragraphs don't add blank lines: there's never more than one blank line in a row.
- Export, copy and pin are disabled while the note is empty (an empty note isn't saved).
- Text size of the note: smaller (A−) and bigger (A+) buttons with the current size between them, also Cmd/Ctrl+Shift+, (smaller) and Cmd/Ctrl+Shift+. (bigger). Cmd/Ctrl + and − stay Chrome's zoom.
  - Steps, relative to the note font's normal size: 80%, 90%, 100%, 110%, 120%, 135%, 150%. One step per click; the button is disabled at the end of the range.
  - The size belongs to the note: each note keeps its own, in every tab and in backups. Changing it counts as an edit (saved right away, updates "last modified"). On a new note not saved yet, the size is saved with the first keystroke.
  - Only the note content changes size (headings, lists, code… keep their proportions).
- Font of the note: an "Aa" button to the left of the text size switches the open note's font to the next one (Sans-serif → Serif → Monospace → Sans-serif); a small label shows the new font's name. Same fonts as described under "Settings and backup".
  - The font belongs to the note, like the text size: each note keeps its own, in every tab and in backups. Changing it counts as an edit (saved right away, updates "last modified"). On a new note not saved yet, the font is saved with the first keystroke.
  - Notes from before fonts were per note (no `font` of their own) use the font that was set in Settings at the time ("note font" before this change).
- Character counts at the bottom of the page, e.g. "1,234 characters · 1,180 without markdown · 42 selected":
  - Characters: the whole note as markdown, marks included — the same text as the exported file.
  - Without markdown: the plain text, with one line break between blocks — the same text as a plain-text copy.
  - Selected: only while there's a text selection, counted like "without markdown".
  - An image counts as its `![description](url)` in "characters" and as nothing in "without markdown".
  - Spaces and line breaks count; line breaks at the end of the note (or of the selection) don't. An emoji or accented letter counts as one character. Numbers use the browser's language separators.
  - Hidden while the note is empty. The totals update ~300 ms after typing stops; the selection count right away.

### Settings and backup
- Settings open in a lightbox over the page (closes with ×, Esc or a click outside). Every setting applies immediately to all open tabs.
- Backup export: downloads a JSON with all notes (each also in markdown, for humans to read) and all settings.
- Backup import: validates the file (app, version, ids, dates, content the editor can open), asks for confirmation and replaces everything, settings included. Open Draftab tabs reload by themselves, discarding pending typing so nothing old is written over the backup.
- Automatic backup: off / every minute / hourly / daily / weekly / monthly (30 days). Runs even with no tab open, only if something changed since the last one, and saves to `Downloads/draftab-backups/` without asking. Settings show the date of the last automatic backup (manual exports don't count). `lastBackupAt` is the moment generation started, so a change made during generation goes into the next backup. Old interval values outside this list move to the closest one, never turning backup off.
- Backup file name (manual and automatic): `draftab_YYYY-MM-DD-HHhMM.json`, in local time.
- Delete all notes: only after typing "delete everything" in a confirmation field. Settings are kept; open tabs reload, as with an import.
- Theme: Automatic (follows the system's light/dark mode, live), Light or Dark. Default Automatic.
- Font of new notes: Sans-serif (default), Serif or Monospace, using system fonts (no downloads): SF Pro / New York / SF Mono on macOS, Segoe UI / Georgia / Consolas and similar elsewhere. Only the note content uses it. New notes (new tab, New note, imported file) start with it; changing it doesn't change existing notes. Until it's first changed, it's the "note font" set before fonts were per note.
- Theme and the open note's font are applied before the page shows up (no flash of the wrong ones).
- New notes start with a heading: see "Notes and the sidebar".
- Text size of new notes: 80% to 150% (the note's steps), default 100%. New notes (new tab, New note, imported file) start with it; changing it doesn't change existing notes. Notes from before this setting existed are 100%.
- Sort notes by: see "Notes and the sidebar".
- Show color swatches: see "Editor".
- Calculations (turn them on or off, decimal separator): see "Editor".
- Calendar (show it, date format): see "Calendar".
- Language: Automatic (default: Portuguese when Chrome's language is Portuguese, English otherwise), English or Português. It covers every text of the interface (buttons, hints, messages, confirmations, the "Untitled" name, the delete confirmation phrase) and the format of dates and numbers; the notes' content never changes. Changing it saves pending typing and reloads every open tab, in the new language.

### Saving web pages
- Clicking Draftab's toolbar icon on a web page saves its main text (found with Mozilla Readability, which drops menus, ads, footers and comments) as a new note and opens it in a new Draftab tab, right after the page's tab.
- Right-clicking selected text shows "Save to Draftab" (only when there's a selection, and only on web pages and local files, not in Draftab's own tab); it saves just the selection, the same way.
  - The title and address are always the tab's, even when the selection is inside a frame.
  - When the selection's formatted content can't be read or has no text (text fields, frames from other sites, the PDF viewer), the plain selected text Chrome gives with the click is saved instead, one paragraph per line.
- The note: a `#` heading with the page title (the address's domain when the page has no title), a paragraph with the page's address as a link, then the content. For a selection the heading starts with "Excerpt:" ("Trecho:" in Portuguese, following the interface language), e.g. `# Excerpt: Page title`.
- The content is converted into Draftab blocks: content headings move down a level so the page title is the only `#` (`h1`/`h2` → `##`, `h3`–`h6` → `###`); paragraphs, lists, quotes, code blocks, dividers, line breaks, links (made absolute; only `http`, `https` and `mailto`), bold, italic, strikethrough, underline and inline code are kept. Images are kept as image blocks with absolute addresses, except those without an address, with a `data:` address, or that the page declares smaller than 50px wide or tall (`width`/`height` attributes: icons, tracking pixels); an image inside a link keeps only the image; an image inside a list item goes to the end of that item, and one inside a heading right after the heading, so lists stay whole and headings keep their text. Video, iframes and forms are dropped. Content with images but no text still counts as "no text". A table becomes one paragraph per row, cells separated by ` · `; a row whose cells hold paragraphs, lists or other blocks (including a table inside a table) keeps those blocks instead, so no text is repeated. A heading inside a list item becomes a bold paragraph (list items start with a paragraph). Empty paragraphs are dropped.
- The title is automatic; font and text size come from the "new notes" settings, like an imported file.
- When nothing can be saved, no tab opens and no note is created. Draftab's icon shows a red "!" for ~5 seconds, and meanwhile its tooltip has the message: on pages extensions can't run on (`chrome://`, the Chrome Web Store, the PDF viewer, Draftab itself) "This page can't be saved"; when there's no main text, or the selection has no text, a message suggesting to select a passage and use the right-click menu. On a page Draftab can run on (no main text, or Readability failed on it), the same message also shows in a small notice in the corner of the page for ~5 seconds.
- If converting the captured page into a note fails (unexpected HTML), the Draftab tab opens a blank note with a message saying the page couldn't be converted.
- The page is read only at the moment of the click, only in that tab; nothing is sent anywhere.
- The menu item, the icon's tooltip and the error messages follow the interface language.

## Data model
- `Note { id: string (uuid), doc: TiptapJSON, title: string, titleManual: boolean, textSize?: number, font?: 'sans' | 'serif' | 'mono', pinned?: boolean, createdAt: number, updatedAt: number }`
  `titleManual` = the user renamed the note; while it's `false`, `title` follows the first line.
  `textSize` = the note's text size in percent (80, 90, 100, 110, 120, 135 or 150); missing or any other value = 100.
  `font` = the note's font; missing or any other value = the `noteFont` setting (notes from before fonts were per note).
  `pinned` = the note is pinned in the sidebar; missing = not pinned.
  The Tiptap JSON is the source of truth (no conversion losses).
  Highlighted text has a `highlight` mark with `color: 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue'`.
- `settings` (invalid stored values fall back to the defaults; an unknown interval moves to the closest one):
  - `autoBackupMinutes: 0 | 1 | 60 | 1440 | 10080 | 43200`: automatic backup interval; 0 = off, default 0.
  - `sidebarCollapsed: boolean`: the sidebar was collapsed with the button; default `false`.
  - `theme: 'auto' | 'light' | 'dark'`: default `auto`.
  - `noteSort: 'updated' | 'title' | 'created'`: sidebar order; default `updated`.
  - `noteFont: 'sans' | 'serif' | 'mono'`: the font of notes without their own, no longer changed from Settings; default `sans`.
  - `newNoteFont: 'sans' | 'serif' | 'mono'`: font of new notes; missing = `noteFont`.
  - `newNoteTextSize: number`: text size of new notes, in percent; default 100.
  - `language: 'auto' | 'en' | 'pt'`: the interface language; default `auto`.
  - `showCalendar: boolean`: the calendar shows in the sidebar; default `true`.
  - `dateFormat: 'numeric' | 'iso' | 'short' | 'long'`: the format of dates inserted from the calendar; default `numeric`.
  - `colorSwatches: boolean`: color codes show a swatch; default `true`.
  - `calculations: boolean`: typing `=` after a calculation writes the result; default `true`.
  - `decimalSeparator: 'auto' | '.' | ','`: the decimal separator of calculations; default `auto`.
  - `newNoteHeading: boolean`: blank notes start with an empty level-1 heading; default `true`.
- `meta { lastChangeAt: number, lastBackupAt: number, lastImportAt: number }` (`lastImportAt` marks an import or the deletion of all notes, and tells open tabs to reload)
- `clip:<uuid>` = a captured page waiting for the new tab that turns it into a note: `{ title, url, html, text?, excerpt?, createdAt }` (`text` = the plain selected text Chrome gives, the fallback for selections; `excerpt` = it's a selection). The new tab deletes it when it reads it; leftovers older than 10 minutes are deleted when the service worker starts and before each capture. Never in backups.
- Backup file:
  `{ app: "draftab", version: 1, exportedAt, settings, notes: [{ id, title, titleManual, textSize, font, pinned, markdown, doc, createdAt, updatedAt }] }`
  `markdown` is for humans to read; importing restores from `doc`. Backups without `textSize` import as 100%; without `pinned`, as not pinned; notes without `font` use the backup's `noteFont`.

## Technical decisions
- Manifest V3 with `chrome_url_overrides.newtab`: the current standard for extensions.
- Permissions: `storage`, `unlimitedStorage`, `alarms`, `downloads`, `activeTab`, `scripting`, `contextMenus` — nothing else (justifications in STORE.md). A new permission is decided with its feature and recorded here with its reason. `activeTab` gives access only to the tab where the user clicked the icon or the menu item, only then; no host permissions.
- Saving pages: the service worker injects the capture (`clip-page.js`, with Readability, a separate bundle so the new tab doesn't load it) and passes the HTML to a new Draftab tab through a temporary `clip:` key; the new tab converts it, because the service worker has no DOM. The HTML is parsed with `DOMParser` (an inert document: nothing runs or loads) and turned into blocks with the editor's schema, so only Draftab blocks survive.
- Vite + TypeScript: simple build, types catch errors, libraries via npm.
- Tiptap 3 (StarterKit, TaskList/TaskItem, Image, DragHandle, Markdown): mature, ready-made markdown shortcuts and drag handle.
- No React or other UI framework: the interface around the editor is small; fewer layers to read.
- `chrome.storage.local` + `unlimitedStorage` is the source of truth for notes and settings: no ~5 MB localStorage limit, not wiped when clearing cookies, and reachable from the service worker.
- One key per note (`note:<id>`): avoids rewriting everything on every keystroke. Open tabs update their list with just the note that changed.
- Interface texts come from our own dictionary (`src/i18n.ts`, English and Portuguese), not from `chrome.i18n`, which only follows Chrome's language and can't be chosen. The store listing and the extension description still use `_locales`. The language is copied to the page's `localStorage` so the texts are right from the start; a different value in `chrome.storage` (e.g. after a backup import) reloads the tab once.
- The theme and the font of new notes are also copied to the page's `localStorage`, and the open note's font to the tab's `sessionStorage` (next to the open note's id), which can be read synchronously, so `theme-init.js` applies them before the first paint. `chrome.storage` remains the source of truth.
- `chrome.alarms` + `chrome.downloads` in the service worker: backups run even with the tab closed. The file is generated as a `data:` URL (there's no `URL.createObjectURL` in the service worker).
- Markdown is only an export format (backup, exported file, copy, counts); notes are stored as Tiptap JSON.
- Vitest for the data, markdown and backup layers; the editor and the UI are checked in Chrome (by hand, plus automated browser scripts during development).
- Note typography modeled on Tailwind Typography ("prose", MIT), adapted for notes: paragraphs stay close together, because every Enter creates a paragraph.
- MIT license; every dependency shipped in the extension is MIT too, except Mozilla Readability (Apache 2.0, compatible; its license goes into `THIRD_PARTY_NOTICES.txt` in the package like the others).
- Language: English everywhere in the project (code, comments, UI, docs). The store listing also has a Brazilian Portuguese version.

## Known limitations
- If Chrome's "Ask where to save each file" option is on, each automatic backup opens the save dialog (documented in the README).
- Each automatic backup briefly shows Chrome's download icon.
- Search runs in memory, which is fine for a few hundred notes.
- Images live on their original sites: if a site removes one, it's gone from the note too (the note only has the address). Backups don't contain the pictures.
- Markdown conversion can lose small details (it's only for export); restoring a backup uses the Tiptap JSON, without losses.
