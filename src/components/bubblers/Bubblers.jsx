import React, { useEffect, useState } from 'react';
import { supabase, getAllBubblersWeeklyPayouts, createPayoutRecord, updatePayoutStatus, getPayoutHistory } from '../../services/api';
import DeviceBindingService from '../../services/deviceBinding';
import Modal from '../shared/Modal';
import { BUBBLER_ROLES } from '../../constants/roles';
import { FiPlus, FiEdit, FiTrash2, FiUserPlus, FiDollarSign, FiCheckCircle, FiClock, FiShield, FiMonitor, FiUnlock } from 'react-icons/fi';

const Bubblers = () => {
  const [bubblers, setBubblers] = useState([]);
  const [filteredBubblers, setFilteredBubblers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyPayouts, setWeeklyPayouts] = useState({});
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayoutBubbler, setSelectedPayoutBubbler] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDeviceBubbler, setSelectedDeviceBubbler] = useState(null);
  const [deviceFingerprints, setDeviceFingerprints] = useState([]);
  const [newBubbler, setNewBubbler] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'SHINE'
  });
  const [editingBubbler, setEditingBubbler] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchBubblers = async () => {
      setLoading(true);
      setError(null);
      try {
      const { data, error } = await supabase.from('bubblers').select('*');
        if (error) throw error;
        
        // Check device binding status for each bubbler
        const bubblersWithDeviceInfo = await Promise.all(
          data.map(async (bubbler) => {
            const hasActiveBinding = await DeviceBindingService.hasActiveBinding(bubbler.id);
            
            // Get device change count (total resets)
            const { data: deviceData } = await supabase
              .from('device_fingerprints')
              .select('reset_count')
              .eq('bubbler_id', bubbler.id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            const deviceChangeCount = deviceData && deviceData.length > 0 ? deviceData[0].reset_count : 0;
            
            return { 
              ...bubbler, 
              hasActiveDeviceBinding: hasActiveBinding,
              device_change_count: deviceChangeCount
            };
          })
        );
        
        setBubblers(bubblersWithDeviceInfo || []);
        
        // Fetch weekly payouts for all bubblers
        const payouts = await getAllBubblersWeeklyPayouts();
        const payoutsMap = {};
        payouts.forEach(payout => {
          payoutsMap[payout.id] = {
            weeklyPayout: payout.weeklyPayout,
            jobCount: payout.jobCount
          };
        });
        setWeeklyPayouts(payoutsMap);
      } catch (err) {
        setError(err.message);
      } finally {
      setLoading(false);
      }
    };
    fetchBubblers();
  }, []);

  // Filter bubblers based on search and filters
  useEffect(() => {
    let filtered = bubblers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bubbler => 
        (bubbler.first_name?.toLowerCase().includes(term) ||
        bubbler.last_name?.toLowerCase().includes(term) ||
        `${bubbler.first_name} ${bubbler.last_name}`.toLowerCase().includes(term) ||
        bubbler.email?.toLowerCase().includes(term) ||
        bubbler.role?.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bubbler => {
        if (statusFilter === 'active') return bubbler.is_active === true;
        if (statusFilter === 'inactive') return bubbler.is_active === false;
        return true;
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(bubbler => bubbler.role?.toLowerCase() === roleFilter);
    }

    setFilteredBubblers(filtered);
  }, [bubblers, searchTerm, statusFilter, roleFilter]);

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
        first_name: newBubbler.first_name,
        last_name: newBubbler.last_name,
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
      setNewBubbler({ first_name: '', last_name: '', email: '', phone: '', role: 'SHINE' });
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
        first_name: editingBubbler.first_name,
        last_name: editingBubbler.last_name,
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

  // Helper function to get full name
  const getFullName = (bubbler) => {
    return `${bubbler.first_name || ''} ${bubbler.last_name || ''}`.trim();
  };

  const handlePayoutClick = async (bubbler) => {
    setSelectedPayoutBubbler(bubbler);
    try {
      const history = await getPayoutHistory(bubbler.id, 20);
      setPayoutHistory(history);
      setShowPayoutModal(true);
    } catch (error) {
      console.error('Error loading payout history:', error);
      alert('Error loading payout history: ' + error.message);
    }
  };

  const handleCreatePayout = async (bubbler) => {
    try {
      // Get the current week's start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get completed jobs for this week
      const { data: jobs, error } = await supabase
        .from('job_assignments')
        .select('id')
        .eq('bubbler_id', bubbler.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (error) throw error;

      const jobIds = jobs.map(job => job.id);
      const weeklyPayout = weeklyPayouts[bubbler.id]?.weeklyPayout || 0;

      if (weeklyPayout <= 0) {
        alert('No payout amount available for this week.');
        return;
      }

      // Create payout record
      await createPayoutRecord(
        bubbler.id,
        weeklyPayout,
        weekStart.toISOString(),
        weekEnd.toISOString(),
        jobIds
      );

      alert(`Payout record created for ${getFullName(bubbler)}: $${weeklyPayout.toFixed(2)}`);
      
      // Refresh payout history
      const history = await getPayoutHistory(bubbler.id, 20);
      setPayoutHistory(history);
      
    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Error creating payout: ' + error.message);
    }
  };

  const handleMarkAsPaid = async (payoutId) => {
    try {
      await updatePayoutStatus(payoutId, 'paid', new Date().toISOString());
      
      // Refresh payout history
      const history = await getPayoutHistory(selectedPayoutBubbler.id, 20);
      setPayoutHistory(history);
      
      alert('Payout marked as paid successfully!');
    } catch (error) {
      console.error('Error updating payout status:', error);
      alert('Error updating payout status: ' + error.message);
    }
  };

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClearDeviceBinding = async (bubblerId) => {
    try {
      await DeviceBindingService.clearDeviceBinding(bubblerId);

      // Refresh bubblers list
      const { data, error: fetchError } = await supabase.from('bubblers').select('*');
      if (!fetchError) setBubblers(data || []);
      
      alert('Device binding cleared successfully! The user can now bind to a new device.');
    } catch (error) {
      console.error('Error clearing device binding:', error);
      alert('Error clearing device binding: ' + error.message);
    }
  };

  const getDeviceBindingStatus = (bubbler) => {
    // Check if user has any active device binding in the new system
    if (bubbler.device_binding || bubbler.hasActiveDeviceBinding) {
      return {
        status: 'bound',
        text: 'Device Locked',
        color: 'bg-green-100 text-green-800',
        icon: FiShield
      };
    } else {
      return {
        status: 'unbound',
        text: 'No Device Binding',
        color: 'bg-gray-100 text-gray-800',
        icon: FiMonitor
      };
    }
  };

  const handleViewDevices = async (bubbler) => {
    try {
      setSelectedDeviceBubbler(bubbler);
      const fingerprints = await DeviceBindingService.getDeviceBindingInfo(bubbler.id);
      setDeviceFingerprints(fingerprints);
      setShowDeviceModal(true);
    } catch (error) {
      console.error('Error fetching device fingerprints:', error);
      alert('Error loading device information: ' + error.message);
    }
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{bubblers.length}</div>
          <div className="text-sm text-gray-600">Total Bubblers</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {bubblers.filter(b => b.is_active).length}
          </div>
          <div className="text-sm text-green-700">Active & Ready</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            {bubblers.filter(b => !b.is_active).length}
          </div>
          <div className="text-sm text-red-700">Inactive</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            ${bubblers.reduce((total, b) => total + (weeklyPayouts[b.id]?.weeklyPayout || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-blue-700">Total Weekly Payout</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="shine">Shine Bubbler</option>
              <option value="sparkle">Sparkle Bubbler</option>
              <option value="fresh">Fresh Bubbler</option>
              <option value="elite">Elite Bubbler</option>
            </select>
          </div>
        </div>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device Changes</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weekly Payout</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredBubblers.map(bubbler => (
              <tr
                key={bubbler.id || bubbler.email}
                className="hover:bg-blue-50"
              >
                <td className="px-4 py-2 font-medium text-gray-900 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  {getFullName(bubbler)}
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
                <td className="px-4 py-2 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  {(() => {
                    const deviceStatus = getDeviceBindingStatus(bubbler);
                    const IconComponent = deviceStatus.icon;
                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${deviceStatus.color} flex items-center gap-1`}>
                        <IconComponent size={12} />
                        {deviceStatus.text}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-2 cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {bubbler.device_change_count}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="cursor-pointer" onClick={() => handleRowClick(bubbler)}>
                      <FiDollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        ${weeklyPayouts[bubbler.id]?.weeklyPayout?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({weeklyPayouts[bubbler.id]?.jobCount || 0} jobs)
                      </span>
                    </div>
                    {weeklyPayouts[bubbler.id]?.weeklyPayout > 0 && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayoutClick(bubbler);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Payout History"
                        >
                          <FiClock size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePayout(bubbler);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Create Payout Record"
                        >
                          <FiCheckCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDevices(bubbler);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                      title="View Devices"
                    >
                      <FiMonitor size={16} />
                    </button>
                    {bubbler.device_binding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Clear device binding? This will allow the user to bind to a new device.')) {
                            handleClearDeviceBinding(bubbler.id);
                          }
                        }}
                        className="text-orange-600 hover:text-orange-800"
                        title="Clear Device Binding"
                      >
                        <FiUnlock size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && selectedBubbler && (
        <Modal title={getFullName(selectedBubbler) + " Profile"} onClose={() => setShowModal(false)}>
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="bg-cyan-100 rounded-full h-16 w-16 flex items-center justify-center font-bold text-3xl text-cyan-700">
                {getFullName(selectedBubbler)[0]}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{getFullName(selectedBubbler)}</div>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${weeklyPayouts[selectedBubbler.id]?.weeklyPayout?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-emerald-700">
                    Weekly Payout ({weeklyPayouts[selectedBubbler.id]?.jobCount || 0} jobs)
                  </div>
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

            {/* Device Binding Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiShield className="h-5 w-5 text-brand-aqua" />
                Device Security
              </div>
              {selectedBubbler.hasActiveDeviceBinding ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiShield className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Device Locked</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">
                      This account is bound to a specific device to prevent unauthorized access.
                    </p>
                    <div className="text-xs text-green-600">
                      <strong>Bound on:</strong> {selectedBubbler.device_binding_date ? new Date(selectedBubbler.device_binding_date).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Clear device binding? This will allow the user to bind to a new device.')) {
                        await handleClearDeviceBinding(selectedBubbler.id);
                        setShowModal(false);
                      }
                    }}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <FiUnlock size={16} />
                    Clear Device Binding
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FiMonitor className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">No Device Binding</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This account is not bound to any device. The user can bind to a device when they first save their profile.
                  </p>
                </div>
              )}
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={newBubbler.first_name}
                onChange={(e) => setNewBubbler({...newBubbler, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={newBubbler.last_name}
                onChange={(e) => setNewBubbler({...newBubbler, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
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
                disabled={!newBubbler.first_name || !newBubbler.last_name || !newBubbler.email || !newBubbler.phone}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={editingBubbler.first_name}
                onChange={(e) => setEditingBubbler({...editingBubbler, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editingBubbler.last_name}
                onChange={(e) => setEditingBubbler({...editingBubbler, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
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
                disabled={!editingBubbler.first_name || !editingBubbler.last_name || !editingBubbler.email || !editingBubbler.phone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Bubbler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payout Management Modal */}
      {showPayoutModal && selectedPayoutBubbler && (
        <Modal title={`Payout Management - ${getFullName(selectedPayoutBubbler)}`} onClose={() => setShowPayoutModal(false)}>
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Current Week Payout */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Current Week Payout</h3>
                  <p className="text-sm text-green-600">
                    ${weeklyPayouts[selectedPayoutBubbler.id]?.weeklyPayout?.toFixed(2) || '0.00'} 
                    ({weeklyPayouts[selectedPayoutBubbler.id]?.jobCount || 0} jobs)
                  </p>
                </div>
                <button
                  onClick={() => handleCreatePayout(selectedPayoutBubbler)}
                  disabled={!weeklyPayouts[selectedPayoutBubbler.id]?.weeklyPayout || weeklyPayouts[selectedPayoutBubbler.id]?.weeklyPayout <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiCheckCircle size={16} />
                  Create Payout Record
                </button>
              </div>
            </div>

            {/* Payout History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payout History</h3>
              {payoutHistory.length > 0 ? (
                <div className="space-y-3">
                  {payoutHistory.map((payout) => (
                    <div key={payout.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">
                            ${parseFloat(payout.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {formatDate(payout.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusColor(payout.status)}`}>
                            {payout.status}
                          </span>
                          {payout.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsPaid(payout.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                              title="Mark as Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Job IDs: {payout.job_ids?.length || 0} jobs
                      </div>
                      {payout.processed_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Processed: {formatDate(payout.processed_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payout History</h3>
                  <p className="text-sm">No payout records found for this bubbler.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Device Fingerprints Modal */}
      {showDeviceModal && selectedDeviceBubbler && (
        <Modal title={`Device History - ${getFullName(selectedDeviceBubbler)}`} onClose={() => setShowDeviceModal(false)}>
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Device Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Device Binding Summary</h3>
                  <p className="text-sm text-blue-600">
                    Total device changes: {selectedDeviceBubbler.device_change_count || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <FiShield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Security Overview</span>
                </div>
              </div>
            </div>

            {/* Device Fingerprints List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Fingerprint History</h3>
              {deviceFingerprints.length > 0 ? (
                <div className="space-y-4">
                  {deviceFingerprints.map((fingerprint, index) => (
                    <div key={fingerprint.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${fingerprint.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="font-semibold text-gray-900">
                            Device #{deviceFingerprints.length - index}
                          </span>
                          {fingerprint.is_active && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                          {fingerprint.created_by_admin && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Admin Created
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(fingerprint.created_at)}
                        </div>
                      </div>
                      
                      {/* Device Metadata */}
                      {fingerprint.device_metadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Browser:</span>
                            <div className="text-gray-600">{fingerprint.device_metadata.browser}</div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">OS:</span>
                            <div className="text-gray-600">{fingerprint.device_metadata.os}</div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Screen:</span>
                            <div className="text-gray-600">{fingerprint.device_metadata.screen}</div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Timezone:</span>
                            <div className="text-gray-600">{fingerprint.device_metadata.timezone}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional Info */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Last Used:</span>
                          <div>{fingerprint.last_used ? formatDate(fingerprint.last_used) : 'Never'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Reset Count:</span>
                          <div>{fingerprint.reset_count || 0}</div>
                        </div>
                        <div>
                          <span className="font-medium">Language:</span>
                          <div>{fingerprint.device_metadata?.language || 'Unknown'}</div>
                        </div>
                      </div>
                      
                      {/* Fingerprint Hash (truncated for security) */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Fingerprint Hash:</span>
                          <div className="font-mono text-gray-600 break-all">
                            {fingerprint.fingerprint_hash ? 
                              `${fingerprint.fingerprint_hash.substring(0, 16)}...` : 
                              'Not available'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiMonitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Device History</h3>
                  <p className="text-sm">No device fingerprints found for this bubbler.</p>
                </div>
              )}
            </div>

            {/* Security Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <FiShield className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold">Security Information</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Device fingerprints are hashed for security. Each device binding prevents unauthorized access from other devices.
                    Multiple device changes may indicate account sharing attempts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Bubblers; 