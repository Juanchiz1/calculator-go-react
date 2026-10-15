import { useRef } from 'react'
import { isUnaryOperation } from '../api/calculator'
import { useCalculator } from '../hooks/useCalculator'
import { OPERATION_INFO } from '../lib/operations'
import { OperandField } from './OperandField'
import { OperationPicker } from './OperationPicker'
import { ResultPanel } from './ResultPanel'
import './Calculator.css'

export function Calculator() {
  const { operation, values, fieldErrors, outcome, updateField, selectOperation, submit, reset } =
    useCalculator()
  const firstInputRef = useRef<HTMLInputElement>(null)

  const info = OPERATION_INFO[operation]
  const isLoading = outcome.status === 'loading'

  function handleClear() {
    reset()
    firstInputRef.current?.focus()
  }

  return (
    <form
      className="calculator"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <OperandField
        ref={firstInputRef}
        id="operand-a"
        label={info.labelA}
        value={values.a}
        error={fieldErrors.a}
        onChange={(value) => updateField('a', value)}
      />

      <OperationPicker value={operation} onChange={selectOperation} />

      {!isUnaryOperation(operation) && (
        <OperandField
          id="operand-b"
          label={info.labelB ?? 'Second number'}
          value={values.b}
          error={fieldErrors.b}
          onChange={(value) => updateField('b', value)}
        />
      )}

      <div className="calculator__actions">
        <button
          type="button"
          className="calculator__clear"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </button>
        <button type="submit" className="calculator__submit" disabled={isLoading}>
          {isLoading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      <ResultPanel outcome={outcome} />
    </form>
  )
}