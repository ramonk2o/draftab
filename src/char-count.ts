import type { Node } from '@tiptap/pm/model'
import { noteToMarkdown } from './markdown'
import type { Note } from './notes'
import { tn } from './i18n'

// Character counts shown at the bottom right of the note page

// Characters as people count them: an emoji or an accented letter is one
// (text.length would count some of them as two)
export function countCharacters(text: string): number {
  return Array.from(text).length
}

// Line breaks at the end (empty paragraphs at the end of the note) don't count
function withoutTrailingLines(text: string): string {
  return text.replace(/\n+$/, '')
}

// The whole note as markdown (marks like **, # and - included)
export function markdownCharacters(note: Note): number {
  return countCharacters(withoutTrailingLines(noteToMarkdown(note)))
}

// The whole note as plain text, one line per block: the same as a plain-text copy
export function plainTextCharacters(doc: Node): number {
  return countCharacters(withoutTrailingLines(doc.textBetween(0, doc.content.size, '\n')))
}

// The text between two positions (a selection), counted the same way
export function selectedCharacters(doc: Node, from: number, to: number): number {
  return countCharacters(withoutTrailingLines(doc.textBetween(from, to, '\n')))
}

// "1 character", "1,234 characters" (separators in the browser's language)
export function characters(count: number): string {
  return tn('characters', count)
}
