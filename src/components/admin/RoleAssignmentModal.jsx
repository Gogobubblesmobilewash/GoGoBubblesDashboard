import React, { useState } from 'react';
import {
  FiUsers,
  FiShield,
  FiCheck,
  FiX,
  FiMail,
  FiSend
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { SYSTEM_ROLES, BUBBLER_ROLES } from '../../constants/roles';
import Modal from '../shared/Modal';

const RoleAssignmentModal = ({ isOpen, onClose, user, onRoleAssigned }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    setIsLoading(true);
    try {
      if (user.type === 'applicant') {
        // Grant dashboard access to applicant
        await grantDashboardAccess(user, selectedRole);
      } else if (user.type === 'bubbler') {
        // Update bubbler role
        await updateBubblerRole(user, selectedRole);
      }

      if (onRoleAssigned) {
        onRoleAssigned(user, selectedRole);
      }
      
      onClose();
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error assigning role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const grantDashboardAccess = async (applicant, role) => {
    // Create user account in auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: applicant.email,
      password: 'temporary123', // They'll reset this
      email_confirm: true,
      user_metadata: {
        role: role,
        first_name: applicant.first_name,
        last_name: applicant.last_name
      }
    });

    if (authError) throw authError;

    // Update applicant status
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        application_status: 'approved',
        assigned_role: role,
        dashboard_access_granted: true,
        access_granted_at: new Date().toISOString()
      })
      .eq('id', applicant.id);

    if (updateError) throw updateError;

    // If role is a bubbler role, add to bubblers table
    if (Object.keys(BUBBLER_ROLES).includes(role)) {
      const { error: bubblerError } = await supabase
        .from('bubblers')
        .insert([{
          first_name: applicant.first_name,
          last_name: applicant.last_name,
          email: applicant.email,
          phone: applicant.phone,
          role: role,
          is_active: true,
          created_at: new Date().toISOString()
        }]);

      if (bubblerError) console.warn('Error adding to bubblers table:', bubblerError);
    }

    // Send welcome email if requested
    if (sendEmail) {
      await sendWelcomeEmail(applicant, role);
    }
  };

  const updateBubblerRole = async (bubbler, newRole) => {
    const { error } = await supabase
      .from('bubblers')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', bubbler.id);

    if (error) throw error;
  };

  const sendWelcomeEmail = async (user, role) => {
    // This would integrate with your email service
    // For now, just log the action
    console.log(`Welcome email sent to ${user.email} for role: ${role}`);
  };

  const getAvailableRoles = () => {
    if (user.type === 'applicant') {
      return SYSTEM_ROLES;
    } else if (user.type === 'bubbler') {
      return BUBBLER_ROLES;
    }
    return {};
  };

  const availableRoles = getAvailableRoles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Role - ${user?.first_name} ${user?.last_name}`}
    >
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary rounded-full h-10 w-10 flex items-center justify-center font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">
                Current: {user?.type} • {user?.role || user?.role_applied_for || 'No Role'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Role to Assign
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(availableRoles).map(([roleKey, roleData]) => (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedRole === roleKey
                    ? 'border-brand-aqua bg-brand-aqua/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{roleData.name}</h4>
                    <p className="text-sm text-gray-600">
                      {roleData.permissions?.length || 0} permissions
                    </p>
                  </div>
                  {selectedRole === roleKey && (
                    <FiCheck className="h-5 w-5 text-brand-aqua" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Role Details */}
        {selectedRole && availableRoles[selectedRole] && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {availableRoles[selectedRole].name} Permissions
            </h4>
            <div className="text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                {availableRoles[selectedRole].permissions?.map((permission, index) => (
                  <li key={index}>{permission}</li>
                ))}
              </ul>
            </div>
            {availableRoles[selectedRole].restrictions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <h5 className="font-medium text-blue-900 mb-1">Restrictions</h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {availableRoles[selectedRole].restrictions?.map((restriction, index) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Email Option */}
        {user.type === 'applicant' && (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 text-brand-aqua focus:ring-brand-aqua border-gray-300 rounded"
            />
            <label htmlFor="sendEmail" className="text-sm text-gray-700">
              Send welcome email with login credentials
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignRole}
            disabled={!selectedRole || isLoading}
            className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <FiShield className="h-4 w-4" />
                <span>Assign Role</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoleAssignmentModal; 