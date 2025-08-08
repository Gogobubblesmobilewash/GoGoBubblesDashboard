import React, { useState, useEffect } from 'react';
import {
  FiClock,
  FiUsers,
  FiDollarSign,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiShield,
  FiAward,
  FiSettings
} from 'react-icons/fi';

const HustleLogicSystem = () => {
  const [bubblerStats, setBubblerStats] = useState({
    averageRating: 4.8,
    onTimeArrival: 92,
    qualityCheckFails: 0,
    photoCompliance: 100,
    totalEarnings: 1250,
    jobsCompleted: 45,
    hustleBonusEarned: 120
  });

  const [currentJob, setCurrentJob] = useState(null);
  const [jobAssignments, setJobAssignments] = useState([]);
  const [optOutStatus, setOptOutStatus] = useState(false);

  // Job Type Logic
  const determineJobAssignment = (estimatedDuration) => {
    if (estimatedDuration <= 240) { // 4 hours
      return { type: 'solo', bubblers: 1, maxDuration: 240 };
    } else if (estimatedDuration <= 480) { // 8 hours
      return { type: 'dual', bubblers: 2, maxDuration: 480 };
    } else {
      return { type: 'team', bubblers: 3, maxDuration: 720 };
    }
  };

  // Hustle Bonus Calculation
  const calculateHustleBonus = (remainingPayout) => {
    return remainingPayout + 8; // Base remaining + $8 bonus
  };

  // Opt-out Eligibility Check
  const checkOptOutEligibility = () => {
    return (
      bubblerStats.averageRating >= 4.8 &&
      bubblerStats.onTimeArrival >= 90 &&
      bubblerStats.qualityCheckFails <= 1 &&
      bubblerStats.photoCompliance === 100
    );
  };

  // Task Completion Tracking
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  const completeTask = (taskId, beforePhoto, afterPhoto) => {
    if (!beforePhoto || !afterPhoto) {
      alert('Both before and after photos are required to complete a task');
      return;
    }

    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      const completedTask = {
        ...task,
        completedAt: new Date(),
        beforePhoto,
        afterPhoto,
        timeSpent: Date.now() - task.startedAt
      };

      setCompletedTasks([...completedTasks, completedTask]);
      setPendingTasks(pendingTasks.filter(t => t.id !== taskId));
      
      // Update earnings
      setBubblerStats(prev => ({
        ...prev,
        totalEarnings: prev.totalEarnings + task.payout
      }));
    }
  };

  // Performance Metrics
  const calculatePerformanceMetrics = () => {
    const totalJobs = bubblerStats.jobsCompleted;
    const avgEarningsPerJob = bubblerStats.totalEarnings / totalJobs;
    const hustleBonusRate = (bubblerStats.hustleBonusEarned / bubblerStats.totalEarnings) * 100;

    return {
      avgEarningsPerJob: avgEarningsPerJob.toFixed(2),
      hustleBonusRate: hustleBonusRate.toFixed(1),
      efficiency: ((completedTasks.length / (completedTasks.length + pendingTasks.length)) * 100).toFixed(1)
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 GoGoBubbles Hustle System
          </h1>
          <p className="text-gray-600">
            Earn more by hustling harder. Complete tasks faster, earn bonuses, and unlock solo-only privileges.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiDollarSign className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${bubblerStats.totalEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiStar className="text-yellow-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{bubblerStats.averageRating}/5.0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiTrendingUp className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Hustle Bonus</p>
                <p className="text-2xl font-bold">${bubblerStats.hustleBonusEarned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Jobs Completed</p>
                <p className="text-2xl font-bold">{bubblerStats.jobsCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Assignment Logic */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FiUsers className="mr-2" />
            Job Assignment Logic
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-green-600 mb-2">Solo Jobs</h3>
              <p className="text-sm text-gray-600">≤ 4 hours</p>
              <p className="text-sm text-gray-600">1 Bubbler</p>
              <p className="text-sm text-gray-600">Full payout</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-blue-600 mb-2">Dual Jobs</h3>
              <p className="text-sm text-gray-600">4-8 hours</p>
              <p className="text-sm text-gray-600">2 Bubblers</p>
              <p className="text-sm text-gray-600">Split payout</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-purple-600 mb-2">Team Jobs</h3>
              <p className="text-sm text-gray-600">8+ hours</p>
              <p className="text-sm text-gray-600">3 Bubblers</p>
              <p className="text-sm text-gray-600">Split payout</p>
            </div>
          </div>
        </div>

        {/* Opt-out System */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FiAward className="mr-2" />
            Solo-Only Opt-out System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Eligibility Requirements</h3>
              <div className="space-y-2">
                <div className={`flex items-center ${bubblerStats.averageRating >= 4.8 ? 'text-green-600' : 'text-red-600'}`}>
                  <FiCheckCircle className="mr-2" />
                  Average Rating: {bubblerStats.averageRating}/4.8
                </div>
                <div className={`flex items-center ${bubblerStats.onTimeArrival >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                  <FiCheckCircle className="mr-2" />
                  On-time Arrival: {bubblerStats.onTimeArrival}%/90%
                </div>
                <div className={`flex items-center ${bubblerStats.qualityCheckFails <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  <FiCheckCircle className="mr-2" />
                  Quality Fails: {bubblerStats.qualityCheckFails}/1
                </div>
                <div className={`flex items-center ${bubblerStats.photoCompliance === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  <FiCheckCircle className="mr-2" />
                  Photo Compliance: {bubblerStats.photoCompliance}%/100%
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className={`p-4 rounded-lg ${checkOptOutEligibility() ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
                <p className={`font-semibold ${checkOptOutEligibility() ? 'text-green-800' : 'text-red-800'}`}>
                  {checkOptOutEligibility() ? '✅ Eligible for Solo-Only' : '❌ Not Eligible'}
                </p>
                <p className="text-sm mt-2">
                  {checkOptOutEligibility() 
                    ? 'You can opt out of team jobs and take solo assignments only.'
                    : 'Keep improving your performance to unlock solo-only privileges.'
                  }
                </p>
              </div>
              
              {checkOptOutEligibility() && (
                <button 
                  className={`mt-4 px-4 py-2 rounded-lg font-semibold ${optOutStatus ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                  onClick={() => setOptOutStatus(!optOutStatus)}
                >
                  {optOutStatus ? 'Opt Back Into Team Jobs' : 'Opt Out of Team Jobs'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FiTrendingUp className="mr-2" />
            Performance Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${performanceMetrics.avgEarningsPerJob}</p>
              <p className="text-sm text-gray-600">Avg Earnings per Job</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{performanceMetrics.hustleBonusRate}%</p>
              <p className="text-sm text-gray-600">Hustle Bonus Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{performanceMetrics.efficiency}%</p>
              <p className="text-sm text-gray-600">Task Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Hustle Bonus System */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FiDollarSign className="mr-2" />
            Hustle Bonus System
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💰 Hustle Bonus Rules</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Take over incomplete jobs and earn base remaining payout + $8 bonus</li>
              <li>• Original bubbler keeps earnings for completed work</li>
              <li>• No penalties for job handoffs</li>
              <li>• Faster completion = faster earnings</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Example Hustle Bonus</h3>
              <p className="text-sm text-gray-600">$45 job → Original completed 15% = $10 payout</p>
              <p className="text-sm text-gray-600">Hustler finishes 85% = $35 + $8 bonus = $43 total</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Quality Safeguards</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Before/after photos required</li>
                <li>• Real-time task tracking</li>
                <li>• Quality flag system</li>
                <li>• Manual review for issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HustleLogicSystem; 