import React, { useState, useEffect } from 'react';
import { 
  FiUsers as Users, 
  FiHeart as Heart, 
  FiAward as Award, 
  FiGift as Gift, 
  FiCalendar as Calendar,
  FiTrendingUp as TrendingUp,
  FiBarChart2 as BarChart3,
  FiPlus as Plus,
  FiEdit as Edit,
  FiEye as Eye,
  FiSettings as Settings,
  FiRefreshCw as RefreshCw,
  FiDownload as Download,
  FiStar as Star,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertTriangle as AlertTriangle,
  FiTarget as Target,
  FiActivity as Activity,
  FiMessageCircle as MessageCircle,
  FiBell as Bell,
  FiAward as Trophy,
  FiZap as Zap,
  FiPause as Pause,
  FiPlay as Play,
  FiSearch as Search
} from 'react-icons/fi';

const BubblerMorale = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [moralePrograms, setMoralePrograms] = useState([]);
  const [bubblerEngagement, setBubblerEngagement] = useState([]);
  const [retentionMetrics, setRetentionMetrics] = useState({});
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(new Set());

  // Mock data for morale programs
  const mockMoralePrograms = [
    {
      id: 1,
      name: 'Performance Excellence Awards',
      description: 'Monthly recognition program for top-performing bubblers',
      type: 'recognition',
      status: 'active',
      frequency: 'monthly',
      participants: 45,
      budget: 500.00,
      lastRun: '2024-01-01T00:00:00Z',
      nextRun: '2024-02-01T00:00:00Z',
      criteria: ['High ratings', 'On-time completion', 'Customer satisfaction'],
      rewards: ['Cash bonus', 'Recognition certificate', 'Priority assignments'],
      successRate: 92.5
    },
    {
      id: 2,
      name: 'Milestone Celebrations',
      description: 'Celebrate bubblers reaching assignment milestones',
      type: 'celebration',
      status: 'active',
      frequency: 'weekly',
      participants: 28,
      budget: 200.00,
      lastRun: '2024-01-15T00:00:00Z',
      nextRun: '2024-01-22T00:00:00Z',
      criteria: ['10 assignments', '25 assignments', '50 assignments', '100 assignments'],
      rewards: ['Milestone badge', 'Gift card', 'Social media recognition'],
      successRate: 88.3
    },
    {
      id: 3,
      name: 'Wellness Check-ins',
      description: 'Regular check-ins to support bubbler well-being and engagement',
      type: 'support',
      status: 'active',
      frequency: 'bi-weekly',
      participants: 67,
      budget: 150.00,
      lastRun: '2024-01-10T00:00:00Z',
      nextRun: '2024-01-24T00:00:00Z',
      criteria: ['All active bubblers'],
      rewards: ['Wellness resources', 'Mental health support', 'Flexible scheduling'],
      successRate: 95.7
    },
    {
      id: 4,
      name: 'Skill Development Program',
      description: 'Training and development opportunities for bubblers',
      type: 'development',
      status: 'paused',
      frequency: 'monthly',
      participants: 23,
      budget: 300.00,
      lastRun: '2023-12-15T00:00:00Z',
      nextRun: '2024-02-15T00:00:00Z',
      criteria: ['Interest in advancement', 'Good performance record'],
      rewards: ['Training certification', 'Higher pay rates', 'Leadership opportunities'],
      successRate: 76.2
    }
  ];

  // Mock data for bubbler engagement
  const mockBubblerEngagement = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      engagementScore: 92,
      lastActive: '2024-01-16T14:30:00Z',
      programsParticipated: 3,
      totalAssignments: 47,
      avgRating: 4.8,
      moraleStatus: 'high',
      retentionRisk: 'low',
      preferredRewards: ['Cash bonuses', 'Recognition', 'Flexible hours']
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.c@email.com',
      engagementScore: 78,
      lastActive: '2024-01-16T13:45:00Z',
      programsParticipated: 2,
      totalAssignments: 52,
      avgRating: 4.7,
      moraleStatus: 'medium',
      retentionRisk: 'medium',
      preferredRewards: ['Training opportunities', 'Career advancement', 'Team events']
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      engagementScore: 85,
      lastActive: '2024-01-16T12:15:00Z',
      programsParticipated: 4,
      totalAssignments: 38,
      avgRating: 4.6,
      moraleStatus: 'high',
      retentionRisk: 'low',
      preferredRewards: ['Wellness support', 'Recognition', 'Flexible scheduling']
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.k@email.com',
      engagementScore: 65,
      lastActive: '2024-01-15T18:20:00Z',
      programsParticipated: 1,
      totalAssignments: 12,
      avgRating: 4.3,
      moraleStatus: 'low',
      retentionRisk: 'high',
      preferredRewards: ['Mentoring', 'Clear feedback', 'Support resources']
    }
  ];

  // Mock retention metrics
  const mockRetentionMetrics = {
    overallRetentionRate: 87.3,
    monthlyRetentionRate: 92.1,
    quarterlyRetentionRate: 85.7,
    annualRetentionRate: 78.9,
    averageTenure: 14.2,
    satisfactionScore: 4.6,
    engagementScore: 82.4,
    programParticipationRate: 73.8
  };

  useEffect(() => {
    setMoralePrograms(mockMoralePrograms);
    setBubblerEngagement(mockBubblerEngagement);
    setRetentionMetrics(mockRetentionMetrics);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      case 'completed': return <Award className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getMoraleColor = (morale) => {
    switch (morale) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const handleCreateProgram = () => {
    setIsCreatingProgram(true);
  };

  const handleToggleProgram = (programId) => {
    setMoralePrograms(moralePrograms.map(p => 
      p.id === programId ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p
    ));
  };

  const handleRunProgram = (programId) => {
    setIsLoading(true);
    // Simulate program execution
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
    }, 2000);
  };

  const filteredPrograms = moralePrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bubbler Morale & Retention
          </h1>
          <p className="text-gray-600">
            Manage morale programs, track engagement, and improve bubbler retention
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'programs', name: 'Morale Programs', icon: Heart },
                { id: 'engagement', name: 'Engagement Tracking', icon: Activity },
                { id: 'retention', name: 'Retention Analytics', icon: TrendingUp },
                { id: 'rewards', name: 'Rewards System', icon: Gift }
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
        {activeTab === 'programs' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search programs..."
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
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button
                onClick={handleCreateProgram}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Program</span>
              </button>
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {program.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {program.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                          {getStatusIcon(program.status)}
                          <span className="capitalize">{program.status}</span>
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {program.type} • {program.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="text-gray-900 font-medium">{program.participants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Budget:</span>
                      <span className="text-gray-900">{formatCurrency(program.budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="text-gray-900 font-medium">{program.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next Run:</span>
                      <span className="text-gray-900">{formatDate(program.nextRun)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria:</h4>
                    <div className="flex flex-wrap gap-1">
                      {program.criteria.map((criterion, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {criterion}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Rewards:</h4>
                    <div className="flex flex-wrap gap-1">
                      {program.rewards.map((reward, index) => (
                        <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRunProgram(program.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>Run Now</span>
                    </button>
                    <button
                      onClick={() => handleToggleProgram(program.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        program.status === 'active' 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {program.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => alert(`Settings for program: ${program.name}\nThis would open program configuration settings.`)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => alert(`View details for program: ${program.name}\nThis would show detailed program information and statistics.`)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Bubbler Engagement Tracking</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bubbler
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Morale Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retention Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Programs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockBubblerEngagement.map((bubbler) => (
                      <tr key={bubbler.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bubbler.name}</div>
                            <div className="text-sm text-gray-500">{bubbler.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${bubbler.engagementScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{bubbler.engagementScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoraleColor(bubbler.moraleStatus)}`}>
                            {bubbler.moraleStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(bubbler.retentionRisk)}`}>
                            {bubbler.retentionRisk}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bubbler.programsParticipated} programs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bubbler.lastActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => alert(`Send message to ${bubbler.name}\nThis would open a messaging interface.`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Send Message
                          </button>
                          <button 
                            onClick={() => alert(`Check-in with ${bubbler.name}\nThis would initiate a wellness check-in.`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Check-in
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Retention Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Overall Retention</h3>
                      <p className="text-2xl font-bold text-blue-600">{retentionMetrics.overallRetentionRate}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">All bubblers</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Monthly Retention</h3>
                      <p className="text-2xl font-bold text-green-600">{retentionMetrics.monthlyRetentionRate}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">This month</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Avg Tenure</h3>
                      <p className="text-2xl font-bold text-purple-600">{retentionMetrics.averageTenure} months</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Average time</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Satisfaction</h3>
                      <p className="text-2xl font-bold text-orange-600">{retentionMetrics.satisfactionScore}/5.0</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Overall score</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Retention Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Retention trend chart</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Engagement vs Retention</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Engagement correlation chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rewards System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-yellow-500 p-2 rounded-lg">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Awards</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Cash bonuses and recognition for exceptional performance
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Budget:</span>
                      <span className="font-medium">$500</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">12 bubblers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="font-medium">94%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Milestone Rewards</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Recognition and rewards for reaching assignment milestones
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Budget:</span>
                      <span className="font-medium">$200</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">8 bubblers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="font-medium">88%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Wellness Support</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Mental health and wellness resources for all bubblers
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Budget:</span>
                      <span className="font-medium">$150</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">All bubblers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="font-medium">96%</span>
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

export default BubblerMorale; 