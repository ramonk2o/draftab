import type { EditorView } from '@tiptap/pm/view'
import { BLOCK_COLORS, canBeColored, setBlockColor, type BlockColor } from './block-color'
import { t } from './i18n'

// Menu of background colors, opened by a single click on a block's handle
// (or on the whole-list bar): "No color" and the palette, in a row next to the handle

let menu: HTMLElement | null = null

// Opens the menu for the block at `pos`, next to `handle`. Blocks without colors (images, dividers) get no menu.
export function openColorMenu(view: EditorView, pos: number, handle: HTMLElement) {
  closeColorMenu()
  const node = view.state.doc.nodeAt(pos)
  if (!node || !canBeColored(node)) return

  menu = document.createElement('div')
  menu.className = 'color-menu'
  menu.setAttribute('role', 'toolbar')
  menu.setAttribute('aria-label', t('blockColor'))

  const current: BlockColor | null = node.attrs.color ?? null
  for (const color of [null, ...BLOCK_COLORS]) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'color-option'
    button.dataset.color = color ?? 'none'
    button.title = t(color ? (`color.${color}` as const) : 'color.none')
    button.setAttribute('aria-pressed', String(color === current))
    // mousedown instead of click: the editor keeps its selection
    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
      pickColor(view, pos, color)
    })
    menu.appendChild(button)
  }

  document.body.appendChild(menu)
  const box = handle.getBoundingClientRect()
  menu.style.left = `${box.right + 4}px`
  menu.style.top = `${box.top + box.height / 2 - menu.offsetHeight / 2}px`

  document.addEventListener('mousedown', onMouseDownOutside, true)
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('dragstart', closeColorMenu, true)
  // The menu is placed by the handle's position on the screen: scrolling would leave it behind
  document.addEventListener('scroll', closeColorMenu, true)
}

export function closeColorMenu() {
  if (!menu) return
  menu.remove()
  menu = null
  document.removeEventListener('mousedown', onMouseDownOutside, true)
  document.removeEventListener('keydown', onKeyDown, true)
  document.removeEventListener('dragstart', closeColorMenu, true)
  document.removeEventListener('scroll', closeColorMenu, true)
}

function pickColor(view: EditorView, pos: number, color: BlockColor | null) {
  closeColorMenu()
  // The note may have changed while the menu was open (e.g. from another tab)
  const node = view.state.doc.nodeAt(pos)
  if (!node || !canBeColored(node) || (node.attrs.color ?? null) === color) return
  view.dispatch(setBlockColor(view.state.tr, pos, color))
}

function onMouseDownOutside(event: MouseEvent) {
  if (menu && !menu.contains(event.target as Node)) closeColorMenu()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  // Esc only closes the menu (not the lightbox or anything else)
  event.stopPropagation()
  closeColorMenu()
}
