# ✅ Tiered Partial Takeover Bonus System

## 🔁 **Recalibrating the Partial Takeover Bonus**

### **🎯 Current Problem:**
- **$15 flat bonus** is 33% of a $45 job, even if Lead only completed 10–20% of the task
- **Too punitive** to original Bubbler — especially if they did 80–90% of the work
- **Doesn't scale proportionally** to job size (e.g., $15 penalty is steep on $45 vs. fairer on $90)

### **✅ Proposed Solution: Tiered Partial Bonus (Job Size Dependent)**

We tie the partial takeover bonus to the overall job payout amount, using a percentage cap to scale it fairly.

---

## 💡 **New Rule: Tiered Partial Takeover Bonus**

**Partial takeover bonus = 15–20% of total job payout, capped at $12**

| Job Payout | Max Partial Bonus | Percentage | Notes |
|------------|------------------|------------|-------|
| **$45** | **$8** | 17.8% | Reasonable for small jobs |
| **$60** | **$9** | 15% | Scales fairly with Signature Clean tier |
| **$75** | **$11** | 14.7% | Makes sense for larger jobs |
| **$90+** | **$12 MAX** | 13.3% | Bonus capped to protect Bubbler margin |

---

## ✅ **Why This Works**

- 🎯 **Keeps the bonus proportional** to job size
- 💰 **Still rewards Lead Bubblers fairly** (in addition to hourly)
- 🛡️ **Protects your brand** by incentivizing quality without over-penalizing
- ⚖️ **Maintains positive morale** across both roles

---

## 🧠 **Bonus Logic for Implementation**

### **When a Lead Bubbler initiates a Partial Takeover, system will:**

1. **Calculate total job payout** from order
2. **Apply 15–20% of payout**, up to $12 max
3. **Deduct from original Bubbler's earnings**
4. **Add bonus as pending payout** to Lead (shown with timer countdown for job duration)
5. **Admin approval still required** for final payout

### **Technical Implementation:**

```sql
-- Calculate tiered partial takeover bonus
CREATE OR REPLACE FUNCTION calculate_tiered_partial_bonus(
    job_total_amount DECIMAL(6,2)
)
RETURNS DECIMAL(6,2) AS $$
DECLARE
    calculated_bonus DECIMAL(6,2);
BEGIN
    -- Calculate bonus as 15-20% of job amount, capped at $12
    calculated_bonus := LEAST(job_total_amount * 0.18, 12.00);
    
    -- Ensure minimum bonus of $5 for very small jobs
    IF calculated_bonus < 5.00 THEN
        calculated_bonus := 5.00;
    END IF;
    
    RETURN calculated_bonus;
END;
$$ LANGUAGE plpgsql;
```

### **Bonus Calculation Examples:**

#### **$45 Job:**
- **Calculation:** $45 × 18% = $8.10
- **Capped at:** $8.10 (under $12 limit)
- **Final Bonus:** $8

#### **$60 Job:**
- **Calculation:** $60 × 18% = $10.80
- **Capped at:** $10.80 (under $12 limit)
- **Final Bonus:** $11

#### **$75 Job:**
- **Calculation:** $75 × 18% = $13.50
- **Capped at:** $12.00 (over $12 limit)
- **Final Bonus:** $12

#### **$90 Job:**
- **Calculation:** $90 × 18% = $16.20
- **Capped at:** $12.00 (over $12 limit)
- **Final Bonus:** $12

---

## ✅ **SOP Wording (Finalized for Onboarding + Developer Hand-off)**

### **Partial Takeover Bonus Policy:**

When a Lead Bubbler performs a Partial Takeover, they will receive a partial takeover bonus, scaled to job size:

- **Bonus = 15–20% of the total job payout (max $12)**
- **Paid in addition to hourly pay**
- **Bonus is deducted from the original Bubbler's payout**
- **Partial takeovers are triggered in cases where the original Bubbler:**
  - Falls behind on task timeline
  - Leaves job early due to emergency
  - Marks tasks as complete but key areas fail quality check
- **Light assistance** (e.g. helping carry items, light surface touch-ups) does not qualify as a takeover
- **Partial Takeovers must be documented** via task checklist and submitted for admin approval
- **If approved, bonus is processed** and displayed on the Lead's earnings dashboard

