import { Editor, Extension, InputRule } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import DragHandle from '@tiptap/extension-drag-handle'

// Ícone da alça: seis pontinhos em duas colunas
const ICONE_ALCA = `
<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
  <circle cx="2" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" />
  <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
  <circle cx="2" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
</svg>`

function criarAlca(): HTMLElement {
  const alca = document.createElement('div')
  alca.className = 'alca-arrastar'
  alca.title = 'Arraste para mover'
  alca.innerHTML = ICONE_ALCA
  return alca
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
  if (!link || !link.href) return
  evento.preventDefault()
  window.open(link.href, '_blank', 'noopener')
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
        dropcursor: { color: '#2563eb', width: 2 },
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
      DragHandle.configure({
        render: criarAlca,
        // Itens de lista também ganham alça própria
        nested: {
          allowedContainers: ['bulletList', 'orderedList', 'taskList'],
        },
      }),
    ],
  })
}
