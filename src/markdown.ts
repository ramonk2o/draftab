import { flattenExtensions, type JSONContent } from '@tiptap/core'
import { MarkdownManager } from '@tiptap/markdown'
import { contentExtensions, contentSchema } from './extensions'
import { displayTitle, isEmptyNote, newBlankNote, withUpdatedTitle, type Note, type NoteFont } from './notes'

// Markdown of a note: used by the backup, by "Export as Markdown" and by importing a file.
// Doesn't depend on an open page (the automatic backup runs in the service worker).

// Converter created once, when first needed
let markdown: MarkdownManager | undefined

function converter(): MarkdownManager {
  markdown ??= new MarkdownManager({ extensions: flattenExtensions(contentExtensions) })
  return markdown
}

export function noteToMarkdown(note: Note): string {
  return converter().serialize(note.doc)
}

// A new note from the text of an imported file: .md/.markdown is read as markdown,
// anything else (.txt) as plain text. Returns null when the file has no text.
// textSize and font: the "Text size of new notes" and "Font of new notes" settings
export function noteFromFile(fileName: string, fileText: string, textSize = 100, font: NoteFont = 'sans'): Note | null {
  const text = fileText.replace(/\r\n?/g, '\n') // Windows and old Mac line breaks
  const isMarkdown = /\.(md|markdown)$/i.test(fileName)
  const doc = (isMarkdown && markdownDoc(text)) || plainTextDoc(text)
  const note = withUpdatedTitle({ ...newBlankNote(textSize, font), doc })
  return isEmptyNote(note) ? null : note
}

// The document for a markdown text, or null if the editor couldn't open it
function markdownDoc(text: string): JSONContent | null {
  try {
    const doc = limitHeadings(converter().parse(text))
    contentSchema().nodeFromJSON(doc).check()
    return doc
  } catch {
    return null
  }
}

// Draftab has headings 1 to 3: #### and smaller become level 3
function limitHeadings(node: JSONContent): JSONContent {
  const attrs = node.type === 'heading' && node.attrs?.level > 3 ? { ...node.attrs, level: 3 } : node.attrs
  return { ...node, attrs, content: node.content?.map(limitHeadings) }
}

// One paragraph per line
function plainTextDoc(text: string): JSONContent {
  const lines = text.replace(/\n+$/, '').split('\n')
  return {
    type: 'doc',
    content: lines.map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })),
  }
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
