import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiLock, 
  FiEdit, 
  FiSave, 
  FiX, 
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiMonitor
} from 'react-icons/fi';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Profile: Fetching data for user:', user.email);
      
      // Try a simple query first - check what columns actually exist
      // Use a more specific select to avoid RLS recursion issues
      const { data, error } = await supabase
        .from('bubblers')
        .select('email, id, created_at')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Profile: Database error:', error);
        throw error;
      }

      console.log('Profile: Data received:', data);
      setProfileData(data);
      
    } catch (err) {
      console.error('Profile: Error:', err);
      setError('Error loading profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Profile</h1>
          <p className="text-blue-700">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Profile Error</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchProfileData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Profile</h1>
        <p className="text-green-700 mb-4">Profile component is working!</p>
        <p className="text-sm text-green-600">User: {user?.email}</p>
        <p className="text-sm text-green-600">Profile Data: {profileData ? 'Loaded' : 'None'}</p>
        {profileData && (
          <div className="mt-4 p-4 bg-white rounded border">
            <p><strong>Email:</strong> {profileData.email}</p>
            <p><strong>Name:</strong> {profileData.name || 'Not set'}</p>
            <p><strong>Role:</strong> {profileData.role || 'Not set'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 