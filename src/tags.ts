import { Extension, type JSONContent } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Note } from './notes'

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

// The tags in a note's content (Tiptap JSON), with the same rules as the editor:
// none inside code (inline or block)
export function tagsOf(node: JSONContent): string[] {
  if (node.type === 'codeBlock') return []
  const children = node.content ?? []
  const isTextBlock = children.some((c) => c.type === 'text' || c.type === 'hardBreak')
  if (!isTextBlock) return children.flatMap(tagsOf)
  // Inline code becomes spaces, so it neither counts nor joins the text around it
  const text = children
    .map((c) => {
      if (c.type !== 'text') return ' '
      const isCode = c.marks?.some((mark) => mark.type === 'code')
      return isCode ? ' '.repeat(c.text?.length ?? 0) : (c.text ?? '')
    })
    .join('')
  return findTags(text).map((t) => t.tag)
}

// Tags that differ only in case or accents are the same tag
function tagKey(tag: string): string {
  return tag.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Tags for the search's suggestion list: the ones that start with typed (e.g. "#pr"),
// most used first (number of notes), ties A–Z, up to 8. The tag that's exactly
// what was typed isn't suggested.
export function tagSuggestions(notes: Note[], typed: string): { tag: string; count: number }[] {
  const found = new Map<string, { tag: string; count: number }>()
  for (const note of notes) {
    const keys = new Set<string>() // each note counts once per tag
    for (const tag of tagsOf(note.doc)) {
      const key = tagKey(tag)
      if (keys.has(key)) continue
      keys.add(key)
      const entry = found.get(key)
      if (entry) entry.count++
      else found.set(key, { tag, count: 1 })
    }
  }
  const start = tagKey(typed)
  return [...found.entries()]
    .filter(([key]) => key.startsWith(start) && key !== start)
    .map(([, entry]) => entry)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, undefined, { sensitivity: 'base', numeric: true }))
    .slice(0, 8)
}

// The word at the cursor in the search (between spaces) and where it is
export function wordAt(text: string, cursor: number): { word: string; start: number; end: number } {
  const start = text.slice(0, cursor).search(/\S*$/)
  const after = text.slice(cursor).search(/\s|$/)
  const end = cursor + after
  return { word: text.slice(start, end), start, end }
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
