-- Add ELO rating system to profiles
ALTER TABLE public.profiles 
ADD COLUMN elo_rating integer DEFAULT 1200;

-- Create function to calculate new ELO ratings
CREATE OR REPLACE FUNCTION public.calculate_elo_change(
  player_elo integer,
  opponent_elo integer,
  player_won boolean,
  k_factor integer DEFAULT 32
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
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
$$;

-- Create function to update ELO ratings after a game
CREATE OR REPLACE FUNCTION public.update_elo_ratings(game_id_param bigint, winner_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  game_record RECORD;
  creator_elo integer;
  player_elo integer;
  new_creator_elo integer;
  new_player_elo integer;
  player_id_param uuid;
BEGIN
  -- Get game details
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Game not found');
  END IF;
  
  -- Get player ID from game_players
  SELECT player_id INTO player_id_param 
  FROM public.game_players 
  WHERE game_id = game_id_param 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Player not found');
  END IF;
  
  -- Get current ELO ratings
  SELECT elo_rating INTO creator_elo 
  FROM public.profiles 
  WHERE user_id = game_record.creator_id;
  
  SELECT elo_rating INTO player_elo 
  FROM public.profiles 
  WHERE user_id = player_id_param;
  
  -- Calculate new ELO ratings
  new_creator_elo := calculate_elo_change(
    creator_elo, 
    player_elo, 
    winner_id_param = game_record.creator_id
  );
  
  new_player_elo := calculate_elo_change(
    player_elo, 
    creator_elo, 
    winner_id_param = player_id_param
  );
  
  -- Update ELO ratings
  UPDATE public.profiles 
  SET elo_rating = new_creator_elo 
  WHERE user_id = game_record.creator_id;
  
  UPDATE public.profiles 
  SET elo_rating = new_player_elo 
  WHERE user_id = player_id_param;
  
  -- Update game with winner
  UPDATE public.games 
  SET winner_id = winner_id_param, status = 'completed'
  WHERE id = game_id_param;
  
  -- Add winnings to winner's balance (stake * 2 - house edge)
  UPDATE public.profiles 
  SET balance = balance + (game_record.stake * 1.95) -- 2.5% house edge
  WHERE user_id = winner_id_param;
  
  -- Add ledger entry for winnings
  INSERT INTO public.ledger (user_id, game_id, amount, type)
  VALUES (winner_id_param, game_id_param::UUID, game_record.stake * 1.95, 'winnings');
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'creator_elo_change', new_creator_elo - creator_elo,
    'player_elo_change', new_player_elo - player_elo
  );
END;
$$;