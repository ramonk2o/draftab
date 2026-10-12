import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import {
  filterNotes,
  firstLine,
  isEmptyNote,
  listDate,
  newBlankNote,
  nextTextSize,
  renamed,
  sortNotes,
  textOf,
  validTextSize,
  withUpdatedTitle,
  type Note,
} from './notes'

const text = (t: string): JSONContent => ({ type: 'text', text: t })
const paragraph = (t?: string): JSONContent => ({ type: 'paragraph', content: t ? [text(t)] : undefined })
const doc = (...blocks: JSONContent[]): JSONContent => ({ type: 'doc', content: blocks })
const noteWith = (d: JSONContent, extra: Partial<Note> = {}): Note => ({ ...newBlankNote(), doc: d, ...extra })

describe('textOf and firstLine', () => {
  test('each block becomes a line, including inside lists', () => {
    const d = doc(
      { type: 'heading', attrs: { level: 1 }, content: [text('Ideas')] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('one')] }] },
    )
    expect(textOf(d)).toBe('Ideas\none')
  })

  test('first line skips empty blocks', () => {
    expect(firstLine(doc(paragraph(), paragraph('  hi  '), paragraph('after')))).toBe('hi')
  })

  test('first line of an empty note is empty text', () => {
    expect(firstLine(doc(paragraph()))).toBe('')
  })

  test('first line is limited to 80 characters', () => {
    expect(firstLine(doc(paragraph('a'.repeat(200))))).toHaveLength(80)
  })
})

describe('title', () => {
  test('automatic title follows the first line', () => {
    const note = noteWith(doc(paragraph('new beginning')), { title: 'old' })
    expect(withUpdatedTitle(note).title).toBe('new beginning')
  })

  test('a renamed note keeps its title even if the text changes', () => {
    const note = renamed(noteWith(doc(paragraph('text'))), '  My title ')
    expect(note).toMatchObject({ title: 'My title', titleManual: true })
    const edited = withUpdatedTitle({ ...note, doc: doc(paragraph('other text')) })
    expect(edited.title).toBe('My title')
  })

  test('renaming to empty goes back to automatic', () => {
    const note = renamed(noteWith(doc(paragraph('first')), { title: 'X', titleManual: true }), '   ')
    expect(note).toMatchObject({ title: 'first', titleManual: false })
  })
})

describe('isEmptyNote', () => {
  test('no text and no user-given title', () => {
    expect(isEmptyNote(noteWith(doc(paragraph(), paragraph())))).toBe(true)
  })

  test('with text it is not empty', () => {
    expect(isEmptyNote(noteWith(doc(paragraph('a'))))).toBe(false)
  })

  test('no text but renamed is not empty', () => {
    expect(isEmptyNote(noteWith(doc(paragraph()), { title: 'List', titleManual: true }))).toBe(false)
  })
})

describe('filterNotes', () => {
  const notes = [
    noteWith(doc(paragraph('Résumé review')), { title: 'Résumé review' }),
    noteWith(doc(paragraph('Groceries'), paragraph('bread and café au lait')), { title: 'Groceries' }),
  ]

  test('empty search returns all of them', () => {
    expect(filterNotes(notes, '  ')).toHaveLength(2)
  })

  test('finds by title ignoring case and accents', () => {
    expect(filterNotes(notes, 'RESUME').map((n) => n.title)).toEqual(['Résumé review'])
  })

  test('finds by content', () => {
    expect(filterNotes(notes, 'cafe').map((n) => n.title)).toEqual(['Groceries'])
  })

  test('no results', () => {
    expect(filterNotes(notes, 'xyz')).toEqual([])
  })
})

describe('sortNotes', () => {
  // created and updated in different orders, to tell the options apart
  const notes = [
    noteWith(doc(paragraph('b')), { title: 'banana', createdAt: 3, updatedAt: 10 }),
    noteWith(doc(paragraph('a')), { title: 'Apple', createdAt: 1, updatedAt: 30 }),
    noteWith(doc(paragraph()), { title: '', createdAt: 5, updatedAt: 50 }),
    noteWith(doc(paragraph('c')), { title: 'Çaju', createdAt: 4, updatedAt: 20 }),
    noteWith(doc(paragraph('n')), { title: 'Note 10', createdAt: 2, updatedAt: 40 }),
    noteWith(doc(paragraph('n')), { title: 'Note 2', createdAt: 6, updatedAt: 5 }),
  ]
  const titles = (list: Note[]) => list.map((n) => n.title || '(untitled)')

  test('last modified: newest edit first', () => {
    expect(titles(sortNotes(notes, 'updated'))).toEqual(['(untitled)', 'Note 10', 'Apple', 'Çaju', 'banana', 'Note 2'])
  })

  test('date created: newest first', () => {
    expect(titles(sortNotes(notes, 'created'))).toEqual(['Note 2', '(untitled)', 'Çaju', 'banana', 'Note 10', 'Apple'])
  })

  test('title: A–Z ignoring case and accents, numbers in natural order, untitled last', () => {
    expect(titles(sortNotes(notes, 'title'))).toEqual(['Apple', 'banana', 'Çaju', 'Note 2', 'Note 10', '(untitled)'])
  })

  test('returns a copy and leaves the original list untouched', () => {
    const before = titles(notes)
    sortNotes(notes, 'title')
    expect(titles(notes)).toEqual(before)
  })

  test('the date shown follows the order', () => {
    const note = noteWith(doc(paragraph('x')), { createdAt: 1, updatedAt: 2 })
    expect(listDate(note, 'created')).toBe(1)
    expect(listDate(note, 'updated')).toBe(2)
    expect(listDate(note, 'title')).toBe(2)
  })
})

describe('text size', () => {
  test('a new note starts with the size it was given (the setting), 100% by default', () => {
    expect(newBlankNote().textSize).toBe(100)
    expect(newBlankNote(120).textSize).toBe(120)
    expect(newBlankNote(77).textSize).toBe(100)
  })

  test('sizes outside the steps (or missing, in old notes) are 100%', () => {
    expect(validTextSize(undefined)).toBe(100)
    expect(validTextSize(105)).toBe(100)
    expect(validTextSize('120')).toBe(100)
    expect(validTextSize(150)).toBe(150)
  })

  test('one step at a time, stopping at 80% and 150%', () => {
    expect(nextTextSize(100, 1)).toBe(110)
    expect(nextTextSize(120, 1)).toBe(135)
    expect(nextTextSize(90, -1)).toBe(80)
    expect(nextTextSize(80, -1)).toBe(80)
    expect(nextTextSize(150, 1)).toBe(150)
  })
})
