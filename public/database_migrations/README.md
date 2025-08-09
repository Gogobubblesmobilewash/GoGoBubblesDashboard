# Database Migrations for GoGoBubbles Dashboard

This directory contains SQL migration files for the GoGoBubbles dashboard database.

## Migration Files

### 1. `lead_bubbler_feedback_tables.sql` - Lead/Bubbler Feedback System

This migration implements the feedback system between leads and bubblers as specified in the requirements.

#### Tables Created

**`bubbler_feedback`** - Internal feedback from bubblers about leads
- `id` - Unique identifier
- `bubbler_id` - Reference to the bubbler submitting feedback
- `lead_id` - Reference to the lead being reviewed
- `feedback` - Text feedback content
- `is_anonymous` - Whether feedback is submitted anonymously
- `created_at` / `updated_at` - Timestamps

**`lead_bubbler_review`** - Performance reviews of leads by staff
- `id` - Unique identifier
- `lead_id` - Reference to the lead being reviewed
- `reviewer_id` - Reference to the staff member writing the review
- `review_text` - Detailed review content
- `rating` - 1-5 star rating
- `review_date` - Date of the review
- `created_at` / `updated_at` - Timestamps

#### RPC Functions

**`get_bubbler_feedback_for_current_lead()`**
- Allows leads to view anonymous feedback about themselves
- Maintains author anonymity through RPC function
- Returns only feedback content and metadata (no author info)

**`get_my_earnings_breakdown()`**
- Provides bubblers with their earnings breakdown
- Returns base pay and tips amounts separately
- Only shows completed jobs

#### Row Level Security (RLS) Policies

**Bubbler Feedback:**
- Bubblers can insert their own feedback
- Bubblers can view their own feedback
- Staff (admin/support/leader) can view all feedback
- Leads access feedback via RPC function (anonymous)

**Lead Reviews:**
- Staff can insert and view all reviews
- Leads can only view reviews about themselves
- Bubblers have no access to lead reviews

#### How to Apply

1. Connect to your Supabase database
2. Run the SQL migration:
   ```sql
   \i database_migrations/lead_bubbler_feedback_tables.sql
   ```

#### Frontend Integration

The dashboard already includes the Lead Feedback tab with:
- **Bubbler Feedback Sub-tab**: For bubblers to submit feedback and leads to view anonymous feedback
- **Lead Reviews Sub-tab**: For staff to manage lead performance reviews

#### Usage Examples

**Bubbler submitting feedback:**
```javascript
// Submit anonymous feedback about a lead
const { error } = await supabase
  .from('bubbler_feedback')
  .insert({
    bubbler_id: currentBubblerId,
    lead_id: 'lead-uuid',
    feedback: 'Great communication and clear instructions',
    is_anonymous: true
  })
```

**Lead viewing feedback:**
```javascript
// Get anonymous feedback about themselves
const { data, error } = await supabase
  .rpc('get_bubbler_feedback_for_current_lead')
```

**Staff adding lead review:**
```javascript
// Add performance review for a lead
const { error } = await supabase
  .from('lead_bubbler_review')
  .insert({
    lead_id: 'lead-uuid',
    reviewer_id: currentBubblerId,
    review_text: 'Excellent leadership and communication skills',
    rating: 5,
    review_date: '2024-01-15'
  })
```

## Security Features

- **Row Level Security (RLS)** ensures users only see data they're authorized to access
- **RPC functions** provide controlled access to sensitive data
- **Anonymous feedback** protects bubbler identities while allowing honest feedback
- **Role-based access** restricts functionality based on user permissions

## Performance Considerations

- Indexes on frequently queried columns (bubbler_id, lead_id, dates)
- Efficient RPC functions with proper joins
- RLS policies optimized for common query patterns

## Next Steps

After applying this migration:
1. Test the feedback submission functionality
2. Verify RLS policies work correctly
3. Test the RPC functions with different user roles
4. Monitor performance and adjust indexes if needed
