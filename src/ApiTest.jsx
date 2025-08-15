import { buildApiUrl } from './utils/api';

// Test component to verify API configuration
const ApiTest = () => {
  const testUrls = () => {
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('Login URL:', buildApiUrl('login'));
    console.log('Opportunities URL:', buildApiUrl('opportunities'));
    console.log('Employees URL:', buildApiUrl('employees'));
  };

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'white', padding: '10px', border: '1px solid #ccc', zIndex: 9999 }}>
      <button onClick={testUrls}>Test API URLs (Check Console)</button>
    </div>
  );
};

export default ApiTest;
