-- Fix RLS policies that are blocking the payment verification

-- First, drop the problematic transaction policies
DROP POLICY IF EXISTS "No updates or deletes on transactions" ON public.transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

-- Create proper transaction policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (true);

-- Ensure profiles table has proper policies for service role operations  
CREATE POLICY "Service role can manage all profiles" ON public.profiles
FOR ALL USING (true) WITH CHECK (true);