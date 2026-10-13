import { describe, expect, test } from 'vitest'
import { formatDate, isDateFormat, monthGrid, monthTitle, sameDay, weekdayInitials } from './calendar'

describe('monthGrid', () => {
  test('6 weeks of 7 days, starting on Sunday', () => {
    const weeks = monthGrid(2026, 9) // October 2026
    expect(weeks).toHaveLength(6)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
      expect(week[0].getDay()).toBe(0)
    }
  })

  test('fills the first week with the end of the previous month', () => {
    // October 1, 2026 is a Thursday: Sunday is September 27
    const first = monthGrid(2026, 9)[0]
    expect(first.map((d) => d.getDate())).toEqual([27, 28, 29, 30, 1, 2, 3])
    expect(first[0].getMonth()).toBe(8)
    expect(first[4].getMonth()).toBe(9)
  })

  test('a month starting on Sunday has no days of the previous month', () => {
    // February 1, 2026 is a Sunday
    const weeks = monthGrid(2026, 1)
    expect(sameDay(weeks[0][0], new Date(2026, 1, 1))).toBe(true)
    // 28 days = 4 weeks; the other 2 are March
    expect(sameDay(weeks[5][6], new Date(2026, 2, 14))).toBe(true)
  })

  test('crosses the year in December and January', () => {
    expect(sameDay(monthGrid(2026, 11)[5][6], new Date(2027, 0, 9))).toBe(true)
    expect(sameDay(monthGrid(2027, 0)[0][0], new Date(2026, 11, 27))).toBe(true)
  })
})

describe('formatDate', () => {
  const date = new Date(2026, 9, 13) // Tuesday

  test('numeric follows the language', () => {
    expect(formatDate(date, 'numeric', 'pt-BR')).toBe('13/10/2026')
    expect(formatDate(date, 'numeric', 'en')).toBe('10/13/2026')
  })

  test('ISO is the same in every language, with zeros', () => {
    expect(formatDate(date, 'iso', 'pt-BR')).toBe('2026-10-13')
    expect(formatDate(new Date(2026, 0, 5), 'iso', 'en')).toBe('2026-01-05')
  })

  test('short month, without the abbreviation dot', () => {
    expect(formatDate(date, 'short', 'pt-BR')).toBe('13 out 2026')
    expect(formatDate(date, 'short', 'en')).toBe('13 Oct 2026')
    expect(formatDate(new Date(2026, 4, 2), 'short', 'pt-BR')).toBe('2 mai 2026')
  })

  test('long, with the day of the week', () => {
    expect(formatDate(date, 'long', 'pt-BR')).toBe('terça-feira, 13 de outubro de 2026')
    expect(formatDate(date, 'long', 'en')).toBe('Tuesday, October 13, 2026')
  })
})

test('month title starts with a capital letter', () => {
  expect(monthTitle(2026, 9, 'pt-BR')).toBe('Outubro de 2026')
  expect(monthTitle(2026, 9, 'en')).toBe('October 2026')
})

test('weekday initials start on Sunday', () => {
  expect(weekdayInitials('en')).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S'])
  expect(weekdayInitials('pt-BR')).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S'])
})

test('isDateFormat', () => {
  expect(isDateFormat('long')).toBe(true)
  expect(isDateFormat('dd/mm')).toBe(false)
  expect(isDateFormat(undefined)).toBe(false)
})
