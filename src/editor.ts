import { Editor, Extension, InputRule } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import DragHandle from '@tiptap/extension-drag-handle'
import { Reordenacao, comecarArraste, terminarArraste } from './reordenar'
import { AlcaDeLista } from './alca-lista'

// Ícone da alça: seis pontinhos em duas colunas
const ICONE_ALCA = `
<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
  <circle cx="2" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" />
  <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
  <circle cx="2" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
</svg>`

const alca = criarAlca()

function criarAlca(): HTMLElement {
  const alca = document.createElement('div')
  alca.className = 'alca-arrastar'
  alca.title = 'Arraste para mover'
  alca.innerHTML = ICONE_ALCA
  return alca
}

// Bloco sob o mouse no momento (a alça se posiciona em relação a ele)
let blocoDaAlca: HTMLElement | null = null

// Retângulo da primeira linha do bloco: a alça fica centrada nele.
// Sem isso a alça se alinha pelo topo e fica torta em títulos e no separador.
function primeiraLinhaDoBloco(bloco: HTMLElement): DOMRect {
  const caixa = bloco.getBoundingClientRect()
  const texto = bloco.matches('p, h1, h2, h3, pre') ? bloco : bloco.querySelector<HTMLElement>('p, h1, h2, h3, pre')
  if (!texto) return caixa // separador: centraliza na própria linha

  const estilo = getComputedStyle(texto)
  const alturaDaLinha = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.2
  const topo = texto.getBoundingClientRect().top + parseFloat(estilo.paddingTop)
  return new DOMRect(caixa.left, topo, caixa.width, alturaDaLinha)
}

// "- [ ] " vira checklist. O Tiptap só reconhece "[ ] " fora de listas;
// aqui o "- " já criou um item de lista, então trocamos a lista por checklist.
const ChecklistDentroDeLista = Extension.create({
  name: 'checklistDentroDeLista',
  addInputRules() {
    return [
      new InputRule({
        find: /^\s*\[([ x])?\]\s$/,
        handler: ({ state, range, match, chain }) => {
          const paiDoParagrafo = state.doc.resolve(range.from).node(-1)
          if (paiDoParagrafo.type.name !== 'listItem') return null
          chain()
            .deleteRange(range)
            .toggleTaskList()
            .updateAttributes('taskItem', { checked: match[1] === 'x' })
            .run()
        },
      }),
    ]
  },
})

// Cmd/Ctrl + clique num link abre o endereço numa nova aba
function abrirLinkComModificador(evento: MouseEvent) {
  if (!evento.metaKey && !evento.ctrlKey) return
  const link = (evento.target as HTMLElement).closest('a')
  if (!link) return
  let endereco = link.getAttribute('href') ?? ''
  if (!endereco) return
  // Sem protocolo ("google.com"), o Chrome abriria um arquivo da própria extensão
  if (!/^[a-z][a-z0-9+.-]*:/i.test(endereco)) {
    endereco = 'https://' + endereco
  }
  evento.preventDefault()
  window.open(endereco, '_blank', 'noopener')
}

// Cria o editor com todos os blocos do MVP e a alça de arrastar
export function criarEditor(elemento: HTMLElement): Editor {
  elemento.addEventListener('click', abrirLinkComModificador)

  return new Editor({
    element: elemento,
    autofocus: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Linha azul que mostra onde o bloco arrastado vai cair
        // (escondida durante a reordenação pela alça, que tem animação própria)
        dropcursor: { color: '#2563eb', width: 2, class: 'cursor-soltar' },
        link: {
          // Clicar edita o texto; abrir o link é com Cmd/Ctrl + clique
          openOnClick: false,
          defaultProtocol: 'https',
          // Digitar [texto](url) vira link
          markdownLinks: true,
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ChecklistDentroDeLista,
      Reordenacao,
      AlcaDeLista,
      DragHandle.configure({
        render: () => alca,
        onElementDragStart: comecarArraste,
        onElementDragEnd: terminarArraste,
        // Em itens de lista a alça vai mais para a esquerda, antes do marcador
        onNodeChange: (dados) => {
          alca.classList.toggle('alca-em-lista', dados.node?.type.name === 'listItem')
          // pos existe em tempo de execução, mas falta nos tipos da extensão
          const { pos } = dados as { pos?: number }
          const el = pos !== undefined && pos >= 0 ? dados.editor.view.nodeDOM(pos) : null
          blocoDaAlca = el instanceof HTMLElement ? el : null
        },
        // Alça à esquerda, centrada na primeira linha do bloco
        computePositionConfig: { placement: 'left', strategy: 'absolute' },
        getReferencedVirtualElement: () => {
          const bloco = blocoDaAlca
          return bloco ? { getBoundingClientRect: () => primeiraLinhaDoBloco(bloco) } : null
        },
        // Itens de lista também ganham alça própria
        nested: {
          // Sem isso, a alça some quando o mouse está na parte de cima de um item de lista
          edgeDetection: 'none',
          rules: [
            {
              // Dentro de uma citação, a alça move a citação inteira
              id: 'citacaoInteira',
              evaluate: ({ parent }) => (parent?.type.name === 'blockquote' ? 1000 : 0),
            },
          ],
        },
      }),
    ],
  })
}
