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

  // form state
  const [riotId, setRiotId] = useState('')
  const [server, setServer] = useState<'euw1' | 'eun1'>('euw1')
  const [adding, setAdding] = useState(false)

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

  // Add player from form
  const addPlayer = async () => {
    if (!riotId.includes('#')) {
      alert('Riot ID must be like Name#TAG')
      return
    }

    setAdding(true)

    await supabase.from('players').insert({
      display_name: riotId.split('#')[0],
      riot_id: riotId,
      server
    })

    setRiotId('')
    setAdding(false)
    fetchPlayers()
  }

  // Initial load
  useEffect(() => {
    fetchPlayers()
  }, [])

  // Fetch stats when players change
  useEffect(() => {
    if (players.length > 0) {
      fetchStats()
    }
  }, [players])

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>LoL Challenge – Players</h1>

      {/* ADD PLAYER FORM */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Riot ID (Name#TAG)"
          value={riotId}
          onChange={e => setRiotId(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />

        <select
          value={server}
          onChange={e => setServer(e.target.value as 'euw1' | 'eun1')}
          style={{ padding: 8 }}
        >
          <option value="euw1">EUW</option>
          <option value="eun1">EUNE</option>
        </select>

        <button
          onClick={addPlayer}
          disabled={adding}
          style={{
            padding: '8px 14px',
            cursor: 'pointer'
          }}
        >
          {adding ? 'Adding...' : 'Add Player'}
        </button>
      </div>

      {/* REFRESH BUTTON */}
      <button
        onClick={fetchStats}
        style={{
          marginBottom: 20,
          padding: '10px 16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        🔄 Refresh Stats
      </button>

      {/* TABLE */}
      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: 'collapse', width: '100%' }}
      >
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
