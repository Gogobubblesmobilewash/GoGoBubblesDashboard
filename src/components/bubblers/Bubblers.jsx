import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/api';
import Modal from '../shared/Modal';
import { BUBBLER_ROLES } from '../../constants/roles';
import { FiPlus, FiEdit, FiTrash2, FiUserPlus } from 'react-icons/fi';

const Bubblers = () => {
  const [bubblers, setBubblers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBubbler, setNewBubbler] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'SHINE'
  });
  const [editingBubbler, setEditingBubbler] = useState(null);

  useEffect(() => {
    const fetchBubblers = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('bubblers').select('*');
      if (error) setError(error.message);
      else setBubblers(data || []);
      setLoading(false);
    };
    fetchBubblers();
  }, []);

  const handleRowClick = (bubbler) => {
    setSelectedBubbler(bubbler);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompletionRate = (completed, assigned) => {
    if (assigned === 0) return 0;
    return Math.round((completed / assigned) * 100);
  };

  const getStatusColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJobClick = (job) => {
    // For now, just log the job details
    console.log('Job clicked:', job);
    // In the future, this could open a job details modal or navigate to job management
  };

  const handleAddBubbler = async () => {
    try {
      const role = BUBBLER_ROLES[newBubbler.role];
      const bubblerData = {
        name: newBubbler.name,
        email: newBubbler.email,
        phone: newBubbler.phone,
        role: newBubbler.role,
        permissions: role.permissions,
        services: role.services,
        is_active: true,
        join_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        jobs_completed: 0,
        jobs_assigned: 0,
        jobs_cancelled: 0,
        jobs_declined: 0,
        jobs_reassigned: 0,
        total_earnings: 0,
        rating: 0
      };

      const { error } = await supabase
        .from('bubblers')
        .insert([bubblerData]);

      if (error) throw error;

      // Reset form and close modal
      setNewBubbler({ name: '', email: '', phone: '', role: 'SHINE' });
      setShowAddModal(false);
      
      // Refresh bubblers list
      const { data, error: fetchError } = await supabase.from('bubblers').select('*');
      if (!fetchError) setBubblers(data || []);
      
      alert('Bubbler added successfully!');
    } catch (error) {
      console.error('Error adding bubbler:', error);
      alert('Error adding bubbler: ' + error.message);
    }
  };

  const handleEditBubbler = async () => {
    try {
      const role = BUBBLER_ROLES[editingBubbler.role];
      const updateData = {
        name: editingBubbler.name,
        email: editingBubbler.email,
        phone: editingBubbler.phone,
        role: editingBubbler.role,
        permissions: role.permissions,
        services: role.services,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bubblers')
        .update(updateData)
        .eq('id', editingBubbler.id);

      if (error) throw error;

      // Reset form and close modal
      setEditingBubbler(null);
      setShowEditModal(false);
      
      // Refresh bubblers list
      const { data, error: fetchError } = await supabase.from('bubblers').select('*');
      if (!fetchError) setBubblers(data || []);
      
      alert('Bubbler updated successfully!');
    } catch (error) {
      console.error('Error updating bubbler:', error);
      alert('Error updating bubbler: ' + error.message);
    }
  };

  const getRoleDisplayName = (role) => {
    return BUBBLER_ROLES[role]?.name || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      SHINE: 'bg-cyan-100 text-cyan-800',
      SPARKLE: 'bg-blue-100 text-blue-800',
      FRESH: 'bg-green-100 text-green-800',
      ELITE: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bubblers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiUserPlus />
          Add Bubbler
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading bubblers...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bubblers.map(bubbler => (
              <tr
                key={bubbler.id || bubbler.email}
                className="hover:bg-blue-50"
              >
                <td className="px-4 py-2 font-medium text-gray-900 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  {bubbler.name}
                </td>
                <td className="px-4 py-2 text-gray-700 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  {bubbler.email}
                </td>
                <td className="px-4 py-2 text-gray-700 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  {bubbler.phone}
                </td>
                <td className="px-4 py-2 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(bubbler.role)}`}>
                    {getRoleDisplayName(bubbler.role)}
                  </span>
                </td>
                <td className="px-4 py-2 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${bubbler.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bubbler.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBubbler(bubbler);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this bubbler?')) {
                          // Handle delete
                          console.log('Delete bubbler:', bubbler.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && selectedBubbler && (
        <Modal title={selectedBubbler.name + " Profile"} onClose={() => setShowModal(false)}>
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="bg-cyan-100 rounded-full h-16 w-16 flex items-center justify-center font-bold text-3xl text-cyan-700">
                {selectedBubbler.name[0]}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{selectedBubbler.name}</div>
                <div className="text-sm text-gray-600">{selectedBubbler.email}</div>
                <div className="text-sm text-gray-600">{selectedBubbler.phone}</div>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm font-medium">{selectedBubbler.rating}</span>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="font-semibold text-gray-800 mb-2">Permissions:</div>
              <div className="flex flex-wrap gap-2">
                {selectedBubbler.permissions?.map((perm, i) => (
                  <span key={perm + '-' + i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Job Statistics */}
            <div>
              <div className="font-semibold text-gray-800 mb-3">Job Statistics:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedBubbler.jobsCompleted}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedBubbler.jobsAssigned}</div>
                  <div className="text-sm text-blue-700">Assigned</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedBubbler.jobsCancelled}</div>
                  <div className="text-sm text-red-700">Cancelled</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{selectedBubbler.jobsDeclined}</div>
                  <div className="text-sm text-yellow-700">Declined</div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-800 mb-2">Performance</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate:</span>
                    <span className={`font-semibold ${getStatusColor(getCompletionRate(selectedBubbler.jobsCompleted, selectedBubbler.jobsAssigned))}`}>
                      {getCompletionRate(selectedBubbler.jobsCompleted, selectedBubbler.jobsAssigned)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Earnings:</span>
                    <span className="font-semibold text-green-600">${selectedBubbler.totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reassigned Jobs:</span>
                    <span className="font-semibold text-orange-600">{selectedBubbler.jobsReassigned}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-800 mb-2">Activity</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Active:</span>
                    <span className="text-sm font-medium">{formatDate(selectedBubbler.lastActive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Joined:</span>
                    <span className="text-sm font-medium">{formatDate(selectedBubbler.joinDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Member Since:</span>
                    <span className="text-sm font-medium">
                      {Math.floor((new Date() - new Date(selectedBubbler.joinDate)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Jobs */}
            {selectedBubbler.currentJobs && selectedBubbler.currentJobs.length > 0 && (
              <div>
                <div className="font-semibold text-gray-800 mb-3">Current Jobs:</div>
                <div className="space-y-3">
                  {selectedBubbler.currentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-blue-900">{job.serviceType}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Customer:</span> {job.customerName}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Address:</span> {job.address}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Scheduled:</span> {formatDate(job.scheduledDate)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Job ID: {job.id}</div>
                        <div className="font-semibold text-green-600">${job.earnings.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Jobs */}
            {selectedBubbler.upcomingJobs && selectedBubbler.upcomingJobs.length > 0 && (
              <div>
                <div className="font-semibold text-gray-800 mb-3">Upcoming Jobs:</div>
                <div className="space-y-3">
                  {selectedBubbler.upcomingJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-yellow-900">{job.serviceType}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Customer:</span> {job.customerName}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Address:</span> {job.address}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Scheduled:</span> {formatDate(job.scheduledDate)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Job ID: {job.id}</div>
                        <div className="font-semibold text-green-600">${job.earnings.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Jobs Message */}
            {(!selectedBubbler.currentJobs || selectedBubbler.currentJobs.length === 0) && 
             (!selectedBubbler.upcomingJobs || selectedBubbler.upcomingJobs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg font-medium mb-2">No Active Jobs</div>
                <div className="text-sm">This bubbler has no current or upcoming assignments.</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Bubbler Modal */}
      {showAddModal && (
        <Modal title="Add New Bubbler" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newBubbler.name}
                onChange={(e) => setNewBubbler({...newBubbler, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newBubbler.email}
                onChange={(e) => setNewBubbler({...newBubbler, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={newBubbler.phone}
                onChange={(e) => setNewBubbler({...newBubbler, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newBubbler.role}
                onChange={(e) => setNewBubbler({...newBubbler, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(BUBBLER_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBubbler}
                disabled={!newBubbler.name || !newBubbler.email || !newBubbler.phone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Bubbler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Bubbler Modal */}
      {showEditModal && editingBubbler && (
        <Modal title="Edit Bubbler" onClose={() => setShowEditModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingBubbler.name}
                onChange={(e) => setEditingBubbler({...editingBubbler, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editingBubbler.email}
                onChange={(e) => setEditingBubbler({...editingBubbler, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editingBubbler.phone}
                onChange={(e) => setEditingBubbler({...editingBubbler, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editingBubbler.role}
                onChange={(e) => setEditingBubbler({...editingBubbler, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(BUBBLER_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBubbler}
                disabled={!editingBubbler.name || !editingBubbler.email || !editingBubbler.phone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Bubbler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Bubblers; 