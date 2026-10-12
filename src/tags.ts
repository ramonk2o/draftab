import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Tags: "#" + a letter, then letters, digits, "_" or "-", at the start or after a space.
// They stay plain text in the note; the editor only shows them differently
// (a "decoration", which isn't saved) and Cmd/Ctrl+click searches for them.

const TAG = /(?<=^|\s)#\p{L}[\p{L}\p{N}_-]*/gu

// Where the tags are in a piece of text: start and end of each one
export function findTags(text: string): { from: number; to: number; tag: string }[] {
  return [...text.matchAll(TAG)].map((match) => ({
    from: match.index,
    to: match.index + match[0].length,
    tag: match[0],
  }))
}

// Marks every tag in the document with the "tag" class
export function tagDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = []
  const code = doc.type.schema.marks.code
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    if (node.type.spec.code) return false // code block
    // One character per inline node (a line break counts as a space), so the
    // positions in the text match the positions in the document
    const text = node.textBetween(0, node.content.size, undefined, ' ')
    for (const { from, to, tag } of findTags(text)) {
      const start = pos + 1 + from
      const end = pos + 1 + to
      if (code && doc.rangeHasMark(start, end, code)) continue // inline code
      decorations.push(Decoration.inline(start, end, { class: 'tag' }, { tag }))
    }
    return false
  })
  return DecorationSet.create(doc, decorations)
}

export const Tags = Extension.create<{ onTagClick: (tag: string) => void }>({
  name: 'tags',
  addOptions() {
    return { onTagClick: () => {} }
  },
  addProseMirrorPlugins() {
    const { onTagClick } = this.options
    return [
      new Plugin({
        state: {
          init: (_, state) => tagDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? tagDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
          // Cmd/Ctrl+click searches for the tag; a plain click just places the cursor
          handleClick(view, pos, event) {
            if (!event.metaKey && !event.ctrlKey) return false
            if (event.target instanceof HTMLElement && event.target.closest('a')) return false // a link opens instead
            const [found] = this.getState(view.state)?.find(pos, pos) ?? []
            if (!found) return false
            onTagClick(found.spec.tag)
            return true
          },
        },
      }),
    ]
  },
})
