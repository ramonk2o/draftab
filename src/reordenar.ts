import { Extension } from '@tiptap/core'
import type { Node as NoPM, Schema } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state'
import { canJoin } from '@tiptap/pm/transform'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

// Reordenação animada: enquanto um bloco é arrastado, os outros deslizam para
// abrir espaço onde ele vai cair, e ele aparece apagado nesse espaço.
//
// "Vagas" são os lugares onde um bloco pode cair: entre os blocos da nota e
// entre os itens de qualquer lista. A altura do mouse escolhe a vaga; quando
// duas vagas ficam quase na mesma altura (na borda de uma lista), o movimento
// horizontal decide entre ficar dentro ou fora da lista.
//
// Os deslocamentos usam "decorações" do ProseMirror: é o jeito do editor
// aceitar classes e estilos extras nos blocos sem redesenhá-los.

const LISTAS = ['bulletList', 'orderedList', 'taskList']
const ITENS = ['listItem', 'taskItem']
const DURACAO = 220 // ms, igual ao CSS

// Um bloco da nota ou item de lista, medido no início do arraste
type Bloco = { no: NoPM; pos: number; el: HTMLElement; caixa: DOMRect }

type Vaga = {
  pos: number // posição no documento onde o bloco entraria
  tipoDoPai: string // 'doc' (a nota) ou o tipo da lista
  y: number // altura da vaga na tela
  x: number // recuo do conteúdo nessa vaga
  topoSeguinte: number // onde começaria, na tela, o bloco que entrar aqui
}

type Arraste = {
  origem: Bloco
  tipoListaOrigem: string | null // se a origem é um item, o tipo da lista dela
  recuoLista: number // quanto um item fica recuado em relação à sua lista
  blocos: Bloco[]
  vagas: Vaga[]
  altura: number // espaço vertical que a origem ocupa
  vaga: Vaga | null // vaga escolhida no momento
}

// Um bloco a deslocar na tela, com classes extras
type Visual = {
  pos: number
  tamanho: number
  el: HTMLElement
  dx: number
  dy: number
  classes: string
  semTransicao?: boolean
}

const chave = new PluginKey<DecorationSet>('reordenar')
let view: EditorView
let alcaArrastando = false
let xInicial = 0
let arraste: Arraste | null = null
let limpeza: ReturnType<typeof setTimeout> | undefined

// Chamado pelas alças quando o arraste começa e termina
export function comecarArraste(evento: DragEvent) {
  alcaArrastando = true
  xInicial = evento.clientX
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
          // No arraste pelas alças, quem move o bloco é este arquivo
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
  const vaga = escolherVaga(evento.clientX, evento.clientY)
  if (vaga === arraste.vaga) return
  arraste.vaga = vaga
  mostrarPrevia()
}

function aoSoltar(evento: DragEvent) {
  if (!arraste) return
  evento.preventDefault()
  soltar()
}

// ---------- Medição ----------

