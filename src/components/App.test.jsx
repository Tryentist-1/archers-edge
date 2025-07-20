import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock the AuthContext
vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    loading: false
  }),
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}))

// Mock Firebase
vi.mock('./config/firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })

  it('shows header with app title', () => {
    render(<App />)
    expect(screen.getByText("Archer's Edge")).toBeInTheDocument()
  })

  it('shows test click button when authenticated', () => {
    render(<App />)
    expect(screen.getByText('Test Click')).toBeInTheDocument()
  })

  it('logs when test button is clicked', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<App />)
    
    const testButton = screen.getByText('Test Click')
    await user.click(testButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Test button clicked!')
    consoleSpy.mockRestore()
  })
}) 