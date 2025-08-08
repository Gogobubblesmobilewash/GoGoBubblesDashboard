import Stripe from 'stripe';

// Check if Stripe key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not configured!');
  console.error('Please add STRIPE_SECRET_KEY to your environment variables.');
  console.error('See ENVIRONMENT_SETUP.md for instructions.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ 
      error: 'Stripe not configured. Please add STRIPE_SECRET_KEY to environment variables.',
      details: 'See ENVIRONMENT_SETUP.md for setup instructions'
    });
  }

  try {
    const { amount, orderId, bubblerId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid tip amount' });
    }

    // Validate amount is reasonable
    if (amount > 1000) {
      return res.status(400).json({ error: 'Tip amount too high' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for GoGoBubbles Bubbler`,
              description: 'Thank you for your service!',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        order_id: orderId || '',
        bubbler_id: bubblerId || '',
        tip_amount: amount.toString(),
        payment_type: 'tip',
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gogobubbles.com'}/feedback.html?order_id=${orderId || ''}&bubbler_id=${bubblerId || ''}&tip_success=true&tip_amount=${amount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gogobubbles.com'}/feedback.html?order_id=${orderId || ''}&bubbler_id=${bubblerId || ''}`,
      customer_email: req.body.customerEmail || undefined,
    });

    console.log('✅ Tip session created:', {
      sessionId: session.id,
      amount: amount,
      orderId: orderId,
      bubblerId: bubblerId
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('❌ Error creating tip session:', error);
    
    // Provide helpful error messages
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Stripe authentication failed. Please check your API keys.',
        details: 'Verify STRIPE_SECRET_KEY is correct'
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request to Stripe.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create tip session',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 