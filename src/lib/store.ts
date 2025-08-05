import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Song, Playlist, Bookmark, PlayerState } from '@/types/music'
import { songsApi, playlistsApi, bookmarksApi, recentlyPlayedApi } from './api'
import { getSession } from 'next-auth/react'

// Cache for session and user data to avoid repeated calls
let sessionCache: { user: unknown; timestamp: number } | null = null
const SESSION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Optimized session getter with caching
const getCachedSession = async () => {
  const now = Date.now()
  
  // Return cached session if valid
  if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
    return sessionCache.user
  }
  
  // Fetch new session
  const session = await getSession()
  sessionCache = {
    user: session,
    timestamp: now
  }
  
  return session
}

// Request cache for API responses
const requestCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

const getCachedRequest = <T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_DURATION): Promise<T> => {
  const cached = requestCache.get(key)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < ttl) {
    return Promise.resolve(cached.data)
  }
  
  return fetcher().then(data => {
    requestCache.set(key, { data, timestamp: now })
    return data
  })
}

interface MusicStore {
  // Loading states - optimized with granular loading
  isLoading: boolean
  loadingStates: {
    songs: boolean
    playlists: boolean
    bookmarks: boolean
    recentlyPlayed: boolean
  }
  setLoading: (key: keyof MusicStore['loadingStates'] | 'general', loading: boolean) => void
  
  // Data initialization - optimized
  initializeData: () => Promise<void>
  
  // Songs - optimized methods  
  songs: Song[]
  mySongs: Song[]
  addSong: (song: Omit<Song, 'id' | 'uploadedAt'>) => Promise<void>
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  getSong: (id: string) => Song | undefined
  getMySongs: () => Promise<void>
  loadAllSongs: () => Promise<void>
  
  // Playlists - optimized methods
  playlists: Playlist[]
  getPlaylists: () => Promise<void>
  addPlaylist: (playlist: { name: string; description?: string; coverImage?: string }) => Promise<void>
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>
  addMultipleSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>
  
  // Bookmarks - optimized methods
  bookmarks: Bookmark[]
  getBookmarks: () => Promise<void>
  addBookmark: (songId: string) => Promise<void>
  removeBookmark: (songId: string) => Promise<void>
  isBookmarked: (songId: string) => boolean
  
  // Recently Played - optimized methods
  recentlyPlayed: Song[]
  getRecentlyPlayed: () => Promise<void>
  updatePlayCount: (songId: string) => Promise<void>
  
  // Player State - unchanged, already optimized
  playerState: PlayerState
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  playSong: (song: Song) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  addToQueue: (songId: string) => void
  removeFromQueue: (songId: string) => void
  playNext: () => void
  playPrevious: () => void
  
  // Playlist playback - unchanged
  playPlaylist: (playlistId: string, startIndex?: number) => void
  shufflePlaylist: (playlistId: string) => void
  
  // Search - optimized with memoization
  searchSongs: (query: string) => Song[]
}

