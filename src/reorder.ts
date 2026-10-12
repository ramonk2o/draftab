import { Extension } from '@tiptap/core'
import type { Node as PMNode, Schema } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state'
import { canJoin } from '@tiptap/pm/transform'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

// Animated reordering: while a block is dragged, the others slide to open space
// where it will land, and it shows faded in that space.
//
// "Slots" are the places where a block can land: between the note's blocks and
// between the items of any list. The mouse height picks the slot; when two slots
// are at almost the same height (at the edge of a list), horizontal movement
// decides between staying inside or outside the list.
//
// The offsets use ProseMirror "decorations": the editor's way of accepting extra
// classes and styles on blocks without redrawing them.

const LISTS = ['bulletList', 'orderedList', 'taskList']
const ITEMS = ['listItem', 'taskItem']
const DURATION = 220 // ms, same as the CSS

// A note block or list item, measured when the drag starts
type Block = { node: PMNode; pos: number; el: HTMLElement; box: DOMRect }

type Slot = {
  pos: number // document position where the block would go
  parentType: string // 'doc' (the note) or the list type
  y: number // height of the slot on screen
  x: number // where text starts at this slot (compared with the mouse's horizontal movement)
  nextTop: number // where, on screen, a block entering here would start
}

type Drag = {
  origin: Block
  originTextX: number // where the origin's text starts on screen
  originListType: string | null // if the origin is an item, the type of its list
  listIndent: number // how far an item's text is indented relative to its list
  blocks: Block[]
  slots: Slot[]
  height: number // vertical space the origin takes
  slot: Slot | null // slot currently chosen
}

// A block to shift on screen, with extra classes
type Visual = {
  pos: number
  size: number
  el: HTMLElement
  dx: number
  dy: number
  classes: string
  noTransition?: boolean
}

const key = new PluginKey<DecorationSet>('reorder')
let view: EditorView
let handleDragging = false
let startX = 0
let drag: Drag | null = null
let cleanup: ReturnType<typeof setTimeout> | undefined

// Called by the handles when the drag starts and ends
export function startDrag(event: DragEvent) {
  handleDragging = true
  startX = event.clientX
}

export function endDrag() {
  handleDragging = false
  // Dropped outside the note: the blocks animate back into place
  if (drag) cancel()
}

export const Reorder = Extension.create({
  name: 'reorder',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorations) => tr.getMeta(key) ?? decorations.map(tr.mapping, tr.doc),
        },
        props: {
          decorations: (state) => key.getState(state),
          // When dragging with the handles, this file moves the block
          handleDrop: () => drag !== null,
        },
        view(editorView) {
          view = editorView
          document.addEventListener('dragover', onDragOver)
          document.addEventListener('drop', onDrop)
          return {
            destroy() {
              document.removeEventListener('dragover', onDragOver)
              document.removeEventListener('drop', onDrop)
            },
          }
        },
      }),
    ]
  },
})

function onDragOver(event: DragEvent) {
  if (!handleDragging) return
  if (!drag) drag = prepare()
  if (!drag) return
  event.preventDefault() // allows dropping anywhere on the page
  const slot = chooseSlot(event.clientX, event.clientY)
  if (slot === drag.slot) return
  drag.slot = slot
  showPreview()
}

function onDrop(event: DragEvent) {
  if (!drag) return
  event.preventDefault()
  drop()
}

// ---------- Measuring ----------

