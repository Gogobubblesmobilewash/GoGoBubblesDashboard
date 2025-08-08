import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiTruck, FiPackage, FiStar, FiClock, FiMapPin, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const HomePage = () => {
  const services = [
    {
      icon: FiHome,
      title: 'Home Cleaning',
      description: 'Professional house cleaning services tailored to your needs',
      features: ['Deep cleaning', 'Regular maintenance', 'Eco-friendly options'],
      startingPrice: '$89'
    },
    {
      icon: FiTruck,
      title: 'Mobile Car Wash',
      description: 'Convenient mobile car detailing and washing at your location',
      features: ['Express wash', 'Signature detail', 'Supreme detail'],
      startingPrice: '$45'
    },
    {
      icon: FiPackage,
      title: 'Laundry Service',
      description: 'Pickup and delivery laundry service with premium care',
      features: ['Wash & fold', 'Dry cleaning', 'Same-day service'],
      startingPrice: '$25'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      location: 'Houston, TX',
      rating: 5,
      comment: 'Amazing service! My house has never been cleaner. The team was professional and thorough.'
    },
    {
      name: 'Mike R.',
      location: 'Houston, TX',
      rating: 5,
      comment: 'Best mobile car wash I\'ve ever used. They came to my office and my car looks brand new!'
    },
    {
      name: 'Jennifer L.',
      location: 'Houston, TX',
      rating: 5,
      comment: 'The laundry service is a lifesaver. Everything comes back perfectly clean and folded.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img 
                  src="/public/Bubblerlogotransparent.PNG" 
                  alt="GoGoBubbles" 
                  className="h-12 w-auto"
                />
                <span className="text-2xl font-bold text-gray-900">GoGoBubbles</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/booking" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Book Now
              </Link>
              <Link 
                to="/jobs" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Join Our Team
              </Link>
              <Link 
                to="/feedback" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Feedback
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <Link
                to="/booking"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Cleaning Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              We bring the bubbles to you! Home cleaning, mobile car wash, and laundry services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Book Now
                <FiArrowRight className="ml-2" />
              </Link>
              <Link
                to="/jobs"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Join Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <service.icon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    Starting at {service.startingPrice}
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <FiCheckCircle className="text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/booking"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Book {service.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GoGoBubbles?
            </h2>
            <p className="text-xl text-gray-600">
              Professional, reliable, and convenient cleaning services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <FiStar className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">5-Star Service</h3>
              <p className="text-gray-600">Consistently rated 5 stars by our customers</p>
            </div>
            <div className="text-center">
              <FiClock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">Book at your convenience, we work around your schedule</p>
            </div>
            <div className="text-center">
              <FiMapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Service</h3>
              <p className="text-gray-600">We come to you - no need to drive anywhere</p>
            </div>
            <div className="text-center">
              <FiCheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Guaranteed Quality</h3>
              <p className="text-gray-600">100% satisfaction guaranteed on all services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your first service today and experience the GoGoBubbles difference!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Book Your Service Now
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Become a Bubbler CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            Ready to make a splash with us? Join a welcoming team, redefine convenience for busy families where every day is a new adventure. Come be a part of something special, become a Bubbler today and start your GoGoBubbles journey.
          </p>
          <div className="flex justify-center">
            <Link
              to="/jobs"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 md:px-12 md:py-5 rounded-lg font-semibold text-lg md:text-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg w-full md:w-auto"
              aria-label="Become a Bubbler – Join the GoGoBubbles team"
            >
              Become a Bubbler
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/public/Bubblerlogotransparent.PNG" 
                  alt="GoGoBubbles" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold">GoGoBubbles</span>
              </div>
              <p className="text-gray-300 mb-4">
                Professional cleaning services for your home and vehicle. 
                We bring the bubbles to you!
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link to="/booking" className="text-gray-300 hover:text-white">Home Cleaning</Link></li>
                <li><Link to="/booking" className="text-gray-300 hover:text-white">Mobile Car Wash</Link></li>
                <li><Link to="/booking" className="text-gray-300 hover:text-white">Laundry Service</Link></li>
                <li><Link to="/booking" className="text-gray-300 hover:text-white">Deep Cleaning</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">Houston, TX</li>
                <li><a href="tel:+1234567890" className="text-gray-300 hover:text-white">(123) 456-7890</a></li>
                <li><a href="mailto:info@gogobubbles.com" className="text-gray-300 hover:text-white">info@gogobubbles.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 GoGoBubbles. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
