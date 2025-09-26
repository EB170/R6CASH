-- PHASE 3: Security Hardening & PHASE 4: Enhanced Monitoring

-- 1. Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins should see audit logs (for now, no one can see them except via service role)
CREATE POLICY "No public access to audit logs" ON public.audit_log
FOR ALL USING (false);

-- 2. Enhanced audit function for financial transactions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for profile balance changes
DROP TRIGGER IF EXISTS audit_profile_balance_changes ON public.profiles;
CREATE TRIGGER audit_profile_balance_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_transaction();

-- 4. Enhanced game security - add constraints
ALTER TABLE public.games 
ADD CONSTRAINT valid_stake CHECK (stake > 0 AND stake <= 10000);

ALTER TABLE public.games 
ADD CONSTRAINT valid_mode CHECK (mode IN ('1v1', '2v2', '3v3', '4v4', '5v5'));

-- 5. Add constraint to prevent negative balances
ALTER TABLE public.profiles 
ADD CONSTRAINT positive_balance CHECK (balance >= 0);

-- 6. Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(user_id UUID, suspicious_reason TEXT, activity_count BIGINT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;