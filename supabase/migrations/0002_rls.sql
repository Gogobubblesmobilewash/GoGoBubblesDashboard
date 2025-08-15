-- GoGoBubbles Build Pack v2.0 — RLS Policies

-- 4.1 Helper functions

create or replace function current_bubbler_id() returns uuid language sql stable as $$
  select id from bubblers where auth_user_id = auth.uid()
$$;

create or replace function is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from bubblers b where b.auth_user_id = auth.uid() and b.role = 'admin_bubbler'
  )
$$;

create or replace function is_market_manager_for(mid uuid) returns boolean language sql stable as $$
  select exists (
    select 1 from bubblers b
    join bubbler_markets bm on bm.bubbler_id = b.id
    where b.auth_user_id = auth.uid() and b.role='market_manager_bubbler' and bm.market_id = mid
  )
$$;

-- 4.2 orders, order_service

alter table if exists orders enable row level security;
alter table if exists order_service enable row level security;

create policy if not exists admin_orders_all on orders
  for all using (is_admin()) with check (is_admin());

create policy if not exists mm_orders_market on orders
  for select using (is_market_manager_for(market_id));

create policy if not exists bubbler_orders_linked on orders
  for select using (exists (
    select 1 from order_service os
    join job_assignments ja on ja.order_service_id = os.id
    where os.order_id = orders.id and ja.bubbler_id = current_bubbler_id()
  ));

create policy if not exists admin_os_all on order_service
  for all using (is_admin()) with check (is_admin());

create policy if not exists mm_os_market on order_service
  for select using (is_market_manager_for(market_id));

create policy if not exists bubbler_os_linked on order_service
  for select using (exists (
    select 1 from job_assignments ja where ja.order_service_id = order_service.id
      and ja.bubbler_id = current_bubbler_id()
  ));

-- 4.3 job_assignments

alter table if exists job_assignments enable row level security;

create policy if not exists admin_ja_all on job_assignments
  for all using (is_admin()) with check (is_admin());

create policy if not exists mm_ja_market on job_assignments
  for select using (exists (
    select 1 from order_service os
    where os.id = job_assignments.order_service_id
      and is_market_manager_for(os.market_id)
  ));

create policy if not exists bubbler_ja_own on job_assignments
  for select using (bubbler_id = current_bubbler_id());

-- 4.4 payouts

alter table if exists payouts enable row level security;

create policy if not exists admin_payouts_all on payouts
  for all using (is_admin()) with check (is_admin());

create policy if not exists mm_payouts_market on payouts
  for select using (exists (
    select 1 from order_service os where os.id = payouts.related_order_service_id
      and is_market_manager_for(os.market_id)
  ));

create policy if not exists bubbler_payouts_own on payouts
  for select using (bubbler_id = current_bubbler_id());

-- 4.5 messages

alter table if exists messages enable row level security;

create policy if not exists admin_messages_all on messages
  for all using (is_admin()) with check (is_admin());

create policy if not exists bubbler_messages_own on messages
  for select using (
    sender_id = current_bubbler_id()
    or to_bubbler_id = current_bubbler_id()
    or exists (
      select 1 from order_service os
      join job_assignments ja on ja.order_service_id = os.id
      where messages.order_service_id = os.id and ja.bubbler_id = current_bubbler_id()
    )
  );


