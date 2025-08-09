import React from 'react'
import { AlertTriangle, RefreshCw, Shield, Database } from 'lucide-react'

const ErrorMessage = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showRetry = true 
}) => {
  // Check if this is an RLS policy error
  const isRLSError = error?.message?.includes('policy') || 
                    error?.message?.includes('RLS') ||
                    error?.code === '42501' ||
                    error?.code === 'PGRST301'

  // Check if this is a database connection error
  const isConnectionError = error?.message?.includes('connection') ||
                           error?.message?.includes('network') ||
                           error?.code === 'PGRST116'

  const getErrorIcon = () => {
    if (isRLSError) return <Shield className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
    if (isConnectionError) return <Database className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
    return <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
  }

  const getErrorTitle = () => {
    if (isRLSError) return 'Access Restricted'
    if (isConnectionError) return 'Connection Error'
    return title
  }

  const getErrorMessage = () => {
    if (isRLSError) {
      return 'You don\'t have permission to view this data. This may be due to Row Level Security (RLS) policies. Please contact support if you believe this is an error.'
    }
    if (isConnectionError) {
      return 'Unable to connect to the database. Please check your internet connection and try again.'
    }
    return error?.message || 'An unexpected error occurred'
  }

  const getErrorColor = () => {
    if (isRLSError) return 'orange'
    if (isConnectionError) return 'red'
    return 'red'
  }

  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      textLight: 'text-orange-700',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      textLight: 'text-red-700',
      button: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
    }
  }

  const colors = colorClasses[getErrorColor()]

  return (
    <div className={`rounded-lg ${colors.bg} border ${colors.border} p-4`}>
      <div className="flex items-start">
        {getErrorIcon()}
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colors.text}`}>{getErrorTitle()}</h3>
          <div className="mt-2 text-sm">
            <p className={colors.textLight}>{getErrorMessage()}</p>
            {error?.details && (
              <details className="mt-2">
                <summary className={`cursor-pointer ${colors.textLight} hover:opacity-80`}>
                  Technical details
                </summary>
                <pre className={`mt-2 text-xs ${colors.bg} p-2 rounded overflow-auto border ${colors.border}`}>
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
            {error?.hint && (
              <p className={`mt-2 text-sm ${colors.textLight} italic`}>
                Hint: {error.hint}
              </p>
            )}
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${getErrorColor()}-50 focus:ring-${getErrorColor()}-500`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
