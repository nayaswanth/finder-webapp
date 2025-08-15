import { FirebaseDataService } from '../firebase/dataService.js';
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

  // Data operations - Firebase only
  static async getEmployees() {
    try {
      const employees = await FirebaseDataService.getAllEmployees();
      return { success: true, employees };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { success: false, employees: [] };
    }
  }

  static async updateEmployee(email, updates) {
    try {
      const employee = await FirebaseDataService.getEmployeeByEmail(email);
      if (employee) {
        await FirebaseDataService.updateEmployee(employee.id, updates);
        return { success: true, message: 'Employee updated successfully' };
      }
      return { success: false, message: 'Employee not found' };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, message: 'Update failed' };
    }
  }

  static async getOpportunities() {
    try {
      const opportunities = await FirebaseDataService.getAllOpportunities();
      return { success: true, opportunities };
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return { success: false, opportunities: [] };
    }
  }

  static async createOpportunity(opportunityData) {
    try {
      await FirebaseDataService.createOpportunity(opportunityData);
      return { success: true, message: 'Opportunity posted successfully' };
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return { success: false, message: 'Failed to post opportunity' };
    }
  }

  static async getOpportunity(opportunityId) {
    try {
      const opportunity = await FirebaseDataService.getOpportunityById(opportunityId);
      return { success: true, opportunity };
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      return { success: false, message: 'Opportunity not found' };
    }
  }

  static async applyToOpportunity(opportunityId, email) {
    try {
      await FirebaseDataService.applyToOpportunity(opportunityId, email);
      return { success: true, message: 'Applied successfully' };
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      return { success: false, message: 'Application failed' };
    }
  }

  static async markNotInterested(opportunityId, email) {
    try {
      await FirebaseDataService.markNotInterested(opportunityId, email);
      return { success: true, message: 'Marked as not interested' };
    } catch (error) {
      console.error('Error marking not interested:', error);
      return { success: false, message: 'Failed to mark as not interested' };
    }
  }

  static async acceptApplicant(opportunityId, applicantEmail) {
    try {
      await FirebaseDataService.acceptApplicant(opportunityId, applicantEmail);
      return { success: true, message: 'Applicant accepted successfully' };
    } catch (error) {
      console.error('Error accepting applicant:', error);
      return { success: false, message: 'Failed to accept applicant' };
    }
  }

  static async rejectApplicant(opportunityId, applicantEmail) {
    try {
      await FirebaseDataService.rejectApplicant(opportunityId, applicantEmail);
      return { success: true, message: 'Applicant rejected successfully' };
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      return { success: false, message: 'Failed to reject applicant' };
    }
  }

  static async closeOpportunity(opportunityId, email) {
    try {
      await FirebaseDataService.closeOpportunity(opportunityId);
      return { success: true, message: 'Opportunity closed successfully' };
    } catch (error) {
      console.error('Error closing opportunity:', error);
      return { success: false, message: 'Failed to close opportunity' };
    }
  }

  static async reopenOpportunity(opportunityId, email) {
    try {
      await FirebaseDataService.reopenOpportunity(opportunityId);
      return { success: true, message: 'Opportunity reopened successfully' };
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
