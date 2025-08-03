import { TrendingSong, TrendingSnapshot, TrendingStats } from '@/types/music'

// const SUPABASE_PROJECT_ID = 'wghfyzkujsxvmdzzdgth' // unused
// const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Types for Supabase responses (commented out as unused)
// interface SupabaseTrendingSong {
//   song_id: string
//   title: string
//   artist: string
//   album: string | null
//   duration: number
//   url: string
//   thumbnail: string | null
//   plays: number
//   liked: boolean
//   current_ranking: number
//   previous_ranking: number
//   ranking_change: number
//   trending_score: number
//   play_increase_percent: number
// }

export const trendingApi = {
  // Get trending songs with comparison data
  getTrendingSongs: async (
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<TrendingSong[]> => {
    try {
      const response = await fetch('/api/trending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period_type: periodType,
          date: date
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trending songs: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.songs || []
    } catch (error) {
      console.error('Error fetching trending songs:', error)
      // Return empty array on error - let the UI handle the error state
      return []
    }
  },

  // Create a trending snapshot
  createSnapshot: async (
    periodType: 'daily' | 'weekly' | 'monthly',
    date?: string
  ): Promise<string> => {
    try {
      const response = await fetch('/api/trending/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period_type: periodType,
          date: date || new Date().toISOString().split('T')[0]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create snapshot: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.snapshot_id
    } catch (error) {
      console.error('Error creating trending snapshot:', error)
      throw error
    }
  },

  // Get available snapshots
  getSnapshots: async (
    periodType?: 'daily' | 'weekly' | 'monthly'
  ): Promise<TrendingSnapshot[]> => {
    try {
      const url = new URL('/api/trending/snapshots', window.location.origin)
      if (periodType) {
        url.searchParams.set('period_type', periodType)
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch snapshots: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.snapshots || []
    } catch (error) {
      console.error('Error fetching snapshots:', error)
      return []
    }
  },

  // Get trending statistics
  getTrendingStats: async (
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<TrendingStats> => {
    try {
      const response = await fetch(`/api/trending/stats?period_type=${periodType}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trending stats: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.stats || {
        totalPlays: 0,
        trendingSongsCount: 0,
        activeListeners: 0,
        periodGrowthPercent: 0
      }
    } catch (error) {
      console.error('Error fetching trending stats:', error)
      // Return default stats on error
      return {
        totalPlays: 0,
        trendingSongsCount: 0,
        activeListeners: 0,
        periodGrowthPercent: 0
      }
    }
  }
}