# 🔍 QA Escalation System

## 🎯 **When Quality Checks Escalate into Takeovers**

The QA escalation system allows Lead Bubblers to reclassify their visits based on what they discover during quality checks, ensuring fair compensation and maintaining service quality.

---

## 🚨 **Escalation Discovery Logic**

### **Stage 1: Minor Issues (Quality Check Only)**
- **Discovery:** Minor issues in 1 area (e.g., bathroom mirror streaks, small dust spots)
- **Action:** Touch-up + coach bubbler
- **Classification:** ✅ **Quality Check Only**
- **Compensation:** Hourly rate only (no bonus)

### **Stage 2: Multiple Issues (Partial Takeover)**
- **Discovery:** Minor issues in 2-3 areas (e.g., bedroom dusting + kitchen counters)
- **Action:** Fixes + documents + photos
- **Classification:** ⚠️ **Partial Takeover**
- **Compensation:** Partial takeover bonus triggered

### **Stage 3: Significant Problems (Full Takeover)**
- **Discovery:** Multiple areas marked as completed but not cleaned at all
- **Action:** Documents extensive fraud + fixes job
- **Classification:** ❌ **Full Takeover (Fraud)**
- **Compensation:** Full payout to Lead Bubbler; original bubbler penalized

### **Stage 4: Suspicious Behavior (Auto-Alert)**
- **Discovery:** Checklist appears suspiciously fast (e.g., entire home marked clean in 15 min)
- **Action:** System auto-alert + mandatory quality check assigned
- **Classification:** 🔍 **Triggered by AI/logic**
- **Compensation:** Oversight required, possibly reassign job or flag pattern

---

## 📸 **Required Lead Documentation**

### **Photo Evidence Requirements:**
- **Before-and-after photos** of each issue
- **What the original bubbler checked** ✅
- **What was actually found on inspection** ❌
- **Short notes** like: *"Toilet bowl unclean. Shower door streaked. Bedroom had hair/debris."*

### **Dashboard Actions:**
- **Reclassify** the task from "QA only" to "Partial Takeover"
- **Mark which tasks** they completed
- **Upload photo evidence** for each issue
- **Provide detailed notes** explaining the escalation

---

## 💵 **Compensation Triggers Summary**

| Situation | Lead Pay | Original Bubbler Pay |
|-----------|----------|---------------------|
| **Quality check only** | Hourly | Full |
| **Partial takeover** | Hourly + bonus ($15) | Deducted $15 from payout |
| **Full takeover (fraud/abandonment)** | Full payout | $0 or tiered compensation |

**⚖️ Core Rule:** Bonus OR hourly, not both — except in takeover escalation cases where hourly + bonus is justified.

---

## 🚦 **Dashboard Logic Rules**

