import React from 'react';

const Dashboard = () => {
  console.log('Dashboard component mounted - minimal test');
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Dashboard Test</h1>
        <p className="text-green-700 mb-4">If you can see this, the Dashboard component is working!</p>
        <p className="text-sm text-green-600">Time: {new Date().toLocaleString()}</p>
        <p className="text-sm text-green-600">Component: Dashboard.jsx</p>
      </div>
    </div>
  );
};

export default Dashboard;
