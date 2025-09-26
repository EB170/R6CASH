-- Create a comprehensive transactions table for detailed logging
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_stake', 'game_winnings', 'commission')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  reference_id TEXT, -- For external references like Stripe charge IDs
  stripe_charge_id TEXT,
  stripe_fee DECIMAL(10,2) DEFAULT 0,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

-- Allow system to insert transactions
CREATE POLICY "System can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from modifying transactions
CREATE POLICY "No updates or deletes on transactions" ON public.transactions
FOR ALL USING (false);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update the deposit_credit function to use the new transactions table
CREATE OR REPLACE FUNCTION public.deposit_credit(
  user_id_param UUID, 
  amount_param NUMERIC, 
  stripe_charge_id_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance DECIMAL;
  stripe_fee DECIMAL DEFAULT 0;
  net_amount DECIMAL;
  result JSON;
BEGIN
  -- Calculate Stripe fee (2.9% + $0.30)
  stripe_fee := ROUND((amount_param * 0.029) + 0.30, 2);
  net_amount := amount_param - stripe_fee;
  
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM profiles 
  WHERE user_id = user_id_param;
  
  -- If no profile exists, create one
  IF current_balance IS NULL THEN
    INSERT INTO profiles (id, user_id, balance, display_name, username) 
    VALUES (user_id_param, user_id_param, 0, 'New User', 'newuser')
    ON CONFLICT (user_id) DO NOTHING;
    current_balance := 0;
  END IF;
  
  -- Set operation context for balance manipulation trigger
  PERFORM set_config('app.operation_type', 'deposit', true);
  
  -- Update balance
  UPDATE profiles 
  SET 
    balance = balance + net_amount,
    updated_at = NOW()
  WHERE user_id = user_id_param;
  
  -- Log the deposit transaction in the new transactions table
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    stripe_charge_id,
    stripe_fee,
    created_at
  ) VALUES (
    user_id_param,
    'deposit',
    net_amount,
    current_balance,
    current_balance + net_amount,
    'Deposit via Stripe - Fee: $' || stripe_fee::TEXT,
    stripe_charge_id_param,
    stripe_fee,
    NOW()
  );
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  -- Return success with details
  result := json_build_object(
    'success', true,
    'net_amount', net_amount,
    'stripe_fee', stripe_fee,
    'new_balance', current_balance + net_amount
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Update the create_game function to log transactions
CREATE OR REPLACE FUNCTION public.create_game(game_mode TEXT, stake_amount NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_game_id BIGINT;
  user_profile RECORD;
  current_balance DECIMAL;
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
  
  current_balance := user_profile.balance;
  
  IF current_balance < stake_amount THEN
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
  
  -- Log the stake transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    game_id,
    created_at
  ) VALUES (
    auth.uid(),
    'game_stake',
    -stake_amount,
    current_balance,
    current_balance - stake_amount,
    'Game stake for ' || game_mode || ' game',
    new_game_id::UUID,
    NOW()
  );
  
  -- Add ledger entry (keep for compatibility)
  INSERT INTO public.ledger (user_id, game_id, amount, type, created_at)
  VALUES (auth.uid(), new_game_id::UUID, -stake_amount, 'stake', now());
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('game_id', new_game_id);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$$;

-- Update the join_game function to log transactions
CREATE OR REPLACE FUNCTION public.join_game(game_id_param BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  game_record RECORD;
  user_profile RECORD;
  max_players INTEGER;
  current_players INTEGER;
  current_balance DECIMAL;
BEGIN
  -- Get game details
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game not found');
  END IF;
  
  -- Check game status
  IF game_record.status != 'waiting' THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game is not available for joining');
  END IF;
  
  -- Prevent creator from joining their own game
  IF game_record.creator_id = auth.uid() THEN
    RETURN JSON_BUILD_OBJECT('error', 'Cannot join your own game');
  END IF;
  
  -- Check if user already joined this game
  IF EXISTS (SELECT 1 FROM public.game_players WHERE game_id = game_id_param AND player_id = auth.uid()) THEN
    RETURN JSON_BUILD_OBJECT('error', 'You have already joined this game');
  END IF;
  
  -- Calculate max players based on game mode
  max_players := CASE 
    WHEN game_record.mode = '1v1' THEN 2
    WHEN game_record.mode = '2v2' THEN 4
    WHEN game_record.mode = '3v3' THEN 6
    WHEN game_record.mode = '4v4' THEN 8
    WHEN game_record.mode = '5v5' THEN 10
    ELSE 2
  END;
  
  -- Check current player count (including creator)
  SELECT COUNT(*) + 1 INTO current_players 
  FROM public.game_players 
  WHERE game_id = game_id_param;
  
  IF current_players >= max_players THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game is full');
  END IF;
  
  -- Check if user has enough balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'User profile not found');
  END IF;
  
  current_balance := user_profile.balance;
  
  IF current_balance < game_record.stake THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Set operation context for trigger
  PERFORM set_config('app.operation_type', 'game_transaction', true);
  
  -- Join the game
  INSERT INTO public.game_players (game_id, player_id, joined_at)
  VALUES (game_id_param, auth.uid(), now());
  
  -- Deduct stake from player's balance
  UPDATE public.profiles 
  SET balance = balance - game_record.stake,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Log the stake transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    game_id,
    created_at
  ) VALUES (
    auth.uid(),
    'game_stake',
    -game_record.stake,
    current_balance,
    current_balance - game_record.stake,
    'Joined ' || game_record.mode || ' game',
    game_id_param::UUID,
    NOW()
  );
  
  -- Add ledger entry (keep for compatibility)
  INSERT INTO public.ledger (user_id, game_id, amount, type, created_at)
  VALUES (auth.uid(), game_id_param::UUID, -game_record.stake, 'stake', now());
  
  -- Update game status if full
  IF current_players >= max_players THEN
    UPDATE public.games 
    SET status = 'active', updated_at = now()
    WHERE id = game_id_param;
  END IF;
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('success', true);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$$;

