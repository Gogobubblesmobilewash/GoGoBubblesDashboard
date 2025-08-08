# 🎯 **Lead Bubbler Dashboard System**
## Dynamic, Priority-Based, Proximity-Filtered Dashboard

### **✅ OVERVIEW: What We're Building**

A real-time Lead Bubbler Dashboard that:
- **Filters active bubblers** within a ~40–45 mile radius
- **Shows only those who:**
  - Need check-ins (based on internal logic)
  - Are eligible based on the lead's qualified service types (e.g., Sparkle, Shine)
  - Are within a reasonable travel time, defaulting to ~20–30 minutes
- **Uses color-coded priority tiers**
- **Dynamically updates** as the lead's location changes throughout the day
- **Allows leads to self-select** where to go — within rules

---

## 🧠 **PROXIMITY RULES (Access Control vs. Visibility)**

To prevent "cherry-picking" jobs 45+ minutes away just to run the clock:

| Lead Distance to Bubbler | Visibility? | Eligibility to Accept? | Message |
|--------------------------|-------------|----------------------|---------|
| **0–20 min** | ✅ Show | ✅ Can select | — |
| **21–30 min** | ✅ Show | ✅ Accept with popup warning | ⚠️ "Are you sure? Closer Bubblers are available." |
| **31–45 min** | 🔴 Don't show unless bubbler is Tier 1 priority | ✅ Can be approved by Admin only | 🚫 "This assignment requires admin approval." |
| **46+ min** | ⚪️ Hidden | ❌ Not eligible | 🔒 "Outside your service radius." |

**→ Recommendation:** Show only 0–30 min radius by default.
**→ Leads may request override** on Tier 1 jobs 31–45 mins out.

---

## 🎨 **PRIORITY COLOR TIERS (Bubble Risk Index)**

| Color | Priority | Trigger Criteria |
|-------|----------|------------------|
| 🔴 **Red** | **Tier 1 - Critical** | Complaint received, low rating (<4.3), multiple redos, system-detected time lag, job reassignments |
| 🟠 **Orange** | **Tier 2 - High** | New bubbler (<5 jobs), routine check-in overdue, mild system warnings |
| 🟢 **Green** | **Tier 3 - Routine** | Random spot-checks, >5 jobs completed, past reviews ≥4.5 |
| 🔵 **Blue** | **Requested Assistance** | Bubbler requested help or equipment |
| ⚪️ **Gray** | **Out of Range** | Outside 30 mins — view-only or hidden unless admin unlocks |

**✅ Only Red, Orange, Green, Blue appear in real-time view**
**🔒 Grays are filtered unless enabled in admin override mode.**

---

## 🔧 **SERVICE-TYPE FILTERING**

A Lead Bubbler only sees jobs that match their certified service type(s).

| Lead Type | Can See |
|-----------|---------|
| `sparkle_lead` | Home Cleaning bubblers only |
| `shine_lead` | Car Wash bubblers only |
| `fresh_lead` | Laundry bubblers only |
| `elite_lead` | Can view any two roles (defined at account level) |

**✅ Built-in logic ensures no unqualified check-ins.**

---

## ⏱️ **CHECK-IN FLOW: ACTIVITY TIMELINE LOGIC**

| Stage | Lead Dashboard Status |
|-------|---------------------|
| ✅ **Finish their own assigned job** | Clock transitions to Available – Oversight |
| ✅ **See bubbler list + status flags** | Filtered by proximity + service |
| ✅ **Select next check-in** | Status: "En Route" |
| ✅ **Arrive on site** | Status: "Check-In Started" |
| ✅ **Complete check-in (with notes)** | 3-minute grace for wrap-up |
| ✅ **Wrap-up note timer expires** | Status resets to Available – Oversight |
| ✅ **Idle over 5 mins (no new bubbler selected)** | Clock pauses (flag for admin audit) |
| ⛽ **Stop detected (stationary for gas, food, etc.)** | Clock auto-pauses (optional GPS flag) |

**→ You're covering this beautifully. This keeps accountability high, prevents misuse, and encourages time-efficient coaching, not coasting.**

---

## 🔔 **SMART PROMPTS SYSTEM**

To enhance the system, here are dashboard prompt ideas:

### **🔔 Smart Prompts:**
- **"3 Bubblers nearby need Tier 1 check-ins."**
- **"You haven't checked in on a bubbler in 45 minutes. Ready to help someone?"**
- **"Ashley just requested equipment — 12 mins away."**

### **🔐 Soft Block Warning (at 30 min+ travel):**
**"This assignment is further than your current priority radius. Consider visiting closer bubblers first to make the most of your shift."**

---

## 💻 **TECHNICAL IMPLEMENTATION**

### **Core Functions:**

#### **1. Distance Calculation**
```javascript
calculateDistance(coord1, coord2) // Haversine formula
```
- Calculates accurate distance between coordinates
- Returns distance in miles

#### **2. Proximity Rule Determination**
```javascript
getProximityRule(distance) // Returns proximity category
```
- CLOSE: 0-20 miles (no restrictions)
- MEDIUM: 21-30 miles (warning)
- FAR: 31-45 miles (admin approval required)
- OUT_OF_RANGE: 46+ miles (hidden)

#### **3. Priority Tier Assignment**
```javascript
determinePriorityTier(bubblerData) // Returns priority tier object
```
- RED: Critical issues requiring immediate attention
- ORANGE: High priority but not critical
- GREEN: Routine oversight
- BLUE: Requested assistance
- GRAY: Out of range

