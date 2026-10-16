import type { JSONContent } from '@tiptap/core'
import { DOMParser as SchemaParser } from '@tiptap/pm/model'
import { contentSchema } from './extensions'
import { newBlankNote, textOf, withUpdatedTitle, type Note, type NoteFont } from './notes'

// Saving web pages (see "Saving web pages" in SPEC.md): what the capture in the page
// hands to the new tab, and how it becomes a note.

export type ClipError = 'unavailable' | 'empty' // a page extensions can't run on / no main text
export type PageClip = { title: string; url: string; html: string }
export type Clip = PageClip | { error: ClipError }

// Elements whose content never goes into the note
const DROPPED =
  'script, style, noscript, template, img, picture, video, audio, iframe, object, embed, svg, canvas, math, form, button, input, select, textarea'

// A new note: the page title, a link to the page, then the content.
// null when the content has no text (e.g. a selection with only an image).
// textSize and font: the "Text size of new notes" and "Font of new notes" settings
export function clipToNote(clip: PageClip, textSize = 100, font: NoteFont = 'sans'): Note | null {
  const content = htmlToBlocks(clip.html, clip.url)
  if (textOf({ type: 'doc', content }).trim() === '') return null

  const title = clip.title.replace(/\s+/g, ' ').trim() || domainOf(clip.url)
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

  // The page title is the note's only level 1: h1/h2 → level 2, h3-h6 → level 3
  for (const old of body.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const heading = page.createElement(Number(old.tagName[1]) <= 2 ? 'h2' : 'h3')
    heading.append(...old.childNodes)
    old.replaceWith(heading)
  }

  // A table becomes one paragraph per row, cells separated by " · "
  for (const table of body.querySelectorAll('table')) {
    const rows = [...table.querySelectorAll('tr')].map((row) => {
      const cells = [...row.children].filter((cell) => cell.tagName === 'TD' || cell.tagName === 'TH')
      const paragraph = page.createElement('p')
      paragraph.textContent = cells.map((cell) => cell.textContent?.trim()).filter(Boolean).join(' · ')
      return paragraph
    })
    table.replaceWith(...rows)
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
