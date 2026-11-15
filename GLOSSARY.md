# Draftab

A Chrome extension that replaces the new tab with a local notepad: a markdown-friendly block editor whose notes stay in the browser.

## Language

### Notes

**Note** (`Note`):
A piece of writing the user keeps in Draftab, stored as Tiptap JSON with its own title, text size, font and pin.
_Avoid_: document, page, memo

**Block**:
A unit of a note: paragraph, heading, list item, quote, code block, divider or image. In markdown, one line is one block.
_Avoid_: node (Tiptap's word)

**Title** (`title`, `titleManual`):
The note's name in the list and in the browser tab. Automatic (the first line, up to 80 characters) until the user renames it.
_Avoid_: name

**Blank note** (`newBlankNote`):
A note just opened and not yet written in. It starts with an empty level-1 heading when "New notes start with a heading" is on.
_Avoid_: draft

**Empty note** (`isEmptyNote`):
A note with no text, no images and no title set by the user. It is never saved.

**Open note**:
The note shown in a tab's editor. Each tab has one; two tabs can have the same note open.
_Avoid_: current note, active note

**Pending changes** (`hasPendingChanges`):
What was typed in the open note and isn't saved yet. When two tabs save the same note, the last save wins, even over pending changes made in the other tab.
_Avoid_: pending typing, unsaved changes, draft

**Pinned note** (`pinned`):
A note kept at the top of the sidebar list, whatever the sort order.
_Avoid_: favorite, starred

**Sidebar**:
The panel with the search, the note list and the calendar. It can be collapsed.

**Handle**:
The control that shows when hovering a block and drags it elsewhere. Lists also have a bar that drags the whole list.
_Avoid_: grip

### Writing

**Tag**:
A `#word` in a note's text. It stays plain text; the editor only shows it differently, and Cmd/Ctrl+click searches for it.
_Avoid_: label, hashtag

**Highlight** (`highlight`):
A background color on selected text, one of six palette colors. It exists only inside Draftab: exports and outside copies don't carry it.
_Avoid_: background color

**Color swatch**:
A small sample of the color shown before a color code (`#3a7bd5`, `rgb(…)`) in the text. Display only.

**Calculation**:
The result written after `=` when typed right after a math expression (`2*5=` → `2*5=10`).
_Avoid_: formula

### Moving notes in and out

**Backup** (backup file):
A JSON with every note (each also as markdown) and every setting; importing it replaces everything. Automatic backup saves one to `Downloads/draftab-backups/` on a schedule.
_Avoid_: sync

**Export as Markdown**:
Downloads the open note as a `.md` file.

**Import**:
A `.md` or `.txt` file becomes a new note, by the Import button or by dropping files on the page.
_Avoid_: upload

**Copy for WhatsApp** (`noteToWhatsApp`):
Copies the note as plain text with WhatsApp's formatting symbols.

**Clip** (`PageClip`):
A web page, or a selection of it, captured from the toolbar icon or the right-click menu and waiting for a new tab to turn it into a note. An *excerpt* is a clip of a selection.
_Avoid_: saved page, bookmark
