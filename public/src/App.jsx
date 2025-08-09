import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import Dashboard from './components/dashboard/Dashboard'
import Auth from './components/auth/Auth'
import LoadingSpinner from './components/shared/LoadingSpinner'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      console.log('Initial session:', session?.user?.id)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      console.log('Auth state changed:', session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {session ? (
          <Dashboard session={session} />
        ) : (
          <Auth />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
