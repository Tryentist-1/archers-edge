import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultiArcherScoring from './MultiArcherScoring'

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    loading: false
  })
}))

// Mock Firebase
vi.mock('../config/firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn()
  }
}))

// Mock ScoreInputWithKeypad
vi.mock('./ScoreInputWithKeypad.jsx', () => ({
  default: ({ value, onChange, 'data-archer-id': archerId, 'data-arrow-index': arrowIndex }) => (
    <input
      data-testid={`score-input-${archerId}-${arrowIndex}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={() => onChange('10')} // Simulate keypad input
      className="score-input-keypad"
    />
  )
}))

describe('MultiArcherScoring', () => {
  const mockBaleData = {
    baleNumber: 1,
    archers: [
      {
        id: 'archer1',
        firstName: 'John',
        lastName: 'Doe',
        targetAssignment: 'A',
        scores: {
          end1: { arrow1: '', arrow2: '', arrow3: '' },
          end2: { arrow1: '', arrow2: '', arrow3: '' }
        }
      },
      {
        id: 'archer2',
        firstName: 'Jane',
        lastName: 'Smith',
        targetAssignment: 'B',
        scores: {
          end1: { arrow1: '', arrow2: '', arrow3: '' },
          end2: { arrow1: '', arrow2: '', arrow3: '' }
        }
      }
    ],
    currentEnd: 1,
    totalEnds: 12
  }

  const defaultProps = {
    baleData: mockBaleData,
    onViewCard: vi.fn(),
    onBaleDataUpdate: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    expect(screen.getByText('Bale 1 - End 1')).toBeInTheDocument()
  })

  it('displays all archers in the table', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    expect(screen.getByText('John D.')).toBeInTheDocument()
    expect(screen.getByText('Jane S.')).toBeInTheDocument()
  })

  it('displays score inputs for each archer', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    // Check that score inputs are rendered for each archer
    expect(screen.getByTestId('score-input-archer1-0')).toBeInTheDocument()
    expect(screen.getByTestId('score-input-archer1-1')).toBeInTheDocument()
    expect(screen.getByTestId('score-input-archer1-2')).toBeInTheDocument()
    expect(screen.getByTestId('score-input-archer2-0')).toBeInTheDocument()
    expect(screen.getByTestId('score-input-archer2-1')).toBeInTheDocument()
    expect(screen.getByTestId('score-input-archer2-2')).toBeInTheDocument()
  })

  it('allows navigation between ends', async () => {
    const user = userEvent.setup()
    render(<MultiArcherScoring {...defaultProps} />)
    
    // Should start at end 1
    expect(screen.getByText('Bale 1 - End 1')).toBeInTheDocument()
    
    // Click next end button
    const nextButton = screen.getByText('→')
    await user.click(nextButton)
    
    // Should now show end 2
    expect(screen.getByText('Bale 1 - End 2')).toBeInTheDocument()
  })

  it('disables navigation buttons appropriately', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    // At end 1, previous button should be disabled
    const prevButton = screen.getByText('←')
    expect(prevButton).toBeDisabled()
    
    // Next button should be enabled
    const nextButton = screen.getByText('→')
    expect(nextButton).not.toBeDisabled()
  })

  it('calls onViewCard when view button is clicked', async () => {
    const onViewCard = vi.fn()
    const user = userEvent.setup()
    render(<MultiArcherScoring {...defaultProps} onViewCard={onViewCard} />)
    
    const viewButtons = screen.getAllByText('View')
    await user.click(viewButtons[0]) // Click first archer's view button
    
    expect(onViewCard).toHaveBeenCalledWith('archer1')
  })

  it('displays bale totals section', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    expect(screen.getByText('Bale Totals:')).toBeInTheDocument()
    expect(screen.getByText('Score:')).toBeInTheDocument()
    expect(screen.getByText('10s:')).toBeInTheDocument()
    expect(screen.getByText('Xs:')).toBeInTheDocument()
  })

  it('calculates and displays totals correctly', () => {
    const baleDataWithScores = {
      ...mockBaleData,
      archers: [
        {
          ...mockBaleData.archers[0],
          scores: {
            end1: { arrow1: '10', arrow2: '9', arrow3: '8' },
            end2: { arrow1: '', arrow2: '', arrow3: '' }
          }
        },
        {
          ...mockBaleData.archers[1],
          scores: {
            end1: { arrow1: 'X', arrow2: '10', arrow3: '7' },
            end2: { arrow1: '', arrow2: '', arrow3: '' }
          }
        }
      ]
    }

    render(<MultiArcherScoring {...defaultProps} baleData={baleDataWithScores} />)
    
    // Should show totals for the current end (end1)
    expect(screen.getByText(/Score:/)).toBeInTheDocument()
    expect(screen.getByText(/54/)).toBeInTheDocument()
    expect(screen.getByText(/10s:/)).toBeInTheDocument()
    expect(screen.getByText(/2/)).toBeInTheDocument()
    expect(screen.getByText(/Xs:/)).toBeInTheDocument()
    expect(screen.getByText(/1/)).toBeInTheDocument()
    expect(screen.getByText(/Arrows:/)).toBeInTheDocument()
    expect(screen.getByText(/6/)).toBeInTheDocument()
  })

  it('handles score input changes', async () => {
    const user = userEvent.setup()
    render(<MultiArcherScoring {...defaultProps} />)
    
    const firstInput = screen.getByTestId('score-input-archer1-0')
    await user.click(firstInput)
    
    // The mock component should trigger onChange with '10'
    expect(firstInput).toHaveValue('10')
  })

  it('displays save status indicators', async () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    // Initially should not show save indicators
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
  })

  it('shows correct end navigation', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    expect(screen.getByText('1/12')).toBeInTheDocument()
  })

  it('displays archer information correctly', () => {
    render(<MultiArcherScoring {...defaultProps} />)
    
    // Should show shortened names
    expect(screen.getByText('John D.')).toBeInTheDocument()
    expect(screen.getByText('Jane S.')).toBeInTheDocument()
  })
}) 