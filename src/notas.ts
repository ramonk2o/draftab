import type { JSONContent } from '@tiptap/core'

// Uma nota como fica guardada (ver "Modelo de dados" no SPEC.md)
export type Nota = {
  id: string
  doc: JSONContent // JSON do Tiptap: a fonte da verdade
  title: string
  titleManual: boolean // true depois que o usuário renomeia a nota
  createdAt: number
  updatedAt: number
}

export function novaNotaEmBranco(): Nota {
  const agora = Date.now()
  return {
    id: crypto.randomUUID(),
    doc: { type: 'doc', content: [{ type: 'paragraph' }] },
    title: '',
    titleManual: false,
    createdAt: agora,
    updatedAt: agora,
  }
}

// Texto puro de um trecho do documento; cada bloco vira uma linha
export function textoDe(no: JSONContent): string {
  if (no.type === 'text') return no.text ?? ''
  if (no.type === 'hardBreak') return '\n'
  const filhos = no.content ?? []
  const ehBlocoDeTexto = filhos.some((f) => f.type === 'text' || f.type === 'hardBreak')
  return filhos.map(textoDe).join(ehBlocoDeTexto ? '' : '\n')
}

// Primeira linha com texto, limitada a 80 caracteres
export function primeiraLinha(doc: JSONContent): string {
  const linha = textoDe(doc)
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l !== '')
  return (linha ?? '').slice(0, 80)
}

// Enquanto não foi renomeada, o título acompanha a primeira linha
export function comTituloAtualizado(nota: Nota): Nota {
  if (nota.titleManual) return nota
  return { ...nota, title: primeiraLinha(nota.doc) }
}

// Renomear para vazio volta ao título automático
export function renomeada(nota: Nota, novoTitulo: string): Nota {
  const titulo = novoTitulo.trim()
  if (titulo === '') return comTituloAtualizado({ ...nota, titleManual: false })
  return { ...nota, title: titulo, titleManual: true }
}

// Nota sem texto e sem título dado pelo usuário não é guardada
export function notaVazia(nota: Nota): boolean {
  return !nota.titleManual && textoDe(nota.doc).trim() === ''
}

export function tituloParaMostrar(nota: Nota): string {
  return nota.title || 'Sem título'
}

// Busca no título e no conteúdo, sem diferenciar maiúsculas nem acentos
export function filtrarNotas(notas: Nota[], busca: string): Nota[] {
  const termo = normalizar(busca.trim())
  if (termo === '') return notas
  return notas.filter(
    (nota) => normalizar(nota.title).includes(termo) || normalizar(textoDe(nota.doc)).includes(termo),
  )
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
