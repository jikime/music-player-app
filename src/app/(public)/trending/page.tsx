"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useMusicStore } from "@/lib/store"
import { useIsMobile } from "@/hooks/use-mobile"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { AddToPlaylistPopover } from "@/components/songs/add-to-playlist-popover"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Clock,
  Heart,
  Plus,
  Minus,
  Headphones
} from "lucide-react"
import { formatDuration } from "@/lib/music-utils"
import { trendingApi } from "@/lib/trending-api"
import type { TrendingSong } from "@/types/music"

export default function TrendingPage() {
  const { data: session } = useSession()
  const isMobile = useIsMobile()
  const {
    playerState,
    playSong,
    setIsPlaying,
    isBookmarked,
    addBookmark,
    removeBookmark,
    initializeData
  } = useMusicStore()

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [trendingSongs, setTrendingSongs] = useState<TrendingSong[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Fetch trending data when period changes
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch trending songs only
        const songsData = await trendingApi.getTrendingSongs(selectedPeriod)
        setTrendingSongs(songsData || [])
      } catch (err) {
        console.error('Failed to fetch trending data:', err)
        setError('Failed to load trending data')
        // Fallback to empty data on error
        setTrendingSongs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingData()
  }, [selectedPeriod])


  const handlePlaySong = (song: TrendingSong) => {
    if (playerState.currentSong?.id === song.id) {
      // Toggle play/pause for current song
      setIsPlaying(!playerState.isPlaying)
    } else {
      // Play new song
      playSong(song)
    }
  }

  const toggleBookmark = (song: TrendingSong) => {
    if (isBookmarked(song.id)) {
      removeBookmark(song.id)
    } else {
      addBookmark(song.id)
    }
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
    <div className="min-h-screen pb-32 md:pb-28 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Trending</h1>
              <p className="text-muted-foreground">Trending songs this week</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize text-sm"
                >
                  {isMobile ? (
                    period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : 'Month'
                  ) : (
                    period
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Songs List */}
        {trendingSongs.length === 0 ? (
          <div className="text-center py-12 md:py-24 px-4">
            <TrendingUp className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No trending songs yet</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Check back later to see what&apos;s trending in the {selectedPeriod.replace('ly', '')}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {trendingSongs.map((song, index) => {
            const isCurrentSong = playerState.currentSong?.id === song.id
            const isPlaying = playerState.isPlaying && isCurrentSong
            
            return (
              <div key={song.id}>
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <div
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  {/* Ranking */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0 pt-1">
                    <span className="text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  {/* Thumbnail - Clickable */}
                  <div 
                    className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted group/thumb relative"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaySong(song)
                    }}
                  >
                    <ImageWithFallback
                      src={song.thumbnail || ''}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors duration-300" />
                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                      {isCurrentSong && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" fill="currentColor" />
                      ) : (
                        <Play className="w-4 h-4 text-white" fill="currentColor" />
                      )}
                    </div>
                  </div>

                  {/* Song Info + Mobile Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-medium text-sm leading-tight line-clamp-1 mb-1">
                          {song.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {song.artist}
                        </p>
                        
                        {/* Mobile Stats Row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {/* Plays */}
                          <div className="flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            <span>{song.plays.toLocaleString()}</span>
                          </div>
                          
                          {/* Duration */}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(song.duration)}</span>
                          </div>
                          
                          {/* Trend */}
                          <div className={`flex items-center gap-0.5 ${
                            song.playIncrease > 0 ? 'text-green-500' : 
                            song.playIncrease < 0 ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {song.playIncrease > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : song.playIncrease < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            <span className="font-medium">{Math.abs(Number(song.playIncrease)).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      {session && (
                        <div 
                          className="flex items-start flex-shrink-0 pt-1 gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookmark(song)
                            }}
                          >
                            <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                          </Button>
                          <AddToPlaylistPopover song={song}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </AddToPlaylistPopover>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  {/* Ranking */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  {/* Thumbnail - Clickable */}
                  <div 
                    className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted group/thumb relative"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaySong(song)
                    }}
                  >
                    <ImageWithFallback
                      src={song.thumbnail || ''}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors duration-300" />
                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                      {isCurrentSong && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" fill="currentColor" />
                      ) : (
                        <Play className="w-4 h-4 text-white" fill="currentColor" />
                      )}
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base line-clamp-1 leading-tight">
                      {song.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {song.artist}
                    </p>
                  </div>

                  {/* Plays */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Headphones className="w-4 h-4" />
                    <span>{song.plays.toLocaleString()}</span>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(song.duration)}
                  </div>

                  {/* Trend Indicator */}
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      song.playIncrease > 0 ? 'text-green-500' : 
                      song.playIncrease < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {song.playIncrease > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : song.playIncrease < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      <span>{Math.abs(Number(song.playIncrease)).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {session && (
                    <div 
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBookmark(song)
                        }}
                      >
                        <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                      </Button>
                      <AddToPlaylistPopover song={song}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </AddToPlaylistPopover>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}