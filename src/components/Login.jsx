import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import finderLogo from '../assets/Logo FI.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Google login failed');
      }
    } catch (error) {
      setError('Google login failed');
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <img src={finderLogo} alt="Finder Logo" className="h-12" />
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Login to Continue</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-finder-blue-500"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-finder-blue-500"
            disabled={loading}
          />
          
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-finder-blue-600 text-white py-2 rounded-xl font-medium disabled:opacity-50"
            style={{ backgroundColor: loading ? '#0E4A9A' : '#115CBA' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-medium mb-4 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <div className="text-sm text-gray-500">
          New user? 
          <span 
            className="text-finder-blue-600 cursor-pointer ml-1" 
            style={{ color: '#115CBA' }} 
            onClick={() => navigate('/register')}
          >
            Register
          </span>
        </div>
      </div>
    </div>
  );
}
