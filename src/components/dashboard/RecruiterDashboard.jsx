import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiAward,
  FiTarget,
  FiBarChart2,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiShield,
  FiAlertTriangle,
  FiFileText,
  FiEdit,
  FiFlag
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bubblers, setBubblers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [onboardingTracking, setOnboardingTracking] = useState([]);
  const [leadBubblerShifts, setLeadBubblerShifts] = useState([]);
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showRoleHistoryModal, setShowRoleHistoryModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    promotionStatus: 'all',
    zone: 'all'
  });
  const [promotionForm, setPromotionForm] = useState({
    bubbler_id: '',
    from_role: '',
    to_role: '',
    reason: '',
    performance_score: '',
    recommendation: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all bubblers with their current roles and performance data
      const { data: bubblersData, error: bubblersError } = await supabase
        .from('bubblers')
        .select(`
          *,
          job_assignments (
            id,
            status,
            earnings,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('first_name');

      if (bubblersError) throw bubblersError;
      setBubblers(bubblersData || []);

      // Load promotion history
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(`
          *,
          bubblers (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (promotionsError) throw promotionsError;
      setPromotions(promotionsData || []);

      // Load onboarding tracking
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_tracking')
        .select(`
          *,
          bubblers (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (onboardingError) throw onboardingError;
      setOnboardingTracking(onboardingData || []);

      // Load lead bubbler shifts for role history
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('lead_bubbler_shifts')
        .select(`
          *,
          bubblers (
            id,
            first_name,
            last_name,
            email,
            role,
            assigned_zone
          )
        `)
        .order('start_time', { ascending: false });

      if (shiftsError) throw shiftsError;
      setLeadBubblerShifts(shiftsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load recruiter data');
    } finally {
      setLoading(false);
    }
  };

  const checkPromotionEligibility = (candidate) => {
    const minJobs = 50;
    const minRating = 4.5;
    const minEarnings = 5000;
    const minExperience = 90; // days
    
    const daysSinceStart = Math.floor((new Date() - new Date(candidate.created_at)) / (1000 * 60 * 60 * 24));
    const daysSinceLastPromotion = candidate.last_promotion_date 
      ? Math.floor((new Date() - new Date(candidate.last_promotion_date)) / (1000 * 60 * 60 * 24))
      : daysSinceStart;

    const totalJobs = candidate.job_assignments?.filter(job => job.status === 'completed').length || 0;
    const totalEarnings = candidate.job_assignments?.reduce((sum, job) => sum + (job.earnings || 0), 0) || 0;

    return {
      eligible: (
        totalJobs >= minJobs &&
        parseFloat(candidate.rating || 0) >= minRating &&
        totalEarnings >= minEarnings &&
        daysSinceStart >= minExperience &&
        daysSinceLastPromotion >= 30
      ),
      metrics: {
        totalJobs,
        rating: parseFloat(candidate.rating || 0),
        totalEarnings,
        daysSinceStart,
        daysSinceLastPromotion
      }
    };
  };

  const calculatePromotionScore = (candidate) => {
    const eligibility = checkPromotionEligibility(candidate);
    if (!eligibility.eligible) return 0;

    const { metrics } = eligibility;
    
    // Scoring algorithm (0-100)
    let score = 0;
    
    // Job completion (30 points)
    score += Math.min(30, (metrics.totalJobs / 100) * 30);
    
    // Rating (25 points)
    score += Math.min(25, (metrics.rating / 5) * 25);
    
    // Earnings (20 points)
    score += Math.min(20, (metrics.totalEarnings / 10000) * 20);
    
    // Experience (15 points)
    score += Math.min(15, (metrics.daysSinceStart / 365) * 15);
    
    // Time since last promotion (10 points)
    score += Math.min(10, (metrics.daysSinceLastPromotion / 90) * 10);
    
    return Math.round(score);
  };

  const recommendAction = (score) => {
    if (score >= 80) return { action: 'promote', confidence: 'high', color: 'text-green-600' };
    if (score >= 60) return { action: 'consider', confidence: 'medium', color: 'text-yellow-600' };
    if (score >= 40) return { action: 'develop', confidence: 'low', color: 'text-orange-600' };
    return { action: 'maintain', confidence: 'none', color: 'text-red-600' };
  };

  const submitRecommendation = async () => {
    if (!promotionForm.bubbler_id || !promotionForm.to_role || !promotionForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          bubbler_id: promotionForm.bubbler_id,
          from_role: promotionForm.from_role,
          to_role: promotionForm.to_role,
          reason: promotionForm.reason,
          performance_score: promotionForm.performance_score,
          recommendation: promotionForm.recommendation,
          notes: promotionForm.notes,
          recommended_by: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Promotion recommendation submitted successfully');
      setShowPromotionModal(false);
      setPromotionForm({
        bubbler_id: '',
        from_role: '',
        to_role: '',
        reason: '',
        performance_score: '',
        recommendation: '',
        notes: ''
      });
      loadData();

    } catch (error) {
      console.error('Error submitting recommendation:', error);
      toast.error('Failed to submit recommendation');
    }
  };

  const openPromotionModal = (bubbler) => {
    setSelectedBubbler(bubbler);
    setPromotionForm({
      bubbler_id: bubbler.id,
      from_role: bubbler.role,
      to_role: '',
      reason: '',
      performance_score: calculatePromotionScore(bubbler).toString(),
      recommendation: '',
      notes: ''
    });
    setShowPromotionModal(true);
  };

  const openRoleHistoryModal = (bubbler) => {
    setSelectedBubbler(bubbler);
    setShowRoleHistoryModal(true);
  };

  const getRoleHistory = (bubblerId) => {
    const bubblerPromotions = promotions.filter(p => p.bubbler_id === bubblerId);
    const bubblerShifts = leadBubblerShifts.filter(s => s.lead_bubbler_id === bubblerId);
    
    return {
      promotions: bubblerPromotions,
      shifts: bubblerShifts,
      totalShifts: bubblerShifts.length,
      completedShifts: bubblerShifts.filter(s => s.status === 'completed').length,
      totalOversightHours: bubblerShifts.reduce((sum, s) => {
        if (s.status === 'completed') {
          const start = new Date(s.start_time);
          const end = new Date(s.end_time);
          return sum + ((end - start) / (1000 * 60 * 60));
        }
        return sum;
      }, 0)
    };
  };

  const filteredBubblers = bubblers.filter(bubbler => {
    if (filters.status !== 'all' && bubbler.current_status !== filters.status) return false;
    if (filters.role !== 'all' && bubbler.role !== filters.role) return false;
    if (filters.zone !== 'all' && bubbler.assigned_zone !== filters.zone) return false;
    return true;
  });

  const eligibleCandidates = filteredBubblers.filter(bubbler => {
    const eligibility = checkPromotionEligibility(bubbler);
    return eligibility.eligible;
  });

  const zones = [...new Set(bubblers.map(b => b.assigned_zone))];
  const roles = [...new Set(bubblers.map(b => b.role))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
        <p className="text-gray-600">Internal promotions, onboarding tracking, and role history management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Bubblers</p>
              <p className="text-2xl font-semibold text-gray-900">{bubblers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiAward className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Eligible for Promotion</p>
              <p className="text-2xl font-semibold text-gray-900">{eligibleCandidates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiTrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Promotions This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {promotions.filter(p => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(p.created_at) >= monthAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiShield className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Lead Bubblers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bubblers.filter(b => b.role === 'lead_bubbler').length}
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
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
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Eligible Candidates Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Promotion-Eligible Candidates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Bubblers meeting promotion criteria (50+ jobs, 4.5+ rating, $5k+ earnings, 90+ days experience)
          </p>
        </div>
        
        {eligibleCandidates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No eligible candidates found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bubbler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eligibleCandidates.map((bubbler) => {
                  const score = calculatePromotionScore(bubbler);
                  const recommendation = recommendAction(score);
                  
                  return (
                    <tr key={bubbler.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bubbler.first_name} {bubbler.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{bubbler.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {bubbler.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{score}/100</div>
                          <div className={`ml-2 text-xs ${recommendation.color}`}>
                            {recommendation.action}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          recommendation.action === 'promote' ? 'bg-green-100 text-green-800' :
                          recommendation.action === 'consider' ? 'bg-yellow-100 text-yellow-800' :
                          recommendation.action === 'develop' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPromotionModal(bubbler)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Submit Promotion"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openRoleHistoryModal(bubbler)}
                            className="text-green-600 hover:text-green-900"
                            title="View Role History"
                          >
                            <FiEye className="h-4 w-4" />
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

      {/* Recent Promotions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Promotions</h2>
        </div>
        
        {promotions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No promotions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bubbler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.slice(0, 10).map((promotion) => {
                  const bubbler = promotion.bubblers;
                  
                  return (
                    <tr key={promotion.id} className="hover:bg-gray-50">
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
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {promotion.from_role.replace('_', ' ')} → {promotion.to_role.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">{promotion.reason}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {promotion.performance_score}/100
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promotion.status === 'approved' ? 'bg-green-100 text-green-800' :
                          promotion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {promotion.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(promotion.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit Promotion Recommendation
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bubbler
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {selectedBubbler?.first_name} {selectedBubbler?.last_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Role
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {promotionForm.from_role.replace('_', ' ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={promotionForm.to_role}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, to_role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select New Role</option>
                  <option value="lead_bubbler">Lead Bubbler</option>
                  <option value="support_bubbler">Support Bubbler</option>
                  <option value="elite_bubbler">EliteBubbler</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Score
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {promotionForm.performance_score}/100
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={promotionForm.reason}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Explain the reason for this promotion..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation
                </label>
                <select
                  value={promotionForm.recommendation}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Recommendation</option>
                  <option value="strongly_recommend">Strongly Recommend</option>
                  <option value="recommend">Recommend</option>
                  <option value="consider">Consider</option>
                  <option value="not_recommended">Not Recommended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={promotionForm.notes}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPromotionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitRecommendation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role History Modal */}
      {showRoleHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Role History - {selectedBubbler?.first_name} {selectedBubbler?.last_name}
            </h3>
            
            {selectedBubbler && (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <span className="ml-2 font-medium">{selectedBubbler.role.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Zone:</span>
                      <span className="ml-2 font-medium">{selectedBubbler.assigned_zone || 'Not assigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">{selectedBubbler.current_status}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating:</span>
                      <span className="ml-2 font-medium">{selectedBubbler.rating || 'N/A'}/5.0</span>
                    </div>
                  </div>
                </div>

                {/* Promotion History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Promotion History</h4>
                  {(() => {
                    const history = getRoleHistory(selectedBubbler.id);
                    if (history.promotions.length === 0) {
                      return <p className="text-gray-500 text-sm">No promotions recorded</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {history.promotions.map((promotion, index) => (
                          <div key={promotion.id} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="text-sm font-medium text-gray-900">
                              {promotion.from_role.replace('_', ' ')} → {promotion.to_role.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(promotion.created_at).toLocaleDateString()} - {promotion.reason}
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {promotion.performance_score}/100 | Status: {promotion.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Lead Bubbler Shifts (if applicable) */}
                {selectedBubbler.role === 'lead_bubbler' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Lead Bubbler Activity</h4>
                    {(() => {
                      const history = getRoleHistory(selectedBubbler.id);
                      if (history.shifts.length === 0) {
                        return <p className="text-gray-500 text-sm">No oversight shifts recorded</p>;
                      }
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Shifts:</span>
                              <span className="ml-2 font-medium">{history.totalShifts}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Completed:</span>
                              <span className="ml-2 font-medium">{history.completedShifts}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Oversight Hours:</span>
                              <span className="ml-2 font-medium">{Math.round(history.totalOversightHours)}h</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Recent shifts: {history.shifts.slice(0, 3).map(s => 
                              `${new Date(s.start_time).toLocaleDateString()} (${s.status})`
                            ).join(', ')}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRoleHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard; 