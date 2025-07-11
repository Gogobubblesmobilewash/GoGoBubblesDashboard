import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiFilter, 
  FiSearch, 
  FiDownload, 
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiStar,
  FiMessageCircle,
  FiPackage,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import Modal from '../shared/Modal';
import { supabase } from '../../services/api';

const BreakdownModal = ({ isOpen, onClose, type, title, data }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      setFilteredData(data);
    }
  }, [isOpen, data]);

  const applyFilters = () => {
    let filtered = [...data];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = getSearchFields(item);
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = getStatusField(item);
        return status === statusFilter;
      });
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(getDateField(item));
        switch (dateFilter) {
          case 'today':
            return itemDate >= today;
          case 'week':
            return itemDate >= weekAgo;
          case 'month':
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    setFilteredData(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, dateFilter, data]);

  const getSearchFields = (item) => {
    switch (type) {
      case 'payouts':
        return [item.bubblerName, item.status];
      case 'jobs':
        return [item.customerName, item.serviceType, item.jobStatus];
      case 'applicants':
        return [item.name, item.email, item.status];
      case 'ratings':
        return [item.customerName, item.comment];
      case 'equipment':
        return [item.item, item.status];
      case 'messages':
        return [item.fromName || item.from, item.subject, item.message];
      default:
        return [];
    }
  };

  const getStatusField = (item) => {
    switch (type) {
      case 'payouts':
        return item.status;
      case 'jobs':
        return item.jobStatus;
      case 'applicants':
        return item.status;
      case 'equipment':
        return item.status;
      case 'messages':
        return item.read ? 'read' : 'unread';
      default:
        return null;
    }
  };

  const getDateField = (item) => {
    return item.created_at || item.updated_at || item.date;
  };

  const exportData = () => {
    const csvContent = generateCSV(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_breakdown_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const renderTable = () => {
    if (!filteredData.length) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {type === 'payouts' && <FiDollarSign className="h-12 w-12 mx-auto" />}
            {type === 'jobs' && <FiCalendar className="h-12 w-12 mx-auto" />}
            {type === 'applicants' && <FiUser className="h-12 w-12 mx-auto" />}
            {type === 'ratings' && <FiStar className="h-12 w-12 mx-auto" />}
            {type === 'equipment' && <FiPackage className="h-12 w-12 mx-auto" />}
            {type === 'messages' && <FiMessageCircle className="h-12 w-12 mx-auto" />}
          </div>
          <p className="text-gray-500">No data found</p>
        </div>
      );
    }

    const columns = getColumns();
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getColumns = () => {
    switch (type) {
      case 'payouts':
        return [
          { key: 'date', header: 'Date', render: (value) => new Date(value).toLocaleDateString() },
          { key: 'bubblerName', header: 'Bubbler' },
          { key: 'amount', header: 'Amount', render: (value) => `$${Number(value).toFixed(2)}` },
          { 
            key: 'status', 
            header: 'Status', 
            render: (value) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {value}
              </span>
            )
          }
        ];
      case 'jobs':
        return [
          { key: 'customerName', header: 'Customer' },
          { key: 'serviceType', header: 'Service' },
          { key: 'jobStatus', header: 'Status', render: (value) => (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'completed' ? 'bg-green-100 text-green-800' :
              value === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {value.replace('_', ' ')}
            </span>
          )},
          { key: 'earningsEstimate', header: 'Earnings', render: (value) => `$${Number(value || 0).toFixed(2)}` }
        ];
      case 'applicants':
        return [
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'status', header: 'Status', render: (value) => (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'approved' ? 'bg-green-100 text-green-800' :
              value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {value}
            </span>
          )}
        ];
      case 'ratings':
        return [
          { key: 'customerName', header: 'Customer' },
          { key: 'rating', header: 'Rating', render: (value) => (
            <div className="flex items-center">
              <span className="mr-2">{value}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className={`h-4 w-4 ${i < value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
          )},
          { key: 'comment', header: 'Comment' },
          { key: 'created_at', header: 'Date', render: (value) => new Date(value).toLocaleDateString() }
        ];
      case 'equipment':
        return [
          { key: 'item', header: 'Item' },
          { key: 'status', header: 'Status', render: (value) => (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'available' ? 'bg-green-100 text-green-800' :
              value === 'rented' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {value}
            </span>
          )},
          { key: 'expectedReturn', header: 'Expected Return', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' }
        ];
      case 'messages':
        return [
          { key: 'fromName', header: 'From', render: (value, item) => value || item.from },
          { key: 'subject', header: 'Subject' },
          { key: 'message', header: 'Message', render: (value) => value?.substring(0, 50) + (value?.length > 50 ? '...' : '') },
          { key: 'read', header: 'Status', render: (value) => (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value ? 'Read' : 'Unread'}
            </span>
          )}
        ];
      default:
        return [];
    }
  };

  const getStatusOptions = () => {
    switch (type) {
      case 'payouts':
        return ['all', 'paid', 'pending'];
      case 'jobs':
        return ['all', 'completed', 'in_progress', 'pending', 'needs_reassignment'];
      case 'applicants':
        return ['all', 'approved', 'pending', 'rejected'];
      case 'equipment':
        return ['all', 'available', 'rented', 'maintenance'];
      case 'messages':
        return ['all', 'read', 'unread'];
      default:
        return ['all'];
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {getStatusOptions().map(option => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Results count */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} of {data?.length || 0} results
          </p>
        </div>

        {/* Table */}
        {renderTable()}
      </div>
    </Modal>
  );
};

BreakdownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['payouts', 'jobs', 'applicants', 'ratings', 'equipment', 'messages']).isRequired,
  title: PropTypes.string.isRequired,
  data: PropTypes.array
};

export default BreakdownModal; 