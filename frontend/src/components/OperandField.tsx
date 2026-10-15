import type { Ref } from 'react'
import './OperandField.css'

interface OperandFieldProps {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export function OperandField({ id, label, value, error, onChange, ref }: OperandFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className="field__input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <p id={errorId} className="field__error" role="alert">
        {error}
      </p>
    </div>
  )
}