import axios from 'axios'

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY

export type PlayerStats = {
  summonerName: string
  tier: string
  rank: string
  lp: number
  wins: number
  losses: number
  winRate: number
  mostPlayedChampion: string
}

export async function fetchPlayerStats(
  riotId: string,
  region: 'euw1' | 'eun1'
): Promise<PlayerStats | null> {
  try {
    // Riot ID safety
    if (!riotId.includes('#')) return null
    const [name] = riotId.split('#')

    // 1️⃣ Get summoner info
    const summonerRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        name
      )}`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      }
    )

    const { id, name: summonerName } = summonerRes.data

    // 2️⃣ Ranked data
    const rankedRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      }
    )

    const soloQueue =
      rankedRes.data.find(
        (q: any) => q.queueType === 'RANKED_SOLO_5x5'
      ) || null

    let tier = 'Unranked'
    let rank = ''
    let lp = 0
    let wins = 0
    let losses = 0
    let winRate = 0

    if (soloQueue) {
      tier = soloQueue.tier ?? 'Unranked'
      rank = soloQueue.rank ?? ''
      lp = soloQueue.leaguePoints ?? 0
      wins = soloQueue.wins ?? 0
      losses = soloQueue.losses ?? 0
      winRate =
        wins + losses > 0
          ? Math.round((wins / (wins + losses)) * 100)
          : 0
    }

    // 3️⃣ Champion mastery (optional)
    const masteryRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      }
    )

    const mostPlayedChampion =
      masteryRes.data?.[0]?.championId?.toString() ?? 'N/A'

    return {
      summonerName,
      tier,
      rank,
      lp,
      wins,
      losses,
      winRate,
      mostPlayedChampion
    }
  } catch (error) {
    console.error('Riot fetch failed:', error)
    return null
  }
}
