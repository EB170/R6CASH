-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Migrate all existing users to admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to automatically assign client role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payment_details JSONB,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for withdrawals
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to create withdrawal request
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  amount_param NUMERIC,
  payment_method_param TEXT DEFAULT 'bank_transfer',
  payment_details_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  withdrawal_id UUID;
BEGIN
  -- Check user balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Profile not found');
  END IF;
  
  IF user_profile.balance < amount_param THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Minimum withdrawal amount
  IF amount_param < 10.00 THEN
    RETURN JSON_BUILD_OBJECT('error', 'Minimum withdrawal amount is $10.00');
  END IF;
  
  -- Create withdrawal request
  INSERT INTO public.withdrawal_requests (user_id, amount, payment_method, payment_details)
  VALUES (auth.uid(), amount_param, payment_method_param, payment_details_param)
  RETURNING id INTO withdrawal_id;
  
  -- Reserve the funds (subtract from balance but don't credit yet)
  PERFORM set_config('app.operation_type', 'withdrawal_request', true);
  
  UPDATE public.profiles 
  SET balance = balance - amount_param,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Add ledger entry
  INSERT INTO public.ledger (user_id, amount, type, created_at)
  VALUES (auth.uid(), -amount_param, 'withdrawal_request', now());
  
  PERFORM set_config('app.operation_type', '', true);
  
  RETURN JSON_BUILD_OBJECT('success', true, 'withdrawal_id', withdrawal_id);
END;
$$;