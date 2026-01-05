import { NextResponse } from 'next/server'
import axios from 'axios'

const RIOT_API_KEY = process.env.RIOT_API_KEY!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const summonerName = searchParams.get('summonerName')
  const region = searchParams.get('region') || 'euw1'

  if (!summonerName) {
    return NextResponse.json({ error: 'Missing summonerName' }, { status: 400 })
  }

  try {
    // 1️⃣ Get summoner
    const summonerRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    )

    const summonerId = summonerRes.data.id

    // 2️⃣ Ranked stats
    const rankedRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    )

    const solo = rankedRes.data.find((q: any) => q.queueType === 'RANKED_SOLO_5x5')

    let tier = 'UNRANKED'
    let rank = ''
    let lp = 0
    let wins = 0
    let losses = 0
    let winRate = 0

    if (solo) {
      tier = solo.tier
      rank = solo.rank
      lp = solo.leaguePoints
      wins = solo.wins
      losses = solo.losses
      winRate = Math.round((wins / (wins + losses)) * 100)
    }

    return NextResponse.json({
      tier,
      rank,
      lp,
      wins,
      losses,
      winRate
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch Riot data' }, { status: 500 })
  }
}
