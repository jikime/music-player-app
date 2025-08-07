import { Song, Playlist, Bookmark, Like, SharedSong } from '@/types/music'

const API_BASE_URL = '/api'

// Enhanced request cache with TTL
class RequestCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  
  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }
  
  set<T>(key: string, data: T, ttl = 2 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
  
  // Get cache keys for utility functions
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  // Get cache size for utility functions
  getSize(): number {
    return this.cache.size
  }
}

const cache = new RequestCache()

// Cleanup cache every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000)

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map<string, Promise<unknown>>()

// Enhanced fetch with caching, deduplication, and retry logic
async function enhancedFetch<T>(
  url: string, 
  options: RequestInit = {},
  cacheConfig?: { key?: string; ttl?: number; skipCache?: boolean }
): Promise<T> {
  const cacheKey = cacheConfig?.key || `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`
  
  // Check cache first (for GET requests)
  if (!cacheConfig?.skipCache && (!options.method || options.method === 'GET')) {
    const cached = cache.get<T>(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  // Check for pending identical request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>
  }
  
  // Create request with retry logic
  const requestPromise = retryFetch(url, options, 3)
    .then(async (response) => {
      console.log(`🌐 API Response (${url}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error (${url}):`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log(`✅ API Success (${url}):`, data)
      
      // Cache successful GET responses
      if (!cacheConfig?.skipCache && (!options.method || options.method === 'GET')) {
        cache.set(cacheKey, data, cacheConfig?.ttl)
      }
      
      return data
    })
    .finally(() => {
      pendingRequests.delete(cacheKey)
    })
  
  pendingRequests.set(cacheKey, requestPromise)
  return requestPromise
}

// Retry logic with exponential backoff
async function retryFetch(url: string, options: RequestInit, maxRetries: number): Promise<Response> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      
      throw new Error(`Server error: ${response.status}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) break
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = Math.min(100 * Math.pow(2, attempt), 1000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Request queue for batch operations
class RequestQueue {
  private queue: Array<{ id: string; request: () => Promise<unknown>; resolve: (value: unknown) => void; reject: (error: unknown) => void }> = []
  private processing = false
  private readonly maxConcurrency = 3
  private readonly batchDelay = 50 // ms
  
  async add<T>(id: string, request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ 
        id, 
        request: request as () => Promise<unknown>, 
        resolve: resolve as (value: unknown) => void, 
        reject 
      })
      this.scheduleProcess()
    })
  }
  
  private scheduleProcess() {
    if (this.processing) return
    
    setTimeout(() => this.process(), this.batchDelay)
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    try {
      const batch = this.queue.splice(0, this.maxConcurrency)
      
      await Promise.allSettled(
        batch.map(async ({ request, resolve, reject }) => {
          try {
            const result = await request()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      )
    } finally {
      this.processing = false
      
      // Continue processing if there are more items
      if (this.queue.length > 0) {
        this.scheduleProcess()
      }
    }
  }
}

const requestQueue = new RequestQueue()

// API Response Types
interface SongsResponse {
  songs: Song[]
}

interface SongResponse {
  song: Song
}

interface PlaylistsResponse {
  playlists: Playlist[]
}

interface PlaylistResponse {
  playlist: Playlist
}

interface BookmarksResponse {
  bookmarks: Bookmark[]
}

interface BookmarkResponse {
  bookmark: Bookmark
}

interface LikesResponse {
  likes: Like[]
}

interface LikeResponse {
  like: Like
}

interface SharedSongResponse {
  sharedSong: SharedSong
  song: Song
}

interface SharedSongsResponse {
  sharedSongs: (SharedSong & { song: Song; shareUrl: string })[]
}

interface CreateShareResponse extends SharedSong {
  shareUrl: string
}

// Optimized Songs API
export const songsApi = {
  // Optimized: Get all songs with caching
  getAll: async (): Promise<Song[]> => {
    const data = await enhancedFetch<SongsResponse>(
      `${API_BASE_URL}/songs`,
      {},
      { key: 'songs-all', ttl: 2 * 60 * 1000 } // 2 min cache
    )
    return data.songs
  },

  // Optimized: Get user's songs with caching
  getMySongs: async (): Promise<Song[]> => {
    const data = await enhancedFetch<SongsResponse>(
      `${API_BASE_URL}/songs?myOnly=true`,
      {},
      { key: 'songs-my', ttl: 1 * 60 * 1000 } // 1 min cache
    )
    return data.songs
  },

  // Optimized: Get all public songs with longer cache
  getAllSongs: async (): Promise<Song[]> => {
    const data = await enhancedFetch<SongsResponse>(
      `${API_BASE_URL}/songs?allSongs=true`,
      {},
      { key: 'songs-all-public', ttl: 5 * 60 * 1000 } // 5 min cache for public data
    )
    return data.songs
  },

  // Get specific song with caching
  getById: async (id: string): Promise<Song> => {
    const data = await enhancedFetch<SongResponse>(
      `${API_BASE_URL}/songs/${id}`,
      {},
      { key: `song-${id}`, ttl: 10 * 60 * 1000 } // 10 min cache for individual songs
    )
    return data.song
  },

  // Create song (skip cache, invalidate related caches)
  create: async (songData: Omit<Song, 'id' | 'uploadedAt'>): Promise<Song> => {
    const data = await enhancedFetch<SongResponse>(
      `${API_BASE_URL}/songs`,
      {
        method: 'POST',
        body: JSON.stringify(songData),
      },
      { skipCache: true }
    )
    
    // Invalidate related caches
    cache.delete('songs-all')
    cache.delete('songs-my')
    cache.delete('songs-all-public')
    
    return data.song
  },

  // Update song (skip cache, invalidate related caches)
  update: async (id: string, updates: Partial<Song>): Promise<Song> => {
    // Debug: Log what we're sending to the API
    console.log('🌐 API Client - Sending UPDATE request for song:', id)
    console.log('📤 Update payload:', {
      hasImageData: !!updates.image_data,
      imageDataLength: updates.image_data?.length || 0,
      updateFields: Object.keys(updates),
      payloadSize: JSON.stringify(updates).length
    })
    
    const data = await enhancedFetch<SongResponse>(
      `${API_BASE_URL}/songs/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      { skipCache: true }
    )
    
    // Invalidate specific song cache and related caches
    cache.delete(`song-${id}`)
    cache.delete('songs-all')
    cache.delete('songs-my')
    cache.delete('songs-all-public')
    
    return data.song
  },

  // Delete song (skip cache, invalidate related caches)
  delete: async (id: string): Promise<void> => {
    await enhancedFetch<void>(
      `${API_BASE_URL}/songs/${id}`,
      { method: 'DELETE' },
      { skipCache: true }
    )
    
    // Invalidate all song-related caches
    cache.delete(`song-${id}`)
    cache.delete('songs-all')
    cache.delete('songs-my')
    cache.delete('songs-all-public')
  },

  // Batch search with caching
  search: async (query: string, limit?: number): Promise<Song[]> => {
    const params = new URLSearchParams({ q: query })
    if (limit) params.set('limit', limit.toString())
    
    const data = await enhancedFetch<SongsResponse>(
      `${API_BASE_URL}/songs?${params}`,
      {},
      { key: `search-${query}-${limit || 'all'}`, ttl: 30 * 1000 } // 30s cache for searches
    )
    return data.songs
  }
}

