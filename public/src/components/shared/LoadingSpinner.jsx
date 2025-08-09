import React from 'react'

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gogobubbles-200 border-t-gogobubbles-600`}></div>
      {text && (
        <p className="mt-4 text-gray-600 font-medium">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
