import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiEye,
  FiFlag,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiFileText,
  FiShield,
  FiAlertTriangle,
  FiThumbsUp,
  FiThumbsDown,
  FiBarChart2,
  FiAward,
  FiTarget
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const LeadBubblerPerformance = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leadBubblers, setLeadBubblers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewHistoryModal, setShowReviewHistoryModal] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    rating: 'all',
    reviewStatus: 'all'
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    timeliness: 5,
    oversightQuality: 5,
    notes: '',
    issues: [],
    approvedToLead: true,
    nextReviewDate: ''
  });

  // Load lead bubbler performance data
  useEffect(() => {
    if (isAdmin) {
      loadPerformanceData();
    }
  }, [isAdmin]);

  const loadPerformanceData = async () => {
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

      // Load recent interventions for each lead
      const { data: interventionsData } = await supabase
        .from('interventions')
        .select('*')
        .order('created_at', { ascending: false });

      // Load review history
      const { data: reviewsData } = await supabase
        .from('lead_bubbler_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      // Load feedback ratings for all lead bubblers
      const feedbackPromises = leadData?.map(async (lead) => {
        const { data: feedbackData } = await supabase.rpc('calculate_lead_bubbler_rating', {
          lead_bubbler_id: lead.id,
          days_back: 30
        });
        return { leadId: lead.id, feedback: feedbackData?.[0] };
      }) || [];

      const feedbackResults = await Promise.all(feedbackPromises);
      const feedbackMap = {};
      feedbackResults.forEach(result => {
        if (result.feedback) {
          feedbackMap[result.leadId] = result.feedback;
        }
      });

      // Process lead bubbler data with performance metrics
      const processedLeads = leadData?.map(lead => {
        const leadInterventions = interventionsData?.filter(int => int.lead_bubbler_id === lead.id) || [];
        const leadReviews = reviewsData?.filter(review => review.lead_bubbler_id === lead.id) || [];
        const recentInterventions = leadInterventions.filter(int => {
          const interventionDate = new Date(int.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return interventionDate >= weekAgo;
        });

        // Calculate performance scores
        const avgRating = leadReviews.length > 0 
          ? leadReviews.reduce((sum, review) => sum + review.rating, 0) / leadReviews.length 
          : 0;
        const avgTimeliness = leadReviews.length > 0 
          ? leadReviews.reduce((sum, review) => sum + review.timeliness, 0) / leadReviews.length 
          : 0;
        const avgOversightQuality = leadReviews.length > 0 
          ? leadReviews.reduce((sum, review) => sum + review.oversight_quality, 0) / leadReviews.length 
          : 0;

        const overallScore = Math.round((avgRating + avgTimeliness + avgOversightQuality) / 3 * 10) / 10;

        return {
          ...lead,
          interventions: leadInterventions,
          recentInterventions: recentInterventions,
          reviews: leadReviews,
          feedbackRatings: feedbackMap[lead.id],
          avgRating,
          avgTimeliness,
          avgOversightQuality,
          overallScore,
          teamSize: lead.team_members?.length || 0,
          leadershipStatus: lead.leadership_status || 'active',
          needsReview: lead.leadership_review_date && new Date(lead.leadership_review_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          certifiedServices: Array.isArray(lead.certified_services) ? lead.certified_services : JSON.parse(lead.certified_services || '[]')
        };
      }) || [];

      setLeadBubblers(processedLeads);

    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Get score display info
  const getScoreDisplay = (score) => {
    if (score >= 4.5) return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Excellent' };
    if (score >= 4.0) return { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Good' };
    if (score >= 3.5) return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Fair' };
    return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Needs Improvement' };
  };

  // Load review history for a specific lead
  const loadReviewHistory = async (leadId) => {
    try {
      const { data: reviews } = await supabase
        .from('lead_bubbler_reviews')
        .select(`
          *,
          reviewed_by (
            id,
            first_name,
            last_name
          )
        `)
        .eq('lead_bubbler_id', leadId)
        .order('created_at', { ascending: false });

      setReviewHistory(reviews || []);
      setShowReviewHistoryModal(true);
    } catch (error) {
      console.error('Error loading review history:', error);
      toast.error('Failed to load review history');
    }
  };

  // Submit new review
  const submitReview = async () => {
    if (!selectedLead || !reviewForm.notes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_bubbler_reviews')
        .insert({
          lead_bubbler_id: selectedLead.id,
          reviewed_by: user.id,
          rating: reviewForm.rating,
          timeliness: reviewForm.timeliness,
          oversight_quality: reviewForm.oversightQuality,
          notes: reviewForm.notes,
          issues: reviewForm.issues,
          approved_to_lead: reviewForm.approvedToLead,
          next_review_date: reviewForm.nextReviewDate,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update lead bubbler status
      const { error: updateError } = await supabase
        .from('bubblers')
        .update({
          leadership_status: reviewForm.approvedToLead ? 'active' : 'suspended',
          leadership_review_date: reviewForm.nextReviewDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;

      toast.success(`Review submitted for ${selectedLead.first_name} ${selectedLead.last_name}`);
      setShowReviewModal(false);
      setReviewForm({
        rating: 5,
        timeliness: 5,
        oversightQuality: 5,
        notes: '',
        issues: [],
        approvedToLead: true,
        nextReviewDate: ''
      });
      setSelectedLead(null);
      loadPerformanceData(); // Refresh data

    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  // Toggle approved to lead status
  const toggleApprovedStatus = async (lead, approved) => {
    try {
      const { error } = await supabase
        .from('bubblers')
        .update({
          leadership_status: approved ? 'active' : 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success(`${lead.first_name} ${lead.last_name} ${approved ? 'approved' : 'suspended'} for leadership`);
      loadPerformanceData();

    } catch (error) {
      console.error('Error updating leadership status:', error);
      toast.error('Failed to update leadership status');
    }
  };

  // Filter lead bubblers
  const filteredLeads = leadBubblers.filter(lead => {
    if (filters.status !== 'all' && lead.leadershipStatus !== filters.status) return false;
    if (filters.rating !== 'all') {
      if (filters.rating === 'high' && lead.overallScore < 4.5) return false;
      if (filters.rating === 'medium' && (lead.overallScore < 4.0 || lead.overallScore >= 4.5)) return false;
      if (filters.rating === 'low' && lead.overallScore >= 4.0) return false;
    }
    if (filters.reviewStatus !== 'all') {
      if (filters.reviewStatus === 'needs_review' && !lead.needsReview) return false;
      if (filters.reviewStatus === 'current' && lead.needsReview) return false;
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Bubbler Performance</h1>
        <p className="text-gray-600">Performance reviews, scoring, and leadership status management</p>
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
            <FiCalendar className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Need Review</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.filter(l => l.needsReview).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiStar className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.length > 0 
                  ? (leadBubblers.reduce((sum, l) => sum + l.overallScore, 0) / leadBubblers.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAward className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Suspended</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leadBubblers.filter(l => l.leadershipStatus === 'suspended').length}
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
            value={filters.reviewStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, reviewStatus: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Review Status</option>
            <option value="needs_review">Needs Review</option>
            <option value="current">Current</option>
          </select>
          
          <button
            onClick={loadPerformanceData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Lead Bubbler Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading performance data...</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeliness</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oversight Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const scoreDisplay = getScoreDisplay(lead.overallScore);
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-xs text-gray-400">
                            {lead.teamSize} team members • {lead.reviews.length} reviews
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {lead.assigned_zone}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${scoreDisplay.bgColor} ${scoreDisplay.color}`}>
                            {lead.overallScore.toFixed(1)} - {scoreDisplay.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{lead.avgRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-sm font-medium">{lead.avgTimeliness.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiTarget className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium">{lead.avgOversightQuality.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiStar className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-sm font-medium">
                            {lead.feedbackRatings ? 
                              `${lead.feedbackRatings.avg_overall_rating?.toFixed(1) || 'N/A'}/5.0` : 
                              'No feedback'
                            }
                          </span>
                          {lead.feedbackRatings && (
                            <div className="text-xs text-gray-500 ml-1">
                              ({lead.feedbackRatings.total_feedback_count} responses)
                            </div>
                          )}
                        </div>
                        {lead.feedbackRatings && lead.feedbackRatings.avg_overall_rating < 4.7 && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Below retention threshold
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowReviewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Add Review"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => loadReviewHistory(lead.id)}
                            className="text-green-600 hover:text-green-900"
                            title="View Review History"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleApprovedStatus(lead, lead.leadershipStatus !== 'active')}
                            className={`${
                              lead.leadershipStatus === 'active' 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={lead.leadershipStatus === 'active' ? 'Suspend' : 'Approve'}
                          >
                            {lead.leadershipStatus === 'active' ? 
                              <FiXCircle className="h-4 w-4" /> : 
                              <FiCheckCircle className="h-4 w-4" />
                            }
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

      {/* Review Modal */}
      {showReviewModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Review - {selectedLead.first_name} {selectedLead.last_name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Fair</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Unsatisfactory</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeliness
                </label>
                <select
                  value={reviewForm.timeliness}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, timeliness: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Fair</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Unsatisfactory</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oversight Quality
                </label>
                <select
                  value={reviewForm.oversightQuality}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, oversightQuality: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Fair</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Unsatisfactory</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewForm.notes}
                onChange={(e) => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Detailed review notes..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issues/Flags
              </label>
              <div className="space-y-2">
                {['Policy violations', 'Performance concerns', 'Team conflicts', 'Communication issues', 'Attendance problems'].map(issue => (
                  <label key={issue} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reviewForm.issues.includes(issue)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ ...prev, issues: [...prev.issues, issue] }));
                        } else {
                          setReviewForm(prev => ({ ...prev, issues: prev.issues.filter(i => i !== issue) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{issue}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved to Lead
                </label>
                <select
                  value={reviewForm.approvedToLead}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, approvedToLead: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={true}>Yes - Approved</option>
                  <option value={false}>No - Suspended</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Review Date
                </label>
                <input
                  type="date"
                  value={reviewForm.nextReviewDate}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review History Modal */}
      {showReviewHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Review History - {selectedLead?.first_name} {selectedLead?.last_name}
              </h3>
              <button
                onClick={() => setShowReviewHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {reviewHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No review history available</p>
            ) : (
              <div className="space-y-4">
                {reviewHistory.map((review, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Review by {review.reviewed_by?.first_name} {review.reviewed_by?.last_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          review.approved_to_lead ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {review.approved_to_lead ? 'Approved' : 'Suspended'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Rating:</span>
                        <div className="flex items-center">
                          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{review.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Timeliness:</span>
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-sm">{review.timeliness}/5</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Oversight Quality:</span>
                        <div className="flex items-center">
                          <FiTarget className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm">{review.oversight_quality}/5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{review.notes}</p>
                    </div>
                    
                    {review.issues && review.issues.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Issues:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {review.issues.map((issue, i) => (
                            <span key={i} className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {review.next_review_date && (
                      <div className="text-sm text-gray-500">
                        Next review: {new Date(review.next_review_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadBubblerPerformance; 