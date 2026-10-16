import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { pasteImageAddress } from './images'

// Pasting an image address on an empty line makes it an image (see "Images" in SPEC.md)
export const ImagePaste = Extension.create({
  name: 'imagePaste',
  // Before the link extension, which would turn the address into a link
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const tr = pasteImageAddress(view.state, event.clipboardData?.getData('text/plain') ?? '')
            if (!tr) return false
            view.dispatch(tr)
            return true
          },
        },
      }),
    ]
  },
})
