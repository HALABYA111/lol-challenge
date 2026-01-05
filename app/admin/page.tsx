'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchPlayerStats } from '@/lib/riotFetcher'

type Player = {
  id: string
  display_name: string
  riot_id: string
  server: 'euw1' | 'eun1'
}

export default function Admin() {
  const [players, setPlayers] = useState<Player[]>([])
  const [riotId, setRiotId] = useState('')
  const [server, setServer] = useState<'euw1' | 'eun1'>('euw1')
  const [adding, setAdding] = useState(false)

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*')
    setPlayers(data || [])
  }

  const addPlayer = async () => {
    if (!riotId.includes('#')) return alert('Riot ID must include #TAG')
    setAdding(true)
    const { data, error } = await supabase.from('players').insert({
      display_name: riotId.split('#')[0],
      riot_id: riotId,
      server
    }).select()
    if (error) {
      console.error('Error adding player:', error)
      setAdding(false)
      return
    }

    // Immediately fetch stats for new player
    if (data && data[0]) {
      const newStat = await fetchPlayerStats(data[0].riot_id, data[0].server)
      console.log('New player stats:', newStat)
    }

    setRiotId('')
    setAdding(false)
    fetchPlayers()
  }

  const removePlayer = async (id: string) => {
    await supabase.from('players').delete().eq('id', id)
    fetchPlayers()
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Admin Panel – Manage Players</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
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
        <button onClick={addPlayer} disabled={adding} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          {adding ? 'Adding...' : 'Add Player'}
        </button>
      </div>

      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Riot ID</th>
            <th>Server</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.display_name}</td>
              <td>{player.riot_id}</td>
              <td>{player.server.toUpperCase()}</td>
              <td>
                <button onClick={() => removePlayer(player.id)} style={{ cursor: 'pointer' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
