export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string // YouTube URL
  thumbnail?: string
  lyrics?: string
  uploadedAt: Date
  plays: number
  liked: boolean
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
}

export interface LyricsLine {
  time: number
  text: string
}

export interface WaveformData {
  peaks: number[]
  duration: number
}