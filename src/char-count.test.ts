import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { contentSchema } from './extensions'
import { characters, countCharacters, markdownCharacters, plainTextCharacters, selectedCharacters } from './char-count'
import { newBlankNote, type Note } from './notes'

const text = (t: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text: t, marks })
const paragraph = (...c: JSONContent[]): JSONContent => ({ type: 'paragraph', content: c })

function noteWith(...content: JSONContent[]): Note {
  return { ...newBlankNote(), doc: { type: 'doc', content } }
}

const note = noteWith(
  { type: 'heading', attrs: { level: 1 }, content: [text('Hi')] },
  paragraph(text('one '), text('bold', [{ type: 'bold' }])),
  { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('item'))] }] },
  { type: 'paragraph' },
)
const doc = contentSchema().nodeFromJSON(note.doc)

describe('countCharacters', () => {
  test('counts an emoji or an accented letter as one character', () => {
    expect(countCharacters('café 👍')).toBe(6)
    expect(countCharacters('')).toBe(0)
  })
})

describe('markdownCharacters', () => {
  test('counts the markdown marks, without the trailing blank lines', () => {
    // "# Hi\n\none **bold**\n\n- item"
    expect(markdownCharacters(note)).toBe(26)
  })

  test('an empty note has 0', () => {
    expect(markdownCharacters(newBlankNote())).toBe(0)
  })
})

describe('plainTextCharacters', () => {
  test('counts the text with one line break between blocks, without the empty lines at the end', () => {
    // "Hi\none bold\nitem"
    expect(plainTextCharacters(doc)).toBe(16)
  })
})

describe('selectedCharacters', () => {
  test('counts only the range given', () => {
    // Inside the heading: positions 1 to 3 are "Hi"
    expect(selectedCharacters(doc, 1, 3)).toBe(2)
  })

  test('a selection across blocks counts the line break between them', () => {
    // From "Hi" to the "one" of the next paragraph: "Hi\none"
    expect(selectedCharacters(doc, 1, 8)).toBe(6)
  })

  test('selecting the whole note counts the same as the note without markdown', () => {
    expect(selectedCharacters(doc, 0, doc.content.size)).toBe(plainTextCharacters(doc))
  })
})

describe('characters', () => {
  test('singular and plural', () => {
    expect(characters(1)).toBe('1 character')
    expect(characters(0)).toBe('0 characters')
  })

  test('an image counts as its markdown, and as nothing without markdown', () => {
    const doc = { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://x/a.png', alt: null, title: null } }] }
    expect(markdownCharacters({ ...newBlankNote(), doc })).toBe('![](https://x/a.png)'.length)
    expect(plainTextCharacters(contentSchema().nodeFromJSON(doc))).toBe(0)
  })
})
