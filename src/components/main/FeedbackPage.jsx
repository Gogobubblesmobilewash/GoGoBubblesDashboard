import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiMessageSquare, FiThumbsUp, FiThumbsDown, FiSend } from 'react-icons/fi';

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [serviceType, setServiceType] = useState('');

  const serviceTypes = [
    'Home Cleaning',
    'Mobile Car Wash',
    'Laundry Service',
    'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle feedback submission
    console.log('Feedback submitted:', { rating, feedback, serviceType });
  };

  const recentReviews = [
    {
      name: 'Sarah M.',
      rating: 5,
      service: 'Home Cleaning',
      comment: 'Amazing service! My house has never been cleaner. The team was professional and thorough.',
      date: '2 days ago'
    },
    {
      name: 'Mike R.',
      rating: 5,
      service: 'Mobile Car Wash',
      comment: 'Best mobile car wash I\'ve ever used. They came to my office and my car looks brand new!',
      date: '1 week ago'
    },
    {
      name: 'Jennifer L.',
      rating: 5,
      service: 'Laundry Service',
      comment: 'The laundry service is a lifesaver. Everything comes back perfectly clean and folded.',
      date: '1 week ago'
    }
  ];

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
            Share Your Experience
          </h1>
          <p className="text-xl text-gray-600">
            We value your feedback and use it to improve our services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Feedback Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Leave Your Feedback
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a service</option>
                  {serviceTypes.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        star <= rating
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <FiStar className="w-8 h-8" />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 0 && 'Click to rate your experience'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageSquare className="inline mr-2" />
                  Your Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="6"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <FiSend className="mr-2" />
                Submit Feedback
              </button>
            </form>
          </div>

          {/* Recent Reviews */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Reviews
            </h2>
            
            <div className="space-y-4">
              {recentReviews.map((review, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <p className="text-sm text-gray-600">{review.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <FiStar key={i} className="w-4 h-4 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  <p className="text-sm text-gray-500">{review.date}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Satisfaction
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">4.9</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Need Help?
            </h2>
            <p className="text-gray-600 mb-6">
              If you have any questions or concerns, we're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+1234567890"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Call Us: (123) 456-7890
              </a>
              <a
                href="mailto:feedback@gogobubbles.com"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
