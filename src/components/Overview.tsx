import React from 'react'
import { Card } from './shared/Card'

export function Overview(){
  return (
    <div className="grid-4">
      <Card title="Today’s Ops" value="--" icon={<span className="icon-glass p-3">📊</span>} />
      <Card title="Orders" value="--" icon={<span className="icon-glass p-3">🧾</span>} />
      <Card title="Assignments" value="--" icon={<span className="icon-glass p-3">🧼</span>} />
      <Card title="Availability" value="--" icon={<span className="icon-glass p-3">📅</span>} />
      <Card title="Payouts" value="--" icon={<span className="icon-glass p-3">💵</span>} />
      <Card title="Lead Duty" value="--" icon={<span className="icon-glass p-3">🧭</span>} />
      <Card title="Equipment" value="--" icon={<span className="icon-glass p-3">🔧</span>} />
      <Card title="Feedback" value="--" icon={<span className="icon-glass p-3">⭐</span>} />
    </div>
  )
}


