import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    myProfileId: null,
    favoriteProfileIds: [],
    lastLogin: null
  });

  // Load user preferences from cookies/localStorage on mount
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        // Try to get from localStorage first
        const stored = localStorage.getItem('archers_edge_user_preferences');
        if (stored) {
          const preferences = JSON.parse(stored);
          setUserPreferences(preferences);
          
          // Create a simple user object
          const user = {
            uid: preferences.myProfileId || 'anonymous',
            email: 'user@archers-edge.local',
            displayName: preferences.myProfileId ? 'Authenticated User' : 'Anonymous User',
            isAnonymous: !preferences.myProfileId
          };
          
          setCurrentUser(user);
        } else {
          // Create anonymous user
          setCurrentUser({
            uid: 'anonymous',
            email: 'anonymous@archers-edge.local',
            displayName: 'Anonymous User',
            isAnonymous: true
          });
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Fallback to anonymous user
        setCurrentUser({
          uid: 'anonymous',
          email: 'anonymous@archers-edge.local',
          displayName: 'Anonymous User',
          isAnonymous: true
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserPreferences();
  }, []);

  // Save user preferences to localStorage
  const saveUserPreferences = (preferences) => {
    try {
      const updatedPreferences = {
        ...userPreferences,
        ...preferences,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('archers_edge_user_preferences', JSON.stringify(updatedPreferences));
      setUserPreferences(updatedPreferences);
      
      // Update current user
      const user = {
        uid: updatedPreferences.myProfileId || 'anonymous',
        email: 'user@archers-edge.local',
        displayName: updatedPreferences.myProfileId ? 'Authenticated User' : 'Anonymous User',
        isAnonymous: !updatedPreferences.myProfileId
      };
      
      setCurrentUser(user);
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  // Set "Me" profile
  const setMyProfile = (profileId) => {
    saveUserPreferences({ myProfileId: profileId });
  };

  // Add/remove favorite profiles
  const toggleFavorite = (profileId) => {
    const currentFavorites = userPreferences.favoriteProfileIds || [];
    const newFavorites = currentFavorites.includes(profileId)
      ? currentFavorites.filter(id => id !== profileId)
      : [...currentFavorites, profileId];
    
    saveUserPreferences({ favoriteProfileIds: newFavorites });
  };

  // Get "Me" profile ID
  const getMyProfileId = () => {
    return userPreferences.myProfileId;
  };

  // Get favorite profile IDs
  const getFavoriteProfileIds = () => {
    return userPreferences.favoriteProfileIds || [];
  };

  // Check if a profile is favorited
  const isFavorite = (profileId) => {
    return userPreferences.favoriteProfileIds?.includes(profileId) || false;
  };

  // Simple login (just update preferences)
  const login = (profileId) => {
    setMyProfile(profileId);
  };

  // Simple logout (clear preferences)
  const logout = () => {
    try {
      localStorage.removeItem('archers_edge_user_preferences');
      setUserPreferences({
        myProfileId: null,
        favoriteProfileIds: [],
        lastLogin: null
      });
      
      setCurrentUser({
        uid: 'anonymous',
        email: 'anonymous@archers-edge.local',
        displayName: 'Anonymous User',
        isAnonymous: true
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Check if user has set up their preferences
  const isSetup = () => {
    return !!userPreferences.myProfileId;
  };

  const value = {
    currentUser,
    loading,
    userPreferences,
    setMyProfile,
    toggleFavorite,
    getMyProfileId,
    getFavoriteProfileIds,
    isFavorite,
    login,
    logout,
    isSetup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 