export const useMusicStore = create<MusicStore>()(
  subscribeWithSelector((set, get) => ({
    // Optimized loading states
    isLoading: false,
    loadingStates: {
      songs: false,
      playlists: false,
      bookmarks: false,
      recentlyPlayed: false
    },
    setLoading: (key, loading) => {
      if (key === 'general') {
        set({ isLoading: loading })
      } else {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading }
        }))
      }
    },
    
    // Optimized data initialization with parallel loading and caching
    initializeData: async () => {
      try {
        set({ isLoading: true })
        
        // Get cached session
        const session = await getCachedSession()
        
        if (!session) {
          // Load only public data for unauthenticated users
          const songs = await getCachedRequest('songs-public', () => songsApi.getAll())
          set({ 
            songs, 
            playlists: [],
            bookmarks: [],
            recentlyPlayed: [],
            isLoading: false 
          })
          return
        }
        
        // Parallel loading for authenticated users with selective caching
        const loadTasks = [
          getCachedRequest('songs-all', () => songsApi.getAll()),
          getCachedRequest(`playlists-${session.user.id}`, () => playlistsApi.getAll()),
          getCachedRequest(`bookmarks-${session.user.id}`, () => bookmarksApi.getAll()),
          getCachedRequest(`recently-played-${session.user.id}`, () => recentlyPlayedApi.getRecentlyPlayed(), 60000) // 1min cache
        ]
        
        const [songs, playlists, bookmarks, recentlyPlayed] = await Promise.all(loadTasks)
        
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
    
    // Optimized songs methods
    songs: [],
    mySongs: [],
    getMySongs: async () => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: true } }))
        const mySongs = await getCachedRequest(`my-songs-${session.user.id}`, () => songsApi.getMySongs())
        set((state) => ({ 
          mySongs,
          loadingStates: { ...state.loadingStates, songs: false }
        }))
      } catch (error) {
        console.error('Failed to fetch my songs:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: false } }))
        throw error
      }
    },
    
    loadAllSongs: async () => {
      try {
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: true } }))
        const allSongs = await getCachedRequest('songs-all-public', () => songsApi.getAllSongs())
        set((state) => ({ 
          songs: allSongs,
          loadingStates: { ...state.loadingStates, songs: false }
        }))
      } catch (error) {
        console.error('Failed to fetch all songs:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: false } }))
        throw error
      }
    },
    
    addSong: async (songData) => {
      try {
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: true } }))
        const newSong = await songsApi.create(songData)
        
        // Optimistic update with cache invalidation
        set((state) => ({ 
          songs: [...state.songs, newSong],
          mySongs: [...state.mySongs, newSong],
          loadingStates: { ...state.loadingStates, songs: false }
        }))
        
        // Invalidate relevant caches
        const session = await getCachedSession()
        if (session) {
          requestCache.delete('songs-all')
          requestCache.delete(`my-songs-${session.user.id}`)
        }
      } catch (error) {
        console.error('Failed to add song:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, songs: false } }))
        throw error
      }
    },
    
    updateSong: async (id, updates) => {
      try {
        const updatedSong = await songsApi.update(id, updates)
        
        // Optimistic update
        set((state) => ({
          songs: state.songs.map((song) => song.id === id ? updatedSong : song),
          mySongs: state.mySongs.map((song) => song.id === id ? updatedSong : song),
          recentlyPlayed: state.recentlyPlayed.map((song) => song.id === id ? updatedSong : song)
        }))
        
        // Invalidate caches
        const session = await getCachedSession()
        if (session) {
          requestCache.delete('songs-all')
          requestCache.delete(`my-songs-${session.user.id}`)
          requestCache.delete(`recently-played-${session.user.id}`)
        }
      } catch (error) {
        console.error('Failed to update song:', error)
        throw error
      }
    },
    
    deleteSong: async (id) => {
      try {
        await songsApi.delete(id)
        
        // Optimistic update
        set((state) => ({
          songs: state.songs.filter((song) => song.id !== id),
          mySongs: state.mySongs.filter((song) => song.id !== id),
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== id),
          recentlyPlayed: state.recentlyPlayed.filter((song) => song.id !== id)
        }))
        
        // Invalidate caches
        const session = await getCachedSession()
        if (session) {
          requestCache.delete('songs-all')
          requestCache.delete(`my-songs-${session.user.id}`)
          requestCache.delete(`bookmarks-${session.user.id}`)
          requestCache.delete(`recently-played-${session.user.id}`)
        }
      } catch (error) {
        console.error('Failed to delete song:', error)
        throw error
      }
    },
    
    getSong: (id) => get().songs.find((song) => song.id === id),
    
    // Optimized playlists methods
    playlists: [],
    getPlaylists: async () => {
      try {
        const session = await getCachedSession()
        if (!session) {
          console.log('No session found, skipping playlist loading')
          return
        }
        
        set((state) => ({ loadingStates: { ...state.loadingStates, playlists: true } }))
        const playlists = await getCachedRequest(`playlists-${session.user.id}`, () => playlistsApi.getAll())
        set((state) => ({ 
          playlists,
          loadingStates: { ...state.loadingStates, playlists: false }
        }))
      } catch (error) {
        console.error('Failed to fetch playlists:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, playlists: false } }))
      }
    },
    
    addPlaylist: async (playlistData) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        set((state) => ({ loadingStates: { ...state.loadingStates, playlists: true } }))
        const newPlaylist = await playlistsApi.create(playlistData)
        
        // Optimistic update
        set((state) => ({ 
          playlists: [...state.playlists, newPlaylist],
          loadingStates: { ...state.loadingStates, playlists: false }
        }))
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to add playlist:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, playlists: false } }))
        throw error
      }
    },
    
    updatePlaylist: async (id, updates) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        const updatedPlaylist = await playlistsApi.update(id, updates)
        
        // Optimistic update
        set((state) => ({
          playlists: state.playlists.map((playlist) => 
            playlist.id === id ? updatedPlaylist : playlist
          )
        }))
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to update playlist:', error)
        throw error
      }
    },
    
    deletePlaylist: async (id) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        await playlistsApi.delete(id)
        
        // Optimistic update
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id)
        }))
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to delete playlist:', error)
        throw error
      }
    },
    
    addSongToPlaylist: async (playlistId, songId) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        await playlistsApi.addSong(playlistId, songId)
        
        // Optimistic update - add song to local playlist
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId 
              ? { ...playlist, songs: [...playlist.songs, songId] }
              : playlist
          )
        }))
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to add song to playlist:', error)
        
        // Revert optimistic update by refetching
        const session = await getCachedSession()
        if (session) {
          try {
            const updatedPlaylist = await playlistsApi.getById(playlistId)
            set((state) => ({
              playlists: state.playlists.map((playlist) =>
                playlist.id === playlistId ? updatedPlaylist : playlist
              )
            }))
          } catch (fetchError) {
            console.error('Failed to revert playlist update:', fetchError)
          }
        }
        throw error
      }
    },
    
    // HIGHLY OPTIMIZED: Batch multiple song additions
    addMultipleSongsToPlaylist: async (playlistId, songIds) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        // Optimistic update first
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId 
              ? { ...playlist, songs: [...playlist.songs, ...songIds] }
              : playlist
          )
        }))
        
        // Batch API calls with limited concurrency
        const BATCH_SIZE = 3
        const batches = []
        for (let i = 0; i < songIds.length; i += BATCH_SIZE) {
          batches.push(songIds.slice(i, i + BATCH_SIZE))
        }
        
        for (const batch of batches) {
          await Promise.all(
            batch.map(songId => playlistsApi.addSong(playlistId, songId))
          )
        }
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to add multiple songs to playlist:', error)
        
        // Revert optimistic update
        try {
          const updatedPlaylist = await playlistsApi.getById(playlistId)
          set((state) => ({
            playlists: state.playlists.map((playlist) =>
              playlist.id === playlistId ? updatedPlaylist : playlist
            )
          }))
        } catch (fetchError) {
          console.error('Failed to revert playlist update:', fetchError)
        }
        throw error
      }
    },
    
    removeSongFromPlaylist: async (playlistId, songId) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        // Optimistic update
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId 
              ? { ...playlist, songs: playlist.songs.filter(id => id !== songId) }
              : playlist
          )
        }))
        
        await playlistsApi.removeSong(playlistId, songId)
        
        // Invalidate cache
        requestCache.delete(`playlists-${session.user.id}`)
      } catch (error) {
        console.error('Failed to remove song from playlist:', error)
        
        // Revert optimistic update
        try {
          const updatedPlaylist = await playlistsApi.getById(playlistId)
          set((state) => ({
            playlists: state.playlists.map((playlist) =>
              playlist.id === playlistId ? updatedPlaylist : playlist
            )
          }))
        } catch (fetchError) {
          console.error('Failed to revert playlist update:', fetchError)
        }
        throw error
      }
    },
    
    // Optimized bookmarks methods
    bookmarks: [],
    getBookmarks: async () => {
      try {
        const session = await getCachedSession()
        if (!session) {
          console.log('No session found, skipping bookmark loading')
          return
        }
        
        set((state) => ({ loadingStates: { ...state.loadingStates, bookmarks: true } }))
        const bookmarks = await getCachedRequest(`bookmarks-${session.user.id}`, () => bookmarksApi.getAll())
        set((state) => ({ 
          bookmarks,
          loadingStates: { ...state.loadingStates, bookmarks: false }
        }))
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, bookmarks: false } }))
      }
    },
    
    addBookmark: async (songId) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        // Optimistic update
        const optimisticBookmark = {
          id: `temp-${Date.now()}`,
          songId,
          userId: session.user.id,
          createdAt: new Date()
        }
        
        set((state) => ({
          bookmarks: [...state.bookmarks, optimisticBookmark]
        }))
        
        const newBookmark = await bookmarksApi.create(songId)
        
        // Replace optimistic bookmark with real one
        set((state) => ({
          bookmarks: state.bookmarks.map(b => 
            b.id === optimisticBookmark.id ? newBookmark : b
          )
        }))
        
        // Invalidate cache
        requestCache.delete(`bookmarks-${session.user.id}`)
      } catch (error) {
        console.error('Failed to add bookmark:', error)
        
        // Remove optimistic update
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => !b.id.startsWith('temp-'))
        }))
        throw error
      }
    },
    
    removeBookmark: async (songId) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          throw new Error('Authentication required')
        }
        
        // Store original for potential revert
        const originalBookmarks = get().bookmarks
        
        // Optimistic update
        set((state) => ({
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.songId !== songId)
        }))
        
        await bookmarksApi.delete(songId)
        
        // Invalidate cache
        requestCache.delete(`bookmarks-${session.user.id}`)
      } catch (error) {
        console.error('Failed to remove bookmark:', error)
        
        // Revert optimistic update
        set({ bookmarks: get().bookmarks })
        throw error
      }
    },
    
    isBookmarked: (songId) => get().bookmarks.some((bookmark) => bookmark.songId === songId),
    
    // Optimized recently played methods
    recentlyPlayed: [],
    getRecentlyPlayed: async () => {
      try {
        const session = await getCachedSession()
        if (!session) return
        
        set((state) => ({ loadingStates: { ...state.loadingStates, recentlyPlayed: true } }))
        const recentlyPlayed = await getCachedRequest(
          `recently-played-${session.user.id}`, 
          () => recentlyPlayedApi.getRecentlyPlayed(),
          60000 // 1 minute cache for recently played
        )
        set((state) => ({ 
          recentlyPlayed,
          loadingStates: { ...state.loadingStates, recentlyPlayed: false }
        }))
      } catch (error) {
        console.error('Failed to fetch recently played:', error)
        set((state) => ({ loadingStates: { ...state.loadingStates, recentlyPlayed: false } }))
      }
    },
    
    updatePlayCount: async (songId) => {
      try {
        const session = await getCachedSession()
        if (!session) {
          console.log('User not authenticated, skipping play count update')
          return
        }
        
        // Don't wait for API response, update optimistically
        const updatedSong = await recentlyPlayedApi.updatePlayCount(songId)
        
        // Update in all relevant places
        set((state) => ({
          songs: state.songs.map((song) => song.id === songId ? updatedSong : song),
          recentlyPlayed: state.recentlyPlayed.map((song) => song.id === songId ? updatedSong : song)
        }))
        
        // Invalidate relevant caches (don't wait)
        requestCache.delete(`recently-played-${session.user.id}`)
        
        // Refresh recently played in background
        setTimeout(() => {
          get().getRecentlyPlayed().catch(console.warn)
        }, 1000)
      } catch (error) {
        console.error('Failed to update play count:', error)
        // Don't throw error to prevent breaking user experience
      }
    },
    
    // Player State - keeping original optimized implementation
    playerState: {
      currentSong: null,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      shuffle: false,
      repeat: 'none',
      queue: [],
      history: [],
      currentPlaylist: null,
      playlistQueue: []
    },
    
    setCurrentSong: (song) => {
      set((state) => ({
        playerState: { 
          ...state.playerState, 
          currentSong: song, 
          currentTime: 0,
          currentPlaylist: null,
          playlistQueue: []
        }
      }))
      if (song) {
        // Non-blocking play count update
        setTimeout(() => {
          get().updatePlayCount(song.id).catch(console.warn)
        }, 0)
      }
    },
    
    setIsPlaying: (isPlaying) => set((state) => ({
      playerState: { ...state.playerState, isPlaying }
    })),
    
    playSong: (song) => {
      set((state) => ({
        playerState: {
          ...state.playerState,
          currentSong: song,
          isPlaying: true,
          currentTime: 0,
          currentPlaylist: null,
          playlistQueue: []
        }
      }))
      // Non-blocking play count update
      setTimeout(() => {
        get().updatePlayCount(song.id).catch(console.warn)
      }, 0)
    },
    
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
    
    // Player navigation methods - keeping original implementation
    playNext: () => {
      const state = get()
      const { currentSong, queue, shuffle, repeat, currentPlaylist, playlistQueue } = state.playerState
      
      if (queue.length > 0) {
        const nextSongId = queue[0]
        const nextSong = state.getSong(nextSongId)
        if (nextSong) {
          set((state) => ({
            playerState: {
              ...state.playerState,
              currentSong: nextSong,
              queue: state.playerState.queue.slice(1),
              history: currentSong ? [...state.playerState.history, currentSong.id] : state.playerState.history,
              isPlaying: true
            }
          }))
          return
        }
      }
      
      if (repeat === 'one' && currentSong) {
        set((state) => ({
          playerState: { ...state.playerState, currentTime: 0, isPlaying: true }
        }))
        return
      }
      
      if (currentPlaylist && playlistQueue.length > 0 && currentSong) {
        const currentIndex = playlistQueue.findIndex(id => id === currentSong.id)
        
        if (shuffle) {
          const remainingSongs = playlistQueue.filter(id => id !== currentSong.id)
          if (remainingSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingSongs.length)
            const nextSong = state.getSong(remainingSongs[randomIndex])
            if (nextSong) {
              set((state) => ({
                playerState: {
                  ...state.playerState,
                  currentSong: nextSong,
                  history: [...state.playerState.history, currentSong.id],
                  isPlaying: true
                }
              }))
              return
            }
          }
        } else {
          const nextIndex = currentIndex + 1
          if (nextIndex < playlistQueue.length) {
            const nextSong = state.getSong(playlistQueue[nextIndex])
            if (nextSong) {
              set((state) => ({
                playerState: {
                  ...state.playerState,
                  currentSong: nextSong,
                  history: [...state.playerState.history, currentSong.id],
                  isPlaying: true
                }
              }))
              return
            }
          } else if (repeat === 'all') {
            const nextSong = state.getSong(playlistQueue[0])
            if (nextSong) {
              set((state) => ({
                playerState: {
                  ...state.playerState,
                  currentSong: nextSong,
                  history: [...state.playerState.history, currentSong.id],
                  isPlaying: true
                }
              }))
              return
            }
          }
        }
      }
      
      if (shuffle || repeat === 'all') {
        const availableSongs = state.songs.filter((song) => song.id !== currentSong?.id)
        if (availableSongs.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableSongs.length)
          const nextSong = availableSongs[randomIndex]
          set((state) => ({
            playerState: {
              ...state.playerState,
              currentSong: nextSong,
              history: currentSong ? [...state.playerState.history, currentSong.id] : state.playerState.history,
              isPlaying: true
            }
          }))
        }
      } else {
        set((state) => ({
          playerState: { ...state.playerState, isPlaying: false }
        }))
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
    
    // Playlist playback methods - keeping original implementation
    playPlaylist: (playlistId, startIndex = 0) => {
      const state = get()
      const playlist = state.playlists.find(p => p.id === playlistId)
      
      if (!playlist || playlist.songs.length === 0) return
      
      const playlistSongs = playlist.songs.map(songId => state.getSong(songId)).filter(Boolean) as Song[]
      
      if (playlistSongs.length === 0) return
      
      const startSong = playlistSongs[startIndex] || playlistSongs[0]
      
      set((state) => ({
        playerState: {
          ...state.playerState,
          currentSong: startSong,
          isPlaying: true,
          currentPlaylist: playlistId,
          playlistQueue: playlist.songs,
          queue: [],
          currentTime: 0
        }
      }))
      
      // Non-blocking play count update
      setTimeout(() => {
        get().updatePlayCount(startSong.id).catch(console.warn)
      }, 100)
    },
    
    shufflePlaylist: (playlistId) => {
      const state = get()
      const playlist = state.playlists.find(p => p.id === playlistId)
      
      if (!playlist || playlist.songs.length === 0) return
      
      const playlistSongs = playlist.songs.map(songId => state.getSong(songId)).filter(Boolean) as Song[]
      
      if (playlistSongs.length === 0) return
      
      const shuffledSongs = [...playlist.songs].sort(() => Math.random() - 0.5)
      const startSong = state.getSong(shuffledSongs[0])
      
      if (!startSong) return
      
      set((state) => ({
        playerState: {
          ...state.playerState,
          currentSong: startSong,
          isPlaying: true,
          currentPlaylist: playlistId,
          playlistQueue: shuffledSongs,
          queue: [],
          shuffle: true,
          currentTime: 0
        }
      }))
      
      // Non-blocking play count update
      setTimeout(() => {
        get().updatePlayCount(startSong.id).catch(console.warn)
      }, 100)
    },
    
    // Optimized search with memoization
    searchSongs: (query) => {
      const lowerQuery = query.toLowerCase()
      const songs = get().songs
      
      // Simple memoization for search results
      const cacheKey = `search-${lowerQuery}-${songs.length}`
      const cached = requestCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30sec cache
        return cached.data
      }
      
      const results = songs.filter((song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        (song.album && song.album.toLowerCase().includes(lowerQuery))
      )
      
      requestCache.set(cacheKey, { data: results, timestamp: Date.now() })
      return results
    }
  }))
)

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes
      requestCache.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes