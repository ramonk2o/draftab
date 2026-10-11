import { beforeEach, describe, expect, test, vi } from 'vitest'
import { novaNotaEmBranco, type Nota } from './notas'
import {
  aoMudarNotas,
  excluirNota,
  lerConfiguracoes,
  lerMeta,
  lerNota,
  listarNotas,
  salvarConfiguracoes,
  salvarNota,
} from './storage'

type Ouvinte = (mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }>, area: string) => void

// chrome.storage.local simulado em memória, copiando os valores como o Chrome faz
function criarChromeFalso() {
  const dados: Record<string, unknown> = {}
  const ouvintes: Ouvinte[] = []
  const avisar = (mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }>) =>
    ouvintes.forEach((ouvinte) => ouvinte(mudancas, 'local'))

  return {
    storage: {
      local: {
        async get(chaves: string | null) {
          if (chaves === null) return structuredClone(dados)
          return chaves in dados ? { [chaves]: structuredClone(dados[chaves]) } : {}
        },
        async set(itens: Record<string, unknown>) {
          const mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }> = {}
          for (const [chave, valor] of Object.entries(itens)) {
            mudancas[chave] = { oldValue: dados[chave], newValue: structuredClone(valor) }
            dados[chave] = structuredClone(valor)
          }
          avisar(mudancas)
        },
        async remove(chave: string) {
          const mudancas = { [chave]: { oldValue: dados[chave] } }
          delete dados[chave]
          avisar(mudancas)
        },
      },
      onChanged: {
        addListener: (ouvinte: Ouvinte) => ouvintes.push(ouvinte),
      },
    },
  }
}

function notaCom(texto: string, updatedAt: number): Nota {
  return {
    ...novaNotaEmBranco(),
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] },
    title: texto,
    updatedAt,
  }
}

beforeEach(() => {
  vi.stubGlobal('chrome', criarChromeFalso())
})

describe('notas', () => {
  test('salva e lê uma nota igual à original', async () => {
    const nota = notaCom('oi', 1)
    await salvarNota(nota)
    expect(await lerNota(nota.id)).toEqual(nota)
  })

  test('nota inexistente volta null', async () => {
    expect(await lerNota('nao-existe')).toBeNull()
  })

  test('lista da mais recente para a mais antiga, ignorando outras chaves', async () => {
    await salvarNota(notaCom('velha', 1))
    await salvarNota(notaCom('nova', 3))
    await salvarNota(notaCom('meio', 2))
    await salvarConfiguracoes({ sidebarCollapsed: true })
    const titulos = (await listarNotas()).map((n) => n.title)
    expect(titulos).toEqual(['nova', 'meio', 'velha'])
  })

  test('salvar de novo substitui a nota', async () => {
    const nota = notaCom('antes', 1)
    await salvarNota(nota)
    await salvarNota({ ...nota, title: 'depois', updatedAt: 2 })
    const notas = await listarNotas()
    expect(notas).toHaveLength(1)
    expect(notas[0].title).toBe('depois')
  })

  test('excluir remove a nota', async () => {
    const nota = notaCom('tchau', 1)
    await salvarNota(nota)
    await excluirNota(nota.id)
    expect(await lerNota(nota.id)).toBeNull()
    expect(await listarNotas()).toEqual([])
  })

  test('salvar e excluir registram a hora da última mudança', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const nota = notaCom('x', 1)
    await salvarNota(nota)
    expect((await lerMeta()).lastChangeAt).toBe(1000)
    vi.spyOn(Date, 'now').mockReturnValue(2000)
    await excluirNota(nota.id)
    expect((await lerMeta()).lastChangeAt).toBe(2000)
    vi.restoreAllMocks()
  })

  test('avisa mudanças de notas, com null quando excluída', async () => {
    const recebidas: { id: string; nota: Nota | null }[] = []
    aoMudarNotas((mudancas) => recebidas.push(...mudancas))
    const nota = notaCom('x', 1)
    await salvarNota(nota)
    await salvarConfiguracoes({ sidebarCollapsed: true }) // não é nota: não avisa
    await excluirNota(nota.id)
    expect(recebidas).toEqual([
      { id: nota.id, nota },
      { id: nota.id, nota: null },
    ])
  })
})

describe('configurações', () => {
  test('sem nada salvo, usa os valores padrão', async () => {
    expect(await lerConfiguracoes()).toEqual({ autoBackupMinutes: 0, sidebarCollapsed: false })
  })

  test('salvar uma parte mantém o resto', async () => {
    await salvarConfiguracoes({ autoBackupMinutes: 60 })
    await salvarConfiguracoes({ sidebarCollapsed: true })
    expect(await lerConfiguracoes()).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: true })
  })
})
