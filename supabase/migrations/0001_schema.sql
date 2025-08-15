-- GoGoBubbles Build Pack v2.0 — Core Schema
-- Requires: pgcrypto (for gen_random_uuid)

create extension if not exists pgcrypto;

-- 3.1 Markets & scoping

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null
);

create table if not exists market_zones (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  code text not null,
  name text not null
);

create table if not exists bubblers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  name text,
  role text check (role in (
    'admin_bubbler','market_manager_bubbler','lead_bubbler',
    'elite_bubbler','shine_bubbler','sparkle_bubbler',
    'fresh_bubbler','support_bubbler','finance_bubbler','recruit_bubbler'
  )),
  is_active boolean default true,
  home_lat double precision,
  home_lng double precision,
  travel_minutes_max int default 30,
  travel_minutes_threshold int default 5,
  weekly_hour_cap int,
  created_at timestamptz default now()
);

create table if not exists bubbler_markets (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  is_primary boolean default false,
  unique (bubbler_id, market_id)
);
create index if not exists idx_bubbler_markets_bubbler on bubbler_markets(bubbler_id);

-- 3.2 Services, orders, assignments

do $$ begin
  create type job_status as enum ('pending','offered','accepted','declined','en_route','arrived','in_progress','paused','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  market_id uuid references markets(id),
  market_zone_id uuid references market_zones(id),
  created_at timestamptz default now()
);

create table if not exists order_service (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  service_type text check (service_type in ('shine','sparkle','fresh')),
  tier text,
  status job_status default 'pending',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  deposit_expires_at timestamptz,
  weather_dependent boolean default false,
  reschedule_parent_id uuid references order_service(id),
  address_zip text,
  address_lat double precision,
  address_lng double precision,
  customer_notes text,
  market_id uuid references markets(id),
  market_zone_id uuid references market_zones(id),
  amount_cents int default 0,
  deposit_cents int default 0,
  remaining_cents int default 0
);
create index if not exists idx_os_status on order_service(status);
create index if not exists idx_os_deposit_exp on order_service(deposit_expires_at);
create index if not exists idx_os_market on order_service(market_id);

create table if not exists job_assignments (
  id uuid primary key default gen_random_uuid(),
  order_service_id uuid references order_service(id) on delete cascade,
  bubbler_id uuid references bubblers(id) on delete cascade,
  status job_status default 'offered',
  offer_expires_at timestamptz,
  accepted_at timestamptz, declined_at timestamptz,
  en_route_at timestamptz, arrived_at timestamptz,
  in_progress_at timestamptz, completed_at timestamptz,
  assignment_group_id uuid,
  elite_eligible boolean default false
);
create index if not exists idx_ja_offer_exp on job_assignments(offer_expires_at);
create index if not exists idx_ja_bubbler on job_assignments(bubbler_id);

-- 3.3 Availability & certifications

create table if not exists bubbler_availability (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  dow int not null check (dow between 0 and 6),
  start_time time,
  end_time time,
  active boolean default true,
  unique (bubbler_id, dow)
);

create table if not exists bubbler_certifications (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  service_type text check (service_type in ('shine','sparkle','fresh')),
  unique (bubbler_id, service_type)
);

create or replace function enforce_elite_two_services() returns trigger as $$
declare svc_count int; r text;
begin
  select role into r from bubblers where id = new.bubbler_id;
  if r = 'elite_bubbler' then
    select count(*) into svc_count from bubbler_certifications where bubbler_id = new.bubbler_id;
    if tg_op='INSERT' and svc_count >= 2 then
      raise exception 'Elite Bubblers may hold at most two certifications';
    end if;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_elite_two_services on bubbler_certifications;
create trigger trg_elite_two_services
before insert on bubbler_certifications
for each row execute function enforce_elite_two_services();

-- 3.4 Lead duty & requests

create table if not exists lead_duty_assignment (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references bubblers(id) on delete cascade,
  market_id uuid references markets(id),
  zone text,
  radius_km int default 25,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_training_mode boolean default false,
  is_trainer_mode boolean default false
);

do $$ begin
  create type lead_request_type as enum ('oversight','partial_takeover','full_takeover','equipment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_request_status as enum ('new','accepted','en_route','resolved','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists lead_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references bubblers(id) on delete set null,
  lead_id uuid references bubblers(id) on delete set null,
  order_service_id uuid references order_service(id) on delete set null,
  type lead_request_type not null,
  status lead_request_status default 'new',
  reason text,
  created_at timestamptz default now(),
  accepted_at timestamptz, en_route_at timestamptz, resolved_at timestamptz
);

-- 3.5 Photos, QR scans (laundry), messages

create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  order_service_id uuid references order_service(id) on delete cascade,
  bubbler_id uuid references bubblers(id) on delete set null,
  label text,
  url text not null,
  created_at timestamptz default now()
);

