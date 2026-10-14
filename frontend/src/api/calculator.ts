export type BinaryOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'percentage'

export type UnaryOperation = 'sqrt'

export type Operation = BinaryOperation | UnaryOperation

export type CalculationInput =
  | { operation: BinaryOperation; a: number; b: number }
  | { operation: UnaryOperation; a: number }

const SERVER_ERROR_CODES = [
  'INVALID_REQUEST',
  'MISSING_OPERAND',
  'PAYLOAD_TOO_LARGE',
  'UNKNOWN_OPERATION',
  'DIVISION_BY_ZERO',
  'NEGATIVE_SQRT',
  'NON_FINITE_RESULT',
  'INTERNAL_ERROR',
] as const

type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number]

export type ErrorCode = ServerErrorCode | 'NETWORK_ERROR' | 'UNEXPECTED_RESPONSE'

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const API_BASE = '/api/v1'

export function isUnaryOperation(operation: Operation): operation is UnaryOperation {
  return operation === 'sqrt'
}

export async function calculate(input: CalculationInput): Promise<number> {
  const { operation, ...operands } = input

  let response: Response
  try {
    response = await fetch(`${API_BASE}/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operands),
    })
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach the server. Check that the backend is running.',
      0,
    )
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (isErrorResponse(body)) {
      throw new ApiError(toErrorCode(body.error.code), body.error.message, response.status)
    }
    throw new ApiError(
      'UNEXPECTED_RESPONSE',
      `Unexpected server response (HTTP ${response.status})`,
      response.status,
    )
  }

  if (!isCalculationResponse(body)) {
    throw new ApiError('UNEXPECTED_RESPONSE', 'Server returned an invalid result', response.status)
  }

  return body.result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isErrorResponse(body: unknown): body is { error: { code: string; message: string } } {
  return (
    isRecord(body) &&
    isRecord(body.error) &&
    typeof body.error.code === 'string' &&
    typeof body.error.message === 'string'
  )
}

function isCalculationResponse(body: unknown): body is { result: number } {
  return isRecord(body) && typeof body.result === 'number'
}

function toErrorCode(code: string): ErrorCode {
  return (SERVER_ERROR_CODES as readonly string[]).includes(code)
    ? (code as ServerErrorCode)
    : 'UNEXPECTED_RESPONSE'
}