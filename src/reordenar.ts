import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

// Reordenação animada: enquanto um bloco é arrastado pela alça, os vizinhos
// deslizam para abrir espaço onde ele vai cair. O bloco só muda de lugar entre
// irmãos (blocos da nota entre si, itens de uma lista entre si).
//
// Os deslocamentos são aplicados com "decorações" do ProseMirror: é o jeito do
// editor aceitar classes e estilos extras nos blocos sem redesenhá-los.

type Arraste = {
  inicioDoPai: number // onde começa o conteúdo do pai (a nota ou a lista)
  posicoes: number[] // posição de cada irmão no documento
  tamanhos: number[] // tamanho de cada irmão no documento
  alturas: number[] // espaço vertical que cada irmão ocupa na tela
  meios: number[] // meio vertical de cada irmão, medido antes de mover
  origem: number // índice do bloco arrastado
  destino: number // índice onde ele vai cair
}

// Estilo extra de um bloco, pelo índice entre os irmãos
type Visual = { deslocamento?: number; classes?: string; semTransicao?: boolean }

const DURACAO = 220 // ms, igual ao CSS

const chave = new PluginKey<DecorationSet>('reordenar')
let view: EditorView
let alcaArrastando = false
let arraste: Arraste | null = null
let limpeza: ReturnType<typeof setTimeout> | undefined

// Chamado pela alça quando o arraste começa e termina
export function comecarArraste() {
  alcaArrastando = true
}

export function terminarArraste() {
  alcaArrastando = false
  // Soltou fora da nota: os blocos voltam ao lugar com animação
  if (arraste) cancelar()
}

export const Reordenacao = Extension.create({
  name: 'reordenacao',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: chave,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decoracoes) => tr.getMeta(chave) ?? decoracoes.map(tr.mapping, tr.doc),
        },
        props: {
          decorations: (state) => chave.getState(state),
          // Na reordenação pela alça, quem move o bloco é este arquivo
          handleDrop: () => arraste !== null,
        },
        view(editorView) {
          view = editorView
          document.addEventListener('dragover', aoPassar)
          document.addEventListener('drop', aoSoltar)
          return {
            destroy() {
              document.removeEventListener('dragover', aoPassar)
              document.removeEventListener('drop', aoSoltar)
            },
          }
        },
      }),
    ]
  },
})

function aoPassar(evento: DragEvent) {
  if (!alcaArrastando) return
  if (!arraste) arraste = preparar()
  if (!arraste) return
  evento.preventDefault() // permite soltar em qualquer lugar da página
  atualizar(evento.clientY)
}

function aoSoltar(evento: DragEvent) {
  if (!arraste) return
  evento.preventDefault()
  soltar()
}

// Troca as decorações dos irmãos
function desenhar(visuais: Visual[], posicoes: number[], tamanhos: number[]) {
  const decoracoes = visuais.map((visual, i) => {
    let estilo = ''
    if (visual.deslocamento) estilo += `transform: translateY(${visual.deslocamento}px);`
    if (visual.semTransicao) estilo += 'transition: none;'
    return Decoration.node(posicoes[i], posicoes[i] + tamanhos[i], {
      class: visual.classes ?? '',
      style: estilo,
    })
  })
  const { state } = view
  view.dispatch(state.tr.setMeta(chave, DecorationSet.create(state.doc, decoracoes)))
}

function apagarDecoracoes() {
  view.dispatch(view.state.tr.setMeta(chave, DecorationSet.empty))
}

// Mede o bloco arrastado e seus irmãos antes de qualquer movimento
function preparar(): Arraste | null {
  // A alça guarda o bloco em view.dragging (a seleção pode mudar no caminho);
  // o campo node existe em tempo de execução, mas falta nos tipos do ProseMirror
  const selecao = (view.dragging as { node?: NodeSelection } | null)?.node
  if (!(selecao instanceof NodeSelection)) return null

  clearTimeout(limpeza)
  const $inicio = view.state.doc.resolve(selecao.from)
  const pai = $inicio.parent
  const posicoes: number[] = []
  const tamanhos: number[] = []
  const caixas: DOMRect[] = []
  let pos = $inicio.start()
  for (let i = 0; i < pai.childCount; i++) {
    const elemento = view.nodeDOM(pos)
    if (!(elemento instanceof HTMLElement)) return null
    posicoes.push(pos)
    tamanhos.push(pai.child(i).nodeSize)
    caixas.push(elemento.getBoundingClientRect())
    pos += pai.child(i).nodeSize
  }

  const alturas = caixas.map((caixa, i) => {
    // Distância até o próximo irmão (inclui a margem entre eles)
    if (i < caixas.length - 1) return caixas[i + 1].top - caixa.top
    if (i > 0) return caixa.bottom - caixas[i - 1].bottom
    return caixa.height
  })

  document.body.classList.add('reordenando')
  return {
    inicioDoPai: $inicio.start(),
    posicoes,
    tamanhos,
    alturas,
    meios: caixas.map((caixa) => caixa.top + caixa.height / 2),
    origem: $inicio.index(),
    destino: -1, // força o primeiro desenho
  }
}

