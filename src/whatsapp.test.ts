import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { noteToWhatsApp } from './whatsapp'

const text = (t: string, ...marks: string[]): JSONContent => ({
  type: 'text',
  text: t,
  marks: marks.length > 0 ? marks.map((type) => ({ type })) : undefined,
})
const link = (t: string, href: string): JSONContent => ({ type: 'text', text: t, marks: [{ type: 'link', attrs: { href } }] })
const paragraph = (...c: JSONContent[]): JSONContent => ({ type: 'paragraph', content: c })
const empty: JSONContent = { type: 'paragraph' }
const item = (...c: JSONContent[]): JSONContent => ({ type: 'listItem', content: c })
const title = paragraph(text('Title'))

// A note whose first block is a title, followed by the given blocks
function whatsApp(...blocks: JSONContent[]): string {
  return noteToWhatsApp({ type: 'doc', content: [title, ...blocks] })
}

describe('noteToWhatsApp', () => {
  test('leaves out the first line and the empty lines after it', () => {
    expect(whatsApp(empty, empty, paragraph(text('hello')), empty)).toBe('hello')
    expect(noteToWhatsApp({ type: 'doc', content: [title] })).toBe('')
  })

  test('one blank line between blocks, never more', () => {
    expect(whatsApp(paragraph(text('a')), paragraph(text('b')))).toBe('a\n\nb')
    expect(whatsApp(paragraph(text('a')), empty, empty, paragraph(text('b')))).toBe('a\n\nb')
  })

  test('the lines inside a block stay together', () => {
    expect(
      whatsApp(
        paragraph(text('intro')),
        { type: 'bulletList', content: [item(paragraph(text('one'))), item(paragraph(text('two')))] },
        paragraph(text('end')),
      ),
    ).toBe('intro\n\n- one\n- two\n\nend')
  })

  test('converts each mark', () => {
    expect(
      whatsApp(
        paragraph(
          text('bold', 'bold'),
          text(' '),
          text('italic', 'italic'),
          text(' '),
          text('strike', 'strike'),
          text(' '),
          text('code', 'code'),
          text(' '),
          text('under', 'underline'),
        ),
      ),
    ).toBe('*bold* _italic_ ~strike~ `code` under')
  })

  test('keeps spaces at the edges outside the marks', () => {
    expect(whatsApp(paragraph(text('a'), text(' bold ', 'bold'), text('b')))).toBe('a *bold* b')
  })

  test('neighboring pieces share one pair of symbols', () => {
    expect(whatsApp(paragraph(text('a ', 'bold'), text('b', 'bold', 'italic')))).toBe('*a _b_*')
  })

  test('headings become a bold line', () => {
    expect(whatsApp({ type: 'heading', attrs: { level: 2 }, content: [text('Section')] })).toBe('*Section*')
  })

  test('lists, numbered lists and checklists, with nested levels', () => {
    expect(
      whatsApp(
        {
          type: 'bulletList',
          content: [
            item(paragraph(text('one')), { type: 'bulletList', content: [item(paragraph(text('inner')))] }),
            item(paragraph(text('two'))),
          ],
        },
        { type: 'orderedList', attrs: { start: 1 }, content: [item(paragraph(text('first'))), item(paragraph(text('second')))] },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [paragraph(text('todo'))] },
            { type: 'taskItem', attrs: { checked: true }, content: [paragraph(text('done'))] },
          ],
        },
      ),
    ).toBe('- one\n  - inner\n- two\n\n1. first\n2. second\n\n☐ todo\n☑ done')
  })

  test('quotes, code blocks and dividers', () => {
    expect(
      whatsApp(
        { type: 'blockquote', content: [paragraph(text('quoted')), paragraph(text('more'))] },
        { type: 'codeBlock', content: [text('let a = 1\nlet b = 2')] },
        { type: 'horizontalRule' },
      ),
    ).toBe('> quoted\n> more\n\n```\nlet a = 1\nlet b = 2\n```\n\n———')
  })

  test('links show the address after the text, or only the address', () => {
    expect(whatsApp(paragraph(link('site', 'https://a.com')))).toBe('site (https://a.com)')
    expect(whatsApp(paragraph(link('https://a.com', 'https://a.com')))).toBe('https://a.com')
  })

  test('a line break inside a paragraph is a new line', () => {
    expect(whatsApp(paragraph(text('a'), { type: 'hardBreak' }, text('b')))).toBe('a\nb')
  })
})
