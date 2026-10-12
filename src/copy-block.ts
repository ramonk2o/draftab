import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

// Double-clicking a handle: selects the block's content and copies it to the clipboard

// Selects the content of the block at `pos` and copies it exactly like Cmd/Ctrl+C would
export function selectAndCopyBlock(view: EditorView, pos: number, handle: HTMLElement) {
  const { doc } = view.state
  const node = doc.nodeAt(pos)
  if (!node) return

  // Blocks without text (a divider, an empty line) are selected whole; otherwise the
  // selection goes from the first to the last character inside the block
  const selection =
    node.isLeaf || node.textContent === ''
      ? NodeSelection.create(doc, pos)
      : TextSelection.between(doc.resolve(pos + 1), doc.resolve(pos + node.nodeSize - 1))

  view.focus()
  view.dispatch(view.state.tr.setSelection(selection))
  // ProseMirror fills the clipboard (formatted + plain text) the same way as on Cmd/Ctrl+C
  if (document.execCommand('copy')) showCopied(handle)
}

// Small "Copied" label above the element (or below it), fading out
export function showCopied(element: HTMLElement, below = false) {
  showLabel(element, 'Copied', below)
}

// Small label with any text (e.g. a font's name), the same way
export function showLabel(element: HTMLElement, text: string, below = false) {
  // Clicking again quickly replaces the label instead of stacking another one
  document.querySelectorAll('.copied-label').forEach((old) => old.remove())
  const box = element.getBoundingClientRect()
  const label = document.createElement('div')
  label.className = below ? 'copied-label below' : 'copied-label'
  label.textContent = text
  label.style.left = `${box.left + box.width / 2}px`
  label.style.top = `${below ? box.bottom : box.top}px`
  document.body.appendChild(label)
  label.addEventListener('animationend', () => label.remove())
}
