import React from 'react'
import { useAppStore } from '../store/appStore'

export function Header(){
  const { role, setRole, analyticsMode, setAnalyticsMode } = useAppStore()
  return (
    <div className="panel m-4 p-4 flex items-center justify-between text-white">
      <div className="flex gap-2 items-center">
        <span className="text-lg font-semibold">GoGoBubbles</span>
        <select className="text-slate-900 rounded px-2 py-1" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="admin_bubbler">Admin</option>
          <option value="market_manager_bubbler">Market Manager</option>
          <option value="lead_bubbler">Lead</option>
          <option value="shine_bubbler">Shine</option>
          <option value="sparkle_bubbler">Sparkle</option>
          <option value="fresh_bubbler">Fresh</option>
          <option value="support_bubbler">Support</option>
          <option value="finance_bubbler">Finance</option>
          <option value="recruit_bubbler">Recruit</option>
        </select>
        <button className="badge" onClick={()=>setAnalyticsMode(!analyticsMode)}>{analyticsMode? 'Analytics' : 'Overview'}</button>
      </div>
      <div className="flex gap-3">
        <span className="badge">⚠</span>
        <span className="badge">🧼</span>
        <span className="badge">💬</span>
        <span className="badge">💵</span>
      </div>
    </div>
  )
}


