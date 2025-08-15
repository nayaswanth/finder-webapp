import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ProfileAvatar from './ProfileAvatar';
import finderLogo from './assets/Logo FI.png';

/**
 * Unified header bar for all authenticated pages.
 * Props:
 *  - userEmail: string (optional, will fallback to localStorage)
 *  - userName: string (for avatar initials)
 */
export default function HeaderBar({ userEmail, userName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = userEmail || localStorage.getItem('finder_email') || '';

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path) =>
    `${isActive(path) ? 'text-finder-blue-600' : 'text-gray-700 hover:text-finder-blue-600'} cursor-pointer transition-colors`;

  return (
    <header className="bg-white px-8 py-4 shadow flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={finderLogo}
          alt="Finder Logo"
          className="h-8 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        />
      </div>
      <nav className="flex-1 flex justify-center items-center space-x-6 font-medium">
        <span className={navLinkClass('/dashboard')} onClick={() => navigate('/dashboard')}>Home</span>
        <span className={navLinkClass('/find-opportunities')} onClick={() => navigate('/find-opportunities')}>Find Opportunity</span>
        <button
          className="border px-4 py-2 rounded-xl text-white flex items-center"
          style={{ backgroundColor: '#115CBA', borderColor: '#115CBA' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0E4A9A')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#115CBA')}
          onClick={() => navigate('/post-opportunity')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Post an Opportunity
        </button>
      </nav>
      <div className="flex items-center ml-6 gap-3">
        <NotificationBell userEmail={email} />
        <ProfileAvatar userName={userName} userEmail={email} size="sm" />
      </div>
    </header>
  );
}
