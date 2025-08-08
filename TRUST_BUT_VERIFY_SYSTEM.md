# ✅ "Trust But Verify" Rule for Lead Bubbler Partial Takeovers

## 🔷 **🎯 Objective**

Allow Lead Bubblers to initiate as many partial takeovers as needed, but automatically flag any unusual volume for review — both to protect payroll and surface deeper issues in your bubbler workforce.

---

## 🔹 **Lead Bubbler Partial Takeover Trigger Rule**

### **Trigger:**
If a Lead Bubbler completes partial takeovers on **3 or more out of 5 jobs (60%+ rate)** during a single shift block or zone → System triggers flag for admin review

---

## 🔹 **Trigger Criteria (Customizable Per Deployment Zone)**

| Zone Type | Shift Size | Trigger Threshold |
|-----------|------------|-------------------|
| **Small zone (≤3 bubblers)** | 1 Lead | 2+ partials triggers review |
| **Medium zone (4–6 bubblers)** | 1 Lead | 3+ partials triggers review |
| **Large zone (7–10 bubblers)** | 2 Leads (split) | 60%+ partials from one Lead triggers review |
| **Company-wide trend (optional)** | Any | 6+ partials in same 12-hr period from same Lead triggers review |

---

## 🔹 **Admin Dashboard Notification**

| Field | Value |
|-------|-------|
| **Alert Type** | ⚠️ Partial Takeover Spike |
| **Triggered By** | Lead Bubbler: [Name] |
| **Bubblers Impacted** | List of Bubbler IDs or job codes |
| **Zone / Area** | e.g., Houston – NE Sector |
| **Time Range** | e.g., 9:00am–2:00pm |
| **% of Jobs With Partial Takeover** | e.g., 4 out of 5 = 80% |
| **System Suggestion** | Review tasks and cross-compare bubbler performance |

---

## 🔹 **Why This Works**

This system:

| Benefit | Outcome |
|---------|---------|
| **✅ No cap on how many assists a Lead can do** | Keeps Lead empowered |
| **✅ You still verify when volume is suspicious** | Protects against abuse |
| **✅ Helps identify weak bubblers** | So you can retrain or remove |
| **✅ Prevents unnecessary payroll bloat** | Pays only when warranted |
| **✅ Ensures Lead Bubblers aren't padding time** | Because they know review is coming |
| **✅ Gives context to volume** | Are all five bubblers struggling? Is it a zone issue? |

---

## 🔹 **What This Triggers Internally**

When triggered:
- **System pulls all Lead Bubbler logs** for the flagged shift
- **Admin sees:**
  - Time stamps
  - Room/task types redone
  - Before/after photos
  - Comments from bubbler (if disputes)
- **Admin can:**
  - ✅ **Approve all payouts**
  - 🟨 **Mark one or more for closer review**
  - ❌ **Deny one if it doesn't meet partial takeover threshold**
  - 🧭 **Flag bubbling training need or issue**

---

## 🔹 **Optional Tiered Response System**

| Outcome | Admin Action |
|---------|--------------|
| **All partial takeovers valid** | Approve and log positive note |
| **Most are valid, 1 questionable** | Approve with coaching note |
| **2+ questionable** | Flag for coaching → Lead Bubbler & Bubbler(s) |
| **Pattern repeats next shift** | Trigger 1:1 with manager |

---

## 🔧 **Technical Implementation**

### **Core Functions:**

#### **`check_trust_but_verify_threshold()` - Threshold Monitoring**
```sql
CREATE OR REPLACE FUNCTION check_trust_but_verify_threshold(
    lead_bubbler_id UUID,
    zone_id VARCHAR(100),
    shift_date DATE,
    shift_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    shift_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    threshold_triggered BOOLEAN,
    total_jobs_checked INTEGER,
    partial_takeovers_initiated INTEGER,
    partial_takeover_percentage DECIMAL(5,2),
    trigger_threshold DECIMAL(5,2),
    zone_type VARCHAR(20),
    alert_id UUID,
    message TEXT
)
```

#### **`process_trust_but_verify_review()` - Admin Review Processing**
```sql
CREATE OR REPLACE FUNCTION process_trust_but_verify_review(
    alert_id UUID,
    admin_reviewer_id UUID,
    admin_action VARCHAR(50),
    review_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    action_taken VARCHAR(50),
    affected_approvals INTEGER,
    message TEXT
)
```

