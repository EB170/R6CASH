import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types
export interface Game {
  id: string
  creator_id: string
  mode: '1v1' | '2v2' | '3v3' | '4v4' | '5v5'
  stake: number
  status: 'waiting' | 'active' | 'finished'
  winner_id?: string
  created_at: string
  updated_at: string
  creator_profile?: {
    id: string
    display_name: string
  }
  players?: GamePlayer[]
}

export interface GamePlayer {
  id: string
  game_id: string
  user_id: string
  joined_at: string
  user_profile?: {
    id: string
    display_name: string
  }
}

export interface UserProfile {
  id: string
  display_name: string
  balance: number
  created_at: string
}

// Auth functions
export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { display_name: displayName }
    }
  })
  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Game functions
export const createGame = async (mode: Game["mode"], stake: number) => {
  const { data, error } = await supabase.rpc('create_game', {
    game_mode: mode,
    stake_amount: stake
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return { success: true, gameId: data.game_id }
}

export const joinGame = async (gameId: string) => {
  const { data, error } = await supabase.rpc('join_game', {
    game_id_param: parseInt(gameId)
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return { success: true }
}

// ✅ AVAILABLE GAMES — sans relations PostgREST
export const getAvailableGames = async () => {
  try {
    // 1) les games
    const { data: games, error: gamesErr } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (gamesErr || !games?.length) return (games as Game[]) ?? [];

    // 2) players pour ces games
    const gameIds = games.map(g => g.id);
    const { data: players, error: playersErr } = await supabase
      .from('game_players')
      .select('*')
      .in('game_id', gameIds);

    if (playersErr) return games as Game[];

    // 3) profils (créateurs + joueurs)
    const creatorIds = Array.from(new Set(games.map(g => g.creator_id)));
    const playerUserIds = Array.from(new Set((players ?? []).map(p => p.user_id)));
    const profileIds = Array.from(new Set([...creatorIds, ...playerUserIds]));
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds);

    if (profErr) return games as Game[];

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const playersByGame = new Map<string, any[]>();
    (players ?? []).forEach(p => {
      if (!playersByGame.has(p.game_id)) playersByGame.set(p.game_id, []);
      playersByGame.get(p.game_id)!.push(p);
    });

    // 4) reconstruction
    const enriched = games.map(g => ({
      ...g,
      creator_profile: profileMap.get(g.creator_id) ?? null,
      players: (playersByGame.get(g.id) ?? []).map(p => ({
        ...p,
        user_profile: profileMap.get(p.user_id) ?? null
      }))
    })) as Game[];

    return enriched;
  } catch (err) {
    console.error('getAvailableGames fatal:', err);
    return [];
  }
};

// ✅ USER GAMES — sans relations PostgREST
export async function getUserGames(userId: string) {
  try {
    // 1) games créés par moi
    const { data: created, error: createdErr } = await supabase
      .from('games')
      .select('*')
      .eq('creator_id', userId);

    if (createdErr) console.warn('getUserGames/created warn:', createdErr);

    // 2) mes participations
    const { data: myGP, error: gpErr } = await supabase
      .from('game_players')
      .select('game_id')
      .eq('user_id', userId);

    if (gpErr) console.warn('getUserGames/my game_players warn:', gpErr);

    const myGameIds = Array.from(new Set((myGP ?? []).map(r => r.game_id)));
    const { data: joined, error: joinedErr } = myGameIds.length
      ? await supabase.from('games').select('*').in('id', myGameIds)
      : { data: [], error: null };

    if (joinedErr) console.warn('getUserGames/joined warn:', joinedErr);

    // 3) union + sort
    const allGamesRaw = [...(created ?? []), ...(joined ?? [])];
    const allGames = Array.from(new Map(allGamesRaw.map(g => [g.id, g])).values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!allGames.length) return [];

    // 4) players pour ces games
    const gameIds = allGames.map(g => g.id);
    const { data: players, error: playersErr } = await supabase
      .from('game_players')
      .select('*')
      .in('game_id', gameIds);

    if (playersErr) return allGames as Game[];

    // 5) profils (créateurs + joueurs)
    const creatorIds = Array.from(new Set(allGames.map(g => g.creator_id)));
    const playerUserIds = Array.from(new Set((players ?? []).map(p => p.user_id)));
    const profileIds = Array.from(new Set([...creatorIds, ...playerUserIds]));
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds);

    if (profErr) return allGames as Game[];

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const playersByGame = new Map<string, any[]>();
    (players ?? []).forEach(p => {
      if (!playersByGame.has(p.game_id)) playersByGame.set(p.game_id, []);
      playersByGame.get(p.game_id)!.push(p);
    });

    // 6) reconstruction
    const enriched = allGames.map(g => ({
      ...g,
      creator_profile: profileMap.get(g.creator_id) ?? null,
      players: (playersByGame.get(g.id) ?? []).map(p => ({
        ...p,
        user_profile: profileMap.get(p.user_id) ?? null
      }))
    })) as Game[];

    return enriched;
  } catch (err) {
    console.error('getUserGames fatal:', err);
    return [];
  }
}

// Get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId) // ✅ id est la PK, pas user_id
    .maybeSingle()
  if (error) throw error
  return data as UserProfile | null
}

// Payments
export const createPayment = async (amount: number) => {
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { amount }
  })
  if (error) throw error
  return data
}

export const verifyPayment = async (sessionId: string, amount: number) => {
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { session_id: sessionId, amount }
  })
  if (error) throw error
  return data
}

// Admin monitoring
export const getSecurityMonitoring = async (action: 'detect_suspicious' | 'audit_logs' | 'financial_summary') => {
  const { data, error } = await supabase.functions.invoke('security-monitoring', {
    body: { action }
  })
  if (error) throw error
  return data
}