// Calcula onde o bloco cairia e desliza os vizinhos para abrir espaço
function atualizar(mouseY: number) {
  if (!arraste) return
  const { alturas, meios, origem, posicoes, tamanhos } = arraste

  // Destino = quantos irmãos (sem contar o arrastado) ficam acima do mouse
  let destino = 0
  meios.forEach((meio, i) => {
    if (i !== origem && mouseY > meio) destino++
  })
  if (destino === arraste.destino) return
  arraste.destino = destino

  const visuais: Visual[] = posicoes.map(() => ({ classes: 'bloco-movel' }))
  let deslocamentoDoArrastado = 0
  visuais.forEach((visual, i) => {
    if (i > origem && i <= destino) {
      // Estava abaixo e passa para cima do arrastado: sobe
      visual.deslocamento = -alturas[origem]
      deslocamentoDoArrastado += alturas[i]
    } else if (i < origem && i >= destino) {
      // Estava acima e passa para baixo do arrastado: desce
      visual.deslocamento = alturas[origem]
      deslocamentoDoArrastado -= alturas[i]
    }
  })
  // O próprio bloco, apagado, mostra onde vai cair
  visuais[origem] = { classes: 'bloco-movel bloco-arrastado', deslocamento: deslocamentoDoArrastado }
  desenhar(visuais, posicoes, tamanhos)
}

// Soltou fora: tudo desliza de volta e as decorações saem depois
function cancelar() {
  if (!arraste) return
  const { posicoes, tamanhos } = arraste
  arraste = null
  document.body.classList.remove('reordenando')
  desenhar(posicoes.map(() => ({ classes: 'bloco-movel' })), posicoes, tamanhos)
  limpeza = setTimeout(apagarDecoracoes, DURACAO + 50)
}

// Aplica a nova ordem no documento, sem pulos na tela
function soltar() {
  if (!arraste) return
  const { inicioDoPai, posicoes, tamanhos, origem, destino } = arraste
  if (destino === origem || destino === -1) {
    cancelar()
    return
  }
  arraste = null
  document.body.classList.remove('reordenando')

  // Onde cada bloco está na tela agora (já deslocado)
  const topoAntes = posicoes.map((pos) => (view.nodeDOM(pos) as HTMLElement).getBoundingClientRect().top)

  // Nova ordem dos irmãos: o arrastado sai da origem e entra no destino
  const ordem = posicoes.map((_, i) => i).filter((i) => i !== origem)
  ordem.splice(destino, 0, origem)

  // Posição de inserção, contada no documento antes da mudança
  let alvo = inicioDoPai
  const ultimoAntes = destino > origem ? destino : destino - 1
  for (let i = 0; i <= ultimoAntes; i++) alvo += tamanhos[i]

  const { state } = view
  const bloco = state.doc.nodeAt(posicoes[origem])
  if (!bloco) return
  const tr = state.tr.delete(posicoes[origem], posicoes[origem] + tamanhos[origem])
  const novaPosicao = tr.mapping.map(alvo)
  tr.insert(novaPosicao, bloco)
  tr.setSelection(TextSelection.near(tr.doc.resolve(novaPosicao + 1)))
  tr.setMeta(chave, DecorationSet.empty)
  view.dispatch(tr)

  // Técnica FLIP: mede o lugar final, põe cada bloco de volta onde estava na
  // tela e deixa a transição levá-lo até o lugar final.
  const novasPosicoes: number[] = []
  const novosTamanhos: number[] = []
  let pos = inicioDoPai
  for (const i of ordem) {
    novasPosicoes.push(pos)
    novosTamanhos.push(tamanhos[i])
    pos += tamanhos[i]
  }
  const diferencas = ordem.map((i, k) => {
    const topoDepois = (view.nodeDOM(novasPosicoes[k]) as HTMLElement).getBoundingClientRect().top
    return topoAntes[i] - topoDepois
  })
  desenhar(
    diferencas.map((d) => ({ deslocamento: d, semTransicao: true })),
    novasPosicoes,
    novosTamanhos,
  )
  view.dom.getBoundingClientRect() // força o navegador a aplicar a posição inicial
  desenhar(
    ordem.map((i) => ({ classes: i === origem ? 'bloco-movel bloco-solto' : 'bloco-movel' })),
    novasPosicoes,
    novosTamanhos,
  )
  // O destaque do bloco solto dura 700 ms (ver CSS)
  limpeza = setTimeout(apagarDecoracoes, 750)
}
