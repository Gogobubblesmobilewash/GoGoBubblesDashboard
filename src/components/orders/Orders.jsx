import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FiCalendar as Calendar,
  FiClock as Clock,
  FiMapPin as MapPin,
  FiDollarSign as DollarSign,
  FiUser as User,
  FiSearch as Search,
  FiMinus as Split,
  FiUsers as Users,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertCircle as AlertCircle,
  FiRefreshCw as RefreshCw,
  FiFilter as Filter,
  FiCheck as Check,
  FiXCircle as Ban,
  FiEye as Eye,
  FiUserCheck as UserCheck,
  FiUserX as UserX,
  FiWifi as Wifi,
  FiExternalLink as ExternalLink,
  FiGift as Gift,
  FiCamera as Camera,
  FiBox as Car,
  FiHome as Home,
  FiPackage as Package,
  FiPlus as Plus,
  FiEdit as Edit,
  FiTrash2 as Trash2
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import Modal from '../shared/Modal';
import { 
  parseServicesForSplitting,
  getPerks,
  SERVICE_CONFIG,
  generateOrderId,
  supabase
} from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const GOLD = '#FFD700'; // Brand gold for perk icon

const Orders = () => {
  const { orders, setOrders, loading, setLoading } = useStore();
  const { user, isAdmin } = useAuth();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [splitConfirmation, setSplitConfirmation] = useState(null);
  const [recentlySplitOrders, setRecentlySplitOrders] = useState([]);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [availableBubblers, setAvailableBubblers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading orders from Orders sheet...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(Array.isArray(data) ? data : []);
      setFilteredOrders(Array.isArray(data) ? data : []);
      console.log('✅ Orders loaded successfully:', Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError('Error loading orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order['Order Status'] === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order['Order ID'] || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getSplitStatus = (order) => {
    return order['Job Split Status'] || order['Split Status'] || '';
  };

  const getOrderStatus = (order) => {
    const orderStatus = order['Order Status'] || '';
    const splitStatus = getSplitStatus(order);
    const services = parseServicesForSplitting(order.services);
    
    // Check order status first
    if (orderStatus === 'Completed') {
      return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' };
    } else if (orderStatus === 'Cancelled') {
      return { status: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    } else if (orderStatus === 'Assigned') {
      return { status: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    } else if (orderStatus === 'Accepted') {
      return { status: 'accepted', label: 'Accepted by Bubbler', color: 'bg-green-100 text-green-800' };
    } else if (orderStatus === 'Declined') {
      return { status: 'declined', label: 'Declined by Bubbler', color: 'bg-red-100 text-red-800' };
    } else if (orderStatus === 'Arrival') {
      return { status: 'arrival', label: 'Bubbler Arrived', color: 'bg-orange-100 text-orange-800' };
    }
    
    // If no order status, check split status
    if (splitStatus === 'Split Completed') {
      return { status: 'split', label: 'Split Completed - Jobs Created', color: 'bg-purple-100 text-purple-800' };
    } else if (splitStatus === 'Pending' && services.length > 1) {
      return { status: 'pending', label: 'Needs Split', color: 'bg-yellow-100 text-yellow-800' };
    } else if (services.length === 1) {
      return { status: 'single', label: 'Single Service', color: 'bg-gray-100 text-gray-800' };
    } else if (services.length > 1) {
      return { status: 'pending', label: 'Needs Split', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const canSplitOrder = (order) => {
    const services = parseServicesForSplitting(order.services);
    const splitStatus = getSplitStatus(order);
    
    // Check if order has multiple services (laundry counts as one service)
    const hasMultipleServices = services.length > 1;
    
    // Only show split button if:
    // 1. Order has multiple services AND
    // 2. Order hasn't been split yet
    return hasMultipleServices && (!splitStatus || splitStatus === '');
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'Mobile Car Wash':
        return <Car className="h-4 w-4" />;
      case 'Home Cleaning':
        return <Home className="h-4 w-4" />;
      case 'Laundry Service':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  getServiceIcon.propTypes = {
    serviceType: PropTypes.string.isRequired
  };

  const PerkDisplay = ({ perks }) => {
    if (!perks || perks.length === 0) return null;
    
    return (
      <div className="flex items-center mt-1">
        <Gift className="h-3 w-3 mr-1" style={{ color: GOLD }} />
        <span className="text-xs font-medium" style={{ color: GOLD }}>
          Perk: {perks.join(', ')}
        </span>
      </div>
    );
  };

  PerkDisplay.propTypes = {
    perks: PropTypes.arrayOf(PropTypes.string)
  };

  PerkDisplay.defaultProps = {
    perks: []
  };

  const handleSplitOrder = (order) => {
    const services = parseServicesForSplitting(order.services);
    if (services.length <= 1) {
      alert('This order has only one service and cannot be split.');
      return;
    }

    setSelectedOrder(order);
    setSplitConfirmation({
      orderId: order['Order ID'] || order.orderId || generateOrderId(),
      customerName: order.name || order.customerName,
      services: services,
      servicesCount: services.length
    });
    setShowSplitModal(true);
  };

  const handleCompleteOrder = (order) => {
    setSelectedOrder(order);
    setShowCompletionModal(true);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancellationModal(true);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const confirmSplitOrder = async () => {
    if (!splitConfirmation) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Splitting order:', splitConfirmation.orderId);
      // Update order status in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ 
          'Job Split Status': 'Split Completed',
          'Split Status': 'Split Completed',
          updated_at: new Date().toISOString()
        })
        .eq('orderId', splitConfirmation.orderId);
      
      // Add to recently split orders for revert functionality
      setRecentlySplitOrders(prev => [...prev, {
        orderId: splitConfirmation.orderId,
        splitTime: new Date().toISOString(),
        services: splitConfirmation.services
      }]);
      
      // Reload orders to get updated split status
      await loadOrders();
      
      setShowSplitModal(false);
      setSplitConfirmation(null);
      setSelectedOrder(null);
      
      alert(`✅ Successfully split order into ${splitConfirmation.servicesCount} jobs! Check the Jobs tab to assign them to bubblers.`);
    } catch (error) {
      console.error('Error splitting order:', error);
      setError('Error splitting order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeOrder = async (orderId, completionNotes = '') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          'Order Status': 'Completed',
          completionNotes,
          completedBy: user?.email || 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('orderId', orderId);
      
      if (error) throw error;
      
      alert('✅ Order marked as completed successfully!');
      setShowCompletionModal(false);
      setSelectedOrder(null);
      await loadOrders(); // This will hide the completed order
    } catch (error) {
      console.error('Error completing order:', error);
      setError('Error completing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId, cancellationReason = '') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          'Order Status': 'Cancelled',
          cancellationReason,
          cancelledBy: user?.email || 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('orderId', orderId);
      
      if (error) throw error;
      
      alert('✅ Order cancelled successfully!');
      setShowCancellationModal(false);
      setSelectedOrder(null);
      await loadOrders(); // This will hide the cancelled order
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Error cancelling order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canRevertSplit = (order) => {
    const splitStatus = getSplitStatus(order);
    return splitStatus === 'Split Completed';
  };

  const handleAssignJob = (order) => {
    console.log('🔄 Assign Job clicked for order:', order);
    console.log('📋 Order status:', getOrderStatus(order));
    console.log('🔧 Services:', parseServicesForSplitting(order.services));
    
    setAssignOrder(order);
    // Get available bubblers for this order's service type
    const services = parseServicesForSplitting(order.services);
    let serviceType = services[0]?.service; // For single service orders
    
    // Normalize service type for assignment
    if (serviceType === 'Car Wash') serviceType = 'Mobile Car Wash';
    if (serviceType === 'Laundry') serviceType = 'Laundry';
    if (serviceType === 'Home Cleaning') serviceType = 'Home Cleaning';
    
    console.log('🎯 Service type for assignment:', serviceType);
    
    // Filter bubblers by permissions
    const bubblers = mockData.users.filter(u => 
      u.role === 'bubbler' && 
      u.permissions && 
      u.permissions.includes(serviceType)
    );
    
    console.log('👥 Available bubblers:', bubblers);
    
    setAvailableBubblers(bubblers);
    setSelectedBubbler(null);
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedBubbler || !assignOrder) return;
    
    // Create job assignment
    const jobData = {
      orderId: assignOrder['Order ID'] || assignOrder.orderId || generateOrderId(),
      bubblerId: selectedBubbler.id,
      bubblerName: selectedBubbler.name,
      bubblerEmail: selectedBubbler.email,
      serviceType: parseServicesForSplitting(assignOrder.services)[0]?.service,
      customerName: assignOrder.name,
      customerAddress: assignOrder.address,
      customerPhone: assignOrder.phone,
      customerEmail: assignOrder.email,
      scheduledDate: assignOrder._date || new Date().toISOString(),
      status: 'Assigned',
      earnings: assignOrder.total || 0,
      orderData: assignOrder
    };
    
    console.log('Assigning job:', jobData);
    
    // Here you would typically call an API to create the job
    // For now, we'll just close the modal and show a success message
    setShowAssignModal(false);
    setAssignOrder(null);
    setSelectedBubbler(null);
    
    // Show success message (you can implement a toast notification here)
    alert(`Job assigned to ${selectedBubbler.name} successfully!`);
  };

  const revertSplitOrder = async (order) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          'Job Split Status': null,
          'Split Status': null,
          updated_at: new Date().toISOString()
        })
        .eq('orderId', order['Order ID'] || order.orderId);
      
      if (error) throw error;
      
      alert('✅ Order split has been reverted!');
      await loadOrders();
    } catch (error) {
      setError('Error reverting split: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const OrderCard = ({ order }) => {
    const { status, label, color } = getOrderStatus(order);
    const services = parseServicesForSplitting(order.services);
    const total = order.total || 0;
    const date = order._date ? new Date(order._date).toLocaleDateString() : 'No date';
    let orderId = order['Order ID'] || order.orderId;
    if (!orderId) orderId = generateOrderId();
    const isMultiService = services.length > 1;
    const serviceLabel = isMultiService ? 'Multi-Service' : 'Single Service';
    const serviceLabelColor = isMultiService ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
    const assignedJobs = order.jobs || [];
    const showPerk = assignedJobs.some(job => job.perk);
    const perkName = assignedJobs.find(job => job.perk)?.perk || '';

    return (
      <div className="card-hover">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.name || 'Unknown Customer'}</h3>
            <p className="text-sm text-gray-600">{order.email}</p>
            <p className="text-xs text-gray-500">Order ID: {orderId}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {status !== 'unknown' && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${serviceLabelColor}`}>{serviceLabel}</span>
          </div>
        </div>
        {/* Services Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Services ({services.length})</h4>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={service.originalIndex || service.service + '-' + (service.tier || '') + '-' + index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(service.service)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.service}</p>
                    {service.tier && (
                      <p className="text-xs text-gray-600">Tier: {service.tier}</p>
                    )}
                    {service.addons && service.addons.length > 0 && (
                      <p className="text-xs text-gray-600">
                        Add-ons: {service.addons.map((a, i) => <span key={(typeof a === 'string' ? a : a.name || JSON.stringify(a)) + '-' + i}>{typeof a === 'string' ? a : a.name || JSON.stringify(a)}</span>)}
                      </p>
                    )}
                    {service.bagTypes && (
                      <p className="text-xs text-gray-600">
                        Bags: {service.totalBags} ({service.bagTypes.map((b, i) => <span key={b.type + '-' + i}>{`${b.quantity} ${b.type}`}</span>)})
                      </p>
                    )}
                    {showPerk && perkName && (
                      <PerkDisplay perks={[perkName]} />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${(total / services.length).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Order Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" /> {order.address || 'No address'}
          </div>
          {order.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" /> {order.phone}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" /> {date}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" /> Total: ${total.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {/* Split Jobs button for all eligible multi-service orders */}
            {canSplitOrder(order) && (
              <button 
                onClick={() => handleSplitOrder(order)} 
                className="btn-secondary text-sm"
              >
                <Split className="h-4 w-4 mr-1" /> Split Jobs
              </button>
            )}
            {/* Revert Split button for split-completed orders */}
            {status === 'split' && (
              <button 
                onClick={() => revertSplitOrder(order)} 
                className="btn-secondary text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Revert Split
              </button>
            )}
            {/* Assign Job button for single-service orders or split-completed orders */}
            {(status === 'single' || status === 'split') && (
              <button
                onClick={() => handleAssignJob(order)}
                className="btn-primary text-sm"
              >
                <Users className="h-4 w-4 mr-1" /> Assign Job
              </button>
            )}
            {/* Other status/action buttons remain unchanged */}
            {status === 'assigned' && (
              <>
                <button 
                  onClick={() => handleCompleteOrder(order)} 
                  className="btn-primary text-sm"
                >
                  <Check className="h-4 w-4 mr-1" /> Complete
                </button>
                <button 
                  onClick={() => handleCancelOrder(order)} 
                  className="btn-secondary text-sm"
                >
                  <Ban className="h-4 w-4 mr-1" /> Cancel
                </button>
              </>
            )}
            {status === 'accepted' && (
              <span className="text-sm text-green-600 font-medium">
                <UserCheck className="h-4 w-4 inline mr-1" />
                Accepted by Bubbler
              </span>
            )}
            {status === 'declined' && (
              <span className="text-sm text-red-600 font-medium">
                <UserX className="h-4 w-4 inline mr-1" />
                Declined by Bubbler
              </span>
            )}
            {status === 'arrival' && (
              <span className="text-sm text-orange-600 font-medium">
                <MapPin className="h-4 w-4 inline mr-1" />
                Bubbler Arrived
              </span>
            )}
          </div>
          <button 
            onClick={() => handleViewOrderDetails(order)}
            className="btn-secondary text-sm"
          >
            <Eye className="h-4 w-4 mr-1" /> Details
          </button>
        </div>
      </div>
    );
  };

  OrderCard.propTypes = {
    order: PropTypes.shape({
      '_date': PropTypes.string,
      'Job Split Status': PropTypes.string,
      'Order ID': PropTypes.string,
      'Order Status': PropTypes.string,
      'Split Status': PropTypes.string,
      address: PropTypes.string,
      email: PropTypes.string,
      jobs: PropTypes.arrayOf(PropTypes.shape({
        addons: PropTypes.array,
        bagTypes: PropTypes.array,
        perk: PropTypes.string,
        service: PropTypes.string,
        tier: PropTypes.string,
        totalBags: PropTypes.number
      })),
      name: PropTypes.string,
      orderId: PropTypes.string,
      phone: PropTypes.string,
      services: PropTypes.string,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 mb-4">
        <div>
          {/* No duplicate heading here. Only subheading remains. */}
          <p className="text-gray-600 mb-4">Manage incoming orders from Supabase — split multi-service orders to create jobs.</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button className="btn-secondary" onClick={() => window.location.href = '/jobs'}>
            <ExternalLink className="h-4 w-4 mr-2" /> View Jobs
          </button>
          <button className="btn-secondary" onClick={loadOrders}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Needs Split</option>
              <option value="single">Single Service</option>
              <option value="split">Split Completed</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted by Bubbler</option>
              <option value="declined">Declined by Bubbler</option>
              <option value="arrival">Bubbler Arrived</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Orders grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order, index) => (
          <OrderCard key={order['Order ID'] || order.orderId || index} order={order} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your filters or refresh the page.</p>
        </div>
      )}

      {/* Split Confirmation Modal */}
      {showSplitModal && splitConfirmation && (
        <Modal title="Confirm Split Order" onClose={() => { setShowSplitModal(false); setSplitConfirmation(null); }}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Confirm Split Order</h3>
              <p className="text-blue-800 mb-2">
                <strong>Customer:</strong> {splitConfirmation.customerName}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Order ID:</strong> {splitConfirmation.orderId}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Services to split:</strong>
              </p>
              <ul className="list-disc list-inside text-blue-800 ml-4">
                {splitConfirmation.services.map((service, index) => (
                  <li key={service.originalIndex || service.service + '-' + (service.tier || '') + '-' + index}>{service.service || service}</li>
                ))}
              </ul>
              <p className="text-blue-800 mt-2">
                This will create <strong>{splitConfirmation.servicesCount} separate jobs</strong> with JOB-#### IDs.
              </p>
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={confirmSplitOrder} className="btn-primary flex-1">
                <Split className="h-4 w-4 mr-2" /> Confirm Split
              </button>
              <button onClick={() => { setShowSplitModal(false); setSplitConfirmation(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedOrder && (
        <Modal title="Complete Order" onClose={() => { setShowCompletionModal(false); setSelectedOrder(null); }}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Complete Order</h3>
              <p className="text-green-800"><strong>Customer:</strong> {selectedOrder.name}</p>
              <p className="text-green-800"><strong>Order ID:</strong> {selectedOrder['Order ID'] || selectedOrder.orderId}</p>
              <p className="text-green-800"><strong>Services:</strong> {parseServicesForSplitting(selectedOrder.services).map(s => s.service).join(', ')}</p>
              <p className="text-green-800"><strong>Total:</strong> ${selectedOrder.total?.toFixed(2)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Completion Notes (Optional)</label>
              <textarea
                placeholder="Add any notes about the completion..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                rows="3"
                id="completionNotes"
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={() => completeOrder(selectedOrder['Order ID'] || selectedOrder.orderId, document.getElementById('completionNotes')?.value || '')} 
                className="btn-primary flex-1"
              >
                <Check className="h-4 w-4 mr-2" /> Mark Complete
              </button>
              <button onClick={() => { setShowCompletionModal(false); setSelectedOrder(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && selectedOrder && (
        <Modal title="Cancel Order" onClose={() => { setShowCancellationModal(false); setSelectedOrder(null); }}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Cancel Order</h3>
              <p className="text-red-800"><strong>Customer:</strong> {selectedOrder.name}</p>
              <p className="text-red-800"><strong>Order ID:</strong> {selectedOrder['Order ID'] || selectedOrder.orderId}</p>
              <p className="text-red-800"><strong>Services:</strong> {parseServicesForSplitting(selectedOrder.services).map(s => s.service).join(', ')}</p>
              <p className="text-red-800"><strong>Total:</strong> ${selectedOrder.total?.toFixed(2)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason (Required)</label>
              <textarea
                placeholder="Please provide a reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                rows="3"
                id="cancellationReason"
                required
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={() => {
                  const reason = document.getElementById('cancellationReason')?.value;
                  if (!reason?.trim()) {
                    alert('Please provide a cancellation reason.');
                    return;
                  }
                  cancelOrder(selectedOrder['Order ID'] || selectedOrder.orderId, reason);
                }} 
                className="btn-secondary flex-1"
              >
                <Ban className="h-4 w-4 mr-2" /> Cancel Order
              </button>
              <button onClick={() => { setShowCancellationModal(false); setSelectedOrder(null); }} className="btn-primary flex-1">Keep Order</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <Modal title="Order Details" onClose={() => { setShowOrderDetailsModal(false); setSelectedOrder(null); }}>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" /> {selectedOrder.address || 'No address'}
                </div>
                {selectedOrder.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" /> {selectedOrder.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" /> {selectedOrder._date ? new Date(selectedOrder._date).toLocaleDateString() : 'No date'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" /> Total: ${selectedOrder.total?.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Services</h3>
              <div className="space-y-2">
                {parseServicesForSplitting(selectedOrder.services).map((service, index) => (
                  <div key={service.originalIndex || service.service + '-' + (service.tier || '') + '-' + index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(service.service)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.service}</p>
                        {service.tier && (
                          <p className="text-xs text-gray-600">Tier: {service.tier}</p>
                        )}
                        {service.addons && service.addons.length > 0 && (
                          <p className="text-xs text-gray-600">
                            Add-ons: {service.addons.map(a => typeof a === 'string' ? a : a.name || JSON.stringify(a)).join(', ')}
                          </p>
                        )}
                        {service.bagTypes && (
                          <p className="text-xs text-gray-600">
                            Bags: {service.totalBags} ({service.bagTypes.map(b => `${b.quantity} ${b.type}`).join(', ')})
                          </p>
                        )}
                        {/* Perks */}
                        {(() => {
                          const perks = getPerks(service.service, service.tier);
                          return perks && perks.length > 0 ? (
                            <PerkDisplay perks={perks} />
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${(selectedOrder.total / parseServicesForSplitting(selectedOrder.services).length).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{selectedOrder.notes || 'No notes'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Job Modal */}
      {showAssignModal && assignOrder && (
        <Modal title="Assign Job" onClose={() => setShowAssignModal(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Order Details:</h3>
              <div className="text-sm text-gray-700">
                <div><span className="font-medium">Customer:</span> {assignOrder.name}</div>
                <div><span className="font-medium">Service:</span> {parseServicesForSplitting(assignOrder.services)[0]?.service}</div>
                <div><span className="font-medium">Total:</span> ${assignOrder.total || 0}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Select Bubbler:</h3>
              {availableBubblers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-lg font-medium mb-2">No Available Bubblers</div>
                  <div className="text-sm">No bubblers have permission for this service type.</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableBubblers.map((bubbler) => (
                    <div
                      key={bubbler.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBubbler?.id === bubbler.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedBubbler(bubbler)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{bubbler.name}</div>
                          <div className="text-sm text-gray-600">{bubbler.email}</div>
                          <div className="text-xs text-gray-500">
                            Rating: {bubbler.rating} ★ | Completed: {bubbler.jobsCompleted}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            ${bubbler.totalEarnings.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Total Earnings</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedBubbler && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Selected:</span> {selectedBubbler.name}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedBubbler}
                className={`px-4 py-2 rounded transition-colors ${
                  selectedBubbler
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign Job
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders; 