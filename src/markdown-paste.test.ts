import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { contentSchema } from './extensions'
import { pasteMarkdown } from './markdown-paste'

const schema = contentSchema()
const text = (t: string, marks?: JSONContent['marks']): JSONContent => (marks ? { type: 'text', text: t, marks } : { type: 'text', text: t })
const paragraph = (...c: (JSONContent | string)[]): JSONContent => {
  const content = c.map((x) => (typeof x === 'string' ? text(x) : x))
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' }
}
const item = (t: string): JSONContent => ({ type: 'listItem', content: [paragraph(t)] })
const task = (t: string, checked: boolean): JSONContent => ({ type: 'taskItem', attrs: { checked }, content: [paragraph(t)] })
const code = (t: string): JSONContent => ({ type: 'codeBlock', attrs: { language: null }, content: [text(t)] })

// State with the cursor at `pos`
function stateAt(content: JSONContent[], pos: number): EditorState {
  const doc = schema.nodeFromJSON({ type: 'doc', content })
  return EditorState.create({ doc, selection: TextSelection.create(doc, pos) })
}

// Pastes into an empty note; returns the note's blocks, or null when the paste is left to the editor
function paste(textToPaste: string, { html = '', types = ['text/plain'], shift = false } = {}): JSONContent[] | null {
  const tr = pasteMarkdown(stateAt([paragraph()], 1), { text: textToPaste, html, types }, shift)
  return tr && tr.doc.toJSON().content
}

describe('pasting plain text', () => {
  test('markdown becomes blocks', () => {
    const md = '# Title\nSome **bold** and [a link](https://x.com)\n- item\n- [x] done\n> quote\n```\nlet a = 1\n```\n---\nend'
    expect(paste(md)).toEqual([
      { type: 'heading', attrs: { level: 1 }, content: [text('Title')] },
      paragraph('Some ', text('bold', [{ type: 'bold' }]), ' and ', text('a link', [{ type: 'link', attrs: { href: 'https://x.com', target: '_blank', rel: 'noopener noreferrer nofollow', class: null, title: null } }])),
      { type: 'bulletList', content: [item('item')] },
      { type: 'taskList', content: [task('done', true)] },
      { type: 'blockquote', content: [paragraph('quote')] },
      code('let a = 1'),
      { type: 'horizontalRule' },
      paragraph('end'),
    ])
  })

  test('a paste with HTML is left to the editor', () => {
    expect(paste('# Title', { html: '<h1>Title</h1>', types: ['text/plain', 'text/html'] })).toBeNull()
  })

  test('a copy from VS Code ignores its HTML and is read as markdown', () => {
    const vscode = { html: '<div><span># Title</span></div>', types: ['text/plain', 'text/html', 'vscode-editor-data'] }
    expect(paste('# Title', vscode)).toEqual([{ type: 'heading', attrs: { level: 1 }, content: [text('Title')] }])
  })
})

describe('one line, one block', () => {
  test('consecutive lines are separate paragraphs', () => {
    expect(paste('one\ntwo\nthree')).toEqual([paragraph('one'), paragraph('two'), paragraph('three')])
  })

  test('a plain line right after a list is a paragraph, not part of the last item', () => {
    expect(paste('- a\n- b\nafter')).toEqual([{ type: 'bulletList', content: [item('a'), item('b')] }, paragraph('after')])
  })

  test('each line of a quote is a paragraph inside the quote', () => {
    expect(paste('> one\n> two')).toEqual([{ type: 'blockquote', content: [paragraph('one'), paragraph('two')] }])
  })

  test('consecutive list and checklist items stay in one list', () => {
    expect(paste('- [ ] a\n- [x] b')).toEqual([{ type: 'taskList', content: [task('a', false), task('b', true)] }])
    expect(paste('1. a\n2. b')).toEqual([{ type: 'orderedList', attrs: { start: 1, type: null }, content: [item('a'), item('b')] }])
  })

  test('blank lines vanish', () => {
    expect(paste('one\n\n\n\ntwo\n')).toEqual([paragraph('one'), paragraph('two')])
  })

  test('a line ending in two spaces or a backslash is a line break in the same block', () => {
    const withBreak = [paragraph('a', { type: 'hardBreak' }, 'b')]
    expect(paste('a  \nb')).toEqual(withBreak)
    expect(paste('a\\\nb')).toEqual(withBreak)
  })

  test('Windows line breaks work too', () => {
    expect(paste('one\r\ntwo')).toEqual([paragraph('one'), paragraph('two')])
  })
})

