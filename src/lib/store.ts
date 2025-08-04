import { create } from 'zustand'
import { Song, Playlist, Bookmark, PlayerState } from '@/types/music'
import { songsApi, playlistsApi, bookmarksApi, recentlyPlayedApi } from './api'
import { getSession } from 'next-auth/react'

interface MusicStore {
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Data initialization
  initializeData: () => Promise<void>
  
  // Songs
  songs: Song[]
  mySongs: Song[]
  addSong: (song: Omit<Song, 'id' | 'uploadedAt'>) => Promise<void>
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  getSong: (id: string) => Song | undefined
  getMySongs: () => Promise<void>
  loadAllSongs: () => Promise<void>
  
  // Playlists
  playlists: Playlist[]
  addPlaylist: (playlist: { name: string; description?: string; coverImage?: string }) => Promise<void>
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>
  addMultipleSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
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
  
  // Playlist playback
  playPlaylist: (playlistId: string, startIndex?: number) => void
  shufflePlaylist: (playlistId: string) => void
  
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
      
      // Check authentication status
      const session = await getSession()
      if (!session) {
        // If not authenticated, load public data (songs and recently played)
        const [songs, recentlyPlayed] = await Promise.all([
          songsApi.getAll(),
          recentlyPlayedApi.getRecentlyPlayed()
        ])
        set({ 
          songs, 
          playlists: [],
          bookmarks: [],
          recentlyPlayed,
          isLoading: false 
        })
        return
      }
      
      // Load all data in parallel for authenticated users
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
  mySongs: [],
  getMySongs: async () => {
    try {
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
      const mySongs = await songsApi.getMySongs()
      set({ mySongs })
    } catch (error) {
      console.error('Failed to fetch my songs:', error)
      throw error
    }
  },
  loadAllSongs: async () => {
    try {
      const allSongs = await songsApi.getAllSongs()
      set({ songs: allSongs })
    } catch (error) {
      console.error('Failed to fetch all songs:', error)
      throw error
    }
  },
  addSong: async (songData) => {
    try {
      set({ isLoading: true })
      const newSong = await songsApi.create(songData)
      set((state) => ({ 
        songs: [...state.songs, newSong],
        mySongs: [...state.mySongs, newSong],
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
        songs: state.songs.map((song) => song.id === id ? updatedSong : song),
        mySongs: state.mySongs.map((song) => song.id === id ? updatedSong : song)
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
        mySongs: state.mySongs.filter((song) => song.id !== id),
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
  addMultipleSongsToPlaylist: async (playlistId, songIds) => {
    try {
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
      // 여러 곡을 순차적으로 추가
      for (const songId of songIds) {
        await playlistsApi.addSong(playlistId, songId)
      }
      // 플레이리스트 데이터 새로고침
      const updatedPlaylist = await playlistsApi.getById(playlistId)
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      }))
    } catch (error) {
      console.error('Failed to add multiple songs to playlist:', error)
      throw error
    }
  },
  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
      const session = await getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
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
        // Clear playlist context when manually setting a song
        currentPlaylist: null,
        playlistQueue: []
      }
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
  playSong: (song) => {
    set((state) => ({
      playerState: {
        ...state.playerState,
        currentSong: song,
        isPlaying: true,
        currentTime: 0,
        // Clear playlist context when manually playing a song
        currentPlaylist: null,
        playlistQueue: []
      }
    }))
    // Update play count (non-blocking)
    get().updatePlayCount(song.id).catch((error) => {
      console.warn('Failed to update play count, but continuing playback:', error)
    })
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
  playNext: () => {
    const state = get()
    const { currentSong, queue, shuffle, repeat, currentPlaylist, playlistQueue } = state.playerState
    
    console.log('playNext called:', {
      currentSong: currentSong?.title,
      currentPlaylist,
      playlistQueueLength: playlistQueue.length,
      queueLength: queue.length,
      shuffle,
      repeat
    })
    
    // Priority 1: Manual queue
    if (queue.length > 0) {
      const nextSongId = queue[0]
      const nextSong = state.getSong(nextSongId)
      if (nextSong) {
        console.log('Playing from manual queue:', nextSong.title)
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
    
    // Priority 2: Repeat current song
    if (repeat === 'one' && currentSong) {
      console.log('Repeating current song:', currentSong.title)
      set((state) => ({
        playerState: { ...state.playerState, currentTime: 0, isPlaying: true }
      }))
      return
    }
    
    // Priority 3: Playlist context
    if (currentPlaylist && playlistQueue.length > 0 && currentSong) {
      const currentIndex = playlistQueue.findIndex(id => id === currentSong.id)
      console.log('Playlist context - current index:', currentIndex, 'of', playlistQueue.length)
      
      if (shuffle) {
        // Shuffle within playlist
        const remainingSongs = playlistQueue.filter(id => id !== currentSong.id)
        if (remainingSongs.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingSongs.length)
          const nextSong = state.getSong(remainingSongs[randomIndex])
          if (nextSong) {
            console.log('Playing shuffled from playlist:', nextSong.title)
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
        // Sequential playlist playback
        const nextIndex = currentIndex + 1
        if (nextIndex < playlistQueue.length) {
          const nextSong = state.getSong(playlistQueue[nextIndex])
          if (nextSong) {
            console.log('Playing next from playlist:', nextSong.title)
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
          // Loop back to beginning of playlist
          const nextSong = state.getSong(playlistQueue[0])
          if (nextSong) {
            console.log('Looping back to start of playlist:', nextSong.title)
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
        } else {
          console.log('End of playlist reached, no repeat')
        }
      }
    }
    
    // Priority 4: General shuffle/repeat all
    if (shuffle || repeat === 'all') {
      const availableSongs = state.songs.filter((song) => song.id !== currentSong?.id)
      if (availableSongs.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSongs.length)
        const nextSong = availableSongs[randomIndex]
        console.log('Playing random from library:', nextSong.title)
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
      console.log('No next song found, stopping playback')
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
  
  // Playlist playback
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
        queue: [], // Clear manual queue when starting playlist
        currentTime: 0
      }
    }))
    
    // Update play count (non-blocking)
    const updateCount = get().updatePlayCount
    setTimeout(() => {
      updateCount(startSong.id).catch(console.warn)
    }, 0)
  },
  
  shufflePlaylist: (playlistId) => {
    const state = get()
    const playlist = state.playlists.find(p => p.id === playlistId)
    
    if (!playlist || playlist.songs.length === 0) return
    
    const playlistSongs = playlist.songs.map(songId => state.getSong(songId)).filter(Boolean) as Song[]
    
    if (playlistSongs.length === 0) return
    
    // Shuffle the songs
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
        queue: [], // Clear manual queue when starting playlist
        shuffle: true,
        currentTime: 0
      }
    }))
    
    // Update play count (non-blocking)
    const updateCount = get().updatePlayCount
    setTimeout(() => {
      updateCount(startSong.id).catch(console.warn)
    }, 0)
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