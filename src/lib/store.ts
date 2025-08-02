import { create } from 'zustand'
import { Song, Playlist, Bookmark, PlayerState } from '@/types/music'
import { mockSongs, mockPlaylists } from './mock-data'

interface MusicStore {
  // Songs
  songs: Song[]
  addSong: (song: Song) => void
  updateSong: (id: string, updates: Partial<Song>) => void
  deleteSong: (id: string) => void
  getSong: (id: string) => Song | undefined
  
  // Playlists
  playlists: Playlist[]
  addPlaylist: (playlist: Playlist) => void
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void
  deletePlaylist: (id: string) => void
  addSongToPlaylist: (playlistId: string, songId: string) => void
  removeSongFromPlaylist: (playlistId: string, songId: string) => void
  
  // Bookmarks
  bookmarks: Bookmark[]
  addBookmark: (songId: string) => void
  removeBookmark: (songId: string) => void
  isBookmarked: (songId: string) => boolean
  
  // Player State
  playerState: PlayerState
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  addToQueue: (songId: string) => void
  removeFromQueue: (songId: string) => void
  playNext: () => void
  playPrevious: () => void
  
  // Search
  searchSongs: (query: string) => Song[]
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  // Songs
  songs: mockSongs,
  addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
  updateSong: (id, updates) => set((state) => ({
    songs: state.songs.map((song) => song.id === id ? { ...song, ...updates } : song)
  })),
  deleteSong: (id) => set((state) => ({
    songs: state.songs.filter((song) => song.id !== id),
    bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== id)
  })),
  getSong: (id) => get().songs.find((song) => song.id === id),
  
  // Playlists
  playlists: mockPlaylists,
  addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
  updatePlaylist: (id, updates) => set((state) => ({
    playlists: state.playlists.map((playlist) => 
      playlist.id === id ? { ...playlist, ...updates, updatedAt: new Date() } : playlist
    )
  })),
  deletePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter((playlist) => playlist.id !== id)
  })),
  addSongToPlaylist: (playlistId, songId) => set((state) => ({
    playlists: state.playlists.map((playlist) =>
      playlist.id === playlistId
        ? { ...playlist, songs: [...playlist.songs, songId], updatedAt: new Date() }
        : playlist
    )
  })),
  removeSongFromPlaylist: (playlistId, songId) => set((state) => ({
    playlists: state.playlists.map((playlist) =>
      playlist.id === playlistId
        ? { ...playlist, songs: playlist.songs.filter((id) => id !== songId), updatedAt: new Date() }
        : playlist
    )
  })),
  
  // Bookmarks
  bookmarks: [],
  addBookmark: (songId) => set((state) => ({
    bookmarks: [...state.bookmarks, { id: Date.now().toString(), songId, createdAt: new Date() }]
  })),
  removeBookmark: (songId) => set((state) => ({
    bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== songId)
  })),
  isBookmarked: (songId) => get().bookmarks.some((bookmark) => bookmark.songId === songId),
  
  // Player State
  playerState: {
    currentSong: null,
    isPlaying: false,
    volume: 0.7,
    currentTime: 0,
    duration: 0,
    shuffle: false,
    repeat: 'none',
    queue: [],
    history: []
  },
  setCurrentSong: (song) => set((state) => ({
    playerState: { ...state.playerState, currentSong: song, currentTime: 0 }
  })),
  setIsPlaying: (isPlaying) => set((state) => ({
    playerState: { ...state.playerState, isPlaying }
  })),
  setVolume: (volume) => set((state) => ({
    playerState: { ...state.playerState, volume }
  })),
  setCurrentTime: (currentTime) => set((state) => ({
    playerState: { ...state.playerState, currentTime }
  })),
  setDuration: (duration) => set((state) => ({
    playerState: { ...state.playerState, duration }
  })),
  toggleShuffle: () => set((state) => ({
    playerState: { ...state.playerState, shuffle: !state.playerState.shuffle }
  })),
  toggleRepeat: () => set((state) => {
    const repeatStates: ('none' | 'one' | 'all')[] = ['none', 'one', 'all']
    const currentIndex = repeatStates.indexOf(state.playerState.repeat)
    const nextIndex = (currentIndex + 1) % repeatStates.length
    return {
      playerState: { ...state.playerState, repeat: repeatStates[nextIndex] }
    }
  }),
  addToQueue: (songId) => set((state) => ({
    playerState: { ...state.playerState, queue: [...state.playerState.queue, songId] }
  })),
  removeFromQueue: (songId) => set((state) => ({
    playerState: { ...state.playerState, queue: state.playerState.queue.filter((id) => id !== songId) }
  })),
  playNext: () => {
    const state = get()
    const { currentSong, queue, shuffle, repeat } = state.playerState
    
    if (queue.length > 0) {
      const nextSongId = queue[0]
      const nextSong = state.getSong(nextSongId)
      if (nextSong) {
        set((state) => ({
          playerState: {
            ...state.playerState,
            currentSong: nextSong,
            queue: state.playerState.queue.slice(1),
            history: currentSong ? [...state.playerState.history, currentSong.id] : state.playerState.history
          }
        }))
      }
    } else if (repeat === 'one' && currentSong) {
      set((state) => ({
        playerState: { ...state.playerState, currentTime: 0, isPlaying: true }
      }))
    } else if (shuffle || repeat === 'all') {
      const availableSongs = state.songs.filter((song) => song.id !== currentSong?.id)
      if (availableSongs.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSongs.length)
        const nextSong = availableSongs[randomIndex]
        set((state) => ({
          playerState: {
            ...state.playerState,
            currentSong: nextSong,
            history: currentSong ? [...state.playerState.history, currentSong.id] : state.playerState.history
          }
        }))
      }
    }
  },
  playPrevious: () => {
    const state = get()
    const { history } = state.playerState
    
    if (history.length > 0) {
      const previousSongId = history[history.length - 1]
      const previousSong = state.getSong(previousSongId)
      if (previousSong) {
        set((state) => ({
          playerState: {
            ...state.playerState,
            currentSong: previousSong,
            history: state.playerState.history.slice(0, -1)
          }
        }))
      }
    }
  },
  
  // Search
  searchSongs: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().songs.filter((song) =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      (song.album && song.album.toLowerCase().includes(lowerQuery))
    )
  }
}))