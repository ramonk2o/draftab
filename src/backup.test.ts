import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { criarBackup, lerBackup, nomeDoArquivo, notasDoBackup } from './backup'
import { criarChromeFalso } from './chrome-falso'
import { novaNotaEmBranco, type Nota } from './notas'
import {
  aoImportar,
  lerConfiguracoes,
  listarNotas,
  salvarConfiguracoes,
  salvarNota,
  substituirTudo,
} from './storage'

const texto = (t: string, marcas?: JSONContent['marks']): JSONContent => ({ type: 'text', text: t, marks: marcas })
const paragrafo = (...c: JSONContent[]): JSONContent => ({ type: 'paragraph', content: c })

// Nota com vários tipos de bloco, para conferir a ida e volta sem perdas
function notaCompleta(): Nota {
  return {
    ...novaNotaEmBranco(),
    title: 'Ideias',
    titleManual: true,
    createdAt: 100,
    updatedAt: 200,
    doc: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [texto('Ideias')] },
        paragrafo(texto('um '), texto('negrito', [{ type: 'bold' }])),
        {
          type: 'taskList',
          content: [{ type: 'taskItem', attrs: { checked: true }, content: [paragrafo(texto('feito'))] }],
        },
        { type: 'horizontalRule' },
      ],
    },
  }
}

function notaSimples(t: string, updatedAt: number): Nota {
  return { ...novaNotaEmBranco(), title: t, updatedAt, doc: { type: 'doc', content: [paragrafo(texto(t))] } }
}

beforeEach(() => {
  vi.stubGlobal('chrome', criarChromeFalso())
})

describe('criarBackup', () => {
  test('segue o formato do SPEC e inclui o markdown de cada nota', () => {
    const backup = criarBackup([notaCompleta()], { autoBackupMinutes: 60, sidebarCollapsed: false }, 999)
    expect(backup).toMatchObject({ app: 'draftab', version: 1, exportedAt: 999 })
    expect(backup.settings).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: false })
    expect(backup.notes[0].markdown).toBe('# Ideias\n\num **negrito**\n\n- [x] feito\n\n---')
  })
})

describe('ida e volta', () => {
  test('exportar e importar devolve exatamente as mesmas notas', () => {
    const notas = [notaCompleta(), notaSimples('outra', 50)]
    const arquivo = JSON.stringify(criarBackup(notas, { autoBackupMinutes: 0, sidebarCollapsed: true }))
    expect(notasDoBackup(lerBackup(arquivo))).toEqual(notas)
  })

  test('pelo armazenamento: exportar, mudar tudo e importar restaura o estado', async () => {
    await salvarNota(notaCompleta())
    await salvarNota(notaSimples('segunda', 300))
    await salvarConfiguracoes({ autoBackupMinutes: 360 })
    const antes = await listarNotas()
    const arquivo = JSON.stringify(criarBackup(antes, await lerConfiguracoes()))

    // Depois do backup: apaga uma nota, cria outra, muda configuração
    await substituirTudo([notaSimples('nova depois do backup', 400)], { autoBackupMinutes: 0 })

    const backup = lerBackup(arquivo)
    await substituirTudo(notasDoBackup(backup), backup.settings)
    expect(await listarNotas()).toEqual(antes)
    expect((await lerConfiguracoes()).autoBackupMinutes).toBe(360)
  })
})

describe('lerBackup recusa arquivos inválidos', () => {
  const valido = () => criarBackup([notaSimples('a', 1)], { autoBackupMinutes: 0, sidebarCollapsed: false })
  const comNota = (mudanca: Record<string, unknown>) => {
    const b = valido()
    return JSON.stringify({ ...b, notes: [{ ...b.notes[0], ...mudanca }] })
  }

  test.each([
    ['texto que não é JSON', 'isto não é json', 'não é um JSON válido'],
    ['JSON de outro app', JSON.stringify({ app: 'outro', version: 1, notes: [] }), 'não é um backup do Draftab'],
    ['versão mais nova', JSON.stringify({ ...valido(), version: 2 }), 'versão mais nova'],
    ['sem lista de notas', JSON.stringify({ ...valido(), notes: 'x' }), 'não tem a lista de notas'],
    ['nota sem id', comNota({ id: '' }), 'não tem identificador'],
    ['nota sem datas', comNota({ updatedAt: 'ontem' }), 'não tem datas válidas'],
    ['doc que não é documento', comNota({ doc: { type: 'paragraph' } }), 'conteúdo inválido'],
    ['bloco desconhecido', comNota({ doc: { type: 'doc', content: [{ type: 'tabela' }] } }), 'conteúdo inválido'],
  ])('%s', (_nome, arquivo, mensagem) => {
    expect(() => lerBackup(arquivo)).toThrow(mensagem)
  })

  test('notas repetidas', () => {
    const b = valido()
    expect(() => lerBackup(JSON.stringify({ ...b, notes: [b.notes[0], b.notes[0]] }))).toThrow('repetida')
  })

  test('backup sem notas é válido', () => {
    expect(lerBackup(JSON.stringify(criarBackup([], { autoBackupMinutes: 0, sidebarCollapsed: false }))).notes).toEqual([])
  })
})

describe('importação no armazenamento', () => {
  test('substituirTudo remove notas que não estão no backup', async () => {
    await salvarNota(notaSimples('vai sumir', 1))
    await substituirTudo([notaSimples('fica', 2)], {})
    expect((await listarNotas()).map((n) => n.title)).toEqual(['fica'])
  })

  test('avisa as abas sobre a importação, mas não sobre gravações comuns', async () => {
    const aviso = vi.fn()
    aoImportar(aviso)
    await salvarNota(notaSimples('comum', 1))
    expect(aviso).not.toHaveBeenCalled()
    await substituirTudo([], {})
    expect(aviso).toHaveBeenCalledTimes(1)
  })
})

test('nome do arquivo no formato draftab_AAAA-MM-DD-HHhMM.json', () => {
  expect(nomeDoArquivo(new Date(2026, 9, 11, 15, 5))).toBe('draftab_2026-10-11-15h05.json')
  expect(nomeDoArquivo(new Date(2026, 0, 2, 9, 7))).toBe('draftab_2026-01-02-09h07.json')
})
