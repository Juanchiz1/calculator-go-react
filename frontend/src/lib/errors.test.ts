import { describe, expect, it } from 'vitest'
import { ApiError, type ErrorCode } from '../api/calculator'
import { describeError } from './errors'

const FALLBACK = 'Something went wrong. Please try again.'

describe('describeError', () => {
  it.each<[ErrorCode, string]>([
    ['DIVISION_BY_ZERO', "You can't divide by zero."],
    ['NEGATIVE_SQRT', 'Square root needs a number that is zero or greater.'],
    ['NON_FINITE_RESULT', 'The result is too large or undefined.'],
    ['NETWORK_ERROR', "Can't reach the server. Check that the backend is running."],
  ])('explains %s', (code, message) => {
    expect(describeError(new ApiError(code, 'server message', 422))).toBe(message)
  })

  it('uses a generic message for API errors the user cannot fix', () => {
    expect(describeError(new ApiError('INTERNAL_ERROR', 'boom', 500))).toBe(FALLBACK)
  })

  it('uses a generic message for unknown errors', () => {
    expect(describeError(new Error('boom'))).toBe(FALLBACK)
  })
})