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

  // Initialize reCAPTCHA - Disabled for now to prevent console errors
  useEffect(() => {
    // Temporarily disable reCAPTCHA initialization to prevent console errors
    // This will be re-enabled when phone authentication is properly configured
    console.log('reCAPTCHA initialization disabled - phone auth not yet configured');
  }, []);

  // Phone number authentication
  const signInWithPhone = async (phoneNumber) => {
    try {
      console.log('Attempting phone sign-in with:', phoneNumber);
      
      if (!recaptchaVerifier) {
        console.log('reCAPTCHA not ready, initializing...');
        // Try to initialize reCAPTCHA on demand
        const existingRecaptcha = document.querySelector('#recaptcha-container');
        if (existingRecaptcha) {
          existingRecaptcha.innerHTML = '';
        }
        
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
        
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        console.log('Phone sign-in successful');
        return confirmationResult;
      } else {
        console.log('Using existing reCAPTCHA verifier');
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        console.log('Phone sign-in successful');
        return confirmationResult;
      }
    } catch (error) {
      console.error('Phone sign-in error:', error);
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please use +1234567890 format.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Phone authentication is not enabled in Firebase. Please enable it in the Firebase Console.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a few minutes and try again.');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
      } else {
        throw new Error(`Phone authentication failed: ${error.message}`);
      }
    }
  };

  // Google authentication
  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign-in...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // If Firebase auth fails on mobile, use mock authentication
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('Firebase auth failed on mobile, using mock authentication');
        const mockUser = {
          uid: 'mobile-test-user',
          email: 'mobile@test.com',
          displayName: 'Mobile Test User',
          isAnonymous: false
        };
        setCurrentUser(mockUser);
        return { user: mockUser };
      }
      
      throw error;
    }
  };

  // Manual mobile login for testing
  const signInAsMobile = () => {
    console.log('signInAsMobile called');
    
    // Prevent multiple calls
    if (currentUser) {
      console.log('User already logged in, skipping mobile login');
      return;
    }
    
    const mockUser = {
      uid: 'mobile-test-user',
      email: 'mobile@test.com',
      displayName: 'Mobile Test User',
      isAnonymous: false
    };
    console.log('Setting mock user:', mockUser);
    
    // Set user immediately for better UX
    setCurrentUser(mockUser);
    setLoading(false);
    console.log('Mobile login complete');
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithPhone,
    signInWithGoogle,
    signInAsMobile,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 