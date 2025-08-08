import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';

export default function FeedbackEmailManager() {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);

  useEffect(() => {
    loadPendingEmails();
  }, []);

  const loadPendingEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_feedback_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingEmails(data || []);
    } catch (error) {
      console.error('Error loading pending emails:', error);
    }
  };

  const sendSelectedEmails = async () => {
    if (selectedEmails.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/send-feedback-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: selectedEmails })
      });

      if (!response.ok) throw new Error('Failed to send emails');

      await loadPendingEmails();
      setSelectedEmails([]);
      alert(`Successfully sent ${selectedEmails.length} feedback emails!`);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (emailId) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const selectAll = () => {
    setSelectedEmails(pendingEmails.map(email => email.id));
  };

  const deselectAll = () => {
    setSelectedEmails([]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Feedback Email Manager</h2>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Deselect All
          </button>
          <button
            onClick={sendSelectedEmails}
            disabled={loading || selectedEmails.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : `Send ${selectedEmails.length} Emails`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedEmails.length === pendingEmails.length && pendingEmails.length > 0}
                  onChange={selectedEmails.length === pendingEmails.length ? deselectAll : selectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bubbler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingEmails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={() => toggleEmailSelection(email.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {email.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {email.customer_email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {email.service_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {email.bubbler_first_name} {email.bubbler_last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(email.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => window.open(email.feedback_link, '_blank')}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {pendingEmails.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pending feedback emails
          </div>
        )}
      </div>
    </div>
  );
} 