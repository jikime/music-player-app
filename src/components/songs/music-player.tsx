"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Heart,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Music
} from "lucide-react"
import { useMusicStore } from "@/lib/store"

export function MusicPlayer() {
  const pathname = usePathname()
  
  // Initialize all hooks first
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [hasEnded, setHasEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    playerState,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    playNext,
    // playPrevious, // unused
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()

  // Track if we're currently seeking (drag in progress)
  const [isDragging, setIsDragging] = useState(false)
  
  // Muted state management for autoplay compliance
  const [isMuted, setIsMuted] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)

  // All useEffect hooks must be before the early return
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat
  } = playerState

  // Helper functions that are used in useEffect
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  const startLoadingTimeout = useCallback(() => {
    clearLoadingTimeout()
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Player loading timeout after 15 seconds')
      setError('Loading timeout. Please try again.')
      setIsLoading(false)
      // Reset playerReady to allow retry
      setPlayerReady(false)
    }, 15000)
  }, [clearLoadingTimeout])

  const isValidYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }, [])

  // setPlayerRef callback
  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return
    playerRef.current = player
    console.log('Player ref set:', player)
  }, [])

  // Reset hasEnded when currentSong changes
  useEffect(() => {
    setHasEnded(false)
    setError(null)
    setRetryCount(0)
    setIsMuted(true) // Reset to muted for next song
    setHasUnmuted(false) // Reset unmute flag
    clearLoadingTimeout()
    
    // Validate YouTube URL when song changes
    if (currentSong && !isValidYouTubeUrl(currentSong.url)) {
      setError('Invalid YouTube URL format')
      setIsLoading(false)
      return
    }
    
    // Set loading state when we have a new song
    if (currentSong) {
      setIsLoading(true)
      setPlayerReady(false)
      startLoadingTimeout()
    } else {
      setIsLoading(false)
      setPlayerReady(false)
    }
  }, [currentSong, startLoadingTimeout, clearLoadingTimeout, isValidYouTubeUrl])

  // Reset player ready state when song changes
  useEffect(() => {
    setPlayerReady(false)
    setSeeking(false)
    setIsDragging(false)
    setSeekTime(null)
    setHasEnded(false)
    
    // Cleanup on unmount
    return () => {
      clearLoadingTimeout()
    }
  }, [currentSong, clearLoadingTimeout])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearLoadingTimeout()
    }
  }, [clearLoadingTimeout])
  
  // 프로필은 이제 모달이므로 pathname 체크 제거


  // Retry loading current song
  const retryLoading = () => {
    if (!currentSong || retryCount >= 3) return
    
    console.log(`Retrying to load song (attempt ${retryCount + 1}/3):`, currentSong.title)
    setRetryCount(prev => prev + 1)
    setError(null)
    setIsLoading(true)
    setPlayerReady(false)
    startLoadingTimeout()
  }



  // ReactPlayer event handlers - following demo pattern
  const handleReady = () => {
    try {
      console.log('Player ready')
      setPlayerReady(true)
      setHasEnded(false)
      setIsLoading(false)
      setError(null)
      clearLoadingTimeout()
      
      // Auto-play if store state indicates playing
      console.log('Player ready - current isPlaying state:', isPlaying)
    } catch (error) {
      console.warn('Error in handleReady:', error)
      setError('Player initialization failed')
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    try {
      const player = playerRef.current
      // We only want to update time slider if we are not currently seeking
      if (!player || seeking || isDragging) return

      if (!player.duration) return

      setCurrentTime(player.currentTime)
      
      // Check if we're near the end (within 1 second) and auto-advance
      // This is a fallback for cases where onEnded doesn't fire reliably with YouTube
      if (player.duration > 0 && player.currentTime >= player.duration - 1 && isPlaying && !hasEnded) {
        console.log('Near end detected via timeUpdate, auto-advancing...')
        setHasEnded(true)
        handleEnded()
      }
    } catch (error) {
      console.warn('Error in handleTimeUpdate:', error)
    }
  }

  const handleProgress = () => {
    const player = playerRef.current
    // We only want to update progress if we are not currently seeking
    if (!player || seeking || isDragging || !player.buffered?.length) return

    // This handles buffering progress, not playback progress
  }

  const handleDurationChange = () => {
    const player = playerRef.current
    if (!player) return

    console.log('Duration set:', player.duration)
    setDuration(player.duration)
    
    // Duration is set means the video is loaded
    if (player.duration > 0) {
      setIsLoading(false)
      setError(null)
      clearLoadingTimeout()
    }
  }

  const handleStart = () => {
    console.log('Playback started')
    setPlayerReady(true)
    setHasEnded(false) // Reset ended flag for new song
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
  }

  const handlePlay = () => {
    console.log('Player: onPlay event')
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
    // Only update store state if it's different to prevent loops
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }

  // Separate event handler for when playback is actively running
  const handlePlaying = () => {
    console.log('🎵 Music Player: onPlaying event - actively playing!')
    
    // Auto-unmute after playback is actively running
    if (isMuted && !hasUnmuted) {
      console.log('🔊 Auto-unmuting after playback is actively running')
      setTimeout(() => {
        setIsMuted(false)
        setHasUnmuted(true)
      }, 500) // Shorter delay when actively playing
    }
  }

  const handlePause = () => {
    console.log('Player: onPause event')
    // Only update store state if it's different to prevent loops
    if (isPlaying) {
      setIsPlaying(false)
    }
  }

  // const handleSeeking = (seconds: number) => {
  //   setSeeking(true)
  // }

  // const handleSeeked = (seconds: number) => {
  //   setSeeking(false)
  // }

  const handleRateChange = () => {
    const player = playerRef.current
    if (!player) return
  }

  const handleEnded = () => {
    if (hasEnded) return // Prevent duplicate calls
    
    console.log('Playback ended for:', currentSong?.title)
    console.log('Current player state:', {
      currentPlaylist: playerState.currentPlaylist,
      playlistQueue: playerState.playlistQueue,
      repeat,
      shuffle
    })
    
    setHasEnded(true)
    // playNext already handles repeat logic, so we just call it
    playNext()
  }

  const handleLoadStart = () => {
    console.log('Loading started')
    setIsLoading(true)
    setError(null)
    startLoadingTimeout()
  }

  const handleError = (error: unknown) => {
    console.error('YouTube Player Error:', error)
    clearLoadingTimeout()
    setIsLoading(false)
    
    // Determine error type and set appropriate message
    let errorMessage = 'Playback failed'
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: number }).code : undefined
    
    if (errorCode === 2) {
      errorMessage = 'Invalid video ID'
    } else if (errorCode === 5) {
      errorMessage = 'Video not supported on HTML5 player'
    } else if (errorCode === 100) {
      errorMessage = 'Video not found or private'
    } else if (errorCode === 101 || errorCode === 150) {
      errorMessage = 'Video not allowed to be played in embedded players'
    }
    
    setError(errorMessage)
    
    // Attempt retry for recoverable errors (not for video not found/private)
    if (retryCount < 3 && errorCode !== 100 && errorCode !== 101 && errorCode !== 150) {
      console.log('Attempting retry due to recoverable error')
      setTimeout(retryLoading, 2000) // Retry after 2 seconds
    }
  }

  // const handleBuffer = () => {
  //   // Buffering started
  // }

  // const handleBufferEnd = () => {
  //   // Buffering ended
  // }

  const handleSeekStart = () => {
    setSeeking(true)
    setIsDragging(true)
  }

  const handleSeekChange = (value: number[]) => {
    if (!isDragging) {
      // First time this is called during a drag - start seeking
      handleSeekStart()
    }
    
    const played = value[0] / 100
    const newSeekTime = played * duration
    
    // Only update seekTime, don't actually seek yet
    setSeekTime(newSeekTime)
  }

  const handleSeekCommit = (value: number[]) => {
    setSeeking(false)
    setIsDragging(false)
    
    const played = value[0] / 100
    const finalSeekTime = played * duration
    
    if (playerRef.current && duration > 0) {
      try {
        console.log('Seeking to:', Math.floor(finalSeekTime), 'seconds')
        playerRef.current.currentTime = finalSeekTime
      } catch (error) {
        console.error('Seek error:', error)
      }
    }
    
    // Clear seekTime so we go back to using currentTime
    setSeekTime(null)
  }

  // Previous/Next functionality - 5 second seek
  const handlePrevious = () => {
    if (!playerRef.current || duration === 0) return
    
    const actualCurrentTime = seeking && seekTime !== null ? seekTime : currentTime
    const newTime = Math.max(0, actualCurrentTime - 5)
    
    console.log('Seeking backward 5s to:', Math.floor(newTime), 'seconds')
    playerRef.current.currentTime = newTime
  }

  const handleNext = () => {
    if (!playerRef.current || duration === 0) return
    
    const actualCurrentTime = seeking && seekTime !== null ? seekTime : currentTime
    const newTime = Math.min(duration, actualCurrentTime + 5)
    
    console.log('Seeking forward 5s to:', Math.floor(newTime), 'seconds')
    playerRef.current.currentTime = newTime
  }




  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const toggleBookmark = () => {
    if (currentSong) {
      if (isBookmarked(currentSong.id)) {
        removeBookmark(currentSong.id)
      } else {
        addBookmark(currentSong.id)
      }
    }
  }

  const formatTime = (seconds: number | undefined) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Hide music player on share pages
  if (pathname.startsWith('/share/')) {
    return null
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background backdrop-blur-md z-50 safe-area-inset-bottom">
      {/* Hidden React Player */}
      {currentSong && (
        <ReactPlayer
          ref={setPlayerRef}
          className="react-player"
          src={currentSong.url}
          playing={playerReady && isPlaying && !isLoading}
          volume={volume}
          muted={isMuted}
          width="1px"
          height="1px"
          style={{ opacity: 0, position: 'absolute', top: '-9999px' }}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                showinfo: 0,
                mute: 1  // YouTube requires mute for autoplay
              }
            }
          }}
          onLoadStart={handleLoadStart}
          onReady={handleReady}
          onStart={handleStart}
          onPlay={handlePlay}
          onPause={handlePause}
          onPlaying={handlePlaying}
          onRateChange={handleRateChange}
          onEnded={handleEnded}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onDurationChange={handleDurationChange}
        />
      )}

      {/* Mobile Layout: Stacked */}
      <div className="md:hidden p-2 space-y-2">
        {/* Top Row: Song Info + Play Button */}
        <div className="flex items-center gap-2">
          {currentSong ? (
            <>
              <ImageWithFallback
                src={currentSong.thumbnail || "/placeholder.svg"}
                alt={currentSong.title}
                width={48}
                height={48}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate text-sm">{currentSong.title}</h4>
                {error ? (
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-destructive truncate">{error}</p>
                    {retryCount < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 text-xs text-destructive hover:text-destructive/80"
                        onClick={retryLoading}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ) : isLoading ? (
                  <p className="text-xs text-muted-foreground truncate">Loading...</p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-9 h-9 ${isBookmarked(currentSong.id) ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                  onClick={toggleBookmark}
                >
                  <Heart className={`w-4 h-4 ${isBookmarked(currentSong.id) ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => {
                    if (currentSong && !error) {
                      setIsPlaying(!isPlaying)
                    }
                  }}
                  disabled={!currentSong || isLoading || !!error}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-muted-foreground text-sm">No song selected</h4>
                <p className="text-xs text-muted-foreground/70">Add a YouTube link to start playing</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(seeking && seekTime !== null ? seekTime : currentTime)}
          </span>
          <Slider 
            value={[duration > 0 ? ((seeking && seekTime !== null ? seekTime : currentTime) / duration) * 100 : 0]} 
            max={100} 
            step={0.1}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="flex-1" 
            disabled={!currentSong || !playerReady || isLoading || !!error}
          />
          <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-9 h-9 ${shuffle ? 'text-accent' : 'text-muted-foreground'} hover:text-foreground`}
            onClick={toggleShuffle}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground"
            onClick={handlePrevious}
            disabled={!currentSong}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground"
            onClick={handleNext}
            disabled={!currentSong}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-9 h-9 ${repeat !== 'none' ? 'text-accent' : 'text-muted-foreground'} hover:text-foreground relative`}
            onClick={toggleRepeat}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-xs bg-accent text-accent-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">1</span>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Layout: Single Row */}
      <div className="hidden md:flex items-center gap-4 p-4">
        {/* Current Song */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {currentSong ? (
            <>
              <ImageWithFallback
                src={currentSong.thumbnail || "/placeholder.svg"}
                alt={currentSong.title}
                width={60}
                height={60}
                className="w-15 h-15 rounded object-cover"
              />
              <div className="min-w-0">
                <h4 className="font-medium text-foreground truncate">{currentSong.title}</h4>
                {error ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-destructive truncate">{error}</p>
                    {retryCount < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs text-destructive hover:text-destructive/80"
                        onClick={retryLoading}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ) : isLoading ? (
                  <p className="text-sm text-muted-foreground truncate">Loading...</p>
                ) : (
                  <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${isBookmarked(currentSong.id) ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                onClick={toggleBookmark}
              >
                <Heart className={`w-4 h-4 ${isBookmarked(currentSong.id) ? 'fill-current' : ''}`} />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-15 h-15 rounded bg-muted/50 flex items-center justify-center">
                <Music className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">No song selected</h4>
                <p className="text-sm text-muted-foreground/70">Add a YouTube link to start playing</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${shuffle ? 'text-accent' : 'text-muted-foreground'} hover:text-foreground`}
              onClick={toggleShuffle}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={handlePrevious}
              disabled={!currentSong}
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              onClick={() => {
                if (currentSong && !error) {
                  setIsPlaying(!isPlaying)
                }
              }}
              disabled={!currentSong || isLoading || !!error}
            >
              {isLoading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={handleNext}
              disabled={!currentSong}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${repeat !== 'none' ? 'text-accent' : 'text-muted-foreground'} hover:text-foreground relative`}
              onClick={toggleRepeat}
            >
              <Repeat className="w-4 h-4" />
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-xs">1</span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-muted-foreground">
              {formatTime(seeking && seekTime !== null ? seekTime : currentTime)}
            </span>
            <Slider 
              value={[duration > 0 ? ((seeking && seekTime !== null ? seekTime : currentTime) / duration) * 100 : 0]} 
              max={100} 
              step={0.1}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              className="flex-1" 
              disabled={!currentSong || !playerReady || isLoading || !!error}
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (isMuted || volume === 0) {
                setIsMuted(false)
                setHasUnmuted(true)
                setVolume(volume === 0 ? 0.7 : volume)
              } else {
                setVolume(0)
              }
            }}
          >
            {(isMuted || volume === 0) ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider 
            value={[isMuted ? 0 : volume * 100]} 
            max={100} 
            step={1}
            onValueChange={(value) => {
              const newVolume = value[0] / 100
              setVolume(newVolume)
              if (newVolume > 0 && isMuted) {
                setIsMuted(false)
                setHasUnmuted(true)
              }
            }}
            className="w-24" 
          />
        </div>
      </div>
    </div>
  )
}