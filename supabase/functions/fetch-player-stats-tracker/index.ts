import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TRACKER_API_KEY = Deno.env.get("TRACKER_API_KEY")!
const API_BASE = "https://public-api.tracker.gg/v2/r6siege/standard"

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), { status: 405 })
    }

    const { username, platform } = await req.json()
    if (!username || !platform) {
      return new Response(JSON.stringify({ error: "username et platform requis" }), { status: 400 })
    }

    // Headers
    const headers = {
      "TRN-Api-Key": TRACKER_API_KEY,
      "Content-Type": "application/json"
    }

    // 🔹 1. Fetch global stats
    const statsRes = await fetch(`${API_BASE}/profile/${platform}/${username}`, { headers })
    if (!statsRes.ok) {
      return new Response(JSON.stringify({ error: "Impossible de récupérer les stats globales" }), { status: statsRes.status })
    }
    const statsData = await statsRes.json()

    // 🔹 2. Fetch match history (les 10 derniers)
    const matchesRes = await fetch(`${API_BASE}/matches/${platform}/${username}?limit=10`, { headers })
    let matches: any[] = []
    if (matchesRes.ok) {
      const matchesJson = await matchesRes.json()
      matches = matchesJson?.data || []
    }

    // 🔹 3. Transformer les matchs → KD + Winrate
    const history = matches.map((m: any, idx: number) => {
      const stats = m?.segments?.[0]?.stats || {}
      return {
        match: idx + 1,
        kd: parseFloat(stats.kd?.displayValue) || null,
        winrate: parseFloat(stats.wlPercentage?.displayValue) || null
      }
    })

    return new Response(
      JSON.stringify({
        stats: statsData,
        history
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Function error:", err)
    return new Response(JSON.stringify({ error: "Erreur interne" }), { status: 500 })
  }
})
