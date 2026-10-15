import { describe, expect, it } from 'vitest'
import { parseOperand, validateForm } from './validation'

describe('parseOperand', () => {
  it.each<[string, number]>([
    ['42', 42],
    ['-3.5', -3.5],
    ['+7', 7],
    ['.5', 0.5],
    ['5.', 5],
    ['  12  ', 12],
    ['1e3', 1000],
    ['0', 0],
  ])('accepts %j', (raw, expected) => {
    expect(parseOperand(raw)).toEqual({ ok: true, value: expected })
  })

  it.each<[string, string]>([
    ['', 'Enter a number.'],
    ['   ', 'Enter a number.'],
    ['abc', 'Enter a valid number.'],
    ['1.2.3', 'Enter a valid number.'],
    ['0x10', 'Enter a valid number.'],
    ['Infinity', 'Enter a valid number.'],
    ['-', 'Enter a valid number.'],
    ['1,5', 'Use a dot for decimals, no commas.'],
    ['1,000', 'Use a dot for decimals, no commas.'],
    ['1e999', 'This number is too large.'],
  ])('rejects %j', (raw, message) => {
    expect(parseOperand(raw)).toEqual({ ok: false, error: message })
  })
})

describe('validateForm', () => {
  it('builds a binary input when both operands are valid', () => {
    expect(validateForm('divide', '10', '4')).toEqual({
      ok: true,
      input: { operation: 'divide', a: 10, b: 4 },
    })
  })

  it('ignores the second operand for sqrt', () => {
    expect(validateForm('sqrt', '16', 'not a number')).toEqual({
      ok: true,
      input: { operation: 'sqrt', a: 16 },
    })
  })

  it('reports errors for both operands at once', () => {
    expect(validateForm('add', '', 'abc')).toEqual({
      ok: false,
      errors: { a: 'Enter a number.', b: 'Enter a valid number.' },
    })
  })

  it('reports only the invalid operand', () => {
    expect(validateForm('add', '2', '')).toEqual({
      ok: false,
      errors: { b: 'Enter a number.' },
    })
  })

  it('reports an invalid operand for sqrt', () => {
    expect(validateForm('sqrt', 'x', '')).toEqual({
      ok: false,
      errors: { a: 'Enter a valid number.' },
    })
  })
    it('reports only the first operand when the second is valid', () => {
    expect(validateForm('add', 'abc', '4')).toEqual({
      ok: false,
      errors: { a: 'Enter a valid number.' },
    })
  })
})