import { describe, expect, test } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import {
  comTituloAtualizado,
  filtrarNotas,
  notaVazia,
  novaNotaEmBranco,
  primeiraLinha,
  renomeada,
  textoDe,
  type Nota,
} from './notas'

const texto = (t: string): JSONContent => ({ type: 'text', text: t })
const paragrafo = (t?: string): JSONContent => ({ type: 'paragraph', content: t ? [texto(t)] : undefined })
const doc = (...blocos: JSONContent[]): JSONContent => ({ type: 'doc', content: blocos })
const notaCom = (d: JSONContent, extra: Partial<Nota> = {}): Nota => ({ ...novaNotaEmBranco(), doc: d, ...extra })

describe('textoDe e primeiraLinha', () => {
  test('cada bloco vira uma linha, inclusive dentro de listas', () => {
    const d = doc(
      { type: 'heading', attrs: { level: 1 }, content: [texto('Ideias')] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragrafo('um')] }] },
    )
    expect(textoDe(d)).toBe('Ideias\num')
  })

  test('primeira linha pula blocos vazios', () => {
    expect(primeiraLinha(doc(paragrafo(), paragrafo('  oi  '), paragrafo('depois')))).toBe('oi')
  })

  test('primeira linha de nota vazia é texto vazio', () => {
    expect(primeiraLinha(doc(paragrafo()))).toBe('')
  })

  test('primeira linha é limitada a 80 caracteres', () => {
    expect(primeiraLinha(doc(paragrafo('a'.repeat(200))))).toHaveLength(80)
  })
})

describe('título', () => {
  test('automático acompanha a primeira linha', () => {
    const nota = notaCom(doc(paragrafo('novo começo')), { title: 'velho' })
    expect(comTituloAtualizado(nota).title).toBe('novo começo')
  })

  test('renomeado fica fixo mesmo se o texto mudar', () => {
    const nota = renomeada(notaCom(doc(paragrafo('texto'))), '  Meu título ')
    expect(nota).toMatchObject({ title: 'Meu título', titleManual: true })
    const editada = comTituloAtualizado({ ...nota, doc: doc(paragrafo('outro texto')) })
    expect(editada.title).toBe('Meu título')
  })

  test('renomear para vazio volta ao automático', () => {
    const nota = renomeada(notaCom(doc(paragrafo('primeira')), { title: 'X', titleManual: true }), '   ')
    expect(nota).toMatchObject({ title: 'primeira', titleManual: false })
  })
})

describe('notaVazia', () => {
  test('sem texto e sem título dado pelo usuário', () => {
    expect(notaVazia(notaCom(doc(paragrafo(), paragrafo())))).toBe(true)
  })

  test('com texto não é vazia', () => {
    expect(notaVazia(notaCom(doc(paragrafo('a'))))).toBe(false)
  })

  test('sem texto mas renomeada não é vazia', () => {
    expect(notaVazia(notaCom(doc(paragrafo()), { title: 'Lista', titleManual: true }))).toBe(false)
  })
})

describe('filtrarNotas', () => {
  const notas = [
    notaCom(doc(paragrafo('Reunião de segunda')), { title: 'Reunião de segunda' }),
    notaCom(doc(paragrafo('Compras'), paragrafo('pão e café')), { title: 'Compras' }),
  ]

  test('busca vazia devolve todas', () => {
    expect(filtrarNotas(notas, '  ')).toHaveLength(2)
  })

  test('acha pelo título sem diferenciar maiúsculas nem acentos', () => {
    expect(filtrarNotas(notas, 'REUNIAO').map((n) => n.title)).toEqual(['Reunião de segunda'])
  })

  test('acha pelo conteúdo', () => {
    expect(filtrarNotas(notas, 'cafe').map((n) => n.title)).toEqual(['Compras'])
  })

  test('sem resultado', () => {
    expect(filtrarNotas(notas, 'xyz')).toEqual([])
  })
})
