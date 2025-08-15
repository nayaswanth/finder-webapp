import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './components/Login.jsx';
import Register from './Register.jsx';
import PostOpportunity from './PostOpportunity';
import FindOpportunities from './FindOpportunities';
import OpportunityDetails from './OpportunityDetails';
import Profile from './Profile';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-finder-blue-600 mx-auto mb-4"></div>
        <p className="text-finder-blue-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Dashboard component (main authenticated view)
function Dashboard() {
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Welcome to Finder Dashboard</h1>
        <div className="text-center space-y-4">
          <p className="text-gray-600">Your Firebase authentication is working! 🎉</p>
          <p className="text-gray-600">This is your main dashboard where you can access all features.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/find-opportunities" 
          element={
            <ProtectedRoute>
              <FindOpportunities />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/post-opportunity" 
          element={
            <ProtectedRoute>
              <PostOpportunity />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/opportunity/:id" 
          element={
            <ProtectedRoute>
              <OpportunityDetails />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirects */}
        <Route 
          path="/" 
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
        
        {/* Catch all - redirect to appropriate page */}
        <Route 
          path="*" 
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

function Dashboard() {
  const location = useLocation();
  // Check if we should default to 'posted' tab based on navigation state
  const initialTab = location.state?.tab || 'applied';
  const [tab, setTab] = useState(initialTab);
  const [expandedCard, setExpandedCard] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [postedOpportunities, setPostedOpportunities] = useState([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [postedCount, setPostedCount] = useState(0);
  const [currentUserName, setCurrentUserName] = useState('');
  const [filter, setFilter] = useState('all'); // Add filter state
  // Initialize applicant statuses from localStorage
  const [applicantStatuses, setApplicantStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('finder_applicant_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [emailToName, setEmailToName] = useState({});
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('finder_email') || '';

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const filterParam = urlParams.get('filter');
    const tabParam = urlParams.get('tab');
    const opportunityIdParam = urlParams.get('opportunityId');
    
    console.log('🔍 URL Parameters:', { filterParam, tabParam, opportunityIdParam });
    
    if (filterParam === 'accepted') {
      setTab('applied');
      setFilter('accepted');
    } else {
      setFilter('all');
    }
    
    // Handle tab parameter
    if (tabParam === 'posted') {
      setTab('posted');
    } else if (tabParam === 'applied') {
      setTab('applied');
    }
    
    // Handle opportunityId parameter - store for processing after data loads
    if (opportunityIdParam && tabParam === 'posted') {
      console.log('🎯 Setting pendingOpportunityId for posted:', opportunityIdParam);
      window.pendingOpportunityId = opportunityIdParam;
    } else if (opportunityIdParam && (tabParam === 'applied' || filterParam === 'accepted')) {
      console.log('🎯 Setting pendingAppliedOpportunityId for applied:', opportunityIdParam);
      window.pendingAppliedOpportunityId = opportunityIdParam;
    } else {
      // Clear any existing pending IDs if no opportunityId in URL
      window.pendingOpportunityId = null;
      window.pendingAppliedOpportunityId = null;
    }
  }, [location.search]);

  // Fetch current user's name for the profile avatar
  useEffect(() => {
    const fetchCurrentUserName = async () => {
      try {
        const res = await fetch(buildApiUrl('employees'));
        const data = await res.json();
        const employees = data.employees || data || [];
        
        // Create email to name mapping
        const emailToNameMap = {};
        employees.forEach(emp => {
          emailToNameMap[emp.email] = emp.name;
        });
        setEmailToName(emailToNameMap);
        
        const currentUser = employees.find(emp => 
          (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
        );
        if (currentUser) {
          setCurrentUserName(currentUser.name || '');
        }
      } catch (err) {
        console.error('Error fetching user name:', err);
      }
    };
    
    if (userEmail) {
      fetchCurrentUserName();
    }
  }, [userEmail]);

  // Save applicant statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finder_applicant_statuses', JSON.stringify(applicantStatuses));
  }, [applicantStatuses]);

  // Fetch counts for both applied and posted opportunities (always run)
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [opportunitiesData, employeesData] = await Promise.all([
          fetch(buildApiUrl('opportunities')).then(res => res.json()),
          fetch(buildApiUrl('employees')).then(res => res.json())
        ]);

        const allOpportunities = opportunitiesData.opportunities || [];
        const currentUserEmail = (userEmail || '').trim().toLowerCase();

        // Count applied opportunities
        const appliedOpportunities = allOpportunities.filter(opp => {
          const appliedList = opp.applied || [];
          return appliedList.some(email => 
            (email || '').trim().toLowerCase() === currentUserEmail
          );
        });

        // Count posted opportunities
        const postedOpportunities = allOpportunities.filter(opp => {
          const oppEmail = (opp.email || '').trim().toLowerCase();
          return oppEmail === currentUserEmail;
        });

        setAppliedCount(appliedOpportunities.length);
        setPostedCount(postedOpportunities.length);
      } catch (err) {
        console.error('Error fetching opportunity counts:', err);
      }
    };

    if (userEmail) {
      fetchCounts();
    }
  }, [userEmail, applicantStatuses]);

  // Manual sync function for testing - can be called from browser console
  window.fixCurrentUserOpp1Status = () => {
    const currentUserEmail = localStorage.getItem('finder_email') || '';
    console.log('Current user email:', currentUserEmail);
    
    // Find Opp 1 and set current user's status to accepted
    fetch(buildApiUrl('opportunities'))
      .then(res => res.json())
      .then(data => {
        const allOpportunities = data.opportunities || [];
        const opp1 = allOpportunities.find(opp => opp.title === 'Opp 1');
        
        if (opp1) {
          const oppIndex = allOpportunities.findIndex(allOpp => 
            allOpp.title === opp1.title && 
            allOpp.email === opp1.email && 
            allOpp.description === opp1.description
          );
          
          const statusKey = `${oppIndex}-${currentUserEmail}`;
          
          // Update localStorage directly
          const currentStatuses = JSON.parse(localStorage.getItem('finder_applicant_statuses') || '{}');
          currentStatuses[statusKey] = 'confirmed';
          localStorage.setItem('finder_applicant_statuses', JSON.stringify(currentStatuses));
          
          console.log(`Fixed status for Opp 1 - User: ${currentUserEmail}, StatusKey: ${statusKey}, set to: confirmed`);
          console.log('Updated statuses:', currentStatuses);
          
          // Trigger a reload to see the change
          window.location.reload();
        } else {
          console.log('Opp 1 not found!');
        }
      })
      .catch(err => console.error('Error fixing status:', err));
  };

  // Manual fix function for Opp 3 - can be called from browser console
  window.fixCurrentUserOpp3Status = () => {
    const currentUserEmail = localStorage.getItem('finder_email') || '';
    console.log('Current user email:', currentUserEmail);
    
    // Find Opp 3 and set current user's status to accepted
    fetch(buildApiUrl('opportunities'))
      .then(res => res.json())
      .then(data => {
        const allOpportunities = data.opportunities || [];
        const opp3 = allOpportunities.find(opp => opp.title === 'Opp 3');
        
        if (opp3) {
          const oppIndex = allOpportunities.findIndex(allOpp => 
            allOpp.title === opp3.title && 
            allOpp.email === opp3.email && 
            allOpp.description === opp3.description
          );
          
          const statusKey = `${oppIndex}-${currentUserEmail}`;
          
          // Update localStorage directly
          const currentStatuses = JSON.parse(localStorage.getItem('finder_applicant_statuses') || '{}');
          currentStatuses[statusKey] = 'confirmed';
          localStorage.setItem('finder_applicant_statuses', JSON.stringify(currentStatuses));
          
          console.log(`Fixed status for Opp 3 - User: ${currentUserEmail}, StatusKey: ${statusKey}, set to: confirmed`);
          console.log('Updated statuses:', currentStatuses);
          
          // Trigger a reload to see the change
          window.location.reload();
        } else {
          console.log('Opp 3 not found!');
        }
      })
      .catch(err => console.error('Error fixing status:', err));
  };

  // Debug function to check all statuses
  window.debugAllStatuses = () => {
    const currentUserEmail = localStorage.getItem('finder_email') || '';
    const currentStatuses = JSON.parse(localStorage.getItem('finder_applicant_statuses') || '{}');
    
    console.log('Current user email:', currentUserEmail);
    console.log('All applicant statuses:', currentStatuses);
    
    // Find all opportunities and show their status keys
    fetch(buildApiUrl('opportunities'))
      .then(res => res.json())
      .then(data => {
        const allOpportunities = data.opportunities || [];
        console.log('All opportunities with their potential status keys:');
        
        allOpportunities.forEach((opp, index) => {
          const statusKey = `${index}-${currentUserEmail}`;
          const status = currentStatuses[statusKey];
          console.log(`${opp.title} (Index: ${index}) - StatusKey: ${statusKey} - Status: ${status || 'none'} - Server Status: ${opp.application_statuses?.[currentUserEmail] || 'none'}`);
        });
      });
  };

  // Function to clear all localStorage statuses and sync with server data only
  window.clearAllLocalStorageStatuses = () => {
    localStorage.removeItem('finder_applicant_statuses');
    console.log('✅ Cleared all localStorage statuses. Refreshing page to sync with server data only...');
    window.location.reload();
  };

  // Function to completely reset modal and notification state for testing
  window.resetModalState = () => {
    setShowOpportunityModal(false);
    setSelectedOpportunity(null);
    window.pendingOpportunityId = null;
    window.pendingAppliedOpportunityId = null;
    console.log('✅ Reset all modal and notification state');
  };

  // Test function to simulate clicking a rejection notification
  window.testRejectionNotification = (opportunityId) => {
    console.log('🧪 Testing rejection notification for opportunity ID:', opportunityId);
    const testUrl = `/dashboard?tab=applied&opportunityId=${opportunityId}`;
    console.log('🧪 Navigating to:', testUrl);
    navigate(testUrl);
  };

  // Quick function to test modal opening with correct IDs
  window.testModalWithCorrectId = () => {
    const currentUserEmail = localStorage.getItem('finder_email') || '';
    
    // Get applied opportunities and try to open the first one
    fetch(buildApiUrl('opportunities'))
      .then(res => res.json())
      .then(data => {
        const allOpportunities = data.opportunities || [];
        const appliedOpps = allOpportunities.filter(opp => {
          const appliedList = opp.applied || [];
          return appliedList.some(email => 
            (email || '').trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
          );
        });
        
        if (appliedOpps.length > 0) {
          const firstAppliedOpp = appliedOpps[0];
          const correctId = allOpportunities.findIndex(allOpp => 
            allOpp.title === firstAppliedOpp.title && 
            allOpp.email === firstAppliedOpp.email && 
            allOpp.description === firstAppliedOpp.description
          );
          
          console.log(`🧪 Testing with correct ID: ${correctId} for opportunity: ${firstAppliedOpp.title}`);
          const testUrl = `/dashboard?tab=applied&opportunityId=${correctId}`;
          navigate(testUrl);
        }
      });
  };

  // Test function to create a test rejection notification with correct ID
  window.createTestRejectionNotification = (opportunityId, opportunityTitle) => {
    const currentUserEmail = localStorage.getItem('finder_email') || '';
    
    // First, let's get the correct opportunity IDs from the server
    fetch(buildApiUrl('opportunities'))
      .then(res => res.json())
      .then(data => {
        const allOpportunities = data.opportunities || [];
        console.log('🔍 All opportunities with their IDs:');
        allOpportunities.forEach((opp, index) => {
          console.log(`ID: ${index}, Title: ${opp.title}, Email: ${opp.email}`);
        });
        
        // Find applied opportunities for current user
        const appliedOpps = allOpportunities.filter(opp => {
          const appliedList = opp.applied || [];
          return appliedList.some(email => 
            (email || '').trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
          );
        });
        
        console.log('🎯 Applied opportunities for current user:');
        appliedOpps.forEach((opp, appliedIndex) => {
          const originalIndex = allOpportunities.findIndex(allOpp => 
            allOpp.title === opp.title && 
            allOpp.email === opp.email && 
            allOpp.description === opp.description
          );
          console.log(`Applied ID: ${originalIndex}, Title: ${opp.title}, Status: ${opp.status || 'open'}`);
        });
        
        // Create a test notification for the first applied opportunity
        if (appliedOpps.length > 0) {
          const firstAppliedOpp = appliedOpps[0];
          const correctId = allOpportunities.findIndex(allOpp => 
            allOpp.title === firstAppliedOpp.title && 
            allOpp.email === firstAppliedOpp.email && 
            allOpp.description === firstAppliedOpp.description
          );
          
          const testNotification = {
            id: Date.now().toString(),
            type: 'application_rejected',
            title: 'Application Update',
            message: `Your application for "${firstAppliedOpp.title}" was not selected this time.`,
            icon: '❌',
            action: 'View Status',
            actionUrl: `/dashboard?tab=applied&opportunityId=${correctId}`,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          // Add to notifications
          const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUserEmail}`) || '[]');
          notifications.unshift(testNotification);
          localStorage.setItem(`notifications_${currentUserEmail}`, JSON.stringify(notifications));
          
          console.log('✅ Created test rejection notification with CORRECT ID:', testNotification);
          console.log(`🎯 Opportunity: "${firstAppliedOpp.title}" with ID: ${correctId}`);
          
          // Trigger a page refresh to see the notification
          window.location.reload();
        } else {
          console.log('❌ No applied opportunities found for current user');
        }
      })
      .catch(err => console.error('Error creating test notification:', err));
  };

  // Sync applicant statuses with notifications to ensure consistency
  useEffect(() => {
    if (userEmail) {
      try {
        // Get notifications for this user
        const notifications = NotificationService.getNotifications(userEmail);
        
        // Check for acceptance/rejection notifications and sync with applicantStatuses
        notifications.forEach(notification => {
          if (notification.type === 'application_accepted' || notification.type === 'application_rejected') {
            // Extract opportunity title from notification message
            const titleMatch = notification.message.match(/for "([^"]+)"/);
            if (titleMatch) {
              const oppTitle = titleMatch[1];
              
              // Find the opportunity with this title to get its ID
              fetch(buildApiUrl('opportunities'))
                .then(res => res.json())
                .then(data => {
                  const allOpportunities = data.opportunities || [];
                  const opportunity = allOpportunities.find(opp => opp.title === oppTitle);
                  
                  if (opportunity) {
                    const oppIndex = allOpportunities.findIndex(allOpp => 
                      allOpp.title === opportunity.title && 
                      allOpp.email === opportunity.email && 
                      allOpp.description === opportunity.description
                    );
                    
                    const statusKey = `${oppIndex}-${userEmail}`;
                    const newStatus = notification.type === 'application_accepted' ? 'confirmed' : 'rejected';
                    
                    // Update applicantStatuses if not already set
                    setApplicantStatuses(prev => {
                      if (!prev[statusKey] || prev[statusKey] !== newStatus) {
                        console.log(`Syncing status for ${oppTitle}: ${newStatus}`);
                        return {
                          ...prev,
                          [statusKey]: newStatus
                        };
                      }
                      return prev;
                    });
                  }
                })
                .catch(err => console.error('Error syncing notification status:', err));
            }
          }
        });
      } catch (err) {
        console.error('Error syncing notifications:', err);
      }
    }
  }, [userEmail]);

  // Fetch applied opportunities
  useEffect(() => {
    if (tab === 'applied') {
      console.log('🚀 Fetching applied opportunities, tab:', tab);
      // Fetch both opportunities and any status information
      Promise.all([
        fetch(buildApiUrl('opportunities')).then(res => res.json()),
        fetch(buildApiUrl('employees')).then(res => res.json())
      ])
        .then(([opportunitiesData, employeesData]) => {
          // Extract opportunities array from the API response
          const allOpportunities = opportunitiesData.opportunities || [];
          const allEmployees = employeesData.employees || employeesData || [];
          
          // Create email to name mapping
          const emailToName = {};
          allEmployees.forEach(emp => {
            emailToName[emp.email] = emp.name;
          });
          
          // Filter opportunities where the current user has applied
          const userApplied = allOpportunities.filter(opp => {
            const appliedList = opp.applied || [];
            const currentUserEmail = (userEmail || '').trim().toLowerCase();
            return appliedList.some(email => 
              (email || '').trim().toLowerCase() === currentUserEmail
            );
          });
          
          // Transform and determine status for each applied opportunity
          const formattedApplied = userApplied.map((opp, index) => {
            const originalIndex = allOpportunities.findIndex(allOpp => 
              allOpp.title === opp.title && 
              allOpp.email === opp.email && 
              allOpp.description === opp.description
            );
            
            // Check application status from both server data and localStorage
            // Server data (opp.application_statuses) takes priority over localStorage
            // This ensures consistency across different browser sessions and devices
            let userApplicationStatus = null;
            
            // First check server application_statuses for authoritative data
            if (opp.application_statuses && opp.application_statuses[userEmail]) {
              const serverStatus = opp.application_statuses[userEmail];
              userApplicationStatus = serverStatus === 'accepted' ? 'confirmed' : 'rejected';
              
              // Sync localStorage with server data
              const statusKey = `${originalIndex}-${userEmail}`;
              setApplicantStatuses(prev => ({
                ...prev,
                [statusKey]: userApplicationStatus
              }));
            } else {
              // No server data available - default to null/In Review
              // Do not fall back to localStorage to avoid showing incorrect statuses
              userApplicationStatus = null;
              
              // Clear any stale localStorage data for this opportunity
              const statusKey = `${originalIndex}-${userEmail}`;
              if (applicantStatuses[statusKey]) {
                console.log(`🧹 Clearing stale localStorage status for opportunity ${opp.title} (ID: ${originalIndex})`);
                setApplicantStatuses(prev => {
                  const updated = { ...prev };
                  delete updated[statusKey];
                  return updated;
                });
              }
            }
            
            // Determine status based on opportunity state and user's application status
            // Determine candidate status only (global Open/Closed is shown separately)
            let status = [];
            let primaryStatus = 'In Review'; // Default
            
            if (userApplicationStatus === 'confirmed') {
              status.push('Accepted');
              primaryStatus = 'Accepted';
            } else if (userApplicationStatus === 'rejected') {
              status.push('Not Considered');
              primaryStatus = 'Not Considered';
            } else {
              status.push('In Review');
              primaryStatus = 'In Review';
            }
            
            return {
              id: originalIndex,
              originalId: originalIndex, // Keep track of original ID for status lookup
              title: opp.title,
              status: primaryStatus,
              statusArray: status, // Array of all applicable statuses
              tags: opp.skills || [],
              duration: `${opp.hoursPerWeek} Hours/Week`,
              description: opp.description,
              domain: opp.domain,
              type: opp.type,
              startDate: opp.startDate,
              endDate: opp.endDate,
              hoursPerWeek: opp.hoursPerWeek,
              skills: opp.skills,
              roles: opp.roles,
              email: opp.email,
              postedBy: emailToName[opp.email] || 'Unknown User',
              isOpportunityClosed: opp.status === 'closed',
              userApplicationStatus: userApplicationStatus // For debugging
            };
          });
          
          setOpportunities(formattedApplied);
        })
        .catch(err => console.error('Error fetching applied opportunities:', err));
    }
  }, [tab, userEmail]); // Removed applicantStatuses dependency since we now prioritize server data

  // Dedicated effect to handle modal opening from notifications
  useEffect(() => {
    console.log('🎯 Modal opening effect triggered');
    console.log('🎯 pendingAppliedOpportunityId:', window.pendingAppliedOpportunityId);
    console.log('🎯 pendingOpportunityId:', window.pendingOpportunityId);
    console.log('🎯 tab:', tab);
    console.log('🎯 opportunities.length:', opportunities.length);
    console.log('🎯 postedOpportunities.length:', postedOpportunities.length);
    
    // Handle applied opportunity modal opening
    if (window.pendingAppliedOpportunityId && tab === 'applied' && opportunities.length > 0) {
      const targetOpportunity = opportunities.find(
        opp => opp.id.toString() === window.pendingAppliedOpportunityId
      );
      
      if (targetOpportunity) {
        console.log('✅ Opening modal for applied opportunity:', targetOpportunity.title);
        
        // Clear existing state first
        setSelectedOpportunity(null);
        setShowOpportunityModal(false);
        
        // Set new state after a brief delay
        requestAnimationFrame(() => {
          setSelectedOpportunity(targetOpportunity);
          setShowOpportunityModal(true);
        });
        
        // Clear the pending ID and update URL
        window.pendingAppliedOpportunityId = null;
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('opportunityId');
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.log('❌ Applied opportunity not found with ID:', window.pendingAppliedOpportunityId);
      }
    }
    
    // Handle posted opportunity modal opening
    if (window.pendingOpportunityId && tab === 'posted' && postedOpportunities.length > 0) {
      const targetOpportunity = postedOpportunities.find(
        opp => opp.id.toString() === window.pendingOpportunityId
      );
      
      if (targetOpportunity) {
        console.log('✅ Opening modal for posted opportunity:', targetOpportunity.title);
        
        // Clear existing state first
        setSelectedOpportunity(null);
        setShowOpportunityModal(false);
        
        // Set new state after a brief delay
        requestAnimationFrame(() => {
          setSelectedOpportunity(targetOpportunity);
          setShowOpportunityModal(true);
        });
        
        // Clear the pending ID and update URL
        window.pendingOpportunityId = null;
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('opportunityId');
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.log('❌ Posted opportunity not found with ID:', window.pendingOpportunityId);
      }
    }
  }, [tab, opportunities, postedOpportunities]); // This will trigger whenever these change

  // Fetch posted opportunities
  useEffect(() => {
    if (tab === 'posted') {
      console.log('🚀 Fetching posted opportunities, tab:', tab);
      // Fetch both opportunities and employees to map emails to names
      Promise.all([
        fetch(buildApiUrl('opportunities')).then(res => res.json()),
        fetch(buildApiUrl('employees')).then(res => res.json())
      ])
        .then(([opportunitiesData, employeesData]) => {
          // Extract opportunities array from the API response
          const allOpportunities = opportunitiesData.opportunities || [];
          const allEmployees = employeesData.employees || employeesData || [];
          
          // Create email to name mapping
          const emailToName = {};
          allEmployees.forEach(emp => {
            emailToName[emp.email] = emp.name;
          });
          
          // Filter opportunities posted by the current user
          const userPosted = allOpportunities.filter(opp => {
            const oppEmail = (opp.email || '').trim().toLowerCase();
            const currentUserEmail = (userEmail || '').trim().toLowerCase();
            return oppEmail === currentUserEmail;
          });
          
          // Map applied emails to applicant objects with names
          const processedOpportunities = userPosted.map((opp) => {
            // Find the original index in the full opportunities array
            const originalIndex = allOpportunities.findIndex(allOpp => 
              allOpp.title === opp.title && 
              allOpp.email === opp.email && 
              allOpp.description === opp.description
            );
            return {
              ...opp,
              id: originalIndex,
              applicants: (opp.applied || []).map(email => ({
                email: email,
                name: emailToName[email] || 'Unknown User'
              }))
            };
          });
          
          setPostedOpportunities(processedOpportunities);
          
          // Auto-open opportunity modal if opportunityId is in URL
          if (window.pendingOpportunityId) {
            console.log('🔍 Looking for posted opportunity with ID:', window.pendingOpportunityId);
            console.log('🔍 Available posted opportunities:', processedOpportunities.map(o => ({ id: o.id, title: o.title })));
            
            const targetOpportunity = processedOpportunities.find(
              opp => opp.id.toString() === window.pendingOpportunityId
            );
            
            if (targetOpportunity) {
              console.log('✅ Found target posted opportunity:', targetOpportunity.title);
              setSelectedOpportunity(targetOpportunity);
              setShowOpportunityModal(true);
              // Clear the pending ID and update URL to remove the parameter
              window.pendingOpportunityId = null;
              const newUrl = new URL(window.location);
              newUrl.searchParams.delete('opportunityId');
              window.history.replaceState({}, '', newUrl.toString());
            } else {
              console.log('❌ Target posted opportunity not found with ID:', window.pendingOpportunityId);
            }
          }
        })
        .catch(err => console.error('Error fetching posted opportunities:', err));
    }
  }, [tab, userEmail]);

  // Update selected opportunity when applicant statuses change
  useEffect(() => {
    if (showOpportunityModal && selectedOpportunity) {
      const updatedOpp = postedOpportunities.find(opp => opp.id === selectedOpportunity.id);
      if (updatedOpp) {
        setSelectedOpportunity(updatedOpp);
      }
    }
  }, [applicantStatuses, postedOpportunities, showOpportunityModal]);

  const handleAcceptReject = async (oppId, applicantEmail, applicantName, action) => {
    const actionText = action === 'accept' ? 'accept' : 'reject';
    const title = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Candidate`;
    const message = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${applicantName}" for this role?`;
    
    showConfirmModal(title, message, async () => {
      try {
        // Update selectedOpportunity immediately for instant UI feedback
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        setSelectedOpportunity(prev => ({
          ...prev,
          application_statuses: {
            ...prev.application_statuses,
            [applicantEmail]: newStatus
          }
        }));

        // Also update the postedOpportunities array to keep data consistent
        setPostedOpportunities(prev => 
          prev.map(opp => 
            opp.id === oppId 
              ? {
                  ...opp,
                  application_statuses: {
                    ...opp.application_statuses,
                    [applicantEmail]: newStatus
                  }
                }
              : opp
          )
        );

        // Also update localStorage status for consistency (though modal doesn't use it)
        const statusKey = `${oppId}-${applicantEmail}`;
        setApplicantStatuses(prev => ({
          ...prev,
          [statusKey]: action === 'accept' ? 'confirmed' : 'rejected'
        }));

        // Send notification to applicant
        const opportunity = postedOpportunities.find(opp => opp.id === oppId);
        if (opportunity) {
          if (action === 'accept') {
            NotificationService.notifyApplicationAccepted(applicantEmail, opportunity.title, oppId);
          } else {
            NotificationService.notifyApplicationRejected(applicantEmail, opportunity.title, oppId);
          }
        }

        // Try to update server, but don't let server failure affect local UI
        const res = await fetch(buildApiUrl(`opportunities/${oppId}/${action}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicantEmail })
        });
        
        if (!res.ok) {
          console.log('Server update failed, but local status maintained');
        } else {
          console.log(`✅ Successfully ${action}ed ${applicantName} on server`);
        }
      } catch (err) {
        console.error('Accept/Reject error:', err);
      }
    });
  };

  const handleCloseOpportunity = async (oppId, oppTitle) => {
    showConfirmModal(
      'Close Opportunity',
      `Are you sure you want to close the opportunity "${oppTitle}"?`,
      async () => {
        try {
          // Find the opportunity and its applicants before closing
          const opportunity = postedOpportunities.find(opp => opp.id === oppId);
          const applicantEmails = opportunity ? (opportunity.applied || []) : [];

          const res = await fetch(buildApiUrl(`opportunities/${oppId}/close`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
          });
          
          if (res.ok) {
            // Send notifications to all applicants about opportunity closure
            applicantEmails.forEach(applicantEmail => {
              if (applicantEmail !== userEmail) { // Don't notify the poster
                NotificationService.notifyOpportunityClosed(applicantEmail, oppTitle, oppId);
              }
            });

            // Refresh the posted opportunities
            Promise.all([
              fetch(buildApiUrl('opportunities')).then(res => res.json()),
              fetch(buildApiUrl('employees')).then(res => res.json())
            ])
              .then(([opportunitiesData, employeesData]) => {
                const allOpportunities = opportunitiesData.opportunities || [];
                const allEmployees = employeesData.employees || employeesData || [];
                
                const emailToName = {};
                allEmployees.forEach(emp => {
                  emailToName[emp.email] = emp.name;
                });
                
                const userPosted = allOpportunities.filter(opp => opp.email === userEmail);
                const processedOpportunities = userPosted.map((opp) => {
                  const originalIndex = allOpportunities.findIndex(allOpp => 
                    allOpp.title === opp.title && 
                    allOpp.email === opp.email && 
                    allOpp.description === opp.description
                  );
                  return {
                    ...opp,
                    id: originalIndex,
                    applicants: (opp.applied || []).map(email => ({
                      email: email,
                      name: emailToName[email] || 'Unknown User'
                    }))
                  };
                });
                
                setPostedOpportunities(processedOpportunities);
              });
          }
        } catch (err) {
          console.error('Error closing opportunity:', err);
        }
      }
    );
  };

  const handleReopenOpportunity = async (oppId, oppTitle) => {
    showConfirmModal(
      'Reopen Opportunity',
      `Are you sure you want to reopen the opportunity "${oppTitle}"?`,
      async () => {
        try {
          const res = await fetch(buildApiUrl(`opportunities/${oppId}/reopen`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
          });
          
          if (res.ok) {
            // Refresh the posted opportunities
            Promise.all([
              fetch(buildApiUrl('opportunities')).then(res => res.json()),
              fetch(buildApiUrl('employees')).then(res => res.json())
            ])
              .then(([opportunitiesData, employeesData]) => {
                const allOpportunities = opportunitiesData.opportunities || [];
                const allEmployees = employeesData.employees || employeesData || [];
                
                const emailToName = {};
                allEmployees.forEach(emp => {
                  emailToName[emp.email] = emp.name;
                });
                
                const userPosted = allOpportunities.filter(opp => opp.email === userEmail);
                const processedOpportunities = userPosted.map((opp) => {
                  const originalIndex = allOpportunities.findIndex(allOpp => 
                    allOpp.title === opp.title && 
                    allOpp.email === opp.email && 
                    allOpp.description === opp.description
                  );
                  return {
                    ...opp,
                    id: originalIndex,
                    applicants: (opp.applied || []).map(email => ({
                      email: email,
                      name: emailToName[email] || 'Unknown User'
                    }))
                  };
                });
                
                setPostedOpportunities(processedOpportunities);
              });
          }
        } catch (err) {
          console.error('Error reopening opportunity:', err);
        }
      }
    );
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setModalData({ title, message, onConfirm });
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    if (modalData.onConfirm) {
      modalData.onConfirm();
    }
    setShowModal(false);
    setModalData({});
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalData({});
  };

  const handleViewProfile = async (email) => {
    try {
      const res = await fetch(buildApiUrl('employees'));
      const data = await res.json();
      const employees = data.employees || data || [];
      const profile = employees.find(emp => 
        (emp.email || '').trim().toLowerCase() === email.trim().toLowerCase()
      );
      
      if (profile) {
        setSelectedProfile(profile);
        setShowProfileModal(true);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const statusColors = {
    'In Review': 'bg-yellow-400',
    'Accepted': 'bg-green-600',
    'Not Considered': 'bg-red-600',
  };

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      <HeaderBar userEmail={userEmail} userName={currentUserName} />
      
      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{modalData.title}</h3>
            <p className="text-gray-600 mb-6">{modalData.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-finder-blue-600 text-white rounded hover:bg-finder-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Opportunity Details Modal */}
      {showOpportunityModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedOpportunity.title}</h2>
                    <div className="flex items-center gap-4">
                      {selectedOpportunity.isOpportunityClosed ? (
                        <span className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full">
                          Closed
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                          Open
                        </span>
                      )}
                        {tab === 'applied' ? (
                          <span className="text-finder-blue-600 font-medium">
                            Posted by: <span 
                              className="cursor-pointer hover:text-finder-blue-700 underline transition-colors"
                              onClick={() => handleViewProfile(selectedOpportunity.email)}
                            >
                              {selectedOpportunity.postedBy}
                            </span>
                          </span>
                        ) : (
                          <span className="text-finder-blue-600 font-medium">
                            {selectedOpportunity.applicants ? selectedOpportunity.applicants.length : 0} Applications
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOpportunityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Opportunity Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedOpportunity.description || '-'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Domain</h3>
                    <p className="text-gray-600">{selectedOpportunity.domain || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Type</h3>
                    <p className="text-gray-600">{selectedOpportunity.type || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Industry</h3>
                    <p className="text-gray-600">{selectedOpportunity.industry || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Hours per Week</h3>
                    <p className="text-gray-600">{selectedOpportunity.hoursPerWeek || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Start Date</h3>
                    <p className="text-gray-600">{selectedOpportunity.startDate || '-'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">End Date</h3>
                    <p className="text-gray-600">{selectedOpportunity.endDate || '-'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Roles</h3>
                  {selectedOpportunity.roles && selectedOpportunity.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.roles.map((role, idx) => (
                        <span key={idx} className="px-2 py-1 bg-finder-blue-100 text-finder-blue-800 text-sm rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">-</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Skills</h3>
                  {selectedOpportunity.skills && selectedOpportunity.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">-</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Posted by</h3>
                  <p 
                    className="text-finder-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleViewProfile(selectedOpportunity.email)}
                  >
                    {emailToName[selectedOpportunity.email] || 'Unknown User'}
                  </p>
                </div>
              </div>

              {/* Application Status for Applied Tab */}
              {tab === 'applied' && selectedOpportunity.statusArray && (
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Application Status</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOpportunity.statusArray.map((status, idx) => (
                      <span 
                        key={idx} 
                        className={`text-white px-3 py-1 text-sm rounded-full ${statusColors[status]}`}
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicants Section for Posted Tab */}
              {tab === 'posted' && (
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Applicants</h3>
                  </div>
                  
                  {selectedOpportunity.applicants && selectedOpportunity.applicants.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOpportunity.applicants.map((applicant, idx) => {
                        const statusKey = `${selectedOpportunity.id}-${applicant.email}`;
                        const isOpportunityClosed = selectedOpportunity.status === 'closed';
                        
                        // For opportunity posters, only use server data - never fall back to localStorage
                        let applicantStatus = null;
                        
                        // Check if there's server-side application_statuses data
                        if (selectedOpportunity.application_statuses && selectedOpportunity.application_statuses[applicant.email]) {
                          const serverStatus = selectedOpportunity.application_statuses[applicant.email];
                          applicantStatus = serverStatus === 'accepted' ? 'confirmed' : 'rejected';
                          console.log(`🔍 Using server status for ${applicant.email}: ${applicantStatus}`);
                        } else {
                          console.log(`🔍 No server status found for ${applicant.email}, showing Accept/Reject buttons`);
                        }
                        // If no server data exists, applicantStatus remains null (no decision made yet)
                        
                        return (
                          <div key={`${idx}-${applicantStatus || 'none'}`} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1">
                              <p 
                                className="font-medium text-gray-800 cursor-pointer hover:text-finder-blue-600 transition-colors"
                                onClick={() => handleViewProfile(applicant.email)}
                              >
                                {applicant.name}
                              </p>
                              <p className="text-sm text-gray-500">{applicant.email}</p>
                              
                              {/* Show candidate status */}
                              <div className="mt-1 space-y-1">
                                {applicantStatus && (
                                  <p className={`text-sm font-medium ${
                                    applicantStatus === 'confirmed' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {applicantStatus === 'confirmed' ? '✅ Candidate Accepted' : '❌ Candidate Rejected'}
                                  </p>
                                )}
                                {!applicantStatus && !isOpportunityClosed && (
                                  <p className="text-sm text-yellow-600">
                                    ⏳ Pending Decision
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Only show Accept/Reject buttons if no decision made and opportunity is open */}
                            {!applicantStatus && !isOpportunityClosed && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleAcceptReject(selectedOpportunity.id, applicant.email, applicant.name, 'accept')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleAcceptReject(selectedOpportunity.id, applicant.email, applicant.name, 'reject')}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Not Considered
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No applications yet</p>
                  )}
                </div>
              )}

              {/* Close/Reopen Opportunity Button for Posted Tab */}
              {tab === 'posted' && (
                <div className="border-t pt-4 flex justify-center">
                  {selectedOpportunity.status === 'closed' ? (
                    <button
                      onClick={() => handleReopenOpportunity(selectedOpportunity.id, selectedOpportunity.title)}
                      className="px-6 py-3 bg-finder-blue-600 text-white font-medium rounded-lg hover:bg-finder-blue-700 transition-colors"
                    >
                      Reopen Opportunity
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCloseOpportunity(selectedOpportunity.id, selectedOpportunity.title)}
                      className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Close Opportunity
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Details</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Profile Content */}
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex justify-center mb-6">
                  {(() => {
                    const savedPicture = localStorage.getItem(`profile_picture_${selectedProfile.email}`);
                    if (savedPicture) {
                      return (
                        <img 
                          src={savedPicture} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                        />
                      );
                    } else {
                      // Generate initials and color
                      const name = selectedProfile.name || 'Unknown User';
                      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400'];
                      const colorIndex = name.length % colors.length;
                      return (
                        <div className={`w-24 h-24 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xl font-bold border-4 border-blue-100`}>
                          {initials}
                        </div>
                      );
                    }
                  })()}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Name</h3>
                  <p className="text-gray-600">{selectedProfile.name || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Email</h3>
                  <p className="text-gray-600">{selectedProfile.email}</p>
                </div>

                {selectedProfile.role && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Role</h3>
                    <p className="text-gray-600">{selectedProfile.role}</p>
                  </div>
                )}

                {selectedProfile.domain && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Domain</h3>
                    <p className="text-gray-600">{selectedProfile.domain}</p>
                  </div>
                )}

                {selectedProfile.industry && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Industry</h3>
                    <p className="text-gray-600">{selectedProfile.industry}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <section className="text-center mt-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-8 text-center flex items-center justify-center gap-3">
          Your next firm contribution starts with 
          <img src={finderLogo} alt="FInder" className="h-6 md:h-8 inline-block -mt-1" />
        </h1>
        <p className="mt-2 text-gray-500">
          FInder your next opportunity here!
        </p>
      </section>

      <div className="flex justify-center mt-8">
        <div className="flex border rounded-xl overflow-hidden">
          <button 
            onClick={() => {
              setTab('applied');
              setFilter('all');
              navigate('/dashboard');
            }} 
            className={`px-6 py-2 font-medium ${tab === 'applied' ? 'bg-finder-blue-600 text-white' : 'bg-white text-finder-blue-600'}`}
          >
            Opportunities Applied ({appliedCount})
          </button>
          <button 
            onClick={() => {
              setTab('posted');
              setFilter('all');
              navigate('/dashboard');
            }} 
            className={`px-6 py-2 font-medium ${tab === 'posted' ? 'bg-finder-blue-600 text-white' : 'bg-white text-finder-blue-600'}`}
          >
            Opportunities Posted ({postedCount})
          </button>
        </div>
      </div>

      {/* Filter indicator */}
      {filter === 'accepted' && tab === 'applied' && (
        <div className="flex justify-center mt-4">
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm font-medium">Showing accepted opportunities only</span>
            <button 
              onClick={() => {
                setFilter('all');
                navigate('/dashboard');
              }}
              className="ml-2 text-purple-600 hover:text-purple-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="px-8 mt-8 pb-10">
        {tab === 'applied' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities
              .filter(opp => {
                if (filter === 'accepted') {
                  return opp.status === 'Accepted' || opp.statusArray?.includes('Accepted');
                }
                return true; // Show all if filter is 'all'
              })
              .sort((a, b) => {
                // Sort open opportunities before closed ones
                if (!a.isOpportunityClosed && b.isOpportunityClosed) return -1;
                if (a.isOpportunityClosed && !b.isOpportunityClosed) return 1;
                
                // Within same status (open/closed), sort by most recent first (higher originalId = newer)
                return b.originalId - a.originalId;
              })
              .map((opp, i) => (
              <div 
                key={i} 
                className={`bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition-shadow ${opp.isOpportunityClosed ? 'opacity-75' : ''}`}
                onClick={() => {
                  setSelectedOpportunity(opp);
                  setShowOpportunityModal(true);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg flex-1">{opp.title}</h3>
                  <div className="flex flex-wrap gap-1 items-center">
                    {/* Candidate application status badge(s) */}
                    {opp.statusArray.map((status, idx) => (
                      <span 
                        key={idx} 
                        className={`text-white px-2 py-1 text-xs rounded-full ${statusColors[status]}`}
                      >
                        {status}
                      </span>
                    ))}
                    {/* Opportunity global status badge */}
                    {opp.isOpportunityClosed ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white ml-1">Closed</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white ml-1">Open</span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opp.description}</p>
                
                <div className="text-right text-xs text-gray-500">
                  Posted by: <span 
                    className="cursor-pointer hover:text-finder-blue-600 underline transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(opp.email);
                    }}
                  >
                    {opp.postedBy}
                  </span>
                </div>
              </div>
            ))}
            {opportunities.filter(opp => {
              if (filter === 'accepted') {
                return opp.status === 'Accepted' || opp.statusArray?.includes('Accepted');
              }
              return true;
            }).length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  {filter === 'accepted' ? (
                    <>
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accepted Opportunities Yet</h3>
                      <p className="text-gray-500 mb-6">
                        You haven't been accepted to any opportunities yet. Keep applying and showcasing your skills!
                      </p>
                      <button
                        onClick={() => {
                          setFilter('all');
                          navigate('/dashboard');
                        }}
                        className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium transition-colors mr-3"
                      >
                        View All Applications
                      </button>
                      <button
                        onClick={() => navigate('/find-opportunities')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                      >
                        Find More Opportunities
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">🚀</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Launch Your Next Adventure?</h3>
                      <p className="text-gray-500 mb-6">
                        Discover exciting opportunities waiting for you! Browse available positions and take the first step toward your next career milestone.
                      </p>
                      <button
                        onClick={() => navigate('/find-opportunities')}
                        className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium transition-colors"
                      >
                        Explore Opportunities
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'posted' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...postedOpportunities]
              .sort((a, b) => {
                // Sort closed opportunities to the end
                if (a.status === 'closed' && b.status !== 'closed') return 1;
                if (a.status !== 'closed' && b.status === 'closed') return -1;
                
                // Within same status (open/closed), sort by most recent first (higher index = newer)
                return b.id - a.id;
              })
              .map((opp) => (
              <div 
                key={opp.id} 
                className={`bg-white rounded-xl shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${opp.status === 'closed' ? 'opacity-75' : ''}`}
                onClick={() => {
                  setSelectedOpportunity(opp);
                  setShowOpportunityModal(true);
                }}
              >
                <div className="p-6">
                  {/* Header with title and status */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg flex-1">{opp.title}</h3>
                    {opp.status === 'closed' ? (
                      <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                        Closed
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Open
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opp.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-finder-blue-600 font-medium">
                      {opp.applicants ? opp.applicants.length : 0} Applications
                    </span>
                    <span className="text-gray-400 text-sm">Click to view details</span>
                  </div>
                </div>
              </div>
            ))}
            {postedOpportunities.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">💡</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Share Your Vision, Build Your Team!</h3>
                  <p className="text-gray-500 mb-6">
                    Have an amazing project idea? Create your first opportunity and connect with talented individuals who can help bring your vision to life.
                  </p>
                  <button
                    onClick={() => navigate('/post-opportunity')}
                    className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium transition-colors"
                  >
                    Post Your First Opportunity
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import Register from './Register';
import Profile from './Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/find-opportunities" element={<FindOpportunities />} />
        <Route path="/post-opportunity" element={<PostOpportunity />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/opportunity/:id" element={<OpportunityDetails />} />
      </Routes>
    </Router>
  );
}
