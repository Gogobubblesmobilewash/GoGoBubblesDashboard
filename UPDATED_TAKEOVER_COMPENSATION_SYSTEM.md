# 🔄 Updated Takeover Compensation System

## 🎯 **NEW FINANCIAL LOGIC: Company Margin Protection**

### **Core Principle: Partial Assistance Costs Come from Original Bubbler**

The updated system ensures that **partial assistance bonuses are deducted from the original bubbler's payout**, not from company margins. This creates true accountability and encourages proper time management.

---

## 💰 **Compensation Breakdown by Scenario**

| Scenario | Lead Bubbler Payout | Original Bubbler Payout | Company Impact |
|----------|-------------------|------------------------|----------------|
| **Quality Check Only** | Hourly rate only | Full job payout | ✅ No bonus required |
| **Partial Takeover (30%+ assisted)** | Hourly + flat bonus ($10-$20) | Job payout minus lead bonus | ✅ Still profitable |
| **Full Takeover** | Full job payout | $10-$15 standby fee | ✅ Profitable, case-by-case |

---

## 🔧 **Technical Implementation**

### **Enhanced `calculate_lead_bonus()` Function**

```sql
CREATE OR REPLACE FUNCTION calculate_lead_bonus(
    checkin_type VARCHAR(50),
    service_type VARCHAR(50),
    oversight_type VARCHAR(50),
    duration_minutes INTEGER DEFAULT 0,
    takeover_type VARCHAR(20) DEFAULT 'none'
)
RETURNS TABLE (
    bonus_type VARCHAR(50),
    bonus_amount DECIMAL(5,2),
    bonus_reason TEXT,
    takeover_type VARCHAR(20),
    job_payout_eligible BOOLEAN,
    original_bubbler_deduction DECIMAL(5,2)  -- NEW FIELD
)
```

### **Financial Logic by Scenario:**

#### **1. Quality Check Only (No Assistance)**
- **Lead Bubbler:** Hourly rate only
- **Original Bubbler:** Full job payout
- **Deduction:** $0.00
- **Reason:** "Quality check only - hourly pay only, no deduction"

#### **2. Partial Takeover (30+ minutes assistance)**
- **Lead Bubbler:** Hourly rate + fixed bonus
  - Fresh (Laundry): $10.00
  - Sparkle (Home Cleaning): $15.00
  - Shine (Car Wash): $20.00
- **Original Bubbler:** Job payout minus lead bonus
- **Deduction:** Same as bonus amount
- **Reason:** "Partial takeover - bonus deducted from original bubbler payout"

#### **3. Full Takeover**
- **Lead Bubbler:** Full job payout (no hourly rate)
- **Original Bubbler:** $10.00 standby fee
- **Deduction:** $10.00
- **Reason:** "Full takeover - lead gets full job payout, original gets standby fee"

---

## 🎯 **Enforcement Logic**

### **For Bubblers:**
- Must check off room-by-room or task-by-task completion
- If Lead Bubbler logs partial assist:
  - System tags the bubbler
  - Deducts bonus from their payout
  - Logs in performance record
  - Shows notification: *"Your payout for this job was reduced by $X due to assistance required. Stay on schedule to avoid penalties."*

### **For Lead Bubblers:**
- Select: Quality Check, Partial Assist, or Full Takeover
- When choosing assist or takeover:
  - System automatically logs their bonus
  - Deducts from original bubbler
  - Requires task completion documentation
  - Triggers follow-up review

---

## 📋 **Check-In Frequency Tiers**

### **Automated QA Scheduling System**

| Bubbler Type | Check-In Frequency | Notes |
|-------------|-------------------|-------|
| ⭐ **New Bubbler** (1st 5-10 jobs) | Every job | Onboarding monitoring |
| 🚨 **Recent bad rating** | Every job for next 3-5 jobs | Coaching and quality |
| ⚠️ **Low overall ratings** | 2x per week | Monitor for retention/removal |
| 🟡 **High performer** | 1x every 1-2 weeks | Spot QA only |
| 🔁 **Random QA** | 5-10% of all jobs | Keeps everyone sharp |

---

## 🗄️ **Database Schema Updates**

### **New Tables:**

#### **`bubbler_flags` Table**
```sql
CREATE TABLE bubbler_flags (
    id UUID PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id),
    flag_type VARCHAR(50), -- 'new_bubbler', 'bad_rating', 'low_performance', 'high_performer'
    flag_reason TEXT,
    check_in_frequency VARCHAR(20), -- 'every_job', 'weekly', 'biweekly', 'random'
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES bubblers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **`lead_checkin_schedule` Table**
```sql
CREATE TABLE lead_checkin_schedule (
    id UUID PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id),
    lead_bubbler_id UUID REFERENCES bubblers(id),
    job_assignment_id UUID REFERENCES job_assignments(id),
    schedule_type VARCHAR(50), -- 'mandatory', 'random', 'performance_based'
    check_in_reason TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    scheduled_date DATE,
    scheduled_time TIME,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🎯 **Benefits of New System**

### **✅ Bubbler Accountability**
- Encourages proper time management
- Discourages sloppiness and overbooking
- Prevents false "help me" situations

### **✅ Lead Bubbler Protection**
- Ensures their time is respected
- Prevents overuse of assistance
- Clear compensation structure

### **✅ Company Margin Retention**
- No additional costs for partial assistance
- Maintains profitability
- Transparent cost allocation

### **✅ Transparent Reporting**
- Clear breakdown of deductions
- Performance tracking
- Audit trail for all assistance

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Enhanced with deduction tracking
- ✅ **Function Updates:** `calculate_lead_bonus()` with deduction logic
- ✅ **New Tables:** `bubbler_flags` and `lead_checkin_schedule`
- ✅ **RLS Policies:** Secure access control
- ✅ **Financial Logic:** Company margin protection
- ✅ **QA Scheduling:** Automated frequency tiers
- 🔄 **Frontend Updates:** Dashboard notifications and deduction display
- 🔄 **Admin Interface:** Flag management and schedule oversight

---

## 💡 **Key Features**

1. **Automatic Deduction:** System automatically calculates and applies deductions
2. **Performance Tracking:** Flags and schedules based on bubbler performance
3. **Transparent Communication:** Clear notifications about deductions
4. **Audit Trail:** Complete record of all assistance and deductions
5. **Flexible Scheduling:** Different check-in frequencies based on performance
6. **Margin Protection:** Company costs remain predictable and profitable

This system creates a **win-win-win** scenario: Bubblers are accountable, Lead Bubblers are protected, and the company maintains healthy margins! 🎯 