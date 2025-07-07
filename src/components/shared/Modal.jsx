import React from 'react';
import PropTypes from 'prop-types';
import { FiX as X } from 'react-icons/fi';

const Modal = ({ title, children, onClose, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-card ${sizeClasses[size]} w-full p-6 md:p-8 relative animate-in fade-in duration-200`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {title && (
          <h3 className="text-xl font-bold text-gray-800 mb-6 font-poppins pr-8">{title}</h3>
        )}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  title: PropTypes.string
};

Modal.defaultProps = {
  size: 'md',
  title: null
};

export default Modal; 