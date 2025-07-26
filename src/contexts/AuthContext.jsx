import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    myProfileId: null,
    favoriteProfileIds: [],
    lastLogin: null
  });

  // Phone number authentication
  const signInWithPhone = async (phoneNumber) => {
    try {
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
        setRecaptchaVerifier(verifier);
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error('Phone sign-in error:', error);
      throw error;
    }
  };

  // Google authentication
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      // Clear local preferences
      localStorage.removeItem('archers_edge_user_preferences');
      setUserPreferences({
        myProfileId: null,
        favoriteProfileIds: [],
        lastLogin: null
      });
      setUserRole(null);
      
      // Firebase sign out
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Role-based access control
  const getUserRole = (user) => {
    if (!user) return null;
    
    // Check user's custom claims or profile data for role
    // For now, we'll use a simple mapping based on email domain or user properties
    const email = user.email || '';
    
    // Example role determination logic
    if (email.includes('coach') || email.includes('coaching')) {
      return 'coach';
    } else if (email.includes('event') || email.includes('manager')) {
      return 'event_manager';
    } else if (email.includes('ref') || email.includes('referee')) {
      return 'referee';
    } else {
      return 'archer'; // Default role
    }
  };

  // Check if user has specific role permissions
  const hasRole = (requiredRole) => {
    if (!userRole) return false;
    if (requiredRole === 'admin') return userRole === 'admin';
    if (requiredRole === 'coach') return ['coach', 'admin'].includes(userRole);
    if (requiredRole === 'event_manager') return ['event_manager', 'admin'].includes(userRole);
    if (requiredRole === 'referee') return ['referee', 'admin'].includes(userRole);
    return true; // Archers have basic access
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    try {
      const stored = localStorage.getItem('archers_edge_user_preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        setUserPreferences(preferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

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

  // Simple login (for profile-based auth fallback)
  const login = (profileId) => {
    setMyProfile(profileId);
  };

  // Check if user has set up their preferences
  const isSetup = () => {
    return !!userPreferences.myProfileId;
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Determine user role
        const role = getUserRole(user);
        setUserRole(role);
        
        // Load user preferences
        loadUserPreferences();
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    hasRole,
    signInWithPhone,
    signInWithGoogle,
    logout,
    loading,
    userPreferences,
    setMyProfile,
    toggleFavorite,
    getMyProfileId,
    getFavoriteProfileIds,
    isFavorite,
    login,
    isSetup
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 