import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate, isUnaryOperation } from './calculator'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('expected the promise to reject')
    },
    (error: unknown) => error,
  )
}

describe('calculate', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('posts both operands for a binary operation and returns the result', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'divide', result: 2.5 }))

    await expect(calculate({ operation: 'divide', a: 10, b: 4 })).resolves.toBe(2.5)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/divide',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ a: 10, b: 4 }),
      }),
    )
  })

  it('sends a single operand for sqrt', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'sqrt', result: 4 }))

    await calculate({ operation: 'sqrt', a: 16 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe(JSON.stringify({ a: 16 }))
  })

  it('turns a backend error into a typed ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'DIVISION_BY_ZERO', message: 'division by zero is not allowed' } },
        422,
      ),
    )

    const error = await captureError(calculate({ operation: 'divide', a: 1, b: 0 }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'DIVISION_BY_ZERO',
      status: 422,
      message: 'division by zero is not allowed',
    })
  })

  it('maps an unknown backend error code to UNEXPECTED_RESPONSE', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'SOMETHING_NEW', message: 'new error' } }, 400),
    )

    const error = await captureError(calculate({ operation: 'add', a: 1, b: 2 }))

    expect(error).toMatchObject({ code: 'UNEXPECTED_RESPONSE', status: 400 })
  })

  it('handles an error response that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Method Not Allowed', { status: 405 }))

    const error = await captureError(calculate({ operation: 'add', a: 1, b: 2 }))

    expect(error).toMatchObject({ code: 'UNEXPECTED_RESPONSE', status: 405 })
  })

  it('rejects a success response without a numeric result', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'add' }))

    const error = await captureError(calculate({ operation: 'add', a: 1, b: 2 }))

    expect(error).toMatchObject({ code: 'UNEXPECTED_RESPONSE' })
  })

  it('reports a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await captureError(calculate({ operation: 'add', a: 1, b: 2 }))

    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 })
  })
})

describe('isUnaryOperation', () => {
  it('identifies sqrt as the only unary operation', () => {
    expect(isUnaryOperation('sqrt')).toBe(true)
    expect(isUnaryOperation('add')).toBe(false)
  })
})