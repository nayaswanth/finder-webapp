import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { app } from './firebase.js';

class FirestoreDataService {
  constructor() {
    this.db = getFirestore(app);
  }

  // **USERS COLLECTION**
  async createUser(userId, userData) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: { id: userSnap.id, ...userSnap.data() } };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, userData) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // **EMPLOYEES COLLECTION** (for discovery/profiles)
  async getAllEmployees() {
    try {
      const employeesRef = collection(this.db, 'employees');
      const snapshot = await getDocs(employeesRef);
      
      const employees = [];
      snapshot.forEach((doc) => {
        employees.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, employees };
    } catch (error) {
      console.error('Error getting employees:', error);
      return { success: false, error: error.message };
    }
  }

  // Optimized employee creation with better error handling
  async createEmployee(employeeData) {
    try {
      const employeesRef = collection(this.db, 'employees');
      const docRef = await addDoc(employeesRef, {
        ...employeeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: error.message };
    }
  }

  async getEmployeeByEmail(email) {
    try {
      const employeesRef = collection(this.db, 'employees');
      const q = query(employeesRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { success: true, data: { id: doc.id, ...doc.data() } };
      } else {
        return { success: false, error: 'Employee not found' };
      }
    } catch (error) {
      console.error('Error getting employee by email:', error);
      return { success: false, error: error.message };
    }
  }

  // **OPPORTUNITIES COLLECTION**
  async createOpportunity(opportunityData, createdBy) {
    try {
      const opportunitiesRef = collection(this.db, 'opportunities');
      const docRef = await addDoc(opportunitiesRef, {
        ...opportunityData,
        createdBy,
        applicants: [],
        applicationStatuses: {},
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllOpportunities() {
    try {
      const opportunitiesRef = collection(this.db, 'opportunities');
      const q = query(opportunitiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const opportunities = [];
      snapshot.forEach((doc) => {
        opportunities.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, opportunities };
    } catch (error) {
      console.error('Error getting opportunities:', error);
      return { success: false, error: error.message };
    }
  }

  async getOpportunitiesByUser(userId) {
    try {
      const opportunitiesRef = collection(this.db, 'opportunities');
      const q = query(
        opportunitiesRef, 
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const opportunities = [];
      snapshot.forEach((doc) => {
        opportunities.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, opportunities };
    } catch (error) {
      console.error('Error getting user opportunities:', error);
      return { success: false, error: error.message };
    }
  }

  async getOpportunityById(opportunityId) {
    try {
      const opportunityRef = doc(this.db, 'opportunities', opportunityId);
      const opportunitySnap = await getDoc(opportunityRef);
      
      if (opportunitySnap.exists()) {
        return { success: true, data: { id: opportunitySnap.id, ...opportunitySnap.data() } };
      } else {
        return { success: false, error: 'Opportunity not found' };
      }
    } catch (error) {
      console.error('Error getting opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  async applyToOpportunity(opportunityId, userId) {
    try {
      const opportunityRef = doc(this.db, 'opportunities', opportunityId);
      await updateDoc(opportunityRef, {
        applicants: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  async updateApplicationStatus(opportunityId, applicantId, status) {
    try {
      const opportunityRef = doc(this.db, 'opportunities', opportunityId);
      await updateDoc(opportunityRef, {
        [`applicationStatuses.${applicantId}`]: status,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating application status:', error);
      return { success: false, error: error.message };
    }
  }

  async closeOpportunity(opportunityId) {
    try {
      const opportunityRef = doc(this.db, 'opportunities', opportunityId);
      await updateDoc(opportunityRef, {
        status: 'closed',
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error closing opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  async reopenOpportunity(opportunityId) {
    try {
      const opportunityRef = doc(this.db, 'opportunities', opportunityId);
      await updateDoc(opportunityRef, {
        status: 'open',
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error reopening opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  // **NOTIFICATIONS COLLECTION**
  async createNotification(userId, notificationData) {
    try {
      const notificationsRef = collection(this.db, 'notifications', userId, 'messages');
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserNotifications(userId) {
    try {
      const notificationsRef = collection(this.db, 'notifications', userId, 'messages');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, notifications };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      const notificationRef = doc(this.db, 'notifications', userId, 'messages', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // **SEARCH AND FILTERS**
  async searchOpportunities(filters = {}) {
    try {
      let q = collection(this.db, 'opportunities');
      
      // Apply filters
      if (filters.domain) {
        q = query(q, where('domain', '==', filters.domain));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      // Always order by creation date
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const opportunities = [];
      snapshot.forEach((doc) => {
        opportunities.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, opportunities };
    } catch (error) {
      console.error('Error searching opportunities:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FirestoreDataService();
