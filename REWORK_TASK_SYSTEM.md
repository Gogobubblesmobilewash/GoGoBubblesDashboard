# ⚡ Rework Task System - Fast & Efficient Lead Bubbler Operations

## 🎯 **System Overview**

A streamlined, tap-based system that:
- **⚡ Makes Lead Bubblers fast and efficient**
- **✅ Ensures proper proof for admin & payouts**
- **💸 Automates trigger-based compensation**
- **📋 Provides a clean paper trail for coaching, rework tracking, and accountability**

---

## ✅ **1. RE-CLEANING MODULE (Home Cleaning Only)**

### **🔁 Trigger:**
Lead Bubbler identifies any physical effort rework that was marked as "complete" but done improperly.

### **🎯 Purpose:**
- **One-button "Mark Re-Cleaning" trigger**
- **Allows tap-to-select task types from a checklist**
- **Auto-triggers Partial Takeover payout**
- **Captures evidence via photo + timestamp**

---

## 📱 **Dashboard UI – Home Cleaning Re-Clean Trigger**

| UI Element | Function |
|------------|----------|
| **🟦 Re-Clean Button** | Main trigger button (visible once Lead Bubbler is inside task) |
| **✅ Checklist Options (tap-to-select):** | |
| - Mop floor | Re-mop was required |
| - Sweep/vacuum | Re-vacuum was required |
| - Dusting | Redo of standard dusting |
| - Deep Dusting | Add-on not executed properly |
| - Toilet scrub | Fixture cleaning |
| - Shower/tub scrub | 〃 |
| - Mirror/Glass fix | Re-clean of reflective surface |
| - Dishes rewashed | Add-on missed |
| - Countertop/backsplash wipe | Re-clean of hard surface |
| **📸 Photo Prompt** | Auto-prompt to snap before/after photos |
| **🟨 Auto-payout tier display** | Shows "Partial Takeover triggered - $15 pending admin review" |
| **📝 Quick Notes (optional)** | 1-line textbox (max 100 chars) |

### **⚙️ Backend Logic:**
- **Any 2+ physical effort items selected → triggers Partial Takeover payout**
- **Automatically stores photos, notes, and timestamp to admin dashboard**
- **Flags job for quality coaching follow-up**

---

## ✅ **2. RETOUCH MODULE (Mobile Car Wash & Laundry)**

### **✴️ Trigger:**
Lead Bubbler identifies light touch-ups or missed sections, based on job marked "complete."

### **🎯 Purpose:**
- **One-button "Mark Retouch" trigger**
- **Fast checklist to mark which zones/items were redone**
- **Auto-payout if 3+ distinct zones retouched**

---

## 📱 **Dashboard UI – Mobile Car Wash / Laundry Retouch Trigger**

| UI Element | Function |
|------------|----------|
| **🟦 Retouch Button** | Appears after Lead selects service type (Car Wash or Laundry) |
| **✅ Checklist Options (tap-to-select):** | |
| **🔹 Mobile Car Wash:** | |
| - Dashboard (interior) | Dust or wipe-down required |
| - Rear windshield | Smudge/streak fix |
| - Door panels | Rewipe needed |
| - Trunk interior | Missed vacuum or dust |
| - Full exterior panel (re-dry) | **Auto-triggers Partial Takeover** |
| **🔹 Laundry:** | |
| - Wrong detergent used | Rewash |
| - Folding errors | Repack or redo |
| - Ironing missed | Re-iron task |
| - Scent request ignored | Repack/re-wash |
| **📸 Photo Prompt** | Before/after evidence |
| **🟨 Trigger summary** | "3+ Retouches Detected – Payout Flagged" |
| **📝 Quick Notes (optional)** | Tap-based or 100-char text input |

### **⚙️ Backend Logic:**
- **If 3+ touchups selected → Retouch qualifies for Partial Takeover**
- **Full panel re-dry (car) or full ironing redo (laundry) = auto-trigger, regardless of other fields**
- **Admin receives package for review (photo + checklist)**

---

## 🧾 **ADMIN DASHBOARD FLOW**

| Action | Result |
|--------|--------|
| **Partial Takeover flagged** | Admin sees: checklist + photos + quick note |
| **Admin approves** | Payout released to Lead Bubbler |
| **Admin denies** | Flag removed, no payout sent |
| **Job linked to bubbler for coaching** | System stores pattern of errors |

---

## 🔁 **OPTIONAL AUTO-TRIGGERS TO SPEED IT UP FURTHER**

You can have the system automatically prompt a Lead Bubbler with:

