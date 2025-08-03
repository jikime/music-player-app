"use client"

import { useState, useEffect } from "react"
import { useMusicStore } from "@/lib/store"
import { MusicPlayer } from "@/components/music-player"
import { LoadingScreen } from "@/components/loading-screen"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Clock,
  Music,
  Heart,
  Plus,
  MoreHorizontal,
  Users,
  Headphones
} from "lucide-react"
import { formatDuration } from "@/lib/music-utils"
import { trendingApi } from "@/lib/trending-api"
import type { TrendingSong, TrendingStats } from "@/types/music"

export default function TrendingPage() {
  const {
    playerState,
    setCurrentSong,
    setIsPlaying,
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [trendingSongs, setTrendingSongs] = useState<TrendingSong[]>([])
  const [trendingStats, setTrendingStats] = useState<TrendingStats>({
    totalPlays: 0,
    trendingSongsCount: 0,
    activeListeners: 0,
    periodGrowthPercent: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trending data when period changes
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch both trending songs and statistics
        const [songsData, statsData] = await Promise.all([
          trendingApi.getTrendingSongs(selectedPeriod),
          trendingApi.getTrendingStats(selectedPeriod)
        ])
        
        setTrendingSongs(songsData || [])
        setTrendingStats(statsData || {
          totalPlays: 0,
          trendingSongsCount: 0,
          activeListeners: 0,
          periodGrowthPercent: 0
        })
      } catch (err) {
        console.error('Failed to fetch trending data:', err)
        setError('Failed to load trending data')
        // Fallback to empty data on error
        setTrendingSongs([])
        setTrendingStats({
          totalPlays: 0,
          trendingSongsCount: 0,
          activeListeners: 0,
          periodGrowthPercent: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingData()
  }, [selectedPeriod])


  const handlePlaySong = (song: TrendingSong) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  const toggleBookmark = (song: TrendingSong) => {
    if (isBookmarked(song.id)) {
      removeBookmark(song.id)
    } else {
      addBookmark(song.id)
    }
  }

  const getRankingChange = (song: TrendingSong) => {
    if (!song.previousRanking || song.rankingChange === 0) return null
    if (song.rankingChange > 0) return { type: 'up', value: song.rankingChange }
    if (song.rankingChange < 0) return { type: 'down', value: Math.abs(song.rankingChange) }
    return { type: 'same', value: 0 }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading trending music..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Trending</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'var(--music-player-height)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Trending
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover what&apos;s hot right now
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-2xl font-bold">{(trendingStats.totalPlays || 0).toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground">Total Plays</p>
                {(trendingStats.periodGrowthPercent || 0) !== 0 && (
                  <p className={`text-xs ${(trendingStats.periodGrowthPercent || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(trendingStats.periodGrowthPercent || 0) > 0 ? '+' : ''}{(trendingStats.periodGrowthPercent || 0).toFixed(1)}% from last {selectedPeriod.replace('ly', '')}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-2xl font-bold">{trendingStats.trendingSongsCount || 0}</h3>
                <p className="text-sm text-muted-foreground">Trending Songs</p>
                <p className="text-xs text-muted-foreground">
                  Top songs this {selectedPeriod.replace('ly', '')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-2xl font-bold">{(trendingStats.activeListeners || 0).toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground">Active Listeners</p>
                <p className="text-xs text-muted-foreground">
                  Estimated unique listeners
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Songs List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Top Trending Songs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Based on plays, engagement, and growth over the past {selectedPeriod.replace('ly', '')}
            </p>
          </div>
          
          <div className="divide-y divide-border">
            {trendingSongs.map((song) => {
              const rankingChange = getRankingChange(song)
              const isCurrentSong = playerState.currentSong?.id === song.id
              const isPlaying = playerState.isPlaying && isCurrentSong
              
              return (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                >
                  {/* Ranking */}
                  <div className="flex items-center gap-3 min-w-[80px]">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      {song.ranking}
                    </span>
                    {rankingChange && (
                      <div className="flex items-center gap-1">
                        {rankingChange.type === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {rankingChange.type === 'down' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        {rankingChange.type !== 'same' && (
                          <span className="text-xs text-muted-foreground">
                            {rankingChange.value}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Play Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePlaySong(song)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <ImageWithFallback
                      src={song.thumbnail}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{song.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist} {song.album && `• ${song.album}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Headphones className="w-4 h-4" />
                      <span>{song.plays.toLocaleString()}</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 ${
                      song.playIncrease > 0 ? 'text-green-500' : 
                      song.playIncrease < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {song.playIncrease > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : song.playIncrease < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      <span>{song.playIncrease > 0 ? '+' : ''}{Number(song.playIncrease).toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(song.duration)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleBookmark(song)}
                    >
                      <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <MusicPlayer />
    </div>
  )
}