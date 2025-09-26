-- Fix security warnings by setting proper search_path for functions
DROP FUNCTION IF EXISTS public.validate_balance_update();

CREATE OR REPLACE FUNCTION public.validate_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow balance updates through specific functions or RPC calls
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    -- Log the balance change for audit purposes
    INSERT INTO public.audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      NEW.user_id,
      'balance_update',
      'profiles',
      NEW.id::TEXT,
      jsonb_build_object('balance', OLD.balance),
      jsonb_build_object('balance', NEW.balance)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the trigger
DROP TRIGGER IF EXISTS validate_balance_trigger ON public.profiles;
CREATE TRIGGER validate_balance_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_balance_update();