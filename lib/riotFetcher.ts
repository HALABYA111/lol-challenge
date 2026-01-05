import axios from 'axios'

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY
const REGION = 'euw1' // default region; can override per player

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

export async function fetchPlayerStats(summonerName: string, region = REGION): Promise<PlayerStats | null> {
  try {
    // Step 1: Get summoner info
    const summonerRes = await axios.get(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY }
    })

    const { id, name } = summonerRes.data

    // Step 2: Get ranked stats
    const rankedRes = await axios.get(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY }
    })

    const soloQueue = rankedRes.data.find((q: any) => q.queueType === 'RANKED_SOLO_5x5') || null

    let tier = 'Unranked', rank = '', lp = 0, wins = 0, losses = 0, winRate = 0
    if (soloQueue) {
      tier = soloQueue.tier
      rank = soloQueue.rank
      lp = soloQueue.leaguePoints
      wins = soloQueue.wins
      losses = soloQueue.losses
      winRate = Math.round((wins / (wins + losses)) * 100)
    }

    // Step 3: Get most played champion (optional, requires Riot champion-mastery API)
    const masteryRes = await axios.get(`https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}`, {
      headers: { 'X-Riot-Token': RIOT_API_KEY }
    })

    const mostPlayedChampionId = masteryRes.data[0]?.championId || 0

    return {
      summonerName: name,
      tier,
      rank,
      lp,
      wins,
      losses,
      winRate,
      mostPlayedChampion: mostPlayedChampionId.toString()
    }

  } catch (error) {
    console.error('Error fetching Riot data:', error)
    return null
  }
}
