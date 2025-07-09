# Weekly Payout Balance System

## Overview
The weekly payout balance system tracks and manages bubblers' earnings on a weekly basis, providing both bubblers and admins with real-time payout information.

## Features

### For Bubblers
- **Weekly Payout Balance**: Real-time display of current week's pending payout amount
- **Earnings Dashboard**: Comprehensive breakdown of total, weekly, monthly, and average earnings
- **Payout History**: Complete history of past payouts with status tracking
- **Job Breakdown**: Detailed view of jobs contributing to current week's payout

### For Admins
- **Bubbler Overview**: Weekly payout balance for each bubbler in the bubblers table
- **Individual Profiles**: Detailed payout information in bubbler profile modals
- **Payout Management**: Tools to create and manage payout records

## Database Schema

### Payouts Table
```sql
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  job_ids UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

### Job Assignments Table (Enhanced)
The existing `job_assignments` table is used to calculate payouts based on completed jobs.

## API Functions

### `getWeeklyPayoutBalance(bubblerId)`
Calculates the current week's payout balance for a specific bubbler.

**Returns:**
```javascript
{
  weeklyPayout: number,
  jobCount: number,
  weekStart: string,
  jobBreakdown: Array<{
    jobId: string,
    orderId: string,
    serviceType: string,
    tier: string,
    addons: string[],
    payout: number,
    completedAt: string
  }>
}
```

### `getAllBubblersWeeklyPayouts()`
Fetches weekly payout data for all bubblers.

**Returns:**
```javascript
Array<{
  id: string,
  name: string,
  email: string,
  role: string,
  weeklyPayout: number,
  jobCount: number
}>
```

### `getPayoutHistory(bubblerId, limit)`
Retrieves payout history for a specific bubbler.

### `createPayoutRecord(bubblerId, amount, periodStart, periodEnd, jobIds)`
Creates a new payout record.

### `updatePayoutStatus(payoutId, status, processedAt)`
Updates the status of a payout record.

## Payout Calculation Logic

### Weekly Period
- Week starts on Monday at 00:00:00
- Week ends on Sunday at 23:59:59
- Only completed jobs within the current week are included

### Payout Rules
Based on service type, tier, and addons:

**Mobile Car Wash:**
- Express Wash: $12
- Signature Shine: $18
- Supreme Shine: $25
- Tire Shine Addon: $4

**Home Cleaning:**
- Refresh Clean: $20
- Signature Deep Clean: $30
- Supreme Deep Clean: $45

**Laundry Service:**
- Fresh & Fold: $15
- Signature Care: $25
- Supreme Care: $35

## UI Components

### Bubbler Dashboard
- Weekly payout balance card in stats grid
- Quick access to earnings page

### Earnings Page
- Weekly payout balance highlight
- Earnings overview cards
- Payout history table
- Weekly job breakdown

### Admin Bubblers Table
- Weekly payout column showing amount and job count
- Enhanced bubbler profile modal with payout statistics

## Payout Status Flow

1. **Pending**: Initial status when payout is created
2. **Processing**: When payout is being processed
3. **Paid**: When payout has been successfully sent
4. **Cancelled**: If payout is cancelled for any reason

## Future Enhancements

### Planned Features
- **Automatic Payout Processing**: Scheduled weekly payouts
- **Payout Notifications**: Email/SMS notifications for payout status changes
- **Payout Reports**: Detailed reports for accounting and tax purposes
- **Multiple Payment Methods**: Support for different payment providers
- **Payout Thresholds**: Minimum payout amounts before processing

### Integration Points
- **Stripe Integration**: For actual payment processing
- **Accounting Software**: Export functionality for bookkeeping
- **Tax Reporting**: Year-end tax document generation

## Security Considerations

- All payout calculations are server-side
- Payout records are immutable once created
- Status changes are logged and auditable
- Access controls ensure only authorized users can view payout data

## Performance Notes

- Weekly payout calculations are cached and updated on job completion
- Bulk operations for admin views are optimized
- Database indexes on frequently queried fields
- Pagination for large payout history lists 