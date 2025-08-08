# 🎯 Universal Partial Takeover Policy

## 📋 **Policy Definition**

A **Partial Takeover** occurs when a Lead Bubbler is required to correct multiple distinct errors in different areas/tasks that the original Bubbler already marked "completed."

---

## 📌 **Key Rules**

| Rule | Policy |
|------|--------|
| **1** | All Lead Bubblers must take before + after photos of all fixes |
| **2** | Partial Takeover triggers only if error count threshold is met per service tier |
| **3** | Lead Bubblers may flag job as Partial Takeover, but payout is held until admin review |
| **4** | Complexity of errors does not matter — only the number of areas touched |
| **5** | Thresholds vary by service type (see below) |
| **6** | Auto-trigger system prompt confirms with Lead: "Do you wish to reclassify as Partial Takeover?" |
| **7** | Admin reviews flagged photos & notes before payout is released |

---

## 🧼 **HOME CLEANING – Partial Takeover Threshold**

| Error Areas Affected | Trigger? | Notes |
|---------------------|----------|-------|
| **1 Room Only (any size)** | ❌ No | Minor isolated errors (e.g. mirror or light dust) don't qualify |
| **2+ Minor Errors Across 2+ Rooms** | ✅ Yes | E.g. missed baseboards + unvacuumed rug |
| **3+ Minor Errors Across Any Area** | ✅ Yes | Even if same room (e.g. toilet, mirror, floor) |
| **2+ Moderate Errors (sweep + reclean tub)** | ✅ Yes | Even same room – time/labor adds up |
| **Any Re-cleaning Involving Dusting, Mopping, Vacuuming + Fixture Touch-up** | ✅ Yes | Physical effort tasks trigger payout |

### **🧠 Simple rule for home cleaning:**
**If a Lead Bubbler must physically redo more than 2 tasks, it's a Partial Takeover.**

---

## 🚗 **MOBILE CAR WASH – Partial Takeover Threshold**

| Errors Found | Trigger? | Notes |
|-------------|----------|-------|
| **1–2 Smudges (glass, dashboard)** | ❌ No | Spot fixes only |
| **Interior streaks + rear carpet needs re-vacuum** | ✅ Yes | Multiple zone touch-ups |
| **Re-dry full exterior panel OR Re-shampoo seat** | ✅ Yes | Time + material effort |
| **Any mix of 3+ distinct interior/exterior retouches** | ✅ Yes | E.g. dashboard, mirror, trunk interior |

### **🧠 Simple rule:**
**If 2+ areas/zones need touch-up or rework, or any full panel re-wipe, it's a Partial Takeover.**

---

## 🧺 **LAUNDRY – Partial Takeover Threshold**

| Errors/Tasks | Trigger? | Notes |
|-------------|----------|-------|
| **1 missed item for ironing** | ❌ No | Manual fix |
| **Entire ironing bag wrinkled or under-pressed** | ✅ Yes | Re-ironing triggers payout |
| **Detergent scent wrong, repack required** | ✅ Yes | Full repack or rewash needed |
| **Any 3+ tasks (e.g. mismatched folding, delicates error, incorrect dryer setting)** | ✅ Yes | Multi-task error pattern |

### **🧠 Laundry rule:**
**If any task requires redoing part of a batch, or multiple repacks or folds — Partial Takeover.**

---

## 🔄 **Dashboard Flow & Approval Structure**

| Step | Actor | Action |
|------|-------|--------|
| **1** | Lead Bubbler | Checks flagged job, documents errors, fixes issues |
| **2** | System | Checks error count against service thresholds |
| **3** | System | Prompts: "Would you like to classify this as Partial Takeover?" |
| **4** | Lead Bubbler | If yes → fills short justification note, uploads photo set |
| **5** | Admin View | Sees flagged job, photos, and justification |
| **6** | Admin | Approves → payout released OR rejects → Lead notified |
| **7** | System | Automatically logs flagged bubbler with coaching incident |

---

## 🧩 **Coaching + KB Workflow (Tied to Partial Takeovers)**

- **All approved Partial Takeovers** auto-flag Bubbler for follow-up coaching
- **Admin receives** photo set, system tags (e.g. "mirror streaks", "missed baseboards")
- **Admin sends** coaching email + KB tip article
- **Repeat incidents** trigger escalation: warning, pause on job assignment, or removal

---

## 🔧 **Technical Implementation**

### **Core Functions:**

#### **`check_partial_takeover_threshold()` - Service-Specific Logic**
```sql
CREATE OR REPLACE FUNCTION check_partial_takeover_threshold(
    service_type VARCHAR(50),
    errors_found_count INTEGER,
    areas_affected_count INTEGER,
    error_types TEXT[],
    error_severity_levels TEXT[]
)
RETURNS BOOLEAN
```

**Service-Specific Thresholds:**
- **Home Cleaning (sparkle):** 3+ errors OR 2+ areas with 2+ errors OR 2+ moderate errors
- **Car Wash (shine):** 2+ areas OR 3+ errors OR full panel re-wipe
- **Laundry (fresh):** Re-iron/re-pack/re-wash OR 3+ task errors