// Optimized Playlists API
export const playlistsApi = {
  // Get all playlists with caching
  getAll: async (): Promise<Playlist[]> => {
    const data = await enhancedFetch<PlaylistsResponse>(
      `${API_BASE_URL}/playlists`,
      {},
      { key: 'playlists-all', ttl: 1 * 60 * 1000 } // 1 min cache
    )
    return data.playlists
  },

  // Get specific playlist with caching
  getById: async (id: string): Promise<Playlist> => {
    const data = await enhancedFetch<PlaylistResponse>(
      `${API_BASE_URL}/playlists/${id}`,
      {},
      { key: `playlist-${id}`, ttl: 2 * 60 * 1000 } // 2 min cache
    )
    return data.playlist
  },

  // Create playlist (skip cache, invalidate related caches)
  create: async (playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt' | 'songs'>): Promise<Playlist> => {
    const data = await enhancedFetch<PlaylistResponse>(
      `${API_BASE_URL}/playlists`,
      {
        method: 'POST',
        body: JSON.stringify(playlistData),
      },
      { skipCache: true }
    )
    
    // Invalidate playlists cache
    cache.delete('playlists-all')
    
    return data.playlist
  },

  // Update playlist (skip cache, invalidate related caches)
  update: async (id: string, updates: Partial<Playlist>): Promise<Playlist> => {
    const data = await enhancedFetch<PlaylistResponse>(
      `${API_BASE_URL}/playlists/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      { skipCache: true }
    )
    
    // Invalidate specific playlist cache and general cache
    cache.delete(`playlist-${id}`)
    cache.delete('playlists-all')
    
    return data.playlist
  },

  // Delete playlist (skip cache, invalidate related caches)
  delete: async (id: string): Promise<void> => {
    await enhancedFetch<void>(
      `${API_BASE_URL}/playlists/${id}`,
      { method: 'DELETE' },
      { skipCache: true }
    )
    
    // Invalidate all playlist-related caches
    cache.delete(`playlist-${id}`)
    cache.delete('playlists-all')
  },

  // Add song to playlist (batched and optimized)
  addSong: async (playlistId: string, songId: string): Promise<void> => {
    return requestQueue.add(`add-song-${playlistId}-${songId}`, async () => {
      await enhancedFetch<void>(
        `${API_BASE_URL}/playlists/${playlistId}/songs`,
        {
          method: 'POST',
          body: JSON.stringify({ songId }),
        },
        { skipCache: true }
      )
      
      // Invalidate playlist caches
      cache.delete(`playlist-${playlistId}`)
      cache.delete('playlists-all')
    })
  },

  // Remove song from playlist (batched and optimized)
  removeSong: async (playlistId: string, songId: string): Promise<void> => {
    return requestQueue.add(`remove-song-${playlistId}-${songId}`, async () => {
      await enhancedFetch<void>(
        `${API_BASE_URL}/playlists/${playlistId}/songs?songId=${songId}`,
        { method: 'DELETE' },
        { skipCache: true }
      )
      
      // Invalidate playlist caches
      cache.delete(`playlist-${playlistId}`)
      cache.delete('playlists-all')
    })
  },

  // Batch add multiple songs to playlist
  addMultipleSongs: async (playlistId: string, songIds: string[]): Promise<void> => {
    const batchSize = 3
    const batches = []
    
    for (let i = 0; i < songIds.length; i += batchSize) {
      batches.push(songIds.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(songId => playlistsApi.addSong(playlistId, songId))
      )
    }
  }
}

// Optimized Recently Played API
export const recentlyPlayedApi = {
  // Get recently played with short cache
  getRecentlyPlayed: async (): Promise<Song[]> => {
    const data = await enhancedFetch<SongsResponse>(
      `${API_BASE_URL}/recently-played`,
      {},
      { key: 'recently-played', ttl: 30 * 1000 } // 30s cache for recent data
    )
    return data.songs
  },

  // Update play count (skip cache, invalidate related caches)
  updatePlayCount: async (songId: string): Promise<Song> => {
    const data = await enhancedFetch<SongResponse>(
      `${API_BASE_URL}/recently-played`,
      {
        method: 'POST',
        body: JSON.stringify({ songId }),
      },
      { skipCache: true }
    )
    
    // Invalidate related caches
    cache.delete('recently-played')
    cache.delete(`song-${songId}`)
    cache.delete('songs-all')
    
    return data.song
  }
}

// Optimized Bookmarks API
export const bookmarksApi = {
  // Get all bookmarks with caching
  getAll: async (): Promise<Bookmark[]> => {
    const data = await enhancedFetch<BookmarksResponse>(
      `${API_BASE_URL}/bookmarks`,
      {},
      { key: 'bookmarks-all', ttl: 1 * 60 * 1000 } // 1 min cache
    )
    return data.bookmarks
  },

  // Create bookmark (skip cache, invalidate related caches)
  create: async (songId: string): Promise<Bookmark> => {
    const data = await enhancedFetch<BookmarkResponse>(
      `${API_BASE_URL}/bookmarks`,
      {
        method: 'POST',
        body: JSON.stringify({ songId }),
      },
      { skipCache: true }
    )
    
    // Invalidate bookmarks cache
    cache.delete('bookmarks-all')
    
    return data.bookmark
  },

  // Delete bookmark (skip cache, invalidate related caches)
  delete: async (songId: string): Promise<void> => {
    await enhancedFetch<void>(
      `${API_BASE_URL}/bookmarks?songId=${songId}`,
      { method: 'DELETE' },
      { skipCache: true }
    )
    
    // Invalidate bookmarks cache
    cache.delete('bookmarks-all')
  }
}

// Optimized Likes API
export const likesApi = {
  // Get all likes with caching
  getAll: async (): Promise<Like[]> => {
    const data = await enhancedFetch<LikesResponse>(
      `${API_BASE_URL}/likes`,
      {},
      { key: 'likes-all', ttl: 1 * 60 * 1000 } // 1 min cache
    )
    return data.likes
  },

  // Create like (skip cache, invalidate related caches)
  create: async (songId: string): Promise<Like> => {
    const data = await enhancedFetch<LikeResponse>(
      `${API_BASE_URL}/likes`,
      {
        method: 'POST',
        body: JSON.stringify({ songId }),
      },
      { skipCache: true }
    )
    
    // Invalidate likes cache
    cache.delete('likes-all')
    
    return data.like
  },

  // Delete like (skip cache, invalidate related caches)
  delete: async (songId: string): Promise<void> => {
    await enhancedFetch<void>(
      `${API_BASE_URL}/likes?songId=${songId}`,
      { method: 'DELETE' },
      { skipCache: true }
    )
    
    // Invalidate likes cache
    cache.delete('likes-all')
  }
}

// Utility functions
export const apiUtils = {
  // Clear all caches
  clearCache: () => {
    cache.clear()
    pendingRequests.clear()
  },
  
  // Clear specific cache by pattern
  clearCacheByPattern: (pattern: string) => {
    const regex = new RegExp(pattern)
    const keys = cache.getKeys()
    
    for (const key of keys) {
      if (regex.test(key)) {
        cache.delete(key)
      }
    }
  },
  
  // Get cache statistics
  getCacheStats: () => {
    return {
      size: cache.getSize(),
      pendingRequests: pendingRequests.size,
      keys: cache.getKeys()
    }
  },
  
  // Preload commonly used data
  preloadData: async () => {
    try {
      await Promise.allSettled([
        songsApi.getAllSongs(),
        playlistsApi.getAll(),
        bookmarksApi.getAll(),
        likesApi.getAll(),
        recentlyPlayedApi.getRecentlyPlayed()
      ])
    } catch (error) {
      console.warn('Failed to preload some data:', error)
    }
  }
}

// Optimized Share API
export const shareApi = {
  // Create a new share link
  create: async (data: {
    songId: string
    title?: string
    description?: string
    isPublic?: boolean
    expiresAt?: Date
  }): Promise<CreateShareResponse> => {
    const response = await enhancedFetch<CreateShareResponse>(
      `${API_BASE_URL}/share`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      { skipCache: true }
    )
    
    // Invalidate share-related caches
    cache.delete('shares-all')
    
    return response
  },

  // Get user's share links
  getAll: async (): Promise<(SharedSong & { song: Song; shareUrl: string })[]> => {
    const data = await enhancedFetch<(SharedSong & { song: Song; shareUrl: string })[]>(
      `${API_BASE_URL}/share`,
      {},
      { key: 'shares-all', ttl: 2 * 60 * 1000 } // 2 min cache
    )
    return data
  },

  // Get shared song by share ID (public access)
  getByShareId: async (shareId: string): Promise<{ sharedSong: SharedSong; song: Song }> => {
    const data = await enhancedFetch<{ sharedSong: SharedSong; song: Song }>(
      `${API_BASE_URL}/share/${shareId}`,
      {},
      { key: `share-${shareId}`, ttl: 5 * 60 * 1000 } // 5 min cache for shared content
    )
    return data
  },

  // Update share settings
  update: async (shareId: string, data: {
    title?: string
    description?: string
    isPublic?: boolean
    expiresAt?: Date
  }): Promise<SharedSong> => {
    const response = await enhancedFetch<SharedSong>(
      `${API_BASE_URL}/share/${shareId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      { skipCache: true }
    )
    
    // Invalidate related caches
    cache.delete('shares-all')
    cache.delete(`share-${shareId}`)
    
    return response
  },

  // Delete share link
  delete: async (shareId: string): Promise<void> => {
    await enhancedFetch<void>(
      `${API_BASE_URL}/share/${shareId}`,
      { method: 'DELETE' },
      { skipCache: true }
    )
    
    // Invalidate related caches
    cache.delete('shares-all')
    cache.delete(`share-${shareId}`)
  }
}

// Export cache instance for external management
export { cache as apiCache }