function preparar(): Arraste | null {
  // A alça guarda o bloco em view.dragging (a seleção pode mudar no caminho);
  // o campo node existe em tempo de execução, mas falta nos tipos do ProseMirror
  const selecao = (view.dragging as { node?: NodeSelection } | null)?.node
  if (!(selecao instanceof NodeSelection)) return null
  clearTimeout(limpeza)

  const { doc } = view.state
  const origemPos = selecao.from
  const origemFim = selecao.to
  const tipoOrigem = selecao.node.type.name

  // Mede todos os blocos da nota e itens de listas (em qualquer profundidade)
  const blocos: Bloco[] = []
  const blocoNaPos = new Map<number, Bloco>()
  doc.descendants((no, pos, pai) => {
    if (pai === doc || (pai && LISTAS.includes(pai.type.name))) {
      const el = view.nodeDOM(pos)
      if (el instanceof HTMLElement) {
        const bloco = { no, pos, el, caixa: el.getBoundingClientRect() }
        blocos.push(bloco)
        blocoNaPos.set(pos, bloco)
      }
    }
    return !no.isTextblock // não precisa entrar no texto dos parágrafos
  })
  const origem = blocoNaPos.get(origemPos)
  if (!origem) return null

  // Quem pode entrar em listas: itens e parágrafos
  const entraEmLista = ITENS.includes(tipoOrigem) || tipoOrigem === 'paragraph'

  // Vagas da nota e de cada lista
  const pais: { no: NoPM; inicio: number; tipo: string }[] = [{ no: doc, inicio: 0, tipo: 'doc' }]
  for (const bloco of blocos) {
    if (LISTAS.includes(bloco.no.type.name)) {
      pais.push({ no: bloco.no, inicio: bloco.pos + 1, tipo: bloco.no.type.name })
    }
  }
  const vagas: Vaga[] = []
  for (const pai of pais) {
    if (pai.tipo !== 'doc' && !entraEmLista) continue
    // Não dá para soltar um bloco dentro dele mesmo
    if (pai.inicio > origemPos && pai.inicio < origemFim) continue

    const filhos: Bloco[] = []
    pai.no.forEach((_, deslocamento) => {
      const filho = blocoNaPos.get(pai.inicio + deslocamento)
      if (filho) filhos.push(filho)
    })
    if (filhos.length !== pai.no.childCount) continue

    filhos.forEach((filho, k) => {
      const anterior = filhos[k - 1]
      vagas.push({
        pos: filho.pos,
        tipoDoPai: pai.tipo,
        y: anterior ? (anterior.caixa.bottom + filho.caixa.top) / 2 : filho.caixa.top,
        x: filhos[0].caixa.left,
        topoSeguinte: filho.caixa.top,
      })
    })
    const ultimo = filhos[filhos.length - 1]
    vagas.push({
      pos: ultimo.pos + ultimo.no.nodeSize,
      tipoDoPai: pai.tipo,
      y: ultimo.caixa.bottom,
      x: filhos[0].caixa.left,
      topoSeguinte: ultimo.caixa.bottom + 8,
    })
  }

  // Altura da origem: distância até o próximo bloco que vem depois dela
  const proximo = blocos.find((b) => b.pos >= origemFim)
  const altura = proximo ? proximo.caixa.top - origem.caixa.top : origem.caixa.height + 8

  // Se a origem é um item, guarda o tipo e o recuo da lista dela
  const $origem = doc.resolve(origemPos)
  const listaOrigem = ITENS.includes(tipoOrigem) ? blocoNaPos.get($origem.before()) : undefined

  document.body.classList.add('reordenando')
  return {
    origem,
    tipoListaOrigem: listaOrigem ? listaOrigem.no.type.name : null,
    recuoLista: listaOrigem ? origem.caixa.left - listaOrigem.caixa.left : 24,
    blocos,
    vagas,
    altura,
    vaga: null,
  }
}

// Escolhe a vaga mais próxima do mouse; em empate de altura, decide pelo recuo
function escolherVaga(mouseX: number, mouseY: number): Vaga | null {
  if (!arraste || arraste.vagas.length === 0) return null
  const { vagas, origem } = arraste
  const menorDistancia = Math.min(...vagas.map((v) => Math.abs(mouseY - v.y)))
  const candidatas = vagas.filter((v) => Math.abs(mouseY - v.y) <= menorDistancia + 12)
  // Recuo "desejado": onde a origem estaria se acompanhasse o mouse na horizontal
  const xDesejado = origem.caixa.left + (mouseX - xInicial)
  return candidatas.reduce((melhor, v) =>
    Math.abs(v.x - xDesejado) < Math.abs(melhor.x - xDesejado) ? v : melhor,
  )
}

function ficaNoLugar(vaga: Vaga | null): boolean {
  if (!arraste || !vaga) return true
  const { origem } = arraste
  return vaga.pos === origem.pos || vaga.pos === origem.pos + origem.no.nodeSize
}

// ---------- Prévia durante o arraste ----------

