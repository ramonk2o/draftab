import { describe, expect, test } from 'vitest'
import { contentSchema } from './extensions'
import { imageMarkdown, isWebAddress, plainTextOf } from './images'

const schema = contentSchema()

describe('isWebAddress', () => {
  test('only http and https', () => {
    expect(isWebAddress('https://x.com/a.png')).toBe(true)
    expect(isWebAddress('HTTP://x.com/a.png')).toBe(true)
    expect(isWebAddress('data:image/png;base64,AAAA')).toBe(false)
    expect(isWebAddress('img.png')).toBe(false)
    expect(isWebAddress('javascript:alert(1)')).toBe(false)
    expect(isWebAddress(null)).toBe(false)
  })
})

describe('imageMarkdown', () => {
  test('with and without description and title', () => {
    expect(imageMarkdown({ src: 'https://x/a.png' })).toBe('![](https://x/a.png)')
    expect(imageMarkdown({ src: 'https://x/a.png', alt: 'cat', title: 'T' })).toBe('![cat](https://x/a.png "T")')
  })
})

describe('plainTextOf', () => {
  test('one line per block, images as markdown, hard breaks kept', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a' }, { type: 'hardBreak' }, { type: 'text', text: 'b' }] },
        { type: 'image', attrs: { src: 'https://x/a.png', alt: 'cat' } },
        { type: 'paragraph', content: [{ type: 'text', text: 'c' }] },
      ],
    })
    expect(plainTextOf(doc.content)).toBe('a\nb\n![cat](https://x/a.png)\nc')
  })
})

describe('schema', () => {
  test('an image stores only src, alt and title', () => {
    expect(Object.keys(schema.nodes.image.spec.attrs ?? {})).toEqual(['src', 'alt', 'title'])
  })
})
