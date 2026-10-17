import { Extension, InputRule } from '@tiptap/core'
import { locale } from './i18n'

// Calculations: typing "=" right after an expression writes the result ("2*5=" → "2*5=10").
// See "Calculations" in SPEC.md.

const DECIMAL_SEPARATORS = ['auto', '.', ','] as const
export type DecimalSeparatorSetting = (typeof DECIMAL_SEPARATORS)[number]
export type DecimalSeparator = '.' | ','

export function isDecimalSeparator(value: unknown): value is DecimalSeparatorSetting {
  return DECIMAL_SEPARATORS.includes(value as DecimalSeparatorSetting)
}

// "auto": the decimal separator of the interface language's number format (1,5 in Portuguese)
export function resolveSeparator(setting: DecimalSeparatorSetting, locale: string | undefined): DecimalSeparator {
  if (setting !== 'auto') return setting
  const parts = new Intl.NumberFormat(locale).formatToParts(1.5)
  return parts.find((part) => part.type === 'decimal')?.value === ',' ? ',' : '.'
}

// The result of an expression, written with the separator, or null when it isn't a
// valid calculation (no operation between two numbers, division by zero, wrong separator…)
export function calculate(expression: string, separator: DecimalSeparator): string | null {
  // The pieces: numbers, "**" and single characters (operators and parentheses)
  const number = separator === '.' ? /^\d+(?:\.\d+)?/ : /^\d+(?:,\d+)?/
  const tokens: string[] = []
  let rest = expression
  while (rest) {
    const found = rest.match(number)?.[0] ?? (rest.startsWith('**') ? '**' : rest[0])
    if (!/^[\d+\-*/()^%]/.test(found)) return null // a letter, a space, the other separator…
    tokens.push(found)
    rest = rest.slice(found.length)
  }

  let position = 0
  let operations = 0 // operations between two numbers (at least one is needed)

  // sum := product (("+" | "-") product)*
  function sum(): number {
    let value = product()
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++]
      const right = product()
      value = operator === '+' ? value + right : value - right
      operations++
    }
    return value
  }

  // product := factor (("*" | "/" | "%") factor)*
  function product(): number {
    let value = factor()
    while (tokens[position] === '*' || tokens[position] === '/' || tokens[position] === '%') {
      const operator = tokens[position++]
      const right = factor()
      if (operator === '*') value = value * right
      else if (operator === '/') value = value / right
      else value = value % right // the sign of the first number: -7%3 = -1
      operations++
    }
    return value
  }

  // factor := ("+" | "-") factor | power
  // The sign comes after the power: -2^2 = -(2^2) = -4
  function factor(): number {
    if (tokens[position] === '-') {
      position++
      return -factor()
    }
    if (tokens[position] === '+') {
      position++
      return factor()
    }
    return power()
  }

  // power := primary (("^" | "**") factor)?
  // The exponent is a factor, so it may have a sign (2^-1) and powers group from the right (2^3^2 = 2^9)
  function power(): number {
    const base = primary()
    if (tokens[position] !== '^' && tokens[position] !== '**') return base
    position++
    const exponent = factor()
    operations++
    return base ** exponent
  }

  // primary := number | "(" sum ")"
  function primary(): number {
    const token = tokens[position++]
    if (token === '(') {
      const value = sum()
      if (tokens[position++] !== ')') return NaN
      return value
    }
    if (token !== undefined && /^\d/.test(token)) return Number(token.replace(',', '.'))
    return NaN
  }

  const value = sum()
  if (position !== tokens.length || operations === 0 || !Number.isFinite(value)) return null
  // 12 significant digits hide floating-point noise (0.1+0.2 = 0.30000000000000004)
  const text = String(Number(value.toPrecision(12)))
  return separator === ',' ? text.replace('.', ',') : text
}

// An expression without spaces right before the "=" just typed, at the start of the
// line or after a space
export const calculationRegex = /(?<!\S)([\d.,+\-*/()^%]+)=$/

let enabled = true
let separator: DecimalSeparator = '.'

// Turned on or off in Settings (applied when it changes, in every tab)
export function setCalculationsEnabled(on: boolean) {
  enabled = on
}

// Chosen in Settings (applied when it changes, in every tab)
export function setDecimalSeparator(setting: DecimalSeparatorSetting) {
  separator = resolveSeparator(setting, locale())
}

export const Calculations = Extension.create({
  name: 'calculations',
  addInputRules() {
    return [
      new InputRule({
        find: calculationRegex,
        // The "=" is already in the note; the result goes right after it.
        // Tiptap doesn't run input rules in code, and Backspace right after undoes it.
        handler: ({ state, range, match }) => {
          if (!enabled) return null
          const result = calculate(match[1], separator)
          if (result === null) return null
          state.tr.insertText(result, range.to)
        },
      }),
    ]
  },
})
