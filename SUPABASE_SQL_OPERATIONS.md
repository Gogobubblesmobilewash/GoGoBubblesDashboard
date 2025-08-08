# 🗄️ Supabase SQL Operations - Complete Database Setup

## 📋 Overview
This file contains all SQL operations extracted from:
- `booking.html` - Customer booking form
- Dashboard components (React/JSX)
- `jobs.html` - Job application form
- `feedback.html` - Customer feedback
- API services

## 🏗️ Database Tables Required

### 1. **orders** Table
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  services JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  promo_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  service_type TEXT,
  tier TEXT,
  addons JSONB
);
```

### 2. **applications** Table
```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_applied_for TEXT NOT NULL,
  application_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  experience_years INTEGER,
  spanish_proficiency TEXT,
  english_communication TEXT,
  experience_description TEXT,
  hygiene_certification BOOLEAN,
  equipment_owned JSONB,
  supplies_owned JSONB,
  experience_details JSONB,
  availability JSONB,
  travel_preferences JSONB,
  elite_requirements JSONB
);
```

### 3. **bubblers** Table
```sql
CREATE TABLE bubblers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  home_location TEXT,
  preferred_travel_minutes INTEGER,
  preferred_travel_type TEXT,
  travel_badge TEXT,
  device_binding TEXT,
  first_name TEXT,
  last_name TEXT,
  average_rating DECIMAL(3,2),
  on_time_arrival DECIMAL(5,2),
  quality_check_fails INTEGER DEFAULT 0,
  photo_compliance DECIMAL(5,2),
  jobs_completed INTEGER DEFAULT 0,
  opt_out_status BOOLEAN DEFAULT false
);
```

### 4. **messages** Table
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES bubblers(id),
  recipient_id UUID REFERENCES bubblers(id),
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments JSONB
);
```

### 5. **job_assignments** Table
```sql
CREATE TABLE job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  bubbler_id UUID REFERENCES bubblers(id),
  status TEXT DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  payout_amount DECIMAL(10,2),
  notes TEXT,
  photos JSONB,
  quality_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. **job_checklist** Table
```sql
CREATE TABLE job_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_assignments(id),
  task_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES bubblers(id),
  photos JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. **payouts** Table
```sql
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bubbler_id UUID REFERENCES bubblers(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  job_ids JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. **equipment** Table
```sql
CREATE TABLE equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item TEXT NOT NULL,
  serial_number TEXT,
  condition TEXT,
  status TEXT DEFAULT 'available',
  assigned_to UUID REFERENCES bubblers(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. **activity_log** Table
```sql
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES bubblers(id),
  event_type TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. **device_fingerprints** Table
```sql
CREATE TABLE device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bubbler_id UUID REFERENCES bubblers(id),
  device_hash TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. **perk_tracker** Table
```sql
CREATE TABLE perk_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  perk_type TEXT NOT NULL,
  order_total DECIMAL(10,2),
  promo_code TEXT,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 SQL Operations by File

### **booking.html Operations**

#### **Insert Order**
```javascript
// From booking.html line 2130-2132
const { data, error } = await supabase
  .from('orders')
  .insert([orderData]);
```

#### **Order Data Structure**
```javascript
const orderData = {
  name,
  phone,
  email,
  address,
  notes: notes + (notes ? " " : "") + generateBubblerNotes(),
  services: JSON.stringify(servicesData),
  subtotal: totalSubtotal,
  tax: tax,
  deposit: deposit,
  balance: balance,
  total: totalSubtotal + tax,
  promo_code: state.promo ? state.promo.code : null,
  created_at: new Date().toISOString()
};
```

### **jobs.html Operations**

#### **Insert Application**
```javascript
// From jobs.html line 1146-1148
const { data, error } = await supabase
  .from('applications')
  .insert([applicationData]);
```

#### **Application Data Structure**
```javascript
const applicationData = {
  first_name: formData.get('firstName'),
  last_name: formData.get('lastName'),
  email: formData.get('email'),
  phone: formData.get('phone'),
  role_applied_for: formData.get('role'),
  experience_years: parseInt(formData.get('experienceYears')),
  spanish_proficiency: formData.get('spanishProficiency'),
  english_communication: formData.get('englishCommunication'),
  experience_description: formData.get('experienceDescription'),
  hygiene_certification: formData.get('hygieneCertification') === 'yes',
  equipment_owned: equipmentArray,
  supplies_owned: suppliesArray,
  experience_details: experienceArray,
  availability: availabilityArray,
  travel_preferences: travelArray,
  elite_requirements: eliteArray
};
```

### **Dashboard Operations**

#### **AuthContext.jsx**
```javascript
// Get bubbler profile
const { data, error } = await supabase
  .from('bubblers')
  .select('*')
  .eq('email', user.email)
  .single();

// Get session
const { data: { session }, error } = await supabase.auth.getSession();

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Sign out
const { error } = await supabase.auth.signOut();
```

#### **Orders.jsx**
```javascript
// Get all orders
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });

