-- Fix remaining security warnings

-- 1. Fix function search_path issues for newly created functions
CREATE OR REPLACE FUNCTION public.audit_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log balance changes
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
      'balance_change',
      'profiles',
      NEW.id::TEXT,
      jsonb_build_object('balance', OLD.balance),
      jsonb_build_object('balance', NEW.balance)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(user_id UUID, suspicious_reason TEXT, activity_count BIGINT) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Detect users with unusually high transaction volume in last hour
  RETURN QUERY
  SELECT 
    l.user_id,
    'high_transaction_volume' as suspicious_reason,
    COUNT(*) as activity_count
  FROM public.ledger l
  WHERE l.created_at > now() - interval '1 hour'
  GROUP BY l.user_id
  HAVING COUNT(*) > 10;
  
  -- Detect users with rapid game creation
  RETURN QUERY
  SELECT 
    g.creator_id as user_id,
    'rapid_game_creation' as suspicious_reason,
    COUNT(*) as activity_count
  FROM public.games g
  WHERE g.created_at > now() - interval '10 minutes'
  GROUP BY g.creator_id
  HAVING COUNT(*) > 5;
END;
$$;