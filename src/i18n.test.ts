import { afterEach, describe, expect, test } from 'vitest'
import { currentLanguage, MESSAGES, resolveLanguage, t, tn, useLanguage } from './i18n'

afterEach(() => useLanguage('en'))

describe('resolveLanguage', () => {
  test('automatic follows the browser: any Portuguese is Portuguese, the rest English', () => {
    expect(resolveLanguage('auto', 'pt-BR')).toBe('pt')
    expect(resolveLanguage('auto', 'pt-PT')).toBe('pt')
    expect(resolveLanguage('auto', 'en-US')).toBe('en')
    expect(resolveLanguage('auto', 'es')).toBe('en')
  })

  test('a chosen language ignores the browser', () => {
    expect(resolveLanguage('en', 'pt-BR')).toBe('en')
    expect(resolveLanguage('pt', 'en-US')).toBe('pt')
  })
})

describe('dictionaries', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

  test('Portuguese has the same placeholders as English in every text', () => {
    for (const [key, english] of Object.entries(MESSAGES.en)) {
      expect(placeholders(MESSAGES.pt[key as keyof typeof MESSAGES.en]), key).toEqual(placeholders(english))
    }
  })

  test('no text is left empty', () => {
    for (const language of ['en', 'pt'] as const) {
      for (const [key, text] of Object.entries(MESSAGES[language])) expect(text.trim(), `${language} ${key}`).not.toBe('')
    }
  })
})

describe('t and tn', () => {
  test('fill in the values, in the language in use', () => {
    expect(t('confirmDeleteNote', { title: 'Ideas' })).toBe('Delete the note "Ideas"? This can\'t be undone.')
    useLanguage('pt')
    expect(currentLanguage()).toBe('pt')
    expect(t('confirmDeleteNote', { title: 'Ideias' })).toBe('Apagar a nota "Ideias"? Isso não pode ser desfeito.')
  })

  test('singular for 1, plural otherwise (0 too), with the number in the language format', () => {
    useLanguage('pt')
    expect(tn('imported', 1)).toBe('1 nota importada.')
    expect(tn('imported', 0)).toBe('0 notas importadas.')
    expect(tn('characters', 1234)).toBe('1.234 caracteres')
    useLanguage('en')
    expect(tn('characters', 1)).toBe('1 character')
    expect(tn('characters', 1234)).toBe('1,234 characters')
  })
})
