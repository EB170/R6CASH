-- Fix existing user balance to $0 as per security requirement
UPDATE public.profiles 
SET balance = 0.00 
WHERE balance > 0.00;

-- Add additional security check to prevent balance manipulation
CREATE OR REPLACE FUNCTION public.validate_balance_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow balance updates through specific functions
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    -- Check if the update is coming from a legitimate function
    IF NOT EXISTS (
      SELECT 1 FROM pg_stat_activity 
      WHERE query LIKE '%deposit_credit%' 
      OR query LIKE '%create_game%' 
      OR query LIKE '%join_game%'
      OR query LIKE '%update_elo_ratings%'
    ) THEN
      RAISE EXCEPTION 'Direct balance updates are not allowed for security reasons';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for balance validation
DROP TRIGGER IF EXISTS validate_balance_trigger ON public.profiles;
CREATE TRIGGER validate_balance_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_balance_update();

-- Ensure all new profiles start with $0 balance
ALTER TABLE public.profiles 
ALTER COLUMN balance SET DEFAULT 0.00;