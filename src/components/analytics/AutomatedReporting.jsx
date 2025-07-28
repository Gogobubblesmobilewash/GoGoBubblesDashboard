import React, { useState, useEffect } from 'react';
import { 
  FiCalendar as CalendarDays, 
  FiFileText as FileText, 
  FiBarChart2 as BarChart3, 
  FiTrendingUp as TrendingUp, 
  FiUsers as Users, 
  FiDollarSign as DollarSign,
  FiClock as Clock,
  FiMail as Mail,
  FiDownload as Download,
  FiSettings as Settings,
  FiPlus as Plus,
  FiEdit as Edit,
  FiTrash2 as Trash2,
  FiEye as Eye,
  FiFilter as Filter,
  FiSearch as Search,
  FiRefreshCw as RefreshCw,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle
} from 'react-icons/fi';

const AutomatedReporting = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for reports
  const mockReports = [
    {
      id: 1,
      name: 'Weekly Revenue Summary',
      type: 'revenue',
      frequency: 'weekly',
      lastRun: '2024-01-15T10:30:00Z',
      nextRun: '2024-01-22T10:30:00Z',
      status: 'active',
      recipients: ['admin@gogobubbles.com', 'finance@gogobubbles.com'],
      template: 'revenue_summary',
      format: 'pdf',
      lastStatus: 'success'
    },
    {
      id: 2,
      name: 'Monthly Performance Dashboard',
      type: 'performance',
      frequency: 'monthly',
      lastRun: '2024-01-01T09:00:00Z',
      nextRun: '2024-02-01T09:00:00Z',
      status: 'active',
      recipients: ['admin@gogobubbles.com'],
      template: 'performance_dashboard',
      format: 'excel',
      lastStatus: 'success'
    },
    {
      id: 3,
      name: 'Daily Operations Alert',
      type: 'operations',
      frequency: 'daily',
      lastRun: '2024-01-16T06:00:00Z',
      nextRun: '2024-01-17T06:00:00Z',
      status: 'paused',
      recipients: ['ops@gogobubbles.com'],
      template: 'operations_alert',
      format: 'email',
      lastStatus: 'failed'
    }
  ];

  // Mock data for templates
  const mockTemplates = [
    {
      id: 1,
      name: 'Revenue Summary',
      description: 'Comprehensive revenue analysis with trends and projections',
      category: 'financial',
      sections: ['revenue_overview', 'trends', 'projections', 'comparisons'],
      isDefault: true
    },
    {
      id: 2,
      name: 'Performance Dashboard',
      description: 'Key performance indicators and operational metrics',
      category: 'operational',
      sections: ['kpis', 'efficiency', 'quality', 'growth'],
      isDefault: true
    },
    {
      id: 3,
      name: 'Operations Alert',
      description: 'Daily operational status and critical alerts',
      category: 'operational',
      sections: ['status', 'alerts', 'issues', 'recommendations'],
      isDefault: false
    }
  ];

  useEffect(() => {
    setReports(mockReports);
    setTemplates(mockTemplates);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <AlertCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateReport = () => {
    // Show a modal or navigate to report creation form
    alert('Create Report functionality would open a report creation form here.');
    // In a real implementation, this would:
    // 1. Open a modal with report creation form
    // 2. Allow user to select template, schedule, recipients
    // 3. Save the new report to database
  };

  const handleEditTemplate = (template) => {
    // Show template editing modal
    alert(`Edit Template: ${template.name}\nThis would open a template editor with sections and formatting options.`);
    // In a real implementation, this would:
    // 1. Open a modal with template editor
    // 2. Allow editing of sections, formatting, data sources
    // 3. Save changes to database
  };

  const handleRunReport = (reportId) => {
    setIsLoading(true);
    // Simulate report generation
    setTimeout(() => {
      setIsLoading(false);
      alert(`Report ${reportId} has been generated successfully!\nCheck your email for the report.`);
      // In a real implementation, this would:
      // 1. Generate the report using the template
      // 2. Send to recipients via email
      // 3. Update the report status in database
    }, 2000);
  };

  const handleExportReport = (reportId, format) => {
    // Simulate export with actual download
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const content = `Report: ${report.name}\nGenerated: ${new Date().toLocaleString()}\nFormat: ${format}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      alert(`Report exported as ${format.toUpperCase()} file.`);
    }
  };

  const handleUseTemplate = (template) => {
    alert(`Use Template: ${template.name}\nThis would create a new report using this template.`);
    // In a real implementation, this would:
    // 1. Open report creation form with template pre-filled
    // 2. Allow user to customize settings
    // 3. Create new report based on template
  };

  const handleViewDetails = (item, type) => {
    alert(`View Details: ${item.name}\nType: ${type}\nThis would show detailed information and configuration.`);
    // In a real implementation, this would:
    // 1. Open a detailed view modal
    // 2. Show all configuration options
    // 3. Allow editing of settings
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Automated Reporting & BI
          </h1>
          <p className="text-gray-600">
            Schedule, customize, and manage automated reports and business intelligence dashboards
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'reports', name: 'Scheduled Reports', icon: FileText },
                { id: 'templates', name: 'Report Templates', icon: BarChart3 },
                { id: 'schedules', name: 'Schedule Management', icon: CalendarDays },
                { id: 'bi', name: 'Business Intelligence', icon: TrendingUp }
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
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
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
                  <option value="failed">Failed</option>
                </select>
              </div>
              <button
                onClick={handleCreateReport}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {report.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {report.type} • {report.frequency}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="capitalize">{report.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Run:</span>
                      <span className="text-gray-900">{formatDate(report.lastRun)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next Run:</span>
                      <span className="text-gray-900">{formatDate(report.nextRun)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Format:</span>
                      <span className="text-gray-900 uppercase">{report.format}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.recipients.slice(0, 2).map((recipient, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {recipient}
                      </span>
                    ))}
                    {report.recipients.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{report.recipients.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRunReport(report.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      <span>Run Now</span>
                    </button>
                    <button
                      onClick={() => handleExportReport(report.id, report.format)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
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

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Report Templates</h2>
              <button 
                onClick={() => alert('Create Template functionality would open a template creation form.')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Template</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {template.description}
                      </p>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                        {template.category}
                      </span>
                    </div>
                    {template.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sections:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.sections.map((section, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {section.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleViewDetails(template, 'template')}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!template.isDefault && (
                      <button className="flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Active Schedules</h3>
                      <p className="text-2xl font-bold text-blue-600">12</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Reports running on schedule</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Successful Runs</h3>
                      <p className="text-2xl font-bold text-green-600">156</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">This month</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-yellow-600 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Failed Runs</h3>
                      <p className="text-2xl font-bold text-yellow-600">3</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">This month</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Schedule Activity</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Weekly Revenue Summary', time: '2 hours ago', status: 'success' },
                    { name: 'Daily Operations Alert', time: '6 hours ago', status: 'success' },
                    { name: 'Monthly Performance Dashboard', time: '1 day ago', status: 'failed' },
                    { name: 'Weekly Revenue Summary', time: '1 week ago', status: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'success' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {activity.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{activity.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bi' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Intelligence Dashboard</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Revenue Growth</p>
                        <p className="text-sm text-gray-600">Month over month</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">+15.3%</p>
                        <p className="text-xs text-gray-500">vs last month</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Customer Satisfaction</p>
                        <p className="text-sm text-gray-600">Average rating</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">4.8/5.0</p>
                        <p className="text-xs text-gray-500">+0.2 vs last month</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Operational Efficiency</p>
                        <p className="text-sm text-gray-600">Job completion rate</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-600">94.2%</p>
                        <p className="text-xs text-gray-500">-1.1% vs last month</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Revenue Forecast</p>
                      <p className="text-sm text-gray-600 mb-2">Next 30 days</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">$45,200</span>
                        <span className="text-sm text-green-600">+8.5%</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Customer Churn Risk</p>
                      <p className="text-sm text-gray-600 mb-2">High-risk customers</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-indigo-600">12</span>
                        <span className="text-sm text-red-600">+3 this week</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Peak Hours Prediction</p>
                      <p className="text-sm text-gray-600 mb-2">Tomorrow's forecast</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-pink-600">2-4 PM</span>
                        <span className="text-sm text-blue-600">85% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Increase Marketing Budget', priority: 'high', impact: 'Revenue +12%' },
                    { title: 'Optimize Route Planning', priority: 'medium', impact: 'Efficiency +8%' },
                    { title: 'Enhance Customer Support', priority: 'high', impact: 'Satisfaction +5%' },
                    { title: 'Expand Service Areas', priority: 'low', impact: 'Growth +15%' },
                    { title: 'Implement Loyalty Program', priority: 'medium', impact: 'Retention +10%' },
                    { title: 'Upgrade Equipment', priority: 'low', impact: 'Quality +7%' }
                  ].map((action, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          action.priority === 'high' ? 'bg-red-100 text-red-800' :
                          action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{action.impact}</p>
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedReporting; 