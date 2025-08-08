import React, { useState, useEffect } from 'react';
import {
  FiFileText, FiSearch, FiFilter, FiDownload, FiEdit3, FiEye,
  FiBook, FiUsers, FiTarget, FiShield, FiDollarSign, FiMessageCircle,
  FiMapPin, FiUser, FiStar, FiClock, FiAlertTriangle, FiCheckCircle,
  FiPlus, FiTrash2, FiSave, FiX
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SOPManager = () => {
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sopData, setSopData] = useState({});
  const [editingSop, setEditingSop] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Role configurations with SOP categories
  const roleConfigs = {
    admin: {
      name: 'System Administrator',
      icon: FiShield,
      color: 'purple',
      categories: ['System Management', 'User Management', 'Security', 'Emergency Procedures', 'Role Assumption']
    },
    support: {
      name: 'Support Specialist',
      icon: FiMessageCircle,
      color: 'blue',
      categories: ['Customer Support', 'Issue Resolution', 'Ticket Management', 'Communication', 'Escalation']
    },
    finance: {
      name: 'Finance Manager',
      icon: FiDollarSign,
      color: 'green',
      categories: ['Payment Processing', 'Budget Management', 'Financial Reporting', 'Audit Procedures', 'Bonus Management']
    },
    recruiter: {
      name: 'Recruitment Specialist',
      icon: FiUsers,
      color: 'orange',
      categories: ['Candidate Screening', 'Interview Process', 'Onboarding', 'Performance Tracking', 'Background Checks']
    },
    market_manager: {
      name: 'Market Manager',
      icon: FiMapPin,
      color: 'red',
      categories: ['Territory Management', 'Performance Monitoring', 'Growth Strategy', 'Team Management', 'Market Analysis']
    },
    lead_bubbler: {
      name: 'Lead Bubbler',
      icon: FiTarget,
      color: 'teal',
      categories: ['Quality Assurance', 'Team Oversight', 'Training Management', 'Emergency Response', 'Performance Coaching']
    },
    bubbler: {
      name: 'Bubbler',
      icon: FiUser,
      color: 'gray',
      categories: ['Job Execution', 'Quality Standards', 'Safety Procedures', 'Customer Interaction', 'Equipment Use']
    }
  };

  useEffect(() => {
    loadSOPData();
  }, []);

  const loadSOPData = async () => {
    setLoading(true);
    try {
      // Simulate SOP data for each role
      const sopData = {
        admin: {
          'System Management': [
            {
              id: 'admin-sys-001',
              title: 'System Backup Procedures',
              description: 'Daily automated backup procedures and manual backup protocols',
              content: `1. Automated backups run daily at 2:00 AM
2. Manual backup required before system updates
3. Verify backup integrity within 24 hours
4. Store backups in secure off-site location
5. Test restore procedures monthly`,
              lastUpdated: '2024-01-15',
              author: 'System Admin',
              priority: 'high'
            },
            {
              id: 'admin-sys-002',
              title: 'Role Assumption Protocol',
              description: 'Procedures for admin to assume other roles for fieldwork and oversight',
              content: `1. Select role from Admin Command Center
2. Confirm override permissions are active
3. Log all actions under admin ID with role context
4. Follow role-specific procedures while maintaining admin oversight
5. Exit role and return to admin view when complete`,
              lastUpdated: '2024-01-20',
              author: 'System Admin',
              priority: 'critical'
            }
          ],
          'Emergency Procedures': [
            {
              id: 'admin-emerg-001',
              title: 'Emergency Oversight Assignment',
              description: 'Quick assignment of admin oversight for critical situations',
              content: `1. Identify critical job requiring immediate oversight
2. Use Emergency Controls in Admin Command Center
3. Automatically assign admin as lead bubbler for job
4. Bypass GPS restrictions if necessary
5. Document all actions in override logs`,
              lastUpdated: '2024-01-18',
              author: 'System Admin',
              priority: 'critical'
            }
          ]
        },
        support: {
          'Customer Support': [
            {
              id: 'support-cust-001',
              title: 'Customer Complaint Resolution',
              description: 'Step-by-step process for handling customer complaints',
              content: `1. Acknowledge complaint within 2 hours
2. Gather all relevant information and photos
3. Assess severity and assign priority level
4. Contact relevant bubbler or lead if needed
5. Provide resolution within 24 hours
6. Follow up with customer satisfaction survey`,
              lastUpdated: '2024-01-10',
              author: 'Support Team',
              priority: 'high'
            }
          ],
          'Escalation': [
            {
              id: 'support-escal-001',
              title: 'Issue Escalation Protocol',
              description: 'When and how to escalate issues to higher levels',
              content: `1. Escalate if resolution time exceeds 24 hours
2. Escalate for safety or legal concerns
3. Escalate for financial disputes over $100
4. Contact lead bubbler for quality issues
5. Contact admin for system or security issues`,
              lastUpdated: '2024-01-12',
              author: 'Support Team',
              priority: 'high'
            }
          ]
        },
        finance: {
          'Payment Processing': [
            {
              id: 'finance-pay-001',
              title: 'Payment Override Procedures',
              description: 'Admin procedures for payment overrides and bonuses',
              content: `1. Verify reason for override (bonus, correction, emergency)
2. Document override in admin logs with justification
3. Process payment through secure channels
4. Notify recipient of payment adjustment
5. Review override patterns monthly for abuse prevention`,
              lastUpdated: '2024-01-14',
              author: 'Finance Team',
              priority: 'high'
            }
          ]
        },
        lead_bubbler: {
          'Quality Assurance': [
            {
              id: 'lead-qa-001',
              title: 'Environmental QA Checklist',
              description: 'Home-based Fresh Bubbler environmental assessment procedures',
              content: `1. Assess odor levels (no strong pet/tobacco odors)
2. Check surface cleanliness of work areas
3. Verify no free-roaming pets during handling
4. Inspect for pest presence (roaches, ants, fleas)
5. Evaluate laundry setup and organization
6. Check home laundry machine cleanliness
7. Fail if 2+ categories fail or critical issues found
8. Document with photos for any failures`,
              lastUpdated: '2024-01-16',
              author: 'Lead Bubbler Team',
              priority: 'critical'
            },
            {
              id: 'lead-qa-002',
              title: 'Room-Based Evaluation Flow',
              description: 'Proper order of operations for room evaluation',
              content: `1. Wait for bubbler to mark room as completed
2. Tap room to initiate evaluation
3. Select evaluation status:
   - "Looks Good" (green) - auto-log
   - "Coaching Only" (yellow) - optional tag
   - "Needs Redo" (red) - photo + fix required
4. Photos required only for red status
5. Yellow doesn't count toward takeovers; Red does
6. Lock final check-in until all issues resolved`,
              lastUpdated: '2024-01-17',
              author: 'Lead Bubbler Team',
              priority: 'high'
            }
          ],
          'Emergency Response': [
            {
              id: 'lead-emerg-001',
              title: 'Abandonment Detection Protocol',
              description: 'Handling bubbler job abandonment scenarios',
              content: `1. Flag job if no "En Route" within 10-15 minutes of scheduled start
2. Trigger critical indicator on Lead Dashboard
3. Auto-prompt all leads within 30-mile radius
4. First lead to accept gets job bonus + full takeover rate
5. Flag original bubbler for admin review
6. Escalate to admin if no response within 5 minutes`,
              lastUpdated: '2024-01-19',
              author: 'Lead Bubbler Team',
              priority: 'critical'
            }
          ]
        },
        bubbler: {
          'Job Execution': [
            {
              id: 'bubbler-job-001',
              title: 'Fresh Bubbler Laundry Flow',
              description: 'Proper procedures for laundry job management',
              content: `1. Express jobs: Begin laundering within 2 hours of pickup
2. Standard jobs: Begin laundering within 8 hours of pickup
3. Multi-pickup days: Begin first wash within 6 hours of first pickup
4. Cannot hold >3 picked-up jobs without starting one
5. Must return all jobs within designated turnaround
6. May batch up to 2 jobs if started within timer window`,
              lastUpdated: '2024-01-13',
              author: 'Bubbler Team',
              priority: 'high'
            },
            {
              id: 'bubbler-job-002',
              title: 'Location Tracking Requirements',
              description: 'GPS and location tracking for laundromat work mode',
              content: `1. Enable GPS before starting laundry job
2. Drop GPS pin when hitting "Start Laundry Job"
3. Confirm home/laundromat location
4. Location visible to leads for 2 hours or until job complete
5. If GPS disabled, job cannot start
6. Movement recorded and new location shown if laundromat changes`,
              lastUpdated: '2024-01-15',
              author: 'Bubbler Team',
              priority: 'medium'
            }
          ]
        }
      };
      setSopData(sopData);
    } catch (error) {
      console.error('Error loading SOP data:', error);
      toast.error('Failed to load SOP data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSOPs = () => {
    let filtered = [];
    
    if (selectedRole === 'all') {
      Object.values(sopData).forEach(roleSOPs => {
        Object.values(roleSOPs).forEach(categorySOPs => {
          filtered = filtered.concat(categorySOPs);
        });
      });
    } else if (sopData[selectedRole]) {
      Object.values(sopData[selectedRole]).forEach(categorySOPs => {
        filtered = filtered.concat(categorySOPs);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(sop => 
        sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || colors.medium;
  };

  const handleEditSOP = (sop) => {
    setEditingSop(sop);
  };

  const handleSaveSOP = async (updatedSop) => {
    try {
      // Simulate saving SOP
      toast.success('SOP updated successfully');
      setEditingSop(null);
      loadSOPData(); // Refresh data
    } catch (error) {
      console.error('Error saving SOP:', error);
      toast.error('Failed to save SOP');
    }
  };

  const handleCreateSOP = async (newSop) => {
    try {
      // Simulate creating new SOP
      toast.success('SOP created successfully');
      setShowCreateForm(false);
      loadSOPData(); // Refresh data
    } catch (error) {
      console.error('Error creating SOP:', error);
      toast.error('Failed to create SOP');
    }
  };

  const exportSOPs = async (format) => {
    try {
      toast.success(`SOPs exported as ${format}`);
    } catch (error) {
      console.error('Error exporting SOPs:', error);
      toast.error('Failed to export SOPs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <FiBook className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SOP Manager</h1>
                <p className="text-sm text-gray-500">Role-specific Standard Operating Procedures</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <FiPlus className="inline mr-2" />
                Create SOP
              </button>
              
              <button
                onClick={() => exportSOPs('PDF')}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                <FiDownload className="inline mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">SOP Filters</h2>
            <div className="flex items-center space-x-2">
              <FiFilter className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Filter by role and search content</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {Object.entries(roleConfigs).map(([role, config]) => (
                  <option key={role} value={role}>{config.name}</option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search SOPs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                {getFilteredSOPs().length} SOPs found
              </div>
            </div>
          </div>
        </div>

        {/* SOP List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedRole === 'all' ? 'All SOPs' : `${roleConfigs[selectedRole]?.name} SOPs`}
            </h3>
            <div className="flex items-center space-x-2">
              <FiFileText className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Standard Operating Procedures</span>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredSOPs().map((sop) => (
                <SOPCard
                  key={sop.id}
                  sop={sop}
                  onEdit={handleEditSOP}
                  roleConfigs={roleConfigs}
                />
              ))}
              
              {getFilteredSOPs().length === 0 && (
                <div className="text-center py-8">
                  <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No SOPs found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit SOP Modal */}
      {editingSop && (
        <EditSOPModal
          sop={editingSop}
          onSave={handleSaveSOP}
          onCancel={() => setEditingSop(null)}
          roleConfigs={roleConfigs}
        />
      )}

      {/* Create SOP Modal */}
      {showCreateForm && (
        <CreateSOPModal
          onSave={handleCreateSOP}
          onCancel={() => setShowCreateForm(false)}
          roleConfigs={roleConfigs}
        />
      )}
    </div>
  );
};

const SOPCard = ({ sop, onEdit, roleConfigs }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || colors.medium;
  };

  // Determine role from SOP ID
  const role = Object.keys(roleConfigs).find(r => sop.id.startsWith(r));
  const roleConfig = roleConfigs[role];

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {roleConfig && (
            <div className={`p-2 rounded-lg ${roleConfig.color === 'purple' ? 'bg-purple-50' : 
              roleConfig.color === 'blue' ? 'bg-blue-50' :
              roleConfig.color === 'green' ? 'bg-green-50' :
              roleConfig.color === 'orange' ? 'bg-orange-50' :
              roleConfig.color === 'red' ? 'bg-red-50' :
              roleConfig.color === 'teal' ? 'bg-teal-50' :
              'bg-gray-50'}`}>
              <roleConfig.icon className={`h-5 w-5 ${
                roleConfig.color === 'purple' ? 'text-purple-600' :
                roleConfig.color === 'blue' ? 'text-blue-600' :
                roleConfig.color === 'green' ? 'text-green-600' :
                roleConfig.color === 'orange' ? 'text-orange-600' :
                roleConfig.color === 'red' ? 'text-red-600' :
                roleConfig.color === 'teal' ? 'text-teal-600' :
                'text-gray-600'
              }`} />
            </div>
          )}
          
          <div>
            <h4 className="text-lg font-medium text-gray-900">{sop.title}</h4>
            <p className="text-sm text-gray-500">{sop.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(sop.priority)}`}>
            {sop.priority.toUpperCase()}
          </span>
          
          <button
            onClick={() => onEdit(sop)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none text-gray-700 mb-4">
        <pre className="whitespace-pre-wrap font-sans">{sop.content}</pre>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Last updated: {sop.lastUpdated}</span>
          <span>Author: {sop.author}</span>
        </div>
        
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          <FiEye className="inline mr-1" />
          View Full SOP
        </button>
      </div>
    </div>
  );
};

const EditSOPModal = ({ sop, onSave, onCancel, roleConfigs }) => {
  const [formData, setFormData] = useState(sop);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit SOP</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiSave className="inline mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateSOPModal = ({ onSave, onCancel, roleConfigs }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    role: 'admin',
    category: 'System Management',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New SOP</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(roleConfigs).map(([role, config]) => (
                  <option key={role} value={role}>{config.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {formData.role && roleConfigs[formData.role]?.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter step-by-step procedures..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiPlus className="inline mr-2" />
              Create SOP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SOPManager; 