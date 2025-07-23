import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Firebase
global.firebase = {
  auth: vi.fn(() => ({
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  })),
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      add: vi.fn(),
      where: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  })),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Test utilities
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  id: 'test-profile-id',
  firstName: 'Test',
  lastName: 'User',
  role: 'Archer',
  profileType: 'Compound',
  dominantHand: 'Right',
  dominantEye: 'Right',
  bowWeight: '45',
  drawLength: '28',
  usArcheryNumber: '',
  nfaaNumber: '',
  defaultClassification: 'Varsity',
  sponsorships: '',
  userId: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockBaleData = (overrides = {}) => ({
  id: 'test-bale-id',
  baleNumber: 1,
  currentEnd: 1,
  totalEnds: 12,
  archers: [
    {
      id: 'test-profile-id',
      firstName: 'Test',
      lastName: 'User',
      scores: [],
    },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Helper to reset all mocks between tests
export const resetMocks = () => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
}; 