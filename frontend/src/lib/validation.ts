import { isUnaryOperation, type CalculationInput, type Operation } from '../api/calculator'

export type ParsedOperand = { ok: true; value: number } | { ok: false; error: string }

export type FieldErrors = { a?: string; b?: string }

export type FormValidation =
  | { ok: true; input: CalculationInput }
  | { ok: false; errors: FieldErrors }

// Plain decimal or scientific notation. Rejects things Number() would
// happily accept, like "0x10", "Infinity" or "" (which becomes 0).
const NUMBER_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/

export function parseOperand(raw: string): ParsedOperand {
  const value = raw.trim()

  if (value === '') {
    return { ok: false, error: 'Enter a number.' }
  }
  if (value.includes(',')) {
    return { ok: false, error: 'Use a dot for decimals, without thousands separators.' }
  }
  if (!NUMBER_PATTERN.test(value)) {
    return { ok: false, error: 'Enter a valid number.' }
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: 'This number is too large.' }
  }

  return { ok: true, value: parsed }
}

export function validateForm(operation: Operation, rawA: string, rawB: string): FormValidation {
  const a = parseOperand(rawA)

  if (isUnaryOperation(operation)) {
    return a.ok
      ? { ok: true, input: { operation, a: a.value } }
      : { ok: false, errors: { a: a.error } }
  }

  const b = parseOperand(rawB)
  if (a.ok && b.ok) {
    return { ok: true, input: { operation, a: a.value, b: b.value } }
  }

  return {
    ok: false,
    errors: {
      a: a.ok ? undefined : a.error,
      b: b.ok ? undefined : b.error,
    },
  }
}