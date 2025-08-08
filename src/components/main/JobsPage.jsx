import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiUsers, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const JobsPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  const jobListings = [
    {
      id: 1,
      title: 'House Cleaner',
      location: 'Houston, TX',
      type: 'Full-time',
      salary: '$15-20/hour',
      description: 'Join our team of professional house cleaners. We provide training and all necessary equipment.',
      requirements: [
        'Reliable transportation',
        'Attention to detail',
        'Customer service skills',
        'Physical stamina'
      ],
      benefits: [
        'Flexible scheduling',
        'Health insurance',
        'Performance bonuses',
        'Career growth opportunities'
      ]
    },
    {
      id: 2,
      title: 'Mobile Car Detailer',
      location: 'Houston, TX',
      type: 'Full-time',
      salary: '$18-25/hour',
      description: 'Professional car detailing at customer locations. We provide all equipment and supplies.',
      requirements: [
        'Valid driver\'s license',
        'Experience with car detailing preferred',
        'Attention to detail',
        'Customer service skills'
      ],
      benefits: [
        'Flexible scheduling',
        'Health insurance',
        'Performance bonuses',
        'Equipment provided'
      ]
    },
    {
      id: 3,
      title: 'Laundry Specialist',
      location: 'Houston, TX',
      type: 'Part-time',
      salary: '$12-16/hour',
      description: 'Handle pickup and delivery of laundry services. Great for students or part-time workers.',
      requirements: [
        'Reliable transportation',
        'Good organizational skills',
        'Customer service skills',
        'Attention to detail'
      ],
      benefits: [
        'Flexible hours',
        'Performance bonuses',
        'Part-time friendly',
        'Training provided'
      ]
    },
    {
      id: 4,
      title: 'Team Leader',
      location: 'Houston, TX',
      type: 'Full-time',
      salary: '$20-28/hour',
      description: 'Lead a team of cleaners and ensure quality service delivery. Management experience preferred.',
      requirements: [
        'Previous cleaning experience',
        'Leadership skills',
        'Customer service experience',
        'Valid driver\'s license'
      ],
      benefits: [
        'Health insurance',
        'Performance bonuses',
        'Career advancement',
        'Management training'
      ]
    }
  ];

  const handleApply = (jobId) => {
    // Handle job application
    console.log('Applying for job:', jobId);
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join Our Team
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Be part of a growing team that's making Houston cleaner, one service at a time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#jobs"
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                View Open Positions
                <FiArrowRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Work With GoGoBubbles?
            </h2>
            <p className="text-xl text-gray-600">
              We're not just a cleaning company - we're a team that values our people
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <FiUsers className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Great Team</h3>
              <p className="text-gray-600">Work with friendly, professional colleagues</p>
            </div>
            <div className="text-center">
              <FiClock className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Hours</h3>
              <p className="text-gray-600">Work around your schedule and commitments</p>
            </div>
            <div className="text-center">
              <FiDollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Competitive Pay</h3>
              <p className="text-gray-600">Earn what you're worth with performance bonuses</p>
            </div>
            <div className="text-center">
              <FiCheckCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Growth Opportunities</h3>
              <p className="text-gray-600">Advance your career with training and promotions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section id="jobs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600">
              Find the perfect role for you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {jobListings.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <FiBriefcase className="mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <FiDollarSign className="mr-1" />
                        {job.salary}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{job.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <FiCheckCircle className="text-green-500 mr-2" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <FiCheckCircle className="text-blue-500 mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handleApply(job.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Apply
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to join our team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Application</h3>
              <p className="text-gray-600">Fill out our online application form with your details</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview</h3>
              <p className="text-gray-600">Meet with our team to discuss the role and your experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Working</h3>
              <p className="text-gray-600">Complete training and begin your new career with us</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Questions About Working With Us?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're here to help you find the perfect role
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+1234567890"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Call Us: (123) 456-7890
            </a>
            <a
              href="mailto:jobs@gogobubbles.com"
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobsPage;
