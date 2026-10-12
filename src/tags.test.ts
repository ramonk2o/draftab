import { describe, expect, test } from 'vitest'
import { contentSchema } from './extensions'
import { newBlankNote, type Note } from './notes'
import { findTags, tagDecorations, tagsOf, tagSuggestions, wordAt } from './tags'

const tags = (text: string) => findTags(text).map((t) => t.tag)

describe('findTags', () => {
  test('# + a letter, then letters, digits, _ or -', () => {
    expect(tags('#idea #project-x #q1_2026 #ação')).toEqual(['#idea', '#project-x', '#q1_2026', '#ação'])
  })

  test('only at the start or after a space', () => {
    expect(tags('C# site.com/#section a#b')).toEqual([])
    expect(tags('see #one\t#two')).toEqual(['#one', '#two'])
  })

  test("doesn't start with a digit, another # or a space", () => {
    expect(tags('#2026 item #1 ##double # heading')).toEqual([])
  })

  test('ends at the first character not allowed', () => {
    expect(tags('#idea, #done. (#x)')).toEqual(['#idea', '#done'])
  })

  test('gives the position of each tag in the text', () => {
    expect(findTags('a #bc d')).toEqual([{ from: 2, to: 5, tag: '#bc' }])
  })
})

describe('tagDecorations', () => {
  const text = (t: string, marks?: { type: string }[]) => ({ type: 'text', text: t, marks })
  const tagsIn = (content: object[]) => {
    const doc = contentSchema().nodeFromJSON({ type: 'doc', content })
    return tagDecorations(doc)
      .find()
      .map((d) => d.spec.tag)
  }

  test('finds tags in paragraphs, headings and lists, also across marks and after a line break', () => {
    expect(
      tagsIn([
        { type: 'paragraph', content: [text('a '), text('#bo', [{ type: 'bold' }]), text('ld'), { type: 'hardBreak' }, text('#next')] },
        { type: 'heading', attrs: { level: 2 }, content: [text('#title')] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('#item')] }] }] },
      ]),
    ).toEqual(['#bold', '#next', '#title', '#item'])
  })

  test('skips tags in inline code and code blocks', () => {
    expect(
      tagsIn([
        { type: 'paragraph', content: [text('#code', [{ type: 'code' }]), text(' #ok')] },
        { type: 'codeBlock', content: [text('#block')] },
      ]),
    ).toEqual(['#ok'])
  })
})

describe('tagsOf', () => {
  test('finds tags in every block, except in code', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a #one ' }, { type: 'text', text: '#code', marks: [{ type: 'code' }] }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '#two' }] }] }] },
        { type: 'codeBlock', content: [{ type: 'text', text: '#block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }, { type: 'hardBreak' }, { type: 'text', text: '#three' }] },
      ],
    }
    expect(tagsOf(doc)).toEqual(['#one', '#two', '#three'])
  })

  test("inline code doesn't join the text around it into a tag", () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'code' }] }, { type: 'text', text: '#a' }] }] }
    expect(tagsOf(doc)).toEqual(['#a'])
  })
})

describe('tagSuggestions', () => {
  const note = (text: string): Note => ({ ...newBlankNote(), doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] } })
  const notes = [note('#project #prio #project'), note('#Project #ideas'), note('#projeto #ideas'), note('#prio')]

  test('most used first (notes, not occurrences), ties A–Z, with the count', () => {
    expect(tagSuggestions(notes, '#')).toEqual([
      { tag: '#ideas', count: 2 },
      { tag: '#prio', count: 2 },
      { tag: '#project', count: 2 },
      { tag: '#projeto', count: 1 },
    ])
  })

  test('only tags that start with what was typed, ignoring case and accents', () => {
    expect(tagSuggestions(notes, '#PRÓ').map((s) => s.tag)).toEqual(['#project', '#projeto'])
  })

  test("the tag that's exactly what was typed isn't suggested", () => {
    expect(tagSuggestions(notes, '#prio')).toEqual([])
    expect(tagSuggestions(notes, '#IDEAS')).toEqual([])
  })

  test('up to 8', () => {
    const many = [note(Array.from({ length: 12 }, (_, i) => `#t${i}`).join(' '))]
    expect(tagSuggestions(many, '#t')).toHaveLength(8)
  })
})

describe('wordAt', () => {
  test('the word around the cursor, between spaces', () => {
    expect(wordAt('abc #pr', 7)).toEqual({ word: '#pr', start: 4, end: 7 })
    expect(wordAt('abc #pr def', 6)).toEqual({ word: '#pr', start: 4, end: 7 })
    expect(wordAt('abc ', 4)).toEqual({ word: '', start: 4, end: 4 })
    expect(wordAt('#x', 0)).toEqual({ word: '#x', start: 0, end: 2 })
  })
})
