-- Add time column to transactions table
ALTER TABLE public.transactions ADD COLUMN time TIME;

-- Update existing transactions to set a default time (00:00:00)
UPDATE public.transactions SET time = '00:00:00'::TIME WHERE time IS NULL;

-- Make the time column NOT NULL
ALTER TABLE public.transactions ALTER COLUMN time SET NOT NULL;
