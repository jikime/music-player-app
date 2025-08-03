"use client"

import { useState, useEffect } from "react"
import { useMusicStore } from "@/lib/store"
import { MusicPlayer } from "@/components/songs/music-player"
import { LoadingScreen } from "@/components/layout/loading-screen"
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                Trending
              </h1>
              <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                Discover what&apos;s hot right now
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-1 md:gap-2 self-start sm:self-auto">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize text-xs md:text-sm px-2 md:px-3"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Stats */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
            <div className="flex items-center gap-3">
              <Headphones className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-bold">{(trendingStats.totalPlays || 0).toLocaleString()}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Total Plays</p>
                {(trendingStats.periodGrowthPercent || 0) !== 0 && (
                  <p className={`text-xs ${(trendingStats.periodGrowthPercent || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(trendingStats.periodGrowthPercent || 0) > 0 ? '+' : ''}{(trendingStats.periodGrowthPercent || 0).toFixed(1)}% from last {selectedPeriod.replace('ly', '')}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 md:w-8 md:h-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-bold">{trendingStats.trendingSongsCount || 0}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Trending Songs</p>
                <p className="text-xs text-muted-foreground">
                  Top songs this {selectedPeriod.replace('ly', '')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 md:p-6 border border-border sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-bold">{(trendingStats.activeListeners || 0).toLocaleString()}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Active Listeners</p>
                <p className="text-xs text-muted-foreground">
                  Estimated unique listeners
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Songs List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-lg md:text-xl font-semibold">Top Trending Songs</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Based on plays, engagement, and growth over the past {selectedPeriod.replace('ly', '')}
            </p>
          </div>
          
          <div className="divide-y divide-border">
            {trendingSongs.map((song) => {
              const rankingChange = getRankingChange(song)
              const isCurrentSong = playerState.currentSong?.id === song.id
              const isPlaying = playerState.isPlaying && isCurrentSong
              
              return (
                <div key={song.id}>
                  {/* Mobile Layout */}
                  <div className="md:hidden p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Ranking & Change */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xl font-bold text-muted-foreground w-6">
                          {song.ranking}
                        </span>
                        {rankingChange && (
                          <div className="flex items-center">
                            {rankingChange.type === 'up' && (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            )}
                            {rankingChange.type === 'down' && (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                        <ImageWithFallback
                          src={song.thumbnail || ''}
                          alt={song.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-sm">{song.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {song.artist}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDuration(song.duration)}</span>
                          <span>{song.plays.toLocaleString()} plays</span>
                          <span className={song.playIncrease > 0 ? 'text-green-500' : song.playIncrease < 0 ? 'text-red-500' : ''}>
                            {song.playIncrease > 0 ? '+' : ''}{Number(song.playIncrease).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8"
                          onClick={() => handlePlaySong(song)}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8"
                          onClick={() => toggleBookmark(song)}
                        >
                          <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
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
                        src={song.thumbnail || ''}
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
                    <div className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
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