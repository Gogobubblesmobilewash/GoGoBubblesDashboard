import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp as TrendingUp, 
  FiTrendingDown as TrendingDown, 
  FiBarChart2 as BarChart3, 
  FiPieChart as PieChart, 
  FiActivity as LineChart,
  FiActivity as Activity,
  FiTarget as Target,
  FiAlertTriangle as AlertTriangle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiDollarSign as DollarSign,
  FiUsers as Users,
  FiClock as Clock,
  FiStar as Star,
  FiMapPin as MapPin,
  FiCalendar as Calendar,
  FiFilter as Filter,
  FiDownload as Download,
  FiRefreshCw as RefreshCw,
  FiEye as Eye,
  FiSettings as Settings,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiArrowUpRight as ArrowUpRight,
  FiArrowDownRight as ArrowDownRight
} from 'react-icons/fi';

const BusinessIntelligence = () => {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);

  // Mock data for BI dashboard
  const mockMetrics = {
    revenue: {
      current: 125000,
      previous: 108000,
      change: 15.7,
      trend: 'up',
      forecast: 142000
    },
    orders: {
      current: 1247,
      previous: 1156,
      change: 7.9,
      trend: 'up',
      forecast: 1380
    },
    customers: {
      current: 892,
      previous: 823,
      change: 8.4,
      trend: 'up',
      forecast: 945
    },
    satisfaction: {
      current: 4.8,
      previous: 4.6,
      change: 4.3,
      trend: 'up',
      forecast: 4.9
    }
  };

  const mockInsights = [
    {
      id: 1,
      type: 'opportunity',
      title: 'Revenue Growth Opportunity',
      description: 'Weekend bookings show 25% higher revenue per order',
      impact: 'high',
      confidence: 92,
      action: 'Increase weekend marketing spend',
      metric: 'revenue'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Customer Churn Risk',
      description: '12 customers haven\'t booked in 45+ days',
      impact: 'high',
      confidence: 88,
      action: 'Send re-engagement campaign',
      metric: 'customers'
    },
    {
      id: 3,
      type: 'trend',
      title: 'Service Area Expansion',
      description: 'North region shows 40% growth potential',
      impact: 'medium',
      confidence: 85,
      action: 'Consider expanding to North region',
      metric: 'orders'
    },
    {
      id: 4,
      type: 'optimization',
      title: 'Peak Hour Optimization',
      description: '2-4 PM shows highest demand but lowest availability',
      impact: 'medium',
      confidence: 78,
      action: 'Increase capacity during peak hours',
      metric: 'orders'
    }
  ];

  const mockPredictions = [
    {
      metric: 'revenue',
      period: 'next_30_days',
      value: 142000,
      confidence: 92,
      factors: ['seasonal trends', 'marketing campaigns', 'customer growth']
    },
    {
      metric: 'orders',
      period: 'next_30_days',
      value: 1380,
      confidence: 89,
      factors: ['demand patterns', 'capacity planning', 'market conditions']
    },
    {
      metric: 'customers',
      period: 'next_30_days',
      value: 945,
      confidence: 85,
      factors: ['acquisition rate', 'retention rate', 'referral growth']
    }
  ];

  useEffect(() => {
    setInsights(mockInsights);
    setPredictions(mockPredictions);
  }, []);

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'opportunity': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'optimization': return <Settings className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Intelligence
          </h1>
          <p className="text-gray-600">
            Advanced analytics, predictive insights, and actionable business intelligence
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="customers">Customers</option>
              <option value="satisfaction">Satisfaction</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLoading(true)}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </button>
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'insights', name: 'AI Insights', icon: Activity },
                { id: 'predictions', name: 'Predictions', icon: Target },
                { id: 'trends', name: 'Trends', icon: LineChart },
                { id: 'segments', name: 'Segments', icon: PieChart }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  <span>{view.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(mockMetrics).map(([key, metric]) => (
                <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {key === 'revenue' && <DollarSign className="w-5 h-5 text-green-600" />}
                      {key === 'orders' && <BarChart3 className="w-5 h-5 text-blue-600" />}
                      {key === 'customers' && <Users className="w-5 h-5 text-purple-600" />}
                      {key === 'satisfaction' && <Star className="w-5 h-5 text-yellow-600" />}
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {key === 'revenue' ? 'Revenue' : key}
                      </span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {key === 'revenue' ? formatCurrency(metric.current) :
                       key === 'satisfaction' ? metric.current.toFixed(1) :
                       formatNumber(metric.current)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-xs text-gray-500">vs previous period</span>
                  </div>
                  
                  {key === 'revenue' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Forecast (30d):</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(metric.forecast)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3 mb-3">
                      {getTypeIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>All Types</option>
                    <option>Opportunities</option>
                    <option>Alerts</option>
                    <option>Trends</option>
                    <option>Optimizations</option>
                  </select>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>All Impact</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">Confidence: {insight.confidence}%</span>
                            <span className="text-gray-500">Metric: {insight.metric}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            {insight.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Predictive Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">30-Day Forecasts</h4>
                  {predictions.map((prediction) => (
                    <div key={prediction.metric} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 capitalize">
                          {prediction.metric === 'revenue' ? 'Revenue' : prediction.metric}
                        </span>
                        <span className="text-sm text-gray-500">{prediction.confidence}% confidence</span>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {prediction.metric === 'revenue' ? formatCurrency(prediction.value) :
                           prediction.metric === 'satisfaction' ? prediction.value.toFixed(1) :
                           formatNumber(prediction.value)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Key factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.factors.map((factor, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Trend Analysis</h4>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Seasonal Patterns</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Revenue typically increases by 15-20% during summer months
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Peak season:</span>
                        <span className="font-medium">June - August</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Growth Trajectory</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Current growth rate suggests 25% annual increase
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Projected annual growth:</span>
                        <span className="font-medium text-green-600">+25%</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Market Opportunities</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Untapped market potential in adjacent service areas
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Market expansion potential:</span>
                        <span className="font-medium text-blue-600">+40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Trend Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Revenue Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Revenue trend chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Order Volume Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Order volume chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'segments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Segments</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Revenue by Segment</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Revenue segmentation chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Customer Distribution</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Customer distribution chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessIntelligence; 