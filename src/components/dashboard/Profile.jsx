import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import DeviceBindingService from '../../services/deviceBinding';
import EcoFriendlyToggle from './EcoFriendlyToggle';
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
  const [bubblerProfile, setBubblerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [deviceBindingInfo, setDeviceBindingInfo] = useState(null);

  // Editable fields (only for non-admin users) - REMOVED phone
  const [editableFields, setEditableFields] = useState({
    email: '',
    address: '',
    travel_radius_minutes: '',
    emergency_contact: '',
    emergency_phone: '',
    preferred_hours: '',
    travel_preferences: '',
    is_active: true
  });

  // Password reset fields
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchBubblerProfile();
    generateDeviceFingerprint();
  }, [user]);

  // Generate device fingerprint to prevent account sharing
  const generateDeviceFingerprint = () => {
    const fingerprint = DeviceBindingService.generateDeviceFingerprint();
    setDeviceInfo(fingerprint);
  };

  const fetchBubblerProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bubblers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setBubblerProfile(data);
      setEditableFields({
        email: data.email || '',
        address: data.address || '',
        travel_radius_minutes: data.travel_radius_minutes || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
        preferred_hours: data.preferred_hours || '',
        travel_preferences: data.travel_preferences || '',
        is_active: data.is_active !== false // Default to true if not set
      });

      // Fetch device binding information
      if (!isAdmin) {
        const bindingInfo = await DeviceBindingService.getDeviceBindingInfo(user.id);
        setDeviceBindingInfo(bindingInfo);
      }
    } catch (err) {
      setError('Error loading profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Check device binding if not admin
      if (!isAdmin && deviceInfo) {
        const validation = await DeviceBindingService.validateDeviceBinding(user.id, deviceInfo);
        
        if (!validation.isValid) {
          if (validation.requiresBinding) {
            // First time setup - bind the device
            await DeviceBindingService.bindDevice(user.id, deviceInfo);
            setSuccess('Device bound successfully! Your account is now secured.');
          } else {
            setError('Account is bound to another device. Please contact admin to transfer access.');
            return;
          }
        }
      }

      const updateData = {
        ...editableFields,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bubblers')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Refresh profile data
      await fetchBubblerProfile();
    } catch (err) {
      setError('Error updating profile: ' + err.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validate passwords
      if (passwordFields.newPassword !== passwordFields.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordFields.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      // Verify current password (if not using temp password)
      if (bubblerProfile?.temp_password) {
        if (passwordFields.currentPassword !== bubblerProfile.temp_password) {
          setError('Invalid temporary password');
          return;
        }
      } else {
        // For regular password changes, you'd verify against stored password
        // This is a simplified version - in production you'd hash and compare
        if (!passwordFields.currentPassword) {
          setError('Current password is required');
          return;
        }
      }

      // Update password
      const { error } = await supabase
        .from('bubblers')
        .update({
          password: passwordFields.newPassword, // In production, this should be hashed
          temp_password: null, // Clear temp password
          password_reset_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setShowPasswordReset(false);
      setPasswordFields({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Refresh profile data
      await fetchBubblerProfile();
    } catch (err) {
      setError('Error updating password: ' + err.message);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'SHINE': 'ShineBubbler (Mobile Car Wash)',
      'SPARKLE': 'SparkleBubbler (Home Cleaning)',
      'FRESH': 'FreshBubbler (Laundry Service)',
      'ELITE': 'EliteBubbler (Multi-Service)'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your personal information and account settings
          </p>
        </div>
        {!isAdmin && (
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center"
                >
                  <FiSave className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchBubblerProfile(); // Reset to original values
                  }}
                  className="btn-secondary flex items-center"
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary flex items-center"
              >
                <FiEdit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <FiCheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="space-y-4">
            {/* Name - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="flex items-center">
                <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={bubblerProfile?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
            </div>

            {/* Email - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center">
                <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="email"
                  value={editableFields.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  disabled={!editing || isAdmin}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                    editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Role - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <div className="flex items-center">
                <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={getRoleDisplayName(bubblerProfile?.role)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
            </div>

            {/* Phone - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex items-center">
                <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="tel"
                  value={bubblerProfile?.phone || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed - contact admin for updates</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
          <div className="space-y-4">
            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={editableFields.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                disabled={!editing || isAdmin}
                rows="2"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={editableFields.emergency_contact}
                onChange={(e) => handleFieldChange('emergency_contact', e.target.value)}
                disabled={!editing || isAdmin}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            {/* Emergency Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={editableFields.emergency_phone}
                onChange={(e) => handleFieldChange('emergency_phone', e.target.value)}
                disabled={!editing || isAdmin}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            {/* Travel Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Radius (minutes)
              </label>
              <select
                value={editableFields.travel_radius_minutes}
                onChange={(e) => handleFieldChange('travel_radius_minutes', e.target.value)}
                disabled={!editing || isAdmin}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                }`}
              >
                <option value="">Select travel radius</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="25">25 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            {/* Preferred Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Working Hours
              </label>
              <select
                value={editableFields.preferred_hours}
                onChange={(e) => handleFieldChange('preferred_hours', e.target.value)}
                disabled={!editing || isAdmin}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  editing && !isAdmin ? 'focus:outline-none focus:ring-2 focus:ring-brand-aqua' : 'bg-gray-50 text-gray-500'
                }`}
              >
                <option value="">Select preferred hours</option>
                <option value="morning">Morning (6 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                <option value="evening">Evening (6 PM - 12 AM)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            {/* Active Status Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Availability
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    value="true"
                    checked={editableFields.is_active === true}
                    onChange={(e) => handleFieldChange('is_active', e.target.value === 'true')}
                    disabled={!editing || isAdmin}
                    className="mr-2"
                  />
                  <span className={`text-sm ${!editing || isAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                    Active - Accepting Jobs
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    value="false"
                    checked={editableFields.is_active === false}
                    onChange={(e) => handleFieldChange('is_active', e.target.value === 'true')}
                    disabled={!editing || isAdmin}
                    className="mr-2"
                  />
                  <span className={`text-sm ${!editing || isAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                    Inactive - Not Accepting Jobs
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                When inactive, admins won't assign new jobs to you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Eco-Friendly Jobs Section */}
      {!isAdmin && (
        <div className="mb-6">
          <EcoFriendlyToggle />
        </div>
      )}

      {/* Password Reset Section */}
      {!isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Password Management</h3>
            {bubblerProfile?.temp_password && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                Temporary Password Active
              </span>
            )}
          </div>

          {bubblerProfile?.temp_password && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold">Password Reset Required</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    You are currently using a temporary password. Please set a new password for your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showPasswordReset ? (
            <button
              onClick={() => setShowPasswordReset(true)}
              className="btn-primary"
            >
              <FiLock className="h-4 w-4 mr-2" />
              {bubblerProfile?.temp_password ? 'Set New Password' : 'Change Password'}
            </button>
          ) : (
    <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">
                {bubblerProfile?.temp_password ? 'Set New Password' : 'Change Password'}
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {bubblerProfile?.temp_password ? 'Temporary Password' : 'Current Password'}
                </label>
                <div className="flex items-center">
                  <FiLock className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={passwordFields.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua"
                    placeholder={bubblerProfile?.temp_password ? 'Enter temporary password' : 'Enter current password'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="flex items-center">
                  <FiLock className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={passwordFields.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="flex items-center">
                  <FiLock className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={passwordFields.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-aqua"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handlePasswordReset}
                  className="btn-primary"
                >
                  <FiSave className="h-4 w-4 mr-2" />
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setPasswordFields({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="btn-secondary"
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Device Binding Section */}
      {!isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Device Security</h3>
            <div className="flex items-center space-x-2">
              <FiShield className="h-5 w-5 text-brand-aqua" />
              <span className="text-sm font-medium text-gray-600">Account Protection</span>
            </div>
          </div>

          {deviceBindingInfo && deviceBindingInfo.length > 0 && deviceBindingInfo[0]?.is_active ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <FiCheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-green-800 font-semibold">Device Locked</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your account is bound to this device. This prevents unauthorized access from other devices.
                  </p>
                  <p className="text-green-600 text-xs mt-2">
                    Bound on: {deviceBindingInfo[0]?.created_at ? new Date(deviceBindingInfo[0].created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                  {deviceBindingInfo[0]?.device_metadata && (
                    <div className="text-green-600 text-xs mt-1">
                      <strong>Device:</strong> {deviceBindingInfo[0].device_metadata.browser} on {deviceBindingInfo[0].device_metadata.os}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FiMonitor className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-semibold">Device Binding Required</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Save your profile to lock your account to this device. This prevents account sharing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Security Note:</strong> Your account is protected by device binding. If you need to access your account from a different device, 
              please contact an administrator to transfer access.
            </p>
          </div>
        </div>
      )}

      {/* Account Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-aqua">{bubblerProfile?.jobs_completed || 0}</div>
            <div className="text-sm text-gray-600">Jobs Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${bubblerProfile?.total_earnings || 0}</div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{bubblerProfile?.rating || 0}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {bubblerProfile?.join_date ? new Date(bubblerProfile.join_date).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Join Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 