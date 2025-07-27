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
    
    // Manual admin email list - add specific admin emails here
    const adminEmails = [
      'trrydms@gmail.com',  // Add your email here
      'admin@archers-edge.com',
      'system@archers-edge.com'
    ];
    
    // Check if email is in admin list
    if (adminEmails.includes(email.toLowerCase())) {
      return 'System Admin';
    }
    
    // Example role determination logic
    if (email.includes('admin') || email.includes('system')) {
      return 'System Admin';
    } else if (email.includes('coach') || email.includes('coaching')) {
      return 'Coach';
    } else if (email.includes('event') || email.includes('manager')) {
      return 'Event Manager';
    } else if (email.includes('ref') || email.includes('referee')) {
      return 'Referee';
    } else {
      return 'Archer'; // Default role
    }
  };

  // Check if user has specific role permissions
  const hasRole = (requiredRole) => {
    if (!userRole) return false;
    if (requiredRole === 'System Admin') return userRole === 'System Admin';
    if (requiredRole === 'Coach') return ['Coach', 'System Admin'].includes(userRole);
    if (requiredRole === 'Event Manager') return ['Event Manager', 'System Admin'].includes(userRole);
    if (requiredRole === 'Referee') return ['Referee', 'System Admin'].includes(userRole);
    return true; // Archers have basic access
  };

  // Get role-appropriate profiles for the current user
  const getRoleAppropriateProfiles = (allProfiles) => {
    if (!userRole) return allProfiles;
    
    // System Admin can see all profiles
    if (userRole === 'System Admin') {
      return allProfiles;
    }
    
    // Other roles see only their own type of profiles
    return allProfiles.filter(profile => {
      const profileRole = profile.role || 'Archer';
      
      switch (userRole) {
        case 'Coach':
          return profileRole === 'Coach' || profileRole === 'Archer';
        case 'Event Manager':
          return profileRole === 'Event Manager' || profileRole === 'Archer';
        case 'Referee':
          return profileRole === 'Referee' || profileRole === 'Archer';
        case 'Archer':
          return profileRole === 'Archer';
        default:
          return true;
      }
    });
  };

  // Get profiles for "My Profile" section (role-appropriate)
  const getMyProfiles = (allProfiles) => {
    if (!userRole) return allProfiles;
    
    // System Admin sees all profiles but can filter
    if (userRole === 'System Admin') {
      return allProfiles;
    }
    
    // Other roles see only their own type
    return allProfiles.filter(profile => {
      const profileRole = profile.role || 'Archer';
      return profileRole === userRole;
    });
  };

  // Check if user is coach for specific school/team
  const isCoachForSchool = async (school, team = null) => {
    if (!currentUser?.uid) return false;
    
    try {
      const { isCoachForSchool } = await import('../services/firebaseService.js');
      return await isCoachForSchool(currentUser.uid, school, team);
    } catch (error) {
      console.error('Error checking coach assignment:', error);
      return false;
    }
  };

  // Get user's coach assignments
  const getMyCoachAssignments = async () => {
    if (!currentUser?.uid) return [];
    
    try {
      const { getCoachAssignments } = await import('../services/firebaseService.js');
      return await getCoachAssignments(currentUser.uid);
    } catch (error) {
      console.error('Error loading coach assignments:', error);
      return [];
    }
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
    console.log('=== LOGIN DEBUG ===');
    console.log('Profile ID:', profileId);
    console.log('Current user:', currentUser);
    console.log('User preferences before:', userPreferences);
    
    setMyProfile(profileId);
    
    console.log('User preferences after:', userPreferences);
    console.log('=== END LOGIN DEBUG ===');
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
    isCoachForSchool,
    getMyCoachAssignments,
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
    isSetup,
    getRoleAppropriateProfiles,
    getMyProfiles
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 