#### **4. Service Type Filtering**
```javascript
filterByServiceType(bubblers, leadServiceType) // Returns filtered bubblers
```
- Ensures leads only see compatible service types
- Prevents unqualified check-ins

#### **5. Dashboard Generation**
```javascript
generateLeadDashboard(params) // Returns complete dashboard data
```
- Combines all filters and logic
- Returns organized, prioritized bubbler list
- Includes smart prompts and status information

#### **6. Bubbler Selection Handling**
```javascript
handleBubblerSelection(params) // Returns selection result
```
- Validates selection based on proximity rules
- Handles admin approval requirements
- Returns warnings and restrictions

#### **7. Status Updates**
```javascript
updateLeadStatus(params) // Returns updated status
```
- Manages lead status transitions
- Handles idle detection and auto-pause
- Provides warnings for unusual activity

#### **8. Check-in Validation**
```javascript
validateCheckIn(params) // Returns validation result
```
- Ensures required fields are completed
- Validates photo requirements for quality issues
- Checks duration and rating validity

---

## 🎯 **DASHBOARD FEATURES**

### **Real-Time Updates:**
- **Location-based filtering** as lead moves throughout the day
- **Dynamic priority updates** based on real-time data
- **Smart prompt generation** based on current situation
- **Status transitions** with automatic timing

### **Visual Elements:**
- **Color-coded priority tiers** for quick identification
- **Distance indicators** with travel time estimates
- **Status badges** showing current lead activity
- **Warning popups** for proximity violations
- **Progress indicators** for check-in completion

### **Smart Features:**
- **Auto-pause detection** for idle time and stops
- **Proximity warnings** for distant assignments
- **Service type validation** to prevent unqualified check-ins
- **Admin override system** for exceptional circumstances
- **Audit trail** for all selections and actions

---

## 🔒 **SAFEGUARDS & PREVENTIONS**

### **Prevents Micromanaging:**
- **Self-selection** within defined parameters
- **Autonomy** to choose based on priority and proximity
- **No forced assignments** unless critical

### **Prevents Over-assignment:**
- **Proximity limits** prevent excessive travel
- **Service type restrictions** prevent unqualified work
- **Time-based limits** on check-in duration

### **Prevents Abuse:**
- **Clock-padding prevention** through idle detection
- **Cherry-picking prevention** through proximity rules
- **Admin oversight** for unusual patterns
- **Audit trails** for all activities

### **Ensures Accountability:**
- **Real-time tracking** of all activities
- **Required documentation** for check-ins
- **Performance metrics** tied to actual oversight
- **Quality validation** for all interactions

---

## 🚀 **IMPLEMENTATION STATUS**

### **✅ Complete & Ready:**
- ✅ **Core dashboard logic** with all filtering functions
- ✅ **Proximity rules** with distance calculations
- ✅ **Priority tier system** with color coding
- ✅ **Service type filtering** for qualified oversight
- ✅ **Smart prompts** for enhanced user experience
- ✅ **Status management** with activity timeline
- ✅ **Validation system** for check-in completion
- ✅ **Safeguard mechanisms** to prevent abuse

### **🔄 Ready for Frontend Integration:**
- ✅ **All functions exported** for React/Vue integration
- ✅ **Real-time data structure** for dashboard display
- ✅ **Event handling** for user interactions
- ✅ **Status updates** for live tracking
- ✅ **Error handling** for edge cases
- ✅ **Admin override system** for exceptional circumstances

---

## 📱 **USER EXPERIENCE FLOW**

### **1. Dashboard Load**
- Lead completes their own job
- System shows available bubblers within 30-mile radius
- Color-coded by priority tier
- Smart prompts highlight urgent needs

### **2. Bubbler Selection**
- Lead selects a bubbler from the list
- System validates proximity and service type
- Warning popup for distant assignments
- Admin approval required for 31-45 mile range

### **3. Check-in Process**
- Status updates to "En Route"
- GPS tracking for arrival detection
- Status changes to "Check-In Started" on arrival
- Required documentation and photos

### **4. Completion & Wrap-up**
- 3-minute grace period for notes
- Auto-reset to "Available – Oversight"
- System ready for next selection

### **5. Idle Detection**
- 5-minute idle timer for inactivity
- Auto-pause for stationary activity
- Admin flags for unusual patterns

---

## 🎯 **BENEFITS ACHIEVED**

### **✅ Autonomy with Accountability**
- **Leads choose** where to go within smart boundaries
- **Real-time tracking** ensures proper oversight
- **Quality metrics** tied to actual performance

### **✅ Efficiency & Prevention**
- **Proximity filtering** prevents wasted travel time
- **Service type restrictions** prevent unqualified work
- **Idle detection** prevents clock-padding

### **✅ Quality Oversight**
- **Priority-based display** ensures critical issues get attention
- **Smart prompts** guide leads to high-impact activities
- **Validation system** ensures proper documentation

### **✅ Scalability**
- **Dynamic filtering** adapts to changing locations
- **Admin override system** handles exceptional cases
- **Audit trails** support growth and compliance

This **dynamic, priority-based, proximity-filtered dashboard** provides the perfect balance of **autonomy, accountability, and efficiency** for Lead Bubbler oversight! 🧼✨ 