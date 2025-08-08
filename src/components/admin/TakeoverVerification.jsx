import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiEye, FiCheck, FiX, FiClock, FiAlertTriangle, FiUser, FiCalendar, 
  FiDollarSign, FiFileText, FiFilter, FiRefreshCw, FiFlag, FiCheckCircle 
} from 'react-icons/fi';

const TakeoverVerification = () => {
  const [verificationTasks, setVerificationTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    takeoverType: 'all',
    assignedTo: 'all'
  });
  const [reviewForm, setReviewForm] = useState({
    verificationDecision: 'approved',
    reviewNotes: '',
    adjustedCompensation: 0,
    originalBubblerImpact: 'no_impact'
  });

  useEffect(() => {
    loadVerificationTasks();
  }, []);

  const loadVerificationTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('takeover_verification_tasks')
        .select(`
          *,
          lead_checkins (
            *,
            lead_bubbler:lead_bubbler_id (first_name, last_name, email),
            original_bubbler:assisting_bubbler_id (first_name, last_name, email),
            job_assignments (
              *,
              orders (*)
            )
          ),
          assigned_reviewer:assigned_to (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerificationTasks(data || []);
    } catch (error) {
      console.error('Error loading verification tasks:', error);
      toast.error('Failed to load verification tasks');
    }
  };

  const handleReviewTask = async () => {
    if (!selectedTask || !reviewForm.reviewNotes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    try {
      // Update verification task
      const { error: taskError } = await supabase
        .from('takeover_verification_tasks')
        .update({
          status: 'completed',
          verification_decision: reviewForm.verificationDecision,
          review_notes: reviewForm.reviewNotes,
          adjusted_compensation: reviewForm.adjustedCompensation,
          original_bubbler_impact: reviewForm.originalBubblerImpact,
          completed_at: new Date().toISOString(),
          assigned_to: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedTask.id);

      if (taskError) throw taskError;

      // Update lead checkin verification status
      const { error: checkinError } = await supabase
        .from('lead_checkins')
        .update({
          verification_status: reviewForm.verificationDecision,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewForm.reviewNotes
        })
        .eq('id', selectedTask.lead_checkin_id);

      if (checkinError) throw checkinError;

      // If approved, process compensation
      if (reviewForm.verificationDecision === 'approved') {
        const { error: compensationError } = await supabase.rpc('process_lead_checkin_compensation', {
          checkin_id: selectedTask.lead_checkin_id
        });

        if (compensationError) throw compensationError;
      }

      toast.success(`Verification task ${reviewForm.verificationDecision}`);
      setShowReviewModal(false);
      setSelectedTask(null);
      setReviewForm({
        verificationDecision: 'approved',
        reviewNotes: '',
        adjustedCompensation: 0,
        originalBubblerImpact: 'no_impact'
      });
      loadVerificationTasks();

    } catch (error) {
      console.error('Error reviewing task:', error);
      toast.error('Failed to review task');
    }
  };

  const assignTaskToSelf = async (taskId) => {
    try {
      const { error } = await supabase
        .from('takeover_verification_tasks')
        .update({
          assigned_to: (await supabase.auth.getUser()).data.user?.id,
          assigned_at: new Date().toISOString(),
          status: 'in_review'
        })
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task assigned to you');
      loadVerificationTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: FiClock };
      case 'in_review':
        return { label: 'In Review', color: 'bg-blue-100 text-blue-800', icon: FiEye };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: FiCheckCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: FiAlertTriangle };
    }
  };

  const getTakeoverTypeDisplay = (type) => {
    switch (type) {
      case 'partial':
        return { label: 'Partial', color: 'bg-orange-100 text-orange-800' };
      case 'full':
        return { label: 'Full', color: 'bg-red-100 text-red-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredTasks = verificationTasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.takeoverType !== 'all' && task.takeover_type !== filters.takeoverType) return false;
    if (filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned' && task.assigned_to) return false;
      if (filters.assignedTo === 'assigned' && !task.assigned_to) return false;
    }
    return true;
  });

  const stats = {
    total: verificationTasks.length,
    pending: verificationTasks.filter(t => t.status === 'pending').length,
    inReview: verificationTasks.filter(t => t.status === 'in_review').length,
    completed: verificationTasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Takeover Verification Tasks
        </h1>
        <p className="text-gray-600">
          Review and approve takeover claims to prevent fraud and ensure proper compensation
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiEye className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Review</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inReview}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiCheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Takeover Type</label>
              <select
                value={filters.takeoverType}
                onChange={(e) => setFilters(prev => ({ ...prev, takeoverType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="partial">Partial</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Verification Tasks</h3>
            <button
              onClick={loadVerificationTasks}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Bubbler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Bubbler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Takeover Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => {
                const statusDisplay = getStatusDisplay(task.status);
                const takeoverDisplay = getTakeoverTypeDisplay(task.takeover_type);
                const StatusIcon = statusDisplay.icon;
                const leadBubbler = task.lead_checkins?.lead_bubbler;
                const originalBubbler = task.lead_checkins?.original_bubbler;
                const assignedReviewer = task.assigned_reviewer;

                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leadBubbler ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {leadBubbler.first_name} {leadBubbler.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{leadBubbler.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {originalBubbler ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {originalBubbler.first_name} {originalBubbler.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{originalBubbler.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${takeoverDisplay.color}`}>
                        {takeoverDisplay.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignedReviewer ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignedReviewer.first_name} {assignedReviewer.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{assignedReviewer.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowReviewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Review Task"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        
                        {!task.assigned_to && task.status === 'pending' && (
                          <button
                            onClick={() => assignTaskToSelf(task.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Assign to Self"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review Takeover Verification Task
            </h3>
            
            <div className="space-y-4">
              {/* Task Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Task Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Lead Bubbler:</span>
                    <span className="ml-2 font-medium">
                      {selectedTask.lead_checkins?.lead_bubbler?.first_name} {selectedTask.lead_checkins?.lead_bubbler?.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Bubbler:</span>
                    <span className="ml-2 font-medium">
                      {selectedTask.lead_checkins?.original_bubbler?.first_name} {selectedTask.lead_checkins?.original_bubbler?.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Takeover Type:</span>
                    <span className="ml-2 font-medium">{selectedTask.takeover_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{selectedTask.lead_checkins?.duration_minutes} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Labor % Covered:</span>
                    <span className="ml-2 font-medium">{selectedTask.lead_checkins?.labor_percentage_covered}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Job Finished by Lead:</span>
                    <span className="ml-2 font-medium">
                      {selectedTask.lead_checkins?.job_finished_by_lead ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lead Bubbler Notes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Lead Bubbler Notes</h4>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">{selectedTask.lead_checkins?.notes || 'No notes provided'}</p>
                </div>
              </div>

              {/* Tasks Completed */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tasks Completed</h4>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm text-green-800">{selectedTask.lead_checkins?.tasks_completed || 'No tasks specified'}</p>
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Decision <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reviewForm.verificationDecision}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, verificationDecision: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs_adjustment">Needs Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewForm.reviewNotes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, reviewNotes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Provide detailed review notes..."
                  />
                </div>

                {reviewForm.verificationDecision === 'needs_adjustment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjusted Compensation
                    </label>
                    <input
                      type="number"
                      value={reviewForm.adjustedCompensation}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, adjustedCompensation: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Bubbler Impact
                  </label>
                  <select
                    value={reviewForm.originalBubblerImpact}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, originalBubblerImpact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no_impact">No Impact</option>
                    <option value="prorated">Prorated Payout</option>
                    <option value="full_credit">Full Credit ($10)</option>
                    <option value="standby_bonus">Standby Bonus</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeoverVerification; 