⚠️ **"You've marked more than 2 re-clean tasks — reclassify this job as Partial Takeover?"**

They hit "Confirm" and the system queues it for approval — without typing.

---

## 🔧 **Technical Implementation**

### **Core Functions:**

#### **`get_rework_task_options()` - Service-Specific Task Lists**
```sql
CREATE OR REPLACE FUNCTION get_rework_task_options(
    service_type VARCHAR(50),
    rework_type VARCHAR(50)
)
RETURNS TABLE(
    task_label VARCHAR(100),
    task_key VARCHAR(100),
    auto_trigger BOOLEAN,
    task_category VARCHAR(50),
    display_order INTEGER
)
```

#### **`process_rework_task()` - Complete Workflow Processing**
```sql
CREATE OR REPLACE FUNCTION process_rework_task(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    rework_type VARCHAR(50),
    selected_tasks TEXT[],
    before_photo_urls TEXT[],
    after_photo_urls TEXT[],
    quick_notes TEXT DEFAULT NULL
)
```

### **Database Schema:**

#### **`rework_tasks` Table:**
```sql
CREATE TABLE rework_tasks (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    lead_bubbler_id UUID REFERENCES bubblers(id),
    original_bubbler_id UUID REFERENCES bubblers(id),
    service_type VARCHAR(50) NOT NULL,
    rework_type VARCHAR(50) NOT NULL, -- 're_cleaning' or 'retouch'
    selected_tasks TEXT[] NOT NULL, -- Array of selected task types
    before_photo_urls TEXT[] NOT NULL, -- Array of before photo URLs
    after_photo_urls TEXT[] NOT NULL, -- Array of after photo URLs
    quick_notes TEXT, -- Optional notes (max 100 chars)
    threshold_met BOOLEAN NOT NULL,
    auto_triggered BOOLEAN DEFAULT FALSE, -- Whether system auto-prompted
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id)
);
```

