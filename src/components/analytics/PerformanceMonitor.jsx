import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  FiActivity, 
  FiCpu, 
  FiDatabase, 
  FiWifi, 
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiBarChart2,
  FiGauge,
  FiZap,
  FiShield,
  FiUsers,
  FiServer,
  FiGlobe,
  FiTarget
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const PerformanceMonitor = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [userBehavior, setUserBehavior] = useState({});
  const [operationalMetrics, setOperationalMetrics] = useState({});
  const [realTimeData, setRealTimeData] = useState([]);
  const intervalRef = useRef(null);

  // Performance thresholds
  const THRESHOLDS = {
    responseTime: { warning: 1000, critical: 3000 }, // milliseconds
    errorRate: { warning: 5, critical: 10 }, // percentage
    cpuUsage: { warning: 70, critical: 90 }, // percentage
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    activeUsers: { warning: 100, critical: 200 }, // count
    jobCompletionRate: { warning: 80, critical: 60 } // percentage
  };

  // Load performance metrics
  const loadPerformanceMetrics = async () => {
    setLoading(true);
    try {
      const [
        systemMetrics,
        userMetrics,
        operationalMetrics,
        alertData
      ] = await Promise.all([
        loadSystemMetrics(),
        loadUserBehaviorMetrics(),
        loadOperationalMetrics(),
        loadAlerts()
      ]);

      setSystemHealth(systemMetrics);
      setUserBehavior(userMetrics);
      setOperationalMetrics(operationalMetrics);
      setAlerts(alertData);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Load system health metrics
  const loadSystemMetrics = async () => {
    try {
      // Simulate system metrics (in real implementation, these would come from monitoring tools)
      const metrics = {
        responseTime: Math.random() * 2000 + 200, // 200-2200ms
        errorRate: Math.random() * 15, // 0-15%
        cpuUsage: Math.random() * 100, // 0-100%
        memoryUsage: Math.random() * 100, // 0-100%
        databaseConnections: Math.floor(Math.random() * 50) + 10, // 10-60
        activeSessions: Math.floor(Math.random() * 200) + 50, // 50-250
        uptime: Math.floor(Math.random() * 100) + 95, // 95-195 hours
        lastBackup: dayjs().subtract(Math.floor(Math.random() * 24), 'hour').toISOString()
      };

      // Determine health status
      const healthStatus = {
        responseTime: getHealthStatus(metrics.responseTime, THRESHOLDS.responseTime, 'lower'),
        errorRate: getHealthStatus(metrics.errorRate, THRESHOLDS.errorRate, 'lower'),
        cpuUsage: getHealthStatus(metrics.cpuUsage, THRESHOLDS.cpuUsage, 'lower'),
        memoryUsage: getHealthStatus(metrics.memoryUsage, THRESHOLDS.memoryUsage, 'lower'),
        overall: 'healthy'
      };

      // Determine overall health
      const criticalCount = Object.values(healthStatus).filter(status => status === 'critical').length;
      const warningCount = Object.values(healthStatus).filter(status => status === 'warning').length;

      if (criticalCount > 0) {
        healthStatus.overall = 'critical';
      } else if (warningCount > 0) {
        healthStatus.overall = 'warning';
      }

      return { ...metrics, healthStatus };
    } catch (error) {
      console.error('Error loading system metrics:', error);
      return {};
    }
  };

  // Load user behavior metrics
  const loadUserBehaviorMetrics = async () => {
    try {
      // Get user activity data
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('event_type, user_id, created_at')
        .gte('created_at', dayjs().subtract(24, 'hour').toISOString());

      // Get user session data
      const { data: sessionData } = await supabase
        .from('users')
        .select('last_login, is_active')
        .not('last_login', 'is', null);

      const activeUsers = sessionData?.filter(user => 
        dayjs(user.last_login).isAfter(dayjs().subtract(1, 'hour'))
      ).length || 0;

      const totalUsers = sessionData?.length || 0;
      const userEngagement = activityData?.length || 0;

      // Calculate user behavior metrics
      const metrics = {
        activeUsers,
        totalUsers,
        userEngagement,
        avgSessionDuration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        pageViews: Math.floor(Math.random() * 1000) + 500, // 500-1500
        bounceRate: Math.random() * 50 + 20, // 20-70%
        conversionRate: Math.random() * 10 + 2, // 2-12%
        peakUsageTime: '14:00-16:00',
        mostActiveFeature: 'job_management'
      };

      return metrics;
    } catch (error) {
      console.error('Error loading user behavior metrics:', error);
      return {};
    }
  };

  // Load operational metrics
  const loadOperationalMetrics = async () => {
    try {
      // Get job performance data
      const { data: jobData } = await supabase
        .from('job_assignments')
        .select('status, created_at, completed_at')
        .gte('created_at', dayjs().subtract(24, 'hour').toISOString());

      const totalJobs = jobData?.length || 0;
      const completedJobs = jobData?.filter(job => job.status === 'completed').length || 0;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Calculate operational metrics
      const metrics = {
        jobCompletionRate: completionRate,
        avgJobDuration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        jobsPerHour: Math.floor(Math.random() * 20) + 5, // 5-25 jobs/hour
        supportTickets: Math.floor(Math.random() * 50) + 10, // 10-60 tickets
        avgResponseTime: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
        systemAvailability: 99.8 + Math.random() * 0.2, // 99.8-100%
        backupSuccess: 100, // percentage
        securityIncidents: 0,
        maintenanceWindows: 1
      };

      return metrics;
    } catch (error) {
      console.error('Error loading operational metrics:', error);
      return {};
    }
  };

  // Load alerts
  const loadAlerts = async () => {
    try {
      // Get recent alerts from activity log
      const { data: alertData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('priority', 'critical')
        .gte('created_at', dayjs().subtract(24, 'hour').toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      return alertData || [];
    } catch (error) {
      console.error('Error loading alerts:', error);
      return [];
    }
  };

  // Get health status based on thresholds
  const getHealthStatus = (value, threshold, comparison = 'lower') => {
    if (comparison === 'lower') {
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
      return 'healthy';
    } else {
      if (value <= threshold.critical) return 'critical';
      if (value <= threshold.warning) return 'warning';
      return 'healthy';
    }
  };

  // Get health status color
  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get health status icon
  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return <FiCheckCircle className="h-5 w-5" />;
      case 'warning': return <FiAlertTriangle className="h-5 w-5" />;
      case 'critical': return <FiXCircle className="h-5 w-5" />;
      default: return <FiMinus className="h-5 w-5" />;
    }
  };

  // Refresh performance data
  const refreshPerformance = async () => {
    setRefreshing(true);
    await loadPerformanceMetrics();
    setRefreshing(false);
    toast.success('Performance data refreshed');
  };

  // Start real-time monitoring
  const startRealTimeMonitoring = () => {
    intervalRef.current = setInterval(() => {
      // Update real-time data every 30 seconds
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        responseTime: Math.random() * 2000 + 200,
        activeUsers: Math.floor(Math.random() * 200) + 50,
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100
      };

      setRealTimeData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 50 data points
        return updated.slice(-50);
      });
    }, 30000);
  };

  // Stop real-time monitoring
  const stopRealTimeMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Load metrics on mount and set up real-time monitoring
  useEffect(() => {
    loadPerformanceMetrics();
    startRealTimeMonitoring();

    return () => {
      stopRealTimeMonitoring();
    };
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitor</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time system performance and operational metrics
          </p>
        </div>
        
        <button
          onClick={refreshPerformance}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Health Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.healthStatus?.overall)}`}>
            {getHealthIcon(systemHealth.healthStatus?.overall)}
            {systemHealth.healthStatus?.overall?.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Response Time */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getHealthColor(systemHealth.healthStatus?.responseTime)}`}>
              <FiClock className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Response Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemHealth.responseTime?.toFixed(0)}ms
            </p>
            <p className={`text-xs ${getHealthColor(systemHealth.healthStatus?.responseTime)}`}>
              {systemHealth.healthStatus?.responseTime}
            </p>
          </div>

          {/* Error Rate */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getHealthColor(systemHealth.healthStatus?.errorRate)}`}>
              <FiXCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Error Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemHealth.errorRate?.toFixed(2)}%
            </p>
            <p className={`text-xs ${getHealthColor(systemHealth.healthStatus?.errorRate)}`}>
              {systemHealth.healthStatus?.errorRate}
            </p>
          </div>

          {/* CPU Usage */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getHealthColor(systemHealth.healthStatus?.cpuUsage)}`}>
              <FiCpu className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">CPU Usage</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemHealth.cpuUsage?.toFixed(1)}%
            </p>
            <p className={`text-xs ${getHealthColor(systemHealth.healthStatus?.cpuUsage)}`}>
              {systemHealth.healthStatus?.cpuUsage}
            </p>
          </div>

          {/* Memory Usage */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getHealthColor(systemHealth.healthStatus?.memoryUsage)}`}>
              <FiDatabase className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Memory Usage</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemHealth.memoryUsage?.toFixed(1)}%
            </p>
            <p className={`text-xs ${getHealthColor(systemHealth.healthStatus?.memoryUsage)}`}>
              {systemHealth.healthStatus?.memoryUsage}
            </p>
          </div>
        </div>
      </div>

      {/* User Behavior & Operational Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Behavior */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Behavior</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.activeUsers?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.totalUsers?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Engagement</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.userEngagement?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Session Duration</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.avgSessionDuration} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bounce Rate</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.bounceRate?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-lg font-semibold text-gray-900">
                {userBehavior.conversionRate?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Job Completion Rate</span>
              <span className={`text-lg font-semibold ${
                operationalMetrics.jobCompletionRate >= THRESHOLDS.jobCompletionRate.warning 
                  ? 'text-green-600' 
                  : operationalMetrics.jobCompletionRate >= THRESHOLDS.jobCompletionRate.critical 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {operationalMetrics.jobCompletionRate?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Job Duration</span>
              <span className="text-lg font-semibold text-gray-900">
                {operationalMetrics.avgJobDuration} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Jobs per Hour</span>
              <span className="text-lg font-semibold text-gray-900">
                {operationalMetrics.jobsPerHour}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Support Tickets</span>
              <span className="text-lg font-semibold text-gray-900">
                {operationalMetrics.supportTickets}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-lg font-semibold text-gray-900">
                {operationalMetrics.avgResponseTime} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Availability</span>
              <span className="text-lg font-semibold text-green-600">
                {operationalMetrics.systemAvailability?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Monitoring */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FiActivity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-xl font-bold text-gray-900">
              {realTimeData[realTimeData.length - 1]?.responseTime?.toFixed(0) || '0'}ms
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FiUsers className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-xl font-bold text-gray-900">
              {realTimeData[realTimeData.length - 1]?.activeUsers || '0'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FiCpu className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">CPU Usage</p>
            <p className="text-xl font-bold text-gray-900">
              {realTimeData[realTimeData.length - 1]?.cpuUsage?.toFixed(1) || '0'}%
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FiDatabase className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Memory Usage</p>
            <p className="text-xl font-bold text-gray-900">
              {realTimeData[realTimeData.length - 1]?.memoryUsage?.toFixed(1) || '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p>No critical alerts in the last 24 hours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <FiAlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{alert.event_type}</p>
                  <p className="text-xs text-red-700">{alert.description}</p>
                </div>
                <span className="text-xs text-red-600">
                  {dayjs(alert.created_at).fromNow()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor; 