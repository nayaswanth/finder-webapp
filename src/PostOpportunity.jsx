import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import NotificationBell from './NotificationBell';
import finderLogo from './assets/Logo FI.png';
import { buildApiUrl } from './utils/api';
import HeaderBar from './HeaderBar';

export default function PostOpportunity() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    type: '',
    startDate: '',
    endDate: '',
    hoursPerWeek: '',
    roles: [],
    skills: [],
    email: localStorage.getItem('finder_email') || ''
  });
  const [error, setError] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('finder_email') || '';

  // Fetch current user's name for the profile avatar
  useEffect(() => {
    const fetchCurrentUserName = async () => {
      try {
        const res = await fetch(buildApiUrl('employees'));
        const data = await res.json();
        const employees = data.employees || data || [];
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
  const typeOptions = [
    "Proposal / POV",
    "CS&D Operations",
    "Domain / Industry Operations",
    "Other"
  ];
  const industryOptions = [
    "Life Sciences & Health Care",
    "Consumer",
    "Energy, Resources & Industrial",
    "Technology, Media & Telecom",
    "Financial Services & Insurance",
    "Cross-Industry"
  ];
  const roleOptions = [
    'Analyst', 'Consultant', 'Senior Consultant', 'Manager', 'Senior Manager'
  ];
  const skillOptions = [
    'Research', 'Data Analysis', 'Presentation', 'Storyboarding', 'Stakeholder management', 'Slide Making', 'Dashboarding', 'Excel Modelling', 'PMO'
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      // If user changes email (shouldn't happen), update localStorage
      localStorage.setItem('finder_email', e.target.value);
    }
  };

  const handleCheckbox = (e, field) => {
    const value = e.target.value;
    setForm((prev) => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate mandatory fields
    const mandatoryFields = {
      title: 'Opportunity Title',
      description: 'Description', 
      type: 'Type of FI',
      startDate: 'Start Date',
      endDate: 'End Date',
      hoursPerWeek: 'Number of Hours per Week'
    };
    
    const missingFields = [];
    Object.keys(mandatoryFields).forEach(field => {
      if (!form[field] || form[field].toString().trim() === '') {
        missingFields.push(mandatoryFields[field]);
      }
    });
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following mandatory fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    
    if (startDate < today) {
      setError('Start date must be today or a future date.');
      return;
    }
    
    if (endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    
    // Always attach the latest email from localStorage
    const formWithEmail = { ...form, email: localStorage.getItem('finder_email') || '' };
    
    try {
      const res = await fetch(buildApiUrl('opportunities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formWithEmail)
      });
      const data = await res.json();
      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to post opportunity');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      <HeaderBar userEmail={userEmail} userName={currentUserName} />
      <div className="max-w-6xl mx-auto mt-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-8 text-center flex items-center justify-center gap-3">
          Let's 
          <img src={finderLogo} alt="FInder" className="h-6 md:h-8 inline-block -mt-1" />
          your next resource!
        </h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-2xl shadow">
          <div>
            <label className="block font-semibold mb-1">Opportunity Title<span className="text-red-500">*</span></label>
            <input name="title" type="text" placeholder="e.g. RFP Support" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4" />
            
            <label className="block font-semibold mb-1">Description<span className="text-red-500">*</span></label>
            <textarea name="description" placeholder="Enter Brief Summary..." value={form.description} onChange={handleChange} maxLength={500} className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4 h-32" />
            
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label className="block font-semibold mb-1">Domain</label>
                <select name="domain" value={form.domain} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                  <option value="">Select Domain</option>
                  {domainOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block font-semibold mb-1">Type of FI<span className="text-red-500">*</span></label>
                <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                  <option value="">Select Type of FI</option>
                  {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label className="block font-semibold mb-1">Industry</label>
                <select name="industry" value={form.industry || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                  <option value="">Select Industry</option>
                  {industryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block font-semibold mb-1">Start Date<span className="text-red-500">*</span></label>
                <input 
                  name="startDate" 
                  type="date" 
                  value={form.startDate} 
                  onChange={handleChange} 
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl" 
                />
              </div>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label className="block font-semibold mb-1">End Date<span className="text-red-500">*</span></label>
                <input 
                  name="endDate" 
                  type="date" 
                  value={form.endDate} 
                  onChange={handleChange} 
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl" 
                />
              </div>
              <div className="w-1/2">
                <label className="block font-semibold mb-1">No. of Hours per Week<span className="text-red-500">*</span></label>
                <input name="hoursPerWeek" type="number" placeholder="Enter Number of hours per week required" value={form.hoursPerWeek} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block font-semibold mb-1">Role Required</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center">
                  <input type="checkbox" value={role} checked={form.roles.includes(role)} onChange={e => handleCheckbox(e, 'roles')} className="mr-2" />
                  {role}
                </label>
              ))}
            </div>
            
            <label className="block font-semibold mb-1">Skills Required</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {skillOptions.map((skill) => (
                <label key={skill} className="flex items-center">
                  <input type="checkbox" value={skill} checked={form.skills.includes(skill)} onChange={e => handleCheckbox(e, 'skills')} className="mr-2" />
                  {skill}
                </label>
              ))}
            </div>
            
            {error && <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Indicates mandatory field
              </p>
            </div>
            
            <button type="submit" className="w-full bg-finder-blue-600 text-white py-2 rounded-xl font-medium">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
