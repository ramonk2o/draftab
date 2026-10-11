import { beforeEach, describe, expect, test, vi } from 'vitest'
import { criarChromeFalso } from './chrome-falso'
import { novaNotaEmBranco, type Nota } from './notas'
import {
  aoMudarNotas,
  excluirTodasAsNotas,
  intervaloValido,
  excluirNota,
  lerConfiguracoes,
  lerMeta,
  lerNota,
  listarNotas,
  salvarConfiguracoes,
  salvarNota,
} from './storage'

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

describe('intervalo do backup automático', () => {
  test('valores da lista ficam como estão', () => {
    for (const v of [0, 1, 60, 1440, 10080, 43200]) expect(intervaloValido(v)).toBe(v)
  })

  test('valores antigos viram o intervalo mais próximo, sem desligar', () => {
    expect(intervaloValido(360)).toBe(1440) // 6 h → diário
    expect(intervaloValido(720)).toBe(1440) // 12 h → diário
    expect(intervaloValido(5)).toBe(1)
    expect(intervaloValido(-3)).toBe(0)
  })

  test('configuração antiga gravada é lida já convertida', async () => {
    await chrome.storage.local.set({ settings: { autoBackupMinutes: 720, sidebarCollapsed: false } })
    expect((await lerConfiguracoes()).autoBackupMinutes).toBe(1440)
  })
})

describe('excluirTodasAsNotas', () => {
  test('apaga todas as notas e mantém as configurações', async () => {
    await salvarNota(notaCom('a', 1))
    await salvarNota(notaCom('b', 2))
    await salvarConfiguracoes({ autoBackupMinutes: 60, sidebarCollapsed: true })
    await excluirTodasAsNotas()
    expect(await listarNotas()).toEqual([])
    expect(await lerConfiguracoes()).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: true })
  })
})
