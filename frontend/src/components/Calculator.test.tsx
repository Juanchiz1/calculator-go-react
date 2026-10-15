import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../test/http'
import { Calculator } from './Calculator'

describe('Calculator', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  function setup() {
    const user = userEvent.setup()
    render(<Calculator />)
    return { user }
  }

  it('calculates and shows the expression with its result', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'divide', result: 2.5 }))
    const { user } = setup()

    await user.type(screen.getByLabelText('First number'), '10')
    await user.click(screen.getByRole('radio', { name: 'Divide' }))
    await user.type(screen.getByLabelText('Second number'), '4')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByText('10 ÷ 4 =')).toBeInTheDocument()
    expect(screen.getByText('2.5')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/divide',
      expect.objectContaining({ body: JSON.stringify({ a: 10, b: 4 }) }),
    )
  })

  it('submits with the Enter key', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'add', result: 3 }))
    const { user } = setup()

    await user.type(screen.getByLabelText('First number'), '1')
    await user.type(screen.getByLabelText('Second number'), '2{Enter}')

    expect(await screen.findByText('1 + 2 =')).toBeInTheDocument()
  })

  it('shows field errors and skips the API call when inputs are invalid', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    const first = screen.getByLabelText('First number')
    const second = screen.getByLabelText('Second number')
    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(first).toHaveAccessibleDescription('Enter a number.')
    expect(second).toHaveAccessibleDescription('Enter a number.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears a field error as soon as the user types in that field', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await user.type(screen.getByLabelText('First number'), '5')

    expect(screen.getByLabelText('First number')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('Second number')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a friendly message when the API rejects the operation', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'DIVISION_BY_ZERO', message: 'division by zero is not allowed' } },
        422,
      ),
    )
    const { user } = setup()

    await user.type(screen.getByLabelText('First number'), '1')
    await user.click(screen.getByRole('radio', { name: 'Divide' }))
    await user.type(screen.getByLabelText('Second number'), '0')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByText("You can't divide by zero.")).toBeInTheDocument()
  })

  it('uses a single operand for square root', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'sqrt', result: 4 }))
    const { user } = setup()

    await user.click(screen.getByRole('radio', { name: 'Square root' }))

    expect(screen.queryByLabelText('Second number')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Number'), '16')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByText('√16 =')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sqrt',
      expect.objectContaining({ body: JSON.stringify({ a: 16 }) }),
    )
  })

  it('disables both buttons while a request is in flight', async () => {
    let respond!: (response: Response) => void
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve
      }),
    )
    const { user } = setup()

    await user.type(screen.getByLabelText('First number'), '1')
    await user.type(screen.getByLabelText('Second number'), '2')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(screen.getByRole('button', { name: 'Calculating…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()

    respond(jsonResponse({ operation: 'add', result: 3 }))

    expect(await screen.findByRole('button', { name: 'Calculate' })).toBeEnabled()
  })

  it('clears inputs and result, then focuses the first field', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ operation: 'add', result: 3 }))
    const { user } = setup()

    await user.type(screen.getByLabelText('First number'), '1')
    await user.type(screen.getByLabelText('Second number'), '2')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await screen.findByText('1 + 2 =')

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    const first = screen.getByLabelText('First number')
    expect(first).toHaveValue('')
    expect(screen.getByLabelText('Second number')).toHaveValue('')
    expect(screen.getByText('Enter your numbers and press Calculate.')).toBeInTheDocument()
    expect(first).toHaveFocus()
  })
})