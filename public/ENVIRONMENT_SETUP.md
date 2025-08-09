# Environment Setup Guide

## Overview
This project now uses a centralized configuration system that reads from environment variables instead of hardcoded values. This improves security and makes deployment easier.

## Required Environment Variables

### Client-Side (NEXT_PUBLIC_*)
These variables are exposed to the browser and should be set in your deployment platform:

- `NEXT_PUBLIC_BASE_URL`: Your application's base URL (defaults to https://www.gogobubblesclean.com)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Server-Side Only
These variables are never exposed to the client:

- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

## Setting Up Environment Variables

### Local Development
1. Copy `env.example` to `.env.local`
2. Fill in your actual values
3. Restart your development server

### Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each required variable:
   - `NEXT_PUBLIC_BASE_URL` = https://www.gogobubblesclean.com
   - `NEXT_PUBLIC_SUPABASE_URL` = https://your-project-id.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your-anon-key
   - `SUPABASE_SERVICE_ROLE_KEY` = your-service-role-key (Server only)
4. Redeploy your application

### Other Platforms
Set the same environment variables in your deployment platform's configuration.

## Supabase Configuration

### Auth Redirect URLs
In your Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Set Site URL to: https://www.gogobubblesclean.com
3. Add redirect URLs for your auth flows (e.g., /auth/callback, /dashboard)

## Security Notes

- **Never commit `.env` files** with real secrets to version control
- The `SUPABASE_SERVICE_ROLE_KEY` should only be used in server-side code
- Client-side code only uses the anonymous key, which is safe to expose
- Row Level Security (RLS) policies remain your main protection for data access

## Troubleshooting

If you see "Missing env vars" errors:
1. Check that all required environment variables are set
2. Verify the variable names match exactly (case-sensitive)
3. Restart your development server after adding new variables
4. For production, redeploy after setting environment variables