// Count orders
const { count: previousOrders } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true });

// Update order status
const { error } = await supabase
  .from('orders')
  .update({
    status: newStatus,
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId);
```

#### **Messages.jsx**
```javascript
// Get messages
let query = supabase
  .from('messages')
  .select(`
    *,
    sender:bubblers!messages_sender_id_fkey(name, email),
    recipient:bubblers!messages_recipient_id_fkey(name, email)
  `)
  .order('created_at', { ascending: false });

// Insert message
const { data, error } = await supabase
  .from('messages')
  .insert({
    sender_id: currentUser.id,
    recipient_id: recipientId,
    subject,
    content: message
  });

// Update read status
await supabase
  .from('messages')
  .update({ read: true, read_at: new Date().toISOString() })
  .eq('id', messageId);
```

#### **JobChecklist.jsx**
```javascript
// Get job checklist
const { data, error } = await supabase
  .from('job_checklist')
  .select(`
    *,
    job_assignments!inner(
      orders!inner(service_type, tier, addons)
    )
  `)
  .eq('job_assignments.bubbler_id', currentUser.id);

// Update task completion
const { error } = await supabase
  .from('job_checklist')
  .update(updateData)
  .eq('id', taskId);
```

#### **SupportDashboard.jsx**
```javascript
// Get orders
const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('id, customer_name, service_type, status, created_at, scheduled_date, customer_phone, customer_email');

// Get applications
const { data: applicants, error: applicantsError } = await supabase
  .from('applications')
  .select('id, first_name, last_name, email, phone, role_applied_for, application_status, created_at, experience_years');

// Get bubblers
const { data: bubblers, error: bubblersError } = await supabase
  .from('bubblers')
  .select('id, first_name, last_name, email, role, is_active, phone, created_at');

// Get equipment
const { data: equipment, error: equipmentError } = await supabase
  .from('equipment')
  .select('id, item, serial_number, condition, status, notes, created_at');
```

#### **Equipment.jsx**
```javascript
// Get equipment
const { data, error } = await supabase.from('equipment').select();

// Update equipment status
const response = await supabase
  .from('equipment')
  .update({ status: 'deleted' })
  .eq('id', id);

// Assign equipment
const response = await supabase
  .from('equipment')
  .update({ assignedTo: assigningEquipment.assignedTo })
  .eq('id', assigningEquipment.id);
```

### **API Services Operations**

#### **api.js**
```javascript
// Get payout history
const { data: payouts, error } = await supabase
  .from(viewName)
  .select('*')
  .eq('bubbler_id', bubblerId)
  .order('created_at', { ascending: false })
  .limit(limit);

// Get job assignments
const { data: jobs, error } = await supabase
  .from('job_assignments')
  .select(`
    *,
    orders!inner(
      service_type,
      tier,
      addons,
      status
    )
  `)
  .eq('bubbler_id', bubblerId)
  .eq('orders.status', 'completed')
  .gte('created_at', weekStart.toISOString());

// Create payout record
const { data, error } = await supabase
  .from('payouts')
  .insert([{
    bubbler_id: bubblerId,
    amount: amount,
    period_start: periodStart,
    period_end: periodEnd,
    job_ids: jobIds
  }]);

// Update payout status
const { data, error } = await supabase
  .from('payouts')
  .update(updateData)
  .eq('id', payoutId);

// Get bubblers with travel preferences
const { data, error } = await supabase
  .from('bubblers')
  .select('id, name, email, phone, home_location, preferred_travel_minutes, preferred_travel_type, is_active, travel_badge');
```

#### **activityLogger.js**
```javascript
// Log activity
const { data, error } = await supabase
  .from('activity_log')
  .insert({
    user_id: userId,
    event_type: eventType,
    description: description,
    priority: priority,
    metadata: metadata
  });

// Get activity log
let query = supabase
  .from('activity_log')
  .select(`
    *,
    bubblers!inner(name, email, role)
  `)
  .order('created_at', { ascending: false });

// Get activity metrics
const { data, error } = await supabase
  .from('activity_log')
  .select('event_type, priority, created_at')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());
