# GoGoBubbles Bubbler Dashboard

A React-based dashboard for GoGoBubbles service providers (bubblers) to manage jobs, equipment, messages, and view earnings.

## 🚀 Recent Updates (Supabase & Dashboard)

### 1. Auth/RLS Foundations
- **Bubblers Table**: Added `bubblers.user_id` (FK → `auth.users.id`)
- **RLS Policies**: Implemented proper Row Level Security policies
  - Self-read: `bubblers.user_id = auth.uid()`
  - Admin/Support/Leader read-all via `user_roles`
  - Helper function: `public.current_bubbler_id()` returns current user's `bubblers.id`

### 2. Messages System
- **Schema**: `messages.bubbler_id`, `recipient_group` (admin/support), `is_read`, `read_at`
- **RLS**: Sender OR staff in matching group can SELECT, INSERT with `current_bubbler_id()`
- **Frontend**: Compose messages to Admin/Support, inbox with read state

### 3. Equipment Management
- **Filtering**: Bubblers see only `equipment.status = 'available'` OR assigned to them
- **Requests**: Equipment request flow via `equipment_requests` table
- **UI**: Available Equipment + My Gear tabs with request functionality

### 4. Job Assignments
- **RLS**: `job_assignments.bubbler_id = current_bubbler_id()`
- **Status Management**: Accept/Decline buttons for offered jobs
- **Columns**: `status`, `responded_at` with proper state transitions

### 5. Ratings System
- **RLS**: Ratings where joined `job_assignments.bubbler_id = current_bubbler_id()`
- **Frontend**: My Ratings tab showing stars + feedback + job details

### 6. Earnings Breakdown
- **RPC Function**: `get_my_earnings_breakdown()` returns base vs tips
- **Frontend**: Base Pay + Tips display with total calculation

### 7. Error Handling & DX
- **RLS Error Detection**: Special handling for policy violations
- **Console Logging**: Session + query status logging for debugging
- **Visible Errors**: No infinite loading, clear error messages

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Icons**: Lucide React
- **State Management**: React Hooks

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── Auth.jsx          # Authentication component
│   ├── dashboard/
│   │   └── Dashboard.jsx     # Main dashboard with all tabs
│   └── shared/
│       ├── ErrorBoundary.jsx # React error boundary
│       ├── ErrorMessage.jsx  # Enhanced error display
│       └── LoadingSpinner.jsx # Loading states
├── lib/
│   └── supabase.js          # Supabase client + helpers
├── App.jsx                  # Main app component
└── main.jsx                # Entry point
```

## 🔐 Authentication & RLS

### RLS Policies Implemented

1. **Bubblers Table**
   ```sql
   -- Self-read policy
   CREATE POLICY "Users can view own bubbler record" ON bubblers
   FOR SELECT USING (user_id = auth.uid());
   
   -- Admin/Support/Leader read-all
   CREATE POLICY "Staff can view all bubblers" ON bubblers
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM user_roles 
       WHERE user_id = auth.uid() 
       AND role IN ('admin', 'support', 'leader')
     )
   );
   ```

2. **Messages Table**
   ```sql
   -- SELECT: sender OR staff in matching group
   CREATE POLICY "Users can view own messages or staff messages" ON messages
   FOR SELECT USING (
     bubbler_id = current_bubbler_id() OR
     EXISTS (
       SELECT 1 FROM user_roles 
       WHERE user_id = auth.uid() 
       AND role IN ('admin', 'support')
     )
   );
   
   -- INSERT: bubbler_id = current_bubbler_id()
   CREATE POLICY "Users can insert own messages" ON messages
   FOR INSERT WITH CHECK (bubbler_id = current_bubbler_id());
   ```

3. **Equipment Table**
   ```sql
   -- Bubblers see available OR assigned to them
   CREATE POLICY "Bubblers see available or assigned equipment" ON equipment
   FOR SELECT USING (
     status = 'available' OR 
     assigned_bubbler_id = current_bubbler_id()
   );
   ```

4. **Job Assignments Table**
   ```sql
   -- Bubblers see own assignments
   CREATE POLICY "Users see own job assignments" ON job_assignments
   FOR SELECT USING (bubbler_id = current_bubbler_id());
   ```

5. **Ratings Table**
   ```sql
   -- Bubblers see ratings for their completed jobs
   CREATE POLICY "Users see ratings for own jobs" ON ratings
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM job_assignments 
       WHERE job_assignments.id = ratings.job_assignment_id
       AND job_assignments.bubbler_id = current_bubbler_id()
     )
   );
   ```

### Helper Functions

- `public.current_bubbler_id()`: Returns current user's bubbler ID
- `get_my_earnings_breakdown()`: Returns base_amount and tips_amount

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bubbler-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Build & Deploy

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform**
   ```bash
   # Example for Vercel
   vercel --prod
   
   # Example for Netlify
   netlify deploy --prod
   ```

## 🔧 Configuration

### Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Schema**
   - Run the SQL scripts from `supabase/migrations/` folder
   - Enable RLS on all tables
   - Create the policies listed above

3. **Authentication**
   - Configure Auth settings in Supabase dashboard
   - Set redirect URLs to match your domain
   - Enable email confirmation if required

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
VITE_APP_NAME=GoGoBubbles Dashboard
VITE_APP_VERSION=1.0.0
```

## 📱 Features

### Dashboard Tabs

1. **Daily Jobs**
   - View assigned jobs with status
   - Accept/Decline offered jobs
   - Job details (location, date, pay)

2. **Equipment**
   - Available equipment with request button
   - My Gear (currently assigned)
   - Equipment request flow

3. **Messages**
   - Compose messages to Admin/Support
   - Inbox with read/unread states
   - Message history

4. **My Ratings**
   - Customer ratings (1-5 stars)
   - Feedback text
   - Job context and dates

5. **Earnings**
   - Base pay breakdown
   - Tips breakdown
   - Total earnings calculation

## 🐛 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check user authentication status
   - Verify user has proper role in `user_roles` table
   - Ensure `current_bubbler_id()` function exists

2. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs match your domain
   - Check browser console for auth errors

3. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Verify RLS policies are enabled

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true')
```

This will show detailed console logs for:
- Session initialization
- Database queries
- RLS policy results
- Error details

## 🔒 Security

- **Row Level Security (RLS)**: All data access controlled by policies
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control
- **Data Isolation**: Users can only access their own data
- **Input Validation**: Client and server-side validation

## 📈 Performance

- **Lazy Loading**: Components load only when needed
- **Optimistic Updates**: UI updates immediately, syncs with backend
- **Error Boundaries**: Graceful error handling
- **Loading States**: Clear feedback during operations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary to GoGoBubbles. All rights reserved.

## 🆘 Support

For technical support:
- Email: tech@gogobubbles.com
- Dashboard: Use Messages tab to contact Admin/Support
- Documentation: Check this README and inline code comments

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Production Ready ✅
