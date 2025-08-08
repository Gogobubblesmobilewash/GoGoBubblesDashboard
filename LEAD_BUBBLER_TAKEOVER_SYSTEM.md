# Lead Bubbler Takeover System Documentation

## Overview

The Lead Bubbler Takeover System provides clear definitions and compensation rules for different levels of intervention by Lead Bubblers when assisting regular bubblers on jobs. This system ensures fair compensation while protecting margins and maintaining operational clarity.

## 🧭 Takeover Definitions & Triggers

### ✅ Light Assistance (No Bonus — Hourly Pay Only)

**Definition:**
Lead Bubbler performs minor help during check-in without significantly disrupting or performing the bubbler's assigned duties.

**Examples:**
- Helping fold a few items during laundry QA
- Giving verbal coaching or feedback
- Carrying supplies from car to job site
- Assisting with one quick task (e.g. vacuuming one row of car seats)
- Temporarily lifting a heavy item (e.g. mop bucket)
- Performing minor touch-up during quality check

**Trigger:**
- Duration of active help is less than 30 minutes
- Bubbler remains fully in control of the job
- No sustained task takeover or job role substitution occurs

**Compensation:** Hourly oversight rate only

---

### 🟨 Partial Takeover (Bonus + Hourly Pay)

**Definition:**
Lead Bubbler assists actively for 30+ minutes on any critical or labor-intensive portion of the job due to bubbler falling behind, lacking skill, or facing temporary disruption.

**Examples:**
- Folding or sorting a full laundry load with the bubbler
- Performing full cleaning of a room (Sparkle) while bubbler handles another
- Completing half the exterior wash on a vehicle (Shine)
- Subbing in on vacuuming and shampooing while bubbler preps other areas
- Handling a delicate/iron laundry load directly while bubbler handles the rest

**Trigger Criteria:**
- 30+ minutes of active hands-on task execution
- Task involves core service duties, not just support
- Bubbler still completes job, but lead materially contributes

**Compensation:** Hourly rate + Service-specific bonus
- **Fresh (Laundry):** $10 bonus
- **Sparkle (Home Cleaning):** $15 bonus
- **Shine (Car Wash):** $20 bonus

---

### 🟥 Full Takeover (Full Job Payout)

**Definition:**
Lead Bubbler becomes responsible for job outcome due to bubbler absence, walk-off, no-show, or inability to finish.

**Examples:**
- Bubbler leaves early or gets sick mid-job
- Customer refuses to let bubbler finish due to issue, lead takes over
- Bubbler abandons site and Lead is dispatched or already present
- Bubbler doesn't show up at all, Lead is reassigned job

**Trigger Criteria:**
- Lead performs 100% or near 100% of the job
- Lead is now the primary responsible party
- Customer confirmation or admin override confirms reassignment

**Compensation:** Full job payout (no hourly rate)
- **Original Bubbler:** $10 credit if they started the job
- **Lead Bubbler:** Full job payout minus $10 credit

---

## 🛑 Bonus Eligibility Safeguards

### Automatic Triggering
- All bonuses are automatically calculated based on duration + intervention type logged in `lead_checkins`
- Each check-in must specify:
  - `checkin_type` = 'coaching' / 'assist' / 'takeover'
  - `duration_minutes`
  - `bonus_type` = 'partial_assist', 'full_takeover', or null

### Admin Oversight
- Admin dashboard includes review and override options
- All interventions are logged with detailed notes
- Compensation calculations are transparent and auditable

---

## 📊 Summary Table

| Scenario | Duration | Bubbler Involved? | Lead Performs Job? | Bonus? | Compensation Type |
|----------|----------|-------------------|-------------------|---------|-------------------|
| Light Assist | < 30 min | ✅ Yes | ❌ Minimal | ❌ No | Hourly Only |
| Partial Takeover | ≥ 30 min | ✅ Yes | ✅ Partial | ✅ Yes | Hourly + Fixed Bonus |
| Full Takeover | Any | ❌ No | ✅ Entirely | ❌ No | Full Job Payout |

---

## 💰 Compensation Structure

### Hourly Rates (Based on Service Type)
- **Fresh (Laundry):** $17.00/hour
- **Sparkle (Home Cleaning):** $20.00/hour
- **Shine (Car Wash):** $22.00/hour

### Bonus Amounts
- **Partial Takeover:**
  - Fresh: $10.00
  - Sparkle: $15.00
  - Shine: $20.00
- **Full Takeover:** Full job payout (no bonus, replaces hourly rate)

### Equipment Delivery & Coaching
- **Equipment Delivery:** Hourly rate only (no bonus)
- **Coaching:** Hourly rate only (no bonus)
- **QA Checks:** Hourly rate only (no bonus)

---

## 🔧 Technical Implementation

### Database Functions

#### `calculate_lead_bonus()`
```sql
-- Determines compensation type and amount based on:
-- - checkin_type (assist/takeover/coaching/qa/equipment_delivery)
-- - service_type (fresh/sparkle/shine)
-- - duration_minutes
-- - takeover_type (none/partial/full)
-- Returns: bonus_type, bonus_amount, takeover_type, job_payout_eligible
```

#### `process_lead_checkin_compensation()`
```sql
-- Processes complete compensation calculation:
-- - SCENARIO 1: Full takeover - Lead gets full job payout (no hourly rate)
-- - SCENARIO 2: Partial takeover - Hourly rate + fixed bonus
-- - SCENARIO 3: Light assistance - Hourly rate only
-- - Updates checkin record with takeover_type, job_payout, credited_to, etc.
```

### Dashboard Integration

#### Lead Bubbler Dashboard
- **Intervention Modal:** Type selection (assist/takeover/coaching)
- **Duration Input:** Minutes of active assistance
- **Compensation Preview:** Real-time calculation display
- **Service Type Detection:** Automatic based on job assignment

#### Admin Performance Panel
- **Intervention Tracking:** All takeover activities logged
- **Compensation Review:** Detailed breakdown of hourly + bonus payments
- **Override Capabilities:** Admin can adjust compensation if needed

---

## 📋 Usage Guidelines

### For Lead Bubblers
1. **Select appropriate intervention type** when logging assistance
2. **Accurately record duration** of active hands-on work
3. **Provide detailed notes** explaining the intervention
4. **Review compensation preview** before submitting

### For Admins
1. **Monitor intervention patterns** for potential abuse
2. **Review compensation calculations** regularly
3. **Override when necessary** based on actual circumstances
4. **Track performance metrics** for retention decisions

### For Regular Bubblers
1. **Provide honest feedback** on Lead Bubbler assistance
2. **Report any concerns** about intervention quality
3. **Understand compensation structure** for transparency

---

## 🎯 Key Benefits

### Operational Clarity
- Clear definitions prevent confusion about compensation
- Automatic calculation reduces manual errors
- Transparent system builds trust

### Cost Control
- Service-specific bonuses reflect complexity
- Duration-based triggers prevent overpayment
- Admin oversight ensures compliance

### Quality Assurance
- Detailed logging enables performance tracking
- Feedback system maintains standards
- Retention criteria based on actual performance

---

## 🔄 System Flow

1. **Lead Bubbler identifies need for intervention**
2. **Selects appropriate type** (assist/takeover/coaching)
3. **Records accurate duration** of active assistance
4. **Provides detailed notes** explaining intervention
5. **System calculates compensation** automatically
6. **Admin reviews and approves** (if needed)
7. **Compensation applied** to Lead Bubbler's earnings
8. **Regular bubbler provides feedback** on experience

This system ensures fair compensation for Lead Bubblers while maintaining operational efficiency and protecting company margins. 