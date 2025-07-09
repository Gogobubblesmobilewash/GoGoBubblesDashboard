import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            GoGoBubbles
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional Mobile Services
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 p-4 rounded-xl">
              <h3 className="font-semibold text-cyan-800 mb-2">Car Wash</h3>
              <p className="text-sm text-cyan-600">Professional mobile car washing</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-800 mb-2">Home Cleaning</h3>
              <p className="text-sm text-blue-600">Deep cleaning services</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-semibold text-green-800 mb-2">Laundry</h3>
              <p className="text-sm text-green-600">Wash, dry, fold & delivery</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            to="/booking"
            className="inline-block w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-4 px-8 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Book Your Service
          </Link>
          
          <Link
            to="/login"
            className="inline-block w-full bg-gray-100 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            Staff Login
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Professional mobile services at your doorstep</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 