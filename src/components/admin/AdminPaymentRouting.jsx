import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import {
  FiDollarSign, FiUser, FiShield, FiTarget, FiMessageCircle,
  FiMapPin, FiUsers, FiActivity, FiClock, FiCheckCircle,
  FiAlertTriangle, FiDatabase, FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AdminPaymentRouting = ({ assumedRole, jobData, takeoverType }) => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Service-specific hourly rates and bonuses
  const serviceRates = {
    fresh: { hourly: 17.00, bonus: 10.00, name: 'Laundry' },
    sparkle: { hourly: 20.00, bonus: 15.00, name: 'Home Cleaning' },
    shine: { hourly: 22.00, bonus: 20.00, name: 'Car Wash' }
  };

  // Full takeover tiers based on completion percentage
  const fullTakeoverTiers = [
    { range: [0, 0], leadPay: 45, bonus: 10 },    // 0% completed = No show/abandonment
    { range: [1, 29], leadPay: 35, bonus: 8 },    // 1-29% completed
    { range: [30, 49], leadPay: 25, bonus: 5 },   // 30-49% completed
    { range: [50, 50], leadPay: 22.5, bonus: 3 }, // 50% completed
  ];

  useEffect(() => {
    if (assumedRole && jobData) {
      calculateAdminPayment();
    }
  }, [assumedRole, jobData, takeoverType]);

  const calculateAdminPayment = async () => {
    setLoading(true);
    try {
      let payment = {
        admin_id: 'ADMIN-001',
        labor_type: 'internal_labor',
        payout_routing: 'admin_account',
        timestamp: new Date().toISOString(),
        assumed_role: assumedRole,
        job_id: jobData?.id,
        service_type: jobData?.service_type,
        job_amount: jobData?.amount || 45
      };

      if (takeoverType === 'full') {
        payment = {
          ...payment,
          takeover_type: 'full',
          percent_completed: jobData?.percent_completed || 0,
          ...calculateFullTakeoverPayment(jobData)
        };
      } else if (takeoverType === 'partial') {
        payment = {
          ...payment,
          takeover_type: 'partial',
          rework_hours: jobData?.rework_hours || 1.5,
          ...calculatePartialTakeoverPayment(jobData)
        };
      } else {
        payment = {
          ...payment,
          takeover_type: 'light_assistance',
          assistance_hours: jobData?.assistance_hours || 0.5,
          ...calculateLightAssistancePayment(jobData)
        };
      }

      setPaymentDetails(payment);
    } catch (error) {
      console.error('Error calculating admin payment:', error);
      toast.error('Failed to calculate payment');
    } finally {
      setLoading(false);
    }
  };

  const calculateFullTakeoverPayment = (jobData) => {
    const percentCompleted = jobData?.percent_completed || 0;
    const jobAmount = jobData?.amount || 45;
    
    const tier = fullTakeoverTiers.find(t => 
      percentCompleted >= t.range[0] && percentCompleted <= t.range[1]
    );

    return {
      admin_payout: tier.leadPay,
      admin_bonus: tier.bonus,
      total_admin_payment: tier.leadPay + tier.bonus,
      original_bubbler_payout: jobAmount - tier.leadPay,
      company_bonus_cost: tier.bonus, // Company pays bonus to lead
      payment_notes: `Full takeover - Admin gets tier ${tier.range[0]}-${tier.range[1]}% payment + company bonus`
    };
  };

  const calculatePartialTakeoverPayment = (jobData) => {
    const serviceType = jobData?.service_type || 'sparkle';
    const reworkHours = jobData?.rework_hours || 1.5;
    const jobAmount = jobData?.amount || 45;
    const serviceRate = serviceRates[serviceType];

    const hourlyPay = serviceRate.hourly * reworkHours;
    const bonus = serviceRate.bonus;
    const totalAdminPayment = hourlyPay + bonus;
    const penalty = bonus; // Penalty transferred from original bubbler to lead

    return {
      admin_hourly_pay: hourlyPay,
      admin_bonus: bonus,
      total_admin_payment: totalAdminPayment,
      original_bubbler_payout: jobAmount - penalty,
      penalty_transfer: penalty, // Penalty transferred from original bubbler to lead
      company_bonus_cost: 0, // No company bonus for partial takeovers
      payment_notes: `Partial takeover - Admin gets hourly + penalty transfer from original bubbler`
    };
  };

  const calculateLightAssistancePayment = (jobData) => {
    const serviceType = jobData?.service_type || 'sparkle';
    const assistanceHours = jobData?.assistance_hours || 0.5;
    const serviceRate = serviceRates[serviceType];

    const hourlyPay = serviceRate.hourly * assistanceHours;

    return {
      admin_hourly_pay: hourlyPay,
      admin_bonus: 0,
      total_admin_payment: hourlyPay,
      original_bubbler_payout: jobData?.amount || 45,
      company_revenue: 0,
      payment_notes: 'Light assistance - Admin gets hourly rate only'
    };
  };

  const processAdminPayment = async () => {
    if (!paymentDetails) return;

    try {
      setLoading(true);
      
      // Simulate payment processing
      const paymentRecord = {
        ...paymentDetails,
        status: 'processed',
        processed_at: new Date().toISOString(),
        admin_override: true
      };

      // In real implementation, this would:
      // 1. Update admin account balance
      // 2. Log payment in admin_override_logs
      // 3. Update job assignment records
      // 4. Process original bubbler penalties
      // 5. Update company revenue

      toast.success(`Payment processed: $${paymentDetails.total_admin_payment} routed to admin account as internal labor`);
      
      // Log the payment
      const paymentLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: 'success',
        role: 'admin',
        message: `Admin payment processed for ${assumedRole} role`,
        details: {
          admin_id: 'ADMIN-001',
          payment_amount: paymentDetails.total_admin_payment,
          labor_type: 'internal_labor',
          job_id: paymentDetails.job_id,
          takeover_type: paymentDetails.takeover_type
        }
      };

      // In real implementation, this would be added to the logs
      console.log('Payment processed:', paymentRecord);
      console.log('Payment log:', paymentLog);

    } catch (error) {
      console.error('Error processing admin payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (!paymentDetails) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Admin Payment Routing</h3>
        <div className="flex items-center space-x-2">
          <FiDollarSign className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-500">Internal labor payment processing</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Details */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Admin Payment</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Role Assumed:</span>
                <span className="font-medium">{assumedRole}</span>
              </div>
              <div className="flex justify-between">
                <span>Takeover Type:</span>
                <span className="font-medium capitalize">{paymentDetails.takeover_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor Type:</span>
                <span className="font-medium text-green-600">Internal Labor</span>
              </div>
              <div className="flex justify-between">
                <span>Payout Routing:</span>
                <span className="font-medium text-blue-600">Admin Account</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Payment Breakdown</h4>
            <div className="space-y-2 text-sm">
              {paymentDetails.admin_hourly_pay > 0 && (
                <div className="flex justify-between">
                  <span>Hourly Pay:</span>
                  <span className="font-medium">${paymentDetails.admin_hourly_pay.toFixed(2)}</span>
                </div>
              )}
              {paymentDetails.admin_bonus > 0 && (
                <div className="flex justify-between">
                  <span>Bonus:</span>
                  <span className="font-medium">${paymentDetails.admin_bonus.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total Admin Payment:</span>
                <span className="font-bold text-green-600">${paymentDetails.total_admin_payment.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Original Bubbler Impact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Job Amount:</span>
                <span>${paymentDetails.job_amount.toFixed(2)}</span>
              </div>
              {paymentDetails.penalty_transfer > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>Penalty Transfer:</span>
                    <span className="text-red-600">-${paymentDetails.penalty_transfer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Final Payout:</span>
                    <span className="font-medium">${paymentDetails.original_bubbler_payout.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Tier Payment:</span>
                    <span className="text-red-600">-${(paymentDetails.job_amount - paymentDetails.original_bubbler_payout).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Final Payout:</span>
                    <span className="font-medium">${paymentDetails.original_bubbler_payout.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Company Impact</h4>
            <div className="space-y-2 text-sm">
              {paymentDetails.company_bonus_cost > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>Company Bonus Cost:</span>
                    <span className="text-red-600">-${paymentDetails.company_bonus_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Labor Cost:</span>
                    <span className="text-red-600">-${paymentDetails.total_admin_payment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Company Cost:</span>
                    <span className="font-medium text-red-600">
                      -${(paymentDetails.company_bonus_cost + paymentDetails.total_admin_payment).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Penalty Transfer:</span>
                    <span className="text-gray-600">$0 (no company cost)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Labor Cost:</span>
                    <span className="text-red-600">-${paymentDetails.total_admin_payment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Company Cost:</span>
                    <span className="font-medium text-red-600">-${paymentDetails.total_admin_payment.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Notes */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">{paymentDetails.payment_notes}</p>
      </div>

      {/* Process Payment Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={processAdminPayment}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Process Admin Payment'}
        </button>
      </div>
    </div>
  );
};

export default AdminPaymentRouting; 