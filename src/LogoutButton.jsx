import { useState } from 'react';

export default function LogoutButton({ onLogout }) {
  const [show, setShow] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('finder_email');
    onLogout();
  };

  return (
    <>
      <button
        className="ml-4 font-medium text-gray-700 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100"
        onClick={() => setShow(true)}
      >
        Log Out
      </button>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center">
            <div className="text-lg font-semibold mb-4">Are you sure you want to log out?</div>
            <div className="flex gap-4 justify-center">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium"
                onClick={handleLogout}
              >
                Yes
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-xl font-medium"
                onClick={() => setShow(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
