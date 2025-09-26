-- Create table for platform revenue tracking
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stripe_fee', 'platform_commission', 'game_commission')),
  amount NUMERIC(10,2) NOT NULL,
  source_transaction_id UUID,
  game_id UUID,
  user_id UUID,
  stripe_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on platform_revenue
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- Only admins can access platform revenue data
CREATE POLICY "Only admins can access platform revenue" 
ON public.platform_revenue 
FOR ALL 
USING (false);  -- No one can access by default

-- Add platform_revenue reference to ledger for tracking
ALTER TABLE public.ledger 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC(10,2) DEFAULT 0.00;

-- Create function to prevent direct balance manipulation
CREATE OR REPLACE FUNCTION public.prevent_balance_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow balance updates only through specific RPC functions
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    -- Check if the session context includes a valid operation flag
    IF current_setting('app.operation_type', true) NOT IN ('deposit', 'game_transaction', 'winnings') THEN
      RAISE EXCEPTION 'Direct balance modifications are not allowed. Use proper functions.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS prevent_balance_manipulation_trigger ON public.profiles;
CREATE TRIGGER prevent_balance_manipulation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_balance_manipulation();

-- Enhance the deposit_credit function to be more secure
CREATE OR REPLACE FUNCTION public.deposit_credit(user_id_param uuid, amount_param numeric, stripe_charge_id_param text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_fee NUMERIC(10,2);
  net_amount NUMERIC(10,2);
BEGIN
  -- Validate amount
  IF amount_param <= 0 THEN
    RETURN JSON_BUILD_OBJECT('error', 'Amount must be positive');
  END IF;
  
  -- Calculate Stripe fee (2.9% + $0.30)
  stripe_fee := (amount_param * 0.029) + 0.30;
  net_amount := amount_param - stripe_fee;
  
  -- Set operation context for trigger
  PERFORM set_config('app.operation_type', 'deposit', true);
  
  -- Add credit to user's balance
  UPDATE public.profiles 
  SET balance = balance + net_amount,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Add ledger entry for user deposit
  INSERT INTO public.ledger (user_id, amount, type, created_at)
  VALUES (user_id_param, net_amount, 'deposit', now());
  
  -- Track platform revenue (Stripe fee)
  INSERT INTO public.platform_revenue (
    transaction_type, 
    amount, 
    user_id, 
    stripe_charge_id,
    created_at
  ) VALUES (
    'stripe_fee', 
    stripe_fee, 
    user_id_param, 
    stripe_charge_id_param,
    now()
  );
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT(
    'success', true, 
    'net_amount', net_amount,
    'stripe_fee', stripe_fee
  );
END;
$$;

-- Update the create_game function to be more secure
CREATE OR REPLACE FUNCTION public.create_game(game_mode text, stake_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_game_id BIGINT;
  user_profile RECORD;
BEGIN
  -- Validate stake amount
  IF stake_amount <= 0 THEN
    RETURN JSON_BUILD_OBJECT('error', 'Stake must be positive');
  END IF;
  
  -- Check if user has enough balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'User profile not found');
  END IF;
  
  IF user_profile.balance < stake_amount THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Validate game mode
  IF game_mode NOT IN ('1v1', '2v2', '3v3', '4v4', '5v5') THEN
    RETURN JSON_BUILD_OBJECT('error', 'Invalid game mode');
  END IF;
  
  -- Create the game
  INSERT INTO public.games (creator_id, mode, stake, status, created_at)
  VALUES (auth.uid(), game_mode, stake_amount, 'waiting', now())
  RETURNING id INTO new_game_id;
  
  -- Set operation context for trigger
  PERFORM set_config('app.operation_type', 'game_transaction', true);
  
  -- Deduct stake from creator's balance
  UPDATE public.profiles 
  SET balance = balance - stake_amount,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Add ledger entry
  INSERT INTO public.ledger (user_id, game_id, amount, type, created_at)
  VALUES (auth.uid(), new_game_id::UUID, -stake_amount, 'stake', now());
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('game_id', new_game_id);
END;
$$;