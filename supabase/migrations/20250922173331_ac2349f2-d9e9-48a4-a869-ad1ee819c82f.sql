-- Create table to track completed payments for polling
CREATE TABLE IF NOT EXISTS public.payment_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  amount_credited numeric(10,2) NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- No RLS needed - this is handled by service role only
ALTER TABLE public.payment_completions DISABLE ROW LEVEL SECURITY;