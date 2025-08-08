# 🧼 New Home Cleaning Add-Ons Implementation

## Overview
Three new add-ons have been implemented to provide customers with more flexibility while keeping bubbler expectations clearly defined.

## ✅ New Add-Ons

### 1. Clean Kitchen Add-On

**For both Refresh and Deep Clean tiers to add thorough kitchen surface cleaning.**

- **Label**: Clean Kitchen
- **Price**: $30
- **Duration**: +30 minutes
- **Description**: Thorough wipe-down of all kitchen surfaces, including countertops, backsplash, and exterior of appliances. Available for both Refresh and Deep Clean tiers. Does not include oven or stove-top degreasing unless also selected.
- **Logic**:
  - Available for both Refresh and Deep Clean tiers
  - Can be added to any home cleaning service
  - Bubbler Expectations: Wipe down all kitchen surfaces with general cleaner, remove surface crumbs and spots. No scrubbing of buildup or grease.

### 2. Stove Top Cleaning Add-On

**For homes with heavy food buildup or cooking stains on stove burners.**

- **Label**: Stove Top Cleaning
- **Price**: $15
- **Duration**: +15 minutes
- **Description**: Deep cleaning of stove surface, burner caps, and surrounding trim. Removes grease, stuck-on food, and buildup.
- **Logic**:
  - Available regardless of tier
  - Can be booked with or without oven cleaning
  - Not included by default in Signature Deep Clean unless explicitly bundled
  - Bubbler Expectations: Scrub and degrease stove top using approved products, wipe down fully.

### 3. Eco-Friendly Products Add-On

**Perfect for households with kids, pets, or scent sensitivities.**

- **Label**: Eco-Friendly Cleaning
- **Price**: $10
- **Duration**: +0 minutes (no additional time)
- **Description**: We'll use non-toxic, biodegradable, eco-safe products throughout your home. No harsh chemicals or artificial scents.
- **Logic**:
  - Available at all service tiers
  - Stays visible in all bookings
  - Bubbler Expectations: Use eco-approved cleaning products provided in starter kit or rented kit. No use of bleach, ammonia, or synthetic fragrances.

## 🧩 Booking Form Integration

### Conditional Display Logic
```javascript
// All add-ons are now available for both Refresh and Deep Clean tiers
// No conditional restrictions on Clean Kitchen add-on
```

### Add-On Configuration
```javascript
const homecleanAddons = {
  // ... existing add-ons
  cleankitchen: {price:30, desc:"Clean Kitchen", details:"Thorough wipe-down of all kitchen surfaces, including countertops, backsplash, and exterior of appliances. Available for both Refresh and Deep Clean tiers. Does not include oven or stove-top degreasing unless also selected."},
  stovetop: {price:15, desc:"Stove Top Cleaning", details:"Deep cleaning of stove surface, burner caps, and surrounding trim. Removes grease, stuck-on food, and buildup."},
  ecofriendly: {price:10, desc:"Eco-Friendly Cleaning", details:"We'll use non-toxic, biodegradable, eco-safe products throughout your home. No harsh chemicals or artificial scents."}
};
```

## 📊 Booking Summary Example

### Customer View
```
🏠 Service: Home Cleaning (Refresh Clean)
🛏 Rooms: 3 bed / 2 bath
➕ Add-ons:
   - Clean Kitchen ($30)
   - Stove Top Cleaning ($15)
   - Eco-Friendly Products ($10)
💰 Subtotal: $145
💰 Total After Tax: $157.96
```

## 🧼 "What's Included" Summary

### Clean Kitchen
- Wipe down of all surfaces
- Sink and faucet cleaning
- Microwave exterior/interior (if visible)
- Appliance front wipe
- No oven or stove-top cleaning unless booked separately

### Stove Top Cleaning
- Degreasing of all burner areas
- Wipe and polish stove surface
- Food/buildup removal

### Eco-Friendly Products
- All-purpose eco-cleaner
- Vinegar/glass cleaner where applicable
- No bleach or heavy solvents used

## ⏱️ Duration Impact

| Add-On | Duration Impact | Total Job Impact |
|--------|----------------|------------------|
| **Clean Kitchen** | +30 minutes | Moderate increase |
| **Stove Top Cleaning** | +15 minutes | Small increase |
| **Eco-Friendly Products** | +0 minutes | No impact |

### Combined Impact Examples

#### **Clean Kitchen + Stove Top Together**
```
Duration Impact: +45 minutes (30 + 15)
Payout Boost: +$18 ($12 + $6)
Job Assignment: May trigger dual bubbler if total exceeds 5 hours
```

#### **Clean Kitchen Only**
```
Duration Impact: +30 minutes
Payout Boost: +$12
Job Assignment: May trigger dual bubbler if total exceeds 5 hours
```

#### **Stove Top Only**
```
Duration Impact: +15 minutes
Payout Boost: +$6
Job Assignment: Unlikely to trigger dual bubbler alone
```

