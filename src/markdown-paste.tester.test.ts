import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { history, undo } from '@tiptap/pm/history'
import { contentSchema } from './extensions'
import { pasteMarkdown } from './markdown-paste'
import { markdownDoc, noteFromFile, noteToMarkdown } from './markdown'
import { newBlankNote } from './notes'

// Extra tests written by the tester (not by the feature's author)

const schema = contentSchema()
const text = (t: string, marks?: JSONContent['marks']): JSONContent => (marks ? { type: 'text', text: t, marks } : { type: 'text', text: t })
const paragraph = (...c: (JSONContent | string)[]): JSONContent => {
  const content = c.map((x) => (typeof x === 'string' ? text(x) : x))
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' }
}
const item = (...c: (JSONContent | string)[]): JSONContent => ({ type: 'listItem', content: [paragraph(...c)] })
const task = (t: string, checked: boolean): JSONContent => ({ type: 'taskItem', attrs: { checked }, content: [paragraph(t)] })
const code = (t: string): JSONContent => ({ type: 'codeBlock', attrs: { language: null }, content: [text(t)] })

function stateAt(content: JSONContent[], pos: number, withHistory = false): EditorState {
  const doc = schema.nodeFromJSON({ type: 'doc', content })
  return EditorState.create({ doc, selection: TextSelection.create(doc, pos), plugins: withHistory ? [history()] : [] })
}

function paste(textToPaste: string, { html = '', types = ['text/plain'], shift = false } = {}): JSONContent[] | null {
  const tr = pasteMarkdown(stateAt([paragraph()], 1), { text: textToPaste, html, types }, shift)
  return tr && tr.doc.toJSON().content
}

describe('Cmd/Ctrl+Shift+V pastes the raw text, anywhere', () => {
  test('even when the copy brought HTML', () => {
    expect(paste('# a\n**b**', { html: '<h1>a</h1><b>b</b>', types: ['text/plain', 'text/html'], shift: true })).toEqual([paragraph('# a'), paragraph('**b**')])
  })

  test('is not marked as a paste, so the paste rules (**, ~~, ++) do not apply', () => {
    const tr = pasteMarkdown(stateAt([paragraph()], 1), { text: '**x**', html: '', types: ['text/plain'] }, true)
    expect(tr?.getMeta('paste')).toBeFalsy()
    expect(tr?.doc.toJSON().content).toEqual([paragraph('**x**')])
  })

  test('inside a code block it goes in as-is, blank lines included', () => {
    const tr = pasteMarkdown(stateAt([code('x')], 2), { text: '# a\n\nb', html: '', types: ['text/plain'] }, true)
    expect(tr?.doc.toJSON().content).toEqual([code('x# a\n\nb')])
  })
})

describe('Cmd/Ctrl+Z undoes the whole paste in one step', () => {
  test('one undo goes back to the note before the paste', () => {
    const before = [paragraph('start')]
    let state = stateAt(before, 6, true)
    const tr = pasteMarkdown(state, { text: '# T\n- a\n- b\n> q\nend', html: '', types: ['text/plain'] }, false)
    state = state.apply(tr!)
    expect(state.doc.childCount).toBeGreaterThan(1)
    undo(state, (t) => (state = state.apply(t)))
    expect(state.doc.toJSON().content).toEqual(before)
  })
})

