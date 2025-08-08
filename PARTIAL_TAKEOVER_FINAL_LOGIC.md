# ✅ GoGoBubbles: Partial Takeover Final Logic (Confirmed SOP Language)

## 💸 **Payout Responsibility**

- **Partial Takeover bonuses are NOT paid by the company**
- **They are deducted directly from the original bubbler's payout** (the one who fell behind or submitted sloppy work)
- **Lead Bubblers are already paid hourly by the company** - this bonus is additional and triggered only by true underperformance from a bubbler

---

## 🟡 **What Triggers a Partial Takeover? (Two Paths)**

A partial takeover can be triggered in **only two ways**:

### **1. Job Progress Delay (Performance Trigger)**
- If the lead bubbler is called in to assist because a job is **not on track for timely completion** (based on our estimated job duration), this is automatically classified as a partial takeover

**✅ Example:** A Sparkle Bubbler is falling far behind on a 2 bed / 2 bath clean that should take ~2.5 hours solo. The Lead Bubbler must step in to mop, finish rooms, or handle appliances. **Triggered.**

### **2. Quality Check Fails (Correction Trigger)**
- If the Lead Bubbler is doing a standard quality check and discovers issues in completed rooms, and has to **physically re-do enough tasks**, this also qualifies as a partial takeover — but only when certain effort thresholds are met (see below)

---

## ⏱️ **Job Time Expectations (Estimates for Oversight Triggers)**

| Job Type | Example | Expected Solo Duration |
|----------|---------|----------------------|
| **Sparkle Clean** | 1 bed / 1 bath | 1.5 hrs |
| **Sparkle Clean** | 2 bed / 1 bath | 2 hrs |
| **Sparkle Clean** | 2 bed / 2 bath | 2.5 hrs |
| **Signature Deep** | 2 bed / 2 bath | 3.5 – 4 hrs |
| **Car Wash** | 1 vehicle, Signature Shine | 45–60 mins |
| **Laundry** | 1 Essentials Bag | 30–40 mins (folding + sorting) |

*These are used internally for performance oversight, not visible to customers.*

---

## 🔧 **Task Effort Classification**

Each re-clean or redo task is categorized as:

| Level | Description | Examples |
|-------|-------------|----------|
| **Minor** | Quick, non-physical | Mirror streaks, single counter wipe-down, light touch-ups |
| **Moderate** | Light physical labor | Re-cleaning a toilet, re-mopping one small area, sweeping a room |
| **Major** | Time-intensive / heavier labor | Re-cleaning shower/tub, grout, fridge interior, dusting full ceiling fan, full floor mop |

---

## 🔁 **Thresholds for Automatic Partial Takeover Classification**

| Trigger | Partial Takeover? |
|---------|------------------|
| **3+ Minor tasks** | ✅ Yes |
| **2+ Moderate tasks** | ✅ Yes |
| **1+ Major task** | ✅ Yes |
| **1–2 Minor tasks** | ❌ No |
| **1 Moderate + 1 Minor** | ❌ No |
| **2 Minor + 1 Moderate** | ✅ Yes (Combo Threshold) |

**✅ All qualifying takeovers require:**
- Before & after photo documentation
- Submission of "Partial Takeover" form
- Checkbox-style entry of what was redone (no long text)

---

## 📸 **Documentation Requirements (Always Required)**

- **Photos before & after** of each re-done area
- **Lead Bubbler must use dashboard to:**
  - Tap which rooms/tasks were redone (checklist style)
  - Indicate coaching provided
  - Select reason for takeover: **Quality**, **Behind Schedule**, or **Both**

---

## ⏳ **Verification & Approval**

- **Partial Takeover bonus appears as "Pending"** on Lead Bubbler dashboard
- **Admin reviews photos + task list**
- **Once approved, bonus is added to next payout**
- **If denied, Lead Bubbler receives feedback + optional coaching**

---

## 🔧 **Technical Implementation**

### **Database Schema:**

