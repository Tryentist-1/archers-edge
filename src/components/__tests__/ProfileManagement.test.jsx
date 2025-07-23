import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import ProfileManagement from '../ProfileManagement';
import { createMockUser, createMockProfile, resetMocks } from '../../test/setup';

// Mock the navigation function
const mockOnNavigate = vi.fn();
const mockOnProfileSelect = vi.fn();

// Mock Firebase service
vi.mock('../../services/firebaseService', () => ({
  loadProfilesFromFirebase: vi.fn(),
  saveProfileToFirebase: vi.fn(),
  deleteProfileFromFirebase: vi.fn(),
  shouldUseFirebase: vi.fn(() => false), // Default to offline for tests
  isOnline: vi.fn(() => true),
}));

// Mock LocalStorage utility
vi.mock('../../utils/localStorage', () => ({
  saveAppState: vi.fn(),
  loadAppState: vi.fn(() => null),
}));

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      currentUser: createMockUser(),
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithPhone: vi.fn(),
      signInAsMobile: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('ProfileManagement', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('Profile Selection Screen', () => {
    it('should show profile selection when no profiles exist', async () => {
      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      expect(screen.getByText('Select Your Profile')).toBeInTheDocument();
      expect(screen.getByText('Choose your existing profile or create a new one to get started.')).toBeInTheDocument();
    });

    it('should display existing profiles in selection screen', async () => {
      const mockProfiles = [
        createMockProfile({ id: '1', firstName: 'John', lastName: 'Doe' }),
        createMockProfile({ id: '2', firstName: 'Jane', lastName: 'Smith' }),
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockProfiles));

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should show create new profile button', async () => {
      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      expect(screen.getByText('+ Create New Profile')).toBeInTheDocument();
    });
  });

  describe('Profile Creation', () => {
    it('should show create form when create button is clicked', async () => {
      const user = userEvent.setup();

      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      const createButton = screen.getByText('+ Create New Profile');
      await user.click(createButton);

      expect(screen.getByText('Create New Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('should validate required fields when creating profile', async () => {
      const user = userEvent.setup();

      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      // Go to create form
      const createButton = screen.getByText('+ Create New Profile');
      await user.click(createButton);

      // Try to save without filling required fields
      const saveButton = screen.getByText('Create Profile');
      await user.click(saveButton);

      expect(screen.getByText('First name and last name are required.')).toBeInTheDocument();
    });

    it('should create new profile with valid data', async () => {
      const user = userEvent.setup();

      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      // Go to create form
      const createButton = screen.getByText('+ Create New Profile');
      await user.click(createButton);

      // Fill in required fields
      const inputs = screen.getAllByDisplayValue('');
      const firstNameInput = inputs[0];
      const lastNameInput = inputs[1];

      await user.type(firstNameInput, 'New');
      await user.type(lastNameInput, 'User');

      // Save the profile
      const saveButton = screen.getByText('Create Profile');
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
        expect(mockOnProfileSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Profile Editing', () => {
    it('should show edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockProfile = createMockProfile();

      localStorage.getItem.mockReturnValue(JSON.stringify([mockProfile]));

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    });

    it('should update existing profile when editing', async () => {
      const user = userEvent.setup();
      const mockProfile = createMockProfile();

      localStorage.getItem.mockReturnValue(JSON.stringify([mockProfile]));

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Update the profile
      const firstNameInput = screen.getByDisplayValue('Test');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
        expect(mockOnProfileSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Profile Deletion', () => {
    it('should delete profile when confirmed', async () => {
      const user = userEvent.setup();
      const mockProfile = createMockProfile();

      localStorage.getItem.mockReturnValue(JSON.stringify([mockProfile]));

      // Mock window.confirm to return true
      window.confirm = vi.fn(() => true);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when Go to Home is clicked', async () => {
      const user = userEvent.setup();

      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      const homeButton = screen.getByText('Go to Home');
      await user.click(homeButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();

      localStorage.getItem.mockReturnValue(null);

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      // Go to create form
      const createButton = screen.getByText('+ Create New Profile');
      await user.click(createButton);

      // Try to save empty form
      const saveButton = screen.getByText('Create Profile');
      await user.click(saveButton);

      expect(screen.getByText('First name and last name are required.')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithAuth(
        <ProfileManagement 
          onNavigate={mockOnNavigate}
          onProfileSelect={mockOnProfileSelect}
        />
      );

      // Should not crash and should show empty state
      await waitFor(() => {
        expect(screen.getByText('+ Create New Profile')).toBeInTheDocument();
      });
    });
  });
}); 