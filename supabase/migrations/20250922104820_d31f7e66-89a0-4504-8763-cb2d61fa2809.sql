-- Fix the function properly by dropping cascade and recreating
DROP TRIGGER IF EXISTS validate_balance_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.validate_balance_update() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log balance changes for audit purposes
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
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

-- Recreate the trigger
CREATE TRIGGER validate_balance_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_balance_update();