# Environment Setup for Stripe Tipping System

## 🚨 **CRITICAL: Missing Stripe Configuration**

The tipping system requires Stripe API keys to function. Currently, the system is **NOT configured** for Stripe payments.

## 🔧 **Required Environment Variables**

Create a `.env` file in your root directory with these variables:

```bash
# =====================================================
# REQUIRED FOR TIPPING SYSTEM
# =====================================================

# Stripe Configuration (CRITICAL)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=https://gogobubbles.com

# =====================================================
# EXISTING SUPABASE CONFIG
# =====================================================

VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# =====================================================
# OPTIONAL EMAIL CONFIG
# =====================================================

EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## 🔑 **How to Get Stripe Keys**

### **Step 1: Create Stripe Account**
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

### **Step 2: Get API Keys**
1. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret Key** (starts with `sk_test_` for testing)
3. Copy your **Publishable Key** (starts with `pk_test_` for testing)

### **Step 3: Test Mode vs Live Mode**
- **Test Mode**: Use `sk_test_` and `pk_test_` keys (safe for development)
- **Live Mode**: Use `sk_live_` and `pk_live_` keys (for production)

## 📦 **Install Stripe Dependency**

The Stripe dependency has been added to `package.json`. Run:

```bash
npm install
```

## 🧪 **Test the Tipping System**

### **Step 1: Set up test environment**
```bash
# Copy example and fill in your keys
cp .env.example .env
# Edit .env with your actual Stripe keys
```

### **Step 2: Test tip creation**
```bash
# Start your development server
npm run dev

# Test the API endpoint
curl -X POST http://localhost:3000/api/create-tip-session \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "orderId": "test", "bubblerId": "test"}'
```

### **Step 3: Test complete flow**
1. Go to feedback form: `http://localhost:3000/feedback.html`
2. Click stars to trigger tip section
3. Click tip button
4. Should redirect to Stripe checkout

## 🚨 **Current Status**

### **❌ What's Missing:**
- Stripe API keys not configured
- Environment variables not set
- Stripe dependency not installed

### **✅ What's Ready:**
- Tip API endpoint created (`/api/create-tip-session`)
- Frontend tip buttons implemented
- Database structure for tips (optional)
- Success/cancel URL handling

## 🔧 **Quick Setup Commands**

```bash
# 1. Install Stripe dependency
npm install stripe

# 2. Create environment file
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" > .env
echo "NEXT_PUBLIC_BASE_URL=https://gogobubbles.com" >> .env

# 3. Add your actual Stripe keys to .env
# Edit .env file with your real Stripe keys

# 4. Test the system
npm run dev
```

## 🎯 **Expected Behavior After Setup**

### **Working Flow:**
1. Customer clicks tip button → API creates Stripe session
2. Customer redirected to Stripe → Enters payment details
3. Payment processed → Customer redirected back with success
4. Success message shown → Customer can submit feedback

### **Error Handling:**
- If Stripe keys missing → API returns 500 error
- If payment fails → Customer returns with error
- If network issues → Customer sees error message

## 🔐 **Security Notes**

### **⚠️ Important Security Rules:**
- **NEVER** commit `.env` file to git
- **NEVER** expose `STRIPE_SECRET_KEY` in frontend code
- **ALWAYS** use test keys for development
- **ALWAYS** validate payment amounts server-side

### **Environment File Structure:**
```
your-project/
├── .env                    # ← Create this file (NEVER commit)
├── .env.example           # ← Safe to commit (template)
├── package.json           # ← Stripe dependency added
└── api/
    └── create-tip-session.js  # ← Uses STRIPE_SECRET_KEY
```

## 🚀 **Production Deployment**

### **For Vercel:**
1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Add all required variables
4. Deploy with environment variables

### **For Other Platforms:**
- Add environment variables in your hosting platform
- Ensure `STRIPE_SECRET_KEY` is set
- Test with small amounts first

## 📞 **Support**

If you need help setting up Stripe:
1. Check Stripe documentation: https://stripe.com/docs
2. Verify your API keys are correct
3. Test with Stripe's test card numbers
4. Check browser console for errors

---

**Status**: ⚠️ **CONFIGURATION REQUIRED** - Stripe keys needed for tipping to work 