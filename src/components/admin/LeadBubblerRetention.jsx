import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiFileText,
  FiShield,
  FiTarget,
  FiBarChart2,
  FiAward,
  FiFlag,
  FiEye,
  FiEdit,
  FiBell
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const LeadBubblerRetention = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leadBubblers, setLeadBubblers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    violationType: 'all',
    riskLevel: 'all'
  });

  // Retention rules configuration
  const RETENTION_RULES = {
    avgCustomerRating: { threshold: 4.7, operator: '>=', label: 'Avg Customer Rating' },
    timelyCompletion: { threshold: 95, operator: '>=', label: 'Timely Completion %' },
    supportComplaints: { threshold: 2, operator: '<=', label: 'Support Complaints/Month' },
    missedCheckins: { threshold: 1, operator: '<=', label: 'Missed Check-ins/Week' }
  };

  // Load lead bubbler retention data
  useEffect(() => {
    if (isAdmin) {
      loadRetentionData();
    }
  }, [isAdmin]);

  const loadRetentionData = async () => {
    setLoading(true);
    try {
      // Load all lead bubblers with performance data
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

      // Load job assignments for completion rate calculation
      const { data: jobAssignments } = await supabase
        .from('job_assignments')
        .select(`
          *,
          order_service (
            service_type,
            scheduled_date
          ),
          orders (
            customer_rating,
            customer_feedback
          )
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      // Load support complaints
      const { data: complaints } = await supabase
        .from('support_complaints')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      // Load check-in reports
      const { data: checkins } = await supabase
        .from('check_in_reports')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      // Process lead bubbler data with retention metrics
      const processedLeads = leadData?.map(lead => {
        const leadJobs = jobAssignments?.filter(job => job.bubbler_id === lead.id) || [];
        const leadComplaints = complaints?.filter(comp => comp.lead_bubbler_id === lead.id) || [];
        const leadCheckins = checkins?.filter(checkin => checkin.lead_bubbler_id === lead.id) || [];

        // Calculate retention metrics
        const metrics = calculateRetentionMetrics(lead, leadJobs, leadComplaints, leadCheckins);
        const violations = checkRetentionViolations(metrics);
        const riskLevel = calculateRiskLevel(violations);

        return {
          ...lead,
          metrics,
          violations,
          riskLevel,
          teamSize: lead.team_members?.length || 0,
          leadershipStatus: lead.leadership_status || 'active',
          certifiedServices: Array.isArray(lead.certified_services) ? lead.certified_services : JSON.parse(lead.certified_services || '[]')
        };
      }) || [];

      setLeadBubblers(processedLeads);

    } catch (error) {
      console.error('Error loading retention data:', error);
      toast.error('Failed to load retention data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate retention metrics for a lead bubbler
  const calculateRetentionMetrics = (lead, jobs, complaints, checkins) => {
    // Calculate average customer rating
    const ratedJobs = jobs.filter(job => job.orders?.customer_rating);
    const avgCustomerRating = ratedJobs.length > 0 
      ? ratedJobs.reduce((sum, job) => sum + job.orders.customer_rating, 0) / ratedJobs.length 
      : 0;

    // Calculate timely completion rate
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const onTimeJobs = completedJobs.filter(job => {
      const scheduled = new Date(job.order_service.scheduled_date);
      const completed = new Date(job.updated_at);
      const timeDiff = completed.getTime() - scheduled.getTime();
      return timeDiff <= 0 || timeDiff <= 15 * 60 * 1000; // On time or within 15 minutes
    });
    const timelyCompletionRate = completedJobs.length > 0 
      ? (onTimeJobs.length / completedJobs.length) * 100 
      : 100;

    // Count support complaints in last 30 days
    const supportComplaintsCount = complaints.length;

    // Count missed check-ins in last 7 days
    const expectedCheckins = Math.ceil(7 / 7) * 2; // 2 check-ins per week
    const missedCheckinsCount = Math.max(0, expectedCheckins - checkins.length);

    return {
      avgCustomerRating: Math.round(avgCustomerRating * 10) / 10,
      timelyCompletionRate: Math.round(timelyCompletionRate * 10) / 10,
      supportComplaintsCount,
      missedCheckinsCount,
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      ratedJobs: ratedJobs.length
    };
  };

  // Check for retention rule violations
  const checkRetentionViolations = (metrics) => {
    const violations = [];

    if (metrics.avgCustomerRating < RETENTION_RULES.avgCustomerRating.threshold) {
      violations.push({
        rule: 'avgCustomerRating',
        current: metrics.avgCustomerRating,
        threshold: RETENTION_RULES.avgCustomerRating.threshold,
        severity: 'high'
      });
    }

    if (metrics.timelyCompletionRate < RETENTION_RULES.timelyCompletion.threshold) {
      violations.push({
        rule: 'timelyCompletion',
        current: metrics.timelyCompletionRate,
        threshold: RETENTION_RULES.timelyCompletion.threshold,
        severity: 'high'
      });
    }

    if (metrics.supportComplaintsCount > RETENTION_RULES.supportComplaints.threshold) {
      violations.push({
        rule: 'supportComplaints',
        current: metrics.supportComplaintsCount,
        threshold: RETENTION_RULES.supportComplaints.threshold,
        severity: 'medium'
      });
    }

    if (metrics.missedCheckinsCount > RETENTION_RULES.missedCheckins.threshold) {
      violations.push({
        rule: 'missedCheckins',
        current: metrics.missedCheckinsCount,
        threshold: RETENTION_RULES.missedCheckins.threshold,
        severity: 'medium'
      });
    }

    return violations;
  };

  // Calculate risk level based on violations
  const calculateRiskLevel = (violations) => {
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;

    if (highSeverityCount >= 2 || highSeverityCount >= 1 && mediumSeverityCount >= 2) {
      return 'critical';
    } else if (highSeverityCount >= 1 || mediumSeverityCount >= 2) {
      return 'high';
    } else if (mediumSeverityCount >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Get risk level display info
  const getRiskLevelDisplay = (riskLevel) => {
    const config = {
      critical: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴',
        label: 'Critical Risk'
      },
      high: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: '🟠',
        label: 'High Risk'
      },
      medium: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🟡',
        label: 'Medium Risk'
      },
      low: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🟢',
        label: 'Low Risk'
      }
    };
    return config[riskLevel] || config.low;
  };

  // Revoke lead bubbler status
  const revokeLeadStatus = async (lead, reason) => {
    try {
      const { error } = await supabase
        .from('bubblers')
        .update({
          leadership_status: 'revoked',
          leadership_review_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      // Log the revocation
      const { error: logError } = await supabase
        .from('lead_bubbler_reviews')
        .insert({
          lead_bubbler_id: lead.id,
          reviewed_by: user.id,
          rating: 1,
          timeliness: 1,
          oversight_quality: 1,
          notes: `Status revoked due to retention rule violations: ${reason}`,
          issues: ['Retention rule violation'],
          approved_to_lead: false,
          created_at: new Date().toISOString()
        });

      if (logError) throw logError;

      toast.success(`${lead.first_name} ${lead.last_name} lead status revoked`);
      setShowViolationModal(false);
      loadRetentionData();

    } catch (error) {
      console.error('Error revoking lead status:', error);
      toast.error('Failed to revoke lead status');
    }
  };

  // Filter lead bubblers
  const filteredLeads = leadBubblers.filter(lead => {
    if (filters.status !== 'all' && lead.leadershipStatus !== filters.status) return false;
    if (filters.violationType !== 'all' && !lead.violations.some(v => v.rule === filters.violationType)) return false;
    if (filters.riskLevel !== 'all' && lead.riskLevel !== filters.riskLevel) return false;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Bubbler Retention</h1>
        <p className="text-gray-600">Monitor retention rules and enforce leadership standards</p>
      </div>

      {/* Retention Rules Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <FiShield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Retention Rules & Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {Object.entries(RETENTION_RULES).map(([key, rule]) => (
                <div key={key} className="flex items-center justify-between bg-white rounded p-2">
                  <span className="text-sm font-medium text-gray-700">{rule.label}:</span>
                  <span className={`text-sm font-semibold ${
                    rule.operator === '>=' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {rule.operator} {rule.threshold}
                    {key === 'avgCustomerRating' ? '' : key === 'timelyCompletion' ? '%' : key === 'supportComplaints' ? '/month' : '/week'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ⚠️ Violation of any threshold may result in lead status revocation
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Leads</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.filter(l => l.leadershipStatus === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">At Risk</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.filter(l => l.riskLevel === 'high' || l.riskLevel === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiXCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Violations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.reduce((sum, l) => sum + l.violations.length, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAward className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Compliant</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.filter(l => l.violations.length === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
          
          <select
            value={filters.violationType}
            onChange={(e) => setFilters(prev => ({ ...prev, violationType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Violations</option>
            <option value="avgCustomerRating">Rating Violations</option>
            <option value="timelyCompletion">Completion Violations</option>
            <option value="supportComplaints">Complaint Violations</option>
            <option value="missedCheckins">Check-in Violations</option>
          </select>
          
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
          
          <button
            onClick={loadRetentionData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Lead Bubbler Retention Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Retention Monitoring</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading retention data...</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaints</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-ins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const riskDisplay = getRiskLevelDisplay(lead.riskLevel);
                  
                  return (
                    <tr key={lead.id} className={`hover:bg-gray-50 ${
                      lead.riskLevel === 'critical' ? 'bg-red-50' : 
                      lead.riskLevel === 'high' ? 'bg-orange-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-xs text-gray-400">
                            {lead.assigned_zone} • {lead.teamSize} team members
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${riskDisplay.bgColor} ${riskDisplay.color}`}>
                          {riskDisplay.icon} {riskDisplay.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className={`text-sm font-medium ${
                            lead.metrics.avgCustomerRating >= RETENTION_RULES.avgCustomerRating.threshold 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {lead.metrics.avgCustomerRating}/5.0
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 text-blue-500 mr-1" />
                          <span className={`text-sm font-medium ${
                            lead.metrics.timelyCompletionRate >= RETENTION_RULES.timelyCompletion.threshold 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {lead.metrics.timelyCompletionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiFlag className="h-4 w-4 text-red-500 mr-1" />
                          <span className={`text-sm font-medium ${
                            lead.metrics.supportComplaintsCount <= RETENTION_RULES.supportComplaints.threshold 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {lead.metrics.supportComplaintsCount}/month
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className={`text-sm font-medium ${
                            lead.metrics.missedCheckinsCount <= RETENTION_RULES.missedCheckins.threshold 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {lead.metrics.missedCheckinsCount}/week
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {lead.violations.length === 0 ? (
                            <span className="text-green-600 font-medium">No violations</span>
                          ) : (
                            <div className="space-y-1">
                              {lead.violations.map((violation, index) => (
                                <div key={index} className="text-xs text-red-600">
                                  {RETENTION_RULES[violation.rule].label}: {violation.current} vs {violation.threshold}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          {lead.violations.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowViolationModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Revoke Status"
                            >
                              <FiXCircle className="h-4 w-4" />
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

      {/* Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Retention Details - {selectedLead.first_name} {selectedLead.last_name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Customer Rating</span>
                    <span className={`text-sm font-semibold ${
                      selectedLead.metrics.avgCustomerRating >= RETENTION_RULES.avgCustomerRating.threshold 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedLead.metrics.avgCustomerRating}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Timely Completion</span>
                    <span className={`text-sm font-semibold ${
                      selectedLead.metrics.timelyCompletionRate >= RETENTION_RULES.timelyCompletion.threshold 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedLead.metrics.timelyCompletionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Support Complaints</span>
                    <span className={`text-sm font-semibold ${
                      selectedLead.metrics.supportComplaintsCount <= RETENTION_RULES.supportComplaints.threshold 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedLead.metrics.supportComplaintsCount}/month
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Missed Check-ins</span>
                    <span className={`text-sm font-semibold ${
                      selectedLead.metrics.missedCheckinsCount <= RETENTION_RULES.missedCheckins.threshold 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedLead.metrics.missedCheckinsCount}/week
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Violations & Risk Assessment</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Level</span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        getRiskLevelDisplay(selectedLead.riskLevel).bgColor
                      } ${getRiskLevelDisplay(selectedLead.riskLevel).color}`}>
                        {getRiskLevelDisplay(selectedLead.riskLevel).icon} {getRiskLevelDisplay(selectedLead.riskLevel).label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Based on {selectedLead.violations.length} rule violation(s)
                    </p>
                  </div>
                  
                  {selectedLead.violations.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-red-600">Active Violations:</span>
                      {selectedLead.violations.map((violation, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                          <div className="text-sm font-medium text-red-800">
                            {RETENTION_RULES[violation.rule].label}
                          </div>
                          <div className="text-xs text-red-600">
                            Current: {violation.current} | Required: {violation.threshold}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="text-sm font-medium text-green-800">No violations</div>
                      <div className="text-xs text-green-600">All retention rules are being met</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      {showViolationModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revoke Lead Status
            </h3>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                Are you sure you want to revoke lead status for <strong>{selectedLead.first_name} {selectedLead.last_name}</strong>?
              </p>
              <p className="text-xs text-red-600 mt-1">
                This action cannot be undone and will immediately remove their leadership privileges.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Revocation
              </label>
              <textarea
                id="revocationReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="Specify the reason for revocation..."
                defaultValue={`Retention rule violations: ${selectedLead.violations.map(v => RETENTION_RULES[v.rule].label).join(', ')}`}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowViolationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = document.getElementById('revocationReason').value;
                  revokeLeadStatus(selectedLead, reason);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Revoke Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadBubblerRetention; 