#### **`get_zone_configuration_recommendations()` - Zone Setup**
```sql
CREATE OR REPLACE FUNCTION get_zone_configuration_recommendations(
    zone_bubbler_count INTEGER,
    zone_type VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    recommended_zone_type VARCHAR(20),
    recommended_threshold DECIMAL(5,2),
    recommended_min_jobs INTEGER,
    reasoning TEXT
)
```

### **Database Schema:**

#### **`trust_but_verify_alerts` Table:**
```sql
CREATE TABLE trust_but_verify_alerts (
    id UUID PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id),
    zone_id VARCHAR(100), -- Zone identifier
    shift_date DATE NOT NULL,
    shift_start_time TIMESTAMP WITH TIME ZONE,
    shift_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Trigger metrics
    total_jobs_checked INTEGER NOT NULL,
    partial_takeovers_initiated INTEGER NOT NULL,
    partial_takeover_percentage DECIMAL(5,2) NOT NULL,
    trigger_threshold DECIMAL(5,2) NOT NULL, -- e.g., 60.00 for 60%
    
    -- Zone configuration
    zone_type VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
    zone_bubbler_count INTEGER NOT NULL,
    lead_bubbler_count INTEGER NOT NULL,
    
    -- Affected bubblers and jobs
    affected_bubbler_ids UUID[], -- Array of bubbler IDs impacted
    affected_job_ids UUID[], -- Array of job IDs with partial takeovers
    partial_takeover_approval_ids UUID[], -- Array of approval IDs
    
    -- Alert status
    alert_status VARCHAR(20) DEFAULT 'active',
    assigned_admin_id UUID REFERENCES bubblers(id),
    review_notes TEXT,
    admin_action VARCHAR(50), -- 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'
    resolved_at TIMESTAMP WITH TIME ZONE
);
```

