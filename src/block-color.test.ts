// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { Editor, type JSONContent } from '@tiptap/core'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { contentExtensions, contentSchema } from './extensions'
import { BLOCK_COLORS, canBeColored, setBlockColor } from './block-color'
import { noteToMarkdown } from './markdown'
import { newBlankNote } from './notes'

const schema = contentSchema()

const paragraph = (text: string, color?: string): JSONContent => ({
  type: 'paragraph',
  ...(color ? { attrs: { color } } : {}),
  content: [{ type: 'text', text }],
})

// A document parsed from HTML, the way pasting or a saved page would read it
function parseHTML(html: string) {
  const element = document.createElement('div')
  element.innerHTML = html
  return PMDOMParser.fromSchema(schema).parse(element)
}

describe('color attribute', () => {
  test('the palette', () => {
    expect(BLOCK_COLORS).toEqual(['gray', 'red', 'orange', 'yellow', 'green', 'blue'])
  })

  test('blocks keep their color in the JSON; no color is null', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [
        paragraph('a', 'yellow'),
        { type: 'heading', attrs: { level: 2, color: 'blue' }, content: [{ type: 'text', text: 'h' }] },
        {
          type: 'bulletList',
          attrs: { color: 'gray' },
          content: [{ type: 'listItem', attrs: { color: 'red' }, content: [paragraph('i')] }],
        },
        paragraph('b'),
      ],
    })
    doc.check()
    const json = doc.toJSON()
    expect(json.content[0].attrs.color).toBe('yellow')
    expect(json.content[1].attrs.color).toBe('blue')
    expect(json.content[2].attrs.color).toBe('gray')
    expect(json.content[2].content[0].attrs.color).toBe('red')
    expect(json.content[3].attrs.color).toBeNull()
  })

  test('HTML: data-color from the palette is read, anything else is no color', () => {
    const doc = parseHTML('<p data-color="green">a</p><p data-color="hotpink">b</p><blockquote data-color="red"><p>q</p></blockquote>')
    expect(doc.child(0).attrs.color).toBe('green')
    expect(doc.child(1).attrs.color).toBeNull()
    expect(doc.child(2).attrs.color).toBe('red')
  })

  test('images and dividers have no color', () => {
    const doc = schema.nodeFromJSON({
      type: 'doc',
      content: [paragraph('a'), { type: 'horizontalRule' }, { type: 'image', attrs: { src: 'https://x/a.png' } }],
    })
    expect(canBeColored(doc.child(0))).toBe(true)
    expect(canBeColored(doc.child(1))).toBe(false)
    expect(canBeColored(doc.child(2))).toBe(false)
    expect('color' in doc.child(1).attrs).toBe(false)
  })

  test('markdown export has no trace of the color', () => {
    const colored = { ...newBlankNote(), doc: { type: 'doc', content: [paragraph('a', 'yellow'), paragraph('b')] } }
    const plain = { ...newBlankNote(), doc: { type: 'doc', content: [paragraph('a'), paragraph('b')] } }
    expect(noteToMarkdown(colored)).toBe(noteToMarkdown(plain))
  })
})

describe('setBlockColor', () => {
  const doc = schema.nodeFromJSON({ type: 'doc', content: [paragraph('a'), paragraph('b', 'red')] })

  test('sets and removes the color of the block at a position', () => {
    const state = EditorState.create({ schema, doc })
    const colored = state.apply(setBlockColor(state.tr, 0, 'yellow'))
    expect(colored.doc.child(0).attrs.color).toBe('yellow')

    const second = doc.child(0).nodeSize
    const cleared = state.apply(setBlockColor(state.tr, second, null))
    expect(cleared.doc.child(1).attrs.color).toBeNull()
  })
})

describe('in the editor', () => {
  test('Enter at the end of a colored paragraph starts one without color', () => {
    const editor = new Editor({ extensions: contentExtensions, content: { type: 'doc', content: [paragraph('a', 'yellow')] } })
    editor.commands.setTextSelection(2)
    editor.commands.splitBlock()
    expect(editor.state.doc.child(0).attrs.color).toBe('yellow')
    expect(editor.state.doc.child(1).attrs.color).toBeNull()
    editor.destroy()
  })
})