function prepare(): Drag | null {
  // The handle keeps the block in view.dragging (the selection may change along the way);
  // the node field exists at runtime, but is missing from ProseMirror's types
  const selection = (view.dragging as { node?: NodeSelection } | null)?.node
  if (!(selection instanceof NodeSelection)) return null
  clearTimeout(cleanup)

  const { doc } = view.state
  const originPos = selection.from
  const originEnd = selection.to
  const originType = selection.node.type.name

  // Measure every note block and list item (at any depth)
  const blocks: Block[] = []
  const blockAt = new Map<number, Block>()
  doc.descendants((node, pos, parent) => {
    if (parent === doc || (parent && LISTS.includes(parent.type.name))) {
      const el = view.nodeDOM(pos)
      if (el instanceof HTMLElement) {
        const block = { node, pos, el, box: el.getBoundingClientRect() }
        blocks.push(block)
        blockAt.set(pos, block)
      }
    }
    return !node.isTextblock // no need to go into the paragraphs' text
  })
  const origin = blockAt.get(originPos)
  if (!origin) return null

  // What can go into lists: items and paragraphs
  const entersLists = ITEMS.includes(originType) || originType === 'paragraph'

  // Slots of the note and of each list
  const parents: { node: PMNode; start: number; type: string }[] = [{ node: doc, start: 0, type: 'doc' }]
  for (const block of blocks) {
    if (LISTS.includes(block.node.type.name)) {
      parents.push({ node: block.node, start: block.pos + 1, type: block.node.type.name })
    }
  }
  // Where text starts: the note's left edge, or a list item's text (after its bullet or checkbox)
  // (the editor's left padding is the handles' hover area, not text)
  const noteX = view.dom.getBoundingClientRect().left + parseFloat(getComputedStyle(view.dom).paddingLeft)
  const slots: Slot[] = []
  for (const parent of parents) {
    if (parent.type !== 'doc' && !entersLists) continue
    // A block can't be dropped inside itself
    if (parent.start > originPos && parent.start < originEnd) continue

    const children: Block[] = []
    parent.node.forEach((_, offset) => {
      const child = blockAt.get(parent.start + offset)
      if (child) children.push(child)
    })
    if (children.length !== parent.node.childCount) continue

    const x = parent.type === 'doc' ? noteX : textX(children[0].el)
    children.forEach((child, k) => {
      const previous = children[k - 1]
      slots.push({
        pos: child.pos,
        parentType: parent.type,
        y: previous ? (previous.box.bottom + child.box.top) / 2 : child.box.top,
        x,
        nextTop: child.box.top,
      })
    })
    const last = children[children.length - 1]
    slots.push({
      pos: last.pos + last.node.nodeSize,
      parentType: parent.type,
      y: last.box.bottom,
      x,
      nextTop: last.box.bottom + 8,
    })
  }

  // Origin height: distance to the next block that comes after it
  const next = blocks.find((b) => b.pos >= originEnd)
  const height = next ? next.box.top - origin.box.top : origin.box.height + 8

  // If the origin is an item, keep the type and indentation of its list
  const $origin = doc.resolve(originPos)
  const originList = ITEMS.includes(originType) ? blockAt.get($origin.before()) : undefined

  const originTextX = textX(origin.el)
  document.body.classList.add('reordering')
  return {
    origin,
    originTextX,
    originListType: originList ? originList.node.type.name : null,
    listIndent: originList ? originTextX - originList.box.left : 24,
    blocks,
    slots,
    height,
    slot: null,
  }
}

// Picks the slot closest to the mouse; on a height tie, decides by indentation
function chooseSlot(mouseX: number, mouseY: number): Slot | null {
  if (!drag || drag.slots.length === 0) return null
  const { slots, origin } = drag
  const smallestDistance = Math.min(...slots.map((s) => Math.abs(mouseY - s.y)))
  const candidates = slots.filter((s) => Math.abs(mouseY - s.y) <= smallestDistance + 12)
  // "Desired" indentation: where the origin's text would be if it followed the mouse horizontally
  const desiredX = drag.originTextX + (mouseX - startX)
  return candidates.reduce((best, s) => {
    const dx = Math.abs(s.x - desiredX) - Math.abs(best.x - desiredX)
    if (Math.abs(dx) > 1) return dx < 0 ? s : best
    // Same indentation (e.g. two slots of the same list): the one closest to the mouse wins
    return Math.abs(mouseY - s.y) < Math.abs(mouseY - best.y) ? s : best
  })
}

