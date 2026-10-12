import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { contentSchema } from './extensions'
import { unwrapBlockAtStart } from './unwrap-block'

const schema = contentSchema()
const text = (t: string): JSONContent => ({ type: 'text', text: t })
const paragraph = (t?: string): JSONContent => ({ type: 'paragraph', content: t ? [text(t)] : undefined })
const code = (t: string): JSONContent => ({ type: 'codeBlock', content: t ? [text(t)] : undefined })
const quote = (...c: JSONContent[]): JSONContent => ({ type: 'blockquote', content: c })

// State with the cursor at `pos` (or a selection from `pos` to `to`)
function stateAt(content: JSONContent[], pos: number, to = pos): EditorState {
  const doc = schema.nodeFromJSON({ type: 'doc', content })
  return EditorState.create({ doc, selection: TextSelection.create(doc, pos, to) })
}

function result(state: EditorState) {
  const tr = unwrapBlockAtStart(state)
  return tr && { content: tr.doc.toJSON().content, cursor: tr.selection.from }
}

describe('code block', () => {
  // "before" takes positions 0–7; the code block opens at 8, its text starts at 9
  test('becomes one paragraph per line, keeping empty lines', () => {
    const r = result(stateAt([paragraph('before'), code('let a = 1\n\nlet b = 2')], 9))
    expect(r?.content).toEqual([paragraph('before'), paragraph('let a = 1'), paragraph(), paragraph('let b = 2')])
    expect(r?.cursor).toBe(9) // start of the first new paragraph
  })

  test('cursor in the middle of the code: not applied', () => {
    expect(unwrapBlockAtStart(stateAt([paragraph('before'), code('let a = 1')], 11))).toBeNull()
  })

  test('empty code block is left to Tiptap', () => {
    expect(unwrapBlockAtStart(stateAt([paragraph('before'), code('')], 9))).toBeNull()
  })

  test('selection instead of cursor: not applied', () => {
    expect(unwrapBlockAtStart(stateAt([paragraph('before'), code('let a = 1')], 9, 12))).toBeNull()
  })
})

describe('quote', () => {
  // "before" takes 0–7; the quote opens at 8, its first paragraph at 9, text at 10
  test('at the start of the first paragraph, the whole quote is undone', () => {
    const r = result(stateAt([paragraph('before'), quote(paragraph('one'), paragraph('two')), paragraph('after')], 10))
    expect(r?.content).toEqual([paragraph('before'), paragraph('one'), paragraph('two'), paragraph('after')])
    expect(r?.cursor).toBe(9) // still at the start of "one"
  })

  test('at the start of a later paragraph it is left to Tiptap', () => {
    // "one" paragraph: 9–13, "two" paragraph opens at 14, text at 15
    expect(unwrapBlockAtStart(stateAt([paragraph('before'), quote(paragraph('one'), paragraph('two'))], 15))).toBeNull()
  })

  test('quote at the very start of the note', () => {
    const r = result(stateAt([quote(paragraph('one'))], 2))
    expect(r?.content).toEqual([paragraph('one')])
  })

  test('cursor in the middle of the text: not applied', () => {
    expect(unwrapBlockAtStart(stateAt([quote(paragraph('one'))], 3))).toBeNull()
  })
})

test('plain paragraph: not applied', () => {
  expect(unwrapBlockAtStart(stateAt([paragraph('before'), paragraph('text')], 9))).toBeNull()
})
