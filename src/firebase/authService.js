import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase.js';
import firestoreService from './firestoreService.js';

export class FirebaseAuthService {
  static googleProvider = new GoogleAuthProvider();

  // Email/Password Authentication - Optimized
  static async signUpWithEmail(email, password, userData) {
    try {
      // Single Firebase Auth call
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Parallel operations for better performance
      const [profileUpdate, employeeCreation] = await Promise.all([
        // Update user profile
        updateProfile(user, {
          displayName: userData.name
        }),
        // Store employee data in Firestore
        firestoreService.createEmployee({
          name: userData.name,
          email: user.email,
          industry: userData.industry,
          domain: userData.domain,
          role: userData.role,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      ]);
      
      return { success: true, user, message: 'Account created successfully' };
    } catch (error) {
      console.error('🔥 Sign up error:', error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  static async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userData = await firestoreService.getEmployeeByEmail(user.email);
      
      return { success: true, user, userData: userData.data, message: 'Login successful' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Google Authentication
  static async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      
      // Check if user exists in our database
      const userResult = await firestoreService.getEmployeeByEmail(user.email);
      let userData = userResult.success ? userResult.data : null;
      
      // If user doesn't exist, create a new profile
      if (!userData) {
        const newUserData = {
          name: user.displayName || 'Google User',
          email: user.email,
          industry: '', // To be filled later
          domain: '',   // To be filled later
          role: '',     // To be filled later
          uid: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await firestoreService.createEmployee(newUserData);
        userData = newUserData;
      }
      
      return { success: true, user, userData, message: 'Google login successful' };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Sign Out
  static async signOut() {
    try {
      await signOut(auth);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, message: 'Failed to log out' };
    }
  }

  // Password Reset
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Get Current User
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Helper method to get user-friendly error messages
  static getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/popup-closed-by-user':
        return 'Login popup was closed. Please try again.';
      case 'auth/popup-blocked':
        return 'Login popup was blocked. Please allow popups and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export default FirebaseAuthService;
