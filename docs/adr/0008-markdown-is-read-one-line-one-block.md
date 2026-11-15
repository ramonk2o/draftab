# Pasted and imported markdown is read as one line, one block

Unlike standard markdown, consecutive lines are separate blocks, because every Enter in a note creates a paragraph. Blank lines vanish, and a line ending in two spaces or `\` is a line break inside its block. Tables and link reference definitions stay as text so nothing is lost. Everything else follows standard markdown. Pasting plain text and importing a `.md` file follow the same rules.

## Consequences

Export writes Shift+Enter as two spaces or `\`, so exporting and importing gives back the same note.
