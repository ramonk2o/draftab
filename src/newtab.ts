import { criarEditor } from './editor'

const elemento = document.querySelector<HTMLElement>('#editor')
if (!elemento) {
  throw new Error('Elemento #editor não encontrado')
}

criarEditor(elemento)
