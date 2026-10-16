import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

// Background colors for blocks (see "Block background colors" in SPEC.md).
// The note stores only the color's name; the shades for each theme are in newtab.css.

export const BLOCK_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue'] as const
export type BlockColor = (typeof BLOCK_COLORS)[number]

// Blocks that can get a color (images and dividers can't)
const COLORED_TYPES = ['paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem', 'taskItem', 'bulletList', 'orderedList', 'taskList']

export function isBlockColor(value: unknown): value is BlockColor {
  return BLOCK_COLORS.includes(value as BlockColor)
}

export function canBeColored(node: Node): boolean {
  return COLORED_TYPES.includes(node.type.name)
}

// Adds the `color` attribute, shown in the page as data-color="yellow"
export const BlockColors = Extension.create({
  name: 'blockColors',
  addGlobalAttributes() {
    return [
      {
        types: COLORED_TYPES,
        attributes: {
          color: {
            default: null,
            // Enter on a colored block starts a block without color
            keepOnSplit: false,
            // Only names from the palette: anything else (e.g. from a saved page) is no color
            parseHTML: (element) => {
              const color = element.getAttribute('data-color')
              return isBlockColor(color) ? color : null
            },
            renderHTML: (attributes) => (isBlockColor(attributes.color) ? { 'data-color': attributes.color } : {}),
          },
        },
      },
    ]
  },
})

// Sets (or removes, with null) the color of the block at `pos`
export function setBlockColor(tr: Transaction, pos: number, color: BlockColor | null): Transaction {
  return tr.setNodeAttribute(pos, 'color', color)
}
