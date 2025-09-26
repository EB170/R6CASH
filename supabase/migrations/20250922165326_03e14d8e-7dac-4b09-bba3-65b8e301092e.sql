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
$function$;