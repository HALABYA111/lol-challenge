'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Player = {
  id: string
  display_name: string
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')

      if (error) {
        console.error(error)
      } else {
        setPlayers(data || [])
      }

      setLoading(false)
    }

    fetchPlayers()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <main style={{ padding: 20 }}>
      <h1>LoL Challenge – Players</h1>

      {players.length === 0 && <p>No players yet</p>}

      <ul>
        {players.map(player => (
          <li key={player.id}>{player.display_name}</li>
        ))}
      </ul>
    </main>
  )
}
