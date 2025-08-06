"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { VinylRecord } from './vinyl-record'
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
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const config = sizeConfig[size]

  // Helper functions (copied from MusicPlayer)
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  const startLoadingTimeout = useCallback(() => {
    clearLoadingTimeout()
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('🕒 Vinyl Player loading timeout after 15 seconds')
      setError('Loading timeout. Please try again.')
      setIsLoading(false)
      setPlayerReady(false)
    }, 15000)
  }, [clearLoadingTimeout])

  const isValidYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }, [])

  // setPlayerRef callback (exactly like MusicPlayer)
  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return
    playerRef.current = player
    console.log('🎵 Vinyl Player ref set:', player)
  }, [])

  useEffect(() => {
    setHasEnded(false)
    setError(null)
    setRetryCount(0)
    clearLoadingTimeout()
    
    // Validate YouTube URL when song changes
    if (song && !isValidYouTubeUrl(song.url)) {
      setError('Invalid YouTube URL format')
      setIsLoading(false)
      return
    }
    
    // Set loading state when we have a new song
    if (song) {
      console.log('🎵 Vinyl Player: Song changed to:', song.title)
      setIsLoading(true)
      setPlayerReady(false)
      startLoadingTimeout()
    } else {
      setIsLoading(false)
      setPlayerReady(false)
    }
  }, [song, startLoadingTimeout, clearLoadingTimeout, isValidYouTubeUrl])

  // Reset player ready state when song changes (exactly like MusicPlayer)
  useEffect(() => {
    setPlayerReady(false)
    setSeeking(false)
    setHasEnded(false)
    
    // Cleanup on unmount
    return () => {
      clearLoadingTimeout()
    }
  }, [song, clearLoadingTimeout])

  // Auto play when ready
  useEffect(() => {
    if (playerReady && autoPlay && !hasEnded) {
      console.log('🚀 Vinyl Player: Auto-playing because ready and autoPlay is true')
      setIsPlaying(true)
    }
  }, [playerReady, autoPlay, hasEnded])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearLoadingTimeout()
    }
  }, [clearLoadingTimeout])

  // Event handlers (copied from MusicPlayer)
  const handleLoadStart = useCallback(() => {
    console.log('🔄 Vinyl Player: Loading started')
    setIsLoading(true)
    setError(null)
    startLoadingTimeout()
  }, [startLoadingTimeout])

  const handleReady = useCallback(() => {
    try {
      console.log('✅ Vinyl Player: Ready')
      setPlayerReady(true)
      setHasEnded(false)
      setIsLoading(false)
      setError(null)
      clearLoadingTimeout()
      
      // Auto-play if autoPlay is true
      console.log('Vinyl Player ready - autoPlay state:', autoPlay)
    } catch (error) {
      console.warn('Error in handleReady:', error)
      setError('Player initialization failed')
      setIsLoading(false)
    }
  }, [autoPlay, clearLoadingTimeout])

  const handleStart = useCallback(() => {
    console.log('🚀 Vinyl Player: Playback started')
    setPlayerReady(true)
    setHasEnded(false)
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
  }, [clearLoadingTimeout])

  const handlePlay = useCallback(() => {
    console.log('▶️ Vinyl Player: onPlay event')
    setIsLoading(false)
    setError(null)
    clearLoadingTimeout()
    // Only update state if different to prevent loops
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }, [isPlaying, clearLoadingTimeout])

  const handlePause = useCallback(() => {
    console.log('⏸️ Vinyl Player: onPause event')
    // Only update state if different to prevent loops
    if (isPlaying) {
      setIsPlaying(false)
    }
  }, [isPlaying])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgress = useCallback((progress: any) => {
    if (!seeking && progress && typeof progress.playedSeconds === 'number') {
      setCurrentTime(progress.playedSeconds)
    }
  }, [seeking])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTimeUpdate = useCallback((event: any) => {
    const player = event.target
    if (player && player.currentTime) {
      setCurrentTime(player.currentTime)
      
      // Duration is set means the video is loaded
      if (player.duration > 0) {
        setIsLoading(false)
        setError(null)
        clearLoadingTimeout()
      }
    }
  }, [clearLoadingTimeout])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDurationChange = useCallback((duration: any) => {
    console.log('⏱️ Vinyl Player: Duration set to', duration)
    if (typeof duration === 'number' && duration > 0) {
      setDuration(duration)
    }
  }, [])

  const handleError = useCallback((error: unknown) => {
    console.error('❌ Vinyl Player Error:', error)
    clearLoadingTimeout()
    setIsLoading(false)
    
    // Determine error type and set appropriate message (like MusicPlayer)
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
  }, [clearLoadingTimeout])

  const handleEnded = useCallback(() => {
    console.log('🔚 Vinyl Player: Playback ended')
    setHasEnded(true)
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  // Control functions
  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleSeek = useCallback((value: number[]) => {
    const seekTo = (value[0] / 100) * duration
    if (playerRef.current) {
      playerRef.current.currentTime = seekTo
      setCurrentTime(seekTo)
    }
  }, [duration])

  const handleSeekStart = useCallback(() => {
    setSeeking(true)
  }, [])

  const handleSeekEnd = useCallback(() => {
    setSeeking(false)
  }, [])

  const skipBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10)
    if (playerRef.current) {
      playerRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [currentTime])

  const skipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10)
    if (playerRef.current) {
      playerRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [currentTime, duration])

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0] / 100)
  }, [])

  const restart = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(true)
    }
  }, [])

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex flex-col items-center space-y-6 p-6', className)}>
      {/* Hidden React Player */}
      <ReactPlayer
        ref={setPlayerRef}
        className="react-player"
        src={song.url}
        playing={playerReady && isPlaying}
        volume={volume}
        muted={volume === 0}
        width="1px"
        height="1px"
        style={{ opacity: 0, position: 'absolute', top: '-9999px' }}
        config={{
          youtube: {
            color: 'white'
          }
        }}
        onLoadStart={handleLoadStart}
        onReady={handleReady}
        onStart={handleStart}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDurationChange={handleDurationChange}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onEnded={handleEnded}
      />

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
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive font-medium">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-destructive hover:text-destructive/80"
            onClick={() => {
              setError(null)
              setIsLoading(true)
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Controls */}
      {showControls && !error && (
        <div className={cn('space-y-4', config.controls)}>
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              className="w-full"
              disabled={!playerReady || duration === 0}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
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
              onClick={skipBackward}
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
              onClick={skipForward}
              disabled={!playerReady}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              className="text-muted-foreground hover:text-foreground"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
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