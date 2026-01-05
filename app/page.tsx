'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchPlayerStats, PlayerStats } from '@/lib/riotFetcher'

type Player = {
  id: string
  display_name: string
  riot_id: string
  server: string
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Record<string, PlayerStats | null>>({})
  const [loading, setLoading] = useState(true)

  // Fetch players from Supabase
  const fetchPlayers = async () => {
    setLoading(true)
    const { data } = await supabase.from('players').select('*')
    setPlayers(data || [])
    setLoading(false)
  }

  // Fetch Riot stats for all players
  const fetchStats = async () => {
    const newStats: Record<string, PlayerStats | null> = {}
    for (const player of players) {
      const stat = await fetchPlayerStats(player.riot_id, player.server)
      newStats[player.id] = stat
    }
    setStats(newStats)
  }

  // Initial load
  useEffect(() => {
    const load = async () => {
      await fetchPlayers()
    }
    load()
  }, [])

  // When players list updates, fetch stats
  useEffect(() => {
    if (players.length > 0) {
      fetchStats()
    }
  }, [players])

  if (loading) return <p>Loading...</p>

  return (
    <main style={{ padding: 20 }}>
      <h1>LoL Challenge – Players</h1>
      <button onClick={fetchStats} style={{ marginBottom: 20 }}>Refresh Stats</button>

      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Riot ID</th>
            <th>Server</th>
            <th>Rank</th>
            <th>LP</th>
            <th>Win Rate</th>
            <th>Most Played Champion</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => {
            const s = stats[player.id]
            return (
              <tr key={player.id}>
                <td>{player.display_name}</td>
                <td>{player.riot_id}</td>
                <td>{player.server}</td>
                <td>{s ? `${s.tier} ${s.rank}` : 'Loading...'}</td>
                <td>{s?.lp ?? 'Loading...'}</td>
                <td>{s ? `${s.winRate}%` : 'Loading...'}</td>
                <td>{s?.mostPlayedChampion ?? 'Loading...'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}
