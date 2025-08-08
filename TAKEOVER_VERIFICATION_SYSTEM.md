# Takeover Verification System

## Overview

The Takeover Verification System provides a comprehensive review process for Lead Bubbler takeover claims to prevent fraud, ensure proper compensation, and maintain operational integrity. This system implements the exact workflow specified in the SOP with automatic task creation, admin review, and final payout approval.

## 🧭 Who Determines Takeover Type?

### Lead Bubbler Initiates Classification

The Lead Bubbler is responsible for selecting whether their support action is:
- **Light Check-In** (standard hourly) ✅
- **Partial Takeover** (flat bonus) 🔸
- **Full Takeover** (replaces bubbler payout) 🔴

This is submitted through their dashboard form when ending a check-in or oversight shift. They select:

**Check-In Outcome:**
- [ ] Standard QA/Coaching
- [ ] Partial Takeover (30–75% of job)
- [ ] Full Takeover (75–100% of job)

**Required Information:**
- Duration of assistance
- Summary of what tasks were completed
- Whether they finished the job themselves
- Labor percentage covered
- Specific tasks completed

---

## 🔒 How It's Verified & Approved

### Admin or Support Bubbler Reviews for Fraud or Abuse

To prevent abuse or double-payouts:
- **Automatic Flagging:** System flags check-ins marked as partial/full takeovers
- **Review Assignment:** Support Bubbler or Admin receives a review task in the admin dashboard
- **Verification Process:** They compare:
  - Timestamps
  - Notes from both Lead and Regular Bubbler
  - Job duration left vs. takeover duration
  - Labor percentage covered
  - Tasks completed
  - Any customer feedback (if applicable)

### Final Payout Triggered Only After Review

Once verified:
- **Lead Bubbler payout** is finalized
- **Original Bubbler's payout** is prorated (if applicable)
- **Notes are saved** in `lead_checkins` and `takeover_verification_tasks` for transparency

---

## 🔁 How Payouts Are Split

### ✅ Light Check-In:
- **No bonus**, just hourly oversight pay
- **No impact** to original bubbler's pay
- **No verification required**

### 🔸 Partial Takeover:
- **Lead Bubbler receives:** Hourly rate + flat bonus (e.g. $10–$20)
- **Original Bubbler:** Still gets full payout unless support exceeded 50% of labor
- **Admin can manually prorate** payout if needed (optional)

### 🔴 Full Takeover:
- **Lead Bubbler receives:** Full payout of the job, not hourly
- **Original Bubbler receives:**
  - $10 standby bonus (if left mid-job)
  - Or a prorated amount if they completed part before leaving
- **System logs** who performed each portion for transparency

---

## 📋 What Oversight Is For

Oversight mode covers:

| Function | Covered by Hourly Pay | Triggers Bonus? |
|----------|----------------------|-----------------|
| Standard Check-ins | ✅ Yes | ❌ No |
| Coaching & Feedback | ✅ Yes | ❌ No |
| Quick Interventions (<30 min) | ✅ Yes | ❌ No |
| Partial Hands-on Help (30+ min) | ✅ Yes + 🔸Bonus | ✅ Yes |
| Full Takeover of Job | ❌ No | 🔴 Replaces regular pay |

This keeps oversight **affordable**, **fair**, and **scalable** — without overlap or abuse.

---

## 🔧 Technical Implementation

### Database Schema

#### Enhanced `lead_checkins` Table:
```sql
-- Verification and approval fields
verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'flagged')),
reviewed_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
reviewed_at TIMESTAMP WITH TIME ZONE,
review_notes TEXT,
labor_percentage_covered INTEGER CHECK (labor_percentage_covered >= 0 AND labor_percentage_covered <= 100),
tasks_completed TEXT,
job_finished_by_lead BOOLEAN DEFAULT FALSE,
```

