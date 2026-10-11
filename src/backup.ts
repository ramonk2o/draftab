import { flattenExtensions, getSchema } from '@tiptap/core'
import { MarkdownManager } from '@tiptap/markdown'
import { extensoesDoConteudo } from './extensoes'
import type { Nota } from './notas'
import type { Configuracoes } from './storage'

// Formato do arquivo de backup (ver SPEC.md). Não depende de página aberta:
// também é usado pelo backup automático.

export type NotaNoBackup = Nota & { markdown: string }

export type Backup = {
  app: 'draftab'
  version: 1
  exportedAt: number
  settings: Configuracoes
  notes: NotaNoBackup[]
}

const VERSAO = 1

// Conversor e schema criados uma vez, na primeira necessidade
let markdown: MarkdownManager | undefined
let schema: ReturnType<typeof getSchema> | undefined

function paraMarkdown(nota: Nota): string {
  markdown ??= new MarkdownManager({ extensions: flattenExtensions(extensoesDoConteudo) })
  return markdown.serialize(nota.doc)
}

export function criarBackup(notas: Nota[], configuracoes: Configuracoes, agora = Date.now()): Backup {
  return {
    app: 'draftab',
    version: VERSAO,
    exportedAt: agora,
    settings: configuracoes,
    notes: notas.map((nota) => ({
      id: nota.id,
      title: nota.title,
      titleManual: nota.titleManual,
      markdown: paraMarkdown(nota), // só para leitura humana
      doc: nota.doc,
      createdAt: nota.createdAt,
      updatedAt: nota.updatedAt,
    })),
  }
}

// draftab_AAAA-MM-DD-HHhMM.json (ex.: draftab_2026-10-11-15h05.json), no horário local
export function nomeDoArquivo(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  const dia = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
  return `draftab_${dia}-${dois(data.getHours())}h${dois(data.getMinutes())}.json`
}

// Lê o texto de um arquivo de backup e confere tudo antes de aceitar.
// Erros têm mensagens prontas para mostrar ao usuário.
export function lerBackup(texto: string): Backup {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!ehObjeto(dados) || dados.app !== 'draftab') {
    throw new Error('Este arquivo não é um backup do Draftab.')
  }
  if (typeof dados.version !== 'number' || dados.version > VERSAO) {
    throw new Error('Este backup foi feito por uma versão mais nova do Draftab.')
  }
  if (dados.version !== VERSAO) {
    throw new Error('Versão de backup desconhecida.')
  }
  if (!Array.isArray(dados.notes)) {
    throw new Error('O backup não tem a lista de notas.')
  }

  schema ??= getSchema(extensoesDoConteudo)
  const ids = new Set<string>()
  const notas = dados.notes.map((nota: unknown, i: number) => {
    const qual = `A nota ${i + 1} do backup`
    if (!ehObjeto(nota) || typeof nota.id !== 'string' || nota.id === '') {
      throw new Error(`${qual} não tem identificador.`)
    }
    if (ids.has(nota.id)) throw new Error(`${qual} está repetida.`)
    ids.add(nota.id)
    if (typeof nota.title !== 'string') throw new Error(`${qual} não tem título.`)
    if (typeof nota.createdAt !== 'number' || typeof nota.updatedAt !== 'number') {
      throw new Error(`${qual} não tem datas válidas.`)
    }
    // O conteúdo precisa ser um documento que o editor consegue abrir
    try {
      if (!ehObjeto(nota.doc) || nota.doc.type !== 'doc') throw new Error()
      schema!.nodeFromJSON(nota.doc).check()
    } catch {
      throw new Error(`${qual} ("${nota.title}") tem conteúdo inválido.`)
    }
    return {
      id: nota.id,
      title: nota.title,
      titleManual: nota.titleManual === true,
      markdown: typeof nota.markdown === 'string' ? nota.markdown : '',
      doc: nota.doc,
      createdAt: nota.createdAt,
      updatedAt: nota.updatedAt,
    } as NotaNoBackup
  })

  return {
    app: 'draftab',
    version: VERSAO,
    exportedAt: typeof dados.exportedAt === 'number' ? dados.exportedAt : 0,
    settings: (ehObjeto(dados.settings) ? dados.settings : {}) as Configuracoes,
    notes: notas,
  }
}

// As notas como ficam guardadas: restauradas a partir de doc (markdown é ignorado)
export function notasDoBackup(backup: Backup): Nota[] {
  return backup.notes.map(({ markdown: _markdown, ...nota }) => nota)
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
