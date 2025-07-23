import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveProfileToFirebase, 
  loadProfilesFromFirebase, 
  deleteProfileFromFirebase,
  shouldUseFirebase,
  isOnline,
  isMockUser
} from '../firebaseService';
import { createMockProfile, resetMocks } from '../../test/setup';

// Mock Firebase Firestore
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockAdd = vi.fn();

const mockFirestore = {
  collection: mockCollection,
  doc: mockDoc,
  setDoc: vi.fn(),
  getDoc: vi.fn(),
};

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

describe('Firebase Service', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockCollection.mockClear();
    mockDoc.mockClear();
    mockSet.mockClear();
    mockGet.mockClear();
    mockDelete.mockClear();
    mockWhere.mockClear();
    mockAdd.mockClear();
  });

  describe('Network and User Detection', () => {
    it('should detect online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it('should detect offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });

    it('should identify mock users', () => {
      expect(isMockUser('mobile-test-user')).toBe(true);
      expect(isMockUser('mobile@test.com')).toBe(true);
      expect(isMockUser('real-user-id')).toBe(false);
    });

    it('should determine when to use Firebase', () => {
      // Online + real user = use Firebase
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      expect(shouldUseFirebase('real-user-id')).toBe(true);

      // Offline + real user = don't use Firebase
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      expect(shouldUseFirebase('real-user-id')).toBe(false);

      // Online + mock user = don't use Firebase
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      expect(shouldUseFirebase('mobile-test-user')).toBe(false);
    });
  });

  describe('Profile Operations', () => {
    describe('saveProfileToFirebase', () => {
      it('should save profile to Firebase successfully', async () => {
        const mockProfile = createMockProfile();
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await saveProfileToFirebase(mockProfile, userId);

        expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users');
        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), userId);
        expect(mockSet).toHaveBeenCalledWith({
          profiles: [mockProfile],
        });
      });

      it('should handle Firebase save errors', async () => {
        const mockProfile = createMockProfile();
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockRejectedValue(new Error('Firebase error')),
        });

        await expect(saveProfileToFirebase(mockProfile, userId)).rejects.toThrow('Firebase error');
      });

      it('should update existing profiles when saving', async () => {
        const existingProfile = createMockProfile({ id: 'existing-id' });
        const newProfile = createMockProfile({ id: 'new-id' });
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await saveProfileToFirebase(newProfile, userId, [existingProfile]);

        expect(mockSet).toHaveBeenCalledWith({
          profiles: [existingProfile, newProfile],
        });
      });
    });

    describe('loadProfilesFromFirebase', () => {
      it('should load profiles from Firebase successfully', async () => {
        const mockProfiles = [createMockProfile()];
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockResolvedValue({
            exists: () => true,
            data: () => ({ profiles: mockProfiles }),
          }),
        });

        const result = await loadProfilesFromFirebase(userId);

        expect(result).toEqual(mockProfiles);
        expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users');
        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), userId);
      });

      it('should return empty array when no profiles exist', async () => {
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockResolvedValue({
            exists: () => false,
            data: () => null,
          }),
        });

        const result = await loadProfilesFromFirebase(userId);

        expect(result).toEqual([]);
      });

      it('should handle Firebase load errors', async () => {
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockRejectedValue(new Error('Firebase error')),
        });

        await expect(loadProfilesFromFirebase(userId)).rejects.toThrow('Firebase error');
      });
    });

    describe('deleteProfileFromFirebase', () => {
      it('should delete profile from Firebase successfully', async () => {
        const profileId = 'test-profile-id';
        const userId = 'test-user-id';
        const existingProfiles = [createMockProfile({ id: profileId })];

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await deleteProfileFromFirebase(profileId, userId, existingProfiles);

        expect(mockSet).toHaveBeenCalledWith({
          profiles: [], // Profile should be removed
        });
      });

      it('should handle Firebase delete errors', async () => {
        const profileId = 'test-profile-id';
        const userId = 'test-user-id';
        const existingProfiles = [createMockProfile({ id: profileId })];

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockRejectedValue(new Error('Firebase error')),
        });

        await expect(deleteProfileFromFirebase(profileId, userId, existingProfiles))
          .rejects.toThrow('Firebase error');
      });

      it('should remove only the specified profile', async () => {
        const profileToDelete = createMockProfile({ id: 'delete-me' });
        const profileToKeep = createMockProfile({ id: 'keep-me' });
        const userId = 'test-user-id';
        const existingProfiles = [profileToDelete, profileToKeep];

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await deleteProfileFromFirebase('delete-me', userId, existingProfiles);

        expect(mockSet).toHaveBeenCalledWith({
          profiles: [profileToKeep], // Only keep the other profile
        });
      });
    });
  });

  describe('Competition Operations', () => {
    describe('saveCompetitionToFirebase', () => {
      it('should save competition to Firebase', async () => {
        const mockCompetition = {
          id: 'test-competition-id',
          name: 'Test Competition',
          date: '2024-01-01',
          location: 'Test Location',
          type: 'qualification',
          divisions: ['MV', 'FV'],
          rounds: ['qualification'],
          distance: '18m',
          maxArchersPerBale: 8,
          status: 'active',
          userId: 'test-user-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await saveCompetitionToFirebase(mockCompetition, userId);

        expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users');
        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), userId);
        expect(mockSet).toHaveBeenCalledWith({
          competitions: [mockCompetition],
        });
      });
    });

    describe('loadCompetitionsFromFirebase', () => {
      it('should load competitions from Firebase', async () => {
        const mockCompetitions = [
          {
            id: 'comp-1',
            name: 'Competition 1',
            type: 'qualification',
          },
          {
            id: 'comp-2',
            name: 'Competition 2',
            type: 'olympic',
          },
        ];
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockResolvedValue({
            exists: () => true,
            data: () => ({ competitions: mockCompetitions }),
          }),
        });

        const result = await loadCompetitionsFromFirebase(userId);

        expect(result).toEqual(mockCompetitions);
      });
    });

    describe('deleteCompetitionFromFirebase', () => {
      it('should delete competition from Firebase', async () => {
        const competitionId = 'test-competition-id';
        const userId = 'test-user-id';
        const existingCompetitions = [
          { id: competitionId, name: 'Delete Me' },
          { id: 'keep-me', name: 'Keep Me' },
        ];

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(),
        });

        await deleteCompetitionFromFirebase(competitionId, userId, existingCompetitions);

        expect(mockSet).toHaveBeenCalledWith({
          competitions: [{ id: 'keep-me', name: 'Keep Me' }],
        });
      });
    });
  });

  describe('App State Operations', () => {
    describe('loadAppStateFromFirebase', () => {
      it('should load app state from Firebase', async () => {
        const mockAppState = {
          currentView: 'scoring',
          baleData: {
            id: 'test-bale',
            baleNumber: 1,
            currentEnd: 3,
            totalEnds: 12,
            archers: [],
          },
          selectedArcherId: 'test-archer',
          selectedProfile: createMockProfile(),
          timestamp: '2024-01-01T00:00:00.000Z',
        };
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockResolvedValue({
            exists: () => true,
            data: () => ({ appState: mockAppState }),
          }),
        });

        const result = await loadAppStateFromFirebase(userId);

        expect(result).toEqual(mockAppState);
      });

      it('should return null when no app state exists', async () => {
        const userId = 'test-user-id';

        mockCollection.mockReturnValue({
          doc: mockDoc,
        });
        mockDoc.mockReturnValue({
          get: mockGet.mockResolvedValue({
            exists: () => false,
            data: () => null,
          }),
        });

        const result = await loadAppStateFromFirebase(userId);

        expect(result).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockProfile = createMockProfile();
      const userId = 'test-user-id';

      // Should not attempt Firebase operations when offline
      expect(shouldUseFirebase(userId)).toBe(false);
    });

    it('should handle Firebase connection errors', async () => {
      const mockProfile = createMockProfile();
      const userId = 'test-user-id';

      mockCollection.mockImplementation(() => {
        throw new Error('Firebase connection failed');
      });

      await expect(saveProfileToFirebase(mockProfile, userId)).rejects.toThrow('Firebase connection failed');
    });
  });
}); 