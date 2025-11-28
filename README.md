# Expense Tracker (React + TypeScript + Supabase)

A modern expense tracker built with React 18, Vite, TypeScript, Tailwind (shadcn/ui), and Supabase for auth and data. Includes charts, accounts, transactions, exports, and Google OAuth. 

## Tech Stack
- React 18 + Vite 5 (TypeScript)
- Tailwind CSS + shadcn/ui components
- Supabase (Auth, Postgres, Row Level Security)
- Recharts for visualizations

## Features
- Email/Password auth + Google OAuth
- Optional email confirmation (via SMTP) or CAPTCHA-only signup
- Secure session handling with Supabase JS v2
- Accounts, transactions, summaries and charts
- Automatic default accounts for new users

## Getting Started

### 1) Install dependencies
```powershell
npm install
```

### 2) Environment variables
Create `.env` in the project root (already present) and set:
```dotenv
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"

# Only if CAPTCHA is enabled in Supabase (Attack Protection)
VITE_HCAPTCHA_SITE_KEY="<your-hcaptcha-site-key>"
```

### 3) Run the app
```powershell
npm run dev
```
The app starts on the Vite dev server.

## Supabase Configuration

### Auth Providers
- Email/Password: Settings → Auth → Providers → Email
  - If you want email confirmation: enable "Confirm email" and configure SMTP
  - If you do NOT want email confirmation: disable "Confirm email"
- Google OAuth: Settings → Auth → Providers → Google (set client id/secret)

### SMTP (optional but recommended for confirmations)
Settings → Project Settings → Authentication → SMTP Settings:
- Host: e.g. `smtp.gmail.com` (Port `587`)
- Username: your sender email
- Password: app password/API key from your provider
- Sender email/name: what recipients see

### CAPTCHA (hCaptcha)
Settings → Auth → Attack Protection:
- Enable Captcha protection = ON
- Provider = hCaptcha
- Paste your hCaptcha Secret in Supabase, and set `VITE_HCAPTCHA_SITE_KEY` in `.env`
- If you prefer not to use CAPTCHA, turn it OFF

## Development Notes
- Default accounts are created on first login in `src/hooks/useExpenseData.tsx`.
  We avoid ON CONFLICT errors by checking for existing accounts before insert.
- For Supabase Edge Functions (if you use them): VS Code may warn about Deno imports.
  The repo contains `supabase/functions/deno.json` and `.vscode/settings.json` to enable Deno language features.

## Common Issues & Fixes
- CAPTCHA error `sitekey-secret-mismatch`:
  - Ensure `.env` `VITE_HCAPTCHA_SITE_KEY` matches the "Site Key" in hCaptcha dashboard
  - Ensure Supabase Attack Protection has the matching "Secret" from hCaptcha
- Email not received:
  - Check spam; verify SMTP is configured; or disable "Confirm email"
- Error creating default accounts (ON CONFLICT):
  - Fixed: we now check for existing accounts and only insert once

## Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

## License
This project is for learning/demo purposes. Add your preferred license if you intend to distribute.