#### **`zone_configurations` Table:**
```sql
CREATE TABLE zone_configurations (
    id UUID PRIMARY KEY,
    zone_id VARCHAR(100) UNIQUE NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
    
    -- Threshold configuration
    partial_takeover_threshold DECIMAL(5,2) NOT NULL, -- Percentage threshold (e.g., 60.00)
    min_jobs_for_trigger INTEGER NOT NULL, -- Minimum jobs before triggering (e.g., 3)
    max_partials_before_trigger INTEGER, -- Alternative: max partials before triggering
    
    -- Zone characteristics
    estimated_bubbler_count INTEGER NOT NULL,
    estimated_lead_bubbler_count INTEGER NOT NULL,
    typical_shift_hours INTEGER DEFAULT 8,
    
    -- Response tiers
    tier_1_response VARCHAR(100), -- e.g., 'approve_all'
    tier_2_response VARCHAR(100), -- e.g., 'coaching_needed'
    tier_3_response VARCHAR(100), -- e.g., 'pattern_review'
    tier_4_response VARCHAR(100), -- e.g., 'escalate'
    
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🎯 **Zone-Specific Thresholds**

### **Small Zones (≤3 Bubblers):**
- **Threshold:** 50% partial takeover rate
- **Minimum Jobs:** 2 jobs before triggering
- **Reasoning:** Lower threshold due to fewer jobs, higher impact per partial takeover
- **Example:** 1 partial out of 2 jobs = 50% = trigger

### **Medium Zones (4-6 Bubblers):**
- **Threshold:** 60% partial takeover rate
- **Minimum Jobs:** 3 jobs before triggering
- **Reasoning:** Standard threshold balancing trust and oversight
- **Example:** 2 partials out of 3 jobs = 67% = trigger

### **Large Zones (7-10 Bubblers):**
- **Threshold:** 70% partial takeover rate
- **Minimum Jobs:** 5 jobs before triggering
- **Reasoning:** Higher threshold due to more jobs, lower impact per partial takeover
- **Example:** 4 partials out of 5 jobs = 80% = trigger

---

## 🔄 **Admin Review Workflow**

### **Tier 1: Approve All**
- **When:** All partial takeovers are clearly legitimate
- **Action:** Approve all payouts immediately
- **Result:** Lead Bubbler receives all bonuses, positive note logged

### **Tier 2: Coaching Needed**
- **When:** Most are valid, 1-2 questionable
- **Action:** Approve payouts but flag for coaching
- **Result:** Bonuses paid, coaching scheduled for Lead Bubbler

### **Tier 3: Pattern Review**
- **When:** 2+ questionable partial takeovers
- **Action:** Hold payouts, require pattern review
- **Result:** Investigation launched, payouts pending review

### **Tier 4: Escalate**
- **When:** Clear pattern of abuse or systemic issues
- **Action:** Escalate to management
- **Result:** Management review, potential disciplinary action

---

## 🎯 **Workflow Examples**

### **Example 1: Legitimate High Volume**
1. **Lead Bubbler:** Completes 4 partial takeovers out of 5 jobs (80%)
2. **System:** Triggers "Trust But Verify" alert
3. **Admin Review:** All 4 partials have photos, proper documentation
4. **Admin Action:** "Approve All" - all bonuses paid
5. **Result:** Lead Bubbler empowered, quality issues identified in zone

### **Example 2: Questionable Pattern**
1. **Lead Bubbler:** Completes 3 partial takeovers out of 4 jobs (75%)
2. **System:** Triggers "Trust But Verify" alert
3. **Admin Review:** 2 legitimate, 1 lacks proper evidence
4. **Admin Action:** "Coaching Needed" - approve 2, flag 1 for review
5. **Result:** Partial bonuses paid, coaching scheduled

### **Example 3: Potential Abuse**
1. **Lead Bubbler:** Completes 3 partial takeovers out of 3 jobs (100%)
2. **System:** Triggers "Trust But Verify" alert
3. **Admin Review:** All 3 lack proper evidence, similar patterns
4. **Admin Action:** "Pattern Review" - hold all payouts
5. **Result:** Investigation launched, potential disciplinary action

---

## 🔐 **Security & Access Control**

### **RLS Policies:**
- **Lead Bubblers:** Can view their own alerts
- **Admins:** Full access to all alerts and zone configurations
- **System:** Automated threshold monitoring and alert generation

### **Permissions:**
- **Authenticated users:** Can view zone configurations
- **Admins:** Can manage zone configurations and review alerts
- **Lead Bubblers:** Can view their own alert history

---

## 🎯 **Key Features**

### **1. Zone-Specific Thresholds**
- **Customizable per deployment zone**
- **Automatic recommendations** based on zone size
- **Flexible configuration** for different operational needs

### **2. Automated Monitoring**
- **Real-time threshold checking** during shifts
- **Automatic alert generation** when thresholds exceeded
- **Comprehensive data collection** for review

### **3. Tiered Response System**
- **Multiple admin action options** based on severity
- **Progressive escalation** for repeated issues
- **Clear outcome tracking** for all actions

### **4. Performance Insights**
- **Zone-level quality metrics** identification
- **Bubbler performance patterns** detection
- **Training opportunity identification**

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Complete with trust but verify alerts and zone configurations
- ✅ **Zone-Specific Thresholds:** Small, medium, large zone configurations
- ✅ **Automated Monitoring:** Real-time threshold checking and alert generation
- ✅ **Admin Review System:** Tiered response workflow
- ✅ **RLS Policies:** Secure access control for all roles
- ✅ **Permissions:** Proper role-based access
- ✅ **Default Configurations:** Pre-configured zone settings
- 🔄 **Frontend Integration:** Dashboard alert interface
- 🔄 **Admin Interface:** Alert review and zone management
- 🔄 **Email Notifications:** Automated alert notifications

---

## ✅ **Final Naming Suggestion (for SOP)**

### **Trigger Name:**
**"High Partial Volume – Trust But Verify Flag"**

### **Rule Definition:**
If a Lead Bubbler initiates partial takeover payout requests on **60% or more** of their assigned bubbler checks in a single shift, the system triggers an alert for admin review. This is designed to balance trust, fair compensation, and accountability while surfacing any quality issues among assigned bubblers.

---

## 🎯 **Benefits Summary**

### **✅ Empowers Lead Bubblers**
- **No arbitrary caps** on legitimate assistance
- **Trust-based approach** with verification
- **Clear expectations** for documentation

### **✅ Protects Company Resources**
- **Automated oversight** prevents abuse
- **Zone-specific thresholds** account for operational differences
- **Tiered responses** ensure appropriate action

### **✅ Identifies Quality Issues**
- **Pattern detection** surfaces training needs
- **Zone-level insights** identify systemic issues
- **Performance tracking** for continuous improvement

### **✅ Maintains Accountability**
- **Admin review process** ensures oversight
- **Evidence requirements** maintain standards
- **Progressive escalation** for repeated issues

This Trust But Verify system ensures **optimal balance between empowerment and oversight**, allowing Lead Bubblers to act decisively while maintaining fair, automated monitoring! ✅ 