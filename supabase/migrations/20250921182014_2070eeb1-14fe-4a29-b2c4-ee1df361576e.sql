-- Create deposit_credit function that adds funds when payment is completed
CREATE OR REPLACE FUNCTION public.deposit_credit(
  user_id_param UUID,
  amount_param NUMERIC
) RETURNS JSON AS $$
BEGIN
  -- Add credit to user's balance
  UPDATE public.profiles 
  SET balance = balance + amount_param 
  WHERE user_id = user_id_param;
  
  -- Add ledger entry for deposit
  INSERT INTO public.ledger (user_id, amount, type)
  VALUES (user_id_param, amount_param, 'deposit');
  
  RETURN JSON_BUILD_OBJECT('success', true, 'amount', amount_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, balance)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    100.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();