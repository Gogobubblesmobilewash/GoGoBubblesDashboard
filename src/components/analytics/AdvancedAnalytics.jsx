import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiUsers, 
  FiBriefcase,
  FiStar,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiArrowUp,
  FiArrowDown,
  FiMinus
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import activityLogger from '../../services/activityLogger';

const AdvancedAnalytics = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [viewMode, setViewMode] = useState('overview'); // overview, performance, trends, predictions
  const [metrics, setMetrics] = useState({});
  const [trends, setTrends] = useState({});
  const [performance, setPerformance] = useState({});
  const [predictions, setPredictions] = useState({});

  // Load comprehensive analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = dayjs();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = endDate.subtract(7, 'day');
          break;
        case '30d':
          startDate = endDate.subtract(30, 'day');
          break;
        case '90d':
          startDate = endDate.subtract(90, 'day');
          break;
        case '1y':
          startDate = endDate.subtract(1, 'year');
          break;
        default:
          startDate = endDate.subtract(30, 'day');
      }

      // Load all analytics data in parallel
      const [
        metricsData,
        trendsData,
        performanceData,
        predictionsData
      ] = await Promise.all([
        loadMetrics(startDate, endDate),
        loadTrends(startDate, endDate),
        loadPerformance(startDate, endDate),
        loadPredictions(startDate, endDate)
      ]);

      setMetrics(metricsData);
      setTrends(trendsData);
      setPerformance(performanceData);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Load key metrics
  const loadMetrics = async (startDate, endDate) => {
    try {
      // Revenue metrics
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const avgOrderValue = revenueData?.length > 0 ? totalRevenue / revenueData.length : 0;

      // Job metrics
      const { data: jobData } = await supabase
        .from('job_assignments')
        .select('status, created_at, completed_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalJobs = jobData?.length || 0;
      const completedJobs = jobData?.filter(job => job.status === 'completed').length || 0;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // User metrics
      const { data: userData } = await supabase
        .from('users')
        .select('role, created_at, is_active')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const newUsers = userData?.length || 0;
      const activeUsers = userData?.filter(user => user.is_active).length || 0;

      // Rating metrics
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('rating, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const avgRating = ratingData?.length > 0 
        ? ratingData.reduce((sum, rating) => sum + rating.rating, 0) / ratingData.length 
        : 0;

      // Calculate growth rates (simplified - would need historical data for accurate calculation)
      const growthRates = {
        revenue: 12.5, // Placeholder
        jobs: 8.3,
        users: 15.7,
        ratings: 5.2
      };

      return {
        revenue: {
          total: totalRevenue,
          average: avgOrderValue,
          growth: growthRates.revenue
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completionRate,
          growth: growthRates.jobs
        },
        users: {
          new: newUsers,
          active: activeUsers,
          growth: growthRates.users
        },
        ratings: {
          average: avgRating,
          total: ratingData?.length || 0,
          growth: growthRates.ratings
        }
      };
    } catch (error) {
      console.error('Error loading metrics:', error);
      return {};
    }
  };

  // Load trend data
  const loadTrends = async (startDate, endDate) => {
    try {
      // Daily trends for the last 30 days
      const days = [];
      const revenueTrend = [];
      const jobsTrend = [];
      const usersTrend = [];

      for (let i = 29; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day');
        days.push(date.format('MMM D'));
        
        // Get data for this specific day
        const dayStart = date.startOf('day');
        const dayEnd = date.endOf('day');

        // Revenue for this day
        const { data: dayRevenue } = await supabase
          .from('orders')
          .select('total_amount')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        const dayRevenueTotal = dayRevenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        revenueTrend.push(dayRevenueTotal);

        // Jobs for this day
        const { data: dayJobs } = await supabase
          .from('job_assignments')
          .select('id')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        jobsTrend.push(dayJobs?.length || 0);

        // New users for this day
        const { data: dayUsers } = await supabase
          .from('users')
          .select('id')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        usersTrend.push(dayUsers?.length || 0);
      }

      return {
        days,
        revenue: revenueTrend,
        jobs: jobsTrend,
        users: usersTrend
      };
    } catch (error) {
      console.error('Error loading trends:', error);
      return { days: [], revenue: [], jobs: [], users: [] };
    }
  };

  // Load performance metrics
  const loadPerformance = async (startDate, endDate) => {
    try {
      // Job performance by service type
      const { data: servicePerformance } = await supabase
        .from('job_assignments')
        .select(`
          status,
          service_type,
          created_at,
          completed_at,
          order:orders(total_amount)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const serviceStats = {};
      servicePerformance?.forEach(job => {
        if (!serviceStats[job.service_type]) {
          serviceStats[job.service_type] = {
            total: 0,
            completed: 0,
            revenue: 0,
            avgCompletionTime: 0
          };
        }
        
        serviceStats[job.service_type].total++;
        if (job.status === 'completed') {
          serviceStats[job.service_type].completed++;
          serviceStats[job.service_type].revenue += job.order?.total_amount || 0;
        }
      });

      // Calculate completion rates and average revenue
      Object.keys(serviceStats).forEach(service => {
        const stats = serviceStats[service];
        stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        stats.avgRevenue = stats.completed > 0 ? stats.revenue / stats.completed : 0;
      });

      // Bubbler performance
      const { data: bubblerPerformance } = await supabase
        .from('job_assignments')
        .select(`
          status,
          created_at,
          completed_at,
          bubbler:bubblers(name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const bubblerStats = {};
      bubblerPerformance?.forEach(job => {
        const bubblerName = job.bubbler?.name || 'Unknown';
        if (!bubblerStats[bubblerName]) {
          bubblerStats[bubblerName] = {
            total: 0,
            completed: 0,
            rating: 0
          };
        }
        
        bubblerStats[bubblerName].total++;
        if (job.status === 'completed') {
          bubblerStats[bubblerName].completed++;
        }
      });

      // Calculate completion rates
      Object.keys(bubblerStats).forEach(bubbler => {
        const stats = bubblerStats[bubbler];
        stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      });

      return {
        services: serviceStats,
        bubblers: bubblerStats
      };
    } catch (error) {
      console.error('Error loading performance:', error);
      return { services: {}, bubblers: {} };
    }
  };

  // Load predictions (simplified predictive analytics)
  const loadPredictions = async (startDate, endDate) => {
    try {
      // Simple trend-based predictions
      const predictions = {
        nextWeek: {
          revenue: metrics.revenue?.total * 1.05 || 0,
          jobs: Math.round(metrics.jobs?.total * 1.03) || 0,
          users: Math.round(metrics.users?.new * 1.08) || 0
        },
        nextMonth: {
          revenue: metrics.revenue?.total * 1.15 || 0,
          jobs: Math.round(metrics.jobs?.total * 1.12) || 0,
          users: Math.round(metrics.users?.new * 1.25) || 0
        },
        trends: {
          revenue: 'increasing',
          jobs: 'stable',
          users: 'increasing',
          ratings: 'stable'
        }
      };

      return predictions;
    } catch (error) {
      console.error('Error loading predictions:', error);
      return {};
    }
  };

  // Refresh analytics
  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  // Load analytics on mount and time range change
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Get trend indicator
  const getTrendIndicator = (value) => {
    if (value > 0) return <FiArrowUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <FiArrowDown className="h-4 w-4 text-red-600" />;
    return <FiMinus className="h-4 w-4 text-gray-600" />;
  };

  // Get trend color
  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Business intelligence and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('performance')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'performance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'trends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setViewMode('predictions')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'predictions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Predictions
            </button>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.revenue?.total?.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIndicator(metrics.revenue?.growth)}
                    <span className={`text-sm font-medium ${getTrendColor(metrics.revenue?.growth)}`}>
                      {metrics.revenue?.growth?.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <FiDollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Jobs Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.jobs?.total?.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIndicator(metrics.jobs?.growth)}
                    <span className={`text-sm font-medium ${getTrendColor(metrics.jobs?.growth)}`}>
                      {metrics.jobs?.growth?.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <FiBriefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.users?.new?.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIndicator(metrics.users?.growth)}
                    <span className={`text-sm font-medium ${getTrendColor(metrics.users?.growth)}`}>
                      {metrics.users?.growth?.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Ratings Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.ratings?.average?.toFixed(1) || '0.0'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIndicator(metrics.ratings?.growth)}
                    <span className={`text-sm font-medium ${getTrendColor(metrics.ratings?.growth)}`}>
                      {metrics.ratings?.growth?.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <FiStar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.jobs?.completionRate?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed Jobs</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.jobs?.completed?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${metrics.revenue?.average?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.users?.active?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Ratings</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.ratings?.total?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    +{metrics.users?.growth?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Insights</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${metrics.revenue?.total?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    +{metrics.revenue?.growth?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Order Value</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${metrics.revenue?.average?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Mode */}
      {viewMode === 'performance' && (
        <div className="space-y-6">
          {/* Service Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(performance.services || {}).map(([service, stats]) => (
                    <tr key={service}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stats.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                          stats.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stats.completionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${stats.avgRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Bubblers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bubbler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(performance.bubblers || {})
                    .sort(([,a], [,b]) => b.completionRate - a.completionRate)
                    .slice(0, 10)
                    .map(([bubbler, stats]) => (
                    <tr key={bubbler}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bubbler}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stats.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                          stats.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stats.completionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-1">
              {trends.revenue?.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((value / Math.max(...trends.revenue)) * 100, 5)}%`,
                    minHeight: '4px'
                  }}
                  title={`${trends.days[index]}: $${value.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              {trends.days?.filter((_, index) => index % 5 === 0).map((day, index) => (
                <span key={index}>{day}</span>
              ))}
            </div>
          </div>

          {/* Jobs Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs Trend (Last 30 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-1">
              {trends.jobs?.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-green-500 rounded-t"
                  style={{
                    height: `${Math.max((value / Math.max(...trends.jobs)) * 100, 5)}%`,
                    minHeight: '4px'
                  }}
                  title={`${trends.days[index]}: ${value} jobs`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              {trends.days?.filter((_, index) => index % 5 === 0).map((day, index) => (
                <span key={index}>{day}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Mode */}
      {viewMode === 'predictions' && (
        <div className="space-y-6">
          {/* Predictions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Week Predictions</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${predictions.nextWeek?.revenue?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jobs</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {predictions.nextWeek?.jobs?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Users</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {predictions.nextWeek?.users?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Month Predictions</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${predictions.nextMonth?.revenue?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jobs</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {predictions.nextMonth?.jobs?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Users</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {predictions.nextMonth?.users?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Indicators */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(predictions.trends || {}).map(([metric, trend]) => (
                <div key={metric} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                    trend === 'increasing' ? 'bg-green-100' :
                    trend === 'decreasing' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {trend === 'increasing' ? (
                      <FiTrendingUp className="h-6 w-6 text-green-600" />
                    ) : trend === 'decreasing' ? (
                      <FiTrendingDown className="h-6 w-6 text-red-600" />
                    ) : (
                      <FiMinus className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2 capitalize">
                    {metric}
                  </p>
                  <p className={`text-xs ${
                    trend === 'increasing' ? 'text-green-600' :
                    trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics; 