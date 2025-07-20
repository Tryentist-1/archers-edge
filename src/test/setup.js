import '@testing-library/jest-dom'

// Mock Firebase
vi.mock('./config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn()
  },
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

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} 