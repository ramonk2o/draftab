import { Mark } from '@tiptap/core'
import type { EditorState, Transaction } from '@tiptap/pm/state'

// Highlight: a background color on selected text (see "Highlight" in SPEC.md).
// The note stores only the color's name; the shades for each theme are in newtab.css.
// In the page it's <span data-highlight="yellow">: not <mark>, which other apps would
// show highlighted in formatted copies (the highlight only exists in Draftab).

export const HIGHLIGHT_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue'] as const
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

export function isHighlightColor(value: unknown): value is HighlightColor {
  return HIGHLIGHT_COLORS.includes(value as HighlightColor)
}

// Color used by Cmd/Ctrl+Shift+H: the last one picked in the bar (only while the tab is open)
let lastColor: HighlightColor = 'yellow'

export function rememberHighlightColor(color: HighlightColor) {
  lastColor = color
}

export const Highlight = Mark.create({
  name: 'highlight',
  // Typing right after highlighted text isn't highlighted
  inclusive: false,

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-highlight'),
        renderHTML: (attributes) => ({ 'data-highlight': attributes.color }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-highlight]',
        // Only colors from the palette: anything else is plain text
        getAttrs: (element) => (isHighlightColor(element.getAttribute('data-highlight')) ? null : false),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addKeyboardShortcuts() {
    return {
      // The last color; when all of the selection already has it, removes it
      'Mod-Shift-h': ({ editor }) => {
        const { state } = editor
        if (!canHighlight(state)) return false
        const tr = applyHighlight(state, selectionHighlight(state) === lastColor ? null : lastColor)
        if (tr) editor.view.dispatch(tr)
        return true
      },
    }
  },
})

// Highlights the selection with `color` (null removes the highlight). Null when there's no selection.
export function applyHighlight(state: EditorState, color: HighlightColor | null): Transaction | null {
  const { from, to, empty } = state.selection
  const type = state.schema.marks.highlight
  if (empty || !type) return null
  const tr = state.tr.removeMark(from, to, type)
  return color ? tr.addMark(from, to, type.create({ color })) : tr
}

// The color of the selected text when all of it has the same one; null otherwise
export function selectionHighlight(state: EditorState): HighlightColor | null {
  const { from, to } = state.selection
  const colors = new Set<unknown>()
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    colors.add(node.marks.find((mark) => mark.type.name === 'highlight')?.attrs.color ?? null)
  })
  const [color] = colors
  return colors.size === 1 && isHighlightColor(color) ? color : null
}

// The selection has text that can be highlighted (not code, inline or block)
export function canHighlight(state: EditorState): boolean {
  const { from, to, empty } = state.selection
  const type = state.schema.marks.highlight
  if (empty || !type) return false
  let found = false
  state.doc.nodesBetween(from, to, (node, _pos, parent) => {
    if (found || !node.isText || !parent?.type.allowsMarkType(type)) return
    // Inline code doesn't take other marks
    found = type.isInSet(node.marks) !== undefined || node.marks.every((mark) => !mark.type.excludes(type))
  })
  return found
}
