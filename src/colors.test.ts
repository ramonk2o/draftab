import { describe, expect, test } from 'vitest'
import { contentSchema } from './extensions'
import { colorDecorations, findColors } from './colors'

const colors = (text: string) => findColors(text).map((c) => c.color)

describe('findColors', () => {
  test('hex with 3, 4, 6 or 8 digits, any case', () => {
    expect(colors('#fff #3A7BD5 #f00a #3a7bd580')).toEqual(['#fff', '#3A7BD5', '#f00a', '#3a7bd580'])
  })

  test('other lengths and non-hex letters are not colors', () => {
    expect(colors('#ff #fffff #3a7bd5f #abcdefabc #ggg #1')).toEqual([])
  })

  test("can't be glued to a letter, digit, _ or - on either side", () => {
    expect(colors('a#fff #fffx #fff_ #fff-1 1#000')).toEqual([])
    expect(colors('color:#fff; (#000), "#123456".')).toEqual(['#fff', '#000', '#123456'])
  })

  test('rgb and rgba with commas or spaces, alpha after , or /', () => {
    expect(colors('rgb(255, 0, 0) RGB(0 128 255) rgba(0,0,0,0.5) rgba(0 0 0 / 50%) rgb(100%, 0%, 50%) rgba(1, 2, 3, .5)')).toEqual([
      'rgb(255, 0, 0)',
      'RGB(0 128 255)',
      'rgba(0,0,0,0.5)',
      'rgba(0 0 0 / 50%)',
      'rgb(100%, 0%, 50%)',
      'rgba(1, 2, 3, .5)',
    ])
  })

  test('rgb values out of range or incomplete are not colors', () => {
    expect(colors('rgb(256, 0, 0) rgb(0, 0) rgba(0, 0, 0, 2) rgb(101%, 0, 0) rgb(1.2.3, 0, 0) xrgb(0, 0, 0)')).toEqual([])
  })

  test('positions in text order', () => {
    expect(findColors('rgb(0, 0, 0) and #fff')).toEqual([
      { from: 0, to: 12, color: 'rgb(0, 0, 0)' },
      { from: 17, to: 21, color: '#fff' },
    ])
  })

  test('a code that is also a word still counts', () => {
    expect(colors('#cafe #bad')).toEqual(['#cafe', '#bad'])
  })
})

describe('colorDecorations', () => {
  const doc = contentSchema().nodeFromJSON({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'a #fff ' }, { type: 'text', text: '#000', marks: [{ type: 'code' }] }] },
      { type: 'codeBlock', content: [{ type: 'text', text: 'color: rgb(1, 2, 3);' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'x' }, { type: 'hardBreak' }, { type: 'text', text: '#123' }] },
    ],
  })

  test('a swatch before each code, including inline code and code blocks', () => {
    const found = colorDecorations(doc).find().map((d) => ({ at: d.from, color: d.spec.color }))
    // paragraph 0–13 ("a #fff #000"), code block 13–35, paragraph from 35
    expect(found).toEqual([
      { at: 3, color: '#fff' },
      { at: 8, color: '#000' },
      { at: 21, color: 'rgb(1, 2, 3)' },
      { at: 38, color: '#123' },
    ])
  })
})
