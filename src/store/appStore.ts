import { create } from 'zustand'
import type { Role } from '../types/contracts'

type AppState = {
  role: Role
  analyticsMode: boolean
  setRole: (r: Role)=>void
  setAnalyticsMode: (v:boolean)=>void
}

export const useAppStore = create<AppState>((set)=>({
  role: 'admin_bubbler',
  analyticsMode: false,
  setRole: (r)=>set({role:r}),
  setAnalyticsMode: (v)=>set({analyticsMode:v})
}))