#### **`job_time_expectations` Table:**
```sql
CREATE TABLE job_time_expectations (
    id UUID PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL, -- 'sparkle', 'signature_deep', 'car_wash', 'laundry'
    job_description VARCHAR(200) NOT NULL, -- e.g., '2 bed / 2 bath', '1 vehicle', '1 Essentials Bag'
    expected_solo_duration_minutes INTEGER NOT NULL,
    expected_solo_duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (expected_solo_duration_minutes / 60.0) STORED,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **`task_effort_classification` Table:**
```sql
CREATE TABLE task_effort_classification (
    id UUID PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    effort_level VARCHAR(20) NOT NULL CHECK (effort_level IN ('minor', 'moderate', 'major')),
    description TEXT NOT NULL,
    examples TEXT[], -- Array of example tasks
    estimated_minutes INTEGER NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'sparkle', 'car_wash', 'laundry'
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **`partial_takeover_triggers` Table:**
```sql
CREATE TABLE partial_takeover_triggers (
    id UUID PRIMARY KEY,
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id),
    trigger_path VARCHAR(50) NOT NULL CHECK (trigger_path IN ('performance_delay', 'quality_fail')),
    trigger_reason VARCHAR(100) NOT NULL, -- 'behind_schedule', 'quality_issues', 'both'
    
    -- Performance delay metrics
    expected_completion_time TIMESTAMP WITH TIME ZONE,
    actual_progress_percentage DECIMAL(5,2),
    time_behind_minutes INTEGER,
    
    -- Quality fail metrics
    tasks_redone_count INTEGER,
    effort_levels TEXT[], -- Array of effort levels for redone tasks
    quality_issues_found TEXT[], -- Array of quality issues
    
    -- Combined metrics
    total_effort_minutes INTEGER,
    threshold_met BOOLEAN NOT NULL,
    threshold_details JSONB -- Store threshold calculation details
);
```

### **Default Job Time Expectations:**

#### **Sparkle Clean:**
- 1 bed / 1 bath: 90 minutes
- 2 bed / 1 bath: 120 minutes
- 2 bed / 2 bath: 150 minutes
- 3 bed / 2 bath: 180 minutes
- 4 bed / 3 bath: 240 minutes

#### **Signature Deep:**
- 1 bed / 1 bath: 120 minutes
- 2 bed / 2 bath: 210 minutes
- 3 bed / 2 bath: 270 minutes
- 4 bed / 3 bath: 360 minutes

#### **Car Wash:**
- 1 vehicle - Signature Shine: 45 minutes
- 1 vehicle - Basic Wash: 30 minutes
- 2 vehicles - Signature Shine: 90 minutes
- 2 vehicles - Basic Wash: 60 minutes

#### **Laundry:**
- 1 Essentials Bag: 30 minutes
- 1 Family Bag: 45 minutes
- 2 Essentials Bags: 60 minutes
- 2 Family Bags: 90 minutes

### **Default Task Effort Classifications:**

#### **Minor Tasks (Quick, Non-Physical):**
- **Mirror streaks:** Quick mirror or glass touch-up (2 min)
- **Single counter wipe-down:** Quick countertop cleaning (3 min)
- **Light touch-ups:** Minor surface cleaning (2 min)
- **Dashboard wipe:** Quick interior surface cleaning (3 min)
- **Wrong detergent:** Detergent correction (5 min)

#### **Moderate Tasks (Light Physical Labor):**
- **Re-cleaning toilet:** Toilet bowl and seat cleaning (8 min)
- **Re-mopping small area:** Small floor area mopping (10 min)
- **Sweeping room:** Room floor sweeping (5 min)
- **Door panel cleaning:** Exterior door panel work (8 min)
- **Folding errors:** Clothing refolding (10 min)

#### **Major Tasks (Time-Intensive / Heavier Labor):**
- **Re-cleaning shower/tub:** Full shower or tub cleaning (20 min)
- **Grout cleaning:** Tile grout deep cleaning (25 min)
- **Fridge interior:** Refrigerator interior cleaning (30 min)
- **Full floor mop:** Complete floor mopping (20 min)
- **Full exterior panel re-dry:** Complete vehicle panel drying (15 min)
- **Entire ironing bag re-iron:** Complete ironing rework (25 min)

---

## 🎯 **Workflow Examples**

### **Example 1: Performance Delay Trigger**
1. **Scenario:** Sparkle Bubbler assigned to 2 bed / 2 bath clean (expected 2.5 hours)
2. **Issue:** After 2 hours, only 40% complete (should be 80% at this point)
3. **Lead Bubbler Action:** Steps in to mop floors and finish bathrooms
4. **Classification:** Performance delay trigger
5. **Result:** Partial takeover bonus deducted from original bubbler's payout

### **Example 2: Quality Fail Trigger**
1. **Scenario:** Lead Bubbler doing QA check on completed Sparkle clean
2. **Issues Found:** 
   - Mirror streaks (minor)
   - Toilet not properly cleaned (moderate)
   - Shower needs re-cleaning (major)
3. **Classification:** Quality fail trigger (1 major task = automatic partial takeover)
4. **Result:** Partial takeover bonus deducted from original bubbler's payout

### **Example 3: Combined Trigger**
1. **Scenario:** Lead Bubbler called in for assistance
2. **Issues Found:**
   - Job behind schedule (performance delay)
   - Multiple quality issues requiring rework (quality fail)
3. **Classification:** Combined trigger (both performance and quality issues)
4. **Result:** Partial takeover bonus deducted from original bubbler's payout

---

## 🔐 **Key Principles**

### **✅ Fair Compensation**
- **Lead Bubblers already paid hourly** for oversight duties
- **Bonus only for additional work** beyond normal oversight
- **Deduction from underperforming bubbler** ensures accountability

### **✅ Clear Thresholds**
- **Objective criteria** prevent subjective decisions
- **Effort-based classification** ensures appropriate compensation
- **Documentation requirements** maintain quality standards

### **✅ Accountability**
- **Original bubbler pays for their underperformance**
- **Lead Bubbler compensated for additional work**
- **Admin oversight** ensures fair application

### **✅ Quality Assurance**
- **Photo documentation** required for all partial takeovers
- **Checklist-based entry** ensures consistent documentation
- **Admin review** maintains standards and prevents abuse

---

## 🎯 **Benefits Summary**

### **✅ Protects Company Resources**
- **No additional company cost** for partial takeovers
- **Deduction from underperforming bubbler** maintains payroll integrity
- **Clear thresholds** prevent unnecessary payouts

### **✅ Ensures Quality**
- **Lead Bubblers motivated** to maintain standards
- **Original bubblers accountable** for their performance
- **Documentation requirements** maintain service quality

### **✅ Fair Compensation**
- **Lead Bubblers compensated** for additional work
- **Original bubblers pay** for their underperformance
- **Clear criteria** ensure consistent application

### **✅ Maintains Accountability**
- **Performance-based deductions** encourage improvement
- **Quality-based triggers** maintain service standards
- **Admin oversight** ensures fair application

This final logic ensures **fair, accountable, and quality-focused** partial takeover compensation while **protecting company resources** and **maintaining service standards**! ✅ 