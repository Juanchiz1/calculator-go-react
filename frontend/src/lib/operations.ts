import type { Operation } from '../api/calculator'

interface OperationInfo {
  label: string
  symbol: string
  labelA: string
  labelB?: string
}

export const OPERATION_INFO: Record<Operation, OperationInfo> = {
  add: { label: 'Add', symbol: '+', labelA: 'First number', labelB: 'Second number' },
  subtract: { label: 'Subtract', symbol: '−', labelA: 'First number', labelB: 'Second number' },
  multiply: { label: 'Multiply', symbol: '×', labelA: 'First number', labelB: 'Second number' },
  divide: { label: 'Divide', symbol: '÷', labelA: 'First number', labelB: 'Second number' },
  power: { label: 'Power', symbol: 'xʸ', labelA: 'Base', labelB: 'Exponent' },
  sqrt: { label: 'Square root', symbol: '√', labelA: 'Number' },
  percentage: { label: 'Percentage', symbol: '%', labelA: 'Percent', labelB: 'Of number' },
}

export const OPERATIONS = Object.keys(OPERATION_INFO) as Operation[]