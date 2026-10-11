import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'

// Extensões que definem o conteúdo das notas (blocos e marcas).
// Usadas pelo editor e pela conversão para markdown do backup.
export const extensoesDoConteudo = [
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
]
