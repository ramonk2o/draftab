import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { comecarArraste, terminarArraste } from './reordenar'

// Alça da lista inteira: uma barra fina à esquerda da lista, mais para fora que
// as alças dos itens. Aparece quando o mouse está na altura de uma lista.

const DISTANCIA_DA_LISTA = 44 // px à esquerda da borda da lista

export const AlcaDeLista = Extension.create({
  name: 'alcaDeLista',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const pai = view.dom.parentElement
          if (!pai) return {}

          const alca = document.createElement('div')
          alca.className = 'alca-lista'
          alca.title = 'Arraste para mover a lista inteira'
          alca.draggable = true
          pai.appendChild(alca)

          let lista: HTMLElement | null = null
          let arrastando = false

          function aoMoverMouse(evento: MouseEvent) {
            if (arrastando) return
            lista = listaNaAltura(view, evento.clientX, evento.clientY)
            if (!lista || !pai) {
              alca.style.display = 'none'
              return
            }
            const caixaPai = pai.getBoundingClientRect()
            const caixa = lista.getBoundingClientRect()
            alca.style.display = 'block'
            alca.style.top = `${caixa.top - caixaPai.top}px`
            alca.style.height = `${caixa.height}px`
            alca.style.left = `${caixa.left - caixaPai.left - DISTANCIA_DA_LISTA}px`
          }

          function aoComecarArraste(evento: DragEvent) {
            const pos = lista ? posicaoDoBloco(view, lista) : null
            if (!lista || pos === null || !evento.dataTransfer) {
              evento.preventDefault()
              return
            }
            // Avisa o editor do que está sendo arrastado, como faz a alça dos blocos
            const selecao = NodeSelection.create(view.state.doc, pos)
            view.dragging = {
              slice: selecao.content(),
              move: true,
              node: selecao,
            } as EditorView['dragging']
            evento.dataTransfer.effectAllowed = 'move'
            evento.dataTransfer.setData('text/plain', lista.textContent ?? '')
            evento.dataTransfer.setDragImage(lista, 0, 0)
            arrastando = true
            comecarArraste(evento)
          }

          function aoTerminarArraste() {
            arrastando = false
            alca.style.display = 'none'
            terminarArraste()
            view.dragging = null
          }

          document.addEventListener('mousemove', aoMoverMouse)
          alca.addEventListener('dragstart', aoComecarArraste)
          alca.addEventListener('dragend', aoTerminarArraste)
          return {
            destroy() {
              document.removeEventListener('mousemove', aoMoverMouse)
              alca.remove()
            },
          }
        },
      }),
    ]
  },
})

// A lista da nota (só as de primeiro nível) que está na altura do mouse
function listaNaAltura(view: EditorView, x: number, y: number): HTMLElement | null {
  for (const el of Array.from(view.dom.children)) {
    if (!(el instanceof HTMLElement) || (el.tagName !== 'UL' && el.tagName !== 'OL')) continue
    const caixa = el.getBoundingClientRect()
    const naAltura = y >= caixa.top && y <= caixa.bottom
    const naLargura = x >= caixa.left - DISTANCIA_DA_LISTA - 8 && x <= caixa.right
    if (naAltura && naLargura) return el
  }
  return null
}

// Posição no documento do bloco de primeiro nível desenhado por este elemento
function posicaoDoBloco(view: EditorView, el: HTMLElement): number | null {
  let achado: number | null = null
  view.state.doc.forEach((_, pos) => {
    if (view.nodeDOM(pos) === el) achado = pos
  })
  return achado
}
