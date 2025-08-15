import React from 'react'
import { Card } from './shared/Card'
import { useOverviewData } from '../hooks/useOverviewData'

export function Overview(){
  const { loading, data } = useOverviewData()
  return (
    <div className="grid-4">
      <Card title="Today’s Ops" value={loading?'--':`${data.ops?.activeJobs || 0} / ${data.ops?.activeAssignments || 0}`} icon={<span className="icon-glass p-3">📊</span>} />
      <Card title="Orders" value={loading?'--':`${data.ord?.paidFull || 0} PF / ${data.ord?.depositOnly || 0} DO / ${data.ord?.pendingDeposit || 0} PD`} icon={<span className="icon-glass p-3">🧾</span>} />
      <Card title="Assignments" value={loading?'--':`${data.asg?.offered || 0} / ${data.asg?.unaccepted || 0} / ${data.asg?.declined || 0}`} icon={<span className="icon-glass p-3">🧼</span>} />
      <Card title="Availability" value={loading?'--':`${data.avail?.activePct || 0}%`} icon={<span className="icon-glass p-3">📅</span>} />
      <Card title="Payouts" value={loading?'--':`$${data.pay?.due || 0} due`} icon={<span className="icon-glass p-3">💵</span>} />
      <Card title="Lead Duty" value={loading?'--':`${data.lead?.onDutyNow || 0} now`} icon={<span className="icon-glass p-3">🧭</span>} />
      <Card title="Equipment" value={loading?'--':`${data.eqp?.out || 0} out`} icon={<span className="icon-glass p-3">🔧</span>} />
      <Card title="Feedback" value={loading?'--':`${data.fb?.lowStars || 0} ≤2★`} icon={<span className="icon-glass p-3">⭐</span>} />
    </div>
  )
}