function mostrarPrevia() {
  if (!arraste) return
  const { origem, blocos, altura, vaga } = arraste
  const origemFim = origem.pos + origem.no.nodeSize
  const fica = ficaNoLugar(vaga)

  const visuais: Visual[] = []
  for (const bloco of blocos) {
    const dentroDaOrigem = bloco.pos > origem.pos && bloco.pos < origemFim
    if (bloco === origem || dentroDaOrigem) continue
    let dy = 0
    if (!fica && vaga) {
      if (bloco.pos >= origemFim) dy -= altura // fecha o espaço de onde a origem saiu
      if (bloco.pos >= vaga.pos) dy += altura // abre espaço na vaga
    }
    visuais.push(visual(bloco, 0, dy, 'bloco-movel'))
  }

  // A própria origem, apagada, vai para a vaga
  let dx = 0
  let dy = 0
  if (!fica && vaga) {
    const topo = vaga.pos > origem.pos ? vaga.topoSeguinte - altura : vaga.topoSeguinte
    dy = topo - origem.caixa.top
    // Item que sai para a nota ganha uma lista própria, com o mesmo recuo
    const ganhaLista = vaga.tipoDoPai === 'doc' && arraste.tipoListaOrigem !== null
    dx = vaga.x + (ganhaLista ? arraste.recuoLista : 0) - origem.caixa.left
  }
  visuais.push(visual(origem, dx, dy, 'bloco-movel bloco-arrastado'))
  desenhar(visuais)
}

function visual(bloco: Bloco, dx: number, dy: number, classes: string): Visual {
  return { pos: bloco.pos, tamanho: bloco.no.nodeSize, el: bloco.el, dx, dy, classes }
}

// Aplica os deslocamentos como decorações. Um item dentro de uma lista que já
// se moveu herda o movimento dela, então só recebe a diferença.
function desenhar(visuais: Visual[]) {
  const porElemento = new Map(visuais.map((v) => [v.el, v]))
  const decoracoes = visuais.map((v) => {
    let ancestral = v.el.parentElement
    while (ancestral && ancestral !== view.dom && !porElemento.has(ancestral)) {
      ancestral = ancestral.parentElement
    }
    const herdado = ancestral ? porElemento.get(ancestral) : undefined
    const dx = v.dx - (herdado?.dx ?? 0)
    const dy = v.dy - (herdado?.dy ?? 0)

    let estilo = ''
    if (dx || dy) estilo += `transform: translate(${dx}px, ${dy}px);`
    if (v.semTransicao) estilo += 'transition: none;'
    return Decoration.node(v.pos, v.pos + v.tamanho, { class: v.classes, style: estilo })
  })
  const { state } = view
  view.dispatch(state.tr.setMeta(chave, DecorationSet.create(state.doc, decoracoes)))
}

function apagarDecoracoes() {
  view.dispatch(view.state.tr.setMeta(chave, DecorationSet.empty))
}

// Soltou fora (ou no mesmo lugar): tudo desliza de volta
function cancelar() {
  if (!arraste) return
  const { blocos } = arraste
  arraste = null
  document.body.classList.remove('reordenando')
  desenhar(blocos.map((b) => visual(b, 0, 0, 'bloco-movel')))
  limpeza = setTimeout(apagarDecoracoes, DURACAO + 50)
}

// ---------- Soltar ----------

