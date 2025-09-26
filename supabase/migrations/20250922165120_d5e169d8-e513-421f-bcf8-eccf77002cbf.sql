-- Update minimum stake validation in validate_game_input function
CREATE OR REPLACE FUNCTION public.validate_game_input(game_mode text, stake_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate game mode
  IF game_mode NOT IN ('1v1', '2v2', '3v3', '4v4', '5v5') THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid game mode');
  END IF;
  
  -- Validate stake amount
  IF stake_amount IS NULL OR stake_amount <= 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Stake amount must be positive');
  END IF;
  
  -- Update minimum stake to $5.00
  IF stake_amount < 5.00 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum stake is $5.00');
  END IF;
  
  IF stake_amount > 1000.00 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Maximum stake is $1,000.00');
  END IF;
  
  RETURN jsonb_build_object('valid', true);
END;
$function$

-- Update minimum withdrawal amount in create_withdrawal_request function  
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(amount_param numeric, payment_method_param text DEFAULT 'bank_transfer'::text, payment_details_param jsonb DEFAULT '{}'::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  withdrawal_id UUID;
  current_balance DECIMAL;
BEGIN
  -- Check user balance
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Profile not found');
  END IF;
  
  current_balance := user_profile.balance;
  
  IF current_balance < amount_param THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Update minimum withdrawal amount to $20.00
  IF amount_param < 20.00 THEN
    RETURN JSON_BUILD_OBJECT('error', 'Minimum withdrawal amount is $20.00');
  END IF;
  
  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, amount, payment_method, payment_details)
  VALUES (auth.uid(), amount_param, payment_method_param, payment_details_param)
  RETURNING id INTO withdrawal_id;
  
  -- Reserve the funds (subtract from balance but don't credit yet)
  PERFORM set_config('app.operation_type', 'withdrawal_request', true);
  
  UPDATE profiles 
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
  INSERT INTO ledger (user_id, amount, type, created_at)
  VALUES (auth.uid(), -amount_param, 'withdrawal_request', now());
  
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('success', true, 'withdrawal_id', withdrawal_id);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Reset operation context on error
    PERFORM set_config('app.operation_type', '', true);
    RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$function$