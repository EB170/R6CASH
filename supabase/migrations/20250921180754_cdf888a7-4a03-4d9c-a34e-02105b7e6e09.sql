-- Update games table to match our TypeScript interface
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the mode column to text type instead of integer
ALTER TABLE public.games ALTER COLUMN mode TYPE TEXT;

-- Update status column with proper values
ALTER TABLE public.games ALTER COLUMN status SET DEFAULT 'waiting';

-- Add balance column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create or replace the create_game function
CREATE OR REPLACE FUNCTION public.create_game(
  game_mode TEXT,
  stake_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  new_game_id BIGINT;
  user_profile RECORD;
BEGIN
  -- Check if user has enough balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF user_profile.balance < stake_amount THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Create the game
  INSERT INTO public.games (creator_id, mode, stake, status)
  VALUES (auth.uid(), game_mode, stake_amount, 'waiting')
  RETURNING id INTO new_game_id;
  
  -- Deduct stake from creator's balance
  UPDATE public.profiles 
  SET balance = balance - stake_amount 
  WHERE user_id = auth.uid();
  
  -- Add ledger entry
  INSERT INTO public.ledger (user_id, game_id, amount, type)
  VALUES (auth.uid(), new_game_id::UUID, -stake_amount, 'stake');
  
  RETURN JSON_BUILD_OBJECT('game_id', new_game_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the join_game function
CREATE OR REPLACE FUNCTION public.join_game(
  game_id_param BIGINT
) RETURNS JSON AS $$
DECLARE
  game_record RECORD;
  user_profile RECORD;
BEGIN
  -- Get game details
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game not found');
  END IF;
  
  IF game_record.status != 'waiting' THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game is not available');
  END IF;
  
  -- Check if user has enough balance
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
  
  IF user_profile.balance < game_record.stake THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;
  
  -- Join the game
  INSERT INTO public.game_players (game_id, player_id)
  VALUES (game_id_param, auth.uid());
  
  -- Deduct stake from player's balance
  UPDATE public.profiles 
  SET balance = balance - game_record.stake 
  WHERE user_id = auth.uid();
  
  -- Add ledger entry
  INSERT INTO public.ledger (user_id, game_id, amount, type)
  VALUES (auth.uid(), game_id_param::UUID, -game_record.stake, 'stake');
  
  -- Update game status to active
  UPDATE public.games SET status = 'active' WHERE id = game_id_param;
  
  RETURN JSON_BUILD_OBJECT('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for games and game_players tables
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;