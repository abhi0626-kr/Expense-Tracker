-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories table
CREATE POLICY "Users can view their own categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Insert default categories for expense
INSERT INTO public.categories (user_id, name, type)
SELECT 
  auth.uid(),
  name,
  'expense'
FROM (VALUES 
  ('Food & Dining'),
  ('Transportation'),
  ('Shopping'),
  ('Entertainment'),
  ('Bills & Utilities'),
  ('Healthcare'),
  ('Travel'),
  ('Education'),
  ('Other')
) AS defaults(name)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Insert default categories for income
INSERT INTO public.categories (user_id, name, type)
SELECT 
  auth.uid(),
  name,
  'income'
FROM (VALUES 
  ('Salary'),
  ('Business'),
  ('Investment'),
  ('Other')
) AS defaults(name)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name, type) DO NOTHING;
