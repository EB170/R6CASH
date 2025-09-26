-- Update user profiles to start with 0 balance instead of 100
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 0.00;

-- Update the handle_new_user function to use 0 balance and add enhanced security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Enhanced security: validate that the user is properly authenticated
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data: missing id or email';
  END IF;
  
  -- Enhanced security: prevent duplicate profile creation
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RAISE EXCEPTION 'Profile already exists for user %', NEW.id;
  END IF;
  
  -- Create profile with 0 balance for real money deposits
  INSERT INTO public.profiles (id, user_id, display_name, username, balance)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0.00  -- Users must deposit real money to play
  );
  
  -- Log the profile creation for security audit
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
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
$$;