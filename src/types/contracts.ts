export type Severity = 'info'|'success'|'warning'|'critical';

export type CardProps = {
  icon: React.ReactNode; title: string; value: string|number;
  badgeCount?: number; severity?: Severity; onClick?: ()=>void
};

export type Role = 'admin_bubbler'|'market_manager_bubbler'|'lead_bubbler'|'elite_bubbler'|
            'shine_bubbler'|'sparkle_bubbler'|'fresh_bubbler'|'support_bubbler'|'finance_bubbler'|'recruit_bubbler';


