import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Onboarding = () => {
  const { bubblerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bubbler, setBubbler] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    fetchBubblerData();
  }, [bubblerId]);

  const fetchBubblerData = async () => {
    try {
      const { data, error } = await supabase
        .from('bubblers')
        .select('*')
        .eq('id', bubblerId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Bubbler not found');
        return;
      }

      setBubbler(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateTempPassword = async () => {
    if (!tempPassword.trim()) {
      alert('Please enter the temporary password');
      return;
    }

    if (tempPassword !== bubbler.temp_password) {
      alert('Invalid temporary password');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // Update bubbler with new password and mark onboarding as complete
      const { error } = await supabase
        .from('bubblers')
        .update({
          email: formData.email, // Allow email update
          phone: formData.phone, // Allow phone update
          password: formData.password, // In production, this should be hashed
          onboarding_completed: true,
          temp_password: null, // Clear temp password
          password_reset_required: false, // Clear password reset requirement
          updated_at: new Date().toISOString()
        })
        .eq('id', bubblerId);

      if (error) throw error;

      alert('Account setup complete! You can now log in with your email and new password.');
      navigate('/login');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      alert('Error completing setup: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-card max-w-md w-full mx-4">
          <div className="text-center">
            <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bubbler) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-card max-w-md w-full mx-4">
          <div className="text-center">
            <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Bubbler Not Found</h1>
            <p className="text-gray-600 mb-4">The onboarding link is invalid or has expired.</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card max-w-md w-full">
        {/* Header */}
        <div className="text-center p-8 border-b border-gray-200">
          <img src="/Bubblerlogotransparent.PNG" alt="GoGoBubbles" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to GoGoBubbles!</h1>
          <p className="text-gray-600">Complete your account setup to get started</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-brand-aqua text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > 1 ? <FiCheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <div className={`w-12 h-1 ${
              step >= 2 ? 'bg-brand-aqua' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-brand-aqua text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > 2 ? <FiCheckCircle className="h-4 w-4" /> : '2'}
            </div>
          </div>
        </div>

        {/* Step 1: Verify Temporary Password */}
        {step === 1 && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Verify Access</h2>
            <p className="text-gray-600 mb-6">
              Please enter the temporary password provided to you to continue with your account setup.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
                    placeholder="Enter temporary password"
                  />
                </div>
              </div>

              <button
                onClick={validateTempPassword}
                className="w-full btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Set Up Account */}
        {step === 2 && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">
              Please review and update your information, then set a secure password for your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Complete Setup
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding; 