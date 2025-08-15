// UI Contracts (Section 8)

export type Severity = 'info'|'success'|'warning'|'critical';

export type CardProps = {
  icon: React.ReactNode; title: string; value: string|number;
  badgeCount?: number; severity?: Severity; onClick?: ()=>void
};

export type Role = 'admin_bubbler'|'market_manager_bubbler'|'lead_bubbler'|'elite_bubbler'|
            'shine_bubbler'|'sparkle_bubbler'|'fresh_bubbler'|'support_bubbler'|'finance_bubbler'|'recruit_bubbler';

export type OrdersOverview = {
  paidFull: number; depositOnly: number;
  pendingDeposit: {count:number; items:{id:string; endsAt:string}[]};
  cancelledNoDeposit: number; cancelledDepositResched: number;
  needsTidyCal: {reopen:number; move:number};
};

export type AvailabilitySummary = { activePct:number; activeCount:number; inactiveCount:number };

export type LeadDutySummary = {
  onDutyNow:number; startingLater:number; gaps:number;
  items:{leadId:string; name:string; zone:string; startAt:string; endAt:string}[];
};

export type PayoutSummary = { due:number; paid:number; remaining:number; bubblersToPay:number };

export type EquipmentSummary = { out:number; dueToday:number; overdue:number; pending:number };

export type EliteBundleOffer = {
  assignmentGroupId: string;
  services: { assignmentId:string; orderServiceId:string; serviceType:'shine'|'sparkle'|'fresh'; tier?:string }[];
  offerExpiresAt: string; scheduledStart: string;
  addressZip?: string; customerNotes?: string;
};


