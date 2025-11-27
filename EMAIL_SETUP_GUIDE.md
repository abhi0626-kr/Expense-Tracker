# Supabase Email Setup Guide

## Issue: Not receiving magic link emails

### Solution Steps:

#### 1. Check Supabase Dashboard Settings
Go to: https://supabase.com/dashboard/project/rkkvplagwdvlmymmdjkz/auth/templates

**Authentication → Email Templates:**
- ✅ Enable "Confirm signup" template
- ✅ Check the email content looks correct
- ✅ Make sure "From" email is set

**Authentication → Providers:**
- ✅ Email provider should be **ENABLED**
- ✅ "Confirm email" should be **ENABLED** or **DISABLED** depending on your preference

**Authentication → URL Configuration:**
- Site URL: `http://localhost:5173` (for dev) or your production URL
- Redirect URLs: Add `http://localhost:5173/auth` and your production URL

#### 2. Check Email Delivery Settings
Go to: https://supabase.com/dashboard/project/rkkvplagwdvlmymmdjkz/settings/auth

**SMTP Settings:**
- If using custom SMTP, verify credentials
- If using default Supabase emails, check rate limits

#### 3. Disable Email Confirmation (Quick Fix for Testing)
If you want to test without email verification:

**In Supabase Dashboard:**
1. Go to Authentication → Providers → Email
2. Toggle OFF "Confirm email"
3. Users can sign up without email verification

**Then update your Auth.tsx code to skip the email step**

#### 4. Check Spam Folder
- Supabase emails often land in spam
- Check spam/junk folder
- Add noreply@mail.app.supabase.io to contacts

#### 5. Alternative: Use OAuth Instead
Add Google or GitHub sign-in:
- No email verification needed
- Faster user experience
- More reliable

## Testing Email Delivery

You can test if emails are working by:
1. Sign up with a test email
2. Check Supabase Dashboard → Authentication → Users
3. Look for the user - if created, auth is working
4. Check Supabase logs for email delivery errors

## Current Configuration
- Project ID: `rkkvplagwdvlmymmdjkz`
- Auth URL: `https://rkkvplagwdvlmymmdjkz.supabase.co`