create table if not exists laundry_bag_scans (
  id uuid primary key default gen_random_uuid(),
  order_service_id uuid references order_service(id) on delete cascade,
  bubbler_id uuid references bubblers(id) on delete set null,
  qr_code text not null,
  scanned_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  order_service_id uuid references order_service(id) on delete set null,
  sender_id uuid references bubblers(id) on delete set null,
  to_bubbler_id uuid references bubblers(id),
  recipient_group text check (recipient_group in ('admin','support','lead','bubbler')) default 'admin',
  priority text check (priority in ('urgent','normal')) default 'normal',
  category text,
  body text not null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_messages_order on messages(order_service_id);

-- 3.6 Equipment rentals

do $$ begin
  create type equipment_status as enum ('requested','checked_out','due','overdue','returned','damaged');
exception when duplicate_object then null; end $$;

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serial text,
  notes text
);

create table if not exists equipment_rentals (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) on delete cascade,
  bubbler_id uuid references bubblers(id) on delete cascade,
  status equipment_status default 'requested',
  out_at timestamptz, due_at timestamptz, returned_at timestamptz,
  notes text
);
create index if not exists idx_equipment_due on equipment_rentals(due_at,status);

-- 3.7 Payments, deposits, standby, payouts, tips

create table if not exists deposit_rules (
  id uuid primary key default gen_random_uuid(),
  service_type text check (service_type in ('shine','sparkle','fresh')),
  tier text,
  min_deposit_cents int not null,
  calc_formula text,
  effective_from date default now()
);

create table if not exists standby_policy (
  id uuid primary key default gen_random_uuid(),
  company_margin_pct numeric not null check (company_margin_pct between 0 and 1),
  split_method text default 'even',
  effective_from date default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id),
  category text check (category in ('standard','tips','standby','lead_oversight','partial_takeover','full_takeover','trainer','training')),
  amount_cents int not null,
  related_assignment_id uuid references job_assignments(id),
  related_lead_request_id uuid references lead_requests(id),
  related_order_service_id uuid references order_service(id),
  is_paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_payouts_bubbler on payouts(bubbler_id);

-- 3.8 Tasks, durations, capacity caps

do $$ begin
  create type room_kind as enum ('bedroom','bathroom','kitchen','living_room','other_living','office_den','media_room','game_room','dining','hallway');
exception when duplicate_object then null; end $$;

create table if not exists service_task_templates (
  id uuid primary key default gen_random_uuid(),
  service_type text check (service_type in ('sparkle','shine','fresh')),
  tier text,
  room_kind room_kind,
  expected_minutes int not null,
  photo_before_required boolean default true,
  photo_after_required boolean default true
);

create table if not exists daily_capacity_rules (
  id uuid primary key default gen_random_uuid(),
  role text check (role in ('shine_bubbler','sparkle_bubbler','fresh_bubbler','elite_bubbler')),
  service_type text,
  max_jobs_per_day int,
  max_minutes_per_day int,
  effective_from date default now()
);

create table if not exists large_job_thresholds (
  id uuid primary key default gen_random_uuid(),
  service_type text check (service_type in ('sparkle')),
  bedrooms_min int default 4,
  bathrooms_min int default 3,
  effective_from date default now()
);

-- 3.9 Notes, morale, leaderboards, applications

do $$ begin
  create type note_category as enum ('feedback_followup','customer_issue','training','performance','general');
exception when duplicate_object then null; end $$;

create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  target_type text check (target_type in ('order','bubbler','customer','equipment','general')),
  target_id uuid,
  category note_category default 'general',
  body text not null,
  created_by uuid references bubblers(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists morale_points (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  points int not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  candidate_name text,
  applied_role text,
  market_id uuid references markets(id),
  status text check (status in ('new','pending_review','approved','declined','waitlisted')) default 'new',
  created_at timestamptz default now()
);

-- 3.10 Onboarding, test mode, equipment readiness

create table if not exists onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text
);

create table if not exists bubbler_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  step_id uuid references onboarding_steps(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  evidence_url text
);

alter table bubblers
  add column if not exists test_mode boolean default true,
  add column if not exists production_ready boolean default false;

create table if not exists equipment_readiness_photos (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- 3.11 Promotions, perks, coupons

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  service_type text,
  percent_off numeric,
  max_uses int,
  per_customer_limit int,
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid references bubblers(id)
);

create table if not exists perks_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text unique not null,
  service_type text,
  tier text,
  trigger_expr text,
  benefit text
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  order_service_id uuid references order_service(id) on delete cascade,
  bubbler_id uuid references bubblers(id) on delete set null,
  customer_id uuid,
  stars int check (stars between 1 and 5),
  comment text,
  tip_cents int default 0,
  created_at timestamptz default now()
);

-- 3.12 KBIs/SOP tips & send logs

create table if not exists tip_resources (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  body_markdown text not null,
  service_type text,
  tags text[]
);

create table if not exists kbi_incidents (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  order_service_id uuid references order_service(id) on delete set null,
  area_code text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists kbi_tip_sends (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  tip_resource_id uuid references tip_resources(id) on delete set null,
  sent_by uuid references bubblers(id),
  area_code text,
  sent_via text check (sent_via in ('email','in_app')),
  created_at timestamptz default now()
);

-- 3.13 Device unlocks, push tokens

create table if not exists device_unlock_events (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  admin_id uuid references bubblers(id) on delete set null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  bubbler_id uuid references bubblers(id) on delete cascade,
  token text not null,
  platform text,
  created_at timestamptz default now()
);