#### **`initiate_partial_takeover_approval()` - Approval Workflow**
```sql
CREATE OR REPLACE FUNCTION initiate_partial_takeover_approval(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    error_types TEXT[],
    error_severity_levels TEXT[],
    photo_evidence_urls TEXT[],
    lead_justification TEXT
)
```

#### **`process_partial_takeover_approval()` - Admin Review**
```sql
CREATE OR REPLACE FUNCTION process_partial_takeover_approval(
    approval_id UUID,
    admin_reviewer_id UUID,
    approval_status VARCHAR(20),
    approval_notes TEXT DEFAULT NULL
)
```

### **Database Schema:**

#### **`partial_takeover_approvals` Table:**
```sql
CREATE TABLE partial_takeover_approvals (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    lead_bubbler_id UUID REFERENCES bubblers(id),
    original_bubbler_id UUID REFERENCES bubblers(id),
    service_type VARCHAR(50) NOT NULL,
    errors_found_count INTEGER NOT NULL,
    areas_affected_count INTEGER NOT NULL,
    error_types TEXT[] NOT NULL,
    error_severity_levels TEXT[] NOT NULL,
    photo_evidence_urls TEXT[] NOT NULL,
    lead_justification TEXT NOT NULL,
    threshold_met BOOLEAN NOT NULL,
    admin_reviewer_id UUID REFERENCES bubblers(id),
    approval_status VARCHAR(20) DEFAULT 'pending',
    approval_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    payout_amount DECIMAL(6,2),
    original_bubbler_deduction DECIMAL(6,2)
);
```

---

## 💡 **Summary: Smart, Fair, Scalable**

| Feature | Benefit |
|---------|---------|
| **Per-service threshold logic** | Removes subjectivity, improves trust |
| **Photo verification** | Proof for admin + transparency for Bubblers |
| **Lead Bubblers flag, Admin approves** | Prevents abuse but allows autonomy |
| **Equal payout regardless of fix complexity** | Simplifies logic and reduces complaints |
| **Coaching built into system** | Upskills Bubblers, reduces long-term rework |

---

## 🎯 **Key Benefits**

### **✅ Prevents Abuse**
- **Service-specific thresholds** prevent minor issues from being abused
- **Admin approval required** for all partial takeover payouts
- **Photo evidence mandatory** for all fixes

### **✅ Fair Compensation**
- **Multiple errors across areas** qualify for fair compensation
- **Equal payout structure** regardless of fix complexity
- **Automatic threshold checking** removes subjectivity

### **✅ Quality Assurance**
- **Systematic error documentation** with before/after photos
- **Coaching integration** for continuous improvement
- **Pattern detection** for repeated issues

### **✅ Administrative Efficiency**
- **Streamlined approval workflow** with clear criteria
- **Automated coaching integration** for follow-up
- **Comprehensive audit trail** for all decisions

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Complete with approval workflow table
- ✅ **Service-Specific Thresholds:** Home cleaning, car wash, laundry logic
- ✅ **Approval Functions:** Initiation and processing workflows
- ✅ **Photo Evidence:** Mandatory before/after documentation
- ✅ **RLS Policies:** Secure access control for all roles
- ✅ **Permissions:** Proper role-based access
- 🔄 **Frontend Integration:** Dashboard approval interface
- 🔄 **Admin Interface:** Approval review and management
- 🔄 **Email Notifications:** Automated approval status updates

---

## 🎯 **Workflow Examples**

### **Example 1: Home Cleaning Partial Takeover**
1. **Lead Bubbler finds:** Mirror streaks in bathroom + missed baseboards in living room
2. **System checks:** 2 areas affected, 2 errors found
3. **Threshold met:** ✅ Yes (2+ areas with 2+ errors)
4. **Lead uploads:** Before/after photos + justification
5. **Admin reviews:** Photos, approves partial takeover
6. **Payout:** $15 bonus to Lead, $15 deducted from original Bubbler

### **Example 2: Car Wash - No Partial Takeover**
1. **Lead Bubbler finds:** 2 smudges on dashboard
2. **System checks:** 1 area affected, 2 minor errors
3. **Threshold met:** ❌ No (only 1 area, minor errors)
4. **Result:** Standard QA check, no bonus payout

### **Example 3: Laundry Partial Takeover**
1. **Lead Bubbler finds:** Entire ironing bag needs re-ironing
2. **System checks:** Re-ironing task detected
3. **Threshold met:** ✅ Yes (batch rework required)
4. **Lead uploads:** Photos of wrinkled vs. pressed items
5. **Admin reviews:** Approves partial takeover
6. **Payout:** $10 bonus to Lead, $10 deducted from original Bubbler

This system ensures **fair compensation** while **preventing abuse** and maintaining **quality standards** through systematic documentation and admin oversight! 🎯 