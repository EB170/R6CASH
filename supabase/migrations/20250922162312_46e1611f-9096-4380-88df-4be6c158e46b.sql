-- Fix remaining functions without proper search_path
CREATE OR REPLACE FUNCTION public.prevent_balance_manipulation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Allow balance updates only through specific RPC functions
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    -- Check if the session context includes a valid operation flag
    IF current_setting('app.operation_type', true) NOT IN ('deposit', 'game_transaction', 'winnings', 'withdrawal_request') THEN
      RAISE EXCEPTION 'Direct balance modifications are not allowed. Use proper functions.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(user_id uuid, suspicious_reason text, activity_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Detect users with unusually high transaction volume in last hour
  RETURN QUERY
  SELECT 
    l.user_id,
    'high_transaction_volume' as suspicious_reason,
    COUNT(*) as activity_count
  FROM ledger l
  WHERE l.created_at > now() - interval '1 hour'
  GROUP BY l.user_id
  HAVING COUNT(*) > 10;
  
  -- Detect users with rapid game creation
  RETURN QUERY
  SELECT 
    g.creator_id as user_id,
    'rapid_game_creation' as suspicious_reason,
    COUNT(*) as activity_count
  FROM games g
  WHERE g.created_at > now() - interval '10 minutes'
  GROUP BY g.creator_id
  HAVING COUNT(*) > 5;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Enhanced security: validate that the user is properly authenticated
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data: missing id or email';
  END IF;
  
  -- Enhanced security: prevent duplicate profile creation
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
    RAISE EXCEPTION 'Profile already exists for user %', NEW.id;
  END IF;
  
  -- Create profile with 0 balance for real money deposits
  INSERT INTO profiles (id, user_id, display_name, username, balance)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0.00  -- Users must deposit real money to play
  );
  
  -- Log the profile creation for security audit
  INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
  VALUES (
    NEW.id,
    'PROFILE_CREATED',
    'profiles',
    NEW.id::text,
    jsonb_build_object(
      'email', NEW.email,
      'created_at', now(),
      'initial_balance', 0.00
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_elo_change(player_elo integer, opponent_elo integer, player_won boolean, k_factor integer DEFAULT 32)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  expected_score numeric;
  actual_score integer;
  new_elo integer;
BEGIN
  -- Calculate expected score using ELO formula
  expected_score := 1.0 / (1.0 + power(10.0, (opponent_elo - player_elo) / 400.0));
  
  -- Actual score: 1 for win, 0 for loss
  actual_score := CASE WHEN player_won THEN 1 ELSE 0 END;
  
  -- Calculate new ELO
  new_elo := player_elo + (k_factor * (actual_score - expected_score))::integer;
  
  RETURN new_elo;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_balance_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log balance changes for audit purposes
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    INSERT INTO audit_log (
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_financial_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log balance changes
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    INSERT INTO audit_log (
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
$function$;

-- Add enhanced error logging and monitoring functions
CREATE OR REPLACE FUNCTION public.log_system_error(
  error_type text,
  error_message text,
  context_data jsonb DEFAULT NULL,
  severity text DEFAULT 'ERROR'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    auth.uid(),
    'SYSTEM_ERROR',
    'system',
    error_type,
    jsonb_build_object('severity', severity),
    jsonb_build_object(
      'error_message', error_message,
      'context', context_data,
      'timestamp', now()
    ),
    now()
  );
END;
$function$;

-- Add function to cleanup old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM audit_log 
  WHERE created_at < now() - interval '90 days'
  AND action NOT IN ('PROFILE_CREATED', 'SYSTEM_ERROR');
  
  -- Delete old transaction logs older than 2 years
  DELETE FROM transactions 
  WHERE created_at < now() - interval '2 years';
END;
$function$;

-- Create comprehensive health check function
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
  total_users integer;
  active_games integer;
  pending_withdrawals integer;
  recent_errors integer;
BEGIN
  -- Get system metrics
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO active_games FROM games WHERE status = 'active';
  SELECT COUNT(*) INTO pending_withdrawals FROM withdrawal_requests WHERE status = 'pending';
  
  -- Count recent system errors
  SELECT COUNT(*) INTO recent_errors 
  FROM audit_log 
  WHERE action = 'SYSTEM_ERROR' 
  AND created_at > now() - interval '1 hour';
  
  result := jsonb_build_object(
    'status', CASE 
      WHEN recent_errors > 10 THEN 'CRITICAL'
      WHEN recent_errors > 5 THEN 'WARNING'
      ELSE 'HEALTHY'
    END,
    'metrics', jsonb_build_object(
      'total_users', total_users,
      'active_games', active_games,
      'pending_withdrawals', pending_withdrawals,
      'recent_errors', recent_errors
    ),
    'timestamp', now()
  );
  
  RETURN result;
END;
$function$;