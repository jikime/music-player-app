"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  ExternalLink,
  RotateCcw
} from 'lucide-react'
import { Song } from '@/types/music'
import { cn } from '@/lib/utils'

interface VinylPlayerProps {
  song: Song
  autoPlay?: boolean
  showControls?: boolean
  size?: 'md' | 'lg' | 'xl'
  className?: string
}

const sizeConfig = {
  md: {
    container: 'w-80 h-80',
    vinyl: 'w-64 h-64',
    controls: 'w-80'
  },
  lg: {
    container: 'w-96 h-96',
    vinyl: 'w-80 h-80',
    controls: 'w-96'
  },
  xl: {
    container: 'w-[32rem] h-[32rem]',
    vinyl: 'w-[28rem] h-[28rem]',
    controls: 'w-[32rem]'
  }
}

export function VinylPlayer({ 
  song, 
  autoPlay = false, 
  showControls = true,
  size = 'lg',
  className 
}: VinylPlayerProps) {
  // 기존 MusicPlayer와 동일한 상태 관리
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // Start with false, set after ready
  const [seeking, setSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [hasEnded, setHasEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Player state
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // URL state management - Initialize immediately with song URL if available
  const [src, setSrc] = useState<string | undefined>(song?.url)
  
  // Muted state - start muted for autoplay, then unmute
  const [isMuted, setIsMuted] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)

  // Track if we're currently seeking (drag in progress)
  const [isDragging, setIsDragging] = useState(false)

  const config = sizeConfig[size]

  // 기존 MusicPlayer의 helper functions 복사
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  const startLoadingTimeout = useCallback(() => {
    clearLoadingTimeout()
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Vinyl Player loading timeout after 15 seconds')
      setError('Loading timeout. Please try again.')
      setIsLoading(false)
      setPlayerReady(false)
    }, 15000)
  }, [clearLoadingTimeout])

  const isValidYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }, [])

  // Load URL function (like demo)
  const loadSong = useCallback((songUrl?: string) => {
    console.log('🎵 Loading song URL:', songUrl)
    setSrc(songUrl)
    setCurrentTime(0)
    setDuration(0)
    setHasEnded(false)
    setError(null)
  }, [])

  // setPlayerRef callback
  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return
    playerRef.current = player
    console.log('Vinyl Player ref set:', player)
  }, [])

  // Update src when song prop changes
  useEffect(() => {
    console.log('🔄 Song prop changed:', { 
      title: song?.title,
      url: song?.url,
      currentSrc: src 
    })
    
    // Reset states
    setHasEnded(false)
    setError(null)
    setRetryCount(0)
    setIsPlaying(false)
    setIsMuted(true) // Reset to muted for next song
    setHasUnmuted(false) // Reset unmute flag
    clearLoadingTimeout()
    
    if (!song || !song.url) {
      console.log('❌ No song or URL provided')
      setSrc(undefined)
      setIsLoading(false)
      setPlayerReady(false)
      return
    }
    
    if (!isValidYouTubeUrl(song.url)) {
      console.log('❌ Invalid YouTube URL:', song.url)
      setError('Invalid YouTube URL format')
      setIsLoading(false)
      setSrc(undefined)
      return
    }
    
    // Only update src if it's different
    if (src !== song.url) {
      console.log('✅ Setting new src:', song.url)
      setSrc(song.url)
      setIsLoading(true)
      setPlayerReady(false)
      startLoadingTimeout()
    }
  }, [song, src, startLoadingTimeout, clearLoadingTimeout, isValidYouTubeUrl])

  // Separate useEffect to monitor src changes
  useEffect(() => {
    console.log('📊 src state updated:', src)
    if (src) {
      console.log('🎬 ReactPlayer should now load:', src)
    }
  }, [src])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLoadingTimeout()
    }
  }, [clearLoadingTimeout])

  // 기존 MusicPlayer 이벤트 핸들러들 복사
  const retryLoading = () => {
    if (!song || retryCount >= 3) return
    
    console.log(`🔄 Retrying to load song (attempt ${retryCount + 1}/3):`, song.title)
    setRetryCount(prev => prev + 1)
    setError(null)
    setIsLoading(true)
    setPlayerReady(false)
    // Reload the song URL
    setTimeout(() => {
      loadSong(song.url)
    }, 100)
    startLoadingTimeout()
  }

  const handleReady = () => {
    console.log('✅ Vinyl Player: onReady event - Player is ready!')
    setPlayerReady(true)
    setHasEnded(false)
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
    
    console.log('🎵 Player ready state:', {
      src,
      autoPlay,
      hasEnded,
      isPlaying
    })
    
    // Auto-play if enabled - more robust timing
    if (autoPlay && !hasEnded) {
      console.log('🚀 Auto-playing on ready')
      // Give the player more time to fully initialize
      setTimeout(() => {
        console.log('🎬 Setting isPlaying to true for autoplay')
        setIsPlaying(true)
      }, 300)
    }
  }

  const handleTimeUpdate = () => {
    try {
      const player = playerRef.current
      if (!player || seeking || isDragging) return

      if (!player.duration) return

      setCurrentTime(player.currentTime)
      
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
    if (!player || seeking || isDragging || !player.buffered?.length) return
  }

  const handleDurationChange = () => {
    const player = playerRef.current
    if (!player) return

    console.log('✅ Duration set:', player.duration, '- Player is ready!')
    setDuration(player.duration)
    
    if (player.duration > 0) {
      // Player is ready when duration is set
      setPlayerReady(true)
      setIsLoading(false)
      setError(null)
      clearLoadingTimeout()
      
      // Auto-play if enabled - only if not already playing
      if (autoPlay && !hasEnded && !isPlaying) {
        console.log('🚀 Auto-playing after duration set')
        setTimeout(() => {
          console.log('🎬 Setting isPlaying to true after duration set')
          setIsPlaying(true)
        }, 200)
      }
    }
  }

  const handleStart = () => {
    console.log('🎬 Vinyl Player: onStart event - Playback started!')
    setPlayerReady(true)
    setHasEnded(false)
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
  }

  const handlePlay = () => {
    console.log('🎵 YouTube Player: onPlay event triggered!')
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }

  // Separate event handler for when playback actually starts playing (not just buffering)
  const handlePlaying = () => {
    console.log('🎵 YouTube Player: onPlaying event - actively playing!')
    // Note: Auto-unmuting removed to comply with Chrome 66+ autoplay policy
    // Users must manually interact with volume controls to unmute
  }

  const handlePause = () => {
    console.log('⏸️ YouTube Player: onPause event triggered!')
    if (isPlaying) {
      setIsPlaying(false)
    }
  }

  const handleRateChange = () => {
    const player = playerRef.current
    if (!player) return
    console.log('⚡ Playback rate changed')
  }

  const handleEnded = () => {
    if (hasEnded) return
    
    console.log('Playback ended for:', song?.title)
    setHasEnded(true)
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleLoadStart = () => {
    console.log('🎬 ReactPlayer: Loading started for URL:', src)
    setIsLoading(true)
    setError(null)
    startLoadingTimeout()
  }

  const handleError = (error: unknown) => {
    console.error('💥 YouTube Player Error:', error)
    clearLoadingTimeout()
    setIsLoading(false)
    
    let errorMessage = 'Playback failed'
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: number }).code : undefined
    
    console.log('🔍 Error code analysis:', { errorCode, src })
    
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
    
    if (retryCount < 3 && errorCode !== 100 && errorCode !== 101 && errorCode !== 150) {
      console.log('🔄 Attempting retry due to recoverable error')
      setTimeout(retryLoading, 2000)
    }
  }

  const handleSeekStart = () => {
    setSeeking(true)
    setIsDragging(true)
  }

  const handleSeekChange = (value: number[]) => {
    if (!isDragging) {
      handleSeekStart()
    }
    
    const played = value[0] / 100
    const newSeekTime = played * duration
    
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
    
    setSeekTime(null)
  }

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
    setVolume(value[0] / 100)
  }

  const togglePlayPause = () => {
    console.log('🎵 Toggle play/pause clicked - current state:', {
      isPlaying,
      playerReady,
      isLoading,
      duration,
      currentTime,
      songUrl: song?.url
    })
    
    // Ensure player is ready before toggling
    if (playerReady && !isLoading && duration > 0) {
      setIsPlaying(!isPlaying)
    } else {
      console.log('⚠️ Player not ready for toggle:', { playerReady, isLoading, duration })
    }
  }

  const restart = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(true)
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

  // Log render state
  console.log('🖼️ VinylPlayer render:', {
    src,
    playerReady,
    isPlaying,
    isLoading,
    error,
    song: song?.title
  })

  return (
    <div className={cn('flex flex-col items-center space-y-6 p-6', className)}>
      {/* Hidden React Player - YouTube 전용 */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {src && (
          <ReactPlayer
            ref={setPlayerRef}
            key={src}
            className="react-player"
            src={src}
            playing={playerReady && isPlaying && !isLoading && duration > 0}
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
                  mute: isMuted ? 1 : 0  // Dynamic mute based on state
                }
              }
            }}
            onReady={handleReady}
            onStart={handleStart}
            onPlay={handlePlay}
            onPause={handlePause}
            onPlaying={handlePlaying}
            onWaiting={() => console.log('⏳ onWaiting (buffering)')}
            onEnded={handleEnded}
            onError={handleError}
            onTimeUpdate={handleTimeUpdate}
            onProgress={handleProgress}
            onDurationChange={handleDurationChange}
            onRateChange={handleRateChange}
          />
        )}
      </div>

      {/* Vinyl Record Display */}
      <div className={cn('relative', config.container)}>
        {/* Background gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-full blur-xl opacity-50" />
        
        {/* Main Vinyl Record */}
        <div className="relative flex items-center justify-center h-full">
          {/* Vinyl Record Base */}
          <div 
            className={cn(
              'relative rounded-full shadow-2xl transition-all duration-300 ease-out overflow-hidden',
              config.vinyl,
              isPlaying && 'animate-spin shadow-2xl shadow-primary/30'
            )}
            style={{
              animationDuration: isPlaying ? '4s' : '0s',
              animationTimingFunction: 'linear',
              animationIterationCount: isPlaying ? 'infinite' : 'initial',
              background: `
                radial-gradient(circle at center, #1a1a1a 15%, transparent 15.5%),
                radial-gradient(circle at center, #000 25%, #1a1a1a 25.5%, #1a1a1a 35%, #000 35.5%),
                radial-gradient(circle at center, #1a1a1a 45%, #000 45.5%, #000 55%, #1a1a1a 55.5%),
                radial-gradient(circle at center, #000 65%, #1a1a1a 65.5%, #1a1a1a 75%, #000 75.5%),
                radial-gradient(circle at center, #1a1a1a 85%, #000 85.5%),
                linear-gradient(45deg, #000 0%, #1a1a1a 25%, #000 50%, #1a1a1a 75%, #000 100%)
              `
            }}
          >
            {/* Album Art Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full overflow-hidden shadow-inner border-4 border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={song.thumbnail || "/placeholder.svg"}
                alt={song.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>

            {/* Center Spindle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 shadow-inner">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-800" />
            </div>

            {/* Vinyl Shine Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Tonearm */}
          <div className="absolute top-8 right-8 origin-bottom-left">
            <div 
              className={cn(
                "w-32 h-2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-600 rounded-full shadow-lg transform transition-transform duration-700 ease-in-out",
                isPlaying ? "rotate-12" : "rotate-0"
              )}
            >
              {/* Tonearm Head */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-600 rounded-full shadow-sm">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full" />
              </div>
              
              {/* Tonearm Base */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-700 rounded-full shadow-inner">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground truncate">{song.title}</h2>
        <p className="text-lg text-muted-foreground truncate">{song.artist}</p>
        {song.album && (
          <p className="text-sm text-muted-foreground/70 truncate">{song.album}</p>
        )}
        
        {/* Muted Status Indicator */}
        {isMuted && isPlaying && (
          <div className="flex items-center justify-center space-x-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <VolumeX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Video is muted. Use volume controls to unmute.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive font-medium">{error}</p>
          {retryCount < 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-destructive hover:text-destructive/80"
              onClick={retryLoading}
            >
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Controls */}
      {showControls && !error && (
        <div className={cn('space-y-4', config.controls)}>
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[duration > 0 ? ((seeking && seekTime !== null ? seekTime : currentTime) / duration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              className="w-full"
              disabled={!playerReady || duration === 0}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(seeking && seekTime !== null ? seekTime : currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={restart}
              disabled={!playerReady}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={!playerReady}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              disabled={!playerReady || isLoading}
              className="w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!playerReady}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // User interaction to unmute (Chrome 66+ compliance)
                if (isMuted) {
                  console.log('🔊 User clicked to unmute - Chrome 66+ compliance')
                  setIsMuted(false)
                  setHasUnmuted(true)
                  setVolume(volume === 0 ? 0.7 : volume)
                  
                  // Also try to unmute via player ref
                  if (playerRef.current && playerRef.current.muted !== undefined) {
                    try {
                      playerRef.current.muted = false
                      console.log('🔊 Directly unmuted player via ref')
                    } catch (e) {
                      console.log('⚠️ Could not directly unmute player:', e)
                    }
                  }
                } else if (volume === 0) {
                  setVolume(0.7)
                } else {
                  setVolume(0)
                }
              }}
              className="text-muted-foreground hover:text-foreground"
              title={isMuted ? "Click to unmute (required for autoplay)" : volume === 0 ? "Unmute" : "Mute"}
            >
              {(isMuted || volume === 0) ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                // Left mute button - same logic as main mute button
                if (isMuted) {
                  console.log('🔊 Left button: User clicked to unmute - Chrome 66+ compliance')
                  setIsMuted(false)
                  setHasUnmuted(true)
                  setVolume(volume === 0 ? 0.7 : volume)
                  
                  // Also try to unmute via player ref
                  if (playerRef.current && playerRef.current.muted !== undefined) {
                    try {
                      playerRef.current.muted = false
                      console.log('🔊 Left button: Directly unmuted player via ref')
                    } catch (e) {
                      console.log('⚠️ Left button: Could not directly unmute player:', e)
                    }
                  }
                } else if (volume === 0) {
                  setVolume(0.7)
                } else {
                  // Mute
                  setVolume(0)
                }
              }}
              title={(isMuted || volume === 0) ? "Unmute" : "Mute"}
            >
              {(isMuted || volume === 0) ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => {
                const newVolume = value[0] / 100
                console.log('🔊 User interacted with volume slider - Chrome 66+ compliance')
                setVolume(newVolume)
                // User interaction with slider unmutes (Chrome 66+ compliance)
                if (newVolume > 0 && isMuted) {
                  setIsMuted(false)
                  setHasUnmuted(true)
                  
                  // Also try to unmute via player ref
                  if (playerRef.current && playerRef.current.muted !== undefined) {
                    try {
                      playerRef.current.muted = false
                      console.log('🔊 Directly unmuted player via ref (slider)')
                    } catch (e) {
                      console.log('⚠️ Could not directly unmute player via slider:', e)
                    }
                  }
                }
              }}
              className="flex-1"
              disabled={false}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                // Right unmute button - same logic as main mute button
                if (isMuted) {
                  console.log('🔊 Right button: User clicked to unmute - Chrome 66+ compliance')
                  setIsMuted(false)
                  setHasUnmuted(true)
                  setVolume(volume === 0 ? 0.7 : volume)
                  
                  // Also try to unmute via player ref
                  if (playerRef.current && playerRef.current.muted !== undefined) {
                    try {
                      playerRef.current.muted = false
                      console.log('🔊 Right button: Directly unmuted player via ref')
                    } catch (e) {
                      console.log('⚠️ Right button: Could not directly unmute player:', e)
                    }
                  }
                } else if (volume === 0) {
                  setVolume(0.7)
                } else {
                  // Mute
                  setVolume(0)
                }
              }}
              title={(isMuted || volume === 0) ? "Unmute" : "Mute"}
            >
              {(isMuted || volume === 0) ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="flex items-center justify-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {song.url && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => window.open(song.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Original
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}