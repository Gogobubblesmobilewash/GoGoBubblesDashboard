import React from 'react'
import type { CardProps } from '../../types/contracts'

export function Card({ icon, title, value, badgeCount, severity, onClick }: CardProps){
  const bg = severity === 'critical' ? 'var(--urgent)' : undefined
  return (
    <div className="panel p-4 cursor-pointer" onClick={onClick} style={{backgroundColor:bg}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {badgeCount !== undefined && <span className="badge">{badgeCount}</span>}
      </div>
      <div className="mt-4 text-3xl font-bold text-white">{value}</div>
    </div>
  )
}