---

## 🎯 **Workflow Examples**

### **Example 1: $45 Sparkle Clean - Minor Partial Takeover**
1. **Scenario:** Original bubbler does 85%, Lead finishes 15% due to emergency
2. **Original Bubbler:** Gets $37 (85% of $45) - $8 bonus = **$29**
3. **Lead Bubbler:** Gets $8 (15% of $45) + $8 bonus = **$16**
4. **Company Cost:** $29 + $16 = **$45** (same as original)
5. **Fairness:** Original keeps most earnings, Lead compensated for emergency assistance

### **Example 2: $60 Signature Clean - Moderate Partial Takeover**
1. **Scenario:** Original bubbler does 70%, Lead finishes 30% due to quality issues
2. **Original Bubbler:** Gets $42 (70% of $60) - $11 bonus = **$31**
3. **Lead Bubbler:** Gets $18 (30% of $60) + $11 bonus = **$29**
4. **Company Cost:** $31 + $29 = **$60** (same as original)
5. **Fairness:** Original penalized for quality issues, Lead rewarded for intervention

### **Example 3: $90 Deep Clean - Major Partial Takeover**
1. **Scenario:** Original bubbler does 40%, Lead finishes 60% due to timeline issues
2. **Original Bubbler:** Gets $36 (40% of $90) - $12 bonus = **$24**
3. **Lead Bubbler:** Gets $54 (60% of $90) + $12 bonus = **$66**
4. **Company Cost:** $24 + $66 = **$90** (same as original)
5. **Fairness:** Original significantly penalized for timeline failure, Lead well-compensated

---

## 🔐 **Key Benefits**

### **✅ Protects Original Bubblers**
- **Proportional penalties:** Bonus scales with job size, not flat rate
- **Emergency protection:** Minor issues don't result in massive penalties
- **Quality focus:** Penalties are reasonable for actual quality failures

### **✅ Rewards Lead Bubblers Fairly**
- **Scalable compensation:** Larger jobs = larger bonuses
- **Emergency assistance:** Compensated for stepping in when needed
- **Quality intervention:** Rewarded for maintaining service standards

### **✅ Maintains Company Margins**
- **No additional cost:** Bonuses come from original bubbler's payout
- **Capped maximum:** $12 cap prevents excessive bonuses on large jobs
- **Proportional scaling:** Bonuses grow with job size but remain reasonable

### **✅ Encourages Quality**
- **Reasonable penalties:** Original bubblers motivated to maintain quality
- **Fair compensation:** Lead bubblers motivated to intervene when needed
- **Balanced approach:** Neither role is over-penalized or over-rewarded

---

## 📊 **Comparison: Old vs. New System**

### **Old System ($15 Flat Bonus):**

| Job Size | Original Penalty | Lead Bonus | Fairness |
|----------|------------------|------------|----------|
| **$45** | $15 (33%) | $15 | ❌ Too punitive |
| **$60** | $15 (25%) | $15 | ⚠️ Still high |
| **$90** | $15 (17%) | $15 | ✅ Reasonable |

### **New System (Tiered Bonus):**

| Job Size | Original Penalty | Lead Bonus | Fairness |
|----------|------------------|------------|----------|
| **$45** | $8 (18%) | $8 | ✅ Reasonable |
| **$60** | $11 (18%) | $11 | ✅ Proportional |
| **$90** | $12 (13%) | $12 | ✅ Capped fair |

---

## 🎯 **Implementation Summary**

### **✅ Database Function Ready**
- **`calculate_tiered_partial_bonus()`** function implemented
- **Proportional scaling** based on job amount
- **$12 maximum cap** to protect margins
- **$5 minimum bonus** for very small jobs

### **✅ Business Logic Validated**
- **Protects original bubblers** from overly punitive penalties
- **Rewards lead bubblers** fairly for intervention
- **Maintains company margins** with no additional cost
- **Encourages quality** through reasonable incentives

### **✅ Dashboard Integration Ready**
- **Instant calculations** for partial takeover bonuses
- **Proportional scaling** based on job size
- **Clear bonus caps** for transparency
- **Admin approval workflow** for final payout

This tiered system ensures **fair, proportional, and motivating** partial takeover compensation while **protecting all parties** and **maintaining service quality**! ✅ 