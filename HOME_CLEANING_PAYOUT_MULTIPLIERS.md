# 🏠 Home Cleaning Payout Multipliers

## Overview
For Home Cleaning services, **only three multipliers** are applied to bubbler payouts:

1. **Large Home Multiplier** (28%)
2. **Dual Bubbler Multiplier** (10%)
3. **Pet Presence Multiplier** (10%)

## ✅ Approved Multipliers

### 1. Large Home Multiplier
- **Trigger**: Property has 4+ bedrooms OR 3+ bathrooms
- **Amount**: +28% to base payout
- **Applied At**: Job level calculation
- **Reason**: Large properties require more time and effort

### 2. Dual Bubbler Multiplier
- **Trigger**: Job requires 2 or more bubblers
- **Amount**: +10% to base payout
- **Applied At**: Job level calculation
- **Reason**: Coordination and teamwork premium

### 3. Pet Presence Multiplier
- **Trigger**: Customer reports pets in the home
- **Amount**: +10% to individual task payouts
- **Applied At**: Task level calculation
- **Reason**: Additional cleaning effort for pet hair and dander
- **Applies To**: Room cleaning tasks only (bedrooms, bathrooms, kitchen, living room, etc.)
- **Excluded From**: Appliance cleaning and detailed tasks (oven, fridge, stove top, windows, etc.)

### 📋 Pet Multiplier Task Breakdown

#### ✅ Tasks That Get Pet Multiplier (+10%)
- **Bedroom** ($15 → $16.50)
- **Bathroom** ($15 → $16.50)
- **Kitchen** ($20 → $22)
- **Living Room** ($15 → $16.50)
- **Dining Room** ($10 → $11)
- **Office** ($10 → $11)
- **Laundry Room** ($8 → $8.80)
- **Garage** ($12 → $13.20)
- **Patio** ($10 → $11)
- **Clean Kitchen** ($12 → $13.20)
- **Eco-Friendly Cleaning** ($4 → $4.40)

#### ❌ Tasks That Do NOT Get Pet Multiplier
- **Oven Cleaning** ($8 - no multiplier)
- **Fridge Cleaning** ($8 - no multiplier)
- **Stove Top Cleaning** ($6 - no multiplier)
- **Windows** ($5 - no multiplier)
- **Baseboards** ($3 - no multiplier)
- **Ceiling Fans** ($5 - no multiplier)
- **Cabinet Cleaning** ($10 - no multiplier)
- **Freezer Cleaning** ($8 - no multiplier)

#### 🎯 Reasoning
- **Room cleaning tasks** are affected by pet hair, dander, and paw prints
- **Appliance cleaning** and **detailed tasks** are not significantly impacted by pets
- **Fair compensation** for actual additional work required

## ❌ Removed Multipliers

### Previously Applied (Now Removed)
- **Large Room Multiplier** (20%) - Removed
- **Deep Clean Multiplier** (30%) - Removed
- **High Traffic Multiplier** (15%) - Removed

## 🔧 Implementation Details

### Task-Level Payouts (`calculateTaskPayout`)
```javascript
export const calculateTaskPayout = (taskType, taskDetails = {}) => {
  let basePayout = basePayouts[taskType] || 10;
  
  // ONLY pet presence multiplier applies at task level
  if (taskDetails.hasPets) basePayout *= 1.1;
  
  return Math.round(basePayout);
};
```

### Job-Level Payouts (`calculateJobPayout`)
```javascript
export const calculateJobPayout = (jobDetails, assignment) => {
  // ... base calculation ...
  
  if (serviceType === 'Home Cleaning') {
    // 1. Large Home Multiplier
    if (isLargeProperty) {
      basePayout *= 1.28; // 28% increase
    }
    
    // 2. Dual Bubbler Multiplier
    if (assignment.bubblers >= 2) {
      basePayout *= 1.10; // 10% increase
    }
    
    // 3. Pet Presence (handled at task level)
  }
  
  return Math.round(basePayout);
};
```

## 📊 Example Calculations

### Example 1: 3 Bed/2 Bath Apartment (Solo Job, No Pets)
```
Base Payout: $45 (Refresh tier)
Large Home: No (3 beds < 4, 2 baths < 3)
Dual Bubbler: No (solo job)
Pet Presence: No
Total Payout: $45
```

### Example 2: 4 Bed/3 Bath House (Dual Job, With Pets)
```
Base Payout: $60 (Signature Deep tier)
Large Home: Yes (4 beds, 3 baths) → +28% = $76.80
Dual Bubbler: Yes (2+ bubblers) → +10% = $84.48
Pet Presence: Yes (applied to individual tasks)
Total Payout: $84.48 + pet multipliers on tasks
```

### Example 3: 2 Bed/1 Bath Apartment (Solo Job, With Pets)
```
Base Payout: $45 (Refresh tier)
Large Home: No
Dual Bubbler: No
Pet Presence: Yes (applied to individual tasks)
Total Payout: $45 + pet multipliers on tasks
```

## 🎯 Benefits

### For Bubblers
- ✅ **Simplified payout structure** - only 3 clear multipliers
- ✅ **Fair compensation** for large properties and team work
- ✅ **Pet-specific compensation** for additional cleaning effort

### For Operations
- ✅ **Consistent pricing** across all home cleaning jobs
- ✅ **Clear expectations** about what affects payouts
- ✅ **Reduced complexity** in payout calculations

### For Quality Assurance
- ✅ **Incentivized thorough cleaning** for pet homes
- ✅ **Team coordination** properly compensated
- ✅ **Large property challenges** appropriately rewarded

## 🔄 Comparison with Other Services

### Home Cleaning
- ✅ **3 multipliers only**: Large Home, Dual Bubbler, Pet Presence
- ✅ **Task-level**: Pet presence multiplier
- ✅ **Job-level**: Large home and dual bubbler multipliers

### Car Wash
- ✅ **Vehicle type multipliers** (car, truck, SUV, etc.)
- ✅ **Complexity multipliers** (high/medium complexity)
- ✅ **Team coordination** multipliers

### Laundry Service
- ✅ **Express service** multipliers
- ✅ **Volume-based** pricing
- ✅ **Add-on** multipliers

## 📋 Summary

The Home Cleaning payout system now uses **only three multipliers**:

1. **Large Home** (28%) - Applied at job level for 4+ beds or 3+ baths
2. **Dual Bubbler** (10%) - Applied at job level for 2+ bubblers  
3. **Pet Presence** (10%) - Applied at task level for pet homes

This ensures **fair compensation** while maintaining **simplicity** and **consistency** across all home cleaning jobs! 🏠✨ 