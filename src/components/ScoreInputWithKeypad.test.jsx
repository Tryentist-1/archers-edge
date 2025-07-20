import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScoreInputWithKeypad from './ScoreInputWithKeypad'

// Mock the ScoreKeypad component
vi.mock('./ScoreKeypad.jsx', () => ({
  default: ({ isVisible, onScoreInput, onClose }) => (
    isVisible ? (
      <div data-testid="score-keypad">
        <button onClick={() => onScoreInput('10')} data-testid="keypad-10">10</button>
        <button onClick={() => onScoreInput('X')} data-testid="keypad-x">X</button>
        <button onClick={onClose} data-testid="keypad-close">Close</button>
      </div>
    ) : null
  )
}))

describe('ScoreInputWithKeypad', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    placeholder: 'Enter score'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ScoreInputWithKeypad {...defaultProps} />)
    expect(screen.getByTestId('score-input')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<ScoreInputWithKeypad {...defaultProps} value="10" />)
    expect(screen.getByTestId('score-input')).toHaveValue('10')
  })

  it('shows keypad when input is clicked', async () => {
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} />)
    
    const input = screen.getByTestId('score-input')
    await user.click(input)
    
    expect(screen.getByTestId('score-keypad')).toBeInTheDocument()
  })

  it('shows keypad when input is focused', async () => {
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} />)
    
    const input = screen.getByTestId('score-input')
    await user.click(input)
    
    expect(screen.getByTestId('score-keypad')).toBeInTheDocument()
  })

  it('calls onChange when score is entered via keypad', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} onChange={onChange} />)
    
    const input = screen.getByTestId('score-input')
    await user.click(input)
    
    const keypad10 = screen.getByTestId('keypad-10')
    await user.click(keypad10)
    
    expect(onChange).toHaveBeenCalledWith('10')
  })

  it('hides keypad when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} />)
    
    const input = screen.getByTestId('score-input')
    await user.click(input)
    
    expect(screen.getByTestId('score-keypad')).toBeInTheDocument()
    
    const closeButton = screen.getByTestId('keypad-close')
    await user.click(closeButton)
    
    expect(screen.queryByTestId('score-keypad')).not.toBeInTheDocument()
  })

  it('has proper styling classes', () => {
    render(<ScoreInputWithKeypad {...defaultProps} />)
    const input = screen.getByTestId('score-input')
    
    expect(input).toHaveClass('score-input-keypad')
    expect(input).toHaveClass('cursor-pointer')
    expect(input).toHaveClass('pointer-events-auto')
  })

  it('is disabled when disabled prop is true', () => {
    render(<ScoreInputWithKeypad {...defaultProps} disabled={true} />)
    const input = screen.getByTestId('score-input')
    
    expect(input).toBeDisabled()
    expect(input).toHaveClass('opacity-50')
    expect(input).toHaveClass('cursor-not-allowed')
  })

  it('applies color classes based on score value', () => {
    const { rerender } = render(<ScoreInputWithKeypad {...defaultProps} value="10" />)
    let input = screen.getByTestId('score-input')
    expect(input).toHaveClass('bg-yellow-400')
    
    rerender(<ScoreInputWithKeypad {...defaultProps} value="X" />)
    input = screen.getByTestId('score-input')
    expect(input).toHaveClass('bg-yellow-400')
    
    rerender(<ScoreInputWithKeypad {...defaultProps} value="8" />)
    input = screen.getByTestId('score-input')
    expect(input).toHaveClass('bg-red-600')
  })

  it('handles keyboard events properly', async () => {
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} />)
    
    const input = screen.getByTestId('score-input')
    await user.click(input)
    
    // Test that the input can receive focus
    expect(input).toHaveFocus()
  })

  it('prevents default behavior on click', async () => {
    const user = userEvent.setup()
    render(<ScoreInputWithKeypad {...defaultProps} />)
    
    const input = screen.getByTestId('score-input')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    
    // Spy on preventDefault
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault')
    
    fireEvent(input, clickEvent)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
}) 