-- Update the update_elo_ratings function to log winnings transactions
CREATE OR REPLACE FUNCTION public.update_elo_ratings(game_id_param BIGINT, winner_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  game_record RECORD;
  total_pot NUMERIC(10,2);
  platform_commission NUMERIC(10,2);
  winner_payout NUMERIC(10,2);
  winner_balance DECIMAL;
BEGIN
  -- Get game details
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game not found');
  END IF;
  
  -- Check if game is active
  IF game_record.status != 'active' THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game is not active');
  END IF;
  
  -- Verify winner is part of the game
  IF winner_id_param != game_record.creator_id AND 
     NOT EXISTS (SELECT 1 FROM public.game_players WHERE game_id = game_id_param AND player_id = winner_id_param) THEN
    RETURN JSON_BUILD_OBJECT('error', 'Winner is not part of this game');
  END IF;
  
  -- Calculate total pot and commission
  SELECT COUNT(*) + 1 INTO total_pot FROM public.game_players WHERE game_id = game_id_param;
  total_pot := total_pot * game_record.stake;
  
  -- Platform takes 5% commission
  platform_commission := total_pot * 0.05;
  winner_payout := total_pot - platform_commission;
  
  -- Get winner's current balance
  SELECT balance INTO winner_balance FROM public.profiles WHERE user_id = winner_id_param;
  
  -- Set operation context for trigger
  PERFORM set_config('app.operation_type', 'winnings', true);
  
  -- Add winnings to winner's balance
  UPDATE public.profiles 
  SET balance = balance + winner_payout,
      updated_at = now()
  WHERE user_id = winner_id_param;
  
  -- Log the winnings transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    game_id,
    created_at
  ) VALUES (
    winner_id_param,
    'game_winnings',
    winner_payout,
    winner_balance,
    winner_balance + winner_payout,
    'Won ' || game_record.mode || ' game - Commission: $' || platform_commission::TEXT,
    game_id_param::UUID,
    NOW()
  );
  
  -- Add ledger entry for winnings (keep for compatibility)
  INSERT INTO public.ledger (user_id, game_id, amount, type, platform_commission, created_at)
  VALUES (winner_id_param, game_id_param::UUID, winner_payout, 'winnings', platform_commission, now());
  
  -- Track platform commission
  INSERT INTO public.platform_revenue (
    transaction_type, 
    amount, 
    game_id, 
    user_id,
    created_at
  ) VALUES (
    'game_commission', 
    platform_commission, 
    game_id_param::UUID,
    winner_id_param,
    now()
  );
  
  -- Update game with winner and status
  UPDATE public.games 
  SET winner_id = winner_id_param, 
      status = 'finished',
      updated_at = now()
  WHERE id = game_id_param;
  
  -- Reset operation context
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'total_pot', total_pot,
    'platform_commission', platform_commission,
    'winner_payout', winner_payout
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$$;

-- Update withdrawal request function to log transactions
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  amount_param NUMERIC, 
  payment_method_param TEXT DEFAULT 'bank_transfer', 
  payment_details_param JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  withdrawal_id UUID;
  current_balance DECIMAL;
BEGIN
  -- Check user balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Profile not found');
  END IF;
  
  current_balance := user_profile.balance;
  
  IF current_balance < amount_param THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Minimum withdrawal amount
  IF amount_param < 10.00 THEN
    RETURN JSON_BUILD_OBJECT('error', 'Minimum withdrawal amount is $10.00');
  END IF;
  
  -- Create withdrawal request
  INSERT INTO public.withdrawal_requests (user_id, amount, payment_method, payment_details)
  VALUES (auth.uid(), amount_param, payment_method_param, payment_details_param)
  RETURNING id INTO withdrawal_id;
  
  -- Reserve the funds (subtract from balance but don't credit yet)
  PERFORM set_config('app.operation_type', 'withdrawal_request', true);
  
  UPDATE public.profiles 
  SET balance = balance - amount_param,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Log the withdrawal transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_id,
    created_at
  ) VALUES (
    auth.uid(),
    'withdrawal',
    -amount_param,
    current_balance,
    current_balance - amount_param,
    'Withdrawal request - ' || payment_method_param,
    withdrawal_id::TEXT,
    NOW()
  );
  
  -- Add ledger entry (keep for compatibility)
  INSERT INTO public.ledger (user_id, amount, type, created_at)
  VALUES (auth.uid(), -amount_param, 'withdrawal_request', now());
  
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('success', true, 'withdrawal_id', withdrawal_id);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$$;