import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Game types
export interface Player {
  id: number
  name: string
  isMafia?: boolean
}

export interface GameState {
  code: string
  host: string
  playerCount: number
  mafiaCount: number
  players: Player[]
  normalWord: string
  mafiaWord: string
  status: 'lobby' | 'playing' | 'ended'
  created: string
  votes?: Record<number, number>
  votingComplete?: boolean
  mafiaRevealed?: boolean
} 