### Job Assignment Triggers

#### **Solo Job Thresholds**
- **Regular Properties**: ≤ 5 hours (300 minutes)
- **Large Properties**: ≤ 4 hours (240 minutes)

#### **Add-On Impact on Assignment**
- **Clean Kitchen (+30 min)**: May push job over solo threshold
- **Stove Top (+15 min)**: Minimal impact on assignment
- **Eco-Friendly (+0 min)**: No impact on assignment

#### **Example: 4 Bed/3 Bath House with Add-ons**
```
Base Duration: 4.0 hours
Clean Kitchen: +0.5 hours
Stove Top: +0.25 hours
Total: 4.75 hours
Assignment: Solo (under 5-hour limit for regular properties)
```

## 💰 Pricing Impact

### Example: 3 Bed/2 Bath Apartment (Refresh)
```
Base Price: $90
Additional Rooms: 2 × $15 = $30
Clean Kitchen: $30
Stove Top Cleaning: $15
Eco-Friendly Products: $10
Subtotal: $175
Tax (8.25%): $14.44
Total: $189.44
```

## 💰 Bubbler Payouts

### New Add-On Payouts

| Add-On | Customer Price | Bubbler Payout | Payout Ratio |
|--------|----------------|----------------|--------------|
| **Clean Kitchen** | $30 | $12 | 40% |
| **Stove Top Cleaning** | $15 | $6 | 40% |
| **Eco-Friendly Cleaning** | $10 | $4 | 40% |

### Payout Calculation Example
```
Job: 3 Bed/2 Bath Apartment (Refresh)
Base Payout: $45
Additional Rooms: 2 × $7 = $14
Clean Kitchen: $12
Stove Top Cleaning: $6
Eco-Friendly Products: $4
Total Bubbler Payout: $81
```

## 🎯 Bubbler Expectations

### Clean Kitchen
- ✅ Wipe down all kitchen surfaces
- ✅ Remove surface crumbs and spots
- ✅ Clean sink and faucet
- ✅ Wipe appliance exteriors
- ❌ No deep scrubbing of buildup
- ❌ No oven cleaning (unless selected)

### Stove Top Cleaning
- ✅ Scrub and degrease stove surface
- ✅ Clean burner caps
- ✅ Remove stuck-on food
- ✅ Polish stove surface
- ✅ Use approved cleaning products

### Eco-Friendly Products
- ✅ Use non-toxic products only
- ✅ No bleach or ammonia
- ✅ No synthetic fragrances
- ✅ Use provided eco-friendly kit
- ✅ Maintain cleaning quality standards

## 🔧 Technical Implementation

### Files Modified
1. **`public/gogobubbles-site/booking.html`**
   - Added new add-ons to `homecleanAddons` object
   - Updated conditional display logic
   - Added duration calculations

2. **`src/constants.js`**
   - Added new add-ons to `addonDurations` configuration
   - Updated duration calculation logic

### Duration Calculation
```javascript
// Add addon time
addons.forEach(addon => {
  if (addon === 'cleankitchen') {
    baseDuration += 30; // 30 minutes for clean kitchen
  } else if (addon === 'stovetop') {
    baseDuration += 15; // 15 minutes for stove top cleaning
  } else if (addon === 'ecofriendly') {
    baseDuration += 0; // No additional time for eco-friendly products
  }
});
```

## 🎯 Benefits

### For Customers
- ✅ **More flexibility** in service customization
- ✅ **Clear pricing** for additional services
- ✅ **Eco-friendly options** for sensitive households
- ✅ **Targeted cleaning** for specific areas

### For Bubblers
- ✅ **Clear expectations** for each add-on
- ✅ **Fair compensation** for additional work
- ✅ **Structured approach** to complex tasks
- ✅ **Quality standards** maintained

### For Operations
- ✅ **Streamlined booking** process
- ✅ **Consistent pricing** across all tiers
- ✅ **Quality control** through clear expectations
- ✅ **Scalable system** for future add-ons

## 🔮 Future Enhancements

### Potential Add-Ons
- **Window Cleaning**: Interior window cleaning
- **Blind Cleaning**: Dusting and cleaning of window blinds
- **Ceiling Fan Cleaning**: Dusting and cleaning of ceiling fans
- **Baseboard Cleaning**: Detailed baseboard cleaning
- **Garage Cleaning**: Basic garage organization and cleaning

### Advanced Features
- **Add-On Packages**: Pre-configured add-on combinations
- **Seasonal Add-Ons**: Holiday-specific cleaning services
- **Pet-Specific Add-Ons**: Specialized cleaning for pet owners
- **Allergy-Friendly Add-Ons**: HEPA filtration and hypoallergenic cleaning

The new add-ons provide customers with **greater flexibility** while maintaining **clear expectations** for bubblers! 🎯 