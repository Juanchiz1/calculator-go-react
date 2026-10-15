import { describe, expect, it } from 'vitest'
import type { CalculationInput } from '../api/calculator'
import { formatExpression, formatNumber } from './format'

describe('formatNumber', () => {
  it.each<[number, string]>([
    [0.1 + 0.2, '0.3'],
    [2.5, '2.5'],
    [-3, '-3'],
    [1 / 3, '0.333333333333333'],
    [123456789012345, '123456789012345'],
    [1e21, '1e+21'],
    [-0, '0'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })
})

describe('formatExpression', () => {
  it.each<[CalculationInput, string]>([
    [{ operation: 'add', a: 2, b: 3 }, '2 + 3'],
    [{ operation: 'subtract', a: 5, b: -3 }, '5 − -3'],
    [{ operation: 'divide', a: 0.1, b: 0.2 }, '0.1 ÷ 0.2'],
    [{ operation: 'power', a: 2, b: 10 }, '2^10'],
    [{ operation: 'percentage', a: 20, b: 150 }, '20% of 150'],
    [{ operation: 'sqrt', a: 16 }, '√16'],
  ])('formats %j as %s', (input, expected) => {
    expect(formatExpression(input)).toBe(expected)
  })
})