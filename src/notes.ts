import type { JSONContent } from '@tiptap/core'

// A note as it is stored (see "Data model" in SPEC.md)
export type Note = {
  id: string
  doc: JSONContent // Tiptap JSON: the source of truth
  title: string
  titleManual: boolean // true after the user renames the note
  createdAt: number
  updatedAt: number
}

export function newBlankNote(): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    doc: { type: 'doc', content: [{ type: 'paragraph' }] },
    title: '',
    titleManual: false,
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

// A note with no text and no user-given title isn't stored
export function isEmptyNote(note: Note): boolean {
  return !note.titleManual && textOf(note.doc).trim() === ''
}

export function displayTitle(note: Note): string {
  return note.title || 'Untitled'
}

// Searches title and content, ignoring case and accents
export function filterNotes(notes: Note[], search: string): Note[] {
  const term = normalize(search.trim())
  if (term === '') return notes
  return notes.filter((note) => normalize(note.title).includes(term) || normalize(textOf(note.doc)).includes(term))
}

// How the sidebar sorts notes (chosen in Settings)
export type NoteSort = 'updated' | 'title' | 'created'

// Returns a sorted copy: last modified or date created (newest first), or title A–Z
// (ignoring case and accents, numbers in natural order, untitled notes last)
export function sortNotes(notes: Note[], order: NoteSort): Note[] {
  const copy = [...notes]
  if (order === 'created') return copy.sort((a, b) => b.createdAt - a.createdAt)
  if (order === 'title') {
    return copy.sort((a, b) => {
      if (!a.title !== !b.title) return a.title ? -1 : 1 // untitled last
      const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true })
      return byTitle || b.updatedAt - a.updatedAt
    })
  }
  return copy.sort((a, b) => b.updatedAt - a.updatedAt)
}

// The date shown next to a note in the sidebar follows the sort order
export function listDate(note: Note, order: NoteSort): number {
  return order === 'created' ? note.createdAt : note.updatedAt
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
