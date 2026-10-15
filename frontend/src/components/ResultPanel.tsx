import type { Outcome } from '../hooks/useCalculator'
import './ResultPanel.css'

export function ResultPanel({ outcome }: { outcome: Outcome }) {
  return (
    <section className="result" aria-live="polite" aria-label="Result">
      {outcome.status === 'idle' && (
        <p className="result__placeholder">Enter your numbers and press Calculate.</p>
      )}
      {outcome.status === 'loading' && <p className="result__placeholder">Calculating…</p>}
      {outcome.status === 'success' && (
        <>
          <p className="result__expression">{outcome.expression} =</p>
          <output className="result__value">{outcome.value}</output>
        </>
      )}
      {outcome.status === 'error' && <p className="result__error">{outcome.message}</p>}
    </section>
  )
}