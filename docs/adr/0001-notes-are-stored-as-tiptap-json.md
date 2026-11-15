# Notes are stored as Tiptap JSON, and markdown is only an export format

Notes are stored as the editor's own JSON (Tiptap/ProseMirror); markdown exists only on export (backup, exported file, copies, character counts). Markdown can't represent everything the editor does (highlight, images by address, line breaks inside blocks), and converting on every save would lose details. The price is being tied to Tiptap's document format.

## Consequences

Exporting to and importing from `.md` can lose small details. Restoring a backup uses the JSON, so it loses nothing.
