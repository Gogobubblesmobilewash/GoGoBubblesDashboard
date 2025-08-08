# 🎯 Real-Time Coaching & Documentation System

## 🎯 **System Overview**

A comprehensive real-time coaching and documentation system that:
1. **Protects brand quality** through systematic error detection and correction
2. **Trains Bubblers** without interrupting workflow
3. **Avoids overworking Lead Bubblers** through efficient processes
4. **Creates paper trail** for admin follow-up and performance tracking

---

## 📸 **1. Photo Policy (Before & After) — Required When Errors Found**

### **Trigger:**
Photos are required **only if an error is found** during a quality check.

### **What Must Be Photographed:**
- ❗ **"Before" photo** of the error or missed task
- ✅ **"After" photo** showing how the Lead Bubbler fixed it
- **Short note per image** like: *"Mirror had streaks – cleaned with microfiber + vinegar tip"*

### **Photo Requirements by Scenario:**

| Scenario | Photos Required? | Notes |
|----------|-----------------|-------|
| **No errors found** | ❌ No | Standard QA check |
| **One minor error in one room** | ✅ Yes, but only 1 photo set | Document the issue and fix |
| **Multiple errors across 2+ separate areas** | ✅ Yes for all affected areas | Comprehensive documentation |
| **Any time Lead Bubbler steps in to fix a task** | ✅ Required, even if minor | Proof of intervention |

---

## 🚨 **2. Partial Takeover Threshold**

### **NOT a Partial Takeover:**
- One error in bathroom + one error in living room
- Two minor issues in just one room

### **✅ IS a Partial Takeover when:**
- **2 or more moderate to significant errors** in two separate areas
- **Example:** 2 errors in bathroom + 2 in kitchen
- **Example:** 1 error in bedroom + 3 in living room (if it required effort to correct)

### **System Prompt:**
*"You've reported multiple issues across 2 rooms. Would you like to reclassify this as a Partial Takeover?"*

---

## 🎯 **3. Coaching Responsibilities — Lead + Admin Oversight**

### **🎯 Lead Bubbler Onsite Coaching**
- **Light coaching only** (Quick Tip format)
- **Example:** *"Next time, spray glass and wipe in 'S' pattern to avoid streaks"*
- **Should take no more than 2-5 mins per incident**
- **May include pulling Bubbler aside to demonstrate quickly**

### **📩 Admin-Follow-up Coaching (via email)**
**Admin receives:**
- Error summary
- Before/After photos
- Coachable topic (tagged)

**Admin sends coaching email within 24-48 hours:**
- Includes KB article link for that issue
- Notes what the Lead Bubbler observed
- Includes improvement tips and reminders

### **🧠 Example Email:**

**Subject:** Quick Tips to Level Up Your Mirror Finishing

Hi [Bubbler Name],

Thanks again for completing your job at [Job ID or Address].

During our standard quality check, your Lead Bubbler noticed the bathroom mirror had some streaking. No worries — they touched it up and shared a few tips we wanted to pass along.

✅ Here's a 2-minute article to help improve your next mirror finish:
[Link to KB Article: "Streak-Free Mirror Cleaning"]

Keep up the great work — we're excited to see your growth!

– GoGoBubbles Team

---

## 📚 **4. KB Article + System Notes Workflow**

| Action | Stored In Dashboard | Sent to Admin | Sent to Bubbler |
|--------|-------------------|---------------|-----------------|
| Lead Bubbler uploads error photos + notes | ✅ Yes | ✅ Yes | 🔄 Shared via email |
| Admin tags issue type (e.g., "Mirror", "Dusting") | ✅ Yes | ✅ Yes | ✅ Linked via KB article |
| System logs if same error occurs repeatedly | ✅ Yes (auto-flag) | ✅ Yes | ❌ (internal only) |

### **KB Article Library Tags (Examples):**
- **Streak-free Mirrors**
- **Kitchen Counter Sanitizing**
- **Toilet Rim Detailing**
- **Dusting Vents & Baseboards**
- **Speed vs. Thoroughness**

---

## 🔧 **Technical Implementation**

### **Core Functions:**

#### **`create_coaching_incident()`**
```sql
CREATE OR REPLACE FUNCTION create_coaching_incident(
    order_uuid UUID,
    bubbler_uuid UUID,
    lead_bubbler_uuid UUID,
    incident_type VARCHAR(100),
    error_severity VARCHAR(20),
    area_affected VARCHAR(100),
    before_photo_url TEXT DEFAULT NULL,
    after_photo_url TEXT DEFAULT NULL,
    lead_coaching_notes TEXT DEFAULT NULL,
    admin_coaching_notes TEXT DEFAULT NULL
)
```

#### **`generate_coaching_email()`**
```sql
CREATE OR REPLACE FUNCTION generate_coaching_email(
    incident_id UUID,
    template_name VARCHAR(100) DEFAULT 'standard_coaching'
)
```

#### **`detect_repeated_coaching_patterns()`**
```sql
CREATE OR REPLACE FUNCTION detect_repeated_coaching_patterns(
    bubbler_uuid UUID,
    days_back INTEGER DEFAULT 30
)
```

### **Database Schema:**

