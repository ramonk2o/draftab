import { flattenExtensions } from '@tiptap/core'
import { MarkdownManager } from '@tiptap/markdown'
import { contentExtensions } from './extensions'
import { displayTitle, type Note } from './notes'

// Markdown of a note: used by the backup and by "Export as Markdown".
// Doesn't depend on an open page (the automatic backup runs in the service worker).

// Converter created once, when first needed
let markdown: MarkdownManager | undefined

export function noteToMarkdown(note: Note): string {
  markdown ??= new MarkdownManager({ extensions: flattenExtensions(contentExtensions) })
  return markdown.serialize(note.doc)
}

const MAX_NAME_LENGTH = 100

// The note's title as a file name: without characters that aren't allowed in
// file names, at most 100 characters, "Untitled" when nothing is left
export function markdownFileName(note: Note): string {
  let name = displayTitle(note)
    .replace(/[/\\:*?"<>|\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  name = Array.from(name).slice(0, MAX_NAME_LENGTH).join('') // doesn't cut an emoji in half
  name = name.replace(/^[\s.]+|[\s.]+$/g, '') // no leading or trailing dots (hidden files, Windows)
  return `${name || 'Untitled'}.md`
}
