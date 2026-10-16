import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { HIGHLIGHT_COLORS, applyHighlight, canHighlight, rememberHighlightColor, selectionHighlight, type HighlightColor } from './highlight'
import { t } from './i18n'

// Bar of highlight colors above the selected text: "No color" and the palette

const GAP = 8 // px between the bar and the text

export const HighlightBar = Extension.create({
  name: 'highlightBar',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const bar = document.createElement('div')
          bar.className = 'highlight-bar'
          bar.setAttribute('role', 'toolbar')
          bar.setAttribute('aria-label', t('highlight'))
          bar.hidden = true

          const buttons = [null, ...HIGHLIGHT_COLORS].map((color) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'highlight-option'
            button.dataset.color = color ?? 'none'
            button.title = t(color ? (`color.${color}` as const) : 'color.none')
            // mousedown instead of click: the editor keeps its selection
            button.addEventListener('mousedown', (event) => {
              event.preventDefault()
              pick(color)
            })
            bar.appendChild(button)
            return button
          })
          document.body.appendChild(bar)

          // While selecting with the mouse the bar waits for the button to be released;
          // Esc hides it until the selection changes
          let selectingWithMouse = false
          let dismissed = false

          function pick(color: HighlightColor | null) {
            const tr = applyHighlight(view.state, color)
            if (!tr) return
            if (color) rememberHighlightColor(color)
            view.dispatch(tr)
          }

          function render() {
            const { state } = view
            const show = !selectingWithMouse && !dismissed && !view.dragging && view.hasFocus() && canHighlight(state)
            bar.hidden = !show
            if (!show) return

            const current = selectionHighlight(state)
            buttons.forEach((button) => button.setAttribute('aria-pressed', String(current !== null && button.dataset.color === current)))
            place(view, bar)
          }

          function onMouseDown() {
            selectingWithMouse = true
            render()
          }

          function onMouseUp() {
            if (!selectingWithMouse) return
            selectingWithMouse = false
            render()
          }

          function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape' || bar.hidden) return
            // Esc only hides the bar (not anything else)
            event.stopPropagation()
            dismissed = true
            render()
          }

          function hide() {
            bar.hidden = true
          }

          view.dom.addEventListener('mousedown', onMouseDown)
          document.addEventListener('mouseup', onMouseUp)
          document.addEventListener('keydown', onKeyDown, true)
          // Dragging a block hides it; the editor losing focus too
          document.addEventListener('dragstart', hide, true)
          view.dom.addEventListener('blur', render)
          view.dom.addEventListener('focus', render)
          // The bar is placed on the screen: scrolling moves it along with the text
          document.addEventListener('scroll', render, true)

          return {
            update(view, previous) {
              if (!previous.selection.eq(view.state.selection)) dismissed = false
              render()
            },
            destroy() {
              view.dom.removeEventListener('mousedown', onMouseDown)
              document.removeEventListener('mouseup', onMouseUp)
              document.removeEventListener('keydown', onKeyDown, true)
              document.removeEventListener('dragstart', hide, true)
              view.dom.removeEventListener('blur', render)
              view.dom.removeEventListener('focus', render)
              document.removeEventListener('scroll', render, true)
              bar.remove()
            },
          }
        },
      }),
    ]
  },
})

// Above the selection, centered on it when it's on one line (on its start otherwise);
// below it when there's no room above. Always inside the window.
function place(view: EditorView, bar: HTMLElement) {
  const { from, to } = view.state.selection
  const start = view.coordsAtPos(from)
  const end = view.coordsAtPos(to)
  const oneLine = Math.abs(start.top - end.top) < 2
  const center = oneLine ? (start.left + end.right) / 2 : start.left

  const width = bar.offsetWidth
  const height = bar.offsetHeight
  const left = Math.min(Math.max(center - width / 2, GAP), window.innerWidth - width - GAP)
  const top = start.top - height - GAP >= 0 ? start.top - height - GAP : end.bottom + GAP
  bar.style.left = `${left}px`
  bar.style.top = `${top}px`
}
