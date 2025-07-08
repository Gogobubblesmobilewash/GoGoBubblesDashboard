import React, { useState } from 'react';
import { mockData } from '../../services/api';
import Modal from '../shared/Modal';

const Bubblers = () => {
  const bubblers = mockData.bubblers;
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div className="card">
      <h1 className="text-2xl font-bold mb-4">Bubblers</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {bubblers.map(bubbler => (
            <tr
              key={bubbler.email}
              className="hover:bg-blue-50 cursor-pointer"
              onClick={() => handleRowClick(bubbler)}
            >
              <td className="px-4 py-2 font-medium text-gray-900">{bubbler.name}</td>
              <td className="px-4 py-2 text-gray-700">{bubbler.email}</td>
              <td className="px-4 py-2 text-gray-700">{bubbler.phone}</td>
              <td className="px-4 py-2 text-gray-700">{bubbler.permissions?.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    </div>
  );
};

export default Bubblers; 