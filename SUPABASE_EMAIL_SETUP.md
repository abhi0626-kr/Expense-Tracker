# Supabase Email Confirmation Setup

## Overview
Your app now uses Supabase's built-in email confirmation system. This is much more reliable than custom OTP implementations.

## How It Works
1. User signs up with email and password
2. Supabase automatically sends a confirmation email
3. User clicks the link in the email
4. Account is verified and user can sign in

## Setup Steps

### 1. Enable Email Confirmations in Supabase
1. Go to your Supabase project: https://supabase.com/dashboard/project/rkkvplagwdvlmymmdjkz
2. Navigate to **Authentication** → **Providers** → **Email**
3. Make sure **"Enable email confirmations"** is checked
4. Set **"Confirm email"** to **ON**

### 2. Customize Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Select **"Confirm signup"**
3. Customize the email template:
   - Add your branding
   - Customize the message
   - The `{{ .ConfirmationURL }}` will be automatically replaced with the confirmation link

### 3. Configure SMTP (For Production)
By default, Supabase sends emails from their server, but they limit free tier emails.

For production, set up custom SMTP:
1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enter your SMTP provider details:
   - **Sender email**: Your email (e.g., noreply@yourdomain.com)
   - **Sender name**: Your app name
   - **Host**: SMTP server (e.g., smtp.gmail.com for Gmail)
   - **Port**: Usually 587 for TLS
   - **Username**: Your email username
   - **Password**: Your email password or app password

#### Recommended SMTP Providers:
- **SendGrid** (Free: 100 emails/day)
- **Mailgun** (Free: 5,000 emails/month)
- **Amazon SES** (Pay as you go, very cheap)
- **Gmail** (Free but limited, requires app password)

### 4. Test the Flow
1. Try signing up with a new email
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. Try signing in with your credentials

## Email Template Variables
You can use these in your custom email templates:
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

## Troubleshooting

### Emails not arriving?
- Check your spam folder
- Verify email confirmations are enabled in Supabase settings
- For Gmail, enable "Less secure app access" or use an app password
- Consider using a dedicated email service (SendGrid, Mailgun)

### Confirmation link not working?
- Check that `emailRedirectTo` URL is correct in your code
- Make sure the URL is in your Supabase allowed redirect URLs
- Go to **Authentication** → **URL Configuration** and add your domain

### Users can't sign in after confirmation?
- Make sure they're using the correct email and password
- Check if account is confirmed in **Authentication** → **Users** in Supabase dashboard

## Current Configuration
- Confirmation emails are sent automatically by Supabase
- Redirect URL: Your app's home page (`${window.location.origin}/`)
- No custom SMTP configured yet (using Supabase's default)

## Next Steps
1. Enable email confirmations in Supabase (if not already enabled)
2. Test with a real email address
3. Set up custom SMTP for production
4. Customize email templates with your branding
