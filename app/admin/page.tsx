'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Player = {
  id: string
  display_name: string
  riot_id: string
  server: 'euw1' | 'eun1'
}

export default function AdminPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [riotId, setRiotId] = useState('')
  const [server, setServer] = useState<'euw1' | 'eun1'>('euw1')
  const [adding, setAdding] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*')
    setPlayers((data as Player[]) || [])
  }

  const addPlayer = async () => {
    if (!riotId.includes('#')) {
      alert('Riot ID must be like Name#TAG')
      return
    }
    setAdding(true)
    const { error } = await supabase.from('players').insert({
      display_name: riotId.split('#')[0],
      riot_id: riotId,
      server
    })
    if (error) {
      alert('Error adding player: ' + error.message)
    } else {
      alert('Player added!')
      setRiotId('')
      fetchPlayers()
    }
    setAdding(false)
  }

  const removePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) {
      alert('Error removing player: ' + error.message)
    } else {
      fetchPlayers()
    }
  }

  const handleLogin = () => {
    if (password === 'halabya111') {
      setLoggedIn(true)
      fetchPlayers()
    } else {
      alert('Incorrect password')
    }
  }

  if (!loggedIn) {
    return (
      <main style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 8, width: '100%', marginBottom: 10 }}
        />
        <button onClick={handleLogin} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          Login
        </button>
      </main>
    )
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Admin Panel</h1>

      {/* ADD PLAYER */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={riotId}
          onChange={e => setRiotId(e.target.value)}
          placeholder="Riot ID (Name#TAG)"
          style={{ flex: 1, padding: 8 }}
        />
        <select value={server} onChange={e => setServer(e.target.value as any)}>
          <option value="euw1">EUW</option>
          <option value="eun1">EUNE</option>
        </select>
        <button onClick={addPlayer} disabled={adding}>
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* PLAYER TABLE */}
      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>Player</th>
            <th>Riot ID</th>
            <th>Server</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id}>
              <td>{p.display_name}</td>
              <td>{p.riot_id}</td>
              <td>{p.server?.toUpperCase()}</td>
              <td>
                <button onClick={() => removePlayer(p.id)} style={{ cursor: 'pointer' }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setLoggedIn(false)} style={{ marginTop: 20 }}>
        Logout
      </button>
    </main>
  )
}
