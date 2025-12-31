# Expense Tracker (React + TypeScript + Supabase)

A modern expense tracker built with React 18, Vite, TypeScript, Tailwind (shadcn/ui), and Supabase for auth and data. Includes charts, accounts, transactions, exports, and Google OAuth. 

## Tech Stack
- React 18 + Vite 5 (TypeScript)
- Tailwind CSS + shadcn/ui components
- Supabase (Auth, Postgres, Row Level Security)
- Recharts for visualizations


## Features
- **Authentication**
  - Email/Password auth + Google OAuth
  - Optional email confirmation (via SMTP) or CAPTCHA-only signup
  - Secure session handling with Supabase JS v2
  - Email verification with OTP
  - Profile management with avatar upload

- **Transaction Management**
  - Create, view, and delete transactions
  - Clickable transaction items showing full details (date, time, account, amount, type)
  - Smart transfer grouping - Transfer In/Out transactions displayed as single unified entries
  - Transfer details show "From" and "To" accounts clearly
  - Export transactions to CSV or PDF
  - Search and filter by type and category
  - Receipt scanning with OCR (using Python API)

- **Account Management**
  - Multiple account support (Checking, Savings, Credit, etc.)
  - Account balances and transfers between accounts
  - Edit and delete accounts
  - Automatic default accounts for new users
  - Color-coded account cards

- **Budgets & Alerts**
  - Set category-based budgets
  - Real-time budget alerts (warning & exceeded)
  - Visual budget progress indicators

- **Investments**
  - Track investment portfolios
  - Monitor gains/losses
  - Investment performance charts

- **Analytics & Visualizations**
  - Spending charts by category
  - Spending trend analysis
  - Category trend charts
  - Weekly and monthly comparison charts
  - Currency converter integration

- **Additional Features**
  - Recurring transactions
  - Dark/Light theme toggle
  - Mobile-responsive design
  - Onboarding tour for new users
  - Import/Export data
  - Confirmation dialog for sign out

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
- Transfer transactions are automatically paired and displayed as single entries in the UI for better clarity
- Transaction details can be viewed by clicking on any transaction item
- For Supabase Edge Functions (if you use them): VS Code may warn about Deno imports.
  The repo contains `supabase/functions/deno.json` and `.vscode/settings.json` to enable Deno language features.
- Receipt Scanner API runs on Python/Flask (see `receipt-scanner-api/README.md` for setup)

## Project Structure
```
Expense-Tracker/
├── src/
│   ├── components/       # React components
│   │   ├── Dashboard.tsx
│   │   ├── TransactionList.tsx  # Shows recent transactions with click-to-view details
│   │   ├── AddTransaction.tsx
│   │   ├── AccountCard.tsx
│   │   └── ...
│   ├── pages/           # Route pages
│   │   ├── TransactionHistory.tsx  # Full transaction list with unified transfers
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useExpenseData.tsx
│   │   ├── useBudgets.tsx
│   │   └── ...
│   ├── utils/           # Utility functions
│   └── integrations/    # Supabase client
├── receipt-scanner-api/ # Python Flask API for OCR
└── supabase/           # Supabase migrations and functions
```

## Common Issues & Fixes
- **Google OAuth not working**:
  - Check browser console for error messages
  - Verify Google provider is enabled in Supabase Dashboard → Auth → Providers → Google
  - Ensure Client ID and Client Secret are correctly configured in Supabase
  - Verify redirect URI in Google Cloud Console: `https://rkkvplagwdvlmymmdjkz.supabase.co/auth/v1/callback`
  - Add your local development URL (`http://localhost:5173`) to Authorized JavaScript origins in Google Cloud Console
  - See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed setup instructions
  
- CAPTCHA error `sitekey-secret-mismatch`:
  - Ensure `.env` `VITE_HCAPTCHA_SITE_KEY` matches the "Site Key" in hCaptcha dashboard
  - Ensure Supabase Attack Protection has the matching "Secret" from hCaptcha
  
- Email not received:
  - Check spam; verify SMTP is configured; or disable "Confirm email"
  
- Error creating default accounts (ON CONFLICT):
  - Fixed: we now check for existing accounts and only insert once
  
- Transfer transactions showing as duplicates:
  - Fixed: Transfer In/Out pairs are now grouped and shown as single entries
  
- Receipt scanner not working:
  - Ensure Python API is running (`cd receipt-scanner-api && python app.py`)
  - Check that all required Python packages are installed (`pip install -r requirements.txt`)

## Key Features Explained

### Transaction Details View
Click any transaction to see:
- Full amount with proper formatting
- Transaction type (Income/Expense/Transfer)
- Account name (or From/To accounts for transfers)
- Date and time of transaction
- Complete description

### Unified Transfer Display
- Transfer In and Transfer Out transactions are automatically paired
- Displayed as a single item: "Transfer: From Account → To Account"
- Shows the transfer amount once (not duplicated)
- Deleting a transfer removes both sides automatically
- Transfer details dialog shows both source and destination accounts

### Sign Out Confirmation
- Confirmation dialog appears when clicking the Sign Out button
- Prevents accidental logouts
- Clear "Cancel" and "Sign Out" options

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
