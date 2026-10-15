import { useState } from 'react'
import { calculate, type Operation } from '../api/calculator'
import { describeError } from '../lib/errors'
import { formatExpression, formatNumber } from '../lib/format'
import { validateForm, type FieldErrors } from '../lib/validation'

export type Outcome =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; expression: string; value: string }
  | { status: 'error'; message: string }

type Field = 'a' | 'b'

export function useCalculator() {
  const [operation, setOperation] = useState<Operation>('add')
  const [values, setValues] = useState<Record<Field, string>>({ a: '', b: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [outcome, setOutcome] = useState<Outcome>({ status: 'idle' })

  function updateField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  function selectOperation(next: Operation) {
    setOperation(next)
    setFieldErrors({})
  }

  function reset() {
    setValues({ a: '', b: '' })
    setFieldErrors({})
    setOutcome({ status: 'idle' })
  }

  async function submit() {
    const validation = validateForm(operation, values.a, values.b)
    if (!validation.ok) {
      setFieldErrors(validation.errors)
      return
    }

    setFieldErrors({})
    setOutcome({ status: 'loading' })

    try {
      const result = await calculate(validation.input)
      setOutcome({
        status: 'success',
        expression: formatExpression(validation.input),
        value: formatNumber(result),
      })
    } catch (error) {
      setOutcome({ status: 'error', message: describeError(error) })
    }
  }

  return { operation, values, fieldErrors, outcome, updateField, selectOperation, submit, reset }
}