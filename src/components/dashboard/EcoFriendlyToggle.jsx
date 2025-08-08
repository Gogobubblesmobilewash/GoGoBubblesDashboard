import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const EcoFriendlyToggle = () => {
  const { user } = useAuth();
  const [acceptsEcoJobs, setAcceptsEcoJobs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  useEffect(() => {
    if (user) {
      loadEcoFriendlyStatus();
    }
  }, [user]);

  const loadEcoFriendlyStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('bubblers')
        .select('accepts_eco_jobs')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAcceptsEcoJobs(data?.accepts_eco_jobs || false);
    } catch (error) {
      console.error('Error loading eco-friendly status:', error);
    }
  };

  const handleToggle = async () => {
    if (!acceptsEcoJobs) {
      // Show agreement modal when enabling
      setShowAgreement(true);
      return;
    }

    // Disable eco-friendly jobs
    await updateEcoFriendlyStatus(false);
  };

  const handleAgreementAccept = async () => {
    setShowAgreement(false);
    await updateEcoFriendlyStatus(true);
  };

  const updateEcoFriendlyStatus = async (status) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bubblers')
        .update({ accepts_eco_jobs: status })
        .eq('id', user.id);

      if (error) throw error;

      setAcceptsEcoJobs(status);
      toast.success(
        status 
          ? 'You are now accepting eco-friendly jobs!' 
          : 'You have opted out of eco-friendly jobs.'
      );
    } catch (error) {
      console.error('Error updating eco-friendly status:', error);
      toast.error('Failed to update eco-friendly status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
          Eco-Friendly Jobs
        </h3>
        <div className="flex items-center">
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              acceptsEcoJobs ? 'bg-green-600' : 'bg-gray-200'
            }`}
            onClick={handleToggle}
            disabled={loading}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                acceptsEcoJobs ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          {loading && (
            <div className="ml-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start">
          <FiInfo className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">What are Eco-Friendly Jobs?</p>
            <p>
              Customers can request eco-friendly cleaning products for their services. 
              When you accept eco-friendly jobs, you'll use approved green products and receive a $5 bonus per completed job.
            </p>
          </div>
        </div>

        {acceptsEcoJobs && (
          <div className="flex items-start bg-green-50 border border-green-200 rounded-lg p-3">
            <FiCheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">You're accepting eco-friendly jobs!</p>
              <p className="text-xs mt-1">
                You'll be matched with customers who request eco-friendly cleaning products.
                Remember to use approved green products for these jobs.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>
            <strong>Note:</strong> You must have approved eco-friendly cleaning products available 
            to accept these jobs. Contact support for the approved products list.
          </p>
        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Eco-Friendly Jobs Agreement
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-3">
                By enabling this option, I confirm that:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>I am equipped with approved eco-friendly cleaning products</li>
                <li>I understand I will only be matched with green jobs when customers request them</li>
                <li>I will be paid an additional $5 bonus for each completed eco job</li>
                <li>I will use only approved green products for eco-friendly jobs</li>
              </ul>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAgreement(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAgreementAccept}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Accept & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoFriendlyToggle; 