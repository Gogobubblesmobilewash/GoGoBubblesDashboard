# 🏠 Hybrid Pricing System: Property Type + Size Based

## Overview

The GoGoBubbles pricing system now uses a **hybrid approach** that considers both **property type** and **property size** to ensure fair pricing and appropriate bubbler assignments.

## 🎯 Core Principles

### **Two-Layer Pricing Logic:**
1. **Property Type** (Apartment/Loft, Condo/Townhome, House) - Base pricing
2. **Property Size** (bedrooms + bathrooms) - Size-based adjustments

### **Fair Compensation:**
- **Base payouts** for apartments/lofts
- **Size-based adjustments** for larger properties
- **Multi-bubbler assignments** for complex jobs

## 💰 Base Payouts (Apartments & Lofts)

### **Home Cleaning Base Payouts**

| Service Tier | Customer Price | Bubbler Payout |
|--------------|----------------|----------------|
| **Refresher** | $90 | $45 |
| **Signature Deep Clean** | $130 | $60 |

### **Room Add-ons**

| Add-on Type | Customer Price | Bubbler Payout |
|-------------|----------------|----------------|
| **Extra Bedroom** | $15 | $7 |
| **Extra Bathroom** | $15 | $7 |

### **Home Cleaning Add-ons**

| Add-on Service | Customer Price | Bubbler Payout |
|----------------|----------------|----------------|
| **Deep Dusting** | $25 | $10 |
| **Deep Clean Bedroom** | $25 | $10 |
| **Extra Bedrooms (Large Property)** | $25 | $10 |
| **Fridge Clean** | $30 | $12 |
| **Oven Clean** | $30 | $12 |
| **Freezer Clean** | $15 | $6 |
| **Cabinet Clean** | $15 | $6 |
| **Steam Mopping** | $15 | $6 |

## 🏠 Property Type + Size Pricing Matrix

### **Apartment/Loft Pricing**

| Bedrooms/Bathrooms | Customer Price | Bubbler Payout | Bubblers Required |
|-------------------|----------------|----------------|-------------------|
| **1-2 bd, ≤2 ba** | Base ($90/$130) | Base payout | 1 bubbler |
| **3 bd or 3 ba** | +10% | +10% payout | 1 bubbler |
| **≥4 bd or ≥3 ba** | +28% | +28% payout | 2-3 bubblers |

### **Condo/Townhouse Pricing**

| Bedrooms/Bathrooms | Customer Price | Bubbler Payout | Bubblers Required |
|-------------------|----------------|----------------|-------------------|
| **1-2 bd, ≤2 ba** | +10% | +10% payout | 1 bubbler |
| **3 bd or 3 ba** | +15% | +15% payout | 1-2 bubblers |
| **≥4 bd or ≥3 ba** | +28% | +28% payout | 2-3 bubblers |

### **Single-Family Home Pricing**

| Bedrooms/Bathrooms | Customer Price | Bubbler Payout | Bubblers Required |
|-------------------|----------------|----------------|-------------------|
| **1-3 bd, ≤2 ba** | +15% | +15% payout | 1 bubbler |
| **≥4 bd or ≥3 ba** | +28% | +28% payout | 2-3 bubblers |

### **Large Property Override (Any Type)**

| Condition | Customer Price | Bubbler Payout | Bubblers Required |
|-----------|----------------|----------------|-------------------|
| **≥4 bd or ≥3 ba** | +28% | +28% payout | 2-3 bubblers |
| **Estimated job >8 hrs** | — | — | 3 bubblers |

## 📊 Example Calculations

### **Example 1: 2 Bed/2 Bath Apartment**
```
Base Price: $90 (Refresher)
Additional Bedroom: 1 × $15 = $15
Additional Bathroom: 1 × $15 = $30
Total: $120
Bubbler Payout: $60 (base) + $7 + $7 = $74
```

### **Example 2: 3 Bed/2 Bath Apartment (Medium Size)**
```
Base Price: $90 + 10% = $99 (Refresher)
Additional Bedrooms: 2 × $15 = $30
Additional Bathroom: 1 × $15 = $15
Total: $144
Bubbler Payout: $54.50 (base +10%) + $14 + $7 = $75.50
```

