# Google OAuth Setup Guide

## Step 1: Configure Google Cloud Console

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **Expense Tracker**
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue

### 2. Create OAuth 2.0 Client ID
- Application type: **Web application**
- Name: **Expense Tracker Web**
- Authorized JavaScript origins:
  - `http://localhost:5173` (for development)
  - `https://your-production-domain.com` (for production)
- Authorized redirect URIs:
  - `https://rkkvplagwdvlmymmdjkz.supabase.co/auth/v1/callback`
  
Click **CREATE** and copy your:
- Client ID
- Client Secret

## Step 2: Configure Supabase

### 1. Add Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rkkvplagwdvlmymmdjkz/auth/providers)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Enable Google provider
5. Enter your Google credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Click **Save**

### 2. Configure Redirect URLs (if needed)
1. Go to **Authentication** → **URL Configuration**
2. Verify these URLs are listed:
   - Site URL: `http://localhost:5173` or your production URL
   - Redirect URLs: Add `http://localhost:5173/auth`

## Step 3: Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/auth`

3. Click **"Continue with Google"** or **"Sign up with Google"**

4. You should see Google's OAuth consent screen

5. After authorizing, you'll be redirected back to your app and automatically signed in

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://rkkvplagwdvlmymmdjkz.supabase.co/auth/v1/callback`

### Error: "Invalid client"
- Double-check Client ID and Client Secret in Supabase dashboard
- Make sure you copied them correctly from Google Cloud Console

### OAuth screen not showing
- Check browser console for errors
- Verify Google provider is enabled in Supabase
- Check that your Google project's OAuth consent screen is published

### Users not being created
- Check Supabase Dashboard → Authentication → Users
- Look for any error messages in browser console
- Verify Supabase project is not paused (free tier limitation)

## Benefits of Google OAuth

✅ **No email verification needed** - Google handles identity verification
✅ **Faster sign-up** - One-click authentication
✅ **More secure** - Google's authentication infrastructure
✅ **Better UX** - Users don't need to remember another password
✅ **Mobile-friendly** - Works seamlessly on mobile devices

## Current Configuration

- **Project ID**: `rkkvplagwdvlmymmdjkz`
- **Supabase URL**: `https://rkkvplagwdvlmymmdjkz.supabase.co`
- **Redirect URI for Google**: `https://rkkvplagwdvlmymmdjkz.supabase.co/auth/v1/callback`
