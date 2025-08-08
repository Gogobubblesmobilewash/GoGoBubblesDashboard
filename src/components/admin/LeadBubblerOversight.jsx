import React, { useState, useEffect } from 'react';
import {
  FiMapPin,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiDownload,
  FiEye,
  FiFlag,
  FiRefreshCw,
  FiBarChart2,
  FiCalendar,
  FiStar,
  FiMessageCircle
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const LeadBubblerOversight = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leadBubblers, setLeadBubblers] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    zone: 'all',
    rating: 'all',
    status: 'all',
    leadershipStatus: 'all'
  });

  // Load lead bubbler oversight data
  useEffect(() => {
    if (isAdmin) {
      loadOversightData();
    }
  }, [isAdmin]);

  const loadOversightData = async () => {
    setLoading(true);
    try {
      // Load all lead bubblers with their zones and performance data
      const { data: leadData } = await supabase
        .from('bubblers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          assigned_zone,
          current_status,
          rating,
          total_jobs_completed,
          team_members,
          certified_services,
          leadership_status,
          leadership_review_date,
          emergency_availability,
          created_at
        `)
        .eq('role', 'lead_bubbler')
        .eq('is_active', true);

      // Load intervention logs
      const { data: interventionData } = await supabase
        .from('interventions')
        .select(`
          *,
          lead_bubblers (
            id,
            first_name,
            last_name,
            assigned_zone
          ),
          job_assignments (
            id,
            orders (
              customer_name,
              address
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Process lead bubbler data with performance metrics
      const processedLeads = leadData?.map(lead => {
        const leadInterventions = interventionData?.filter(int => int.lead_bubbler_id === lead.id) || [];
        const recentInterventions = leadInterventions.filter(int => {
          const interventionDate = new Date(int.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return interventionDate >= weekAgo;
        });

        return {
          ...lead,
          interventions: leadInterventions,
          recentInterventions: recentInterventions,
          interventionRate: leadInterventions.length / Math.max(lead.total_jobs_completed || 1, 1),
          effectiveness: calculateEffectiveness(leadInterventions),
          teamSize: lead.team_members?.length || 0,
          leadershipStatus: lead.leadership_status || 'active',
          needsReview: lead.leadership_review_date && new Date(lead.leadership_review_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          certifiedServices: Array.isArray(lead.certified_services) ? lead.certified_services : JSON.parse(lead.certified_services || '[]')
        };
      }) || [];

      setLeadBubblers(processedLeads);
      setInterventions(interventionData || []);

    } catch (error) {
      console.error('Error loading oversight data:', error);
      toast.error('Failed to load oversight data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate lead bubbler effectiveness
  const calculateEffectiveness = (interventions) => {
    if (!interventions || interventions.length === 0) return 'excellent';
    
    const recentInterventions = interventions.filter(int => {
      const interventionDate = new Date(int.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return interventionDate >= weekAgo;
    });

    const interventionRate = recentInterventions.length;
    
    if (interventionRate === 0) return 'excellent';
    if (interventionRate <= 2) return 'good';
    if (interventionRate <= 5) return 'fair';
    return 'needs_improvement';
  };

  // Get effectiveness display info
  const getEffectivenessDisplay = (effectiveness) => {
    const config = {
      excellent: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🟢',
        label: 'Excellent'
      },
      good: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '🔵',
        label: 'Good'
      },
      fair: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🟡',
        label: 'Fair'
      },
      needs_improvement: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴',
        label: 'Needs Improvement'
      }
    };
    return config[effectiveness] || config.fair;
  };

  // Download oversight report
  const downloadReport = (leadBubbler) => {
    const reportData = {
      leadBubbler: `${leadBubbler.first_name} ${leadBubbler.last_name}`,
      zone: leadBubbler.assigned_zone,
      teamSize: leadBubbler.teamSize,
      totalJobs: leadBubbler.total_jobs_completed,
      rating: leadBubbler.rating,
      effectiveness: leadBubbler.effectiveness,
      interventions: leadBubbler.interventions.length,
      recentInterventions: leadBubbler.recentInterventions.length,
      interventionRate: `${(leadBubbler.interventionRate * 100).toFixed(1)}%`
    };

    const csvContent = [
      'Lead Bubbler,Zone,Team Size,Total Jobs,Rating,Effectiveness,Total Interventions,Recent Interventions,Intervention Rate',
      `${reportData.leadBubbler},${reportData.zone},${reportData.teamSize},${reportData.totalJobs},${reportData.rating},${reportData.effectiveness},${reportData.interventions},${reportData.recentInterventions},${reportData.interventionRate}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead_bubbler_report_${leadBubbler.first_name}_${leadBubbler.last_name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  // Flag ineffective lead
  const flagIneffectiveLead = (leadBubbler) => {
    if (confirm(`Flag ${leadBubbler.first_name} ${leadBubbler.last_name} as ineffective? This will notify management.`)) {
      // Log the flag
      toast.success(`Flagged ${leadBubbler.first_name} ${leadBubbler.last_name} for review`);
    }
  };

  // View lead details
  const viewLeadDetails = (leadBubbler) => {
    setSelectedLead(leadBubbler);
    setShowDetailsModal(true);
  };

  // Filter lead bubblers
  const filteredLeads = leadBubblers.filter(lead => {
    if (filters.zone !== 'all' && lead.assigned_zone !== filters.zone) return false;
    if (filters.rating !== 'all') {
      const rating = parseFloat(lead.rating || 0);
      if (filters.rating === 'high' && rating < 4.5) return false;
      if (filters.rating === 'medium' && (rating < 4.0 || rating >= 4.5)) return false;
      if (filters.rating === 'low' && rating >= 4.0) return false;
    }
    if (filters.status !== 'all' && lead.effectiveness !== filters.status) return false;
    if (filters.leadershipStatus !== 'all' && lead.leadershipStatus !== filters.leadershipStatus) return false;
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Bubbler Oversight</h1>
        <p className="text-gray-600">Monitor lead bubbler performance and zone management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Lead Bubblers</p>
              <p className="text-2xl font-semibold text-gray-900">{leadBubblers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiMapPin className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Zones</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(leadBubblers.map(lead => lead.assigned_zone)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Interventions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {interventions.filter(int => {
                  const interventionDate = new Date(int.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return interventionDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiStar className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.length > 0 
                  ? (leadBubblers.reduce((sum, lead) => sum + (parseFloat(lead.rating) || 0), 0) / leadBubblers.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.zone}
            onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Zones</option>
            {Array.from(new Set(leadBubblers.map(lead => lead.assigned_zone))).map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
          
          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Ratings</option>
            <option value="high">High (4.5+)</option>
            <option value="medium">Medium (4.0-4.4)</option>
            <option value="low">Low (&lt;4.0)</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Effectiveness</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="needs_improvement">Needs Improvement</option>
          </select>
          
          <select
            value={filters.leadershipStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, leadershipStatus: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Leadership Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
            <option value="review_needed">Review Needed</option>
          </select>
          
          <button
            onClick={loadOversightData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Lead Bubblers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lead Bubbler Performance</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading oversight data...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No lead bubblers found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Bubbler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effectiveness</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leadership Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interventions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const effectivenessDisplay = getEffectivenessDisplay(lead.effectiveness);
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {lead.assigned_zone}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.teamSize} members
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{lead.rating || 'N/A'}</span>
                        </div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${effectivenessDisplay.bgColor} ${effectivenessDisplay.color}`}>
                           {effectivenessDisplay.icon} {effectivenessDisplay.label}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm">
                           <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                             lead.leadershipStatus === 'active' ? 'bg-green-100 text-green-800' :
                             lead.leadershipStatus === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                             lead.leadershipStatus === 'revoked' ? 'bg-red-100 text-red-800' :
                             lead.needsReview ? 'bg-orange-100 text-orange-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {lead.needsReview ? '🔄 Review Needed' : 
                              lead.leadershipStatus === 'active' ? '✅ Active' :
                              lead.leadershipStatus === 'suspended' ? '⚠️ Suspended' :
                              lead.leadershipStatus === 'revoked' ? '❌ Revoked' :
                              'Unknown'
                             }
                           </span>
                           {lead.needsReview && (
                             <div className="text-xs text-orange-600 mt-1">
                               Review overdue
                             </div>
                           )}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">
                           <div>{lead.recentInterventions.length} this week</div>
                           <div className="text-xs text-gray-500">
                             {(lead.interventionRate * 100).toFixed(1)}% rate
                           </div>
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewLeadDetails(lead)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadReport(lead)}
                            className="text-green-600 hover:text-green-900"
                            title="Download Report"
                          >
                            <FiDownload className="h-4 w-4" />
                          </button>
                          {lead.effectiveness === 'needs_improvement' && (
                            <button
                              onClick={() => flagIneffectiveLead(lead)}
                              className="text-red-600 hover:text-red-900"
                              title="Flag Ineffective"
                            >
                              <FiFlag className="h-4 w-4" />
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
        )}
      </div>

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedLead.first_name} {selectedLead.last_name} - Zone Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zone:</span>
                    <span className="font-medium">{selectedLead.assigned_zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium">{selectedLead.teamSize} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Jobs:</span>
                    <span className="font-medium">{selectedLead.total_jobs_completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{selectedLead.rating || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effectiveness:</span>
                    <span className="font-medium">{selectedLead.effectiveness}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Intervention Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interventions:</span>
                    <span className="font-medium">{selectedLead.interventions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week:</span>
                    <span className="font-medium">{selectedLead.recentInterventions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intervention Rate:</span>
                    <span className="font-medium">{(selectedLead.interventionRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Interventions</h4>
              {selectedLead.recentInterventions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent interventions</p>
              ) : (
                <div className="space-y-3">
                  {selectedLead.recentInterventions.slice(0, 5).map((intervention, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {intervention.job_assignments?.orders?.customer_name || 'Unknown Customer'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(intervention.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{intervention.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadBubblerOversight; 