### **Example 3: 4 Bed/3 Bath Condo (Large Size)**
```
Base Price: $99 + 28% = $126.72 (Refresher)
Additional Bedrooms: 3 × $25 = $75 (Large Property Rate)
Additional Bathrooms: 2 × $25 = $50 (Large Property Rate)
Total: $251.72
Bubbler Payout: $63.36 (base +28%) + $30 + $20 = $113.36
Assignment: 2-3 bubblers
```

### **Example 4: 5 Bed/3 Bath House (Large Size)**
```
Base Price: $103.50 + 28% = $132.48 (Refresher)
Additional Bedrooms: 4 × $25 = $100 (Large Property Rate)
Additional Bathrooms: 2 × $25 = $50 (Large Property Rate)
Total: $282.48
Bubbler Payout: $66.24 (base +28%) + $40 + $20 = $126.24
Assignment: 2-3 bubblers
```

## 🔄 Logic Implementation

### **Pricing Calculation Steps:**

1. **Apply Property Type Base:**
   - Apartment/Loft: Base pricing
   - Condo/Townhouse: +10%
   - House: +15%

2. **Apply Size-Based Adjustments:**
   - Medium (3 bd/ba): +10% for Apartment, +15% for Condo
   - Large (≥4 bd or ≥3 ba): +28% for all types

3. **Calculate Room Add-ons:**
   - Standard: $15 per additional room
   - Large Property: $25 per additional room

4. **Apply Surcharges:**
   - Size-based surcharge: 10% or 28%
   - Multi-bubbler surcharge: 10% if >4 hours

### **Bubbler Assignment Logic:**

| Job Duration | Assignment Type | Bubblers | Surcharge |
|--------------|----------------|----------|-----------|
| **≤ 4 hours** | Solo | 1 | None |
| **4-8 hours** | Dual | 2 | +10% |
| **8+ hours** | Team | 3 | +10% |

## 🎯 Key Benefits

### **For Customers:**
- ✅ **Fair pricing** based on actual property complexity
- ✅ **Faster service** with multi-bubbler assignments
- ✅ **Consistent experience** regardless of property type
- ✅ **Transparent pricing** with clear breakdowns

### **For Bubblers:**
- ✅ **Fair compensation** for complex properties
- ✅ **Appropriate workload** distribution
- ✅ **Performance-based** opportunities
- ✅ **Clear earning** structure

### **For Operations:**
- ✅ **Optimized resource** allocation
- ✅ **Prevents underpricing** large apartments
- ✅ **Prevents overworking** solo bubblers
- ✅ **Scalable system** for growth

## 🔧 Technical Implementation

### **Pricing Functions:**
```javascript
// Hybrid pricing system
getHomeCleanPricing(propertyType, bedrooms, bathrooms)

// Size-based adjustments
getSizeBasedSurcharge(bedrooms, bathrooms, subtotal)

// Multi-bubbler logic
getMultiBubblerSurcharge(duration, subtotal)
```

### **Assignment Logic:**
```javascript
// Job duration calculation
calculateHomeCleaningDuration(tier, addons, bedrooms, bathrooms, propertyType)

// Bubbler assignment
determineJobAssignment(estimatedDuration)
```

## 📈 Business Impact

### **Revenue Optimization:**
- **Large apartments** properly priced (was underpriced)
- **Complex properties** generate appropriate revenue
- **Multi-bubbler jobs** have premium pricing

### **Operational Efficiency:**
- **Appropriate bubbler assignments** prevent burnout
- **Size-based pricing** reflects actual work required
- **Transparent system** reduces disputes

### **Customer Satisfaction:**
- **Fair pricing** for all property types
- **Faster service** for complex properties
- **Clear expectations** about service delivery

---

*This hybrid system ensures fair pricing, appropriate bubbler assignments, and customer satisfaction while preventing underpricing of large properties or overworking of solo bubblers.* 