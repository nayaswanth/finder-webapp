import { FirebaseDataService } from '../firebase/dataService.js';

// Migration script to transfer data from JSON files to Firebase
export async function migrateDataToFirebase() {
  try {
    console.log('Starting data migration to Firebase...');

    // Sample employees data
    const sampleEmployees = [
      {
        name: "Test User",
        email: "test@finder.com",
        password: "test",
        industry: "Technology",
        domain: "Software Engineering",
        role: "Developer"
      },
      {
        name: "Akshay",
        email: "akshay@finder.com", 
        password: "1234",
        industry: "Technology",
        domain: "Product Management",
        role: "Product Manager"
      },
      {
        name: "AP",
        email: "ap@finder.com",
        password: "1234", 
        industry: "Technology",
        domain: "Design",
        role: "Designer"
      }
    ];

    // Sample opportunities data
    const sampleOpportunities = [
      {
        title: "Frontend Developer Position",
        description: "Looking for a skilled React developer to join our team.",
        type: "Full-time",
        domain: "Software Engineering",
        industry: "Technology", 
        startDate: "2024-01-15",
        endDate: "2024-12-31",
        hoursPerWeek: "40",
        skills: ["React", "JavaScript", "CSS"],
        roles: ["Frontend Developer"],
        email: "test@finder.com"
      },
      {
        title: "UX Designer Needed",
        description: "Seeking a creative UX designer for an exciting project.",
        type: "Contract",
        domain: "Design",
        industry: "Technology",
        startDate: "2024-02-01", 
        endDate: "2024-06-30",
        hoursPerWeek: "20",
        skills: ["Figma", "User Research", "Prototyping"],
        roles: ["UX Designer"],
        email: "ap@finder.com"
      },
      {
        title: "Product Manager Role",
        description: "Join our product team to drive innovation and growth.",
        type: "Full-time",
        domain: "Product Management",
        industry: "Technology",
        startDate: "2024-03-01",
        endDate: "2024-12-31", 
        hoursPerWeek: "40",
        skills: ["Product Strategy", "Analytics", "Leadership"],
        roles: ["Product Manager"],
        email: "akshay@finder.com"
      }
    ];

    // Migrate employees
    console.log('Migrating employees...');
    for (const employee of sampleEmployees) {
      const existingEmployee = await FirebaseDataService.getEmployeeByEmail(employee.email);
      if (!existingEmployee) {
        await FirebaseDataService.createEmployee(employee);
        console.log(`✓ Created employee: ${employee.name}`);
      } else {
        console.log(`- Employee already exists: ${employee.name}`);
      }
    }

    // Migrate opportunities
    console.log('Migrating opportunities...');
    for (const opportunity of sampleOpportunities) {
      await FirebaseDataService.createOpportunity(opportunity);
      console.log(`✓ Created opportunity: ${opportunity.title}`);
    }

    console.log('✅ Data migration completed successfully!');
    return { success: true, message: 'Migration completed' };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Function to run migration from browser console
window.runDataMigration = migrateDataToFirebase;
