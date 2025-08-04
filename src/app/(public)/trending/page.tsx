"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useMusicStore } from "@/lib/store"
import { useIsMobile } from "@/hooks/use-mobile"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
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
    <div className="min-h-screen px-4 md:px-6 pb-32 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 md:-mx-6 mb-3 md:mb-6 border-b border-border/50">
        <div className="px-4 md:px-6 py-3 md:py-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold truncate">
                    Trending
                  </h1>
                  <p className="text-muted-foreground text-xs md:text-base leading-tight md:mt-1">
                    Discover what&apos;s hot right now
                  </p>
                </div>
              </div>
              
              {/* Period Selector - Mobile: Stack vertically */}
              <div className="flex flex-col md:flex-row gap-1 md:gap-2 flex-shrink-0">
                {isMobile ? (
                  <div className="flex gap-1">
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                        className="capitalize text-xs px-2 h-7 min-w-[50px]"
                      >
                        {period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : 'Month'}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                        className="capitalize text-sm px-3"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Songs List */}
      <div className="overflow-hidden">
        {trendingSongs.length === 0 ? (
          <div className="text-center py-12 md:py-24 px-4">
            <TrendingUp className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No trending songs yet</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Check back later to see what&apos;s trending in the {selectedPeriod.replace('ly', '')}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 md:space-y-1">
            {trendingSongs.map((song, index) => {
            const isCurrentSong = playerState.currentSong?.id === song.id
            const isPlaying = playerState.isPlaying && isCurrentSong
            
            return (
              <div key={song.id}>
                {isMobile ? (
                  /* Mobile Layout */
                  <div className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Ranking */}
                      <div className="flex items-center justify-center flex-shrink-0 w-7 pt-1">
                        <span className="text-lg font-bold text-muted-foreground text-center">
                          {index + 1}
                        </span>
                      </div>

                      {/* Thumbnail - Clickable */}
                      <div 
                        className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted group/thumb relative cursor-pointer"
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

                      {/* Song Info - 유연한 너비 계산 */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-1">
                          {song.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <span className="truncate flex-shrink">{song.artist}</span>
                          <span className="flex-shrink-0">•</span>
                          <span className="flex-shrink-0">{formatDuration(song.duration)}</span>
                        </div>
                        {/* Trend Indicator */}
                        <div className="flex items-center gap-1">
                          <div className={`flex items-center gap-0.5 text-xs ${song.playIncrease > 0 ? 'text-green-500' : song.playIncrease < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {song.playIncrease > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : song.playIncrease < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            <span className="font-medium">{Math.abs(Number(song.playIncrease)).toFixed(0)}%</span>
                          </div>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Headphones className="w-3 h-3" />
                            <span>{song.plays.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {session && (
                        <div className="flex items-start pt-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookmark(song)
                            }}
                          >
                            <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                /* Desktop Layout - Grid 기반 */
                <div className={`grid gap-4 items-center p-4 hover:bg-muted/50 transition-colors group ${
                  session 
                    ? 'grid-cols-[4rem_3rem_1fr_6rem_6rem_4rem_8rem]' 
                    : 'grid-cols-[4rem_3rem_1fr_6rem_6rem_4rem]'
                }`}>
                  {/* Ranking */}
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground text-center">
                      {index + 1}
                    </span>
                  </div>


                  {/* Thumbnail - Clickable */}
                  <div 
                    className="w-12 h-12 rounded overflow-hidden bg-muted group/thumb relative cursor-pointer"
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

                  {/* Song Info - 유연한 컬럼 (1fr) */}
                  <div className="min-w-0">
                    <h3 className="font-medium truncate text-ellipsis overflow-hidden whitespace-nowrap">{song.title}</h3>
                    <p className="text-sm text-muted-foreground truncate text-ellipsis overflow-hidden whitespace-nowrap">
                      {song.artist} {song.album && `• ${song.album}`}
                    </p>
                  </div>

                  {/* Plays */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Headphones className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{song.plays.toLocaleString()}</span>
                  </div>
                  
                  {/* Duration */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>
                  
                  {/* Trend Indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${
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
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBookmark(song)
                        }}
                      >
                        <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? 'fill-current text-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                )}
              </div>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}