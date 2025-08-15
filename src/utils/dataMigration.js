import { FirebaseDataService } from '../firebase/dataService.js';

// Function to migrate your existing JSON data to Firebase
export async function migrateExistingDataToFirebase() {
  try {
    console.log('🚀 Starting migration of existing data to Firebase...');

    // This will read from your local JSON files via your backend API
    // and transfer the data to Firebase

    // Fetch existing employees data
    console.log('📥 Fetching existing employees...');
    const employeesResponse = await fetch('/api/employees');
    const employeesData = await employeesResponse.json();
    const employees = employeesData.employees || employeesData || [];

    // Fetch existing opportunities data  
    console.log('📥 Fetching existing opportunities...');
    const opportunitiesResponse = await fetch('/api/opportunities');
    const opportunitiesData = await opportunitiesResponse.json();
    const opportunities = opportunitiesData.opportunities || opportunitiesData || [];

    console.log(`Found ${employees.length} employees and ${opportunities.length} opportunities to migrate`);

    // Migrate employees to Firebase
    console.log('👥 Migrating employees to Firebase...');
    let employeeCount = 0;
    for (const employee of employees) {
      try {
        // Check if employee already exists in Firebase
        const existingEmployee = await FirebaseDataService.getEmployeeByEmail(employee.email);
        if (!existingEmployee) {
          await FirebaseDataService.createEmployee(employee);
          console.log(`✅ Migrated employee: ${employee.name} (${employee.email})`);
          employeeCount++;
        } else {
          console.log(`⏩ Employee already exists: ${employee.name} (${employee.email})`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate employee ${employee.email}:`, error);
      }
    }

    // Migrate opportunities to Firebase
    console.log('💼 Migrating opportunities to Firebase...');
    let opportunityCount = 0;
    for (const opportunity of opportunities) {
      try {
        await FirebaseDataService.createOpportunity(opportunity);
        console.log(`✅ Migrated opportunity: ${opportunity.title}`);
        opportunityCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate opportunity ${opportunity.title}:`, error);
      }
    }

    console.log('🎉 Migration completed!');
    console.log(`📊 Summary: ${employeeCount} employees and ${opportunityCount} opportunities migrated to Firebase`);
    
    return { 
      success: true, 
      message: `Migration completed: ${employeeCount} employees, ${opportunityCount} opportunities` 
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Make it available globally for easy access
window.migrateDataToFirebase = migrateExistingDataToFirebase;

// Also create a function to check Firebase data
export async function checkFirebaseData() {
  try {
    console.log('🔍 Checking Firebase data...');
    
    const employees = await FirebaseDataService.getAllEmployees();
    const opportunities = await FirebaseDataService.getAllOpportunities();
    
    console.log(`📊 Firebase contains: ${employees.length} employees, ${opportunities.length} opportunities`);
    console.log('👥 Employees:', employees.map(e => `${e.name} (${e.email})`));
    console.log('💼 Opportunities:', opportunities.map(o => o.title));
    
    return { employees, opportunities };
  } catch (error) {
    console.error('❌ Failed to check Firebase data:', error);
    return null;
  }
}

window.checkFirebaseData = checkFirebaseData;
