#!/usr/bin/env node

/**
 * Test Stripe Setup
 * 
 * This script tests if your Stripe configuration is working correctly.
 * Run this after setting up your environment variables.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Stripe Configuration...\n');

// Check if Stripe key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not configured!');
  console.error('Please add STRIPE_SECRET_KEY to your .env file');
  console.error('See ENVIRONMENT_SETUP.md for instructions');
  process.exit(1);
}

// Check if key looks valid
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  console.error('❌ Invalid STRIPE_SECRET_KEY format!');
  console.error('Key should start with sk_test_ or sk_live_');
  process.exit(1);
}

console.log('✅ STRIPE_SECRET_KEY is configured');
console.log(`📝 Key type: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    console.log('\n🔗 Testing Stripe connection...');
    
    // Test basic connection by fetching account info
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe connection successful');
    console.log(`📧 Account: ${account.email}`);
    console.log(`🌍 Country: ${account.country}`);
    
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
    process.exit(1);
  }
}

async function testCheckoutSession() {
  try {
    console.log('\n💳 Testing checkout session creation...');
    
    // Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Tip',
              description: 'Test tip for GoGoBubbles',
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        order_id: 'test-order-123',
        bubbler_id: 'test-bubbler-456',
        tip_amount: '5',
        payment_type: 'tip',
      },
      success_url: 'https://gogobubbles.com/test-success',
      cancel_url: 'https://gogobubbles.com/test-cancel',
    });
    
    console.log('✅ Checkout session created successfully');
    console.log(`🆔 Session ID: ${session.id}`);
    console.log(`🔗 Checkout URL: ${session.url}`);
    
    return session;
    
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error.message);
    process.exit(1);
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔧 Checking environment variables...');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  const optionalVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  console.log('\nRequired variables:');
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? '***configured***' : process.env[varName]}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  }
  
  console.log('\nOptional variables:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? '***configured***' : process.env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: NOT SET (optional)`);
    }
  }
}

async function runTests() {
  try {
    await testEnvironmentVariables();
    await testStripeConnection();
    await testCheckoutSession();
    
    console.log('\n🎉 All tests passed! Your Stripe setup is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test the tipping flow on your feedback form');
    console.log('3. Use Stripe test card numbers for testing');
    console.log('   - Test card: 4242 4242 4242 4242');
    console.log('   - Any future date, any CVC');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 