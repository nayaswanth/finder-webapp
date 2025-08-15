import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import finderLogo from './assets/Logo FI.png';
import ProfileAvatar from './ProfileAvatar';
import NotificationBell from './NotificationBell';
import { buildApiUrl } from './utils/api';
import HeaderBar from './HeaderBar';

export default function Profile() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [postedCount, setPostedCount] = useState(0);
  const [workedCount, setWorkedCount] = useState(0);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('finder_email') || '';

  const domainOptions = [
    "Cross-Domain",
    "Customer & Commercial Strategy",
    "Agency Strategy",
    "Marketing Strategy",
    "Commerce Strategy",
    "Pricing & Sales Strategy",
    "Service Strategy",
    "Innovation & Product Strategy"
  ];

  const roleOptions = [
    "Analyst",
    "Consultant", 
    "Senior Consultant",
    "Manager",
    "Senior Manager"
  ];

  const industryOptions = [
    "Life Sciences & Health Care",
    "Consumer",
    "Energy, Resources & Industrial",
    "Technology, Media & Telecom",
    "Financial Services & Insurance",
    "Cross-Industry"
  ];

  useEffect(() => {
    fetchUserProfile();
    fetchOpportunityCounts();
  }, []);

  const fetchOpportunityCounts = async () => {
    try {
      const res = await fetch(buildApiUrl('opportunities'));
      const data = await res.json();
      const allOpportunities = data.opportunities || [];
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

      // Count opportunities where user applied and was accepted
      const workedOpportunities = allOpportunities.filter(opp => {
        const appliedList = opp.applied || [];
        const hasApplied = appliedList.some(email => 
          (email || '').trim().toLowerCase() === currentUserEmail
        );
        
        if (!hasApplied) return false;
        
        // Check if user was accepted for this opportunity
        // Use the same logic as in Dashboard to check applicant statuses
        const originalIndex = allOpportunities.findIndex(allOpp => 
          allOpp.title === opp.title && 
          allOpp.email === opp.email && 
          allOpp.description === opp.description
        );
        
        const statusKey = `${originalIndex}-${userEmail}`;
        const applicantStatuses = JSON.parse(localStorage.getItem('finder_applicant_statuses') || '{}');
        return applicantStatuses[statusKey] === 'confirmed';
      });

      setAppliedCount(appliedOpportunities.length);
      setPostedCount(postedOpportunities.length);
      setWorkedCount(workedOpportunities.length);
    } catch (err) {
      console.error('Error fetching opportunity counts:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('employees'));
      const data = await res.json();
      
      // Extract employees array from the API response
      const employees = data.employees || data || [];
      
      // Find current user's profile
      const currentUser = employees.find(emp => 
        (emp.email || '').trim().toLowerCase() === userEmail.trim().toLowerCase()
      );
      
      if (currentUser) {
        setUserProfile(currentUser);
        setEditForm({
          name: currentUser.name || '',
          role: currentUser.role || '',
          industry: currentUser.industry || '',
          domain: currentUser.domain || ''
        });
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setUpdateSuccess(false);
    
    try {
      // Send PUT request to update employee profile
      const response = await fetch(buildApiUrl(`employees/${encodeURIComponent(userEmail)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          role: editForm.role,
          industry: editForm.industry,
          domain: editForm.domain
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with the response data
        setUserProfile(data.employee);
        setIsEditing(false);
        setUpdateSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please check your connection and try again.');
      console.error('Error updating profile:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      {/* Header */}
      <HeaderBar userEmail={userEmail} userName={userProfile?.name} />

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{userProfile?.name || 'User'}</h1>
          <p className="text-gray-600">{userProfile?.email}</p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Success Message */}
            {updateSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                ✅ Profile updated successfully!
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                ❌ {error}
              </div>
            )}

            {isEditing ? (
              // Edit Form
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={editForm.role}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Role</option>
                      {roleOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      name="industry"
                      value={editForm.industry}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Industry</option>
                      {industryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Domain
                    </label>
                    <select
                      name="domain"
                      value={editForm.domain}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Domain</option>
                      {domainOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={updateLoading}
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                      setUpdateSuccess(false);
                      setEditForm({
                        name: userProfile?.name || '',
                        role: userProfile?.role || '',
                        industry: userProfile?.industry || '',
                        domain: userProfile?.domain || ''
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Display Mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Full Name
                    </h3>
                    <p className="text-lg text-gray-800 font-medium">
                      {userProfile?.name || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Role
                    </h3>
                    <p className="text-lg text-gray-800 font-medium">
                      {userProfile?.role || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Email Address
                    </h3>
                    <p className="text-lg text-gray-800">
                      {userProfile?.email || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Industry
                    </h3>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      {userProfile?.industry || 'Not specified'}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Domain
                    </h3>
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      {userProfile?.domain || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Profile Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Opportunities Applied</h3>
            <p className="text-3xl font-bold text-blue-600">{appliedCount}</p>
            <p className="text-sm text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => navigate('/dashboard')}>View in Dashboard</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Opportunities Posted</h3>
            <p className="text-3xl font-bold text-green-600">{postedCount}</p>
            <p className="text-sm text-gray-500 cursor-pointer hover:text-green-600" onClick={() => navigate('/dashboard')}>View in Dashboard</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Opportunities Worked</h3>
            <p className="text-3xl font-bold text-purple-600">{workedCount}</p>
            <p className="text-sm text-gray-500 cursor-pointer hover:text-purple-600" onClick={() => navigate('/dashboard?filter=accepted')}>View in Dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
