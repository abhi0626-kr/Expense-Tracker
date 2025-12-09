# Supabase Migration Instructions

## Database Setup Required

The Investment Tracker and Receipt Scanner features require new database tables. You need to run the SQL migrations on your Supabase project.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run each of these migration files in order:

### Migration 1: Create Investments Table
```sql
-- Copy contents from: supabase/migrations/20251209000001_create_investments_table.sql
```

### Migration 2: Create Receipts Table
```sql
-- Copy contents from: supabase/migrations/20251209000002_create_receipts_table.sql
```

### Migration 3: Create Receipts Storage Bucket
```sql
-- Copy contents from: supabase/migrations/20251209000003_create_receipts_bucket.sql
```

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref rkkvplagwdvlmymmdjkz

# Push migrations
supabase db push
```

## Verifying Setup

After running migrations, verify in Supabase Dashboard:
1. Go to **Table Editor** - you should see `investments` and `receipts` tables
2. Go to **Storage** - you should see a `receipts` bucket

## Manual Storage Bucket Creation

If the bucket doesn't auto-create:
1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `receipts`
4. Public bucket: **Yes**
5. File size limit: `5MB`
6. Allowed MIME types: `image/jpeg, image/png, image/jpg, image/webp`

## Notes

- The app will now work with local fallbacks if storage isn't configured
- Investment tracking will show an error until migrations are run
- Receipt scanning will process images locally if storage isn't available
