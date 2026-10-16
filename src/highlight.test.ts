// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { Editor, type JSONContent } from '@tiptap/core'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { contentExtensions, contentSchema } from './extensions'
import { HIGHLIGHT_COLORS, applyHighlight, canHighlight, selectionHighlight } from './highlight'
import { noteToMarkdown } from './markdown'
import { newBlankNote } from './notes'
import { noteToWhatsApp } from './whatsapp'

const schema = contentSchema()

const text = (t: string, color?: string): JSONContent => ({
  type: 'text',
  text: t,
  ...(color ? { marks: [{ type: 'highlight', attrs: { color } }] } : {}),
})
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content })

// State with the selection from `from` to `to`
function stateWith(content: JSONContent[], from: number, to: number): EditorState {
  const doc = schema.nodeFromJSON({ type: 'doc', content })
  return EditorState.create({ doc, selection: TextSelection.create(doc, from, to) })
}

// A document parsed from HTML, the way pasting or a saved page would read it
function parseHTML(html: string) {
  const element = document.createElement('div')
  element.innerHTML = html
  return PMDOMParser.fromSchema(schema).parse(element)
}

describe('highlight mark', () => {
  test('the palette', () => {
    expect(HIGHLIGHT_COLORS).toEqual(['gray', 'red', 'orange', 'yellow', 'green', 'blue'])
  })

  test('kept in the JSON with its color', () => {
    const doc = schema.nodeFromJSON({ type: 'doc', content: [paragraph(text('a '), text('b', 'yellow'))] })
    doc.check()
    expect(doc.toJSON().content[0].content[1].marks).toEqual([{ type: 'highlight', attrs: { color: 'yellow' } }])
  })

  test('HTML: only span[data-highlight] with a palette color; <mark> from other pages is plain text', () => {
    const doc = parseHTML('<p><span data-highlight="green">a</span><span data-highlight="hotpink">b</span><mark>c</mark></p>')
    const marks = (i: number) => doc.child(0).child(i).marks.map((m) => [m.type.name, m.attrs.color])
    expect(doc.child(0).childCount).toBe(2)
    expect(marks(0)).toEqual([['highlight', 'green']])
    expect(marks(1)).toEqual([])
    expect(doc.child(0).child(1).text).toBe('bc')
  })

  test('markdown export and WhatsApp have no trace of it', () => {
    const highlighted = { ...newBlankNote(), doc: { type: 'doc', content: [paragraph(text('t')), paragraph(text('a '), text('b', 'red'))] } }
    const plain = { ...newBlankNote(), doc: { type: 'doc', content: [paragraph(text('t')), paragraph(text('a b'))] } }
    expect(noteToMarkdown(highlighted)).toBe(noteToMarkdown(plain))
    expect(noteToWhatsApp(highlighted.doc)).toBe(noteToWhatsApp(plain.doc))
  })
})

describe('applyHighlight', () => {
  // "abcd" takes positions 1–5
  test('highlights only the selection; another color replaces it; null removes it', () => {
    const state = stateWith([paragraph(text('abcd'))], 2, 4)
    const yellow = state.apply(applyHighlight(state, 'yellow')!)
    expect(yellow.doc.toJSON().content[0].content).toEqual([text('a'), text('bc', 'yellow'), text('d')])

    const blue = yellow.apply(applyHighlight(yellow, 'blue')!)
    expect(blue.doc.toJSON().content[0].content).toEqual([text('a'), text('bc', 'blue'), text('d')])

    const none = blue.apply(applyHighlight(blue, null)!)
    expect(none.doc.toJSON().content[0].content).toEqual([text('abcd')])
  })

  test('keeps the other marks', () => {
    const bold = { type: 'text', text: 'ab', marks: [{ type: 'bold' }] }
    const state = stateWith([paragraph(bold)], 1, 3)
    const marks = state.apply(applyHighlight(state, 'green')!).doc.child(0).child(0).marks.map((m) => m.type.name)
    expect(marks.sort()).toEqual(['bold', 'highlight'])
  })

  test('no selection: nothing to do', () => {
    const state = stateWith([paragraph(text('abcd'))], 2, 2)
    expect(applyHighlight(state, 'yellow')).toBeNull()
  })
})

describe('selectionHighlight and canHighlight', () => {
  test('the color when all the selected text has the same one', () => {
    const content = [paragraph(text('ab', 'red'), text('cd', 'blue'))]
    expect(selectionHighlight(stateWith(content, 1, 3))).toBe('red')
    expect(selectionHighlight(stateWith(content, 2, 4))).toBeNull() // red and blue
    expect(selectionHighlight(stateWith([paragraph(text('ab', 'red'), text('cd'))], 1, 5))).toBeNull() // part has none
  })

  test('not in code', () => {
    const code = { type: 'codeBlock', content: [text('let a')] }
    const inline = paragraph({ type: 'text', text: 'x', marks: [{ type: 'code' }] })
    expect(canHighlight(stateWith([code], 1, 4))).toBe(false)
    expect(canHighlight(stateWith([inline], 1, 2))).toBe(false)
    expect(canHighlight(stateWith([paragraph(text('abc'))], 1, 2))).toBe(true)
  })
})

describe('in the editor', () => {
  test('typing right after a highlight is not highlighted', () => {
    const editor = new Editor({ extensions: contentExtensions, content: { type: 'doc', content: [paragraph(text('ab', 'yellow'))] } })
    editor.commands.setTextSelection(3)
    editor.commands.insertContent('c')
    expect(editor.getJSON().content?.[0].content).toEqual([text('ab', 'yellow'), text('c')])
    editor.destroy()
  })
})
