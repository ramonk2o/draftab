import { Extension, markInputRule, markPasteRule } from '@tiptap/core'

// "++text++" becomes underlined, while typing and when pasting.
// Tiptap's underline only has Cmd/Ctrl+U, but it already writes and reads "++" in markdown.
// The text inside can't start or end with a space, so "1 ++ 2 ++" stays as it is.
export const underlineInputRegex = /(?:^|\s)(\+\+([^+\s](?:[^+]*[^+\s])?)\+\+)$/
export const underlinePasteRegex = /(?:^|\s)(\+\+([^+\s](?:[^+]*[^+\s])?)\+\+)/g

export const UnderlineShortcut = Extension.create({
  name: 'underlineShortcut',
  addInputRules() {
    return [markInputRule({ find: underlineInputRegex, type: this.editor.schema.marks.underline })]
  },
  addPasteRules() {
    return [markPasteRule({ find: underlinePasteRegex, type: this.editor.schema.marks.underline })]
  },
})
