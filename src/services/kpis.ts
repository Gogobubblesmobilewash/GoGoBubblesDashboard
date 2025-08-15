import { supabase } from '../lib/supabaseClient'

export type OpsOverview = { activeJobs:number; activeAssignments:number; urgentAlerts:number }

export async function getOpsOverview(): Promise<OpsOverview>{
  const activeStatuses = ['en_route','arrived','in_progress']
  const jobsRes = await supabase.from('order_service').select('id', { count:'exact', head:true }).in('status', activeStatuses)
  const assignsRes = await supabase.from('job_assignments').select('id', { count:'exact', head:true }).in('status', activeStatuses)
  return {
    activeJobs: jobsRes.count ?? 0,
    activeAssignments: assignsRes.count ?? 0,
    urgentAlerts: 0
  }
}

export type OrdersCard = { paidFull:number; depositOnly:number; pendingDeposit:number; cancelled:number }
export async function getOrdersCard(): Promise<OrdersCard>{
  const paidFull = await supabase.from('order_service').select('id', { count:'exact', head:true }).eq('remaining_cents', 0)
  const depositOnly = await supabase.from('order_service').select('id', { count:'exact', head:true }).gt('deposit_cents', 0).gt('remaining_cents', 0)
  const nowIso = new Date().toISOString()
  const pendingDeposit = await supabase.from('order_service').select('id', { count:'exact', head:true }).is('deposit_cents', null).gt('deposit_expires_at', nowIso)
  const cancelled = await supabase.from('order_service').select('id', { count:'exact', head:true }).eq('status','cancelled')
  return { paidFull: paidFull.count ?? 0, depositOnly: depositOnly.count ?? 0, pendingDeposit: pendingDeposit.count ?? 0, cancelled: cancelled.count ?? 0 }
}

export type AssignmentsCard = { offered:number; unaccepted:number; declined:number }
export async function getAssignmentsCard(): Promise<AssignmentsCard>{
  const offered = await supabase.from('job_assignments').select('id', { count:'exact', head:true }).eq('status','offered')
  const unaccepted = await supabase.from('job_assignments').select('id', { count:'exact', head:true }).eq('status','accepted')
  const declined = await supabase.from('job_assignments').select('id', { count:'exact', head:true }).eq('status','declined')
  return { offered: offered.count ?? 0, unaccepted: unaccepted.count ?? 0, declined: declined.count ?? 0 }
}

export type AvailabilityCard = { activePct:number; activeCount:number; inactiveCount:number }
export async function getAvailabilityCard(): Promise<AvailabilityCard>{
  const active = await supabase.from('bubblers').select('id', { count:'exact', head:true }).eq('is_active', true)
  const inactive = await supabase.from('bubblers').select('id', { count:'exact', head:true }).eq('is_active', false)
  const total = (active.count ?? 0) + (inactive.count ?? 0)
  const pct = total ? Math.round(((active.count ?? 0)/total)*100) : 0
  return { activePct: pct, activeCount: active.count ?? 0, inactiveCount: inactive.count ?? 0 }
}

export type PayoutsCard = { due:number; paid:number; remaining:number; bubblersToPay:number }
export async function getPayoutsCard(): Promise<PayoutsCard>{
  const due = await supabase.from('payouts').select('amount_cents,is_paid,bubbler_id')
  const paidCents = (due.data ?? []).filter(p=>p.is_paid).reduce((s,p)=>s+(p.amount_cents||0),0)
  const dueCents = (due.data ?? []).filter(p=>!p.is_paid).reduce((s,p)=>s+(p.amount_cents||0),0)
  const bubblersToPay = new Set((due.data ?? []).filter(p=>!p.is_paid).map(p=>p.bubbler_id)).size
  return { due: Math.round(dueCents/100), paid: Math.round(paidCents/100), remaining: Math.round(dueCents/100), bubblersToPay }
}

export type LeadDutyCard = { onDutyNow:number; startingLater:number; gaps:number }
export async function getLeadDutyCard(): Promise<LeadDutyCard>{
  const now = new Date().toISOString()
  const onNow = await supabase.from('lead_duty_assignment').select('id', { count:'exact', head:true }).lte('start_at', now).gte('end_at', now)
  const later = await supabase.from('lead_duty_assignment').select('id', { count:'exact', head:true }).gt('start_at', now)
  return { onDutyNow: onNow.count ?? 0, startingLater: later.count ?? 0, gaps: 0 }
}

export type EquipmentCard = { out:number; dueToday:number; overdue:number; pending:number }
export async function getEquipmentCard(): Promise<EquipmentCard>{
  const out = await supabase.from('equipment_rentals').select('id', { count:'exact', head:true }).eq('status','checked_out')
  const overdue = await supabase.from('equipment_rentals').select('id', { count:'exact', head:true }).eq('status','overdue')
  const pending = await supabase.from('equipment_rentals').select('id', { count:'exact', head:true }).eq('status','requested')
  const dueToday = 0
  return { out: out.count ?? 0, dueToday, overdue: overdue.count ?? 0, pending: pending.count ?? 0 }
}

export type FeedbackCard = { latest:number; lowStars:number }
export async function getFeedbackCard(): Promise<FeedbackCard>{
  const latest = await supabase.from('ratings').select('id', { count:'exact', head:true })
  const low = await supabase.from('ratings').select('id', { count:'exact', head:true }).lte('stars', 2)
  return { latest: latest.count ?? 0, lowStars: low.count ?? 0 }
}


