# Joint Assignment Margin Logic

## Overview
Updated job assignment logic to provide a margin for solo jobs on regular properties while maintaining stricter requirements for large properties.

## Key Changes

### Solo Job Duration Limits
- **Regular Properties**: Up to 5 hours (300 minutes) can be solo jobs
- **Large Properties**: Maximum 4 hours (240 minutes) for solo jobs
- **Large Property Definition**: 4+ bedrooms OR 3+ bathrooms

### Updated Assignment Rules

| Duration | Regular Properties | Large Properties | Bubblers Required |
|----------|-------------------|------------------|-------------------|
| **≤ 4 hours** | ✅ Solo | ✅ Solo | 1 |
| **4-5 hours** | ✅ Solo | ❌ Dual Required | 1-2 |
| **5-8 hours** | ❌ Dual Required | ❌ Dual Required | 2 |
| **8+ hours** | ❌ Team Required | ❌ Team Required | 3 |

## Implementation Details

### Constants Updated
```javascript
// Job Assignment Logic
export const JOB_ASSIGNMENT_RULES = {
  SOLO: { maxDuration: 300, bubblers: 1, type: 'solo' }, // ≤ 5 hours (increased from 4)
  DUAL: { maxDuration: 480, bubblers: 2, type: 'dual' }, // 5-8 hours
  TEAM: { maxDuration: 720, bubblers: 3, type: 'team' }  // 8+ hours
};

// Large Property Thresholds (still require joint assignment at 4+ hours)
export const LARGE_PROPERTY_THRESHOLDS = {
  BEDROOMS: 4,
  BATHROOMS: 3,
  SOLO_MAX_DURATION: 240 // 4 hours for large properties
};
```

### Function Updates

#### `determineJobAssignment()`
- Now accepts `propertyDetails` parameter
- Checks for large property status
- Applies different solo thresholds based on property size
- Returns detailed assignment information including reason

#### `getMultiBubblerSurcharge()`
- Updated to accept `bedrooms` and `bathrooms` parameters
- Calculates solo threshold based on property size
- Applies surcharge logic accordingly

## Examples

### Regular Property (3 Bed/2 Bath House)
- **4.5 hour job**: ✅ Solo assignment (under 5-hour limit)
- **5.5 hour job**: ❌ Dual assignment required
- **8.5 hour job**: ❌ Team assignment required

### Large Property (4 Bed/3 Bath House)
- **3.5 hour job**: ✅ Solo assignment (under 4-hour limit)
- **4.5 hour job**: ❌ Dual assignment required (exceeds 4-hour limit)
- **8.5 hour job**: ❌ Team assignment required

## Benefits

1. **Flexibility for Regular Properties**: Allows experienced bubblers to handle longer solo jobs
2. **Quality Control for Large Properties**: Ensures large properties get adequate staffing
3. **Fair Compensation**: Maintains appropriate surcharges for multi-bubbler jobs
4. **Clear Logic**: Easy to understand and implement

## Files Modified

1. **`src/constants/hustleLogic.js`**
   - Updated `JOB_ASSIGNMENT_RULES`
   - Added `LARGE_PROPERTY_THRESHOLDS`
   - Modified `determineJobAssignment()` function

2. **`public/gogobubbles-site/booking.html`**
   - Updated `getMultiBubblerSurcharge()` function
   - Enhanced display logic for bubbler count
   - Improved surcharge calculation

## Testing Scenarios

### Solo Job Scenarios
- ✅ 4.5 hour job on 3 bed/2 bath house → Solo
- ✅ 3.5 hour job on 4 bed/3 bath house → Solo
- ❌ 4.5 hour job on 4 bed/3 bath house → Dual

### Joint Job Scenarios
- ✅ 5.5 hour job on 3 bed/2 bath house → Dual
- ✅ 4.5 hour job on 4 bed/3 bath house → Dual
- ✅ 8.5 hour job on any property → Team

This margin logic provides the flexibility needed for regular properties while maintaining quality standards for large properties. 