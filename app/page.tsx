'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchPlayerStats, PlayerStats } from '@/lib/riotFetcher'

type Player = {
  id: string
  display_name: string
  riot_id: string
  server: 'euw1' | 'eun1'
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Record<string, PlayerStats | null>>({})
  const [loading, setLoading] = useState(true)

  const [riotId, setRiotId] = useState('')
  const [server, setServer] = useState<'euw1' | 'eun1'>('euw1')
  const [adding, setAdding] = useState(false)

  const fetchPlayers = async () => {
    setLoading(true)
    const { data } = await supabase.from('players').select('*')
    setPlayers((data as Player[]) || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    const newStats: Record<string, PlayerStats | null> = {}

    for (const player of players) {
      newStats[player.id] = await fetchPlayerStats(
        player.riot_id,
        player.server
      )
    }

    setStats(newStats)
  }

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

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    if (players.length) fetchStats()
  }, [players])

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>LoL Challenge – Players</h1>

      {/* ADD PLAYER */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={riotId}
          onChange={e => setRiotId(e.target.value)}
          placeholder="Riot ID (Name#TAG)"
          style={{ flex: 1, padding: 8 }}
        />

        <select
          value={server}
          onChange={e => setServer(e.target.value as any)}
        >
          <option value="euw1">EUW</option>
          <option value="eun1">EUNE</option>
        </select>

        <button onClick={addPlayer} disabled={adding}>
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* REFRESH */}
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
      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>Player</th>
            <th>Riot ID</th>
            <th>Server</th>
            <th>Rank</th>
            <th>LP</th>
            <th>Win Rate</th>
            <th>Most Played Champ</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => {
            const s = stats[p.id]
            return (
              <tr key={p.id}>
                <td>{p.display_name}</td>
                <td>{p.riot_id}</td>
                <td>{p.server?.toUpperCase()}</td>
                <td>
                  {s
                    ? s.tier === 'Unranked'
                      ? 'Unranked'
                      : `${s.tier} ${s.rank}`
                    : '—'}
                </td>
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
