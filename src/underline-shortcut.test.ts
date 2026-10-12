import { describe, expect, test } from 'vitest'
import { underlineInputRegex, underlinePasteRegex } from './underline-shortcut'

// What the shortcut would underline in a line typed so far (null: nothing)
const typed = (line: string) => line.match(underlineInputRegex)?.[2] ?? null
const pasted = (line: string) => [...line.matchAll(underlinePasteRegex)].map((m) => m[2])

describe('typing ++text++', () => {
  test('underlines the text between the marks', () => {
    expect(typed('++word++')).toBe('word')
    expect(typed('a note with ++two words++')).toBe('two words')
  })

  test('only when the closing ++ is typed', () => {
    expect(typed('++word+')).toBeNull()
    expect(typed('++word')).toBeNull()
  })

  test('not in the middle of a word or a sum', () => {
    expect(typed('c++word++')).toBeNull()
    expect(typed('1 ++ 2 ++')).toBeNull()
  })

  test('empty marks or spaces just inside them do nothing', () => {
    expect(typed('++++')).toBeNull()
    expect(typed('++ word++')).toBeNull()
    expect(typed('++word ++')).toBeNull()
  })

  test('one letter is enough', () => {
    expect(typed('++a++')).toBe('a')
  })
})

describe('pasting', () => {
  test('underlines every ++text++ in the pasted text', () => {
    expect(pasted('a ++b++ c ++d e++')).toEqual(['b', 'd e'])
  })

  test('leaves C++ and sums alone', () => {
    expect(pasted('I write C++ and c++ code, 1 ++ 2')).toEqual([])
  })
})
