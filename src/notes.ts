import type { JSONContent } from '@tiptap/core'
import { t } from './i18n'

// A note as it is stored (see "Data model" in SPEC.md)
export type Note = {
  id: string
  doc: JSONContent // Tiptap JSON: the source of truth
  title: string
  titleManual: boolean // true after the user renames the note
  textSize?: number // in percent, one of TEXT_SIZES; missing in notes from before it existed (= 100)
  font?: NoteFont // missing in notes from before fonts were per note (see noteFontOf)
  pinned?: boolean // pinned in the sidebar; missing = not pinned
  createdAt: number
  updatedAt: number
}

// Text sizes of a note, in percent of the note font's normal size
export const TEXT_SIZES = [80, 90, 100, 110, 120, 135, 150]

// The size to use for a value read from storage, a backup or the settings
export function validTextSize(size: unknown): number {
  return TEXT_SIZES.includes(size as number) ? (size as number) : 100
}

// One step smaller (-1) or bigger (+1), stopping at the ends of the range
export function nextTextSize(size: number, direction: 1 | -1): number {
  const i = TEXT_SIZES.indexOf(validTextSize(size)) + direction
  return TEXT_SIZES[Math.min(Math.max(i, 0), TEXT_SIZES.length - 1)]
}

// Note fonts, in the order the "Aa" button switches through them
export type NoteFont = 'sans' | 'serif' | 'mono'
export const NOTE_FONTS: NoteFont[] = ['sans', 'serif', 'mono']

export function isNoteFont(font: unknown): font is NoteFont {
  return NOTE_FONTS.includes(font as NoteFont)
}

// The note's font. Notes from before fonts were per note have none of their own:
// they use oldFont, the font that was set in Settings back then (settings.noteFont)
export function noteFontOf(note: Note, oldFont: NoteFont): NoteFont {
  return isNoteFont(note.font) ? note.font : oldFont
}

// The next font, back to the first after the last
export function nextNoteFont(font: NoteFont): NoteFont {
  return NOTE_FONTS[(NOTE_FONTS.indexOf(font) + 1) % NOTE_FONTS.length]
}

// textSize and font: the "Text size of new notes" and "Font of new notes" settings
// heading: the first line starts as an empty level-1 heading ("New notes start with a heading")
export function newBlankNote(textSize = 100, font: NoteFont = 'sans', heading = false): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    doc: { type: 'doc', content: [heading ? { type: 'heading', attrs: { level: 1 } } : { type: 'paragraph' }] },
    title: '',
    titleManual: false,
    textSize: validTextSize(textSize),
    font,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }
}

// Plain text of part of the document; each block becomes a line
export function textOf(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  const children = node.content ?? []
  const isTextBlock = children.some((c) => c.type === 'text' || c.type === 'hardBreak')
  return children.map(textOf).join(isTextBlock ? '' : '\n')
}

// First line with text, limited to 80 characters
export function firstLine(doc: JSONContent): string {
  const line = textOf(doc)
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l !== '')
  return (line ?? '').slice(0, 80)
}

// The document without its first block (the title) and the empty paragraphs right after it.
// Used by "Copy note" and "Copy for WhatsApp".
export function withoutFirstLine(doc: JSONContent): JSONContent {
  const blocks = (doc.content ?? []).slice(1)
  while (blocks.length > 0 && blocks[0].type === 'paragraph' && textOf(blocks[0]).trim() === '') blocks.shift()
  return { ...doc, content: blocks }
}

// Until the note is renamed, the title follows the first line
export function withUpdatedTitle(note: Note): Note {
  if (note.titleManual) return note
  return { ...note, title: firstLine(note.doc) }
}

// Renaming to empty goes back to the automatic title
export function renamed(note: Note, newTitle: string): Note {
  const title = newTitle.trim()
  if (title === '') return withUpdatedTitle({ ...note, titleManual: false })
  return { ...note, title, titleManual: true }
}

// Whether there's anything in the content: text or an image
export function hasContent(node: JSONContent): boolean {
  if (node.type === 'image') return true
  if (node.type === 'text') return (node.text ?? '').trim() !== ''
  return (node.content ?? []).some(hasContent)
}

// A note with no content and no user-given title isn't stored
export function isEmptyNote(note: Note): boolean {
  return !note.titleManual && !hasContent(note.doc)
}

export function displayTitle(note: Note): string {
  return note.title || t('untitled')
}

// The browser tab shows the note's title; with none yet (e.g. a new blank note), the normal title
export function tabTitle(note: Note): string {
  return note.title || t('pageTitle')
}

// Searches title and content, ignoring case and accents
export function filterNotes(notes: Note[], search: string): Note[] {
  const term = normalize(search.trim())
  if (term === '') return notes
  return notes.filter((note) => normalize(note.title).includes(term) || normalize(textOf(note.doc)).includes(term))
}

// How the sidebar sorts notes (chosen in Settings)
export type NoteSort = 'updated' | 'title' | 'created'

// Returns a sorted copy: pinned notes first, then the others, each group in the order:
// last modified or date created (newest first), or title A–Z
// (ignoring case and accents, numbers in natural order, untitled notes last)
export function sortNotes(notes: Note[], order: NoteSort): Note[] {
  return [...notes].sort((a, b) => {
    if (isPinned(a) !== isPinned(b)) return isPinned(a) ? -1 : 1
    if (order === 'created') return b.createdAt - a.createdAt
    if (order === 'title') {
      if (!a.title !== !b.title) return a.title ? -1 : 1 // untitled last
      const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true })
      return byTitle || b.updatedAt - a.updatedAt
    }
    return b.updatedAt - a.updatedAt
  })
}

export function isPinned(note: Note): boolean {
  return note.pinned === true
}

// The date shown next to a note in the sidebar follows the sort order
export function listDate(note: Note, order: NoteSort): number {
  return order === 'created' ? note.createdAt : note.updatedAt
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
