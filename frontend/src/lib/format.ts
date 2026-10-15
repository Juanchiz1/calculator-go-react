import type { CalculationInput } from '../api/calculator'
import { OPERATION_INFO } from './operations'

// float64 holds 15–17 significant digits; rounding to 15 hides binary
// noise like 0.1 + 0.2 = 0.30000000000000004 without losing real precision.
const SIGNIFICANT_DIGITS = 15

export function formatNumber(value: number): string {
  return Number.parseFloat(value.toPrecision(SIGNIFICANT_DIGITS)).toString()
}

export function formatExpression(input: CalculationInput): string {
  const a = formatNumber(input.a)

  if (input.operation === 'sqrt') {
    return `√${a}`
  }

  const b = formatNumber(input.b)

  if (input.operation === 'percentage') {
    return `${a}% of ${b}`
  }
  if (input.operation === 'power') {
    return `${a}^${b}`
  }
  return `${a} ${OPERATION_INFO[input.operation].symbol} ${b}`
}