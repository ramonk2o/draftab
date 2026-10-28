import { Editor, Extension, InputRule } from '@tiptap/core'
import DragHandle from '@tiptap/extension-drag-handle'
import { Reorder, endDrag, startDrag } from './reorder'
import { ListHandle } from './list-handle'
import { contentExtensions } from './extensions'
import { selectAndCopyBlock } from './copy-block'
import { UnwrapBlock } from './unwrap-block'
import { Tags } from './tags'
import { ColorSwatches } from './colors'
import { Calculations } from './calculate'
import { UnderlineShortcut } from './underline-shortcut'
import { plainTextOf } from './images'
import { ImagePaste } from './image-paste'
import { MarkdownPaste } from './markdown-paste'
import { HighlightBar } from './highlight-bar'
import { t } from './i18n'

// Handle icon: six dots in two columns
const HANDLE_ICON = `
<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
  <circle cx="2" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" />
  <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
  <circle cx="2" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
</svg>`

const handle = createHandle()

function createHandle(): HTMLElement {
  const handle = document.createElement('div')
  handle.className = 'drag-handle'
  handle.title = t('dragToMove')
  handle.innerHTML = HANDLE_ICON
  // Hidden until the mouse is over a block (DragHandle shows it); otherwise it sits in
  // the editor's corner when the page opens with the mouse elsewhere
  handle.style.visibility = 'hidden'
  return handle
}

// Block currently under the mouse (the handle is positioned relative to it) and its position
let handleBlock: HTMLElement | null = null
let handlePos: number | null = null

// Rectangle of the block's first line: the handle is centered on it.
// Without this the handle aligns to the top and looks off on headings and dividers.
function blockFirstLine(block: HTMLElement): DOMRect {
  const box = block.getBoundingClientRect()
  const text = block.matches('p, h1, h2, h3, pre') ? block : block.querySelector<HTMLElement>('p, h1, h2, h3, pre')
  // Image: the handle sits next to its top, not the middle of a tall picture
  if (block.matches('.image-block')) return new DOMRect(box.left, box.top, box.width, 24)
  if (!text) return box // divider: center on the line itself

  const style = getComputedStyle(text)
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
  const top = text.getBoundingClientRect().top + parseFloat(style.paddingTop)
  return new DOMRect(box.left, top, box.width, lineHeight)
}

// "- [ ] " becomes a checklist. Tiptap only recognizes "[ ] " outside lists;
// here "- " has already created a list item, so we swap the list for a checklist.
const ChecklistInsideList = Extension.create({
  name: 'checklistInsideList',
  addInputRules() {
    return [
      new InputRule({
        find: /^\s*\[([ x])?\]\s$/,
        handler: ({ state, range, match, chain }) => {
          const paragraphParent = state.doc.resolve(range.from).node(-1)
          if (paragraphParent.type.name !== 'listItem') return null
          chain()
            .deleteRange(range)
            .toggleTaskList()
            .updateAttributes('taskItem', { checked: match[1] === 'x' })
            .run()
        },
      }),
    ]
  },
})

// Cmd/Ctrl + click on a link opens the address in a new tab
function openLinkWithModifier(event: MouseEvent) {
  if (!event.metaKey && !event.ctrlKey) return
  const link = (event.target as HTMLElement).closest('a')
  if (!link) return
  let url = link.getAttribute('href') ?? ''
  if (!url) return
  // Without a protocol ("google.com"), Chrome would open a file inside the extension
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    url = 'https://' + url
  }
  event.preventDefault()
  window.open(url, '_blank', 'noopener')
}

// Creates the editor with every MVP block and the drag handle.
// onTagClick: Cmd/Ctrl+click on a tag (e.g. "#idea")
export function createEditor(element: HTMLElement, onTagClick: (tag: string) => void): Editor {
  element.addEventListener('click', openLinkWithModifier)

  const editor = new Editor({
    element,
    autofocus: true,
    editorProps: {
      // Plain-text copies put one line per block (by default ProseMirror separates blocks
      // with a blank line, which turns a copied list into "item, blank, blank, item");
      // an image becomes its ![description](url)
      clipboardTextSerializer: (slice) => plainTextOf(slice.content),
    },
    extensions: [
      ...contentExtensions,
      ChecklistInsideList,
      UnderlineShortcut,
      ImagePaste,
      MarkdownPaste,
      HighlightBar,
      UnwrapBlock,
      Tags.configure({ onTagClick }),
      ColorSwatches,
      Calculations,
      Reorder,
      ListHandle,
      DragHandle.configure({
        render: () => handle,
        onElementDragStart: startDrag,
        onElementDragEnd: endDrag,
        // On list items the handle moves further left, before the marker
        onNodeChange: (data) => {
          handle.classList.toggle('in-list', data.node?.type.name === 'listItem')
          // pos exists at runtime, but is missing from the extension's types
          const { pos } = data as { pos?: number }
          const el = pos !== undefined && pos >= 0 ? data.editor.view.nodeDOM(pos) : null
          handleBlock = el instanceof HTMLElement ? el : null
          handlePos = pos !== undefined && pos >= 0 ? pos : null
        },
        // Handle on the left, centered on the block's first line
        computePositionConfig: { placement: 'left', strategy: 'absolute' },
        getReferencedVirtualElement: () => {
          const block = handleBlock
          return block ? { getBoundingClientRect: () => blockFirstLine(block) } : null
        },
        // List items get their own handle too
        nested: {
          // Without this, the handle disappears when the mouse is over the top part of a list item
          edgeDetection: 'none',
          rules: [
            {
              // Inside a quote, the handle moves the whole quote
              id: 'wholeQuote',
              evaluate: ({ parent }) => (parent?.type.name === 'blockquote' ? 1000 : 0),
            },
          ],
        },
      }),
    ],
  })

  // Double-clicking the handle selects the block's content and copies it
  handle.addEventListener('dblclick', () => {
    if (handlePos !== null) selectAndCopyBlock(editor.view, handlePos, handle)
  })

  return editor
}
