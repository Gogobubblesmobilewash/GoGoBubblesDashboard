import React from 'react';

const Analytics = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Analytics Dashboard</h1>
        <p className="text-blue-700 mb-4">Analytics component is working!</p>
        <p className="text-sm text-blue-600">Time: {new Date().toLocaleString()}</p>
        <p className="text-sm text-blue-600">Component: Analytics.jsx</p>
      </div>
    </div>
  );
};

export default Analytics; 