### **For Bubblers:**
- ✅ **Must mark each task** (bedroom, bath, kitchen) as completed
- 🕐 **Must space checklist tasks realistically** (can't check everything in 3 mins)
- 🟠 **System flags rapid-checking behavior**
- 🟥 **System freezes further check-offs** if speed is suspicious

### **For Lead Bubblers:**
- ✅ **Can view task history timestamps**
- 📸 **Required to upload photos** when disputing checklist accuracy
- 🟡 **Reclassify job** (QA → Partial Takeover → Full Takeover)
- 📝 **Document all issues** with evidence

### **For Admins:**
- ✅ **View all reclassification notes + photos**
- 🚩 **Dashboard auto-flags Bubblers** with:
  - 2+ flagged checklists per 10 jobs
  - 2+ Lead Bubblers overriding checklist in past month
- 📊 **Trend analysis** for pattern detection

---

## 🧠 **Safeguards for Abuse Prevention**

| Risk | Safeguard |
|------|-----------|
| **Bubblers falsely marking tasks complete** | Timestamp monitoring + task time minimums + lead verification |
| **Lead Bubblers claiming extra work for bonus** | Required photos + admin audits + penalty for falsified entries |
| **Overuse of Lead Takeovers** | Historical tracking per Bubbler + alert thresholds |

---

## 🔧 **Technical Implementation**

### **Core Function: `process_qa_escalation()`**

```sql
CREATE OR REPLACE FUNCTION process_qa_escalation(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    escalation_type VARCHAR(50), -- 'qa_only', 'partial_takeover', 'full_takeover'
    tasks_redone TEXT[], -- Array of task labels that were redone
    photo_evidence_urls TEXT[], -- Array of photo URLs
    escalation_notes TEXT,
    original_completion_percentage DECIMAL(5,2) DEFAULT NULL
)
```

### **Suspicious Behavior Detection: `detect_suspicious_checklist_behavior()`**

```sql
CREATE OR REPLACE FUNCTION detect_suspicious_checklist_behavior(order_uuid UUID)
RETURNS TABLE(
    is_suspicious BOOLEAN,
    suspicion_reason TEXT,
    completion_time_minutes INTEGER,
    tasks_completed_count INTEGER,
    average_time_per_task DECIMAL(5,2)
)
```

### **Timing Enforcement: `enforce_task_completion_timing()`**

```sql
CREATE OR REPLACE FUNCTION enforce_task_completion_timing(
    order_uuid UUID,
    task_label TEXT,
    minimum_minutes INTEGER DEFAULT 3
)
RETURNS BOOLEAN
```

---

## 📊 **Database Schema Updates**

### **Enhanced `lead_checkins` Table:**

```sql
-- QA Escalation fields added to lead_checkins
escalation_type VARCHAR(50), -- 'qa_only', 'partial_takeover', 'full_takeover'
escalation_notes TEXT,
tasks_redone TEXT[], -- Array of task labels that were redone
photo_evidence_urls TEXT[], -- Array of photo URLs
original_completion_percentage DECIMAL(5,2),
final_completion_percentage DECIMAL(5,2),
compensation_type VARCHAR(50),
original_bubbler_payout DECIMAL(6,2),
lead_bubbler_payout DECIMAL(6,2),
bonus_amount DECIMAL(5,2) DEFAULT 0.00,
flagged BOOLEAN DEFAULT FALSE,
flag_reason TEXT
```

---

## 🎯 **Escalation Flow**

```
QA Check ➝ Minor fix (Hourly Only) ✅
    ↓
QA Check ➝ Multiple missed items (Bonus Triggered) ⚠️
    ↓
QA Check ➝ Fraudulent or abandoned job (Full Takeover) ❌
```

### **Decision Points:**

1. **Single Minor Issue:** Stay as QA check
2. **2-3 Issues:** Escalate to partial takeover
3. **Multiple Major Issues:** Escalate to full takeover
4. **Suspicious Timing:** Auto-flag for review

---

## 🔍 **Detection Criteria**

### **Suspicious Checklist Behavior:**
- **< 5 minutes for 3+ tasks** → Flagged
- **< 2 minutes average per task** → Flagged
- **Complete job in < 10 minutes** → Flagged

### **Abuse Prevention:**
- **3+ takeovers in 30 days** → Automatic flag
- **2+ takeovers with <30% completion** → Flag for low performance
- **$100+ payout loss in 30 days** → Flag for review

---

## 📱 **Dashboard Experience**

### **Lead Bubbler Workflow:**
1. **Arrive for QA check**
2. **Inspect completed tasks**
3. **Document issues with photos**
4. **Choose escalation level:**
   - QA Only (minor fixes)
   - Partial Takeover (2+ issues)
   - Full Takeover (fraud/abandonment)
5. **Upload evidence and notes**
6. **System calculates compensation**

### **Admin Oversight:**
- **Real-time escalation alerts**
- **Photo evidence review**
- **Pattern analysis dashboard**
- **Compensation override capabilities**

---

## 💡 **Key Features**

### **1. Evidence-Based Escalation**
- **Required photo documentation** for all escalations
- **Before-and-after comparisons** for verification
- **Detailed notes** explaining the escalation

### **2. Automatic Fraud Detection**
- **Timestamp monitoring** for suspicious completion speeds
- **Pattern recognition** for repeated issues
- **Real-time alerts** for admin review

### **3. Fair Compensation Structure**
- **Clear escalation criteria** for each level
- **Automatic compensation calculation** based on escalation type
- **Protection against abuse** on both sides

### **4. Quality Assurance**
- **Mandatory documentation** for all escalations
- **Admin review process** for verification
- **Performance tracking** for continuous improvement

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Enhanced with escalation fields
- ✅ **Core Functions:** QA escalation processing
- ✅ **Fraud Detection:** Suspicious behavior monitoring
- ✅ **Timing Enforcement:** Minimum completion time checks
- ✅ **Compensation Logic:** Automatic calculation based on escalation
- ✅ **RLS Policies:** Secure access control
- ✅ **Permissions:** Proper role-based access
- 🔄 **Frontend Integration:** Dashboard escalation interface
- 🔄 **Admin Interface:** Escalation review and management

---

## 🎯 **Benefits**

### **✅ Quality Assurance**
- **Proactive issue detection** during QA checks
- **Evidence-based escalation** with photo documentation
- **Automatic fraud detection** through timing analysis

### **✅ Fair Compensation**
- **Clear escalation criteria** for Lead Bubblers
- **Automatic compensation calculation** based on work performed
- **Protection against false claims** through evidence requirements

### **✅ Business Protection**
- **Fraud prevention** through suspicious behavior detection
- **Quality maintenance** through mandatory documentation
- **Cost control** through tiered compensation structure

### **✅ Accountability**
- **Photo evidence requirements** for all escalations
- **Admin review process** for verification
- **Performance tracking** for continuous improvement

This system ensures **quality service delivery** while providing **fair compensation** and **preventing abuse** through comprehensive monitoring and documentation! 🎯 