# EmailJS Setup Guide

EmailJS allows you to send emails directly from the frontend without a backend server - perfect for GitHub Pages!

## Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Click "Sign Up" (free account available)
3. Verify your email address

## Step 2: Add Email Service

1. Go to https://dashboard.emailjs.com/admin
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (easiest)
   - Outlook
   - Yahoo
   - Custom SMTP
4. Follow the connection wizard
5. Copy your **Service ID** (e.g., `service_abc123`)

## Step 3: Create Email Template

1. Go to https://dashboard.emailjs.com/admin/templates
2. Click "Create New Template"
3. Use this template content:

**Subject:**
```
Verify Your Email - Expense Tracker
```

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Expense Tracker</h1>
      <p>Verify Your Email Address</p>
    </div>
    <div class="content">
      <p>Hi {{to_name}},</p>
      <p>Thanks for signing up! Please use the verification code below to complete your registration:</p>
      
      <div class="code-box">
        <div class="code">{{verification_code}}</div>
      </div>
      
      <p><strong>This code will expire in 10 minutes.</strong></p>
      <p>If you didn't request this code, please ignore this email.</p>
      <p>Need help? Reply to this email.</p>
    </div>
    <div class="footer">
      <p>© 2025 {{app_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

4. Click "Save"
5. Copy your **Template ID** (e.g., `template_xyz789`)

## Step 4: Get Your Public Key

1. Go to https://dashboard.emailjs.com/admin/account
2. Find "API Keys" section
3. Copy your **Public Key** (e.g., `user_abcdefg123456`)

## Step 5: Configure Your App

Add these to your `.env` file:

```env
VITE_EMAILJS_SERVICE_ID="service_abc123"
VITE_EMAILJS_TEMPLATE_ID="template_xyz789"
VITE_EMAILJS_PUBLIC_KEY="user_abcdefg123456"
```

## Step 6: Add to GitHub Secrets (for deployment)

1. Go to your GitHub repository settings
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

## Template Variables Used

The email template expects these variables (automatically provided):
- `{{to_email}}` - Recipient's email address
- `{{to_name}}` - Recipient's name (derived from email)
- `{{verification_code}}` - The 6-digit code
- `{{app_name}}` - Your app name ("Expense Tracker")

## Testing

1. Start your dev server: `npm run dev`
2. Try signing up with your email
3. Check your inbox (and spam folder) for the verification code
4. Enter the code to complete signup

## Troubleshooting

### Emails not arriving?
- Check your spam/junk folder
- Verify Service ID, Template ID, and Public Key are correct
- Check EmailJS dashboard for send history and errors
- Make sure your email service is connected properly
- Gmail users: may need to enable "Less secure app access"

### "EmailJS not configured" error?
- Make sure `.env` file has all three EmailJS variables
- Restart your dev server after adding env variables

### Rate limits?
- Free tier: 200 emails/month
- For production: upgrade to paid plan or use multiple services

## Free Tier Limits

EmailJS free tier includes:
- ✅ 200 emails per month
- ✅ 2 email services
- ✅ 2 email templates
- ✅ Basic email tracking

For higher volume, consider:
- Upgrade to paid plan ($7-15/month for 500-2000 emails)
- Use multiple EmailJS accounts
- Implement rate limiting on your end

## Security Notes

- ✅ Public Key is safe to commit (it's meant to be public)
- ✅ Service and Template IDs can be public
- ❌ Never expose your Private Key (not used in frontend)
- ✅ EmailJS has built-in rate limiting
- ✅ CAPTCHA protects against spam signups
