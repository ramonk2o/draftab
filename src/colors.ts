import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Color swatches: color codes in the note (#3a7bd5, rgb(…), rgba(…)) show a small
// sample of the color just before them. Like tags, it's only a "decoration":
// nothing changes in the stored note, exports or copies.

// The code can't be glued to a letter, digit, "_" or "-" on either side
const HEX = /(?<![\p{L}\p{N}_-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\p{L}\p{N}_-])/giu
// rgb(r, g, b) / rgb(r g b), with an optional alpha after "," or "/"
const RGB = /(?<![\p{L}\p{N}_-])rgba?\(\s*([\d.]+%?)(?:\s*,\s*|\s+)([\d.]+%?)(?:\s*,\s*|\s+)([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)/giu

const NUMBER = /^(\d+(\.\d*)?|\.\d+)%?$/

// A number with an optional "%", up to max (or up to 100%)
function inRange(value: string, max: number): boolean {
  if (!NUMBER.test(value)) return false
  const number = parseFloat(value)
  return value.endsWith('%') ? number <= 100 : number <= max
}

// Where the color codes are in a piece of text: start and end of each one, in text order
export function findColors(text: string): { from: number; to: number; color: string }[] {
  const found = [...text.matchAll(HEX)]
  for (const match of text.matchAll(RGB)) {
    const [, r, g, b, alpha] = match
    const channelsOk = [r, g, b].every((value) => inRange(value, 255))
    if (channelsOk && (alpha === undefined || inRange(alpha, 1))) found.push(match)
  }
  return found
    .map((match) => ({ from: match.index, to: match.index + match[0].length, color: match[0] }))
    .sort((a, b) => a.from - b.from)
}

// The small square shown before the code
function swatch(color: string): HTMLElement {
  const el = document.createElement('span')
  el.className = 'color-swatch'
  el.contentEditable = 'false'
  el.style.setProperty('--swatch', color)
  return el
}

// A swatch before every color code in the document (code included)
export function colorDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    // One character per inline node (a line break counts as a space), so the
    // positions in the text match the positions in the document
    const text = node.textBetween(0, node.content.size, undefined, ' ')
    for (const { from, color } of findColors(text)) {
      decorations.push(Decoration.widget(pos + 1 + from, () => swatch(color), { side: -1, key: color, color }))
    }
    return false
  })
  return DecorationSet.create(doc, decorations)
}

export const ColorSwatches = Extension.create({
  name: 'colorSwatches',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init: (_, state) => colorDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? colorDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})
