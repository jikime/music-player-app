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
    <div className="min-h-screen px-4 md:px-6 music-player-offset">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-4 md:-mx-6 mb-4 md:mb-6">
        <div className="px-4 md:px-6 py-4 md:py-6">
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
      <div className="py-4 md:py-6">
        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-8">
          {/* Total Plays Card */}
          <div className="bg-card rounded-lg p-3 md:p-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 mb-2 md:mb-0">
                <Headphones className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-2xl font-bold text-foreground">
                  {((trendingStats.totalPlays || 0) / 1000).toFixed(0)}k
                </h3>
                <p className="text-xs md:text-base text-muted-foreground font-medium hidden md:block">Total Plays</p>
                <p className="text-xs text-muted-foreground md:hidden">Plays</p>
              </div>
            </div>
          </div>
          
          {/* Trending Songs Card */}
          <div className="bg-card rounded-lg p-3 md:p-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 mb-2 md:mb-0">
                <Music className="w-4 h-4 md:w-6 md:h-6 text-green-500" />
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-2xl font-bold text-foreground">
                  {trendingStats.trendingSongsCount || 0}
                </h3>
                <p className="text-xs md:text-base text-muted-foreground font-medium hidden md:block">Trending Songs</p>
                <p className="text-xs text-muted-foreground md:hidden">Songs</p>
              </div>
            </div>
          </div>
          
          {/* Active Listeners Card */}
          <div className="bg-card rounded-lg p-3 md:p-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 mb-2 md:mb-0">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-2xl font-bold text-foreground">
                  {((trendingStats.activeListeners || 0) / 1000).toFixed(0)}k
                </h3>
                <p className="text-xs md:text-base text-muted-foreground font-medium hidden md:block">Active Listeners</p>
                <p className="text-xs text-muted-foreground md:hidden">Users</p>
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
                      {/* Ranking */}
                      <div className="flex items-center justify-center flex-shrink-0 w-8">
                        <span className="text-xl font-bold text-muted-foreground text-center">
                          {song.ranking}
                        </span>
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
                      <div className="flex-1 min-w-0 max-w-[calc(100vw-260px)]">
                        <h3 className="font-medium truncate text-ellipsis overflow-hidden whitespace-nowrap text-sm">{song.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
                          <span className="truncate">{song.artist}</span>
                          <span className="flex-shrink-0">•</span>
                          <span className="flex-shrink-0">{formatDuration(song.duration)}</span>
                          <div className={`flex items-center gap-0.5 flex-shrink-0 ${song.playIncrease > 0 ? 'text-green-500' : song.playIncrease < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {song.playIncrease > 0 ? (
                              <TrendingUp className="w-2 h-2" />
                            ) : song.playIncrease < 0 ? (
                              <TrendingDown className="w-2 h-2" />
                            ) : null}
                            <span>{Math.abs(Number(song.playIncrease)).toFixed(0)}%</span>
                          </div>
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

                  {/* Desktop Layout - Grid 기반 */}
                  <div className="hidden md:grid md:grid-cols-[4rem_2.5rem_3rem_1fr_8rem] lg:grid-cols-[4rem_2.5rem_3rem_1fr_6rem_4rem_8rem] gap-4 items-center p-4 hover:bg-muted/50 transition-colors group">
                    {/* Ranking */}
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground text-center">
                        {song.ranking}
                      </span>
                    </div>

                    {/* Play Button */}
                    <div className="flex justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePlaySong(song)}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={song.thumbnail || ''}
                        alt={song.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Song Info - 유연한 컬럼 (1fr) */}
                    <div className="min-w-0">
                      <h3 className="font-medium truncate text-ellipsis overflow-hidden whitespace-nowrap">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate text-ellipsis overflow-hidden whitespace-nowrap">
                        {song.artist} {song.album && `• ${song.album}`}
                      </p>
                    </div>

                    {/* Plays */}
                    <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
                      <Headphones className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{song.plays.toLocaleString()}</span>
                    </div>
                    
                    {/* Duration */}
                    <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{formatDuration(song.duration)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleBookmark(song)}
                      >
                        <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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