describe('one line, one block', () => {
  test('a line followed by --- is a paragraph and a divider, not a heading', () => {
    expect(paste('Title\n---')).toEqual([paragraph('Title'), { type: 'horizontalRule' }])
  })

  test('a line followed by === is two paragraphs, not a heading', () => {
    expect(paste('Title\n===')).toEqual([paragraph('Title'), paragraph('===')])
  })

  test('a quote line followed by a plain line: the plain line is a paragraph outside the quote', () => {
    expect(paste('> a\nplain')).toEqual([{ type: 'blockquote', content: [paragraph('a')] }, paragraph('plain')])
  })

  test('blank lines between bullet items vanish (one list)', () => {
    expect(paste('- a\n\n- b')).toEqual([{ type: 'bulletList', content: [item('a'), item('b')] }])
  })

  test('blank lines between checklist items vanish (one checklist)', () => {
    expect(paste('- [ ] a\n\n- [x] b')).toEqual([{ type: 'taskList', content: [task('a', false), task('b', true)] }])
  })

  test('a text with only blank lines does not throw', () => {
    expect(() => paste('\n\n\n')).not.toThrow()
  })

  test('blank lines inside a fenced code block are kept', () => {
    expect(paste('```\na\n\n\nb\n```')).toEqual([code('a\n\n\nb')])
  })

  test('a heading-looking line inside a ~~~ fence stays code; after the fence it is a heading again', () => {
    expect(paste('~~~\n# x\n~~~\n# y')).toEqual([code('# x'), { type: 'heading', attrs: { level: 1 }, content: [text('y')] }])
  })

  test('a line break inside a list item (two spaces / backslash)', () => {
    const list = [{ type: 'bulletList', content: [item('a', { type: 'hardBreak' }, 'b')] }]
    expect(paste('- a  \n  b')).toEqual(list)
    expect(paste('- a\\\n  b')).toEqual(list)
  })

  test('a line break inside a quote', () => {
    expect(paste('> a  \n> b')).toEqual([{ type: 'blockquote', content: [paragraph('a', { type: 'hardBreak' }, 'b')] }])
  })

  test('a backslash on the last line has nothing to break and stays as text', () => {
    expect(paste('a\nb\\')).toEqual([paragraph('a'), paragraph('b\\')])
  })

  test('Windows line breaks with a line break (two spaces) still make a hard break', () => {
    expect(paste('a  \r\nb')).toEqual([paragraph('a', { type: 'hardBreak' }, 'b')])
  })

  test('old Mac line breaks (\\r) are lines too', () => {
    expect(paste('one\rtwo')).toEqual([paragraph('one'), paragraph('two')])
  })

  test('a large paste (2000 lines) becomes 2000 blocks', () => {
    const lines = Array.from({ length: 2000 }, (_, i) => `line ${i}`)
    expect(paste(lines.join('\n'))).toHaveLength(2000)
  })
})

describe('tables stay as text, nothing is lost', () => {
  test('a table right after a text line (no blank line)', () => {
    expect(paste('a\n| x | y |\n|---|---|')).toEqual([paragraph('a'), paragraph('| x | y |'), paragraph('|---|---|')])
  })

  test('a table inside a quote stays as text and the rest of the paste is still formatted', () => {
    const result = paste('# Title\n> | a | b |\n> |---|---|\n> | 1 | 2 |')
    expect(result).not.toBeNull()
    expect(result?.[0]).toEqual({ type: 'heading', attrs: { level: 1 }, content: [text('Title')] })
    expect(JSON.stringify(result)).toContain('| 1 | 2 |')
  })

  test('a .md file with a table inside a quote keeps its other markdown', () => {
    const doc = noteFromFile('a.md', '# Title\n> | a | b |\n> |---|---|\n> | 1 | 2 |')?.doc
    expect(doc?.content?.[0].type).toBe('heading')
  })
})

