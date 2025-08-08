import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';

export default function ManualLinkGenerator() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderServices, setOrderServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [assignedBubbler, setAssignedBubbler] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [emailPreview, setEmailPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7'); // days
  const [includeTip, setIncludeTip] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, [dateRange]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      let query = supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          created_at,
          order_service (
            id,
            service_type,
            job_assignments (
              id,
              bubbler_id,
              bubblers (
                id,
                first_name,
                last_name
              )
            )
          )
        `)
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setSelectedService(null);
    setAssignedBubbler(null);
    setGeneratedLink('');
    setEmailPreview('');

    // Extract services for this order
    const services = order.order_service || [];
    setOrderServices(services);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    
    // Find the assigned bubbler for this service
    const jobAssignment = service.job_assignments?.[0];
    if (jobAssignment?.bubblers) {
      setAssignedBubbler(jobAssignment.bubblers);
    } else {
      setAssignedBubbler(null);
    }

    generateLink(service);
  };

  const generateLink = (service) => {
    if (!selectedOrder || !service) return;

    const baseUrl = 'https://gogobubbles.com/feedback.html';
    const params = new URLSearchParams({
      order_id: selectedOrder.id,
      serviceType: service.service_type
    });

    if (assignedBubbler) {
      params.append('bubbler_id', assignedBubbler.id);
    }

    if (includeTip) {
      params.append('tip', 'true');
    }

    const link = `${baseUrl}?${params.toString()}`;
    setGeneratedLink(link);
    generateEmailPreview(link, service);
  };

  const generateEmailPreview = (link, service) => {
    const bubblerName = assignedBubbler 
      ? `${assignedBubbler.first_name} ${assignedBubbler.last_name}`
      : 'your bubbler';

    const emailText = `Hi ${selectedOrder.customer_name},

Thank you for choosing GoGoBubbles for your ${service.service_type} service!

We'd love to hear about your experience with ${bubblerName}. Your feedback helps us improve and ensures our bubblers get the recognition they deserve.

Please take a moment to rate your service:
${link}

What you can do:
• Rate your experience (1-5 stars)
• Leave comments about the service
• Tip your bubbler (optional)

Your feedback is completely anonymous to the bubbler, but helps us maintain quality standards.

Thank you for choosing GoGoBubbles!

Best regards,
The GoGoBubbles Team`;

    setEmailPreview(emailText);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!orders.length) return;

    const csvData = orders.map(order => {
      const services = order.order_service || [];
      return services.map(service => {
        const jobAssignment = service.job_assignments?.[0];
        const bubbler = jobAssignment?.bubblers;
        const bubblerName = bubbler ? `${bubbler.first_name} ${bubbler.last_name}` : 'Unassigned';
        
        const link = generateLinkForExport(order, service);
        
        return {
          'Order ID': order.id,
          'Customer Name': order.customer_name,
          'Customer Email': order.customer_email,
          'Service Type': service.service_type,
          'Bubbler': bubblerName,
          'Feedback Link': link,
          'Order Date': new Date(order.created_at).toLocaleDateString()
        };
      });
    }).flat();

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_links_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateLinkForExport = (order, service) => {
    const baseUrl = 'https://gogobubbles.com/feedback.html';
    const params = new URLSearchParams({
      order_id: order.id,
      serviceType: service.service_type
    });

    const jobAssignment = service.job_assignments?.[0];
    if (jobAssignment?.bubblers) {
      params.append('bubbler_id', jobAssignment.bubblers.id);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Manual Link Generator</h2>
        <p className="text-gray-600">Generate feedback links for multi-service orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <input
              type="text"
              placeholder="Customer name or Order ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Orders'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Order & Service</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={selectedOrder?.id || ''}
                onChange={(e) => {
                  const order = orders.find(o => o.id === e.target.value);
                  handleOrderSelect(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an order...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id.slice(-6)} - {order.customer_name} - {new Date(order.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service
                </label>
                <select
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const service = orderServices.find(s => s.id === e.target.value);
                    handleServiceSelect(service);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a service...</option>
                  {orderServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.service_type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assignedBubbler && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Bubbler
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {assignedBubbler.first_name} {assignedBubbler.last_name}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => {
                    setIncludeTip(e.target.checked);
                    if (selectedService) {
                      generateLink(selectedService);
                    }
                  }}
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700">Include tip prompt in feedback form</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={alreadySent}
                  onChange={(e) => setAlreadySent(e.target.checked)}
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700">Mark as already sent (internal tracking)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Generated Link */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Generated Link</h3>
          
          {generatedLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedLink)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Preview
                </label>
                <textarea
                  value={emailPreview}
                  readOnly
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
                />
                <button
                  onClick={() => copyToClipboard(emailPreview)}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Copy Email Text
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select an order and service to generate a feedback link
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Batch Export</h3>
            <p className="text-sm text-gray-600">Export all feedback links for the current filter</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!orders.length}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Export to CSV ({orders.length} orders)
          </button>
        </div>
      </div>
    </div>
  );
} 