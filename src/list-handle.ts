import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { endDrag, startDrag } from './reorder'

// Whole-list handle: a thin bar to the left of the list, further out than the
// item handles. Shows up when the mouse is at the height of a list.

const DISTANCE_FROM_LIST = 44 // px to the left of the list's edge

export const ListHandle = Extension.create({
  name: 'listHandle',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const parent = view.dom.parentElement
          if (!parent) return {}

          const handle = document.createElement('div')
          handle.className = 'list-handle'
          handle.title = 'Drag to move the whole list'
          handle.draggable = true
          parent.appendChild(handle)

          let list: HTMLElement | null = null
          let dragging = false

          function onMouseMove(event: MouseEvent) {
            if (dragging) return
            list = listAtHeight(view, event.clientX, event.clientY)
            if (!list || !parent) {
              handle.style.display = 'none'
              return
            }
            const parentBox = parent.getBoundingClientRect()
            const box = list.getBoundingClientRect()
            handle.style.display = 'block'
            handle.style.top = `${box.top - parentBox.top}px`
            handle.style.height = `${box.height}px`
            handle.style.left = `${box.left - parentBox.left - DISTANCE_FROM_LIST}px`
          }

          function onDragStart(event: DragEvent) {
            const pos = list ? blockPosition(view, list) : null
            if (!list || pos === null || !event.dataTransfer) {
              event.preventDefault()
              return
            }
            // Tell the editor what is being dragged, like the block handle does
            const selection = NodeSelection.create(view.state.doc, pos)
            view.dragging = {
              slice: selection.content(),
              move: true,
              node: selection,
            } as EditorView['dragging']
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', list.textContent ?? '')
            event.dataTransfer.setDragImage(list, 0, 0)
            dragging = true
            startDrag(event)
          }

          function onDragEnd() {
            dragging = false
            handle.style.display = 'none'
            endDrag()
            view.dragging = null
          }

          document.addEventListener('mousemove', onMouseMove)
          handle.addEventListener('dragstart', onDragStart)
          handle.addEventListener('dragend', onDragEnd)
          return {
            destroy() {
              document.removeEventListener('mousemove', onMouseMove)
              handle.remove()
            },
          }
        },
      }),
    ]
  },
})

// The note's list (top-level only) at the mouse's height
function listAtHeight(view: EditorView, x: number, y: number): HTMLElement | null {
  for (const el of Array.from(view.dom.children)) {
    if (!(el instanceof HTMLElement) || (el.tagName !== 'UL' && el.tagName !== 'OL')) continue
    const box = el.getBoundingClientRect()
    const atHeight = y >= box.top && y <= box.bottom
    const atWidth = x >= box.left - DISTANCE_FROM_LIST - 8 && x <= box.right
    if (atHeight && atWidth) return el
  }
  return null
}

// Document position of the top-level block drawn by this element
function blockPosition(view: EditorView, el: HTMLElement): number | null {
  let found: number | null = null
  view.state.doc.forEach((_, pos) => {
    if (view.nodeDOM(pos) === el) found = pos
  })
  return found
}
