import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiTruck, FiPackage, FiCalendar, FiClock, FiMapPin, FiCheckCircle } from 'react-icons/fi';

const BookingPage = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const services = [
    {
      id: 'home-cleaning',
      icon: FiHome,
      title: 'Home Cleaning',
      description: 'Professional house cleaning services',
      startingPrice: '$89',
      features: ['Deep cleaning', 'Regular maintenance', 'Eco-friendly options']
    },
    {
      id: 'mobile-car-wash',
      icon: FiTruck,
      title: 'Mobile Car Wash',
      description: 'Convenient mobile car detailing',
      startingPrice: '$45',
      features: ['Express wash', 'Signature detail', 'Supreme detail']
    },
    {
      id: 'laundry-service',
      icon: FiPackage,
      title: 'Laundry Service',
      description: 'Pickup and delivery laundry',
      startingPrice: '$25',
      features: ['Wash & fold', 'Dry cleaning', 'Same-day service']
    }
  ];

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle booking submission
    console.log('Booking submitted:', { selectedService, selectedDate, selectedTime });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/public/Bubblerlogotransparent.PNG" 
                alt="GoGoBubbles" 
                className="h-12 w-auto"
              />
              <span className="text-2xl font-bold text-gray-900">GoGoBubbles</span>
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Service
          </h1>
          <p className="text-xl text-gray-600">
            Choose your service and schedule your appointment
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Select Your Service
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedService === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="text-center">
                      <service.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        Starting at {service.startingPrice}
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <FiCheckCircle className="text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date and Time Selection */}
            {selectedService && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Schedule Your Appointment
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="inline mr-2" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiClock className="inline mr-2" />
                      Select Time
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline mr-2" />
                    Service Address
                  </label>
                  <textarea
                    placeholder="Enter your full address for service"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedService && selectedDate && selectedTime && (
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Book Your Service
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  You'll receive a confirmation email with service details
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What to Expect
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="text-green-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Professional Team</h4>
                <p className="text-sm text-gray-600">Trained and vetted cleaning professionals</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="text-green-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Flexible Scheduling</h4>
                <p className="text-sm text-gray-600">Choose the time that works best for you</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="text-green-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Satisfaction Guaranteed</h4>
                <p className="text-sm text-gray-600">100% satisfaction or we'll make it right</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
