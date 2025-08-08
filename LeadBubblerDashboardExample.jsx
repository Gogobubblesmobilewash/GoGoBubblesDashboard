import React, { useState, useEffect } from 'react';
import { 
  generateLeadDashboard, 
  handleBubblerSelection, 
  updateLeadStatus,
  validateCheckIn,
  PRIORITY_TIERS,
  PROXIMITY_RULES 
} from './lead_bubbler_dashboard_logic.js';

/**
 * Lead Bubbler Dashboard Component
 * Example implementation of the dynamic, priority-based, proximity-filtered dashboard
 */
const LeadBubblerDashboard = ({ leadId, leadServiceType, currentLocation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('available_oversight');
  const [selectedBubbler, setSelectedBubbler] = useState(null);
  const [showOutOfRange, setShowOutOfRange] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);

  // Mock data - in real implementation, this would come from your API
  const mockBubblers = [
    {
      id: 'b1',
      name: 'Ashley',
      serviceType: 'home_cleaning',
      location: { lat: 29.7604, lng: -95.3698 }, // Houston
      complaints: 0,
      averageRating: 4.8,
      redosCount: 0,
      timeLag: 0,
      jobReassignments: 0,
      jobsCompleted: 15,
      checkInOverdue: false,
      mildWarnings: 0,
      requestedHelp: false,
      equipmentRequest: false
    },
    {
      id: 'b2',
      name: 'Brittany',
      serviceType: 'home_cleaning',
      location: { lat: 29.7604, lng: -95.3698 },
      complaints: 1,
      averageRating: 4.1,
      redosCount: 2,
      timeLag: 45,
      jobReassignments: 0,
      jobsCompleted: 8,
      checkInOverdue: true,
      mildWarnings: 1,
      requestedHelp: false,
      equipmentRequest: false
    },
    {
      id: 'b3',
      name: 'Keith',
      serviceType: 'home_cleaning',
      location: { lat: 29.7604, lng: -95.3698 },
      complaints: 0,
      averageRating: 4.9,
      redosCount: 0,
      timeLag: 0,
      jobReassignments: 0,
      jobsCompleted: 25,
      checkInOverdue: false,
      mildWarnings: 0,
      requestedHelp: true,
      equipmentRequest: false
    }
  ];

  // Generate dashboard data
  useEffect(() => {
    if (currentLocation) {
      const data = generateLeadDashboard({
        leadId,
        leadLocation: currentLocation,
        leadServiceType,
        allBubblers: mockBubblers,
        showOutOfRange,
        adminOverride
      });
      setDashboardData(data);
    }
  }, [leadId, currentLocation, leadServiceType, showOutOfRange, adminOverride]);

  // Handle bubbler selection
  const handleBubblerClick = (bubbler) => {
    const selection = handleBubblerSelection({
      bubblerId: bubbler.id,
      leadId,
      leadLocation: currentLocation,
      bubblerLocation: bubbler.location,
      adminOverride
    });

    if (selection.success) {
      setSelectedBubbler(bubbler);
      setCurrentStatus('en_route');
      
      // Update status
      const newStatus = updateLeadStatus({
        leadId,
        currentStatus,
        action: 'bubbler_selected',
        timestamp: new Date().toISOString(),
        location: currentLocation
      });
      setCurrentStatus(newStatus.status);
      
      if (selection.warning) {
        alert(selection.warning);
      }
    } else {
      alert(selection.message);
    }
  };

  // Handle check-in completion
  const handleCheckInComplete = (checkInData) => {
    const validation = validateCheckIn({
      leadId,
      bubblerId: selectedBubbler.id,
      ...checkInData
    });

    if (validation.isValid) {
      // Submit check-in data to API
      console.log('Check-in completed:', validation.checkInData);
      
      // Update status
      const newStatus = updateLeadStatus({
        leadId,
        currentStatus,
        action: 'check_in_completed',
        timestamp: new Date().toISOString(),
        location: currentLocation
      });
      setCurrentStatus(newStatus.status);
      
      setSelectedBubbler(null);
    } else {
      alert('Validation errors: ' + validation.errors.join(', '));
    }
  };

  if (!dashboardData) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="lead-bubbler-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Lead Bubbler Dashboard</h1>
        <div className="status-badge">
          Status: <span className={`status-${currentStatus}`}>{currentStatus}</span>
        </div>
        <div className="controls">
          <label>
            <input 
              type="checkbox" 
              checked={showOutOfRange}
              onChange={(e) => setShowOutOfRange(e.target.checked)}
            />
            Show Out of Range
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={adminOverride}
              onChange={(e) => setAdminOverride(e.target.checked)}
            />
            Admin Override
          </label>
        </div>
      </div>

      {/* Smart Prompts */}
      {dashboardData.smartPrompts.length > 0 && (
        <div className="smart-prompts">
          {dashboardData.smartPrompts.map((prompt, index) => (
            <div key={index} className={`prompt prompt-${prompt.type}`}>
              {prompt.message}
            </div>
          ))}
        </div>
      )}

      {/* Priority Summary */}
      <div className="priority-summary">
        <h3>Priority Summary</h3>
        <div className="summary-grid">
          <div className="summary-item critical">
            🔴 Critical: {dashboardData.prioritySummary.critical}
          </div>
          <div className="summary-item high">
            🟠 High: {dashboardData.prioritySummary.high}
          </div>
          <div className="summary-item routine">
            🟢 Routine: {dashboardData.prioritySummary.routine}
          </div>
          <div className="summary-item assistance">
            🔵 Assistance: {dashboardData.prioritySummary.assistance}
          </div>
        </div>
      </div>

      {/* Bubbler List by Priority */}
      <div className="bubbler-sections">
        {Object.entries(dashboardData.groupedBubblers).map(([priority, bubblers]) => (
          <div key={priority} className="priority-section">
            <h3 style={{ color: PRIORITY_TIERS[priority]?.color }}>
              {PRIORITY_TIERS[priority]?.name} ({bubblers.length})
            </h3>
            <div className="bubbler-grid">
              {bubblers.map((bubbler) => (
                <div 
                  key={bubbler.id} 
                  className={`bubbler-card ${bubbler.proximityRule === PROXIMITY_RULES.FAR ? 'far-distance' : ''}`}
                  onClick={() => handleBubblerClick(bubbler)}
                >
                  <div className="bubbler-header">
                    <h4>{bubbler.name}</h4>
                    <span className="distance">{bubbler.distance.toFixed(1)} mi</span>
                  </div>
                  <div className="bubbler-details">
                    <div>Rating: {bubbler.averageRating}</div>
                    <div>Jobs: {bubbler.jobsCompleted}</div>
                    {bubbler.complaints > 0 && (
                      <div className="warning">⚠️ {bubbler.complaints} complaint(s)</div>
                    )}
                    {bubbler.requestedHelp && (
                      <div className="assistance">🔵 Requested help</div>
                    )}
                  </div>
                  {bubbler.proximityRule === PROXIMITY_RULES.MEDIUM && (
                    <div className="proximity-warning">
                      ⚠️ {bubbler.proximityRule.message}
                    </div>
                  )}
                  {bubbler.requiresAdminApproval && (
                    <div className="admin-required">
                      🚫 Admin approval required
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Check-in Modal */}
      {selectedBubbler && (
        <div className="check-in-modal">
          <div className="modal-content">
            <h3>Check-in: {selectedBubbler.name}</h3>
            <CheckInForm 
              bubbler={selectedBubbler}
              onComplete={handleCheckInComplete}
              onCancel={() => setSelectedBubbler(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Check-in Form Component
 */
const CheckInForm = ({ bubbler, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    checkInType: '',
    notes: '',
    rating: '',
    duration: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Check-in Type:</label>
        <select 
          value={formData.checkInType}
          onChange={(e) => setFormData({...formData, checkInType: e.target.value})}
          required
        >
          <option value="">Select type...</option>
          <option value="quality_check">Quality Check</option>
          <option value="coaching">Coaching</option>
          <option value="assistance">Assistance</option>
          <option value="equipment_delivery">Equipment Delivery</option>
        </select>
      </div>

      <div className="form-group">
        <label>Notes (min 10 characters):</label>
        <textarea 
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          required
          minLength={10}
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Rating (1-5):</label>
        <input 
          type="number"
          min="1"
          max="5"
          value={formData.rating}
          onChange={(e) => setFormData({...formData, rating: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Duration (minutes):</label>
        <input 
          type="number"
          min="1"
          max="120"
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: e.target.value})}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit">Complete Check-in</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default LeadBubblerDashboard; 