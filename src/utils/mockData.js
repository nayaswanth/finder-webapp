// Mock data for offline testing
export const mockOpportunities = [
  {
    id: 0,
    title: "Opp 1",
    description: "Opp 1 Desc",
    domain: "Customer & Commercial Strategy",
    type: "Proposal / POV",
    startDate: "2025-07-01",
    endDate: "2025-07-19",
    hoursPerWeek: "1",
    skills: ["Presentation"],
    roles: ["Senior Consultant"],
    email: "akshay@finder.com",
    applied: ["akshay@finder.com"],
    status: "open"
  },
  {
    id: 1,
    title: "Test Opportunity with mandatory fields",
    description: "This is a closed test opportunity",
    domain: "Cross-Domain",
    type: "Proposal / POV",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    hoursPerWeek: "5",
    skills: ["Research", "Analysis"],
    roles: ["Analyst"],
    email: "satyam@finder.com",
    applied: [],
    status: "closed"
  }
];

export const mockEmployees = [
  {
    email: "akshay@finder.com",
    name: "AK"
  },
  {
    email: "satyam@finder.com", 
    name: "Satyam Kumar"
  }
];

// Offline mode flag
export const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