#### **`rework_task_templates` Table:**
```sql
CREATE TABLE rework_task_templates (
    id UUID PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL,
    rework_type VARCHAR(50) NOT NULL, -- 're_cleaning' or 'retouch'
    task_label VARCHAR(100) NOT NULL, -- Display name
    task_key VARCHAR(100) NOT NULL, -- Internal key
    auto_trigger BOOLEAN DEFAULT FALSE, -- Whether this task auto-triggers partial takeover
    task_category VARCHAR(50), -- For grouping in UI
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

### **Service-Specific Task Templates:**

#### **Home Cleaning (Re-Cleaning):**
- **Mop floor** - Re-mop was required
- **Sweep/vacuum** - Re-vacuum was required
- **Dusting** - Redo of standard dusting
- **Deep Dusting** - Add-on not executed properly
- **Toilet scrub** - Fixture cleaning
- **Shower/tub scrub** - Fixture cleaning
- **Mirror/Glass fix** - Re-clean of reflective surface
- **Dishes rewashed** - Add-on missed
- **Countertop/backsplash wipe** - Re-clean of hard surface

#### **Mobile Car Wash (Retouch):**
- **Dashboard (interior)** - Dust or wipe-down required
- **Rear windshield** - Smudge/streak fix
- **Door panels** - Rewipe needed
- **Trunk interior** - Missed vacuum or dust
- **Full exterior panel (re-dry)** - **Auto-triggers Partial Takeover**

#### **Laundry (Retouch):**
- **Wrong detergent used** - Rewash
- **Folding errors** - Repack or redo
- **Ironing missed** - Re-iron task
- **Scent request ignored** - Repack/re-wash
- **Entire ironing bag re-iron** - **Auto-triggers Partial Takeover**
- **Full repack required** - **Auto-triggers Partial Takeover**

---

## 🎯 **Threshold Logic**

### **Home Cleaning (Re-Cleaning):**
- **Any 2+ physical effort items selected → triggers Partial Takeover payout**
- **Simple rule:** If Lead Bubbler must physically redo more than 2 tasks, it's a Partial Takeover

### **Mobile Car Wash (Retouch):**
- **3+ distinct zones retouched → triggers Partial Takeover**
- **Full panel re-dry = auto-trigger, regardless of other fields**
- **Simple rule:** If 2+ areas/zones need touch-up or rework, or any full panel re-wipe, it's a Partial Takeover

### **Laundry (Retouch):**
- **3+ tasks OR batch rework → triggers Partial Takeover**
- **Full ironing redo OR full repack = auto-trigger**
- **Simple rule:** If any task requires redoing part of a batch, or multiple repacks or folds — Partial Takeover

---

## ✅ **Benefits**

| Benefit | Result |
|---------|--------|
| **Tap-based checklist** | Saves Lead Bubbler time |
| **Built-in triggers** | Automates partial payouts fairly |
| **Universal across services** | Consistent interface, logic per tier |
| **Admin approval with proof** | Fraud prevention + visibility |
| **Built-in coaching linkage** | Quality improvement over time |

---

## 🔄 **Workflow Examples**

### **Example 1: Home Cleaning Re-Cleaning**
1. **Lead Bubbler finds:** Mirror streaks + missed baseboards
2. **Taps:** "Mark Re-Cleaning" button
3. **Selects:** "Mirror/Glass fix" + "Dusting"
4. **System:** "2+ physical effort items selected - Partial Takeover triggered"
5. **Lead uploads:** Before/after photos
6. **Admin reviews:** Approves partial takeover
7. **Payout:** $15 bonus to Lead, $15 deducted from original Bubbler

### **Example 2: Car Wash Retouch**
1. **Lead Bubbler finds:** Dashboard smudges + rear windshield streaks
2. **Taps:** "Mark Retouch" button
3. **Selects:** "Dashboard (interior)" + "Rear windshield"
4. **System:** "2 retouches selected - threshold not met"
5. **Result:** Standard QA check, no bonus payout

### **Example 3: Laundry Auto-Trigger**
1. **Lead Bubbler finds:** Entire ironing bag needs re-ironing
2. **Taps:** "Mark Retouch" button
3. **Selects:** "Entire ironing bag re-iron"
4. **System:** "Auto-trigger detected - Partial Takeover approved"
5. **Lead uploads:** Photos of wrinkled vs. pressed items
6. **Admin reviews:** Approves partial takeover
7. **Payout:** $10 bonus to Lead, $10 deducted from original Bubbler

---

## 🔐 **Security & Access Control**

### **RLS Policies:**
- **Lead Bubblers:** Can view and create their own rework tasks
- **Original Bubblers:** Can view rework tasks affecting their jobs
- **Admins:** Full access to all rework tasks and templates

### **Permissions:**
- **Authenticated users:** Can view active task templates
- **Lead Bubblers:** Can execute rework task functions
- **Admins:** Can manage task templates and review all rework tasks

---

## 🎯 **Key Features**

### **1. Fast & Efficient**
- **One-button triggers** for quick task documentation
- **Tap-to-select checklists** eliminate typing
- **Auto-trigger detection** for immediate escalation

### **2. Evidence-Based**
- **Mandatory photo documentation** for all rework tasks
- **Before/after comparisons** for verification
- **Timestamp tracking** for audit trail

### **3. Automated Compensation**
- **Threshold-based triggers** for fair payouts
- **Service-specific logic** for accurate assessment
- **Admin approval workflow** for fraud prevention

### **4. Quality Assurance**
- **Systematic error tracking** across all services
- **Pattern detection** for repeated issues
- **Coaching integration** for continuous improvement

---

## 🔄 **Implementation Status**

- ✅ **Database Schema:** Complete with rework tasks and templates
- ✅ **Service-Specific Logic:** Home cleaning, car wash, laundry thresholds
- ✅ **Auto-Trigger Detection:** Full panel re-dry, batch rework logic
- ✅ **Photo Documentation:** Mandatory before/after evidence
- ✅ **RLS Policies:** Secure access control for all roles
- ✅ **Permissions:** Proper role-based access
- ✅ **Task Templates:** Complete set for all service types
- 🔄 **Frontend Integration:** Dashboard rework task interface
- 🔄 **Admin Interface:** Rework task review and management
- 🔄 **Email Notifications:** Automated approval status updates

---

## 🎯 **Benefits Summary**

### **✅ Lead Bubbler Efficiency**
- **Quick tap-based interface** saves time during QA checks
- **Automatic threshold detection** reduces decision-making
- **Streamlined photo upload** for evidence collection

### **✅ Fair Compensation**
- **Service-specific thresholds** ensure appropriate payouts
- **Auto-trigger detection** for significant rework
- **Admin approval workflow** prevents abuse

### **✅ Quality Assurance**
- **Systematic error documentation** across all services
- **Pattern tracking** for repeated issues
- **Coaching integration** for continuous improvement

### **✅ Administrative Oversight**
- **Complete audit trail** for all rework tasks
- **Photo evidence** for verification
- **Pattern analysis** for performance tracking

This system ensures **fast and efficient Lead Bubbler operations** while maintaining **quality standards** and **fair compensation** through systematic documentation and automated triggers! ⚡ 