```

#### **deviceBinding.js**
```javascript
// Validate device binding
const { data, error } = await supabase.rpc('validate_device_binding', {
  p_bubbler_id: bubblerId,
  p_device_hash: deviceHash
});

// Check device fingerprint
const { data, error } = await supabase
  .from('device_fingerprints')
  .select('id')
  .eq('bubbler_id', bubblerId)
  .eq('device_hash', deviceHash)
  .single();

// Get bubbler device binding
const { data, error } = await supabase
  .from('bubblers')
  .select('device_binding')
  .eq('id', bubblerId)
  .single();
```

## 🔧 Database Functions (RPC)

### **calculate_job_progress**
```sql
CREATE OR REPLACE FUNCTION calculate_job_progress(job_id UUID)
RETURNS TABLE(
  total_tasks INTEGER,
  completed_tasks INTEGER,
  progress_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tasks,
    COUNT(*) FILTER (WHERE completed = true)::INTEGER as completed_tasks,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
      2
    ) as progress_percentage
  FROM job_checklist
  WHERE job_id = $1;
END;
$$ LANGUAGE plpgsql;
```

### **create_progress_snapshot**
```sql
CREATE OR REPLACE FUNCTION create_progress_snapshot(job_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO job_progress_snapshots (job_id, progress_percentage, snapshot_time)
  SELECT 
    job_id,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
      2
    ),
    NOW()
  FROM job_checklist
  WHERE job_id = $1;
END;
$$ LANGUAGE plpgsql;
```

### **validate_device_binding**
```sql
CREATE OR REPLACE FUNCTION validate_device_binding(p_bubbler_id UUID, p_device_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  device_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO device_count
  FROM device_fingerprints
  WHERE bubbler_id = p_bubbler_id AND device_hash = p_device_hash;
  
  RETURN device_count > 0;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Views

### **bubbler_safe_payments_view**
```sql
CREATE VIEW bubbler_safe_payments_view AS
SELECT 
  ja.id as job_id,
  ja.bubbler_id,
  ja.payout_amount,
  ja.completed_at,
  ja.created_at,
  o.service_type,
  o.tier
FROM job_assignments ja
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.status = 'completed';
```

### **safe_payment_view**
```sql
CREATE VIEW safe_payment_view AS
SELECT 
  ja.id as job_id,
  ja.bubbler_id,
  ja.payout_amount,
  ja.completed_at,
  ja.created_at,
  o.service_type,
  o.tier,
  o.customer_name,
  o.customer_phone
FROM job_assignments ja
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.status = 'completed';
```

## 🔐 Row Level Security (RLS)

### **Enable RLS on Tables**
```sql
-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubblers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE perk_tracker ENABLE ROW LEVEL SECURITY;
```

### **RLS Policies**
```sql
-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_email);

-- Applications: Only admins can view applications
CREATE POLICY "Admins can view applications" ON applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Bubblers: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON bubblers
  FOR SELECT USING (id = auth.uid());

-- Messages: Users can only see messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );
```

## 🚀 Setup Instructions

1. **Create all tables** using the SQL above
2. **Create database functions** for RPC calls
3. **Create views** for safe data access
4. **Enable RLS** on all tables
5. **Create RLS policies** for security
6. **Set up authentication** in Supabase dashboard
7. **Configure environment variables** in your app

## 📝 Environment Variables Required

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This completes the full database setup for your GoGoBubbles application! 🎉 