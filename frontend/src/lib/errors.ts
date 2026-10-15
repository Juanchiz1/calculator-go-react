import { ApiError, type ErrorCode } from '../api/calculator'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  DIVISION_BY_ZERO: "You can't divide by zero.",
  NEGATIVE_SQRT: 'Square root needs a number that is zero or greater.',
  NON_FINITE_RESULT: 'The result is too large or undefined.',
  NETWORK_ERROR: "Can't reach the server. Check that the backend is running.",
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? FALLBACK_MESSAGE
  }
  return FALLBACK_MESSAGE
}