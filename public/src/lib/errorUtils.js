/**
 * Error handling utilities for GoGoBubbles Dashboard
 * Provides consistent error detection and formatting across all components
 */

/**
 * Check if an error is related to Row Level Security (RLS) policies
 * @param {Object} error - The error object from Supabase
 * @returns {boolean} - True if it's an RLS error
 */
export const isRLSError = (error) => {
  if (!error) return false
  
  // Common RLS error codes and patterns
  const rlsErrorCodes = ['42501', 'PGRST301', 'PGRST302']
  const rlsErrorPatterns = ['policy', 'RLS', 'row level security', 'permission denied']
  
  // Check error code
  if (rlsErrorCodes.includes(error.code)) return true
  
  // Check error message
  if (error.message) {
    const message = error.message.toLowerCase()
    return rlsErrorPatterns.some(pattern => message.includes(pattern))
  }
  
  return false
}

/**
 * Check if an error is related to database connection issues
 * @param {Object} error - The error object from Supabase
 * @returns {boolean} - True if it's a connection error
 */
export const isConnectionError = (error) => {
  if (!error) return false
  
  const connectionErrorCodes = ['PGRST116', 'ECONNREFUSED', 'ENOTFOUND']
  const connectionErrorPatterns = ['connection', 'network', 'timeout', 'unreachable']
  
  if (connectionErrorCodes.includes(error.code)) return true
  
  if (error.message) {
    const message = error.message.toLowerCase()
    return connectionErrorPatterns.some(pattern => message.includes(pattern))
  }
  
  return false
}

/**
 * Enhance an error object with additional context and hints
 * @param {Object} error - The original error object
 * @param {Object} context - Additional context (e.g., { bubblerId, userRole, tab })
 * @returns {Object} - Enhanced error object
 */
export const enhanceError = (error, context = {}) => {
  if (!error) return error
  
  const enhanced = { ...error }
  
  // Add RLS detection
  if (isRLSError(error)) {
    enhanced.isRLSError = true
    enhanced.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
    enhanced.errorType = 'RLS_POLICY_VIOLATION'
  }
  
  // Add connection error detection
  if (isConnectionError(error)) {
    enhanced.isConnectionError = true
    enhanced.hint = 'Unable to connect to the database. Please check your internet connection and try again.'
    enhanced.errorType = 'CONNECTION_ERROR'
  }
  
  // Add context information
  if (Object.keys(context).length > 0) {
    enhanced.context = context
  }
  
  // Add timestamp
  enhanced.timestamp = new Date().toISOString()
  
  return enhanced
}

/**
 * Format error for console logging with consistent structure
 * @param {Object} error - The error object
 * @param {string} operation - What operation was being performed
 * @param {Object} context - Additional context
 * @returns {Object} - Formatted error object for logging
 */
export const formatErrorForLogging = (error, operation, context = {}) => {
  const enhanced = enhanceError(error, context)
  
  return {
    operation,
    error: enhanced.message,
    code: enhanced.code,
    type: enhanced.errorType || 'UNKNOWN',
    isRLSError: enhanced.isRLSError || false,
    isConnectionError: enhanced.isConnectionError || false,
    hint: enhanced.hint,
    context: enhanced.context,
    timestamp: enhanced.timestamp,
    stack: enhanced.stack
  }
}

/**
 * Get user-friendly error message based on error type
 * @param {Object} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  if (isRLSError(error)) {
    return 'You don\'t have permission to view this data. This may be due to Row Level Security (RLS) policies. Please contact support if you believe this is an error.'
  }
  
  if (isConnectionError(error)) {
    return 'Unable to connect to the database. Please check your internet connection and try again.'
  }
  
  return error?.message || 'An unexpected error occurred'
}

/**
 * Get error title based on error type
 * @param {Object} error - The error object
 * @returns {string} - Error title
 */
export const getErrorTitle = (error) => {
  if (isRLSError(error)) return 'Access Restricted'
  if (isConnectionError(error)) return 'Connection Error'
  return 'Something went wrong'
}

/**
 * Check if an error should trigger a retry
 * @param {Object} error - The error object
 * @returns {boolean} - True if retry should be attempted
 */
export const shouldRetry = (error) => {
  // Don't retry RLS errors - they won't succeed
  if (isRLSError(error)) return false
  
  // Retry connection errors
  if (isConnectionError(error)) return true
  
  // Retry server errors (5xx)
  if (error.code && error.code.startsWith('5')) return true
  
  // Retry timeout errors
  if (error.message?.includes('timeout')) return true
  
  return false
}
