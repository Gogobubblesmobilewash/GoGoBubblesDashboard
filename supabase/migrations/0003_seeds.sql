-- GoGoBubbles Build Pack v2.0 — Minimal Seeds

-- Markets
insert into markets(code,name) values ('HOU','Houston')
  on conflict (code) do nothing;

-- Standby policy
insert into standby_policy(company_margin_pct, split_method)
values (0.30,'even') on conflict do nothing;

-- Large job thresholds (sparkle)
insert into large_job_thresholds(service_type, bedrooms_min, bathrooms_min)
values ('sparkle',4,3) on conflict do nothing;

-- Daily capacity sensible defaults
insert into daily_capacity_rules(role, service_type, max_jobs_per_day, max_minutes_per_day) values
('sparkle_bubbler','sparkle',4,360),
('shine_bubbler','shine',6,360),
('fresh_bubbler','fresh',10,300),
('elite_bubbler',null,5,420)
on conflict do nothing;

-- Deposit rules (include $20 floor tiers)
insert into deposit_rules(service_type,tier,min_deposit_cents,calc_formula) values
('shine','express',2000,'max(2000, round(0.2*amount))'),
('shine','signature',3000,'max(3000, round(0.2*amount))'),
('shine','supreme',4000,'max(4000, round(0.2*amount))'),
('sparkle','refresh',2000,'max(2000, round(0.2*amount))'),
('sparkle','deep',3000,'max(3000, round(0.2*amount))'),
('fresh','standard_bag',2000,'max(2000, round(0.2*amount))'),
('fresh','large_bag',2500,'max(2500, round(0.2*amount))')
on conflict do nothing;

-- Service task templates (baseline)
insert into service_task_templates(service_type,tier,room_kind,expected_minutes,photo_before_required,photo_after_required) values
('sparkle','refresh','bedroom',25,true,true),
('sparkle','refresh','bathroom',25,true,true),
('sparkle','refresh','kitchen',30,true,true),
('sparkle','refresh','living_room',20,true,true),
('sparkle','refresh','other_living',15,true,true),
('sparkle','refresh','office_den',20,true,true),
('sparkle','refresh','media_room',20,true,true),
('sparkle','refresh','game_room',20,true,true),
('sparkle','deep','bedroom',35,true,true),
('sparkle','deep','bathroom',40,true,true),
('sparkle','deep','kitchen',45,true,true),
('sparkle','deep','living_room',30,true,true),
('sparkle','deep','other_living',25,true,true),
('sparkle','deep','office_den',30,true,true),
('sparkle','deep','media_room',30,true,true),
('sparkle','deep','game_room',30,true,true),
('shine','express',null,25,true,true),
('shine','signature',null,45,true,true),
('shine','supreme',null,60,true,true),
('fresh','standard_bag',null,15,true,true),
('fresh','large_bag',null,25,true,true)
on conflict do nothing;

-- Perks rules
insert into perks_rules(rule_code,service_type,tier,trigger_expr,benefit) values
('first_shine_air_freshener','shine',null,'first_service=true','free air freshener'),
('shine_tier_air_freshener','shine','signature','true','free air freshener'),
('shine_tier_air_freshener_supreme','shine','supreme','true','free air freshener'),
('first_sparkle_candle','sparkle',null,'first_service=true','free candle'),
('every_third_deep_candle','sparkle','deep','every_n=3','free candle')
on conflict do nothing;

-- Onboarding steps
insert into onboarding_steps(code,title,description) values
('profile','Profile','Complete your profile'),
('equipment_photos','Equipment Photos','Upload equipment readiness photos'),
('policy_sign','Policy Sign','Sign policies'),
('quiz','Quiz','Pass the basics quiz'),
('in_person','In-Person','Attend in-person onboarding'),
('web_module','Web Module','Complete online training')
on conflict (code) do nothing;

-- Tip resources (minimal sample; expand later)
insert into tip_resources(code,title,body_markdown,service_type,tags) values
('sparkle_bathroom_streak_free','Sparkle Bathroom: Streak-Free Mirrors','Use two-cloth method...','sparkle',array['bathroom','mirrors']),
('shine_wheels','Shine: Wheel Cleaning','Always pre-rinse wheels...','shine',array['wheels']),
('fresh_sorting_best','Fresh: Sorting Best Practices','Sort by color and fabric...','fresh',array['sorting'])
on conflict (code) do nothing;


