export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string // YouTube URL
  thumbnail?: string
  image_data?: string // Base64 encoded image data
  lyrics?: string
  uploadedAt: Date
  plays: number
  liked: boolean
  shared: boolean
}

export interface Playlist {
  id: string
  name: string
  songs: string[] // Song IDs
  createdAt: Date
  updatedAt: Date
  hasNotification?: boolean
  description?: string
  coverImage?: string
}

export interface Bookmark {
  id: string
  songId: string
  createdAt: Date
  song?: Song // Full song data when fetched with details
}

export interface UploadedFile {
  type: 'audio' | 'image' | 'lyrics'
  file: File
  preview?: string
}

export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  queue: string[] // Song IDs
  history: string[] // Song IDs
  currentPlaylist: string | null // Current playlist ID
  playlistQueue: string[] // Original playlist order
}

export interface LyricsLine {
  time: number
  text: string
}

export interface WaveformData {
  peaks: number[]
  duration: number
}

export interface TrendingSnapshot {
  id: string
  period_type: 'daily' | 'weekly' | 'monthly'
  snapshot_date: string
  created_at: string
}

export interface TrendingRanking {
  id: string
  snapshot_id: string
  song_id: string
  ranking: number
  trending_score: number
  plays_count: number
  play_increase_percent: number
  created_at: string
}

export interface TrendingSong extends Song {
  trendingScore: number
  playIncrease: number
  ranking: number
  previousRanking?: number
  rankingChange: number
}

export interface TrendingStats {
  totalPlays: number
  trendingSongsCount: number
  activeListeners: number
  periodGrowthPercent: number
}

export interface SharedSong {
  id: string
  songId: string
  userId: string
  shareId: string
  title?: string
  description?: string
  isPublic: boolean
  expiresAt?: Date
  viewCount: number
  createdAt: Date
  updatedAt: Date
}