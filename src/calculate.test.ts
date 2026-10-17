import { describe, expect, test } from 'vitest'
import { calculate, calculationRegex, isDecimalSeparator, resolveSeparator } from './calculate'

describe('calculate', () => {
  test('the four operations, with the usual precedence', () => {
    expect(calculate('2*5', '.')).toBe('10')
    expect(calculate('2+3*4', '.')).toBe('14')
    expect(calculate('10-4/2', '.')).toBe('8')
    expect(calculate('(2+3)*4', '.')).toBe('20')
    expect(calculate('2*(3+(4-1))', '.')).toBe('12')
    expect(calculate('8/2/2', '.')).toBe('2')
    expect(calculate('10-2-3', '.')).toBe('5')
  })

  test('signs', () => {
    expect(calculate('-2*3', '.')).toBe('-6')
    expect(calculate('2*-3', '.')).toBe('-6')
    expect(calculate('-(2+3)*2', '.')).toBe('-10')
    expect(calculate('2--3', '.')).toBe('5')
    expect(calculate('+2+3', '.')).toBe('5')
  })

  test('power with "^" or "**"', () => {
    expect(calculate('2^10', '.')).toBe('1024')
    expect(calculate('2**3', '.')).toBe('8')
    expect(calculate('2^3^2', '.')).toBe('512')
    expect(calculate('2**3**2', '.')).toBe('512')
    expect(calculate('-2^2', '.')).toBe('-4')
    expect(calculate('(-2)^2', '.')).toBe('4')
    expect(calculate('2^-1', '.')).toBe('0.5')
    expect(calculate('2**-1', '.')).toBe('0.5')
    expect(calculate('2*3^2', '.')).toBe('18')
    expect(calculate('(1+1)^(1+2)', '.')).toBe('8')
    expect(calculate('0^0', '.')).toBe('1')
    expect(calculate('9^0,5', ',')).toBe('3')
    expect(calculate('2^100', '.')).toBe('1.26765060023e+30')
  })

  test('remainder with "%"', () => {
    expect(calculate('7%3', '.')).toBe('1')
    expect(calculate('-7%3', '.')).toBe('-1')
    expect(calculate('7%-3', '.')).toBe('1')
    expect(calculate('10-7%4', '.')).toBe('7')
    expect(calculate('20/5%3', '.')).toBe('1')
    expect(calculate('5.5%2', '.')).toBe('1.5')
    expect(calculate('5,5%2', ',')).toBe('1,5')
    expect(calculate('2^3%5', '.')).toBe('3')
  })

  test('decimals with "."', () => {
    expect(calculate('0.1+0.2', '.')).toBe('0.3')
    expect(calculate('10/4', '.')).toBe('2.5')
    expect(calculate('1/3', '.')).toBe('0.333333333333')
    expect(calculate('1,5+1', '.')).toBeNull()
  })

  test('decimals with ","', () => {
    expect(calculate('0,1+0,2', ',')).toBe('0,3')
    expect(calculate('10/4', ',')).toBe('2,5')
    expect(calculate('1.5+1', ',')).toBeNull()
  })

  test('no thousands separators in the result', () => {
    expect(calculate('1000*1000', '.')).toBe('1000000')
    expect(calculate('1234,5*2', ',')).toBe('2469')
  })

  test('nothing when it is not a calculation', () => {
    expect(calculate('5', '.')).toBeNull()
    expect(calculate('-5', '.')).toBeNull()
    expect(calculate('(5)', '.')).toBeNull()
    expect(calculate('1/0', '.')).toBeNull()
    expect(calculate('0/0', '.')).toBeNull()
    expect(calculate('(2+3', '.')).toBeNull()
    expect(calculate('2+3)', '.')).toBeNull()
    expect(calculate('2+', '.')).toBeNull()
    expect(calculate('2***3', '.')).toBeNull()
    expect(calculate('2^', '.')).toBeNull()
    expect(calculate('^2', '.')).toBeNull()
    expect(calculate('2%', '.')).toBeNull()
    expect(calculate('200*10%', '.')).toBeNull()
    expect(calculate('7%0', '.')).toBeNull()
    expect(calculate('(-8)^0.5', '.')).toBeNull()
    expect(calculate('0^-1', '.')).toBeNull()
    expect(calculate('10^400', '.')).toBeNull()
    expect(calculate('1.2.3+1', '.')).toBeNull()
    expect(calculate('2.+1', '.')).toBeNull()
    expect(calculate('()', '.')).toBeNull()
  })
})

describe('calculationRegex', () => {
  const expression = (text: string) => text.match(calculationRegex)?.[1] ?? null

  test('an expression without spaces right before "="', () => {
    expect(expression('2*5=')).toBe('2*5')
    expect(expression('total 2*5=')).toBe('2*5')
    expect(expression('(2+3)*4=')).toBe('(2+3)*4')
    expect(expression('2^10=')).toBe('2^10')
    expect(expression('2**3=')).toBe('2**3')
    expect(expression('7%3=')).toBe('7%3')
  })

  test('not glued to other text, and not with spaces', () => {
    expect(expression('a2*5=')).toBeNull()
    expect(expression('x=2*5=')).toBeNull()
    expect(expression('2*5=10=')).toBeNull()
    expect(expression('2 * 5=')).toBe('5') // only "5": no operation, so calculate gives nothing
    expect(calculate('5', '.')).toBeNull()
  })
})

test('decimal separator setting', () => {
  expect(isDecimalSeparator('auto')).toBe(true)
  expect(isDecimalSeparator(',')).toBe(true)
  expect(isDecimalSeparator(';')).toBe(false)
  expect(resolveSeparator('.', 'pt-BR')).toBe('.')
  expect(resolveSeparator(',', 'en')).toBe(',')
  expect(resolveSeparator('auto', 'pt-BR')).toBe(',')
  expect(resolveSeparator('auto', 'en')).toBe('.')
})
