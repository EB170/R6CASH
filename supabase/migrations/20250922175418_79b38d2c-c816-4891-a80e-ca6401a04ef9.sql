-- Mettre à jour le minimum de mise à $4.00 pour permettre les petits dépôts
CREATE OR REPLACE FUNCTION public.validate_game_input(game_mode text, stake_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate game mode
  IF game_mode NOT IN ('1v1', '2v2', '3v3', '4v4', '5v5') THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid game mode');
  END IF;
  
  -- Validate stake amount
  IF stake_amount IS NULL OR stake_amount <= 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Stake amount must be positive');
  END IF;
  
  -- Update minimum stake to $4.00 pour permettre les dépôts de $5
  IF stake_amount < 4.00 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum stake is $4.00');
  END IF;
  
  IF stake_amount > 1000.00 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Maximum stake is $1,000.00');
  END IF;
  
  RETURN jsonb_build_object('valid', true);
END;
$function$;