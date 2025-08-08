import React, { useState } from 'react';
import { 
  calculateJobDuration, 
  calculatePropertyTypeAdjustedDuration,
  getPropertyTypeSpecificDuration,
  PROPERTY_TYPE_DURATION_ADJUSTMENTS 
} from '../../constants';

const PropertyTypeDurationExample = () => {
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [tier, setTier] = useState('refreshed');
  const [propertyType, setPropertyType] = useState('Detached House');
  const [addons, setAddons] = useState([]);

  // Calculate duration with property type adjustments
  const calculateDuration = () => {
    const duration = calculateJobDuration('Home Cleaning', tier, addons, {
      bedrooms,
      bathrooms,
      propertyType
    });

    // Get specific duration if available
    const specificDuration = getPropertyTypeSpecificDuration(bedrooms, bathrooms, tier, propertyType);
    
    return {
      calculated: duration,
      specific: specificDuration,
      adjustment: PROPERTY_TYPE_DURATION_ADJUSTMENTS[propertyType] || 0
    };
  };

  const durationInfo = calculateDuration();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Property Type Duration Adjustment System</h2>
      
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Bedrooms</label>
          <select 
            value={bedrooms} 
            onChange={(e) => setBedrooms(Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bathrooms</label>
          <select 
            value={bathrooms} 
            onChange={(e) => setBathrooms(Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {[1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tier</label>
          <select 
            value={tier} 
            onChange={(e) => setTier(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="refreshed">Refresher Clean</option>
                            <option value="deep">SignatureDeepClean</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Property Type</label>
          <select 
            value={propertyType} 
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="Detached House">Detached House (Full timing)</option>
            <option value="Apartment">Apartment (20% faster)</option>
            <option value="Condo/Townhome">Condo/Townhome (15% faster)</option>
            <option value="Loft">Loft (20% faster)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Duration Calculation</h3>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium">Calculated Duration:</span>
              <span className="ml-2 text-lg">
                {Math.round(durationInfo.calculated.totalDuration / 60 * 10) / 10} hours
              </span>
            </div>
            
            {durationInfo.specific && (
              <div>
                <span className="font-medium">Specific Duration:</span>
                <span className="ml-2 text-lg">
                  {Math.round(durationInfo.specific / 60 * 10) / 10} hours
                </span>
              </div>
            )}
            
            <div>
              <span className="font-medium">Property Type Adjustment:</span>
              <span className="ml-2 text-lg">
                {durationInfo.adjustment * 100}%
              </span>
            </div>
            
            {durationInfo.calculated.adjustmentApplied && (
              <div className="text-green-600 font-medium">
                ✓ Duration adjusted for {propertyType}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Property Type Rules</h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Apartment:</span>
              <span className="ml-2">20% faster - smaller footprint</span>
            </div>
            <div>
              <span className="font-medium">Condo/Townhome:</span>
              <span className="ml-2">15% faster - similar to apartments</span>
            </div>
            <div>
              <span className="font-medium">Loft:</span>
              <span className="ml-2">20% faster - open concept, fewer walls</span>
            </div>
            <div>
              <span className="font-medium">Detached House:</span>
              <span className="ml-2">Full baseline timing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Breakdown */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Duration Breakdown</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Base Duration:</span>
            <span className="ml-2">{Math.round(durationInfo.calculated.baseDuration / 60 * 10) / 10}h</span>
          </div>
          <div>
            <span className="font-medium">Room Time:</span>
            <span className="ml-2">{Math.round(durationInfo.calculated.roomTime / 60 * 10) / 10}h</span>
          </div>
          <div>
            <span className="font-medium">Add-on Time:</span>
            <span className="ml-2">{Math.round(durationInfo.calculated.addonTime / 60 * 10) / 10}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyTypeDurationExample; 