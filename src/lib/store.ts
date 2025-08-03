import { create } from 'zustand'
import { Song, Playlist, Bookmark, PlayerState } from '@/types/music'
import { songsApi, playlistsApi, bookmarksApi, recentlyPlayedApi } from './api'

interface MusicStore {
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Data initialization
  initializeData: () => Promise<void>
  
  // Songs
  songs: Song[]
  addSong: (song: Omit<Song, 'id' | 'uploadedAt'>) => Promise<void>
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  getSong: (id: string) => Song | undefined
  
  // Playlists
  playlists: Playlist[]
  addPlaylist: (playlist: { name: string; description?: string; coverImage?: string }) => Promise<void>
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>
  
  // Bookmarks
  bookmarks: Bookmark[]
  addBookmark: (songId: string) => Promise<void>
  removeBookmark: (songId: string) => Promise<void>
  isBookmarked: (songId: string) => boolean
  
  // Recently Played
  recentlyPlayed: Song[]
  getRecentlyPlayed: () => Promise<void>
  updatePlayCount: (songId: string) => Promise<void>
  
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
  // Loading states
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Data initialization
  initializeData: async () => {
    try {
      set({ isLoading: true })
      
      // Load all data in parallel
      const [songs, playlists, bookmarks, recentlyPlayed] = await Promise.all([
        songsApi.getAll(),
        playlistsApi.getAll(),
        bookmarksApi.getAll(),
        recentlyPlayedApi.getRecentlyPlayed()
      ])
      
      set({ 
        songs, 
        playlists, 
        bookmarks,
        recentlyPlayed,
        isLoading: false 
      })
    } catch (error) {
      console.error('Failed to initialize data:', error)
      set({ isLoading: false })
    }
  },
  
  // Songs
  songs: [],
  addSong: async (songData) => {
    try {
      set({ isLoading: true })
      const newSong = await songsApi.create(songData)
      set((state) => ({ 
        songs: [...state.songs, newSong],
        isLoading: false 
      }))
    } catch (error) {
      console.error('Failed to add song:', error)
      set({ isLoading: false })
      throw error
    }
  },
  updateSong: async (id, updates) => {
    try {
      const updatedSong = await songsApi.update(id, updates)
      set((state) => ({
        songs: state.songs.map((song) => song.id === id ? updatedSong : song)
      }))
    } catch (error) {
      console.error('Failed to update song:', error)
      throw error
    }
  },
  deleteSong: async (id) => {
    try {
      await songsApi.delete(id)
      set((state) => ({
        songs: state.songs.filter((song) => song.id !== id),
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== id)
      }))
    } catch (error) {
      console.error('Failed to delete song:', error)
      throw error
    }
  },
  getSong: (id) => get().songs.find((song) => song.id === id),
  
  // Playlists
  playlists: [],
  addPlaylist: async (playlistData) => {
    try {
      set({ isLoading: true })
      const newPlaylist = await playlistsApi.create(playlistData)
      set((state) => ({ 
        playlists: [...state.playlists, newPlaylist],
        isLoading: false 
      }))
    } catch (error) {
      console.error('Failed to add playlist:', error)
      set({ isLoading: false })
      throw error
    }
  },
  updatePlaylist: async (id, updates) => {
    try {
      const updatedPlaylist = await playlistsApi.update(id, updates)
      set((state) => ({
        playlists: state.playlists.map((playlist) => 
          playlist.id === id ? updatedPlaylist : playlist
        )
      }))
    } catch (error) {
      console.error('Failed to update playlist:', error)
      throw error
    }
  },
  deletePlaylist: async (id) => {
    try {
      await playlistsApi.delete(id)
      set((state) => ({
        playlists: state.playlists.filter((playlist) => playlist.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete playlist:', error)
      throw error
    }
  },
  addSongToPlaylist: async (playlistId, songId) => {
    try {
      await playlistsApi.addSong(playlistId, songId)
      // Refresh playlist data
      const updatedPlaylist = await playlistsApi.getById(playlistId)
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      }))
    } catch (error) {
      console.error('Failed to add song to playlist:', error)
      throw error
    }
  },
  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      await playlistsApi.removeSong(playlistId, songId)
      // Refresh playlist data
      const updatedPlaylist = await playlistsApi.getById(playlistId)
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      }))
    } catch (error) {
      console.error('Failed to remove song from playlist:', error)
      throw error
    }
  },
  
  // Bookmarks
  bookmarks: [],
  addBookmark: async (songId) => {
    try {
      const newBookmark = await bookmarksApi.create(songId)
      set((state) => ({
        bookmarks: [...state.bookmarks, newBookmark]
      }))
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  },
  removeBookmark: async (songId) => {
    try {
      await bookmarksApi.delete(songId)
      set((state) => ({
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== songId)
      }))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      throw error
    }
  },
  isBookmarked: (songId) => get().bookmarks.some((bookmark) => bookmark.songId === songId),
  
  // Recently Played
  recentlyPlayed: [],
  getRecentlyPlayed: async () => {
    try {
      const recentlyPlayed = await recentlyPlayedApi.getRecentlyPlayed()
      set({ recentlyPlayed })
    } catch (error) {
      console.error('Failed to fetch recently played:', error)
      throw error
    }
  },
  updatePlayCount: async (songId) => {
    try {
      const updatedSong = await recentlyPlayedApi.updatePlayCount(songId)
      // Update the song in the songs list
      set((state) => ({
        songs: state.songs.map((song) => song.id === songId ? updatedSong : song),
        recentlyPlayed: state.recentlyPlayed.map((song) => song.id === songId ? updatedSong : song)
      }))
      // Refresh recently played list (optional, don't fail if this fails)
      get().getRecentlyPlayed().catch((error) => {
        console.warn('Failed to refresh recently played list:', error)
      })
    } catch (error) {
      console.error('Failed to update play count:', error)
      // Don't re-throw the error to prevent breaking the user experience
      // Just log it and continue
    }
  },
  
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
  setCurrentSong: (song) => {
    set((state) => ({
      playerState: { ...state.playerState, currentSong: song, currentTime: 0 }
    }))
    // Update play count when a song starts playing (non-blocking)
    if (song) {
      get().updatePlayCount(song.id).catch((error) => {
        console.warn('Failed to update play count, but continuing playback:', error)
      })
    }
  },
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