// Where a block's text starts on screen (after a bullet, number or checkbox)
function textX(el: HTMLElement): number {
  const text = el.matches('p, h1, h2, h3, pre') ? el : el.querySelector<HTMLElement>('p, h1, h2, h3, pre')
  return (text ?? el).getBoundingClientRect().left
}

function staysInPlace(slot: Slot | null): boolean {
  if (!drag || !slot) return true
  const { origin } = drag
  return slot.pos === origin.pos || slot.pos === origin.pos + origin.node.nodeSize
}

// ---------- Preview while dragging ----------

function showPreview() {
  if (!drag) return
  const { origin, blocks, height, slot } = drag
  const originEnd = origin.pos + origin.node.nodeSize
  const stays = staysInPlace(slot)

  const visuals: Visual[] = []
  for (const block of blocks) {
    const insideOrigin = block.pos > origin.pos && block.pos < originEnd
    if (block === origin || insideOrigin) continue
    let dy = 0
    if (!stays && slot) {
      if (block.pos >= originEnd) dy -= height // closes the space the origin left
      if (block.pos >= slot.pos) dy += height // opens space at the slot
    }
    visuals.push(visual(block, 0, dy, 'block-moving'))
  }

  // The origin itself, faded, goes to the slot
  let dx = 0
  let dy = 0
  if (!stays && slot) {
    const top = slot.pos > origin.pos ? slot.nextTop - height : slot.nextTop
    dy = top - origin.box.top
    // Line the text up with the slot's text; an item dropped into the note gets a list
    // of its own, so its text keeps the list indentation
    const getsList = slot.parentType === 'doc' && drag.originListType !== null
    dx = slot.x + (getsList ? drag.listIndent : 0) - drag.originTextX
  }
  visuals.push(visual(origin, dx, dy, 'block-moving block-dragged'))
  draw(visuals)
}

function visual(block: Block, dx: number, dy: number, classes: string): Visual {
  return { pos: block.pos, size: block.node.nodeSize, el: block.el, dx, dy, classes }
}

// Applies the offsets as decorations. An item inside a list that has already
// moved inherits its movement, so it only gets the difference.
function draw(visuals: Visual[]) {
  const byElement = new Map(visuals.map((v) => [v.el, v]))
  const decorations = visuals.map((v) => {
    let ancestor = v.el.parentElement
    while (ancestor && ancestor !== view.dom && !byElement.has(ancestor)) {
      ancestor = ancestor.parentElement
    }
    const inherited = ancestor ? byElement.get(ancestor) : undefined
    const dx = v.dx - (inherited?.dx ?? 0)
    const dy = v.dy - (inherited?.dy ?? 0)

    let style = ''
    if (dx || dy) style += `transform: translate(${dx}px, ${dy}px);`
    if (v.noTransition) style += 'transition: none;'
    return Decoration.node(v.pos, v.pos + v.size, { class: v.classes, style })
  })
  const { state } = view
  view.dispatch(state.tr.setMeta(key, DecorationSet.create(state.doc, decorations)))
}

function clearDecorations() {
  view.dispatch(view.state.tr.setMeta(key, DecorationSet.empty))
}

// Dropped outside (or in the same place): everything slides back
function cancel() {
  if (!drag) return
  const { blocks } = drag
  drag = null
  document.body.classList.remove('reordering')
  draw(blocks.map((b) => visual(b, 0, 0, 'block-moving')))
  cleanup = setTimeout(clearDecorations, DURATION + 50)
}

// ---------- Drop ----------

