import { describe, expect, test } from 'vitest'
import { contentSchema } from './extensions'
import { findTags, tagDecorations } from './tags'

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