describe('where it is pasted', () => {
  test('a paste with HTML inside a code block is left to the editor', () => {
    expect(pasteMarkdown(stateAt([code('x')], 2), { text: '# a', html: '<b>a</b>', types: ['text/plain', 'text/html'] }, false)).toBeNull()
  })

  test('list items pasted in the middle of a list item: first joins the item, rest of the item ends after the last', () => {
    const list = [{ type: 'bulletList', content: [item('ab')] }]
    // bulletList 0, listItem 1, paragraph 2, "a" at 3, cursor between a and b = 4
    const tr = pasteMarkdown(stateAt(list, 4), { text: '- x\n- y', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([{ type: 'bulletList', content: [item('ax'), item('yb')] }])
  })

  test('pasting over a selection replaces it', () => {
    const doc = schema.nodeFromJSON({ type: 'doc', content: [paragraph('abcd')] })
    const state = EditorState.create({ doc, selection: TextSelection.create(doc, 2, 4) })
    const tr = pasteMarkdown(state, { text: 'one\ntwo', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([paragraph('aone'), paragraph('twod')])
  })

  test('VS Code copy with Shift pastes the raw text', () => {
    expect(paste('# a', { html: '<div># a</div>', types: ['text/plain', 'text/html', 'vscode-editor-data'], shift: true })).toEqual([paragraph('# a')])
  })
})

describe('export and import give back the same note', () => {
  const roundTrip = (content: JSONContent[]) => {
    const md = noteToMarkdown({ ...newBlankNote(), doc: { type: 'doc', content } })
    return markdownDoc(md)?.content
  }

  test('a paragraph with a Shift+Enter line break', () => {
    const content = [paragraph('a', { type: 'hardBreak' }, 'b')]
    expect(roundTrip(content)).toEqual(content)
  })

  test('a list item and a quote with line breaks', () => {
    const content = [
      { type: 'bulletList', content: [item('a', { type: 'hardBreak' }, 'b')] },
      { type: 'blockquote', content: [paragraph('c', { type: 'hardBreak' }, 'd'), paragraph('e')] },
    ]
    expect(roundTrip(content)).toEqual(content)
  })

  test('consecutive paragraphs, a checklist and a code block with blank lines', () => {
    const content = [paragraph('one'), paragraph('two'), { type: 'taskList', content: [task('t', false), task('u', true)] }, code('a\n\nb')]
    expect(roundTrip(content)).toEqual(content)
  })
})

// Round 2 (tester)

const list = (type: string, ...items: JSONContent[]): JSONContent => ({ type, content: items })
const heading = (level: number, t: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [text(t)] })
const pasteAt = (content: JSONContent[], pos: number, t: string, shift = false) =>
  pasteMarkdown(stateAt(content, pos), { text: t, html: '', types: ['text/plain'] }, shift)?.doc.toJSON().content
// All node types in a document, at any depth
const typesIn = (nodes: JSONContent[] | undefined): string[] => (nodes ?? []).flatMap((n) => [n.type ?? '', ...typesIn(n.content)])

describe('standard markdown otherwise (round 2)', () => {
  test('a line indented by 4 spaces or a tab is code', () => {
    expect(paste('text\n    code1\n    code2')).toEqual([paragraph('text'), code('code1\ncode2')])
    expect(paste('\tcode')).toEqual([code('code')])
  })

  test('an indented line right after an item is a second paragraph of that item', () => {
    expect(paste('- a\n  b')).toEqual([{ type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('a'), paragraph('b')] }] }])
  })

  test('a list followed by a checklist stays two lists', () => {
    expect(paste('- a\n- [ ] b')).toEqual([list('bulletList', item('a')), list('taskList', task('b', false))])
  })

  test('a nested list followed by a plain line: the line is a paragraph', () => {
    expect(paste('- a\n  - b\nafter')).toEqual([
      list('bulletList', { type: 'listItem', content: [paragraph('a'), list('bulletList', item('b'))] }),
      paragraph('after'),
    ])
  })
})

describe('one line, one block (round 2)', () => {
  test('a line with inline ```code``` does not open a fence: a plain line after a list is still a paragraph', () => {
    const result = paste('```x``` code\n- a\nafter')
    expect(result?.[result.length - 1]).toEqual(paragraph('after'))
  })

  test('a line ending in two spaces followed by --- is not turned into a heading', () => {
    expect(typesIn(paste('a  \n---') ?? [])).not.toContain('heading')
    expect(typesIn(paste('a  \n===') ?? [])).not.toContain('heading')
  })
})

