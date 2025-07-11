import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Home, 
  Package, 
  Settings, 
  Plus, 
  Edit, 
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Shield,
  Calendar,
  Star
} from 'lucide-react';

const JobAssignmentCaps = () => {
  const [activeTab, setActiveTab] = useState('caps');
  const [assignmentCaps, setAssignmentCaps] = useState({});
  const [bubblerAssignments, setBubblerAssignments] = useState([]);
  const [dailyLimits, setDailyLimits] = useState({});
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [isEditingCaps, setIsEditingCaps] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Service type definitions with realistic caps
  const serviceTypes = {
    shine: {
      name: 'Shine Bubbler (Mobile Car Wash)',
      icon: Car,
      color: 'blue',
      tiers: {
        express_shine: {
          name: 'Express Shine',
          timeRange: '30-45 mins',
          maxPerDay: 8,
          recommended: 6,
          description: 'Quick exterior wash and basic interior cleaning'
        },
        signature_shine: {
          name: 'Signature Shine',
          timeRange: '60 mins',
          maxPerDay: 6,
          recommended: 4,
          description: 'Comprehensive exterior and interior cleaning'
        },
        supreme_shine: {
          name: 'Supreme Shine',
          timeRange: '90 mins',
          maxPerDay: 4,
          recommended: 3,
          description: 'Premium detailing with advanced treatments'
        }
      },
      defaultCap: 6,
      maxCap: 8
    },
    sparkle: {
      name: 'Sparkle Bubbler (Home Cleaning)',
      icon: Home,
      color: 'green',
      tiers: {
        refreshed_clean: {
          name: 'Refreshed Clean',
          timeRange: '1.5-2.5 hours',
          maxPerDay: 3,
          recommended: 2,
          description: 'Basic cleaning and tidying'
        },
        signature_deep_clean: {
          name: 'Signature Deep Clean',
          timeRange: '3-4.5+ hours',
          maxPerDay: 2,
          recommended: 1,
          description: 'Comprehensive deep cleaning service'
        }
      },
      defaultCap: 2,
      maxCap: 3
    },
    fresh: {
      name: 'Fresh Bubbler (Laundry)',
      icon: Package,
      color: 'purple',
      tiers: {
        standard_delivery: {
          name: 'Standard 24-36 Hour',
          timeRange: 'Pickup + Delivery',
          maxPerDay: 6,
          recommended: 5,
          description: 'Standard turnaround with efficient routing'
        },
        same_day_delivery: {
          name: 'Same-Day Delivery',
          timeRange: 'Same day turnaround',
          maxPerDay: 3,
          recommended: 2,
          description: 'Express service with tight turnaround'
        }
      },
      defaultCap: 5,
      maxCap: 6
    }
  };

  // Mock data for current assignment caps
  const mockAssignmentCaps = {
    shine: {
      express_shine: 6,
      signature_shine: 4,
      supreme_shine: 3,
      mixed_tiers: 5
    },
    sparkle: {
      refreshed_clean: 2,
      signature_deep_clean: 1,
      mixed_tiers: 2
    },
    fresh: {
      standard_delivery: 5,
      same_day_delivery: 2,
      mixed_types: 4
    }
  };

  // Mock data for bubbler assignments
  const mockBubblerAssignments = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      serviceType: 'shine',
      permissions: ['express_shine', 'signature_shine', 'supreme_shine'],
      currentAssignments: 3,
      dailyCap: 5,
      todayJobs: [
        { id: 1, tier: 'express_shine', time: '09:00', status: 'completed' },
        { id: 2, tier: 'signature_shine', time: '11:00', status: 'in_progress' },
        { id: 3, tier: 'supreme_shine', time: '14:00', status: 'scheduled' }
      ],
      weeklyAverage: 4.2,
      efficiency: 92,
      isElite: true
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.c@email.com',
      serviceType: 'sparkle',
      permissions: ['refreshed_clean', 'signature_deep_clean'],
      currentAssignments: 2,
      dailyCap: 2,
      todayJobs: [
        { id: 4, tier: 'refreshed_clean', time: '08:00', status: 'completed' },
        { id: 5, tier: 'signature_deep_clean', time: '12:00', status: 'in_progress' }
      ],
      weeklyAverage: 1.8,
      efficiency: 88,
      isElite: false
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      serviceType: 'fresh',
      permissions: ['standard_delivery', 'same_day_delivery'],
      currentAssignments: 4,
      dailyCap: 4,
      todayJobs: [
        { id: 6, tier: 'standard_delivery', time: '07:30', status: 'completed' },
        { id: 7, tier: 'same_day_delivery', time: '09:00', status: 'completed' },
        { id: 8, tier: 'standard_delivery', time: '11:30', status: 'in_progress' },
        { id: 9, tier: 'same_day_delivery', time: '14:00', status: 'scheduled' }
      ],
      weeklyAverage: 3.5,
      efficiency: 95,
      isElite: true
    }
  ];

  // Mock daily limits
  const mockDailyLimits = {
    totalJobs: 156,
    assignedJobs: 142,
    availableSlots: 14,
    overbookedBubblers: 2,
    efficiencyRate: 91.2,
    averageUtilization: 87.3
  };

  useEffect(() => {
    setAssignmentCaps(mockAssignmentCaps);
    setBubblerAssignments(mockBubblerAssignments);
    setDailyLimits(mockDailyLimits);
  }, []);

  const getServiceIcon = (serviceType) => {
    const Icon = serviceTypes[serviceType]?.icon || Users;
    return <Icon className="w-5 h-5" />;
  };

  const getServiceColor = (serviceType) => {
    return serviceTypes[serviceType]?.color || 'gray';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'overbooked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Activity className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'overbooked': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleUpdateCap = (serviceType, tier, newCap) => {
    setAssignmentCaps(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        [tier]: newCap
      }
    }));
  };

  const handleSaveCaps = () => {
    setIsLoading(true);
    // Simulate saving caps
    setTimeout(() => {
      setIsLoading(false);
      setIsEditingCaps(false);
      // Show success message
    }, 1000);
  };

  const filteredBubblers = bubblerAssignments.filter(bubbler => {
    const matchesSearch = bubbler.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = filterService === 'all' || bubbler.serviceType === filterService;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'overbooked' && bubbler.currentAssignments > bubbler.dailyCap) ||
      (filterStatus === 'available' && bubbler.currentAssignments < bubbler.dailyCap);
    return matchesSearch && matchesService && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Assignment Caps
          </h1>
          <p className="text-gray-600">
            Manage daily job assignment limits and optimize bubbler workload
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'caps', name: 'Assignment Caps', icon: Target },
                { id: 'bubblers', name: 'Bubbler Assignments', icon: Users },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 },
                { id: 'settings', name: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'caps' && (
          <div className="space-y-6">
            {/* Daily Limits Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Total Jobs</h3>
                    <p className="text-2xl font-bold text-blue-600">{dailyLimits.totalJobs}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Daily capacity</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Assigned Jobs</h3>
                    <p className="text-2xl font-bold text-green-600">{dailyLimits.assignedJobs}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Currently assigned</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-yellow-600 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Overbooked</h3>
                    <p className="text-2xl font-bold text-yellow-600">{dailyLimits.overbookedBubblers}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Bubblers over cap</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Efficiency</h3>
                    <p className="text-2xl font-bold text-purple-600">{dailyLimits.efficiencyRate}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Overall efficiency</p>
              </div>
            </div>

            {/* Service Type Caps */}
            <div className="space-y-6">
              {Object.entries(serviceTypes).map(([serviceKey, service]) => (
                <div key={serviceKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`bg-${service.color}-600 p-2 rounded-lg`}>
                        {getServiceIcon(serviceKey)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">Daily assignment limits by tier</p>
                      </div>
                    </div>
                    {isEditingCaps && (
                      <button
                        onClick={handleSaveCaps}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(service.tiers).map(([tierKey, tier]) => (
                      <div key={tierKey} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{tier.name}</h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tier.timeRange}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Current Cap:</span>
                            {isEditingCaps ? (
                              <input
                                type="number"
                                min="1"
                                max={tier.maxPerDay}
                                value={assignmentCaps[serviceKey]?.[tierKey] || tier.recommended}
                                onChange={(e) => handleUpdateCap(serviceKey, tierKey, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">
                                {assignmentCaps[serviceKey]?.[tierKey] || tier.recommended}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Recommended:</span>
                            <span className="text-gray-900">{tier.recommended}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Maximum:</span>
                            <span className="text-gray-900">{tier.maxPerDay}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mixed Tier Caps */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Mixed Tier Assignments</h4>
                        <p className="text-sm text-gray-600">When bubblers handle multiple tiers in one day</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Daily Cap:</span>
                        {isEditingCaps ? (
                          <input
                            type="number"
                            min="1"
                            max={service.maxCap}
                            value={assignmentCaps[serviceKey]?.mixed_tiers || service.defaultCap}
                            onChange={(e) => handleUpdateCap(serviceKey, 'mixed_tiers', parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {assignmentCaps[serviceKey]?.mixed_tiers || service.defaultCap}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Controls */}
            <div className="flex justify-end">
              {!isEditingCaps ? (
                <button
                  onClick={() => setIsEditingCaps(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Caps</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditingCaps(false)}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bubblers' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bubblers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  <option value="shine">Shine Bubbler</option>
                  <option value="sparkle">Sparkle Bubbler</option>
                  <option value="fresh">Fresh Bubbler</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="overbooked">Overbooked</option>
                </select>
              </div>
              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Bubbler Assignments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBubblers.map((bubbler) => (
                <div key={bubbler.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {bubbler.name}
                        </h3>
                        {bubbler.isElite && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Elite
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{bubbler.email}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getServiceIcon(bubbler.serviceType)}
                          <span className="text-sm text-gray-600 capitalize">
                            {bubbler.serviceType} Bubbler
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            bubbler.currentAssignments > bubbler.dailyCap 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {bubbler.currentAssignments}/{bubbler.dailyCap} jobs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Weekly Average:</span>
                      <span className="text-gray-900 font-medium">{bubbler.weeklyAverage} jobs/day</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Efficiency:</span>
                      <span className="text-gray-900 font-medium">{bubbler.efficiency}%</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Today's Jobs:</h4>
                    <div className="space-y-2">
                      {bubbler.todayJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{job.tier.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-500">{job.time}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignment Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Daily Utilization by Service</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Utilization chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Cap Efficiency Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Efficiency trends</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cap Management Settings</h3>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Automatic Cap Enforcement</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Prevent overbooking beyond daily caps</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Send alerts when bubblers approach their cap</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Allow manual override for urgent jobs</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Notify admins when caps are exceeded</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Send daily cap utilization reports</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Alert when efficiency drops below 80%</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Elite Bubbler Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Allow elite bubblers to exceed caps by 1-2 jobs</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Prioritize elite bubblers for split orders</span>
                    </label>
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

export default JobAssignmentCaps; 