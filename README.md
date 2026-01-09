# 💰 Expense Tracker

A modern, full-featured expense tracking application built with React 18, TypeScript, and Supabase. Track your finances, manage multiple accounts, set budgets, monitor investments, and gain insights through powerful analytics.

## ✨ Tech Stack
- **Frontend**: React 18 + Vite 5 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Backend**: Supabase (Authentication, PostgreSQL, Row Level Security)
- **Charts**: Recharts for data visualizations
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack React Query
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **Email**: EmailJS integration
- **Security**: hCaptcha protection


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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account ([supabase.com](https://supabase.com))
- (Optional) Google OAuth credentials
- (Optional) hCaptcha account for CAPTCHA protection

### 1) Clone and Install
```powershell
# Clone the repository
git clone <your-repo-url>
cd Expense-Tracker

# Install dependencies
npm install
```

### 2) Environment Setup
Create a `.env` file in the project root with the following variables:
```dotenv
# Supabase Configuration (Required)
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# hCaptcha (Optional - only if Attack Protection is enabled)
VITE_HCAPTCHA_SITE_KEY="your-hcaptcha-site-key"
```

### 3) Database Setup
Run the Supabase migrations to set up your database schema:
```powershell
# Initialize Supabase CLI (if not already done)
npx supabase init

# Link to your project
npx supabase link --project-ref your-project-id

# Push migrations
npx supabase db push
```
See [MIGRATION_SETUP.md](MIGRATION_SETUP.md) for detailed migration instructions.

### 4) Run the Application
```powershell
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
The app will start on `http://localhost:5173` (or another port if 5173 is in use).

## ⚙️ Configuration

### Supabase Setup

#### Auth Providers
**Email/Password Authentication:**
- Navigate to: Supabase Dashboard → Authentication → Providers → Email
- Enable Email provider
- **Email Confirmation** (Recommended): Enable "Confirm email" and configure SMTP (see below)
- **Without Email Confirmation**: Disable "Confirm email" for testing/development

**Google OAuth:**
- See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for complete setup instructions
- Navigate to: Supabase Dashboard → Authentication → Providers → Google
- Set Client ID and Client Secret from Google Cloud Console
- Configure authorized redirect URIs

#### Email Configuration
Choose one of the following methods for email functionality:

1. **Supabase SMTP** (Recommended for production)
   - See [SUPABASE_EMAIL_SETUP.md](SUPABASE_EMAIL_SETUP.md) for detailed instructions
   📚 Additional Documentation

This project includes several detailed setup guides:

- **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)** - Complete Google OAuth configuration
- **[SUPABASE_EMAIL_SETUP.md](SUPABASE_EMAIL_SETUP.md)** - Supabase SMTP email setup
- **[EMAILJS_SETUP.md](EMAILJS_SETUP.md)** - EmailJS integration guide
- **[EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)** - General email configuration
- **[EMAIL_LOGO_SETUP.md](EMAIL_LOGO_SETUP.md)** - Custom email logo setup
- **[MIGRATION_SETUP.md](MIGRATION_SETUP.md)** - Database migration instructions
- **[ONBOARDING_TOUR_GUIDE.md](ONBOARDING_TOUR_GUIDE.md)** - User onboarding implementation

## 💻 Development Notes

### Default Accounts
- Default accounts (Checking, Savings, Credit) are automatically created on first login
- Logic implemented in `src/hooks/useExpenseData.tsx`
- Duplicate prevention: checks for existing accounts before insertion

### Transfer Transactions
- Transfer In/Out pairs are automatically grouped in the UI
- Displayed as single unified entries for better clarity
- Deleting a transfer removes both sides automatically
- Shows clear "From → To" account flow

### Transaction Details
- Click any transaction to view full details
- Shows date, time, amount, type, account, and description
- Smart formatting based on transaction type

### Code Organization
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
- **Hooks**: Custom React hooks for data and state management
- **Utils**: Utility functions and helpers
- **Integrations**: External service integrations (Supabase)

### Supabase Edge Functions
- VS Code configured for Deno imports (see `.vscode/settings.json`)
- Functions located in `supabase/functions/`
- Use `deno.json` for Deno-specific configuration
#### CAPTCHA Protection (Optional)
- Navigate to: Settings → Authentication → Attack Protection
- Enable Captcha protection: ON
- Provider: hCaptcha
- Add your hCaptcha Secret in Supabase Dashboard
- Set `VITE_HCAPTCHA_SITE_KEY` in your `.env` file
- For development without CAPTCHA, set this to OFF

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
📜 Available Scripts

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with dev mode settings)
npm run build:dev

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues & Troubleshooting

For detailed troubleshooting, see the "Common Issues & Fixes" section above. If you encounter issues not covered in the documentation:

1. Check Supabase logs: Dashboard → Logs
2. Review browser console for client-side errors
3. Verify all environment variables are correctly set
4. Ensure Supabase migrations are up to date
5. Check that all required Supabase policies are in place

## 📄 License

This project is for educational and demonstration purposes. Feel free to use it as a template for your own projects. If you intend to distribute or use commercially, please add an appropriate licens
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
