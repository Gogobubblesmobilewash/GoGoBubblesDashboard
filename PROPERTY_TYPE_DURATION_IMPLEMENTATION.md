# Property Type Duration Adjustment Implementation

## Overview

This implementation adds property type-based duration adjustments to the GoGoBubbles booking and dashboard systems. The system applies duration reductions for smaller property types (apartments, condos, lofts) to reflect their more efficient cleaning requirements.

## Implementation Details

### 1. Duration Adjustment Rules

**Property Type Adjustments:**
- **Apartment**: 20% reduction (faster to clean - smaller footprint)
- **Condo/Townhome**: 15% reduction (similar to apartments but with stairs/multiple floors)
- **Loft**: 20% reduction (efficient for basic cleaning, open concept)
- **Detached House**: 0% reduction (full baseline timing)

### 2. Specific Duration Rules by Tier + Type

**1 BED / 1 BATH:**
- Apartment: Refresher 1.5hrs, Signature Deep 2.25hrs
- Condo/Loft: Refresher 1.75hrs, Signature Deep 2.5hrs
- House: Refresher 2hrs, Signature Deep 2.75hrs

**2 BED / 1-2 BATH:**
- Apartment: Refresher 2.25hrs, Signature Deep 3.25hrs
- Condo/Loft: Refresher 2.5hrs, Signature Deep 3.5hrs
- House: Refresher 3hrs, Signature Deep 4.25hrs

**3 BED / 2 BATH:**
- Apartment: Refresher 3.25hrs, Signature Deep 5.25hrs
- Condo/Townhome: Refresher 3.5hrs, Signature Deep 5.5hrs
- House: Refresher 4hrs, Signature Deep 6.25hrs

### 3. Files Modified

#### `src/constants.js`
- Added `PROPERTY_TYPE_DURATION_ADJUSTMENTS` object
- Added `PROPERTY_TYPE_DURATION_RULES` object
- Added `calculatePropertyTypeAdjustedDuration()` function
- Added `getPropertyTypeSpecificDuration()` function
- Updated `calculateHomeCleaningDuration()` to include property type parameter
- Updated `calculateJobDuration()` to pass property type to home cleaning calculations

#### `public/gogobubbles-site/booking.html`
- Added property type selection dropdown to home cleaning form
- Updated state initialization to include `propertyType: 'Detached House'`
- Added event handler for property type changes
- Updated order summary to display property type information
- Updated form submission to include property type in service data

#### `src/components/dashboard/Dashboard.jsx`
- Added imports for property type duration calculation functions
- Added `calculateJobDurationWithPropertyType()` utility function
- Updated dashboard to use property type-adjusted calculations

#### `src/components/dashboard/PropertyTypeDurationExample.jsx`
- Created demonstration component showing property type duration calculations
- Interactive controls for bedrooms, bathrooms, tier, and property type
- Real-time duration calculation display
- Property type rules explanation

### 4. Usage Examples

#### Basic Duration Calculation
```javascript
import { calculateJobDuration } from '../constants';

const duration = calculateJobDuration('Home Cleaning', 'refreshed', [], {
  bedrooms: 2,
  bathrooms: 2,
  propertyType: 'Apartment'
});

console.log(duration.totalDuration); // Adjusted duration in minutes
```

#### Property Type Specific Duration
```javascript
import { getPropertyTypeSpecificDuration } from '../constants';

const specificDuration = getPropertyTypeSpecificDuration(2, 2, 'refreshed', 'Apartment');
// Returns specific duration for 2 bed/2 bath apartment refresher clean
```

#### Dashboard Integration
```javascript
const calculateJobDurationWithPropertyType = (serviceData) => {
  const { service, tier, bedrooms, bathrooms, propertyType, addons = [] } = serviceData;
  
  if (service === 'Home Cleaning') {
    return calculateJobDuration(service, tier, addons, {
      bedrooms,
      bathrooms,
      propertyType: propertyType || 'Detached House'
    });
  }
  
  return calculateJobDuration(service, tier, addons);
};
```

### 5. Booking Form Integration

The booking form now includes:
- Property type selection dropdown with clear labels
- Real-time duration adjustments
- Property type information in order summary
- Property type data included in form submission

### 6. Dashboard Integration

The dashboard now:
- Uses property type-adjusted duration calculations
- Displays adjusted durations for job assignments
- Considers property type for bubbler assignment logic
- Shows property type information in job details

### 7. Benefits

1. **More Accurate Scheduling**: Property type adjustments provide more realistic job duration estimates
2. **Efficient Bubbler Assignment**: Shorter durations for smaller properties allow for better job allocation
3. **Customer Transparency**: Property type information is clearly displayed in order summaries
4. **Flexible System**: Easy to adjust percentages or add new property types
5. **Backward Compatibility**: Defaults to 'Detached House' for existing orders

### 8. Future Enhancements

1. **Dynamic Adjustments**: Could add seasonal or market-specific adjustments
2. **Property Size Integration**: Could factor in actual square footage
3. **Historical Data**: Could use past job data to refine adjustments
4. **Customer Preferences**: Could allow customers to override property type selections

### 9. Testing

The `PropertyTypeDurationExample` component provides a testing interface to:
- Verify duration calculations
- Test different property type combinations
- Validate adjustment percentages
- Demonstrate the system to stakeholders

### 10. Deployment Notes

- All changes are backward compatible
- Existing orders will default to 'Detached House' property type
- No database migrations required
- Property type data is stored in the existing services JSON field

## Implementation Summary

✅ **Duration Adjustment Logic**: 20% reduction for apartments/lofts, 15% for condos  
✅ **Booking Form Integration**: Property type selection with real-time updates  
✅ **Order Summary Updates**: Property type information displayed to customers  
✅ **Dashboard Calculations**: Property type-adjusted duration for job assignments  
✅ **Backward Compatibility**: Defaults to full timing for existing orders  
✅ **Documentation**: Comprehensive implementation guide and examples  

The system is now ready for production use and will provide more accurate job duration estimates based on property type, leading to better scheduling and bubbler assignment decisions. 