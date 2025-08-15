import React, { createContext, useContext, useEffect, useState } from 'react';
import FirebaseAuthService from '../firebase/authService.js';
import FirestoreDataService from '../firebase/firestoreService.js';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get additional user data from Firestore
        try {
          const response = await FirestoreDataService.getAllEmployees();
          if (response.success) {
            const userDataFromDb = response.employees.find(emp => emp.email === user.email);
            setUserData(userDataFromDb || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await FirebaseAuthService.signInWithEmail(email, password);
    if (result.success) {
      setCurrentUser(result.user);
      setUserData(result.userData);
    }
    return result;
  };

  const register = async (email, password, userData) => {
    console.log('🔑 AuthContext register called with:', { email, userData });
    try {
      const result = await FirebaseAuthService.signUpWithEmail(email, password, userData);
      console.log('🔑 FirebaseAuthService result:', result);
      if (result.success) {
        setCurrentUser(result.user);
        // User data is already created in FirebaseAuthService
      }
      return result;
    } catch (error) {
      console.error('🔑 AuthContext register error:', error);
      return { success: false, message: error.message };
    }
  };

  const loginWithGoogle = async () => {
    const result = await FirebaseAuthService.signInWithGoogle();
    if (result.success) {
      setCurrentUser(result.user);
      setUserData(result.userData);
    }
    return result;
  };

  const logout = async () => {
    const result = await FirebaseAuthService.signOut();
    if (result.success) {
      setCurrentUser(null);
      setUserData(null);
    }
    return result;
  };

  const value = {
    currentUser,
    userData,
    login,
    register,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
