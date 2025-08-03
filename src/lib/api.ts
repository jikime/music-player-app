import { Song, Playlist, Bookmark } from '@/types/music'

const API_BASE_URL = '/api'

// API Response Types (commented out as unused)
// interface ApiResponse<T> {
//   success?: boolean
//   error?: string
//   message?: string
//   data?: T
// }

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

// Songs API
export const songsApi = {
  // 모든 노래 조회
  getAll: async (): Promise<Song[]> => {
    const response = await fetch(`${API_BASE_URL}/songs`)
    if (!response.ok) {
      throw new Error('Failed to fetch songs')
    }
    const data: SongsResponse = await response.json()
    return data.songs
  },

  // 특정 노래 조회
  getById: async (id: string): Promise<Song> => {
    const response = await fetch(`${API_BASE_URL}/songs/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch song')
    }
    const data: SongResponse = await response.json()
    return data.song
  },

  // 노래 생성
  create: async (songData: Omit<Song, 'id' | 'uploadedAt'>): Promise<Song> => {
    const response = await fetch(`${API_BASE_URL}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(songData),
    })
    if (!response.ok) {
      throw new Error('Failed to create song')
    }
    const data: SongResponse = await response.json()
    return data.song
  },

  // 노래 업데이트
  update: async (id: string, updates: Partial<Song>): Promise<Song> => {
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update song')
    }
    const data: SongResponse = await response.json()
    return data.song
  },

  // 노래 삭제
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete song')
    }
  }
}

// Playlists API
export const playlistsApi = {
  // 모든 플레이리스트 조회
  getAll: async (): Promise<Playlist[]> => {
    const response = await fetch(`${API_BASE_URL}/playlists`)
    if (!response.ok) {
      throw new Error('Failed to fetch playlists')
    }
    const data: PlaylistsResponse = await response.json()
    return data.playlists
  },

  // 특정 플레이리스트 조회
  getById: async (id: string): Promise<Playlist> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch playlist')
    }
    const data: PlaylistResponse = await response.json()
    return data.playlist
  },

  // 플레이리스트 생성
  create: async (playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt' | 'songs'>): Promise<Playlist> => {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playlistData),
    })
    if (!response.ok) {
      throw new Error('Failed to create playlist')
    }
    const data: PlaylistResponse = await response.json()
    return data.playlist
  },

  // 플레이리스트 업데이트
  update: async (id: string, updates: Partial<Playlist>): Promise<Playlist> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update playlist')
    }
    const data: PlaylistResponse = await response.json()
    return data.playlist
  },

  // 플레이리스트 삭제
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete playlist')
    }
  },

  // 플레이리스트에 노래 추가
  addSong: async (playlistId: string, songId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ songId }),
    })
    if (!response.ok) {
      throw new Error('Failed to add song to playlist')
    }
  },

  // 플레이리스트에서 노래 제거
  removeSong: async (playlistId: string, songId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs?songId=${songId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to remove song from playlist')
    }
  }
}

// Recently Played API
export const recentlyPlayedApi = {
  // 최근 재생된 노래들 조회
  getRecentlyPlayed: async (): Promise<Song[]> => {
    const response = await fetch(`${API_BASE_URL}/recently-played`)
    if (!response.ok) {
      throw new Error('Failed to fetch recently played songs')
    }
    const data: SongsResponse = await response.json()
    return data.songs
  },

  // 재생 기록 업데이트 (plays 카운트 증가)
  updatePlayCount: async (songId: string): Promise<Song> => {
    try {
      const response = await fetch(`${API_BASE_URL}/recently-played`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to update play count: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      
      const data: SongResponse = await response.json()
      return data.song
    } catch (error) {
      console.error('Error in updatePlayCount:', error)
      throw error
    }
  }
}

// Bookmarks API
export const bookmarksApi = {
  // 모든 북마크 조회
  getAll: async (): Promise<Bookmark[]> => {
    const response = await fetch(`${API_BASE_URL}/bookmarks`)
    if (!response.ok) {
      throw new Error('Failed to fetch bookmarks')
    }
    const data: BookmarksResponse = await response.json()
    return data.bookmarks
  },

  // 북마크 추가
  create: async (songId: string): Promise<Bookmark> => {
    const response = await fetch(`${API_BASE_URL}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ songId }),
    })
    if (!response.ok) {
      throw new Error('Failed to create bookmark')
    }
    const data: BookmarkResponse = await response.json()
    return data.bookmark
  },

  // 북마크 삭제
  delete: async (songId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/bookmarks?songId=${songId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete bookmark')
    }
  }
}