#### **`coaching_incidents` Table:**
```sql
CREATE TABLE coaching_incidents (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    bubbler_id UUID REFERENCES bubblers(id),
    lead_bubbler_id UUID REFERENCES bubblers(id),
    incident_type VARCHAR(100), -- 'mirror_streaks', 'dusting_incomplete', etc.
    error_severity VARCHAR(20), -- 'minor', 'moderate', 'significant'
    area_affected VARCHAR(100), -- 'bathroom', 'kitchen', 'bedroom', etc.
    before_photo_url TEXT,
    after_photo_url TEXT,
    lead_coaching_notes TEXT, -- Quick tip provided onsite
    admin_coaching_notes TEXT, -- Formal coaching notes for email
    kb_article_tag VARCHAR(100), -- Tag for linking to knowledge base
    coaching_email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE
);
```

#### **`knowledge_base_articles` Table:**
```sql
CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY,
    article_tag VARCHAR(100) UNIQUE, -- 'streak_free_mirrors', 'kitchen_sanitizing', etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    estimated_read_time_minutes INTEGER DEFAULT 2,
    category VARCHAR(100), -- 'cleaning_techniques', 'quality_standards', 'efficiency_tips'
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **`coaching_email_templates` Table:**
```sql
CREATE TABLE coaching_email_templates (
    id UUID PRIMARY KEY,
    template_name VARCHAR(100),
    subject_line TEXT NOT NULL,
    email_body TEXT NOT NULL,
    kb_article_placeholder VARCHAR(50) DEFAULT '{{KB_ARTICLE_LINK}}',
    bubbler_name_placeholder VARCHAR(50) DEFAULT '{{BUBBLER_NAME}}',
    job_id_placeholder VARCHAR(50) DEFAULT '{{JOB_ID}}',
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🔐 **Safeguards & Workflow Summary**

| Issue | Safeguard |
|-------|-----------|
| **Bubblers rushing tasks** | Checklist pacing rules + timestamp alerts |
| **Repeated low-quality tasks** | Admin sees patterns across jobs |
| **Poor coaching** | Lead Bubblers only handle light field training; Admin formalizes |
| **Disputes on what was/wasn't cleaned** | Photos stored as proof before/after |
| **Missed learning opportunity** | Coaching notes + KB articles auto-triggered |

---

## 📱 **Dashboard Experience**

### **Lead Bubbler Workflow:**
1. **Arrive for QA check**
2. **Inspect completed tasks**
3. **If errors found:**
   - Take "before" photo
   - Fix the issue
   - Take "after" photo
   - Add quick coaching note
4. **System determines:**
   - If partial takeover is needed
   - If coaching email is required
   - Which KB article to link
5. **Complete documentation**

### **Admin Workflow:**
1. **Receive coaching incident notification**
2. **Review photos and notes**
3. **Tag incident type** for KB linking
4. **Generate and send coaching email**
5. **Monitor for repeated patterns**

### **Bubbler Experience:**
1. **Receive coaching email** within 24-48 hours
2. **Click KB article link** for detailed guidance
3. **Apply learning** to future jobs
4. **Track improvement** over time

---

## 🎯 **Key Features**

### **1. Evidence-Based Coaching**
- **Required photo documentation** for all errors
- **Before-and-after comparisons** for verification
- **Quick onsite coaching** with formal follow-up

### **2. Automated Email System**
- **Template-based email generation** with placeholders
- **KB article linking** for targeted learning
- **Scheduled delivery** within 24-48 hours

### **3. Pattern Detection**
- **Repeated issue identification** across jobs
- **Performance trend analysis** for continuous improvement
- **Automatic flagging** for admin review

### **4. Knowledge Base Integration**
- **Tagged articles** for specific issues
- **Quick access** via email links
- **Continuous improvement** through content updates

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Complete with all tables and relationships
- ✅ **Core Functions:** Coaching incident creation and email generation
- ✅ **Pattern Detection:** Repeated issue identification
- ✅ **Photo Policy:** Before/after documentation requirements
- ✅ **Partial Takeover Logic:** Threshold-based escalation
- ✅ **RLS Policies:** Secure access control
- ✅ **Permissions:** Proper role-based access
- 🔄 **Frontend Integration:** Dashboard coaching interface
- 🔄 **Email System:** Automated email delivery
- 🔄 **Knowledge Base:** Article creation and management

---

## 🎯 **Benefits**

### **✅ Brand Quality Protection**
- **Systematic error detection** through photo documentation
- **Consistent quality standards** across all jobs
- **Evidence-based corrections** with before/after proof

### **✅ Efficient Training**
- **Non-disruptive coaching** during QA checks
- **Targeted learning** through KB article links
- **Continuous improvement** through pattern analysis

### **✅ Lead Bubbler Efficiency**
- **Quick onsite coaching** (2-5 minutes per incident)
- **Automated follow-up** through email system
- **Clear escalation criteria** for partial takeovers

### **✅ Performance Tracking**
- **Complete audit trail** for all coaching incidents
- **Pattern recognition** for repeated issues
- **Data-driven improvement** through analytics

This system ensures **quality service delivery** while providing **efficient training** and **comprehensive documentation** for continuous improvement! 🎯 