function soltar() {
  if (!arraste) return
  const { origem, blocos, vaga, tipoListaOrigem } = arraste
  if (!vaga || ficaNoLugar(vaga)) {
    cancelar()
    return
  }
  arraste = null
  document.body.classList.remove('reordenando')

  // Onde cada bloco está na tela agora (já deslocado pela prévia)
  const telaAntes = new Map<NoPM, DOMRect>()
  for (const bloco of blocos) telaAntes.set(bloco.no, bloco.el.getBoundingClientRect())

  const { state } = view
  const { inserir, item } = adaptar(origem.no, vaga.tipoDoPai, tipoListaOrigem, state.schema)
  const tr = state.tr
  // deleteRange também remove a lista se ela ficar vazia
  tr.deleteRange(origem.pos, origem.pos + origem.no.nodeSize)
  juntarListasVizinhas(tr, tr.mapping.map(origem.pos))
  const posInsercao = tr.mapping.map(vaga.pos)
  tr.insert(posInsercao, inserir)
  juntarListasVizinhas(tr, posInsercao + inserir.nodeSize)
  juntarListasVizinhas(tr, posInsercao)

  const posItem = posicaoDoNo(tr.doc, item)
  if (posItem !== null) tr.setSelection(TextSelection.near(tr.doc.resolve(posItem + 1)))
  tr.setMeta(chave, DecorationSet.empty)
  view.dispatch(tr)

  animarAteOLugarFinal(telaAntes, item, origem.no)
}

// Converte o bloco conforme o lugar onde ele vai entrar
function adaptar(no: NoPM, tipoDoPai: string, tipoListaOrigem: string | null, schema: Schema) {
  const { listItem, taskItem } = schema.nodes
  const tipo = no.type.name

  if (tipoDoPai === 'doc') {
    // Item solto na nota: ganha uma lista própria do mesmo tipo da original
    if (ITENS.includes(tipo) && tipoListaOrigem) {
      return { inserir: schema.nodes[tipoListaOrigem].create(null, no), item: no }
    }
    return { inserir: no, item: no }
  }

  let item = no
  if (tipoDoPai === 'taskList') {
    if (tipo === 'listItem') item = taskItem.create({ checked: false }, no.content)
    if (tipo === 'paragraph') item = taskItem.create({ checked: false }, no)
  } else {
    if (tipo === 'taskItem') item = listItem.create(null, no.content)
    if (tipo === 'paragraph') item = listItem.create(null, no)
  }
  return { inserir: item, item }
}

// Duas listas do mesmo tipo encostadas viram uma só
function juntarListasVizinhas(tr: Transaction, pos: number) {
  const $pos = tr.doc.resolve(pos)
  const antes = $pos.nodeBefore
  const depois = $pos.nodeAfter
  if (!antes || !depois || antes.type !== depois.type) return
  if (!LISTAS.includes(antes.type.name) || !canJoin(tr.doc, pos)) return
  tr.join(pos)
}

function posicaoDoNo(doc: NoPM, procurado: NoPM): number | null {
  let achado: number | null = null
  doc.descendants((no, pos) => {
    if (achado !== null) return false
    if (no === procurado) achado = pos
    return !no.isTextblock
  })
  return achado
}

// Técnica FLIP: mede o lugar final de cada bloco, põe de volta onde ele estava
// na tela e deixa a transição levá-lo até o lugar final, sem pulos.
function animarAteOLugarFinal(telaAntes: Map<NoPM, DOMRect>, item: NoPM, noOriginal: NoPM) {
  // O item convertido (ex.: virou tarefa) parte de onde estava o original
  const antesDoItem = telaAntes.get(noOriginal)
  if (antesDoItem) telaAntes.set(item, antesDoItem)

  const visuais: Visual[] = []
  view.state.doc.descendants((no, pos) => {
    const antes = telaAntes.get(no)
    if (antes) {
      const el = view.nodeDOM(pos)
      if (el instanceof HTMLElement) {
        const agora = el.getBoundingClientRect()
        const classes = no === item ? 'bloco-movel bloco-solto' : 'bloco-movel'
        visuais.push({
          pos,
          tamanho: no.nodeSize,
          el,
          dx: antes.left - agora.left,
          dy: antes.top - agora.top,
          classes,
        })
      }
    }
    return !no.isTextblock
  })

  desenhar(visuais.map((v) => ({ ...v, semTransicao: true })))
  view.dom.getBoundingClientRect() // força o navegador a aplicar a posição inicial
  desenhar(visuais.map((v) => ({ ...v, dx: 0, dy: 0 })))
  // O destaque do bloco solto dura 700 ms (ver CSS)
  limpeza = setTimeout(apagarDecoracoes, 750)
}
