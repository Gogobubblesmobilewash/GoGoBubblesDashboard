import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Star, 
  DollarSign, 
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Award,
  AlertTriangle
} from 'lucide-react';

const CustomerAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [segments, setSegments] = useState([]);

  // Mock data for customer analytics
  const mockCustomerData = {
    totalCustomers: 2847,
    newCustomers: 156,
    churnedCustomers: 23,
    activeCustomers: 2156,
    avgCustomerValue: 245.67,
    customerSatisfaction: 4.8,
    retentionRate: 92.3,
    acquisitionCost: 45.20
  };

  const mockCustomerInsights = [
    {
      id: 1,
      type: 'opportunity',
      title: 'High-Value Customer Segment',
      description: 'Premium customers (top 20%) generate 65% of revenue',
      impact: 'high',
      confidence: 94,
      action: 'Develop premium service tier',
      metric: 'revenue',
      segment: 'premium'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Customer Churn Risk',
      description: '23 customers haven\'t booked in 60+ days',
      impact: 'high',
      confidence: 87,
      action: 'Launch re-engagement campaign',
      metric: 'retention',
      segment: 'at_risk'
    },
    {
      id: 3,
      type: 'trend',
      title: 'Seasonal Booking Patterns',
      description: 'Weekend bookings show 40% higher average order value',
      impact: 'medium',
      confidence: 89,
      action: 'Optimize weekend capacity',
      metric: 'aov',
      segment: 'weekend'
    },
    {
      id: 4,
      type: 'optimization',
      title: 'Geographic Expansion Opportunity',
      description: 'North region shows 35% higher customer acquisition rate',
      impact: 'medium',
      confidence: 82,
      action: 'Increase marketing in North region',
      metric: 'acquisition',
      segment: 'north_region'
    }
  ];

  const mockSegments = [
    {
      id: 1,
      name: 'Premium Customers',
      count: 569,
      avgValue: 485.30,
      retentionRate: 96.8,
      satisfaction: 4.9,
      characteristics: ['High frequency', 'Large orders', 'Weekend bookings']
    },
    {
      id: 2,
      name: 'Regular Customers',
      count: 1247,
      avgValue: 198.45,
      retentionRate: 91.2,
      satisfaction: 4.7,
      characteristics: ['Monthly bookings', 'Standard services', 'Weekday preference']
    },
    {
      id: 3,
      name: 'Occasional Customers',
      count: 1031,
      avgValue: 89.20,
      retentionRate: 78.5,
      satisfaction: 4.3,
      characteristics: ['Quarterly bookings', 'Basic services', 'Price sensitive']
    }
  ];

  const mockCustomerBehavior = [
    {
      metric: 'Booking Frequency',
      value: '2.3',
      unit: 'times/month',
      change: 12.5,
      trend: 'up'
    },
    {
      metric: 'Average Order Value',
      value: '$245.67',
      change: 8.3,
      trend: 'up'
    },
    {
      metric: 'Customer Lifetime Value',
      value: '$1,847',
      change: 15.7,
      trend: 'up'
    },
    {
      metric: 'Time to First Booking',
      value: '3.2',
      unit: 'days',
      change: -5.2,
      trend: 'down'
    }
  ];

  useEffect(() => {
    setCustomerInsights(mockCustomerInsights);
    setSegments(mockSegments);
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
            Customer Analytics
          </h1>
          <p className="text-gray-600">
            Deep insights into customer behavior, segments, and business intelligence
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
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Segments</option>
              <option value="premium">Premium</option>
              <option value="regular">Regular</option>
              <option value="occasional">Occasional</option>
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
                { id: 'segments', name: 'Customer Segments', icon: Users },
                { id: 'behavior', name: 'Behavior Analysis', icon: Activity },
                { id: 'insights', name: 'AI Insights', icon: Target },
                { id: 'trends', name: 'Trends', icon: LineChart }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveTab(view.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === view.id
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

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">Total Customers</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(mockCustomerData.totalCustomers)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">+12.5%</span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-500">New Customers</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(mockCustomerData.newCustomers)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">+8.3%</span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">Avg Customer Value</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mockCustomerData.avgCustomerValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">+15.7%</span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-500">Satisfaction</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {mockCustomerData.customerSatisfaction}/5.0
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">+0.2</span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
            </div>

            {/* Customer Behavior Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Behavior Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockCustomerBehavior.map((behavior, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{behavior.metric}</span>
                      {getTrendIcon(behavior.trend)}
                    </div>
                    <div className="mb-1">
                      <span className="text-xl font-bold text-gray-900">
                        {behavior.value}
                        {behavior.unit && <span className="text-sm text-gray-500 ml-1">{behavior.unit}</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        behavior.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {behavior.change >= 0 ? '+' : ''}{behavior.change}%
                      </span>
                      <span className="text-xs text-gray-500">vs last month</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerInsights.slice(0, 3).map((insight) => (
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

        {activeTab === 'segments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Segments</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {segments.map((segment) => (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{segment.name}</h4>
                      <span className="text-sm text-gray-500">{segment.count} customers</span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Avg Value:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(segment.avgValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Retention Rate:</span>
                        <span className="font-medium text-gray-900">{segment.retentionRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Satisfaction:</span>
                        <span className="font-medium text-gray-900">{segment.satisfaction}/5.0</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Characteristics:</h5>
                      <div className="flex flex-wrap gap-1">
                        {segment.characteristics.map((char, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Behavior Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Booking Patterns</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Booking pattern chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Service Preferences</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Service preference chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered Customer Insights</h3>
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
                {customerInsights.map((insight) => (
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
                            <span className="text-gray-500">Segment: {insight.segment}</span>
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

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Trends</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Customer Growth Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Customer growth chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Revenue per Customer</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Revenue per customer chart</p>
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

export default CustomerAnalytics; 