import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileAvatar({ userName, userEmail, size = 'sm' }) {
  const [profilePicture, setProfilePicture] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load profile picture from localStorage
    const savedProfilePicture = localStorage.getItem(`finder_profile_picture_${userEmail}`);
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture);
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userEmail]);

  const getInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6 text-xs';
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-8 h-8 text-sm';
    }
  };

  const getBackgroundColor = () => {
    // Generate a consistent pastel color based on the user's name/email
    const colors = [
      'bg-pink-300', 'bg-purple-300', 'bg-indigo-300', 'bg-blue-300',
      'bg-green-300', 'bg-yellow-300', 'bg-red-300', 'bg-gray-300'
    ];
    
    const colorIndex = (userName || userEmail || '').length % colors.length;
    return colors[colorIndex];
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('finder_email');
    // DON'T clear finder_applicant_statuses - these should come from server
    // localStorage.removeItem('finder_applicant_statuses'); 
    localStorage.removeItem(`finder_profile_picture_${userEmail}`);
    // Redirect to home page
    window.location.href = '/';
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="relative profile-dropdown">
      <div className="flex items-center gap-3">
        <div 
          className={`${getSizeClasses()} rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 relative group`}
          onClick={() => setShowDropdown(!showDropdown)}
          title=""
        >
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt="Profile" 
              className={`${getSizeClasses()} rounded-full object-cover border border-gray-200`}
            />
          ) : (
            <div className={`${getSizeClasses()} ${getBackgroundColor()} rounded-full flex items-center justify-center text-gray-700 font-medium border border-gray-200`}>
              {getInitial()}
            </div>
          )}
          
          {/* Tooltip */}
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Click for options
          </div>
        </div>
        
        {/* User Name */}
        <span 
          className="font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {userName || 'User'}
        </span>
      </div>
      
      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
          <button
            onClick={handleViewProfile}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            View Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </button>
        </div>
      )}
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You will need to login again to access your account.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
