import { describe, expect, test } from 'vitest'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { contentSchema } from './extensions'
import { cursorNear, imageAddress, imageMarkdown, isWebAddress, pasteImageAddress, plainTextOf } from './images'

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

  test('brackets in the description and quotes and backslashes in the title are escaped', () => {
    expect(imageMarkdown({ src: 'https://x/a.png', alt: 'a [b] c', title: 'say "hi" \\o/' })).toBe(
      String.raw`![a \[b\] c](https://x/a.png "say \"hi\" \\o/")`,
    )
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
  test('an image moves only with the handle, not by dragging the picture', () => {
    expect(schema.nodes.image.spec.draggable).toBe(false)
  })

  test('an image stores only src, alt and title', () => {
    expect(Object.keys(schema.nodes.image.spec.attrs ?? {})).toEqual(['src', 'alt', 'title'])
  })
})

describe('imageAddress', () => {
  test('an http/https address ending in an image extension', () => {
    expect(imageAddress('https://x.com/a.png')).toBe('https://x.com/a.png')
    expect(imageAddress('  https://x.com/A.JPEG?w=600#top \n')).toBe('https://x.com/A.JPEG?w=600#top')
    for (const ext of ['jpg', 'gif', 'webp', 'svg', 'avif']) expect(imageAddress(`http://x/a.${ext}`)).not.toBeNull()
  })

  test('anything else is not', () => {
    expect(imageAddress('https://example.com/page')).toBeNull()
    expect(imageAddress('look https://x.com/a.png')).toBeNull()
    expect(imageAddress('https://x.com/a.png https://x.com/b.png')).toBeNull()
    expect(imageAddress('file:///a.png')).toBeNull()
    expect(imageAddress('https://x.com/a.pngx')).toBeNull()
  })
})

describe('pasteImageAddress', () => {
  const p = (t?: string) => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : undefined })
  function stateAt(content: object[], pos: number) {
    const doc = schema.nodeFromJSON({ type: 'doc', content })
    return EditorState.create({ doc, selection: TextSelection.create(doc, pos) })
  }

  test('on an empty top-level line: the image goes above, the cursor stays below', () => {
    const state = stateAt([p('a'), p()], 4)
    const tr = pasteImageAddress(state, 'https://x/a.png')!
    expect(tr.doc.toJSON().content.map((b: { type: string }) => b.type)).toEqual(['paragraph', 'image', 'paragraph'])
    expect(tr.selection.$from.parent.type.name).toBe('paragraph')
    expect(tr.selection.$from.parent.content.size).toBe(0)
  })

  test('not an image address, a line with text, a list or a quote: nothing', () => {
    expect(pasteImageAddress(stateAt([p()], 1), 'https://x/page')).toBeNull()
    expect(pasteImageAddress(stateAt([p('ab')], 2), 'https://x/a.png')).toBeNull()
    const list = { type: 'bulletList', content: [{ type: 'listItem', content: [p()] }] }
    expect(pasteImageAddress(stateAt([list], 3), 'https://x/a.png')).toBeNull()
    const quote = { type: 'blockquote', content: [p()] }
    expect(pasteImageAddress(stateAt([quote], 2), 'https://x/a.png')).toBeNull()
  })
})

describe('cursorNear', () => {
  const p = (t?: string) => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : undefined })
  const image = { type: 'image', attrs: { src: 'https://x/a.png' } }
  const docOf = (...content: object[]) => schema.nodeFromJSON({ type: 'doc', content })

  test('a position inside text stays where it is', () => {
    const selection = cursorNear(docOf(p('abc'), image), 2)
    expect(selection).toBeInstanceOf(TextSelection)
    expect(selection.from).toBe(2)
  })

  test('a position next to an image or past the end goes to the nearest line of text', () => {
    const doc = docOf(p('teste'), image)
    for (const pos of [7, 8, 20]) {
      const selection = cursorNear(doc, pos)
      expect(selection).toBeInstanceOf(TextSelection)
      expect(selection.$from.parent.inlineContent).toBe(true)
    }
    expect(cursorNear(docOf(image, p('a')), 0).from).toBe(2)
  })

  test('a note with only images: the image is selected', () => {
    expect(cursorNear(docOf(image), 1)).not.toBeInstanceOf(TextSelection)
  })
})
