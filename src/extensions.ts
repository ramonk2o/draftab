import { getSchema } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { DraftabImage } from './images'

// Extensions that define note content (blocks and marks).
// Used by the editor and by the backup's markdown conversion.
export const contentExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    // Blue line showing where the dragged block will land
    // (hidden while reordering with the handle, which has its own animation)
    dropcursor: { color: '#2563eb', width: 2, class: 'drop-cursor' },
    link: {
      // Clicking edits the text; Cmd/Ctrl + click opens the link
      openOnClick: false,
      defaultProtocol: 'https',
      // Typing [text](url) becomes a link
      markdownLinks: true,
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  DraftabImage,
]

// The schema of these blocks, to check a document without an editor (created once, when first needed)
let schema: ReturnType<typeof getSchema> | undefined
export function contentSchema() {
  schema ??= getSchema(contentExtensions)
  return schema
}
