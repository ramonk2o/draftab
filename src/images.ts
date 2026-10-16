import type { Fragment, Node as PMNode } from '@tiptap/pm/model'
import { InputRule } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'

// Image blocks (see "Images" in SPEC.md): the note stores only the picture's web address

// An http/https address (images with data:, relative or other addresses aren't kept)
export function isWebAddress(src: unknown): src is string {
  return typeof src === 'string' && /^https?:\/\/\S+$/i.test(src)
}

type ImageAttrs = { src?: string | null; alt?: string | null; title?: string | null }

// ![description](address "title"): how an image is written in markdown and in plain-text copies
export function imageMarkdown(attrs: ImageAttrs): string {
  const title = attrs.title ? ` "${attrs.title}"` : ''
  return `![${attrs.alt ?? ''}](${attrs.src ?? ''}${title})`
}

// Plain text of copied content: one line per block, a line break as a new line,
// an image as its markdown
export function plainTextOf(fragment: Fragment): string {
  return fragment.textBetween(0, fragment.size, '\n', (leaf: PMNode) => {
    if (leaf.type.name === 'image') return imageMarkdown(leaf.attrs)
    if (leaf.type.name === 'hardBreak') return '\n'
    return ''
  })
}

export const DraftabImage = Image.extend({
  // Only the address, description and title: the picture shows at its natural size
  addAttributes() {
    return { src: { default: null }, alt: { default: null }, title: { default: null } }
  },

  // An <img> (pasted HTML, saved pages) becomes an image only with a web address
  parseHTML() {
    return [{ tag: 'img[src]', getAttrs: (el) => (isWebAddress((el as HTMLElement).getAttribute('src')) ? null : false) }]
  },

  // ![description](url) typed in the note: only with a web address
  addInputRules() {
    return (this.parent?.() ?? []).map(
      (rule) => new InputRule({ find: rule.find, handler: (props) => (isWebAddress(props.match[3]) ? rule.handler(props) : null) }),
    )
  },

  renderMarkdown: (node) => imageMarkdown(node.attrs ?? {}),

  // The picture, or its address in a box when it can't load (gone from the site, no internet)
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.className = 'image-block'
      const img = document.createElement('img')
      img.draggable = false // blocks move with the handle
      img.src = node.attrs.src
      if (node.attrs.alt) img.alt = node.attrs.alt
      if (node.attrs.title) img.title = node.attrs.title
      img.addEventListener('error', () => {
        const box = document.createElement('div')
        box.className = 'image-broken'
        box.textContent = node.attrs.src
        img.replaceWith(box)
      })
      dom.append(img)
      return { dom }
    }
  },
})
