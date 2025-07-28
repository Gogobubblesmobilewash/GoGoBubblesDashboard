import React, { useEffect, useState } from 'react';
import {
  FiUsers,
  FiUserPlus,
  FiShield,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiLock,
  FiUnlock,
  FiMail,
  FiPhone,
  FiCalendar
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { SYSTEM_ROLES, BUBBLER_ROLES } from '../../constants/roles';
import Modal from '../shared/Modal';

const UserManagement = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [bubblers, setBubblers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Load all users data
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch applicants
      const { data: applicantsData, error: applicantsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (applicantsError) console.warn('Applicants fetch warning:', applicantsError);
      const applicantsArray = Array.isArray(applicantsData) ? applicantsData : [];
      setApplicants(applicantsArray);

      // Fetch bubblers
      const { data: bubblersData, error: bubblersError } = await supabase
        .from('bubblers')
        .select('*')
        .order('created_at', { ascending: false });

      if (bubblersError) console.warn('Bubblers fetch warning:', bubblersError);
      const bubblersArray = Array.isArray(bubblersData) ? bubblersData : [];
      setBubblers(bubblersArray);

      // Combine all users
      const allUsers = [
        ...applicantsArray.map(app => ({ ...app, type: 'applicant', source: 'applications' })),
        ...bubblersArray.map(bub => ({ ...bub, type: 'bubbler', source: 'bubblers' }))
      ];

      setUsers(allUsers);

    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole || user.role_applied_for === filterRole;

    return matchesSearch && matchesRole;
  });

  // Grant dashboard access to applicant
  const grantDashboardAccess = async (applicant, role) => {
    try {
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

      alert(`Dashboard access granted to ${applicant.first_name} ${applicant.last_name} as ${role}`);
      loadUsers();

    } catch (error) {
      console.error('Error granting dashboard access:', error);
      alert('Error granting dashboard access. Please try again.');
    }
  };

  // Update bubbler role
  const updateBubblerRole = async (bubbler, newRole) => {
    try {
      const { error } = await supabase
        .from('bubblers')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', bubbler.id);

      if (error) throw error;

      alert(`Role updated for ${bubbler.first_name} ${bubbler.last_name} to ${newRole}`);
      loadUsers();

    } catch (error) {
      console.error('Error updating bubbler role:', error);
      alert('Error updating role. Please try again.');
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user, isActive) => {
    try {
      const { error } = await supabase
        .from(user.source)
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      alert(`Status updated for ${user.first_name} ${user.last_name}`);
      loadUsers();

    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // Delete user
  const deleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(user.source)
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      alert(`User ${user.first_name} ${user.last_name} deleted successfully`);
      loadUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  const UserCard = ({ user }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-primary rounded-full h-12 w-12 flex items-center justify-center font-bold text-white text-lg">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-xs rounded-full ${
            user.type === 'applicant' ? 'bg-blue-100 text-blue-800' :
            user.type === 'bubbler' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.type}
          </span>
          {user.is_active !== false && (
            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Current Role</p>
          <p className="text-sm font-medium text-gray-900">
            {user.role || user.role_applied_for || 'None'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-medium text-gray-900">
            {user.application_status || (user.is_active ? 'Active' : 'Inactive')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="text-sm font-medium text-gray-900">{user.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {user.type === 'applicant' && user.application_status === 'pending' && (
            <div className="flex space-x-1">
              {Object.keys(SYSTEM_ROLES).map(role => (
                <button
                  key={role}
                  onClick={() => grantDashboardAccess(user, role)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title={`Grant ${role} access`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
          
          {user.type === 'bubbler' && (
            <div className="flex space-x-1">
              {Object.keys(BUBBLER_ROLES).map(role => (
                <button
                  key={role}
                  onClick={() => updateBubblerRole(user, role)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    user.role === role 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={`Assign ${role} role`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleUserStatus(user, !user.is_active)}
            className={`p-2 rounded-lg transition-colors ${
              user.is_active !== false 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
            title={user.is_active !== false ? 'Deactivate' : 'Activate'}
          >
            {user.is_active !== false ? <FiLock className="h-4 w-4" /> : <FiUnlock className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setSelectedUser(user)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="View Details"
          >
            <FiEye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => deleteUser(user)}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            title="Delete User"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600">
            Manage user roles, grant dashboard access, and assign permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua-dark transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applicants</p>
              <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <FiUserPlus className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bubblers</p>
              <p className="text-2xl font-bold text-gray-900">{bubblers.length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <FiShield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active !== false).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <FiCheck className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-aqua focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {Object.keys(SYSTEM_ROLES).map(role => (
                <option key={role} value={role}>{SYSTEM_ROLES[role].name}</option>
              ))}
              {Object.keys(BUBBLER_ROLES).map(role => (
                <option key={role} value={role}>{BUBBLER_ROLES[role].name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map(user => (
          <UserCard key={`${user.source}-${user.id}`} user={user} />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User Details - ${selectedUser.first_name} ${selectedUser.last_name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{selectedUser.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 capitalize">{selectedUser.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-sm text-gray-900">{selectedUser.role || selectedUser.role_applied_for || 'None'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900">{selectedUser.application_status || (selectedUser.is_active ? 'Active' : 'Inactive')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dashboard Access</label>
                <p className="text-sm text-gray-900">
                  {selectedUser.dashboard_access_granted ? 'Granted' : 'Not Granted'}
                </p>
              </div>
            </div>
            
            {selectedUser.type === 'applicant' && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Grant Dashboard Access</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SYSTEM_ROLES).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        grantDashboardAccess(selectedUser, role);
                        setSelectedUser(null);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Grant {role} Access
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedUser.type === 'bubbler' && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Update Role</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(BUBBLER_ROLES).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        updateBubblerRole(selectedUser, role);
                        setSelectedUser(null);
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        selectedUser.role === role 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement; 