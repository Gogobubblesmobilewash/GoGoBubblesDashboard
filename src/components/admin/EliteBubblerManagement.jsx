import React, { useState, useEffect } from 'react';
import { 
  FiUsers as Users, 
  FiStar as Star, 
  FiAward as Award, 
  FiCheckCircle as CheckCircle, 
  FiXCircle as XCircle, 
  FiClock as Clock,
  FiFilter as Filter,
  FiSearch as Search,
  FiPlus as Plus,
  FiEdit as Edit,
  FiEye as Eye,
  FiSettings as Settings,
  FiRefreshCw as RefreshCw,
  FiDownload as Download,
  FiAlertTriangle as AlertTriangle,
  FiTrendingUp as TrendingUp,
  FiUserCheck as UserCheck,
  FiUserX as UserX,
  FiCalendar as Calendar,
  FiMapPin as MapPin,
  FiDollarSign as DollarSign,
  FiActivity as Activity,
  FiBarChart2 as BarChart3
} from 'react-icons/fi';

const EliteBubblerManagement = () => {
  const [activeTab, setActiveTab] = useState('elite');
  const [eliteBubblers, setEliteBubblers] = useState([]);
  const [eligibleBubblers, setEligibleBubblers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for elite bubblers
  const mockEliteBubblers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      eliteSince: '2024-01-01',
      totalAssignments: 47,
      avgRating: 4.8,
      permissions: ['home_cleaning', 'laundry', 'car_wash'],
      currentAssignments: 2,
      monthlyEarnings: 2847.50,
      splitOrderEligible: true,
      lastActive: '2024-01-16T14:30:00Z'
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.c@email.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      eliteSince: '2023-12-15',
      totalAssignments: 52,
      avgRating: 4.7,
      permissions: ['home_cleaning', 'laundry'],
      currentAssignments: 1,
      monthlyEarnings: 3120.75,
      splitOrderEligible: true,
      lastActive: '2024-01-16T13:45:00Z'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      phone: '+1 (555) 345-6789',
      status: 'active',
      eliteSince: '2024-01-10',
      totalAssignments: 38,
      avgRating: 4.6,
      permissions: ['car_wash', 'laundry'],
      currentAssignments: 0,
      monthlyEarnings: 2156.30,
      splitOrderEligible: true,
      lastActive: '2024-01-16T12:15:00Z'
    }
  ];

  // Mock data for eligible bubblers
  const mockEligibleBubblers = [
    {
      id: 4,
      name: 'David Kim',
      email: 'david.k@email.com',
      phone: '+1 (555) 456-7890',
      totalAssignments: 12,
      avgRating: 4.6,
      permissions: ['home_cleaning', 'laundry'],
      monthlyEarnings: 1456.80,
      eligibilityDate: '2024-01-15',
      notificationSent: true,
      applicationSubmitted: false
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      email: 'lisa.t@email.com',
      phone: '+1 (555) 567-8901',
      totalAssignments: 15,
      avgRating: 4.7,
      permissions: ['car_wash'],
      monthlyEarnings: 1678.45,
      eligibilityDate: '2024-01-14',
      notificationSent: true,
      applicationSubmitted: true
    },
    {
      id: 6,
      name: 'James Wilson',
      email: 'james.w@email.com',
      phone: '+1 (555) 678-9012',
      totalAssignments: 10,
      avgRating: 4.5,
      permissions: ['home_cleaning'],
      monthlyEarnings: 1234.60,
      eligibilityDate: '2024-01-16',
      notificationSent: false,
      applicationSubmitted: false
    }
  ];

  // Mock data for pending applications
  const mockPendingApplications = [
    {
      id: 1,
      bubblerId: 5,
      bubblerName: 'Lisa Thompson',
      applicationDate: '2024-01-15T10:30:00Z',
      totalAssignments: 15,
      avgRating: 4.7,
      permissions: ['car_wash'],
      reason: 'Excellent performance and customer satisfaction',
      status: 'pending_review'
    }
  ];

  useEffect(() => {
    setEliteBubblers(mockEliteBubblers);
    setEligibleBubblers(mockEligibleBubblers);
    setPendingApplications(mockPendingApplications);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending_review': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'pending_review': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSendEligibilityNotification = (bubblerId) => {
    setIsLoading(true);
    // Simulate notification sending
    setTimeout(() => {
      setEligibleBubblers(eligibleBubblers.map(b => 
        b.id === bubblerId ? { ...b, notificationSent: true } : b
      ));
      setIsLoading(false);
    }, 1000);
  };

  const handleApproveApplication = (applicationId) => {
    setIsLoading(true);
    // Simulate approval process
    setTimeout(() => {
      const application = pendingApplications.find(a => a.id === applicationId);
      const bubbler = eligibleBubblers.find(b => b.id === application.bubblerId);
      
      // Add to elite bubblers
      const newEliteBubbler = {
        ...bubbler,
        id: Date.now(),
        status: 'active',
        eliteSince: new Date().toISOString().split('T')[0],
        splitOrderEligible: true,
        lastActive: new Date().toISOString()
      };
      
      setEliteBubblers([...eliteBubblers, newEliteBubbler]);
      
      // Remove from pending applications
      setPendingApplications(pendingApplications.filter(a => a.id !== applicationId));
      
      setIsLoading(false);
    }, 1500);
  };

  const handleRejectApplication = (applicationId) => {
    setIsLoading(true);
    // Simulate rejection process
    setTimeout(() => {
      setPendingApplications(pendingApplications.filter(a => a.id !== applicationId));
      setIsLoading(false);
    }, 1000);
  };

  const filteredEliteBubblers = eliteBubblers.filter(bubbler => {
    const matchesSearch = bubbler.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bubbler.status === filterStatus;
    const matchesService = filterService === 'all' || bubbler.permissions.includes(filterService);
    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Elite Bubbler Management
          </h1>
          <p className="text-gray-600">
            Manage elite bubblers, eligibility criteria, and split order assignments
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'elite', name: 'Elite Bubblers', icon: Award },
                { id: 'eligible', name: 'Eligible Bubblers', icon: UserCheck },
                { id: 'applications', name: 'Pending Applications', icon: Clock },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 }
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
        {activeTab === 'elite' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search elite bubblers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  <option value="home_cleaning">Home Cleaning</option>
                  <option value="laundry">Laundry</option>
                  <option value="car_wash">Car Wash</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  const content = `Elite Bubbler Export\nGenerated: ${new Date().toLocaleString()}\n\n${filteredEliteBubblers.map(b => 
                    `${b.name} | ${b.email} | ${b.status} | ${b.totalAssignments} assignments | ${b.avgRating}/5.0 rating | ${formatCurrency(b.monthlyEarnings)}`
                  ).join('\n')}`;
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `elite_bubblers_${new Date().toISOString().split('T')[0]}.txt`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  alert('Elite bubblers exported successfully!');
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Elite Bubblers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEliteBubblers.map((bubbler) => (
                <div key={bubbler.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {bubbler.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {bubbler.email}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bubbler.status)}`}>
                          {getStatusIcon(bubbler.status)}
                          <span className="capitalize">{bubbler.status}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Elite since {formatDate(bubbler.eliteSince)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Assignments:</span>
                      <span className="text-gray-900 font-medium">{bubbler.totalAssignments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Average Rating:</span>
                      <span className="text-gray-900 font-medium">{bubbler.avgRating}/5.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Assignments:</span>
                      <span className="text-gray-900">{bubbler.currentAssignments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Earnings:</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(bubbler.monthlyEarnings)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {bubbler.permissions.map((permission, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`View details for ${bubbler.name}\nThis would show detailed bubbler information and performance metrics.`)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button 
                      onClick={() => alert(`Settings for ${bubbler.name}\nThis would open elite bubbler configuration settings.`)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'eligible' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Eligible Bubblers</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bubbler
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eligibility Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eligibleBubblers.map((bubbler) => (
                      <tr key={bubbler.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bubbler.name}</div>
                            <div className="text-sm text-gray-500">{bubbler.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bubbler.totalAssignments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bubbler.avgRating}/5.0
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {bubbler.permissions.map((permission, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {permission.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bubbler.eligibilityDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {bubbler.notificationSent ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="text-sm text-gray-900">
                              {bubbler.notificationSent ? 'Notified' : 'Pending Notification'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!bubbler.notificationSent && (
                            <button
                              onClick={() => handleSendEligibilityNotification(bubbler.id)}
                              disabled={isLoading}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              Send Notification
                            </button>
                          )}
                          {bubbler.applicationSubmitted && (
                            <span className="text-green-600">Application Submitted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Pending Applications</h3>
              
              {pendingApplications.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{application.bubblerName}</h4>
                          <p className="text-sm text-gray-500">Application submitted {formatDate(application.applicationDate)}</p>
                        </div>
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">Total Assignments:</span>
                          <p className="font-medium">{application.totalAssignments}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Average Rating:</span>
                          <p className="font-medium">{application.avgRating}/5.0</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Permissions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {application.permissions.map((permission, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {permission.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-sm text-gray-500">Reason for Application:</span>
                        <p className="text-sm text-gray-900 mt-1">{application.reason}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveApplication(application.id)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectApplication(application.id)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Elite Bubbler Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Total Elite Bubblers</h3>
                      <p className="text-2xl font-bold text-blue-600">{eliteBubblers.length}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Active elite bubblers</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Eligible Bubblers</h3>
                      <p className="text-2xl font-bold text-green-600">{eligibleBubblers.length}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Meet criteria</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-yellow-600 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pending Applications</h3>
                      <p className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Awaiting review</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Avg Elite Rating</h3>
                      <p className="text-2xl font-bold text-purple-600">4.7</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Overall average</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Elite Bubbler Performance</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Split Order Assignments</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Assignment chart</p>
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

export default EliteBubblerManagement; 