describe('same rules as the .md import', () => {
  test('headings smaller than ### become level 3', () => {
    expect(paste('#### four')).toEqual([{ type: 'heading', attrs: { level: 3 }, content: [text('four')] }])
  })

  test('an image alone on a line becomes an image block; inside text it stays text', () => {
    expect(paste('![cat](https://x/a.png)\nsee ![a](https://x/b.png) here')).toEqual([
      { type: 'image', attrs: { src: 'https://x/a.png', alt: 'cat', title: null } },
      paragraph('see ![a](https://x/b.png) here'),
    ])
  })

  test('a link reference definition stays as text', () => {
    // The address in it becomes a link, like any address
    const blocks = paste('see [x]\n[x]: https://a.com')
    expect(blocks?.map((block) => block.content?.map((piece) => piece.text).join(''))).toEqual(['see [x]', '[x]: https://a.com'])
  })

  test('a table stays as text, one line per block', () => {
    expect(paste('| a | b |\n|---|---|\n| 1 | 2 |')).toEqual([paragraph('| a | b |'), paragraph('|---|---|'), paragraph('| 1 | 2 |')])
  })
})

describe('where it is pasted', () => {
  test('inside a code block the text goes in as it came', () => {
    // The code block opens at 0; its text "x" starts at 1
    const tr = pasteMarkdown(stateAt([code('x')], 2), { text: '# not\n- a heading', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([code('x# not\n- a heading')])
  })

  test('with Shift, the raw text goes in, one paragraph per line', () => {
    expect(paste('# raw\n**x**\n\n- y', { shift: true })).toEqual([paragraph('# raw'), paragraph('**x**'), paragraph('- y')])
  })

  test('in the middle of a line: the first block joins it, the rest of the line ends up after the last block', () => {
    // "beforeafter": the cursor between "before" (1–6) and "after"
    const tr = pasteMarkdown(stateAt([paragraph('beforeafter')], 7), { text: 'one\n## two\nthree', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([
      paragraph('beforeone'),
      { type: 'heading', attrs: { level: 2 }, content: [text('two')] },
      paragraph('threeafter'),
    ])
  })

  test('a single line in the middle of text only gets its marks', () => {
    const tr = pasteMarkdown(stateAt([paragraph('ab')], 2), { text: '**x**', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([paragraph('a', text('x', [{ type: 'bold' }]), 'b')])
  })

  test('lines pasted inside a list item become new items of that list', () => {
    // bulletList 0, listItem 1, paragraph 2, "ab" from 3: the cursor between a and b
    const list = (type: string, ...items: JSONContent[]): JSONContent => ({ type, content: items })
    const tr = pasteMarkdown(stateAt([list('bulletList', item('ab'))], 4), { text: 'x\ny', html: '', types: ['text/plain'] }, false)
    expect(tr?.doc.toJSON().content).toEqual([list('bulletList', item('ax'), item('yb'))])

    const inTasks = pasteMarkdown(stateAt([list('taskList', task('ab', true))], 4), { text: 'x\ny\nz', html: '', types: ['text/plain'] }, false)
    expect(inTasks?.doc.toJSON().content).toEqual([list('taskList', task('ax', true), task('y', false), task('zb', false))])
  })
})
