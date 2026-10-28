import { flattenExtensions, type JSONContent } from '@tiptap/core'
import { MarkdownManager } from '@tiptap/markdown'
import { contentExtensions, contentSchema } from './extensions'
import { displayTitle, isEmptyNote, newBlankNote, withUpdatedTitle, type Note, type NoteFont } from './notes'
import { t } from './i18n'
import { imageMarkdown, isWebAddress } from './images'

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

// The document for a markdown text (one block per line), or null if the editor couldn't open it.
// Used by importing a file and by pasting markdown
export function markdownDoc(text: string): JSONContent | null {
  try {
    const doc = splitLines(limitHeadings(imagesToText(converter().parse(oneBlockPerLine(text)))))
    contentSchema().nodeFromJSON(doc).check()
    return doc
  } catch {
    return null
  }
}

// Markdown joins consecutive lines into one paragraph, and a plain line after a list or a quote
// into its last item. Draftab keeps one block per line: a blank line goes between two lines,
// except inside code and where markdown keeps them apart anyway (see keepTogether)
function oneBlockPerLine(text: string): string {
  const result: string[] = []
  let fence = '' // the ``` or ~~~ that opened the code block we're in
  for (const line of text.split('\n')) {
    // A ``` that closes on the same line is inline code, not a code block
    const marker = line.replace(/^[\s>]*/, '').match(/^(`{3,}(?=[^`]*$)|~{3,})/)?.[1]
    if (fence) {
      result.push(line)
      if (marker?.startsWith(fence) && line.trim().endsWith(marker)) fence = ''
      continue
    }
    // Blank lines between items of the same list vanish (they would split a checklist in two)
    if (listItem.test(line)) {
      let last = result.length
      while (last > 0 && !result[last - 1].trim()) last--
      if (last < result.length && last > 0 && inList(result[last - 1])) result.length = last
    }
    const previous = result[result.length - 1]
    if (previous?.trim() && line.trim()) {
      if (quoted.test(previous) && quoted.test(line)) {
        // Lines of the same quote: the same rules inside it, with an empty quote line between them
        const inside = (quoteLine: string) => quoteLine.replace(quoted, '')
        if (inside(previous).trim() && inside(line).trim() && !keepTogether(inside(previous), inside(line))) result.push('>')
      } else if (!keepTogether(previous, line)) {
        result.push('')
      }
    }
    // A link reference definition ("[x]: https://…") would vanish: escaped, it stays as text
    result.push(line.replace(/^(\s{0,3})\[(?=[^\]]+\]:)/, '$1\\['))
    if (marker) fence = marker
  }
  return result.join('\n')
}

const listItem = /^\s*([-*+]|\d+[.)])(\s|$)/
const quoted = /^\s{0,3}>\s?/

// A list item, or an indented line (inside a list item)
function inList(line: string): boolean {
  return listItem.test(line) || /^\s/.test(line)
}

// Lines that stay next to each other: a line break (two spaces or \ at the end), items of the
// same list (a blank line would split a checklist in two), lines of the same quote, and indented code
function keepTogether(previous: string, line: string): boolean {
  // A line break, but not over a --- or === line (that would make the line above it a heading)
  if (/( {2}|\\)$/.test(previous) && !/^\s*(-+|=+)\s*$/.test(line)) return true
  if (listItem.test(line)) return inList(previous)
  if (quoted.test(line)) return quoted.test(previous)
  return /^( {4}|\t)/.test(previous) && /^( {4}|\t)/.test(line)
}

// Lines kept together inside a paragraph (in a quote or a list item) become paragraphs of their own
function splitLines(node: JSONContent): JSONContent {
  if (!node.content) return node
  const content: JSONContent[] = []
  for (const child of node.content) {
    if (child.type === 'paragraph' && child.content?.some((piece) => piece.text?.includes('\n'))) {
      content.push(...paragraphPerLine(child.content))
    } else {
      content.push(splitLines(child))
    }
  }
  return { ...node, content }
}

function paragraphPerLine(pieces: JSONContent[]): JSONContent[] {
  const lines: JSONContent[][] = [[]]
  for (const piece of pieces) {
    const parts = piece.type === 'text' ? (piece.text ?? '').split('\n') : [null]
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part === null) {
        lines[lines.length - 1].push(piece)
        return
      }
      // A new line starts without the indentation it had inside the list item
      const lineText = i > 0 ? part.trimStart() : part
      if (lineText) lines[lines.length - 1].push({ ...piece, text: lineText })
    })
  }
  return lines.filter((line) => line.length).map((line) => ({ type: 'paragraph', content: line }))
}

// Draftab has headings 1 to 3: #### and smaller become level 3
function limitHeadings(node: JSONContent): JSONContent {
  const attrs = node.type === 'heading' && node.attrs?.level > 3 ? { ...node.attrs, level: 3 } : node.attrs
  return { ...node, attrs, content: node.content?.map(limitHeadings) }
}

// An image inside a line of text (or a list item), or with an address that isn't http/https,
// stays as its ![description](address) text; only an image on a line of its own becomes a block
function imagesToText(node: JSONContent, inText = false): JSONContent {
  if (node.type === 'image' && (inText || !isWebAddress(node.attrs?.src))) {
    const text: JSONContent = { type: 'text', text: imageMarkdown(node.attrs ?? {}) }
    return inText ? text : { type: 'paragraph', content: [text] }
  }
  if (!node.content) return node
  const isTextBlock = node.type === 'paragraph' || node.type === 'heading'
  const content = node.content.map((child) => imagesToText(child, isTextBlock))
  return { ...node, content: isTextBlock ? mergeTexts(content) : content }
}

// Neighboring pieces of text with the same formatting become one
function mergeTexts(content: JSONContent[]): JSONContent[] {
  const merged: JSONContent[] = []
  for (const piece of content) {
    const last = merged[merged.length - 1]
    const sameMarks = JSON.stringify(last?.marks ?? []) === JSON.stringify(piece.marks ?? [])
    if (last?.type === 'text' && piece.type === 'text' && sameMarks) {
      merged[merged.length - 1] = { ...last, text: (last.text ?? '') + (piece.text ?? '') }
    } else {
      merged.push(piece)
    }
  }
  return merged
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
  return `${name || t('untitled')}.md`
}
