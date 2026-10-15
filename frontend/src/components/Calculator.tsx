import { isUnaryOperation } from '../api/calculator'
import { useCalculator } from '../hooks/useCalculator'
import { OPERATION_INFO } from '../lib/operations'
import { OperandField } from './OperandField'
import { OperationPicker } from './OperationPicker'
import { ResultPanel } from './ResultPanel'
import './Calculator.css'

export function Calculator() {
  const { operation, values, fieldErrors, outcome, updateField, selectOperation, submit } =
    useCalculator()

  const info = OPERATION_INFO[operation]
  const isLoading = outcome.status === 'loading'

  return (
    <form
      className="calculator"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <OperandField
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

      <button type="submit" className="calculator__submit" disabled={isLoading}>
        {isLoading ? 'Calculating…' : 'Calculate'}
      </button>

      <ResultPanel outcome={outcome} />
    </form>
  )
}