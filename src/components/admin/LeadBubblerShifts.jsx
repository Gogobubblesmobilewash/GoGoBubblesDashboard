import React, { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiMapPin,
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const LeadBubblerShifts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [leadBubblers, setLeadBubblers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    zone: 'all',
    leadBubbler: 'all'
  });
  const [formData, setFormData] = useState({
    lead_bubbler_id: '',
    assigned_zone: '',
    start_time: '',
    end_time: '',
    lead_pay_rate: 25.00,
    bonus_amount: 0.00,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all lead bubbler shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('lead_bubbler_shifts')
        .select(`
          *,
          bubblers (
            id,
            first_name,
            last_name,
            email,
            phone,
            assigned_zone,
            role
          )
        `)
        .order('start_time', { ascending: false });

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

      // Load lead bubblers for assignment
      const { data: leadBubblersData, error: leadBubblersError } = await supabase
        .from('bubblers')
        .select('id, first_name, last_name, email, assigned_zone, role')
        .eq('role', 'lead_bubbler')
        .eq('is_active', true)
        .order('first_name');

      if (leadBubblersError) throw leadBubblersError;
      setLeadBubblers(leadBubblersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async () => {
    if (!formData.lead_bubbler_id || !formData.assigned_zone || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_bubbler_shifts')
        .insert({
          ...formData,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success('Lead Bubbler shift created successfully');
      setShowCreateModal(false);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error creating shift:', error);
      toast.error('Failed to create shift');
    }
  };

  const handleUpdateShift = async () => {
    if (!selectedShift) return;

    try {
      const { error } = await supabase
        .from('lead_bubbler_shifts')
        .update({
          lead_bubbler_id: formData.lead_bubbler_id,
          assigned_zone: formData.assigned_zone,
          start_time: formData.start_time,
          end_time: formData.end_time,
          lead_pay_rate: formData.lead_pay_rate,
          bonus_amount: formData.bonus_amount,
          notes: formData.notes
        })
        .eq('id', selectedShift.id);

      if (error) throw error;

      toast.success('Shift updated successfully');
      setShowEditModal(false);
      setSelectedShift(null);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error updating shift:', error);
      toast.error('Failed to update shift');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const { error } = await supabase
        .from('lead_bubbler_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      toast.success('Shift deleted successfully');
      loadData();

    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
    }
  };

  const handleStatusChange = async (shiftId, newStatus) => {
    try {
      const { error } = await supabase
        .from('lead_bubbler_shifts')
        .update({ status: newStatus })
        .eq('id', shiftId);

      if (error) throw error;

      toast.success(`Shift status updated to ${newStatus}`);
      loadData();

    } catch (error) {
      console.error('Error updating shift status:', error);
      toast.error('Failed to update shift status');
    }
  };

  const resetForm = () => {
    setFormData({
      lead_bubbler_id: '',
      assigned_zone: '',
      start_time: '',
      end_time: '',
      lead_pay_rate: 25.00,
      bonus_amount: 0.00,
      notes: ''
    });
  };

  const openEditModal = (shift) => {
    setSelectedShift(shift);
    setFormData({
      lead_bubbler_id: shift.lead_bubbler_id,
      assigned_zone: shift.assigned_zone,
      start_time: shift.start_time.slice(0, 16), // Format for datetime-local input
      end_time: shift.end_time.slice(0, 16),
      lead_pay_rate: shift.lead_pay_rate,
      bonus_amount: shift.bonus_amount,
      notes: shift.notes || ''
    });
    setShowEditModal(true);
  };

  const getStatusDisplay = (status) => {
    const config = {
      scheduled: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '📅',
        label: 'Scheduled'
      },
      active: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🟢',
        label: 'Active'
      },
      completed: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '✅',
        label: 'Completed'
      },
      cancelled: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '❌',
        label: 'Cancelled'
      }
    };
    return config[status] || config.scheduled;
  };

  const getShiftDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getTotalCompensation = (payRate, bonusAmount, startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffHours = (end - start) / (1000 * 60 * 60);
    const basePay = diffHours * payRate;
    return basePay + parseFloat(bonusAmount || 0);
  };

  const filteredShifts = shifts.filter(shift => {
    if (filters.status !== 'all' && shift.status !== filters.status) return false;
    if (filters.zone !== 'all' && shift.assigned_zone !== filters.zone) return false;
    if (filters.leadBubbler !== 'all' && shift.lead_bubbler_id !== filters.leadBubbler) return false;
    return true;
  });

  const zones = [...new Set(shifts.map(shift => shift.assigned_zone))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Bubbler Shift Management</h1>
        <p className="text-gray-600">Schedule and manage oversight shifts for Lead Bubblers</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiCalendar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Shifts</p>
              <p className="text-2xl font-semibold text-gray-900">{shifts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Shifts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shifts.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Lead Bubblers</p>
              <p className="text-2xl font-semibold text-gray-900">{leadBubblers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Pay Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(shifts.reduce((sum, s) => sum + (s.lead_pay_rate || 0), 0) / Math.max(shifts.length, 1)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiPlus className="h-4 w-4" />
              <span>Create Shift</span>
            </button>
            
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filters.zone}
              onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Zones</option>
              {zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
            
            <select
              value={filters.leadBubbler}
              onChange={(e) => setFilters(prev => ({ ...prev, leadBubbler: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Lead Bubblers</option>
              {leadBubblers.map(bubbler => (
                <option key={bubbler.id} value={bubbler.id}>
                  {bubbler.first_name} {bubbler.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lead Bubbler Shifts</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading shifts...</p>
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No shifts found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Bubbler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compensation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShifts.map((shift) => {
                  const statusDisplay = getStatusDisplay(shift.status);
                  const bubbler = shift.bubblers;
                  const duration = getShiftDuration(shift.start_time, shift.end_time);
                  const totalComp = getTotalCompensation(shift.lead_pay_rate, shift.bonus_amount, shift.start_time, shift.end_time);
                  
                  return (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bubbler ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bubbler.first_name} {bubbler.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{bubbler.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{shift.assigned_zone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(shift.start_time).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(shift.start_time).toLocaleTimeString()} - {new Date(shift.end_time).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                          {statusDisplay.icon} {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">${totalComp.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            ${shift.lead_pay_rate}/hr + ${shift.bonus_amount} bonus
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(shift)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Shift"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          
                          {shift.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(shift.id, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Activate Shift"
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {shift.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(shift.id, 'completed')}
                              className="text-gray-600 hover:text-gray-900"
                              title="Complete Shift"
                            >
                              <FiAward className="h-4 w-4" />
                            </button>
                          )}
                          
                          {['scheduled', 'active'].includes(shift.status) && (
                            <button
                              onClick={() => handleStatusChange(shift.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Shift"
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Shift"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Lead Bubbler Shift</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Bubbler <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.lead_bubbler_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_bubbler_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Lead Bubbler</option>
                  {leadBubblers.map(bubbler => (
                    <option key={bubbler.id} value={bubbler.id}>
                      {bubbler.first_name} {bubbler.last_name} - {bubbler.assigned_zone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Zone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assigned_zone}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone name..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lead_pay_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_pay_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonus_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional notes about this shift..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShift}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Lead Bubbler Shift</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Bubbler <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.lead_bubbler_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_bubbler_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Lead Bubbler</option>
                  {leadBubblers.map(bubbler => (
                    <option key={bubbler.id} value={bubbler.id}>
                      {bubbler.first_name} {bubbler.last_name} - {bubbler.assigned_zone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Zone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assigned_zone}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone name..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lead_pay_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_pay_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonus_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional notes about this shift..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedShift(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateShift}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadBubblerShifts; 