import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    getAuth,
    onAuthStateChanged,
    sendEmailVerification,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Set persistence based on platform
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

interface User {
  id: string;
  uid: string; // Firebase UID
  email: string;
  fullName: string;
  contactNumber: string;
  address: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  verifyEmail: () => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

interface SignupData {
  fullName: string;
  contactNumber: string;
  address: string;
  email: string;
  password: string;
}

const USER_PROFILE_KEY = '@sukiscale_user_profile';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load additional user profile data from AsyncStorage
  const loadUserProfile = async (fbUser: FirebaseUser): Promise<User | null> => {
    try {
      const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY + fbUser.uid);
      const profile = profileJson ? JSON.parse(profileJson) : {};
      
      return {
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || '',
        fullName: profile.fullName || fbUser.displayName || '',
        contactNumber: profile.contactNumber || '',
        address: profile.address || '',
        isVerified: fbUser.emailVerified,
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Save user profile to AsyncStorage
  const saveUserProfile = async (uid: string, profile: Partial<User>) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY + uid, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userProfile = await loadUserProfile(fbUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    // Auth status is handled by onAuthStateChanged
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      setIsLoading(true);

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const fbUser = userCredential.user;

      // Update profile with display name
      await updateProfile(fbUser, {
        displayName: userData.fullName,
      });

      // Save additional user data to AsyncStorage
      await saveUserProfile(fbUser.uid, {
        fullName: userData.fullName,
        contactNumber: userData.contactNumber,
        address: userData.address,
      });

      // Send email verification
      console.log('📧 Sending verification email to:', fbUser.email);
      console.log('📧 User UID:', fbUser.uid);
      console.log('📧 User created at:', new Date().toISOString());
      try {
        await sendEmailVerification(fbUser);
        console.log('✅ Verification email sent successfully');
        console.log('📧 Check your Gmail inbox (and spam folder) for email from noreply@'+firebaseConfig.projectId+'.firebaseapp.com');
      } catch (verifyError: any) {
        console.error('❌ Failed to send verification email:', verifyError.code, verifyError.message);
        console.error('❌ Full error:', verifyError);
        // Continue anyway - user created but verification email failed
      }

      // Set user state
      const newUser: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || '',
        fullName: userData.fullName,
        contactNumber: userData.contactNumber,
        address: userData.address,
        isVerified: false,
      };
      setUser(newUser);

      return { success: true, requiresVerification: true };
    } catch (error: any) {
      console.error('❌ Signup error:', error.code, error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Use at least 6 characters.' };
      }
      
      return { success: false, error: error.message || 'Failed to create account. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      if (!firebaseUser) {
        return { success: false, error: 'No user found. Please sign up again.' };
      }

      // Reload user to get latest emailVerified status
      await firebaseUser.reload();

      if (firebaseUser.emailVerified) {
        // Update user state
        const updatedUser = await loadUserProfile(firebaseUser);
        if (updatedUser) {
          setUser(updatedUser);
        }
        return { success: true };
      } else {
        return { success: false, error: 'Email not yet verified. Please check your inbox and click the verification link.' };
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      return { success: false, error: error.message || 'Failed to verify email. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!firebaseUser) {
        return { success: false, error: 'No user found. Please sign up again.' };
      }

      await sendEmailVerification(firebaseUser);
      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message || 'Failed to resend verification email. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Load user profile
      const userProfile = await loadUserProfile(fbUser);
      setUser(userProfile);

      // Check if email is verified
      if (!fbUser.emailVerified) {
        return { success: false, error: 'Please verify your email before logging in.', requiresVerification: true };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error.code, error.message);
      console.log('📧 Attempted login with email:', email);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email. Please sign up first.' };
      } else if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Incorrect password. Please try again.' };
      } else if (error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid email or password. If you haven\'t registered yet, please create an account first.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      
      return { success: false, error: error.message || 'Failed to login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && user.isVerified,
    login,
    signup,
    verifyEmail,
    resendVerificationCode,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
