import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProfileAvatar from './ProfileAvatar';
import NotificationBell from './NotificationBell';
import NotificationService from './NotificationService';
import { buildApiUrl } from './utils/api';
import finderLogo from './assets/finder-logo.svg';
import HeaderBar from './HeaderBar';

export default function OpportunityDetails() {
  const { id } = useParams();
  const [opp, setOpp] = useState(null);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  // Initialize applicant statuses from localStorage (same as Dashboard)
  const [applicantStatuses, setApplicantStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('finder_applicant_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('finder_email') || '';

  // Save applicant statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finder_applicant_statuses', JSON.stringify(applicantStatuses));
  }, [applicantStatuses]);

  useEffect(() => {
    // Fetch opportunity details and current user name
    Promise.all([
      fetch(buildApiUrl(`opportunities/${id}`)).then(res => res.json()),
      fetch(buildApiUrl('employees')).then(res => res.json())
    ])
      .then(([oppData, employeesData]) => {
        if (oppData.success) {
          const opportunity = oppData.opportunity;
          // Create email to name mapping and process applicants
          const employees = employeesData.employees || employeesData || [];
          const emailToName = {};
          employees.forEach(emp => {
            emailToName[emp.email] = emp.name;
          });
          
          // Add applicant details
          const processedOpp = {
            ...opportunity,
            applicants: (opportunity.applied || []).map(email => ({
              email: email,
              name: emailToName[email] || 'Unknown User'
            })),
            postedBy: emailToName[opportunity.email] || 'Unknown User'
          };
          
          setOpp(processedOpp);
          setAllEmployees(employees);
          
          // Update local applicant statuses with server data (server data should always override localStorage)
          console.log('🔍 Server opportunity data:', opportunity);
          console.log('🔍 Server application_statuses:', opportunity.application_statuses);
          if (opportunity.application_statuses) {
            setApplicantStatuses(prev => {
              // Start with existing localStorage data but override with server data
              const updated = { ...prev };
              Object.entries(opportunity.application_statuses).forEach(([email, status]) => {
                const statusKey = `${id}-${email}`;
                console.log(`🔍 Mapping server status: ${email} (${status}) -> statusKey: ${statusKey}`);
                // Map server status to frontend status (server data always wins)
                if (status === 'accepted') {
                  updated[statusKey] = 'confirmed';
                  console.log(`✅ Set ${statusKey} = confirmed (from server)`);
                } else if (status === 'rejected') {
                  updated[statusKey] = 'rejected';
                  console.log(`❌ Set ${statusKey} = rejected (from server)`);
                }
              });
              console.log('🔍 Final applicantStatuses after server sync:', updated);
              return updated;
            });
          }
        } else {
          setError('Opportunity not found');
        }
        
        // Find current user's name
        const employees = employeesData.employees || employeesData || [];
        const currentUser = employees.find(emp => 
          (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
        );
        if (currentUser) {
          setCurrentUserName(currentUser.name || '');
        }
      })
      .catch(() => setError('Error fetching opportunity'));
  }, [id, userEmail]);

  // Check if current user is the opportunity poster
  const isOpportunityPoster = opp && (opp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase();

  const handleAction = async (action) => {
    setActionMsg('');
    const res = await fetch(buildApiUrl(`opportunities/${id}/${action}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    const data = await res.json();
    if (data.success) {
      // Send notification to opportunity poster if applying
      if (action === 'apply' && opp && opp.email && opp.email !== userEmail) {
        // Find the current user's name for the notification
        try {
          const empRes = await fetch(buildApiUrl('employees'));
          const empData = await empRes.json();
          const employees = empData.employees || empData || [];
          const currentUser = employees.find(emp => 
            (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
          );
          const applicantName = currentUser ? currentUser.name : 'Someone';

          NotificationService.notifyOpportunityPoster(
            opp.email,
            applicantName,
            opp.title,
            id
          );
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }

      setActionMsg(action === 'apply' ? 'Applied successfully!' : 'Marked as not interested.');
    } else {
      setActionMsg(data.message || 'Action failed');
    }
  };

  const handleAcceptReject = async (oppId, applicantEmail, applicantName, action) => {
    console.log('🚀 FUNCTION CALLED handleAcceptReject');
    console.log(`🔥 Frontend Accept/Reject called - oppId: ${oppId}, applicantEmail: ${applicantEmail}, action: ${action}`);
    
    alert(`DEBUG: handleAcceptReject called with oppId: ${oppId}, email: ${applicantEmail}, action: ${action}`);
    
    const actionText = action === 'accept' ? 'accept' : 'reject';
    const title = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Candidate`;
    const message = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${applicantName}" for this role?`;
    
    showConfirmModal(title, message, async () => {
      try {
        // Update local status for immediate UI feedback FIRST
        const statusKey = `${oppId}-${applicantEmail}`;
        console.log(`🔥 Setting local status key: ${statusKey} to ${action === 'accept' ? 'confirmed' : 'rejected'}`);
        setApplicantStatuses(prev => ({
          ...prev,
          [statusKey]: action === 'accept' ? 'confirmed' : 'rejected'
        }));

        // Send notification to applicant
        if (opp) {
          if (action === 'accept') {
            NotificationService.notifyApplicationAccepted(applicantEmail, opp.title, id);
          } else {
            NotificationService.notifyApplicationRejected(applicantEmail, opp.title, id);
          }
        }

        // Update server with the correct endpoint and payload
        const endpoint = buildApiUrl(`opportunities/${oppId}/${action}`);
        console.log(`🔥 Making API call to: ${endpoint}`);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicantEmail })
        });
        
        if (!res.ok) {
          console.log('❌ Server update failed, but local status maintained');
          // Optionally show a warning to the user that the change might not persist
        } else {
          console.log(`✅ Successfully ${action}ed applicant on server`);
        }
      } catch (err) {
        console.error('❌ Accept/Reject error:', err);
        // Optionally revert the local change if there was an error
      }
    });
  };

  const handleCloseOpportunity = async (oppId, oppTitle) => {
    showConfirmModal(
      'Close Opportunity',
      `Are you sure you want to close the opportunity "${oppTitle}"?`,
      async () => {
        try {
          // Get current applicants before closing
          const applicantEmails = opp ? (opp.applied || []) : [];

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

            // Refresh the opportunity data
            const oppData = await fetch(buildApiUrl(`opportunities/${id}`)).then(res => res.json());
            if (oppData.success) {
              const emailToName = {};
              allEmployees.forEach(emp => {
                emailToName[emp.email] = emp.name;
              });
              
              const processedOpp = {
                ...oppData.opportunity,
                applicants: (oppData.opportunity.applied || []).map(email => ({
                  email: email,
                  name: emailToName[email] || 'Unknown User'
                })),
                postedBy: emailToName[oppData.opportunity.email] || 'Unknown User'
              };
              
              setOpp(processedOpp);
            }
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
            // Refresh the opportunity data
            const oppData = await fetch(buildApiUrl(`opportunities/${id}`)).then(res => res.json());
            if (oppData.success) {
              const emailToName = {};
              allEmployees.forEach(emp => {
                emailToName[emp.email] = emp.name;
              });
              
              const processedOpp = {
                ...oppData.opportunity,
                applicants: (oppData.opportunity.applied || []).map(email => ({
                  email: email,
                  name: emailToName[email] || 'Unknown User'
                })),
                postedBy: emailToName[oppData.opportunity.email] || 'Unknown User'
              };
              
              setOpp(processedOpp);
            }
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
      const profile = allEmployees.find(emp => 
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

  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;
  if (!opp) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

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

      <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow relative">
        {/* X button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={() => navigate('/find-opportunities')}
          aria-label="Close"
        >
          &times;
        </button>
        
        {/* Opportunity Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-extrabold text-gray-800">{opp.title}</h1>
            {opp.status === 'closed' ? (
              <span className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full">
                Closed
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                Open
              </span>
            )}
          </div>
          <div className="mb-4 text-gray-500 text-sm">
            Posted by: <span 
              className="cursor-pointer hover:text-finder-blue-600 underline transition-colors"
              onClick={() => handleViewProfile(opp.email)}
            >
              {opp.postedBy}
            </span>
          </div>
        </div>

        {/* Opportunity Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-4 text-gray-800 border p-4 rounded-xl bg-blue-50">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              {opp.description}
            </div>
            
            <div className="space-y-3">
              <div className="text-gray-600">Type of FI: <span className="font-semibold">{opp.type}</span></div>
              <div className="text-gray-600">Domain: <span className="font-semibold">{opp.domain}</span></div>
              <div className="text-gray-600">Industry: <span className="font-semibold">{opp.industry}</span></div>
              <div className="text-gray-600">Start Date: <span className="font-semibold">{opp.startDate}</span></div>
              <div className="text-gray-600">End Date: <span className="font-semibold">{opp.endDate}</span></div>
              <div className="text-gray-600">Hours per Week: <span className="font-semibold">{opp.hoursPerWeek}</span></div>
            </div>
          </div>

          <div>
            {isOpportunityPoster ? (
              /* Opportunity Management View (for poster) */
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    Applicants ({opp.applicants ? opp.applicants.length : 0})
                  </h3>
                  
                  {opp.applicants && opp.applicants.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {opp.applicants.map((applicant, idx) => {
                        const statusKey = `${id}-${applicant.email}`;
                        const applicantStatus = applicantStatuses[statusKey];
                        const isOpportunityClosed = opp.status === 'closed';
                        
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
                              
                              {/* Show candidate status and opportunity closed status */}
                              <div className="mt-1 space-y-1">
                                {applicantStatus && (
                                  <p className={`text-sm font-medium ${
                                    applicantStatus === 'confirmed' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {applicantStatus === 'confirmed' ? '✅ Candidate Confirmed' : '❌ Candidate Not Considered'}
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
                                  onClick={() => handleAcceptReject(id, applicant.email, applicant.name, 'accept')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleAcceptReject(id, applicant.email, applicant.name, 'reject')}
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
                    <p className="text-gray-500 text-center py-8">No applicants yet</p>
                  )}
                </div>

                {/* Opportunity Management Actions */}
                <div className="space-y-3">
                  {opp.status === 'closed' ? (
                    <button
                      onClick={() => handleReopenOpportunity(id, opp.title)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Reopen Opportunity
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCloseOpportunity(id, opp.title)}
                      className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Close Opportunity
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Application View (for non-posters) */
              <div>
                <div className="space-y-4">
                  {opp.roles && opp.roles.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Roles</h3>
                      <div className="flex flex-wrap gap-2">
                        {opp.roles.map((role, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {opp.skills && opp.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {opp.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {opp.applied && opp.applied.includes(userEmail) ? (
                    <div className="text-center">
                      <span className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium">
                        Already Applied
                      </span>
                      {actionMsg && (
                        <p className="mt-2 text-sm text-gray-600">{actionMsg}</p>
                      )}
                    </div>
                  ) : opp.not_interested && opp.not_interested.includes(userEmail) ? (
                    <div className="text-center">
                      <span className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium">
                        Marked as Not Interested
                      </span>
                    </div>
                  ) : opp.status === 'closed' ? (
                    <div className="text-center">
                      <span className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium">
                        Opportunity Closed
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => handleAction('apply')}
                        className="px-6 py-3 bg-finder-blue-600 text-white rounded-lg hover:bg-finder-blue-700 font-medium"
                      >
                        Apply for this Opportunity
                      </button>
                      <button
                        onClick={() => handleAction('not_interested')}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        Mark as not Interested
                      </button>
                    </div>
                  )}
                  {actionMsg && (
                    <p className="mt-3 text-center text-sm text-gray-600">{actionMsg}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
