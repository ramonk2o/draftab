import type { JSONContent } from '@tiptap/core'
import { DOMParser as SchemaParser } from '@tiptap/pm/model'
import { contentSchema } from './extensions'
import { newBlankNote, textOf, withUpdatedTitle, type Note, type NoteFont } from './notes'
import { t } from './i18n'
import { isWebAddress } from './images'

// Saving web pages (see "Saving web pages" in SPEC.md): what the capture in the page
// hands to the new tab, and how it becomes a note.

// A captured page or selection.
// text: the plain selected text Chrome gives with a right-click, used when the HTML has no
// text (text fields, frames from other sites, the PDF viewer). excerpt: it's a selection.
export type PageClip = { title: string; url: string; html: string; text?: string; excerpt?: boolean }

// Why nothing could be captured: a page extensions can't run on / no main text
export type ClipError = 'unavailable' | 'empty'

// Elements whose content never goes into the note
const DROPPED =
  'script, style, noscript, template, source, video, audio, iframe, object, embed, svg, canvas, math, form, button, input, select, textarea'

// Elements that are blocks in a note
const BLOCKS = 'p, ul, ol, blockquote, pre, hr, h2, h3'

// A new note: the page title, a link to the page, then the content.
// null when the content has no text (e.g. a selection with only an image).
// textSize and font: the "Text size of new notes" and "Font of new notes" settings
export function clipToNote(clip: PageClip, textSize = 100, font: NoteFont = 'sans'): Note | null {
  let content = htmlToBlocks(clip.html, clip.url)
  if (!hasText(content)) content = plainTextBlocks(clip.text ?? '')
  if (!hasText(content)) return null

  const pageTitle = clip.title.replace(/\s+/g, ' ').trim() || domainOf(clip.url)
  const title = clip.excerpt ? t('excerptTitle', { title: pageTitle }) : pageTitle
  const doc: JSONContent = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title }] },
      { type: 'paragraph', content: [{ type: 'text', text: clip.url, marks: [{ type: 'link', attrs: { href: clip.url } }] }] },
      ...content,
    ],
  }
  return withUpdatedTitle({ ...newBlankNote(textSize, font), doc })
}

// Draftab blocks for a piece of HTML. baseUrl: the page's address, for relative links.
export function htmlToBlocks(html: string, baseUrl: string): JSONContent[] {
  // DOMParser makes an inert document: no script runs and nothing (images…) loads
  const page = new DOMParser().parseFromString(html, 'text/html')
  const body = page.body

  for (const el of body.querySelectorAll(DROPPED)) el.remove()

  // The page title is the note's only level 1: h1/h2 → level 2, h3-h6 → level 3.
  // In a list item a heading becomes a bold paragraph (an item must start with a paragraph).
  for (const old of body.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    let heading: HTMLElement
    if (old.closest('li')) {
      const bold = page.createElement('strong')
      bold.append(...old.childNodes)
      heading = page.createElement('p')
      heading.append(bold)
    } else {
      heading = page.createElement(Number(old.tagName[1]) <= 2 ? 'h2' : 'h3')
      heading.append(...old.childNodes)
    }
    old.replaceWith(heading)
  }

  // Tables, innermost first (the list is in document order, so inner tables come after
  // the ones around them). A row of plain cells becomes one paragraph, cells separated by
  // " · "; a row whose cells hold blocks (paragraphs, lists… or a table already turned into
  // paragraphs) keeps those blocks, so no text is repeated.
  for (const table of [...body.querySelectorAll('table')].reverse()) {
    const rows = [...table.querySelectorAll('tr')].flatMap((row) => {
      const cells = [...row.children].filter((cell) => cell.tagName === 'TD' || cell.tagName === 'TH')
      if (cells.some((cell) => cell.querySelector(BLOCKS))) return cells.flatMap((cell) => [...cell.childNodes])
      const paragraph = page.createElement('p')
      paragraph.textContent = cells.map((cell) => cell.textContent?.trim()).filter(Boolean).join(' · ')
      return [paragraph]
    })
    table.replaceWith(...rows)
  }

  // Images: absolute web addresses; without an address, data: or declared tiny (icons, tracking pixels) are dropped
  for (const img of body.querySelectorAll('img')) {
    const src = absoluteUrl(img.getAttribute('src'), baseUrl)
    if (isWebAddress(src) && !isTiny(img)) img.setAttribute('src', src)
    else img.remove()
  }

  // Links: absolute addresses, only http, https and mailto; others keep just their text
  for (const link of body.querySelectorAll('a')) {
    const href = absoluteUrl(link.getAttribute('href'), baseUrl)
    if (href && /^(https?|mailto):/i.test(href)) link.setAttribute('href', href)
    else link.replaceWith(...link.childNodes)
  }

  // The editor's schema keeps only Draftab blocks and marks
  const doc = SchemaParser.fromSchema(contentSchema()).parse(body).toJSON() as JSONContent
  return (doc.content ?? []).filter((block) => !(block.type === 'paragraph' && textOf(block).trim() === ''))
}

function hasText(blocks: JSONContent[]): boolean {
  return textOf({ type: 'doc', content: blocks }).trim() !== ''
}

// Width or height declared under 50px
function isTiny(img: Element): boolean {
  return [img.getAttribute('width'), img.getAttribute('height')].some((size) => size !== null && parseFloat(size) < 50)
}

// One paragraph per line with text
function plainTextBlocks(text: string): JSONContent[] {
  return text
    .split(/\r\n?|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] }))
}

function absoluteUrl(href: string | null, baseUrl: string): string | null {
  if (href === null) return null
  try {
    return new URL(href, baseUrl).href
  } catch {
    return null
  }
}

// "example.com" for https://example.com/post; the address itself when it has no domain
function domainOf(url: string): string {
  try {
    return new URL(url).hostname || url
  } catch {
    return url
  }
}
