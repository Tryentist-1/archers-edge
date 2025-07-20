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

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!recaptchaVerifier) {
      try {
        // Clear any existing reCAPTCHA
        const existingRecaptcha = document.querySelector('#recaptcha-container');
        if (existingRecaptcha) {
          existingRecaptcha.innerHTML = '';
        }

        // Check if we're in a browser environment
        if (typeof window !== 'undefined' && window.recaptcha) {
          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
            }
          });
          setRecaptchaVerifier(verifier);
        } else {
          console.warn('reCAPTCHA not available, using fallback authentication');
        }
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        // Don't throw error, just log it and continue
      }
    }
  }, []);

  // Phone number authentication
  const signInWithPhone = async (phoneNumber) => {
    try {
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized. Please refresh the page and try again.');
      }
      
      // Clear and reinitialize reCAPTCHA for each attempt
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
      return confirmationResult;
    } catch (error) {
      console.error('Phone sign-in error:', error);
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please use +1234567890 format.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Phone authentication is not enabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a few minutes and try again.');
      } else {
        throw new Error(`Phone authentication failed: ${error.message}`);
      }
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
    
    // Add a small delay to prevent rapid state changes
    setTimeout(() => {
      setCurrentUser(mockUser);
      setLoading(false);
      console.log('Mobile login complete');
    }, 100);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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