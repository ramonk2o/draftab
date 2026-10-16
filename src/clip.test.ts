// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { clipToNote, htmlToBlocks } from './clip'
import { textOf } from './notes'
import { useLanguage } from './i18n'

const BASE = 'https://example.com/blog/post'

const text = (blocks: JSONContent[]) => textOf({ type: 'doc', content: blocks })

// All marks in the blocks, in order
function marksOf(node: JSONContent): JSONContent[] {
  return [...(node.marks ?? []), ...(node.content ?? []).flatMap(marksOf)]
}

describe('htmlToBlocks', () => {
  test('content headings move down a level; h4-h6 become level 3', () => {
    const blocks = htmlToBlocks('<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h6>E</h6>', BASE)
    expect(blocks.map((b) => [b.type, b.attrs?.level])).toEqual([
      ['heading', 2], ['heading', 2], ['heading', 3], ['heading', 3], ['heading', 3],
    ])
    expect(text(blocks)).toBe('A\nB\nC\nD\nE')
  })

  test('keeps nested lists', () => {
    const [list] = htmlToBlocks('<ul><li>a<ul><li>b</li></ul></li></ul>', BASE)
    expect(list.type).toBe('bulletList')
    expect(list.content![0].content!.map((c) => c.type)).toEqual(['paragraph', 'bulletList'])
    expect(text([list])).toBe('a\nb')
  })

  test('keeps quotes, code blocks, dividers and ordered lists', () => {
    const blocks = htmlToBlocks('<blockquote><p>q</p></blockquote><pre><code>x = 1</code></pre><hr><ol><li>one</li></ol>', BASE)
    expect(blocks.map((b) => b.type)).toEqual(['blockquote', 'codeBlock', 'horizontalRule', 'orderedList'])
  })

  test('keeps bold, italic, strikethrough, underline and inline code', () => {
    const [p] = htmlToBlocks('<p><strong>b</strong> <em>i</em> <s>s</s> <u>u</u> <code>c</code></p>', BASE)
    expect(marksOf(p).map((m) => m.type)).toEqual(['bold', 'italic', 'strike', 'underline', 'code'])
  })

  test('links become absolute', () => {
    const [p] = htmlToBlocks('<p><a href="../other">x</a> <a href="#part">y</a></p>', BASE)
    expect(marksOf(p).map((m) => m.attrs?.href)).toEqual(['https://example.com/other', 'https://example.com/blog/post#part'])
  })

  test('drops links that are not http, https or mailto, keeping the text', () => {
    const [p] = htmlToBlocks('<p><a href="javascript:alert(1)">bad</a> <a href="mailto:a@b.c">mail</a> <a>anchor</a></p>', BASE)
    expect(text([p])).toBe('bad mail anchor')
    expect(marksOf(p).map((m) => m.attrs?.href)).toEqual(['mailto:a@b.c'])
  })

  test('drops images, media, iframes, scripts, styles and forms', () => {
    const html =
      '<p>a<img src="x.png" onerror="window.ran = true"></p><iframe src="https://x.com"></iframe>' +
      '<script>window.ran = true</script><style>p { color: red }</style><form><input value="v"><button>Send</button></form><p>b</p>'
    expect(text(htmlToBlocks(html, BASE))).toBe('a\nb')
    expect((window as unknown as { ran?: boolean }).ran).toBeUndefined()
  })

  test('a table becomes one paragraph per row', () => {
    const blocks = htmlToBlocks('<table><tr><th>Name</th><th>Age</th></tr><tr><td>Ana</td><td>30</td></tr></table>', BASE)
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph'])
    expect(text(blocks)).toBe('Name · Age\nAna · 30')
  })

  test('a table inside a table keeps its text once, with separators', () => {
    const html = '<table><tr><td>outer<table><tr><td>inner1</td><td>inner2</td></tr></table></td></tr></table>'
    expect(text(htmlToBlocks(html, BASE))).toBe('outer\ninner1 · inner2')
  })

  test('a table row whose cells hold paragraphs keeps the paragraphs', () => {
    const blocks = htmlToBlocks('<table><tr><td><p>a</p><p>b</p></td><td>c</td></tr></table>', BASE)
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph', 'paragraph'])
    expect(text(blocks)).toBe('a\nb\nc')
  })

  test('a heading inside a list item becomes a bold paragraph, with no empty item line', () => {
    const [list] = htmlToBlocks('<ul><li><h5>Question</h5>Answer</li></ul>', BASE)
    const item = list.content![0]
    expect(item.content!.map((c) => c.type)).toEqual(['paragraph', 'paragraph'])
    expect(text([list])).toBe('Question\nAnswer')
    expect(marksOf(item.content![0]).map((m) => m.type)).toEqual(['bold'])
  })

  test('drops empty paragraphs', () => {
    expect(htmlToBlocks('<p>a</p><p></p><p> </p><div></div><p>b</p>', BASE).map((b) => b.type)).toEqual(['paragraph', 'paragraph'])
  })
})

describe('clipToNote', () => {
  const clip = { title: '  My   page\n', url: 'https://example.com/post', html: '<p>Hello</p>' }

  test('title heading, link to the page, then the content', () => {
    const note = clipToNote(clip)!
    const [heading, link, body] = note.doc.content!
    expect(heading).toMatchObject({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'My page' }] })
    expect(link.content![0].text).toBe('https://example.com/post')
    expect(link.content![0].marks![0]).toMatchObject({ type: 'link', attrs: { href: 'https://example.com/post' } })
    expect(text([body])).toBe('Hello')
    expect(note.title).toBe('My page')
    expect(note.titleManual).toBe(false)
  })

  test('a selection\'s title starts with "Excerpt:", in the interface language', () => {
    expect(clipToNote({ ...clip, excerpt: true })!.title).toBe('Excerpt: My page')
    useLanguage('pt')
    expect(clipToNote({ ...clip, excerpt: true })!.title).toBe('Trecho: My page')
    useLanguage('en')
  })

  test('a selection on a page without a title: "Excerpt:" and the domain', () => {
    expect(clipToNote({ ...clip, title: '', excerpt: true })!.title).toBe('Excerpt: example.com')
  })

  test('a page without a title uses the domain', () => {
    expect(clipToNote({ ...clip, title: ' ' })!.title).toBe('example.com')
  })

  test('uses the new-note text size and font', () => {
    const note = clipToNote(clip, 120, 'serif')!
    expect([note.textSize, note.font]).toEqual([120, 'serif'])
  })

  test('a selection whose HTML has no text uses the plain text Chrome gave, one paragraph per line', () => {
    const note = clipToNote({ ...clip, html: '<form><textarea>typed</textarea></form>', text: 'first line\nsecond <b>line</b>' })!
    const [, , ...body] = note.doc.content!
    expect(body.map((b) => b.type)).toEqual(['paragraph', 'paragraph'])
    expect(text(body)).toBe('first line\nsecond <b>line</b>')
  })

  test('the plain text is only a fallback: HTML with text wins', () => {
    const note = clipToNote({ ...clip, html: '<p><strong>Rich</strong></p>', text: 'Rich' })!
    expect(marksOf(note.doc.content![2]).map((m) => m.type)).toEqual(['bold'])
  })

  test('null when the content has no text', () => {
    expect(clipToNote({ ...clip, html: '<p><img src="x.png"></p>' })).toBeNull()
    expect(clipToNote({ ...clip, html: '' })).toBeNull()
    expect(clipToNote({ ...clip, html: '', text: '  ' })).toBeNull()
  })
})
