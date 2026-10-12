import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { markdownFileName, noteFromFile, noteToMarkdown } from './markdown'
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

describe('noteFromFile', () => {
  const types = (note: Note | null) => note?.doc.content?.map((block) => block.type)

  test('a .md file is read as markdown, with an automatic title', () => {
    const md = '# Ideas\n\nOne **bold**\n\n- item\n\n1. first\n\n- [x] done\n\n> quote\n\n```\nlet a = 1\n```\n\n---\n'
    const note = noteFromFile('ideas.md', md)
    expect(types(note)).toEqual(['heading', 'paragraph', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'horizontalRule'])
    expect(note?.title).toBe('Ideas')
    expect(note?.titleManual).toBe(false)
    // Back to markdown, nothing is lost
    expect(noteToMarkdown(note!)).toContain('- [x] done')
    expect(noteToMarkdown(note!)).toContain('One **bold**')
  })

  test('headings smaller than ### become level 3', () => {
    expect(noteFromFile('a.md', '#### four\n\n###### six')?.doc.content?.map((b) => b.attrs?.level)).toEqual([3, 3])
  })

  test("markdown the editor can't hold is read as plain text", () => {
    // Images aren't Draftab blocks
    expect(noteFromFile('a.md', '![img](x.png)\n\ntext')?.doc.content).toEqual([paragraph(text('![img](x.png)')), { type: 'paragraph' }, paragraph(text('text'))])
  })

  test('.markdown works too, in any case', () => {
    expect(types(noteFromFile('NOTES.MARKDOWN', '# Hi'))).toEqual(['heading'])
  })

  test('a .txt file is plain text: one paragraph per line, markdown untouched', () => {
    const note = noteFromFile('list.txt', '# not a heading\nsecond\n\nfourth\n')
    expect(note?.doc.content).toEqual([paragraph(text('# not a heading')), paragraph(text('second')), { type: 'paragraph' }, paragraph(text('fourth'))])
    expect(note?.title).toBe('# not a heading')
  })

  test('Windows line breaks', () => {
    const note = noteFromFile('a.txt', 'one\r\ntwo\r\n')
    expect(note?.doc.content).toEqual([paragraph(text('one')), paragraph(text('two'))])
  })

  test('an empty file (or only blank lines) creates nothing', () => {
    expect(noteFromFile('empty.md', '')).toBeNull()
    expect(noteFromFile('blank.txt', '\n  \n')).toBeNull()
  })

  test('every import is a new note', () => {
    expect(noteFromFile('a.txt', 'x')?.id).not.toBe(noteFromFile('a.txt', 'x')?.id)
  })
})
