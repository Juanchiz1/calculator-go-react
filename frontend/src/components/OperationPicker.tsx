import type { Operation } from '../api/calculator'
import { OPERATION_INFO, OPERATIONS } from '../lib/operations'
import './OperationPicker.css'

interface OperationPickerProps {
  value: Operation
  onChange: (operation: Operation) => void
}

export function OperationPicker({ value, onChange }: OperationPickerProps) {
  return (
    <fieldset className="operations">
      <legend className="operations__legend">Operation</legend>
      <div className="operations__grid">
        {OPERATIONS.map((operation) => {
          const info = OPERATION_INFO[operation]
          return (
            <label key={operation} className="operations__option">
              <input
                type="radio"
                name="operation"
                className="operations__radio"
                value={operation}
                checked={value === operation}
                onChange={() => onChange(operation)}
              />
              <span className="operations__symbol" aria-hidden="true">
                {info.symbol}
              </span>
              <span className="operations__name">{info.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}