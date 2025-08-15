import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import NotificationBell from './NotificationBell';
import NotificationService from './NotificationService';
import { buildApiUrl } from './utils/api';
import finderLogo from './assets/Logo FI.png';
import HeaderBar from './HeaderBar';

// Enhanced UI for closed opportunities - Latest version with greyed out cards and removed buttons
const domainOptions = [
  "All",
  "Cross-Domain",
  "Customer & Commercial Strategy",
  "Agency Strategy",
  "Marketing Strategy",
  "Commerce Strategy",
  "Pricing & Sales Strategy",
  "Service Strategy",
  "Innovation & Product Strategy"
];

const typeOptions = [
  "All",
  "Proposal / POV",
  "Client Operations",
  "Domain / Industry Operations",
  "Other"
];

const statusOptions = [
  "All",
  "Open",
  "Closed", 
  "Applied",
  "Not Interested"
];

export default function FindOpportunities() {
  const [opps, setOpps] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [domain, setDomain] = useState('All');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [showNotInterested, setShowNotInterested] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('finder_email') || '';

  useEffect(() => {
    // Fetch both opportunities and employees
    Promise.all([
      fetch(buildApiUrl('opportunities')).then(res => res.json()),
      fetch(buildApiUrl('employees')).then(res => res.json())
    ])
      .then(([opportunitiesData, employeesData]) => {
        console.log('Fetched opportunities:', opportunitiesData);
        console.log('Fetched employees:', employeesData);
        if (opportunitiesData.success) setOpps(opportunitiesData.opportunities);
        const allEmployees = employeesData.employees || employeesData || [];
        setEmployees(allEmployees);
        
        // Find current user's name
        const currentUser = allEmployees.find(emp => 
          (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
        );
        if (currentUser) {
          setCurrentUserName(currentUser.name || '');
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setOpps([]);
        setEmployees([]);
      });
  }, []);

  // Create email to name mapping
  const emailToName = {};
  employees.forEach(emp => {
    emailToName[emp.email] = emp.name;
  });

  const handleApply = async (oppId) => {
    try {
      const res = await fetch(buildApiUrl(`opportunities/${oppId}/apply`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (res.ok) {
        // Find the current user's name for the notification
        const currentUser = employees.find(emp => 
          (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
        );
        const applicantName = currentUser ? currentUser.name : 'Someone';

        // Send notification to opportunity poster
        const opportunity = opps.find(opp => opp.id === oppId);
        if (opportunity && opportunity.email && opportunity.email !== userEmail) {
          NotificationService.notifyOpportunityPoster(
            opportunity.email,
            applicantName,
            opportunity.title,
            oppId
          );
        }

        // Refresh opportunities
        const updatedRes = await fetch(buildApiUrl('opportunities'));
        const updatedData = await updatedRes.json();
        if (updatedData.success) setOpps(updatedData.opportunities);
        
        setShowOpportunityModal(false);
      }
    } catch (err) {
      console.error('Apply error:', err);
    }
  };

  const handleMarkNotInterested = async (oppId) => {
    try {
      const res = await fetch(buildApiUrl(`opportunities/${oppId}/not_interested`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (res.ok) {
        // Refresh opportunities
        const updatedRes = await fetch(buildApiUrl('opportunities'));
        const updatedData = await updatedRes.json();
        if (updatedData.success) setOpps(updatedData.opportunities);
        
        setShowOpportunityModal(false);
      }
    } catch (err) {
      console.error('Mark not interested error:', err);
    }
  };

  const handleViewProfile = async (email) => {
    try {
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

  // Filter opportunities based on selected criteria
  let filteredOpps = opps.filter(o => {
    // Domain filter
    if (domain !== 'All' && o.domain !== domain) return false;
    
    // Type filter
    if (type !== 'All' && o.type !== type) return false;
    
    // Status filter
    if (status !== 'All') {
      if (status === 'Open') {
        return o.status === 'open';
      } else if (status === 'Closed') {
        return o.status === 'closed';
      } else if (status === 'Applied') {
        return o.applied && o.applied.includes(userEmail);
      } else if (status === 'Not Interested') {
        return o.not_interested && o.not_interested.includes(userEmail);
      }
    }
    
    return true;
  });

  // Filter out not interested opportunities if the toggle is off (and status is not "Not Interested" or "Applied")
  if (!showNotInterested && status !== 'Not Interested' && status !== 'Applied') {
    filteredOpps = filteredOpps.filter(o => 
      !(o.not_interested && o.not_interested.includes(userEmail))
    );
  }

  // Sort opportunities: Open first, then closed; within each category, newest first
  filteredOpps = filteredOpps.sort((a, b) => {
    // Sort open opportunities before closed ones
    if (a.status !== 'closed' && b.status === 'closed') return -1;
    if (a.status === 'closed' && b.status !== 'closed') return 1;
    
    // Within same status (open/closed), sort by most recent first (higher id = newer)
    return b.id - a.id;
  });

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      <HeaderBar userEmail={userEmail} userName={currentUserName} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Find Opportunities</h1>
          <p className="text-gray-600">Discover and apply for opportunities that match your skills and interests</p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finder-blue-500"
              >
                {domainOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finder-blue-500"
              >
                {typeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finder-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDomain('All');
                  setType('All');
                  setStatus('All');
                }}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNotInterested}
                onChange={e => setShowNotInterested(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-600 font-medium">Show not interested</span>
            </label>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpps.map((opp, i) => {
            const hasApplied = opp.applied && opp.applied.includes(userEmail);
            const isNotInterested = opp.not_interested && opp.not_interested.includes(userEmail);
            const isClosed = opp.status === 'closed';
            // Check application status from server
            const applicationStatus = opp.application_statuses && opp.application_statuses[userEmail];
            
            // Grey out if not interested OR if opportunity is closed
            const shouldGreyOut = isNotInterested || isClosed;
            
            return (
              <div
                key={i}
                className={`bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition-shadow ${
                  shouldGreyOut ? 'opacity-50 bg-gray-100' : ''
                }`}
                onClick={() => {
                  setSelectedOpportunity(opp);
                  setShowOpportunityModal(true);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-bold text-lg flex-1 ${shouldGreyOut ? 'text-gray-500' : ''}`}>
                    {opp.title}
                  </h3>
                  <div className="flex gap-1">
                    {opp.status === 'closed' ? (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        Closed
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Open
                      </span>
                    )}
                    {hasApplied && !applicationStatus && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Applied
                      </span>
                    )}
                    {applicationStatus === 'accepted' && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        Accepted
                      </span>
                    )}
                    {applicationStatus === 'rejected' && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                        Not Considered
                      </span>
                    )}
                    {isNotInterested && (
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                        Not Interested
                      </span>
                    )}
                  </div>
                </div>
                
                <p className={`text-gray-600 text-sm mb-4 line-clamp-2 ${
                  shouldGreyOut ? 'text-gray-400' : ''
                }`}>
                  {opp.description}
                </p>
                
                <div className={`text-right text-xs text-gray-500 ${
                  shouldGreyOut ? 'text-gray-400' : ''
                }`}>
                  Posted by: {emailToName[opp.email] || 'Unknown User'}
                </div>
              </div>
            );
          })}
        </div>

        {filteredOpps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No opportunities found matching your criteria.</p>
          </div>
        )}
      </main>

      {/* Opportunity Modal */}
      {showOpportunityModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedOpportunity.title}</h2>
                  <div className="flex items-center gap-2">
                    {selectedOpportunity.status === 'closed' ? (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                        Closed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                        Open
                      </span>
                    )}
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

              {/* Content */}
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

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {selectedOpportunity.email === userEmail ? (
                  /* Show dashboard link for poster */
                  <div className="text-center">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">You posted this opportunity</h3>
                      <p className="text-gray-500 text-sm">View and manage this opportunity from your dashboard</p>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard', { state: { tab: 'posted' } })}
                      className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  /* Show apply/not interested for non-posters */
                  (() => {
                    const hasApplied = selectedOpportunity.applied && selectedOpportunity.applied.includes(userEmail);
                    const isNotInterested = selectedOpportunity.not_interested && selectedOpportunity.not_interested.includes(userEmail);
                    const applicationStatus = selectedOpportunity.application_statuses && selectedOpportunity.application_statuses[userEmail];
                    
                    if (applicationStatus === 'accepted') {
                      return (
                        <div className="text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
                              ✅ Application Status
                            </div>
                            <p className="text-green-600 text-sm mt-2 font-semibold">Accepted</p>
                          </div>
                        </div>
                      );
                    } else if (applicationStatus === 'rejected') {
                      return (
                        <div className="text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium">
                              ❌ Application Status
                            </div>
                            <p className="text-red-600 text-sm mt-2 font-semibold">Not Considered</p>
                          </div>
                        </div>
                      );
                    } else if (hasApplied) {
                      return (
                        <div className="text-center">
                          <span className="px-6 py-3 bg-gray-400 text-white rounded-lg">
                            Already Applied
                          </span>
                        </div>
                      );
                    } else if (isNotInterested) {
                      return (
                        <div className="text-center">
                          <span className="px-6 py-3 bg-gray-400 text-white rounded-lg">
                            Marked as Not Interested
                          </span>
                        </div>
                      );
                    } else {
                      const isClosed = selectedOpportunity.status === 'closed';
                      
                      if (isClosed) {
                        // For closed opportunities, show a message instead of buttons
                        return (
                          <div className="text-center">
                            <div className="mb-4">
                              <div className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg font-medium">
                                🔒 Opportunity Closed
                              </div>
                              <p className="text-gray-600 text-sm mt-2">This opportunity is no longer accepting applications.</p>
                            </div>
                          </div>
                        );
                      } else {
                        // For open opportunities, show the action buttons
                        return (
                          <div className="flex justify-center gap-4">
                            <button
                              onClick={() => handleApply(selectedOpportunity.id)}
                              className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium"
                            >
                              Apply for this Opportunity
                            </button>
                            <button
                              onClick={() => handleMarkNotInterested(selectedOpportunity.id)}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                              Mark as not Interested
                            </button>
                          </div>
                        );
                      }
                    }
                  })()
                )}
              </div>
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
                  <div className="w-20 h-20 bg-finder-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {selectedProfile.name ? selectedProfile.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>

                {/* Profile Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-800 font-semibold">{selectedProfile.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-800">{selectedProfile.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <p className="text-gray-800">{selectedProfile.industry || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <p className="text-gray-800">{selectedProfile.domain || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
