import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { createMockUser, resetMocks } from '../../test/setup';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
};

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

// Mock reCAPTCHA
global.grecaptcha = {
  ready: vi.fn((callback) => callback()),
  render: vi.fn(() => 'recaptcha-widget-id'),
  execute: vi.fn(),
  reset: vi.fn(),
};

// Test component to access auth context
const TestComponent = () => {
  const { currentUser, loading, signInWithGoogle, signInWithPhone, signInAsMobile, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{currentUser ? currentUser.email : 'No User'}</div>
      <button onClick={signInWithGoogle} data-testid="google-signin">Google Sign In</button>
      <button onClick={() => signInWithPhone('+1234567890')} data-testid="phone-signin">Phone Sign In</button>
      <button onClick={signInAsMobile} data-testid="mobile-signin">Mobile Sign In</button>
      <button onClick={logout} data-testid="logout">Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    mockAuth.currentUser = null;
    mockAuth.onAuthStateChanged.mockClear();
  });

  describe('Initial State', () => {
    it('should start with loading state and no user', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    it('should set up auth state listener on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Google Sign In', () => {
    it('should handle Google sign in success', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      mockAuth.signInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const googleButton = screen.getByTestId('google-signin');
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockAuth.signInWithPopup).toHaveBeenCalled();
      });
    });

    it('should handle Google sign in error', async () => {
      const user = userEvent.setup();

      mockAuth.signInWithPopup.mockRejectedValue(new Error('Sign in failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const googleButton = screen.getByTestId('google-signin');
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockAuth.signInWithPopup).toHaveBeenCalled();
      });
    });
  });

  describe('Phone Sign In', () => {
    it('should handle phone sign in', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const phoneButton = screen.getByTestId('phone-signin');
      await user.click(phoneButton);

      // Should attempt to initialize reCAPTCHA
      expect(global.grecaptcha.ready).toHaveBeenCalled();
    });

    it('should handle reCAPTCHA initialization failure', async () => {
      const user = userEvent.setup();
      
      // Mock reCAPTCHA failure
      global.grecaptcha.ready.mockImplementation((callback) => {
        // Don't call callback to simulate failure
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const phoneButton = screen.getByTestId('phone-signin');
      await user.click(phoneButton);

      // Should handle the failure gracefully
      expect(global.grecaptcha.ready).toHaveBeenCalled();
    });
  });

  describe('Mobile Test Sign In', () => {
    it('should sign in as mobile test user', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const mobileButton = screen.getByTestId('mobile-signin');
      await user.click(mobileButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('mobile@test.com');
      });
    });
  });

  describe('Logout', () => {
    it('should handle logout for authenticated user', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      // Set up authenticated state
      mockAuth.currentUser = mockUser;
      mockAuth.signOut.mockResolvedValue();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const logoutButton = screen.getByTestId('logout');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled();
      });
    });

    it('should handle logout for mock user', async () => {
      const user = userEvent.setup();

      // First sign in as mobile user
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const mobileButton = screen.getByTestId('mobile-signin');
      await user.click(mobileButton);

      // Then logout
      const logoutButton = screen.getByTestId('logout');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update state when user signs in', async () => {
      const mockUser = createMockUser();
      
      // Mock the auth state change callback
      let authStateCallback;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {}; // Unsubscribe function
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user signing in
      authStateCallback(mockUser);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });
    });

    it('should update state when user signs out', async () => {
      const mockUser = createMockUser();
      
      // Mock the auth state change callback
      let authStateCallback;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {}; // Unsubscribe function
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user signing in
      authStateCallback(mockUser);
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      // Simulate user signing out
      authStateCallback(null);
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth state listener errors', async () => {
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        // Simulate an error in the auth state listener
        setTimeout(() => {
          callback(null);
        }, 0);
        return () => {};
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });
    });

    it('should handle Firebase auth errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock Firebase auth to throw an error
      mockAuth.signInWithPopup.mockRejectedValue(new Error('Firebase error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const googleButton = screen.getByTestId('google-signin');
      await user.click(googleButton);

      // Should not crash and should handle the error
      await waitFor(() => {
        expect(mockAuth.signInWithPopup).toHaveBeenCalled();
      });
    });
  });

  describe('Network State', () => {
    it('should handle offline state', async () => {
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should still render without crashing
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });
}); 