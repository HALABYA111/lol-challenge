'use client'

import { useEffect, useState } from 'react'
import { fetchPlayerStats, PlayerStats } from '@/lib/riotFetcher'
import { supabase } from '@/lib/supabaseClient'

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

  // Fetch Riot stats
  const fetchStats = async () => {
    const newStats: Record<string, PlayerStats | null> = {}
    for (const player of players) {
      const stat = await fetchPlayerStats(player.riot_id, player.server)
      newStats[player.id] = stat
    }
    setStats(newStats)
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    if (players.length > 0) fetchStats()
  }, [players])

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>

  const goToAdmin = () => {
    const username = prompt('Admin username:')
    const password = prompt('Admin password:')
    if (username === 'admin' && password === 'halabya111') {
      window.location.href = '/admin'
    } else {
      alert('Incorrect admin credentials!')
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>LoL Challenge – Players</h1>
      <button
        onClick={fetchStats}
        style={{ marginBottom: 20, padding: '10px 16px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        🔄 Refresh Stats
      </button>
      <button
        onClick={goToAdmin}
        style={{ marginBottom: 20, padding: '10px 16px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 10 }}
      >
        Admin Login
      </button>

      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
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
                <td>{player.server.toUpperCase()}</td>
                <td>{s ? `${s.tier} ${s.rank}` : '—'}</td>
                <td>{s?.lp ?? '—'}</td>
                <td>{s ? `${s.winRate}%` : '—'}</td>
                <td>{s?.mostPlayedChampion ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}
