import { useEffect, useState } from 'react'
import { getOpsOverview, getOrdersCard, getAssignmentsCard, getAvailabilityCard, getPayoutsCard, getLeadDutyCard, getEquipmentCard, getFeedbackCard } from '../services/kpis'

export function useOverviewData(){
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({})
  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      setLoading(true)
      const [ops, ord, asg, avail, pay, lead, eqp, fb] = await Promise.all([
        getOpsOverview(),
        getOrdersCard(),
        getAssignmentsCard(),
        getAvailabilityCard(),
        getPayoutsCard(),
        getLeadDutyCard(),
        getEquipmentCard(),
        getFeedbackCard()
      ])
      if(mounted) setData({ ops, ord, asg, avail, pay, lead, eqp, fb })
      setLoading(false)
    })()
    return ()=>{ mounted = false }
  },[])
  return { loading, data }
}


