-- Drop the old constraint that doesn't allow 'transfer'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint that allows 'income', 'expense', and 'transfer'
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'transfer'));