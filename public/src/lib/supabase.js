import { createClient } from '@supabase/supabase-js'
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  assertEnv 
} from './config.ts'

// Validate environment configuration on import
assertEnv()

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

/**
 * Helper function to get current bubbler ID
 * 
 * IMPORTANT: This function correctly uses bubblers.user_id for joins/filters
 * and NEVER assumes bubblers.id = auth.uid(). This ensures RLS compliance.
 * 
 * The function:
 * 1. Gets the authenticated user ID from auth.uid()
 * 2. Queries bubblers table using WHERE user_id = auth.uid()
 * 3. Returns the bubbler.id (not the user.id)
 * 
 * This matches the RLS policy: bubblers.user_id = auth.uid()
 */
export const getCurrentBubblerId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No authenticated user found')
      return null
    }
    
    console.log('🔍 [DEBUG] Getting current bubbler ID for user:', user.id)
    
    // First try to use the RPC function if it exists
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('current_bubbler_id')
      
      if (!rpcError && rpcResult) {
        console.log('✅ [DEBUG] Got bubbler ID from RPC:', rpcResult)
        return rpcResult
      }
    } catch (rpcError) {
      console.log('⚠️ [DEBUG] RPC function not available, falling back to direct query')
    }
    
    // Fallback to direct query (this should work with RLS policies)
    // CRITICAL: We use WHERE user_id = auth.uid(), not WHERE id = auth.uid()
    const { data: bubbler, error } = await supabase
      .from('bubblers')
      .select('id')
      .eq('user_id', user.id)  // This is correct: bubblers.user_id = auth.uid()
      .single()
    
    if (error) {
      console.error('❌ [DEBUG] Error getting bubbler ID:', error)
      return null
    }
    
    console.log('✅ [DEBUG] Got bubbler ID from direct query:', bubbler?.id)
    return bubbler?.id || null
  } catch (error) {
    console.error('❌ [DEBUG] Error getting current bubbler ID:', error)
    return null
  }
}

/**
 * Helper function to check user role
 * 
 * IMPORTANT: This function correctly uses user_roles.user_id for joins/filters
 * and NEVER assumes user_roles.id = auth.uid(). This ensures RLS compliance.
 * 
 * The function:
 * 1. Gets the authenticated user ID from auth.uid()
 * 2. Queries user_roles table using WHERE user_id = auth.uid()
 * 3. Returns the role from the user_roles table
 * 
 * This matches the RLS policy: user_roles.user_id = auth.uid()
 */
export const getUserRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('⚠️ [DEBUG] No authenticated user found for role check')
      return null
    }
    
    console.log('🔍 [DEBUG] Getting user role for user:', user.id)
    
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)  // This is correct: user_roles.user_id = auth.uid()
      .single()
    
    if (error) {
      console.error('❌ [DEBUG] Error getting user role:', error)
      return null
    }
    
    console.log('✅ [DEBUG] User role:', userRole?.role)
    return userRole?.role || null
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user role:', error)
    return null
  }
}

// Helper function to check if user is admin/support/leader
export const isStaffMember = async () => {
  try {
    const role = await getUserRole()
    return role === 'admin' || role === 'support' || role === 'leader'
  } catch (error) {
    console.error('Error checking if user is staff member:', error)
    return false
  }
}

// Helper function to get session info for debugging
export const getSessionInfo = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    if (!session) {
      console.log('No active session')
      return null
    }
    
    return {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at
    }
  } catch (error) {
    console.error('Error getting session info:', error)
    return null
  }
}
