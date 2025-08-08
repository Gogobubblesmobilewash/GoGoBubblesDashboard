import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiStar, FiMessageSquare, FiSend, FiX } from 'react-icons/fi';

const BubblerFeedbackModal = ({ isOpen, onClose, leadCheckinId, leadBubblerId, bubblerId, checkinType }) => {
  const [ratings, setRatings] = useState({
    helpfulness: 0,
    respectfulness: 0,
    supportiveness: 0,
    overall: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadBubblerName, setLeadBubblerName] = useState('');

  useEffect(() => {
    if (isOpen && leadBubblerId) {
      loadLeadBubblerName();
    }
  }, [isOpen, leadBubblerId]);

  const loadLeadBubblerName = async () => {
    try {
      const { data, error } = await supabase
        .from('bubblers')
        .select('first_name, last_name')
        .eq('id', leadBubblerId)
        .single();

      if (error) throw error;
      setLeadBubblerName(`${data.first_name} ${data.last_name}`);
    } catch (error) {
      console.error('Error loading lead bubbler name:', error);
    }
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate ratings
    if (ratings.helpfulness === 0 || ratings.respectfulness === 0 || 
        ratings.supportiveness === 0 || ratings.overall === 0) {
      toast.error('Please provide all ratings before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('bubbler_feedback')
        .insert({
          lead_checkin_id: leadCheckinId,
          bubbler_id: bubblerId,
          lead_bubbler_id: leadBubblerId,
          helpfulness_rating: ratings.helpfulness,
          respectfulness_rating: ratings.respectfulness,
          supportiveness_rating: ratings.supportiveness,
          overall_rating: ratings.overall,
          anonymous_comment: comment.trim() || null,
          feedback_type: 'checkin',
          checkin_type: checkinType,
          is_anonymous: true,
          status: 'submitted'
        });

      if (error) throw error;

      toast.success('Thank you for your feedback! Your response is anonymous and helps improve our team.');
      onClose();
      
      // Reset form
      setRatings({
        helpfulness: 0,
        respectfulness: 0,
        supportiveness: 0,
        overall: 0
      });
      setComment('');

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ category, value, onChange }) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 min-w-[120px]">
        {category.charAt(0).toUpperCase() + category.slice(1)}:
      </span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(category, star)}
            className={`p-1 transition-colors ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <FiStar className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500 ml-2">
        {value > 0 ? `${value}/5` : 'Not rated'}
      </span>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Feedback on Lead Bubbler
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Lead Bubbler:</strong> {leadBubblerName}
          </p>
          <p className="text-sm text-blue-700">
            <strong>Check-in Type:</strong> {checkinType.replace('_', ' ')}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">
            Please rate your experience with this Lead Bubbler. Your feedback is anonymous and helps improve our team.
          </p>

          <RatingStars
            category="helpfulness"
            value={ratings.helpfulness}
            onChange={handleRatingChange}
          />

          <RatingStars
            category="respectfulness"
            value={ratings.respectfulness}
            onChange={handleRatingChange}
          />

          <RatingStars
            category="supportiveness"
            value={ratings.supportiveness}
            onChange={handleRatingChange}
          />

          <RatingStars
            category="overall"
            value={ratings.overall}
            onChange={handleRatingChange}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Share any additional thoughts about your experience..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-3 mb-6">
          <p className="text-sm text-green-800">
            <FiMessageSquare className="inline h-4 w-4 mr-1" />
            <strong>Anonymous Feedback:</strong> Your name will not be shared with the Lead Bubbler. 
            This feedback helps us maintain quality standards and support our team.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || ratings.overall === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FiSend className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BubblerFeedbackModal; 