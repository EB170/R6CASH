-- Fix the username constraint issue by making it nullable and adding a default value
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

-- Update the handle_new_user function to generate a username if not provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, username, balance)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    100.00
  );
  RETURN NEW;
END;
$$;