describe('a single line in the middle of text keeps its characters', () => {
  // "ab", cursor between a and b
  for (const symbol of ['-', '*', '#']) {
    test(`pasting "${symbol}" alone inserts it`, () => {
      const result = pasteMarkdown(stateAt([paragraph('ab')], 2), { text: symbol, html: '', types: ['text/plain'] }, false)
      // null = left to the editor's own paste, which inserts the text
      if (result) expect(result.doc.toJSON().content).toEqual([paragraph(`a${symbol}b`)])
    })
  }
})

describe('pasting inside a list item (round 2)', () => {
  test('a heading line becomes plain text in a new item of the list, not a heading or a nested list', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, '# h\nx')
    expect(typesIn(result)).not.toContain('heading')
    expect(result).toEqual([list('bulletList', item('ah'), item('xb'))])
  })

  test('a heading as the last line stays in the list as plain text', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, 'x\n# h')
    expect(typesIn(result)).not.toContain('heading')
    expect(result).toEqual([list('bulletList', item('ax'), item('hb'))])
  })

  test('a heading pasted into an empty item keeps the item', () => {
    // bulletList 0, listItem 1, paragraph 2: the cursor in the empty paragraph = 3
    expect(pasteAt([list('bulletList', item())], 3, '# h')).toEqual([list('bulletList', item('h'))])
  })

  test('bullet lines pasted in a checklist become checklist items of that list, not a nested bullet list', () => {
    const result = pasteAt([list('taskList', task('ab', false))], 4, '- x\n- y')
    expect(result).toEqual([list('taskList', task('ax', false), task('yb', false))])
  })

  test('Shift paste inside a list item: each line is a new item too', () => {
    expect(pasteAt([list('bulletList', item('ab'))], 4, 'x\n# y', true)).toEqual([list('bulletList', item('ax'), item('# yb'))])
  })

  test('in an ordered list, lines become items of that ordered list', () => {
    expect(pasteAt([{ type: 'orderedList', attrs: { start: 1, type: null }, content: [item('ab')] }], 4, 'x\ny')).toEqual([
      { type: 'orderedList', attrs: { start: 1, type: null }, content: [item('ax'), item('yb')] },
    ])
  })
})

describe('where it is pasted (round 2)', () => {
  test('in a heading: the first line joins the heading, the rest after it', () => {
    expect(pasteAt([heading(1, 'ab')], 2, 'x\ny')).toEqual([heading(1, 'ax'), paragraph('yb')])
  })

  test('in a quote: the lines stay inside the quote', () => {
    expect(pasteAt([{ type: 'blockquote', content: [paragraph('ab')] }], 3, 'x\ny')).toEqual([{ type: 'blockquote', content: [paragraph('ax'), paragraph('yb')] }])
  })

  test('a whitespace-only paste is left to the editor (not swallowed)', () => {
    expect(pasteMarkdown(stateAt([paragraph('ab')], 2), { text: ' ', html: '', types: ['text/plain'] }, false)).toBeNull()
  })
})

