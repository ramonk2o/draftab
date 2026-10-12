import { Extension } from '@tiptap/core'
import { closeHistory } from '@tiptap/pm/history'
import { TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state'
import { liftTarget } from '@tiptap/pm/transform'

// Backspace at the start of a heading, a code block or a quote turns it back into normal text.
// Returns null when the rule doesn't apply (Backspace then works as usual).
export function unwrapBlockAtStart(state: EditorState): Transaction | null {
  const { selection, schema } = state
  if (!selection.empty) return null
  const $from = selection.$from
  if ($from.parentOffset !== 0) return null

  const block = $from.parent

  // Heading: becomes a paragraph with the same text and marks
  if (block.type.name === 'heading') {
    return state.tr.setBlockType($from.pos, $from.pos, schema.nodes.paragraph)
  }

  // Code block: one paragraph per line (an empty code block is left to Tiptap)
  if (block.type.name === 'codeBlock') {
    if (block.textContent === '') return null
    const paragraphs = block.textContent
      .split('\n')
      .map((line) => schema.nodes.paragraph.create(null, line ? schema.text(line) : undefined))
    const start = $from.before()
    const tr = state.tr.replaceWith(start, $from.after(), paragraphs)
    return tr.setSelection(TextSelection.create(tr.doc, start + 1))
  }

  // Quote: only at the start of its first paragraph, and the whole quote is undone.
  // In later paragraphs Tiptap already takes that paragraph out of the quote.
  const quoteDepth = $from.depth - 1
  if (quoteDepth < 1) return null
  const quote = $from.node(quoteDepth)
  if (quote.type.name !== 'blockquote' || $from.index(quoteDepth) !== 0) return null
  const quoteStart = $from.before(quoteDepth)
  const $start = state.doc.resolve(quoteStart + 1)
  const $end = state.doc.resolve(quoteStart + quote.nodeSize - 1)
  const range = $start.blockRange($end)
  const target = range && liftTarget(range)
  if (!range || target === null || target === undefined) return null
  return state.tr.lift(range, target)
}

export const UnwrapBlock = Extension.create({
  name: 'unwrapBlock',
  // Runs before the heading's, the code block's and the quote's own Backspace
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        // Right after a markdown shortcut, Backspace gives back the typed text
        if (editor.commands.undoInputRule()) return true
        const tr = unwrapBlockAtStart(editor.state)
        if (!tr) return false
        // Its own undo step: Cmd/Ctrl+Z undoes only this, not what was typed just before
        editor.view.dispatch(closeHistory(tr).scrollIntoView())
        return true
      },
    }
  },
})
