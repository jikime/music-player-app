"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
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
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [hasEnded, setHasEnded] = useState(false)
  
  const {
    playerState,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat
  } = playerState

  // Reset hasEnded when currentSong changes
  useEffect(() => {
    setHasEnded(false)
  }, [currentSong?.id])


  // ReactPlayer event handlers - following demo pattern
  const handleReady = () => {
    console.log('Player ready')
    setPlayerReady(true)
  }

  const handleTimeUpdate = () => {
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
  }

  const handleStart = () => {
    console.log('Playback started')
    setPlayerReady(true)
    setHasEnded(false) // Reset ended flag for new song
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleSeeking = (seconds: number) => {
    setSeeking(true)
  }

  const handleSeeked = (seconds: number) => {
    setSeeking(false)
  }

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
  }

  const handleBuffer = () => {
    // Buffering started
  }

  const handleBufferEnd = () => {
    // Buffering ended
  }

  // Track if we're currently seeking (drag in progress)
  const [isDragging, setIsDragging] = useState(false)

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

  // Reset player ready state when song changes
  useEffect(() => {
    setPlayerReady(false)
    setSeeking(false)
    setIsDragging(false)
    setSeekTime(null)
  }, [currentSong])

  // setPlayerRef callback like in demo
  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return
    playerRef.current = player
    console.log('Player ref set:', player)
  }, [])


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

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
      {/* Hidden React Player */}
      {currentSong && (
        <ReactPlayer
          ref={setPlayerRef}
          className="react-player"
          src={currentSong.url}
          playing={isPlaying}
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
          onRateChange={handleRateChange}
          onEnded={handleEnded}
          onError={(e) => console.log('onError', e)}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onDurationChange={handleDurationChange}
        />
      )}

      <div className="flex items-center gap-4 p-4">
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
                <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${isBookmarked(currentSong.id) ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                onClick={toggleBookmark}
              >
                <Heart className={`w-4 h-4 ${isBookmarked(currentSong.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Download className="w-4 h-4" />
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
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong || !playerReady}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
              className={`${repeat !== 'none' ? 'text-accent' : 'text-muted-foreground'} hover:text-foreground`}
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
              disabled={!currentSong || !playerReady}
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider 
            value={[volume * 100]} 
            max={100} 
            step={1}
            onValueChange={(value) => handleVolumeChange([value[0] / 100])}
            className="w-24" 
          />
        </div>
      </div>
    </div>
  )
}