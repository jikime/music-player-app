import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface DatabaseSong {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string
  thumbnail?: string
  lyrics?: string
  uploaded_at: string
  plays: number
  liked: boolean
  created_at: string
  updated_at: string
}

export interface DatabasePlaylist {
  id: string
  name: string
  description?: string
  cover_image?: string
  created_at: string
  updated_at: string
  has_notification: boolean
}

export interface DatabasePlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  position: number
  created_at: string
}

export interface DatabaseBookmark {
  id: string
  song_id: string
  created_at: string
}