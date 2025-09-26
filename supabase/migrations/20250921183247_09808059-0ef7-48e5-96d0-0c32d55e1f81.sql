-- PHASE 1: Fix Critical Data Exposure Issues

-- 1. Remove public profile access policies that expose all user financial data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Clean up duplicate profile policies - keep only the most restrictive ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;

-- Keep only the comprehensive policy for profiles
-- The "Users can manage their profile" policy already covers all operations securely

-- 3. Fix games table policy to prevent financial data exposure
DROP POLICY IF EXISTS "Users can read open games or own games" ON public.games;

-- Create more secure games policy - users can only see:
-- - Games they created
-- - Games they joined (through game_players table)
CREATE POLICY "Users can view games they participate in" ON public.games
FOR SELECT USING (
  creator_id = auth.uid() OR 
  id IN (
    SELECT game_id 
    FROM public.game_players 
    WHERE player_id = auth.uid()
  )
);

-- 4. Enhance payment verification security by updating verify-payment function to require user authorization
-- This will be handled in the Edge Function update