#### New `takeover_verification_tasks` Table:
```sql
CREATE TABLE takeover_verification_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_checkin_id UUID REFERENCES lead_checkins(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    original_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    takeover_type VARCHAR(20) NOT NULL CHECK (takeover_type IN ('partial', 'full')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'flagged')),
    assigned_to UUID REFERENCES bubblers(id) ON DELETE SET NULL, -- admin or support bubbler
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    verification_decision VARCHAR(20) CHECK (verification_decision IN ('approved', 'rejected', 'needs_adjustment')),
    adjusted_compensation DECIMAL(8,2),
    original_bubbler_impact VARCHAR(50) CHECK (original_bubbler_impact IN ('no_impact', 'prorated', 'full_credit', 'standby_bonus')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Automatic Task Creation

#### Function: `create_takeover_verification_task()`
```sql
-- Automatically creates verification task when partial or full takeover is logged
CREATE OR REPLACE FUNCTION create_takeover_verification_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create verification task for partial or full takeovers
    IF NEW.takeover_type IN ('partial', 'full') THEN
        INSERT INTO takeover_verification_tasks (
            lead_checkin_id,
            lead_bubbler_id,
            original_bubbler_id,
            job_assignment_id,
            takeover_type,
            status,
            created_at
        ) VALUES (
            NEW.id,
            NEW.lead_bubbler_id,
            NEW.assisting_bubbler_id,
            NEW.job_assignment_id,
            NEW.takeover_type,
            'pending',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Trigger:
```sql
CREATE TRIGGER trigger_create_takeover_verification_task
    AFTER INSERT ON lead_checkins
    FOR EACH ROW
    EXECUTE FUNCTION create_takeover_verification_task();
```

---

## 🎯 Dashboard Implementation

### Lead Bubbler Dashboard Updates

#### Enhanced Intervention Modal:
- **Takeover Level Selection:** None/Partial/Full dropdown
- **Labor Percentage Covered:** Estimate what percentage of job labor was covered
- **Tasks Completed:** Detailed description of specific tasks performed
- **Job Finished by Lead:** Checkbox indicating if lead finished the job
- **Compensation Preview:** Real-time calculation with verification status

#### Compensation Messages:
- **Light Assistance:** "Hourly rate only (no verification required)"
- **Partial Takeover:** "Pending admin verification for hourly rate + bonus"
- **Full Takeover:** "Pending admin verification for full job payout"

### Admin Takeover Verification Dashboard

#### Features:
- **Task Overview:** Total, pending, in review, completed tasks
- **Filtering:** By status, takeover type, assignment
- **Task Assignment:** Admins can assign tasks to themselves
- **Detailed Review:** Comprehensive review modal with all task details
- **Decision Options:** Approved, rejected, needs adjustment
- **Compensation Adjustment:** Manual override capabilities
- **Original Bubbler Impact:** Control over original bubbler payout

#### Review Process:
1. **View Task Details:** Lead bubbler, original bubbler, takeover type, duration
2. **Review Documentation:** Notes, tasks completed, labor percentage
3. **Make Decision:** Approve, reject, or adjust compensation
4. **Set Original Bubbler Impact:** No impact, prorated, full credit, standby bonus
5. **Submit Review:** Finalize verification and trigger compensation

---

## 🔄 Workflow Process

### 1. Lead Bubbler Logs Takeover
- Selects takeover level (none/partial/full)
- Provides duration, labor percentage, tasks completed
- Submits intervention with detailed notes

### 2. Automatic Task Creation
- System creates verification task for partial/full takeovers
- Task status: "pending"
- No compensation processed yet

### 3. Admin Review Assignment
- Admin assigns task to themselves
- Task status: "in_review"
- Admin reviews all documentation

### 4. Verification Decision
- Admin makes decision: approved/rejected/adjustment
- Provides detailed review notes
- Sets original bubbler impact

### 5. Compensation Processing
- If approved: compensation is calculated and applied
- If rejected: no compensation, task marked as rejected
- If adjustment: manual compensation amount applied

### 6. Final Status
- Task status: "completed"
- All notes and decisions logged for audit trail
- Compensation finalized

---

## 📊 Verification Criteria

### Partial Takeover Approval Criteria:
- **Duration:** 30+ minutes of active assistance
- **Labor Percentage:** Reasonable estimate (10-75%)
- **Tasks Completed:** Specific, verifiable tasks
- **Documentation:** Clear notes and justification
- **No Conflicts:** No contradictory information

### Full Takeover Approval Criteria:
- **Job Completion:** Lead finished the job themselves
- **Original Bubbler Status:** Confirmed absence/incapacity
- **Labor Percentage:** 75-100% of job completed
- **Documentation:** Comprehensive notes and justification
- **Customer Impact:** Minimal disruption to service

### Rejection Criteria:
- **Insufficient Documentation:** Missing or unclear notes
- **Unreasonable Claims:** Excessive duration or labor percentage
- **Conflicting Information:** Contradictory timestamps or notes
- **Pattern Abuse:** Repeated questionable claims
- **Customer Complaints:** Negative feedback about intervention

---

## 🛡️ Fraud Prevention Measures

### Automatic Safeguards:
- **Duration Validation:** System flags unusually long durations
- **Pattern Detection:** Repeated claims from same lead bubbler
- **Conflict Checking:** Timestamp and note consistency
- **Required Fields:** All verification fields must be completed

### Manual Review Process:
- **Admin Oversight:** All partial/full takeovers require review
- **Detailed Documentation:** Comprehensive notes required
- **Decision Tracking:** All decisions logged with reasoning
- **Audit Trail:** Complete history of verification process

### Compensation Controls:
- **No Automatic Payout:** All bonuses require approval
- **Adjustment Capabilities:** Admins can modify compensation
- **Original Bubbler Protection:** Controlled impact on original payouts
- **Transparency:** All compensation decisions visible to stakeholders

---

## ✅ Implementation Status

- ✅ **Database Schema:** Complete with verification fields and task table
- ✅ **Automatic Task Creation:** Trigger function implemented
- ✅ **Lead Bubbler Dashboard:** Enhanced with verification fields
- ✅ **Admin Verification Dashboard:** Complete review system
- ✅ **Compensation Logic:** Updated to require verification
- ✅ **Fraud Prevention:** Comprehensive safeguards implemented
- ✅ **Documentation:** Complete workflow and criteria defined

---

## 🎯 Key Benefits

### Operational Integrity:
- **Prevents Fraud:** Comprehensive review process
- **Ensures Fairness:** Proper compensation for all parties
- **Maintains Quality:** Detailed documentation requirements
- **Provides Transparency:** Complete audit trail

### Cost Control:
- **No Automatic Bonuses:** All payouts require approval
- **Adjustment Capabilities:** Manual override when needed
- **Original Bubbler Protection:** Controlled impact on payouts
- **Pattern Detection:** Identifies potential abuse

### User Experience:
- **Clear Process:** Well-defined workflow for all parties
- **Real-time Feedback:** Immediate status updates
- **Detailed Documentation:** Comprehensive review capabilities
- **Fair Compensation:** Proper rewards for legitimate assistance

This verification system ensures **operational integrity**, **cost control**, and **fair compensation** while preventing fraud and maintaining quality standards! 🎯 