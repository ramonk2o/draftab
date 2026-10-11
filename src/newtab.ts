import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

const elemento = document.querySelector<HTMLElement>('#editor')
if (!elemento) {
  throw new Error('Elemento #editor não encontrado')
}

// Editor básico; os demais blocos e a alça de arrastar entram na Etapa 2
new Editor({
  element: elemento,
  extensions: [StarterKit],
  content: '',
  autofocus: true,
})
