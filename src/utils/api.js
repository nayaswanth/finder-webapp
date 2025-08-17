import { FirestoreDataService } from '../firebase/firestoreService.js';
import { FirebaseAuthService } from '../firebase/authService.js';

// Check if we should use Firebase (always true for production)
const useFirebase = () => {
  return import.meta.env.VITE_USE_FIREBASE === 'true' || 
         window.location.hostname !== 'localhost' ||
         import.meta.env.PROD; // Always use Firebase in production build
};

// Unified API service that uses Firebase exclusively for auth and data
export class ApiService {
  // Authentication - Only Firebase Auth
  static async login(email, password) {
    return await FirebaseAuthService.signInWithEmail(email, password);
  }

  static async register(userData) {
    return await FirebaseAuthService.signUpWithEmail(userData.email, userData.password, userData);
  }

  static async loginWithGoogle() {
    return await FirebaseAuthService.signInWithGoogle();
  }

  static async logout() {
    return await FirebaseAuthService.signOut();
  }

  static getCurrentUser() {
    return FirebaseAuthService.getCurrentUser();
  }

  static onAuthStateChanged(callback) {
    return FirebaseAuthService.onAuthStateChanged(callback);
  }

  // Data operations - Firebase Firestore only
  static async getEmployees() {
    try {
      const result = await FirestoreDataService.getAllEmployees();
      return { success: true, employees: result.employees || [] };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { success: false, employees: [] };
    }
  }

  static async updateEmployee(email, updates) {
    try {
      const result = await FirestoreDataService.updateEmployeeByEmail(email, updates);
      return result;
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, message: 'Update failed' };
    }
  }

  static async getOpportunities() {
    try {
      const result = await FirestoreDataService.getAllOpportunities();
      return { success: true, opportunities: result.opportunities || [] };
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return { success: false, opportunities: [] };
    }
  }

  static async createOpportunity(opportunityData) {
    try {
      const result = await FirestoreDataService.createOpportunity(opportunityData, opportunityData.email);
      return { success: true, message: 'Opportunity posted successfully' };
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return { success: false, message: 'Failed to post opportunity' };
    }
  }

  static async getOpportunity(opportunityId) {
    try {
      const result = await FirestoreDataService.getOpportunityById(opportunityId);
      return { success: true, opportunity: result.opportunity };
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      return { success: false, message: 'Opportunity not found' };
    }
  }

  static async applyToOpportunity(opportunityId, email) {
    try {
      const result = await FirestoreDataService.applyToOpportunity(opportunityId, email);
      return result;
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      return { success: false, message: 'Application failed' };
    }
  }

  static async markNotInterested(opportunityId, email) {
    try {
      const result = await FirestoreDataService.markNotInterested(opportunityId, email);
      return result;
    } catch (error) {
      console.error('Error marking not interested:', error);
      return { success: false, message: 'Failed to mark as not interested' };
    }
  }

  static async acceptApplicant(opportunityId, applicantEmail) {
    try {
      const result = await FirestoreDataService.acceptApplicant(opportunityId, applicantEmail);
      return result;
    } catch (error) {
      console.error('Error accepting applicant:', error);
      return { success: false, message: 'Failed to accept applicant' };
    }
  }

  static async rejectApplicant(opportunityId, applicantEmail) {
    try {
      const result = await FirestoreDataService.rejectApplicant(opportunityId, applicantEmail);
      return result;
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      return { success: false, message: 'Failed to reject applicant' };
    }
  }

  static async closeOpportunity(opportunityId, email) {
    try {
      const result = await FirestoreDataService.closeOpportunity(opportunityId);
      return result;
    } catch (error) {
      console.error('Error closing opportunity:', error);
      return { success: false, message: 'Failed to close opportunity' };
    }
  }

  static async reopenOpportunity(opportunityId, email) {
    try {
      const result = await FirestoreDataService.reopenOpportunity(opportunityId);
      return result;
    } catch (error) {
      console.error('Error reopening opportunity:', error);
      return { success: false, message: 'Failed to reopen opportunity' };
    }
  }
}

// Legacy exports for backward compatibility
export const buildApiUrl = (endpoint) => {
  console.warn('buildApiUrl is deprecated. All operations now use Firebase.');
  return '';
};

export default ApiService;