function drop() {
  if (!drag) return
  const { origin, blocks, slot, originListType } = drag
  if (!slot || staysInPlace(slot)) {
    cancel()
    return
  }
  drag = null
  document.body.classList.remove('reordering')

  // Where each block is on screen now (already shifted by the preview)
  const screenBefore = new Map<PMNode, DOMRect>()
  for (const block of blocks) screenBefore.set(block.node, block.el.getBoundingClientRect())

  const { state } = view
  const { insert, item } = adapt(origin.node, slot.parentType, originListType, state.schema)
  const tr = state.tr
  // deleteRange also removes the list if it becomes empty
  tr.deleteRange(origin.pos, origin.pos + origin.node.nodeSize)
  joinAdjacentLists(tr, tr.mapping.map(origin.pos))
  const insertPos = tr.mapping.map(slot.pos)
  tr.insert(insertPos, insert)
  joinAdjacentLists(tr, insertPos + insert.nodeSize)
  joinAdjacentLists(tr, insertPos)

  const itemPos = nodePosition(tr.doc, item)
  if (itemPos !== null) tr.setSelection(TextSelection.near(tr.doc.resolve(itemPos + 1)))
  tr.setMeta(key, DecorationSet.empty)
  view.dispatch(tr)

  animateIntoPlace(screenBefore, item, origin.node)
}

// Converts the block according to where it will go
function adapt(node: PMNode, parentType: string, originListType: string | null, schema: Schema) {
  const { listItem, taskItem } = schema.nodes
  const type = node.type.name

  if (parentType === 'doc') {
    // Item dropped into the note: gets a list of its own, of the same type as the original
    if (ITEMS.includes(type) && originListType) {
      return { insert: schema.nodes[originListType].create(null, node), item: node }
    }
    return { insert: node, item: node }
  }

  let item = node
  if (parentType === 'taskList') {
    if (type === 'listItem') item = taskItem.create({ checked: false }, node.content)
    if (type === 'paragraph') item = taskItem.create({ checked: false }, node)
  } else {
    if (type === 'taskItem') item = listItem.create(null, node.content)
    if (type === 'paragraph') item = listItem.create(null, node)
  }
  return { insert: item, item }
}

// Two adjacent lists of the same type become one
function joinAdjacentLists(tr: Transaction, pos: number) {
  const $pos = tr.doc.resolve(pos)
  const before = $pos.nodeBefore
  const after = $pos.nodeAfter
  if (!before || !after || before.type !== after.type) return
  if (!LISTS.includes(before.type.name) || !canJoin(tr.doc, pos)) return
  tr.join(pos)
}

function nodePosition(doc: PMNode, target: PMNode): number | null {
  let found: number | null = null
  doc.descendants((node, pos) => {
    if (found !== null) return false
    if (node === target) found = pos
    return !node.isTextblock
  })
  return found
}

// FLIP technique: measure each block's final place, put it back where it was on
// screen and let the transition carry it to the final place, with no jumps.
function animateIntoPlace(screenBefore: Map<PMNode, DOMRect>, item: PMNode, originalNode: PMNode) {
  // The converted item (e.g. it became a task) starts from where the original was
  const itemBefore = screenBefore.get(originalNode)
  if (itemBefore) screenBefore.set(item, itemBefore)

  const visuals: Visual[] = []
  view.state.doc.descendants((node, pos) => {
    const before = screenBefore.get(node)
    if (before) {
      const el = view.nodeDOM(pos)
      if (el instanceof HTMLElement) {
        const now = el.getBoundingClientRect()
        const classes = node === item ? 'block-moving block-dropped' : 'block-moving'
        visuals.push({
          pos,
          size: node.nodeSize,
          el,
          dx: before.left - now.left,
          dy: before.top - now.top,
          classes,
        })
      }
    }
    return !node.isTextblock
  })

  draw(visuals.map((v) => ({ ...v, noTransition: true })))
  view.dom.getBoundingClientRect() // forces the browser to apply the starting position
  draw(visuals.map((v) => ({ ...v, dx: 0, dy: 0 })))
  // The dropped block's highlight lasts 700 ms (see CSS)
  cleanup = setTimeout(clearDecorations, 750)
}
