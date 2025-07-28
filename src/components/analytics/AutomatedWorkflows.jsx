import React, { useState, useEffect } from 'react';
import { 
  FiGitBranch as Workflow, 
  FiPlay as Play, 
  FiPause as Pause, 
  FiSettings as Settings, 
  FiPlus as Plus, 
  FiEdit as Edit, 
  FiTrash2 as Trash2, 
  FiEye as Eye,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertTriangle as AlertTriangle,
  FiArrowRight as ArrowRight,
  FiFilter as Filter,
  FiSearch as Search,
  FiRefreshCw as RefreshCw,
  FiDownload as Download,
  FiBarChart2 as BarChart3,
  FiUsers as Users,
  FiDollarSign as DollarSign,
  FiCalendar as Calendar,
  FiZap as Zap,
  FiTarget as Target,
  FiTrendingUp as TrendingUp,
  FiActivity as Activity
} from 'react-icons/fi';
import Modal from '../shared/Modal';

const AutomatedWorkflows = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(new Set());
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    type: 'operations',
    frequency: 'daily',
    triggers: [],
    actions: []
  });

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('automatedWorkflowsState');
    if (savedState) {
      setWorkflows(JSON.parse(savedState));
    } else {
      setWorkflows(mockWorkflows);
    }
  }, []);

  // Mock data for workflows
  const mockWorkflows = [
    {
      id: 1,
      name: 'Elite Bubbler Assignment Automation',
      description: 'Automatically assign elite bubblers to multiple job assignments within orders based on permissions and availability',
      type: 'operations',
      status: 'active',
      triggers: ['new_order_with_multiple_services', 'elite_bubbler_available', 'split_order_approved'],
      actions: ['check_elite_status', 'verify_permissions', 'assign_multiple_jobs', 'notify_bubbler'],
      frequency: 'real-time',
      lastExecuted: '2024-01-16T14:30:00Z',
      nextExecution: '2024-01-16T15:30:00Z',
      successRate: 98.5,
      totalExecutions: 1247,
      avgExecutionTime: 2.3,
      isActive: true
    },
    {
      id: 2,
      name: 'Elite Bubbler Eligibility Notification',
      description: 'Automatically notify bubblers when they become eligible for elite status (10+ assignments, 4.5+ rating)',
      type: 'operations',
      status: 'active',
      triggers: ['assignment_completed', 'rating_received', 'eligibility_threshold_met'],
      actions: ['check_eligibility_criteria', 'send_eligibility_notification', 'update_bubbler_status'],
      frequency: 'daily',
      lastExecuted: '2024-01-16T09:00:00Z',
      nextExecution: '2024-01-17T09:00:00Z',
      successRate: 99.2,
      totalExecutions: 89,
      avgExecutionTime: 1.8,
      isActive: true
    },
    {
      id: 3,
      name: 'Bubbler Morale Program Automation',
      description: 'Automated morale programs and retention initiatives for bubbler engagement',
      type: 'retention',
      status: 'active',
      triggers: ['milestone_reached', 'performance_excellence', 'anniversary_date', 'low_engagement_detected'],
      actions: ['send_recognition_message', 'award_bonus_points', 'schedule_check_in', 'offer_training'],
      frequency: 'weekly',
      lastExecuted: '2024-01-15T18:00:00Z',
      nextExecution: '2024-01-22T18:00:00Z',
      successRate: 96.8,
      totalExecutions: 234,
      avgExecutionTime: 3.7,
      isActive: true
    },
    {
      id: 4,
      name: 'Split Order Management Workflow',
      description: 'Automated management of split orders and multi-service assignments',
      type: 'operations',
      status: 'active',
      triggers: ['split_order_created', 'elite_bubbler_assigned', 'service_completion'],
      actions: ['validate_split_eligibility', 'assign_elite_bubbler', 'track_completion_status', 'update_order_status'],
      frequency: 'real-time',
      lastExecuted: '2024-01-16T12:00:00Z',
      nextExecution: '2024-01-16T13:00:00Z',
      successRate: 97.3,
      totalExecutions: 456,
      avgExecutionTime: 2.1,
      isActive: true
    },
    {
      id: 5,
      name: 'Equipment Management Workflow',
      description: 'Automated equipment tracking, maintenance scheduling, and inventory management',
      type: 'operations',
      status: 'active',
      triggers: ['equipment_usage_logged', 'maintenance_due', 'low_stock_detected'],
      actions: ['update_equipment_status', 'schedule_maintenance', 'order_supplies', 'notify_admins'],
      frequency: 'daily',
      lastExecuted: '2024-01-16T06:00:00Z',
      nextExecution: '2024-01-17T06:00:00Z',
      successRate: 99.1,
      totalExecutions: 234,
      avgExecutionTime: 1.8,
      isActive: true
    },
    {
      id: 6,
      name: 'Group Onboarding Coordination',
      description: 'Automated coordination for bi-monthly group onboarding sessions',
      type: 'onboarding',
      status: 'active',
      triggers: ['onboarding_scheduled', 'applicant_approved', 'session_reminder'],
      actions: ['send_invitation_emails', 'schedule_sessions', 'send_reminders', 'track_attendance'],
      frequency: 'monthly',
      lastExecuted: '2024-01-10T10:00:00Z',
      nextExecution: '2024-02-10T10:00:00Z',
      successRate: 98.7,
      totalExecutions: 12,
      avgExecutionTime: 5.2,
      isActive: true
    }
  ];

  // Mock data for templates
  const mockTemplates = [
    {
      id: 1,
      name: 'Elite Bubbler Management',
      description: 'Automated workflows for elite bubbler assignment and eligibility management',
      category: 'operations',
      triggers: ['elite_eligibility_met', 'multiple_service_order', 'split_order_approved'],
      actions: ['check_eligibility', 'assign_elite_bubbler', 'send_notification'],
      isDefault: true
    },
    {
      id: 2,
      name: 'Bubbler Retention Programs',
      description: 'Morale and retention programs to encourage bubbler engagement and loyalty',
      category: 'retention',
      triggers: ['milestone_reached', 'performance_excellence', 'anniversary', 'low_engagement'],
      actions: ['send_recognition', 'award_points', 'schedule_check_in', 'offer_support'],
      isDefault: true
    },
    {
      id: 3,
      name: 'Split Order Operations',
      description: 'Management of split orders and multi-service assignments',
      category: 'operations',
      triggers: ['split_order_created', 'elite_assignment', 'service_completion'],
      actions: ['validate_eligibility', 'assign_bubbler', 'track_progress', 'update_status'],
      isDefault: false
    },
    {
      id: 4,
      name: 'Group Onboarding',
      description: 'Coordination of bi-monthly group onboarding sessions',
      category: 'onboarding',
      triggers: ['onboarding_scheduled', 'applicant_approved', 'session_reminder'],
      actions: ['send_invitations', 'schedule_sessions', 'send_reminders', 'track_attendance'],
      isDefault: false
    },
    {
      id: 5,
      name: 'Equipment Management',
      description: 'Equipment tracking and maintenance automation',
      category: 'operations',
      triggers: ['equipment_usage', 'maintenance_due', 'low_stock'],
      actions: ['update_status', 'schedule_maintenance', 'order_supplies'],
      isDefault: false
    }
  ];

  // Mock data for executions
  const mockExecutions = [
    {
      id: 1,
      workflowId: 1,
      workflowName: 'Customer Onboarding Automation',
      status: 'completed',
      startedAt: '2024-01-16T14:30:00Z',
      completedAt: '2024-01-16T14:30:02Z',
      executionTime: 2.3,
      actionsExecuted: 3,
      actionsFailed: 0,
      result: 'Customer profile created successfully'
    },
    {
      id: 2,
      workflowId: 2,
      workflowName: 'Revenue Optimization Workflow',
      status: 'completed',
      startedAt: '2024-01-16T14:00:00Z',
      completedAt: '2024-01-16T14:00:05Z',
      executionTime: 5.1,
      actionsExecuted: 3,
      actionsFailed: 0,
      result: 'Pricing adjusted for peak hours'
    },
    {
      id: 3,
      workflowId: 3,
      workflowName: 'Quality Assurance Automation',
      status: 'failed',
      startedAt: '2024-01-15T18:00:00Z',
      completedAt: '2024-01-15T18:00:08Z',
      executionTime: 8.2,
      actionsExecuted: 1,
      actionsFailed: 2,
      result: 'Quality check failed - manual review required'
    }
  ];

  useEffect(() => {
    setWorkflows(mockWorkflows);
    setTemplates(mockTemplates);
    setExecutions(mockExecutions);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getExecutionStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const handleCreateWorkflow = () => {
    setIsCreatingWorkflow(true);
  };

  const handleToggleWorkflow = (workflowId) => {
    setWorkflows(prevWorkflows => {
      const updatedWorkflows = prevWorkflows.map(w => 
        w.id === workflowId ? { ...w, isActive: !w.isActive } : w
      );
      
      // Save to localStorage
      localStorage.setItem('automatedWorkflowsState', JSON.stringify(updatedWorkflows));
      
      return updatedWorkflows;
    });
  };

  const handleRunWorkflow = (workflowId) => {
    setLoadingWorkflows(prev => new Set(prev).add(workflowId));
    // Simulate workflow execution
    setTimeout(() => {
      setLoadingWorkflows(prev => {
        const newSet = new Set(prev);
        newSet.delete(workflowId);
        return newSet;
      });
      // Add new execution to the list
      const workflow = workflows.find(w => w.id === workflowId);
      const newExecution = {
        id: Date.now(),
        workflowId,
        workflowName: workflow.name,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + 3000).toISOString(),
        executionTime: Math.random() * 5 + 1,
        actionsExecuted: workflow.actions.length,
        actionsFailed: 0,
        result: 'Workflow executed successfully'
      };
      setExecutions([newExecution, ...executions]);
    }, 3000);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    const matchesType = filterType === 'all' || workflow.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Automated Workflows
          </h1>
          <p className="text-gray-600">
            Streamline business processes with intelligent automation and workflow optimization
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'workflows', name: 'Active Workflows', icon: Workflow },
                { id: 'templates', name: 'Workflow Templates', icon: Settings },
                { id: 'executions', name: 'Execution History', icon: Activity },
                { id: 'analytics', name: 'Workflow Analytics', icon: BarChart3 }
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
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
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
                  <option value="draft">Draft</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="operations">Operations</option>
                  <option value="retention">Retention</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="quality">Quality</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
              <button
                onClick={handleCreateWorkflow}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </button>
            </div>

            {/* Workflows Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {workflow.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {workflow.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                          {getStatusIcon(workflow.status)}
                          <span className="capitalize">{workflow.status}</span>
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {workflow.type} • {workflow.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="text-gray-900 font-medium">{workflow.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Executions:</span>
                      <span className="text-gray-900">{workflow.totalExecutions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Avg Execution Time:</span>
                      <span className="text-gray-900">{workflow.avgExecutionTime}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Executed:</span>
                      <span className="text-gray-900">{formatDate(workflow.lastExecuted)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Triggers:</h4>
                    <div className="flex flex-wrap gap-1">
                      {workflow.triggers.map((trigger, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {trigger.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {workflow.actions.map((action, index) => (
                        <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {action.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRunWorkflow(workflow.id)}
                      disabled={loadingWorkflows.has(workflow.id) || !workflow.isActive}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loadingWorkflows.has(workflow.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>Run Now</span>
                    </button>
                    <button
                      onClick={() => handleToggleWorkflow(workflow.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        workflow.isActive 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => alert(`Settings for workflow: ${workflow.name}\nThis would open workflow configuration settings.`)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => alert(`View details for workflow: ${workflow.name}\nThis would show detailed workflow information and configuration.`)}
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

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
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
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Triggers:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.triggers.map((trigger, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {trigger.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.actions.map((action, index) => (
                        <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {action.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Use Template: ${template.name}\nThis would create a new workflow using this template.`)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                    <button 
                      onClick={() => alert(`View details for template: ${template.name}\nThis would show detailed template information.`)}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!template.isDefault && (
                      <button 
                        onClick={() => alert(`Delete template: ${template.name}\nThis would permanently delete this template.`)}
                        className="flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Execution History</h2>
              <button 
                onClick={() => {
                  const content = `Workflow Execution History Export\nGenerated: ${new Date().toLocaleString()}\n\n${executions.map(e => 
                    `${e.workflowName} | ${e.status} | ${formatDate(e.startedAt)} | ${e.executionTime.toFixed(2)}s | ${e.actionsExecuted} actions`
                  ).join('\n')}`;
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `workflow_executions_${new Date().toISOString().split('T')[0]}.txt`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  alert('Execution history exported successfully!');
                }}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {executions.map((execution) => (
                      <tr key={execution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {execution.workflowName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExecutionStatusColor(execution.status)}`}>
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(execution.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.executionTime}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.actionsExecuted}/{execution.actionsExecuted + execution.actionsFailed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Workflow Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Workflow className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Active Workflows</h3>
                      <p className="text-2xl font-bold text-blue-600">12</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Currently running</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Success Rate</h3>
                      <p className="text-2xl font-bold text-green-600">96.8%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">This month</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Total Executions</h3>
                      <p className="text-2xl font-bold text-purple-600">2,847</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">This month</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Avg Execution</h3>
                      <p className="text-2xl font-bold text-orange-600">3.2s</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Time per workflow</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Performing Workflows</h3>
                  <div className="space-y-3">
                    {workflows
                      .sort((a, b) => b.successRate - a.successRate)
                      .slice(0, 5)
                      .map((workflow) => (
                        <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{workflow.name}</p>
                            <p className="text-sm text-gray-500">{workflow.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{workflow.successRate}%</p>
                            <p className="text-xs text-gray-500">{workflow.totalExecutions} runs</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <div className="space-y-3">
                    {executions.slice(0, 5).map((execution) => (
                      <div key={execution.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          execution.status === 'completed' ? 'bg-green-500' :
                          execution.status === 'failed' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{execution.workflowName}</p>
                          <p className="text-sm text-gray-500">{execution.result}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(execution.startedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Workflow Modal */}
        {isCreatingWorkflow && (
          <Modal title="Create New Workflow" onClose={() => setIsCreatingWorkflow(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newWorkflow.type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operations">Operations</option>
                  <option value="retention">Retention</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={newWorkflow.frequency}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="real-time">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => {
                    if (!newWorkflow.name || !newWorkflow.description) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    const workflow = {
                      id: Date.now(),
                      ...newWorkflow,
                      status: 'active',
                      isActive: true,
                      successRate: 0,
                      totalExecutions: 0,
                      avgExecutionTime: 0,
                      lastExecuted: null,
                      nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    };
                    const updatedWorkflows = [workflow, ...workflows];
                    setWorkflows(updatedWorkflows);
                    localStorage.setItem('automatedWorkflowsState', JSON.stringify(updatedWorkflows));
                    setNewWorkflow({ name: '', description: '', type: 'operations', frequency: 'daily', triggers: [], actions: [] });
                    setIsCreatingWorkflow(false);
                    alert('Workflow created successfully!');
                  }}
                  className="btn-primary flex-1"
                >
                  Create Workflow
                </button>
                <button onClick={() => setIsCreatingWorkflow(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AutomatedWorkflows; 