# GoGoBubbles Dashboard - Error Handling & Debugging Guide

## Overview

This guide covers the enhanced error handling and debugging features implemented in the GoGoBubbles dashboard to prevent infinite loading states and provide better developer experience (DX).

## Key Features Implemented

### ✅ **RLS Error Detection**
- Automatic detection of Row Level Security policy violations
- Clear error messages for permission issues
- No more infinite "Loading..." states due to RLS failures

### ✅ **Enhanced Console Logging**
- Structured debug logs with timestamps
- Operation-specific logging for each dashboard tab
- Session and user context information
- RLS error details and hints

### ✅ **Comprehensive Error Handling**
- Error state management across all components
- Retry functionality for recoverable errors
- User-friendly error messages
- Technical details for developers

## Error Types & Detection

### 1. RLS (Row Level Security) Errors
**Error Codes:** `42501`, `PGRST301`, `PGRST302`
**Patterns:** `policy`, `RLS`, `row level security`, `permission denied`

**Example:**
```javascript
// Error will be automatically detected as RLS error
if (error.code === '42501' || error.message?.includes('policy')) {
  error.isRLSError = true
  error.hint = 'This may be due to Row Level Security policies...'
}
```

### 2. Connection Errors
**Error Codes:** `PGRST116`, `ECONNREFUSED`, `ENOTFOUND`
**Patterns:** `connection`, `network`, `timeout`, `unreachable`

### 3. General Database Errors
**Error Codes:** `PGRST116`, `PGRST301`, `PGRST302`
**Patterns:** Various database-specific error messages

## Console Logging Format

### Debug Logs Structure
```javascript
// Success logs
console.log('✅ [DEBUG] Operation completed:', {
  count: data?.length || 0,
  bubblerId: currentBubblerId,
  timestamp: new Date().toISOString()
})

// Error logs
console.error('❌ [DEBUG] Operation failed:', {
  error: error.message,
  code: error.code,
  isRLSError: error.isRLSError,
  timestamp: new Date().toISOString()
})
```

### Log Categories
- 🚀 **Initialization** - Dashboard startup and session
- 🔍 **Data Fetching** - API calls and queries
- ✅ **Success** - Successful operations
- ❌ **Errors** - Failed operations
- 🔄 **Retry** - Retry attempts

## Error Handling in Components

### 1. Dashboard Initialization
```javascript
useEffect(() => {
  const initializeDashboard = async () => {
    try {
      console.log('🚀 [DEBUG] Initializing dashboard with session:', {
        userId: session?.user?.id,
        email: session?.user?.email,
        sessionExists: !!session,
        timestamp: new Date().toISOString()
      })
      
      // ... initialization logic
      
    } catch (error) {
      console.error('❌ [DEBUG] Error initializing dashboard:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      })
      
      setError(error) // Prevents infinite loading
    } finally {
      setLoading(false)
    }
  }
}, [session])
```

### 2. Tab-Specific Error Handling
```javascript
const fetchJobs = async () => {
  try {
    setLoading(true)
    setError(null)
    
    console.log('🔍 [DEBUG] Fetching jobs for bubbler:', {
      bubblerId: currentBubblerId,
      timestamp: new Date().toISOString()
    })
    
    const { data, error } = await supabase.from('job_assignments').select('*')
    
    if (error) {
      // Enhanced error logging
      console.error('❌ [DEBUG] Supabase error fetching jobs:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      // RLS error detection
      if (error.code === '42501' || error.message?.includes('policy')) {
        error.isRLSError = true
        error.hint = 'This may be due to Row Level Security policies...'
      }
      
      throw error
    }
    
    setJobs(data || [])
    console.log('✅ [DEBUG] Jobs fetched successfully:', {
      count: data?.length || 0,
      bubblerId: currentBubblerId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching jobs:', {
      error: error.message,
      code: error.code,
      isRLSError: error.isRLSError,
      timestamp: new Date().toISOString()
    })
    setError(error)
  } finally {
    setLoading(false)
  }
}
```

## Error Display & User Experience

### Error Message Component
The `ErrorMessage` component automatically:
- Detects RLS errors and shows appropriate messaging
- Provides retry functionality for recoverable errors
- Shows technical details for developers
- Uses color coding (orange for RLS, red for other errors)

### Error States
1. **Dashboard Level** - Prevents entire dashboard from loading
2. **Tab Level** - Shows errors within specific tabs
3. **Component Level** - Handles errors in individual components

## Debugging Production Issues

### 1. Check Console Logs
Look for structured debug logs with timestamps:
```
🚀 [DEBUG] Initializing dashboard with session: {userId: "123", timestamp: "..."}
🔍 [DEBUG] Fetching jobs for bubbler: {bubblerId: "456", timestamp: "..."}
❌ [DEBUG] Supabase error fetching jobs: {error: "policy violation", code: "42501", ...}
```

### 2. RLS Policy Issues
If you see RLS errors:
- Check user role and permissions
- Verify RLS policies are correctly configured
- Ensure user has access to the requested data

### 3. Connection Issues
If you see connection errors:
- Check internet connectivity
- Verify Supabase service status
- Check API keys and configuration

## Best Practices

### 1. Always Set Error State
```javascript
// ❌ Don't do this
catch (error) {
  console.error('Error:', error)
  // Missing setError(error) - will cause infinite loading
}

// ✅ Do this
catch (error) {
  console.error('Error:', error)
  setError(error) // Prevents infinite loading
}
```

### 2. Use Structured Logging
```javascript
// ❌ Don't do this
console.log('Error:', error)

// ✅ Do this
console.error('❌ [DEBUG] Operation failed:', {
  error: error.message,
  code: error.code,
  context: { bubblerId, userRole },
  timestamp: new Date().toISOString()
})
```

### 3. Provide User-Friendly Messages
```javascript
// RLS errors get helpful hints
if (error.code === '42501') {
  error.hint = 'This may be due to Row Level Security policies...'
}
```

## Temporary Debug Logs

**Note:** The enhanced console logging is temporary and should be removed once production is confirmed working. To remove:

1. Search for `[DEBUG]` in the codebase
2. Remove debug console.log statements
3. Keep error logging for production debugging
4. Remove timestamp logging if not needed

## Error Recovery

### Automatic Recovery
- Connection errors automatically retry
- RLS errors show clear messages (no retry needed)
- Server errors (5xx) can be retried

### Manual Recovery
- Users can click "Try Again" button
- Dashboard re-initializes on retry
- All error states are cleared

## Support & Troubleshooting

### Common Issues
1. **Infinite Loading** - Check for missing `setError(error)` calls
2. **RLS Errors** - Verify user permissions and policies
3. **Connection Issues** - Check network and Supabase status

### Getting Help
- Check console logs for detailed error information
- Use the error context to identify the issue
- Contact support with error details and context

---

This error handling system ensures a smooth user experience while providing developers with comprehensive debugging information. The temporary debug logs will help identify and resolve any production issues before being removed.
