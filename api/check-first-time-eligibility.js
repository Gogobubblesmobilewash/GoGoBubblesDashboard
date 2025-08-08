// API endpoint for checking first-time customer eligibility
// This would typically be a serverless function or API route

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // Check if customer has any previous orders
    let query = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }

    // Exclude cancelled and refunded orders
    query = query.not('status', 'in', ['cancelled', 'refunded']);

    const { count, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Customer is first-time if they have no previous orders
    const isFirstTime = count === 0;

    return res.status(200).json({ 
      eligible: isFirstTime,
      previousOrders: count || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 