describe('pasting inside a list item (round 3)', () => {
  test('a quote pasted inside a list item splits the list around it', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, 'x\n> q\ny')
    expect(result).toEqual([
      list('bulletList', item('ax')),
      { type: 'blockquote', content: [paragraph('q')] },
      list('bulletList', item('yb')),
    ])
  })

  test('a code block pasted inside a list item splits the list around it', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, 'x\n```\nc\n```\ny')
    expect(result).toEqual([list('bulletList', item('ax')), code('c'), list('bulletList', item('yb'))])
  })

  test('checklist items pasted in a bullet list become bullet items', () => {
    expect(pasteAt([list('bulletList', item('ab'))], 4, '- [ ] x\n- [x] y')).toEqual([list('bulletList', item('ax'), item('yb'))])
  })

  test('a checked checklist item pasted in a checklist stays checked', () => {
    expect(pasteAt([list('taskList', task('ab', false))], 4, 'x\n- [x] y')).toEqual([list('taskList', task('ax', false), task('yb', true))])
  })

  test('numbered lines pasted in a bullet list become bullet items', () => {
    expect(pasteAt([list('bulletList', item('ab'))], 4, '1. x\n2. y')).toEqual([list('bulletList', item('ax'), item('yb'))])
  })

  test('a divider pasted inside a list item splits the list around it', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, 'x\n---\ny')
    expect(result).toEqual([list('bulletList', item('ax')), { type: 'horizontalRule' }, list('bulletList', item('yb'))])
  })

  test('a nested list pasted inside a list item keeps its nesting', () => {
    const result = pasteAt([list('bulletList', item('ab'))], 4, '- x\n  - y\n- z')
    expect(result).toEqual([
      list('bulletList', { type: 'listItem', content: [paragraph('ax'), list('bulletList', item('y'))] }, item('zb')),
    ])
  })
})

describe('one line, one block (round 3)', () => {
  test('ordered list with ) markers and + bullets', () => {
    expect(typesIn(paste('1) a\n2) b\n+ c') ?? undefined)).toEqual(['orderedList', 'listItem', 'paragraph', 'text', 'listItem', 'paragraph', 'text', 'bulletList', 'listItem', 'paragraph', 'text'])
  })

  test('a plain line right after a checklist is a paragraph', () => {
    expect(paste('- [ ] a\nafter')).toEqual([list('taskList', task('a', false)), paragraph('after')])
  })

  test('a plain line right after an ordered list is a paragraph', () => {
    const result = paste('1. a\nafter')
    expect(result?.[1]).toEqual(paragraph('after'))
  })

  test('an unclosed fence takes the rest of the paste as code, lines kept', () => {
    expect(paste('```\n# a\nb')).toEqual([code('# a\nb')])
  })

  test('marks and links inside a line', () => {
    const result = paste('a **b** [c](https://x.com)\nd')
    expect(result?.length).toBe(2)
    const pieces = result?.[0].content ?? []
    expect(pieces.find((p) => p.text === 'b')?.marks?.[0].type).toBe('bold')
    expect(pieces.find((p) => p.text === 'c')?.marks?.[0]).toMatchObject({ type: 'link', attrs: { href: 'https://x.com' } })
    expect(result?.[1]).toEqual(paragraph('d'))
  })

  // ASSUMPTION (not decided in the entry): current behavior, standard markdown
  test('assumption: two quotes separated by a blank line stay two quotes', () => {
    const quote = (t: string) => ({ type: 'blockquote', content: [paragraph(t)] })
    expect(paste('> a\n\n> b')).toEqual([quote('a'), quote('b')])
  })

  // ASSUMPTION (not decided in the entry): current behavior, standard markdown
  test('assumption: "* a" then "- b" (different bullet characters) are two lists', () => {
    expect(paste('* a\n- b')).toEqual([list('bulletList', item('a')), list('bulletList', item('b'))])
  })
})

describe('the .md import follows the same rules (round 3)', () => {
  test('a line ending in two spaces stays a line break in the imported block', () => {
    expect(noteFromFile('a.md', 'a  \nb')?.doc.content).toEqual([paragraph('a', { type: 'hardBreak' }, 'b')])
  })

  test('a plain line after a quote is a paragraph outside it', () => {
    expect(noteFromFile('a.md', '> q\nafter')?.doc.content).toEqual([{ type: 'blockquote', content: [paragraph('q')] }, paragraph('after')])
  })

  test('a link reference definition stays as text in the import', () => {
    const doc = noteFromFile('a.md', 'see [x]\n\n[x]: https://a.com')?.doc
    expect(JSON.stringify(doc)).toContain('https://a.com')
  })
})
