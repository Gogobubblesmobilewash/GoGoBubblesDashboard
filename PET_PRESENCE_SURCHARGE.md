# 🐾 Pet Presence Surcharge Implementation

## Overview
The Pet Presence Surcharge is a 10% additional charge applied to Home Cleaning services when customers report having pets in their home. This surcharge accounts for the additional time and effort required to clean pet hair, dander, and other pet-related messes.

## 💰 Surcharge Details

### **Amount**: +10%
### **Trigger**: Customer self-report during booking
### **Applies To**: All Home Cleaning tiers (Refresh and Signature Deep Clean)
### **Stackable**: Yes, with all other add-ons and surcharges

## 🧼 Why It Exists

- **Pet hair and dander** require more vacuuming and dusting
- **Higher likelihood** of odor, paw prints, or spot cleaning
- **Time and effort increase** — even in tidy homes
- **Additional cleaning products** may be needed for pet odors

## 🔁 Booking Logic

### Customer Checkpoint
```
"Do you have pets in the home?"
(Yes / No toggle during booking)
```

### Pricing Logic
```javascript
if (hasPets) {
  subtotal *= 1.10; // Adds 10% to the base + room + add-on total
}
```

## 💳 Example Calculation

### Example: 3 Bed/2 Bath Apartment (Refresh)
```
Component                    Value
Base (Refresh)              $90
3 Bed / 2 Bath Add-ons     $60
Pet Surcharge (10%)        $15.00
Total                      $165.00
```

## 🧾 Booking Summary Display

When pets are present, the summary shows:
```
🐾 Pet Surcharge (10%) — $15.00
Homes with pets require extra time and effort to ensure a thorough clean.
```

## 📋 Implementation Details

### State Management
```javascript
let state = {
  homeclean: {
    // ... existing properties
    hasPets: false
  }
};
```

### UI Component
```html
<div style="margin:1rem 0; padding:1rem; background:#fff3cd; border-radius:0.5rem; border:1px solid #ffeaa7;">
  <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
    <input type="checkbox" class="hc-pets" ${state.homeclean.hasPets ? 'checked' : ''}/>
    <span style="font-weight:600;">🐾 Do you have pets in the home?</span>
  </label>
  <div class="info-msg" style="margin-left:1.5em; margin-top:0.5rem;">
    Pet hair and dander require extra vacuuming and dusting. A 10% surcharge applies to ensure thorough cleaning.
  </div>
</div>
```

### Event Listener
```javascript
const hcPets = document.querySelector('.hc-pets');
if (hcPets) {
  hcPets.onchange = e => {
    state.homeclean.hasPets = e.target.checked;
    renderServiceSections();
    calculateSummary();
  };
}
```

### Pricing Calculation
```javascript
// Calculate pet surcharge
const petSurcharge = state.homeclean.hasPets ? baseSubtotal * 0.10 : 0;

// Add to total
const total = baseSubtotal + sizeBasedSurcharge + petSurcharge + multiBubblerSurcharge;
```

## 🎯 Bubbler Impact

### Payout Structure
- **Pet surcharge** goes to the company (not bubbler)
- **Bubblers still get** the pet presence multiplier (+10%) on individual tasks
- **Fair compensation** for additional cleaning effort

### Task-Based Payouts
```javascript
// In calculateTaskPayout function
if (taskDetails.hasPets) basePayout *= 1.1; // +10% for pet presence
```

## 📊 Examples

### Example 1: 2 Bed/1 Bath Apartment with Pets
```
Base Price: $90
Pet Surcharge: +10% = $9
Total: $99
Bubbler Payout: $45 (base) + pet multiplier on individual tasks
```

### Example 2: 4 Bed/3 Bath House with Pets + Add-ons
```
Base Price: $103.50
Additional Rooms: $100
Clean Kitchen: $30
Pet Surcharge: +10% = $23.35
Total: $256.85
Bubbler Payout: $51.75 (base) + room payouts + add-on payouts + pet multipliers
```

## ✅ Benefits

### For Customers
- ✅ **Transparent pricing** for pet-related cleaning
- ✅ **Clear expectations** about additional costs
- ✅ **Thorough cleaning** guaranteed for pet homes

### For Bubblers
- ✅ **Fair compensation** for additional pet cleaning effort
- ✅ **Clear expectations** about pet-related tasks
- ✅ **Task-based multipliers** for individual pet cleaning

### For Operations
- ✅ **Consistent pricing** across all pet homes
- ✅ **Quality assurance** for pet cleaning standards
- ✅ **Revenue optimization** for additional cleaning needs

## 🔮 Future Enhancements

### Potential Features
- **Pet Type Specificity**: Different rates for dogs vs cats
- **Pet Count Multiplier**: Additional surcharge for multiple pets
- **Pet-Specific Add-ons**: Specialized pet cleaning services
- **Allergy-Friendly Options**: HEPA filtration for pet homes

The Pet Presence Surcharge ensures **fair pricing** while maintaining **quality standards** for homes with pets! 🐾 