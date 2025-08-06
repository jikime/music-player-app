"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
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

// Lazy load ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <div>Loading player...</div>
})

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

export function VinylPlayerLazy({ 
  song, 
  autoPlay = false, 
  showControls = true,
  size = 'lg',
  className 
}: VinylPlayerProps) {
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [error, setError] = useState<string | null>(null)
  
  const config = sizeConfig[size]

  useEffect(() => {
    console.log('🎵 VinylPlayerLazy mounted with song:', song?.title, song?.url)
  }, [song])

  const handlePlayerReady = () => {
    console.log('✅ Player ready!')
    setIsReady(true)
    setError(null)
    
    if (autoPlay) {
      console.log('🚀 Auto-playing...')
      setIsPlaying(true)
    }
  }

  const handleError = (error: any) => {
    console.error('❌ Player error:', error)
    setError('Failed to load video')
    setIsReady(false)
  }

  const handleProgress = (state: any) => {
    if (!state.seeking) {
      setCurrentTime(state.playedSeconds)
    }
  }

  const handleDuration = (duration: number) => {
    console.log('⏱️ Duration:', duration)
    setDuration(duration)
  }

  const togglePlayPause = () => {
    console.log('🎮 Toggle play/pause:', !isPlaying)
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const seekTo = (value[0] / 100) * duration
    if (playerRef.current) {
      playerRef.current.seekTo(seekTo)
      setCurrentTime(seekTo)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex flex-col items-center space-y-6 p-6', className)}>
      {/* Hidden Player */}
      <div style={{ display: 'none' }}>
        <ReactPlayer
          ref={playerRef}
          url={song?.url}
          playing={isPlaying}
          volume={volume}
          muted={false}
          width="100%"
          height="100%"
          onReady={handlePlayerReady}
          onError={handleError}
          onProgress={handleProgress}
          onDuration={handleDuration}
          config={{
            youtube: {
              playerVars: {
                autoplay: autoPlay ? 1 : 0,
                modestbranding: 1
              }
            }
          }}
        />
      </div>

      {/* Vinyl Record Display */}
      <div className={cn('relative', config.container)}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-full blur-xl opacity-50" />
        
        <div className="relative flex items-center justify-center h-full">
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full overflow-hidden shadow-inner border-4 border-gray-800">
              <img
                src={song?.thumbnail || "/placeholder.svg"}
                alt={song?.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 shadow-inner">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Song Info */}
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground truncate">{song?.title}</h2>
        <p className="text-lg text-muted-foreground truncate">{song?.artist}</p>
        {song?.album && (
          <p className="text-sm text-muted-foreground/70 truncate">{song?.album}</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive font-medium">{error}</p>
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
              onValueCommit={handleSeek}
              className="w-full"
              disabled={!isReady}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              disabled={!isReady || !song}
              className="w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}