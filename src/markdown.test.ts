import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { markdownFileName, noteToMarkdown } from './markdown'
import { newBlankNote, type Note } from './notes'

const text = (t: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text: t, marks })
const paragraph = (...c: JSONContent[]): JSONContent => ({ type: 'paragraph', content: c })

function noteWith(title: string, ...content: JSONContent[]): Note {
  return { ...newBlankNote(), title, doc: { type: 'doc', content } }
}

describe('noteToMarkdown', () => {
  test('converts every block type', () => {
    const note = noteWith(
      'Ideas',
      { type: 'heading', attrs: { level: 1 }, content: [text('Ideas')] },
      paragraph(text('one '), text('bold', [{ type: 'bold' }]), text(' and '), text('code', [{ type: 'code' }])),
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('item'))] }] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [paragraph(text('first'))] }] },
      {
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: true }, content: [paragraph(text('done'))] },
          { type: 'taskItem', attrs: { checked: false }, content: [paragraph(text('todo'))] },
        ],
      },
      { type: 'blockquote', content: [paragraph(text('quote'))] },
      { type: 'codeBlock', content: [text('let a = 1')] },
      { type: 'horizontalRule' },
    )
    const md = noteToMarkdown(note)
    expect(md).toContain('# Ideas')
    expect(md).toContain('one **bold** and `code`')
    expect(md).toContain('- item')
    expect(md).toContain('1. first')
    expect(md).toContain('- [x] done')
    expect(md).toContain('- [ ] todo')
    expect(md).toContain('> quote')
    expect(md).toContain('```\nlet a = 1\n```')
    expect(md).toContain('---')
  })
})

describe('markdownFileName', () => {
  const named = (title: string) => markdownFileName(noteWith(title))

  test('uses the title', () => {
    expect(named('Shopping list')).toBe('Shopping list.md')
    expect(named('Ideias de café ☕')).toBe('Ideias de café ☕.md')
  })

  test('removes characters not allowed in file names', () => {
    expect(named('a/b\\c:d*e?f"g<h>i|j')).toBe('a b c d e f g h i j.md')
    expect(named('line\tbreak\nhere')).toBe('line break here.md')
  })

  test('no leading or trailing dots or spaces', () => {
    expect(named('  .hidden. ')).toBe('hidden.md')
  })

  test('untitled notes and titles with nothing left', () => {
    expect(named('')).toBe('Untitled.md')
    expect(named('///')).toBe('Untitled.md')
  })

  test('long titles are cut at 100 characters', () => {
    expect(named('x'.repeat(300))).toBe(`${'x'.repeat(100)}.md`)
    expect(named('😀'.repeat(150))).toBe(`${'😀'.repeat(100)}.md`)
  })
})
