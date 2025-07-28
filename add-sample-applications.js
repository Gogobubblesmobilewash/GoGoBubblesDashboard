// Sample script to add test applications to Supabase
// Run this in your browser console on the Vercel deployment

const sampleApplications = [
  {
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, USA",
    role_applied_for: "Sparkle",
    application_status: "pending",
    travel_radius_minutes: 30,
    authorized_to_work: true,
    age_verified: true,
    has_transportation: true,
    primary_language: "English",
    english_comfort: "Fluent",
    experience: "2 years cleaning experience",
    availability: "Weekdays 9AM-5PM",
    has_mop: true,
    has_toilet_brush: true,
    has_all_purpose_cleaner: true,
    has_glass_cleaner: true,
    has_bathroom_cleaner: true,
    has_broom_dustpan: true,
    has_cloths: true,
    has_vacuum: false,
    willing_to_rent_equipment: true,
    created_at: new Date().toISOString()
  },
  {
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "555-987-6543",
    address: "456 Oak Ave, Somewhere, USA",
    role_applied_for: "Fresh",
    application_status: "pending",
    travel_radius_minutes: 45,
    authorized_to_work: true,
    age_verified: true,
    has_transportation: true,
    primary_language: "English",
    english_comfort: "Conversational",
    experience: "1 year laundry experience",
    availability: "Weekends 10AM-6PM",
    created_at: new Date().toISOString()
  },
  {
    first_name: "Mike",
    last_name: "Davis",
    email: "mike.davis@example.com",
    phone: "555-456-7890",
    address: "789 Pine St, Elsewhere, USA",
    role_applied_for: "Shine",
    application_status: "pending",
    travel_radius_minutes: 60,
    authorized_to_work: true,
    age_verified: true,
    has_transportation: true,
    primary_language: "English",
    english_comfort: "Fluent",
    experience: "3 years car washing experience",
    availability: "Flexible schedule",
    has_bucket: true,
    has_towels: true,
    has_soap: true,
    created_at: new Date().toISOString()
  }
];

// Function to add applications (run this in browser console)
async function addSampleApplications() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    
    const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('applications')
      .insert(sampleApplications);
    
    if (error) {
      console.error('Error adding applications:', error);
      alert('Error adding applications: ' + error.message);
    } else {
      console.log('Sample applications added successfully!');
      alert('Sample applications added successfully! Refresh the page to see them.');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error: ' + err.message);
  }
}

// Instructions for use:
console.log('To add sample applications:');
console.log('1. Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual values');
console.log('2. Run: addSampleApplications()'); 