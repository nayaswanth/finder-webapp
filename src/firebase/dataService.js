import { database } from './config.js';
import { ref, get, set, push, update, remove, onValue } from 'firebase/database';

// Database service class for Firebase Realtime Database
export class FirebaseDataService {
  // Users/Employees methods
  static async getAllEmployees() {
    try {
      const employeesRef = ref(database, 'employees');
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  static async createEmployee(employeeData) {
    try {
      const employeesRef = ref(database, 'employees');
      const newEmployeeRef = push(employeesRef);
      await set(newEmployeeRef, {
        ...employeeData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return newEmployeeRef.key;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(employeeId, updates) {
    try {
      const employeeRef = ref(database, `employees/${employeeId}`);
      await update(employeeRef, {
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async getEmployeeByEmail(email) {
    try {
      const employeesRef = ref(database, 'employees');
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const key in data) {
          if (data[key].email === email) {
            return { id: key, ...data[key] };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee by email:', error);
      throw error;
    }
  }

  // Opportunities methods
  static async getAllOpportunities() {
    try {
      const opportunitiesRef = ref(database, 'opportunities');
      const snapshot = await get(opportunitiesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  static async createOpportunity(opportunityData) {
    try {
      const opportunitiesRef = ref(database, 'opportunities');
      const newOpportunityRef = push(opportunitiesRef);
      await set(newOpportunityRef, {
        ...opportunityData,
        status: 'open',
        applied: [],
        not_interested: [],
        application_statuses: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return newOpportunityRef.key;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async getOpportunityById(opportunityId) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      const snapshot = await get(opportunityRef);
      if (snapshot.exists()) {
        return { id: opportunityId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      throw error;
    }
  }

  static async updateOpportunity(opportunityId, updates) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      await update(opportunityRef, {
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  static async applyToOpportunity(opportunityId, userEmail) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      const snapshot = await get(opportunityRef);
      
      if (snapshot.exists()) {
        const opportunity = snapshot.val();
        const applied = opportunity.applied || [];
        
        if (!applied.includes(userEmail)) {
          applied.push(userEmail);
          await update(opportunityRef, { 
            applied,
            updatedAt: Date.now()
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      throw error;
    }
  }

  static async markNotInterested(opportunityId, userEmail) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      const snapshot = await get(opportunityRef);
      
      if (snapshot.exists()) {
        const opportunity = snapshot.val();
        const notInterested = opportunity.not_interested || [];
        
        if (!notInterested.includes(userEmail)) {
          notInterested.push(userEmail);
          await update(opportunityRef, { 
            not_interested: notInterested,
            updatedAt: Date.now()
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking not interested:', error);
      throw error;
    }
  }

  static async acceptApplicant(opportunityId, applicantEmail) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      const snapshot = await get(opportunityRef);
      
      if (snapshot.exists()) {
        const opportunity = snapshot.val();
        const applicationStatuses = opportunity.application_statuses || {};
        applicationStatuses[applicantEmail] = 'accepted';
        
        await update(opportunityRef, { 
          application_statuses: applicationStatuses,
          updatedAt: Date.now()
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error accepting applicant:', error);
      throw error;
    }
  }

  static async rejectApplicant(opportunityId, applicantEmail) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      const snapshot = await get(opportunityRef);
      
      if (snapshot.exists()) {
        const opportunity = snapshot.val();
        const applicationStatuses = opportunity.application_statuses || {};
        applicationStatuses[applicantEmail] = 'rejected';
        
        await update(opportunityRef, { 
          application_statuses: applicationStatuses,
          updatedAt: Date.now()
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      throw error;
    }
  }

  static async closeOpportunity(opportunityId) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      await update(opportunityRef, { 
        status: 'closed',
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error closing opportunity:', error);
      throw error;
    }
  }

  static async reopenOpportunity(opportunityId) {
    try {
      const opportunityRef = ref(database, `opportunities/${opportunityId}`);
      await update(opportunityRef, { 
        status: 'open',
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error reopening opportunity:', error);
      throw error;
    }
  }

  // Real-time listeners
  static onOpportunitiesChange(callback) {
    const opportunitiesRef = ref(database, 'opportunities');
    return onValue(opportunitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const opportunities = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        callback(opportunities);
      } else {
        callback([]);
      }
    });
  }

  static onEmployeesChange(callback) {
    const employeesRef = ref(database, 'employees');
    return onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employees = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        callback(employees);
      } else {
        callback([]);
      }
    });
  }
}

export default FirebaseDataService;
