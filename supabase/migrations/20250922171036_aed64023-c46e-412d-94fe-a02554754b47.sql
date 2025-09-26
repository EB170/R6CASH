-- Remove the old 2-parameter deposit_credit function that's causing conflicts
DROP FUNCTION IF EXISTS public.deposit_credit(uuid, numeric);

-- Verify we only have the 3-parameter version
-- The 3-parameter version should be: deposit_credit(user_id_param uuid, amount_param numeric, stripe_charge_id_param text DEFAULT NULL)

-- Also add better error logging to help debug payment verification issues
CREATE OR REPLACE FUNCTION public.log_payment_verification_error(
  error_message text,
  session_id text,
  user_id uuid,
  context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    user_id,
    'PAYMENT_VERIFICATION_ERROR',
    'payments',
    session_id,
    jsonb_build_object('error', error_message),
    context_data,
    now()
  );
END;
$$;