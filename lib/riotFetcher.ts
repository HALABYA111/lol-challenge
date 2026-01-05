import axios from 'axios'

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY
const DEFAULT_REGION = 'euw1' // default region

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

// Fetch player stats from Riot API
export async function fetchPlayerStats(
  summonerName: string,
  region = DEFAULT_REGION
): Promise<PlayerStats | null> {
  try {
    // Step 1: Get summoner info
    const summonerRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    )

    const { id, name } = summonerRes.data

    // Step 2: Get ranked stats
    const rankedRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    )

    const soloQueue = rankedRes.data.find((q: any) => q.queueType === 'RANKED_SOLO_5x5') || null

    let tier = 'Unranked',
      rank = '',
      lp = 0,
      wins = 0,
      losses = 0,
      winRate = 0

    if (soloQueue) {
      tier = soloQueue.tier
      rank = soloQueue.rank
      lp = soloQueue.leaguePoints
      wins = soloQueue.wins
      losses = soloQueue.losses
      winRate = Math.round((wins / (wins + losses)) * 100)
    }

    // Step 3: Get most played champion
    const masteryRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    )

    const mostPlayedChampionId = masteryRes.data[0]?.championId || 0

    // Step 4: Convert champion ID to name using Data Dragon
    const championsRes = await axios.get(
      'https://ddragon.leagueoflegends.com/cdn/14.21.1/data/en_US/champion.json'
    )
    const champions = championsRes.data.data
    let championName = 'Unknown'
    for (const key in champions) {
      if (parseInt(champions[key].key) === mostPlayedChampionId) {
        championName = champions[key].name
        break
      }
    }

    return {
      summonerName: name,
      tier,
      rank,
      lp,
      wins,
      losses,
      winRate,
      mostPlayedChampion: championName
    }
  } catch (error) {
    console.error('Error fetching Riot data:', error)
    return null
  }
}
