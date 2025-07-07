import React from 'react';
import PropTypes from 'prop-types';

const BrandedCard = ({ 
  title, 
  children, 
  icon: Icon, 
  color = 'brand-aqua', 
  className = '',
  onClick,
  hover = true 
}) => {
  const baseClasses = "bg-white rounded-2xl shadow-card p-6";
  const hoverClasses = hover ? " transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer" : "";
  const clickableClasses = onClick ? " cursor-pointer" : "";
  
  const cardClasses = `${baseClasses}${hoverClasses}${clickableClasses} ${className}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className="flex items-center mb-4">
          {Icon && (
            <div className={`p-3 bg-${color}-100 rounded-xl mr-3`}>
              <Icon className={`h-5 w-5 text-${color}-600`} />
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-800 font-poppins">{title}</h3>
        </div>
      )}
      <div className={title ? '' : 'pt-0'}>
        {children}
      </div>
    </div>
  );
};

BrandedCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  hover: PropTypes.bool
};

BrandedCard.defaultProps = {
  title: null,
  icon: null,
  color: 'brand-aqua',
  className: '',
  onClick: null,
  hover: true
};

export default BrandedCard; 