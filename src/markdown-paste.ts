import { Extension, type JSONContent } from '@tiptap/core'
import { Slice } from '@tiptap/pm/model'
import { Plugin, type EditorState, type Transaction } from '@tiptap/pm/state'
import { markdownDoc } from './markdown'

// What the clipboard brings: its plain text, its HTML and the types it has
export type Clipboard = { text: string; html: string; types: readonly string[] }

// Pasting plain text reads it as markdown (see "Pasting markdown" in SPEC.md).
// shift: Cmd/Ctrl+Shift+V, which pastes the raw text.
// null = paste normally (the copy brought HTML, or the markdown couldn't be read)
export function pasteMarkdown(state: EditorState, clipboard: Clipboard, shift: boolean): Transaction | null {
  const text = clipboard.text.replace(/\r\n?/g, '\n') // Windows and old Mac line breaks
  // VS Code copies come with colored HTML of the plain text: they're read as plain text
  const fromVSCode = clipboard.types.includes('vscode-editor-data')
  if (!text || (clipboard.html && !fromVSCode && !shift)) return null

  if (state.selection.$from.parent.type.spec.code) {
    return state.tr.insertText(text).scrollIntoView()
  }

  const doc = shift ? rawLinesDoc(text) : markdownDoc(text)
  if (!doc) return null
  // Several blank lines in a row leave an empty paragraph in the markdown: blank lines vanish
  const blocks = (doc.content ?? []).filter((block) => block.type !== 'paragraph' || block.content?.length)
  // A lone "-" or "#" is an empty item or heading in markdown: pasted as plain text instead
  if (!blocks.some(hasContent)) return null
  const content = state.schema.nodeFromJSON({ ...doc, content: inCursorList(state, blocks) }).content
  // Open on both sides: the first block joins the cursor's line, the rest of the line goes after the last one
  const tr = state.tr.replaceSelection(Slice.maxOpen(content)).scrollIntoView()
  // Marked as a paste, so the paste rules (links, ~~, ++) still apply; not the raw paste
  if (!shift) tr.setMeta('paste', true).setMeta('uiEvent', 'paste')
  return tr
}

// With the cursor in a list item, each pasted line becomes a new item of that list, as with Enter:
// a heading becomes plain text, and pasted list items take the cursor's list type
function inCursorList(state: EditorState, blocks: JSONContent[]): JSONContent[] {
  const { $from } = state.selection
  const item = $from.depth >= 2 ? $from.node($from.depth - 1) : null
  if (item?.type.name !== 'listItem' && item?.type.name !== 'taskItem') return blocks
  const listType = $from.node($from.depth - 2).type.name
  const toItem = (pasted: JSONContent): JSONContent =>
    item.type.name === 'taskItem'
      ? { type: 'taskItem', attrs: { checked: pasted.attrs?.checked ?? false }, content: pasted.content }
      : { type: 'listItem', content: pasted.content }

  const result: JSONContent[] = []
  for (const block of blocks) {
    let items: JSONContent[]
    if (block.type === 'paragraph' || block.type === 'heading') {
      items = [toItem({ content: [{ type: 'paragraph', content: block.content }] })]
    } else if (block.type === 'bulletList' || block.type === 'orderedList' || block.type === 'taskList') {
      items = (block.content ?? []).map(toItem)
    } else {
      result.push(block)
      continue
    }
    // Consecutive items go in the same list
    const last = result[result.length - 1]
    if (last?.type === listType) last.content?.push(...items)
    else result.push({ type: listType, content: items })
  }
  return result
}

// Whether a pasted block has something in it: text, an image or a divider
function hasContent(block: JSONContent): boolean {
  if (block.type === 'image' || block.type === 'horizontalRule') return true
  return Boolean(block.text) || (block.content ?? []).some(hasContent)
}

// One paragraph per line, symbols untouched; blank lines vanish (like the editor's own plain-text paste)
function rawLinesDoc(text: string): JSONContent {
  const lines = text.split('\n').filter((line) => line)
  return { type: 'doc', content: lines.map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })) }
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',
  addProseMirrorPlugins() {
    // Whether Shift is down at paste time, as ProseMirror itself tracks it (Shift+Insert is a normal paste)
    let shift = false
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            keydown: (_view, event) => {
              shift = event.shiftKey && event.key !== 'Insert'
              return false
            },
            keyup: (_view, event) => {
              if (event.key === 'Shift') shift = false
              return false
            },
          },
          handlePaste: (view, event) => {
            const data = event.clipboardData
            if (!data) return false
            const clipboard = { text: data.getData('text/plain'), html: data.getData('text/html'), types: data.types }
            const tr = pasteMarkdown(view.state, clipboard, shift)
            if (!tr) return false
            view.dispatch(tr)
            return true
          },
        },
      }),
    ]
  },
})
