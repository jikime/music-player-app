"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VinylPlayer } from '@/components/songs/vinyl-player'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { formatDuration } from '@/lib/music-utils'
import { useShare } from '@/hooks/use-share'
import { 
  Play, 
  Pause, 
  Share2, 
  ArrowLeft,
  Music
} from 'lucide-react'
import { Song, SharedSong } from '@/types/music'

interface SharePageData {
  sharedSong: SharedSong
  song: Song
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const shareId = params.shareId as string
  
  const { quickShare, canUseNativeShare } = useShare()
  const [data, setData] = useState<SharePageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Fetch shared song data
  useEffect(() => {
    const fetchSharedSong = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/share/${shareId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch shared song')
        }
        
        const shareData = await response.json()
        setData(shareData)
      } catch (error) {
        console.error('Error fetching shared song:', error)
        setError('Failed to load shared song')
      } finally {
        setIsLoading(false)
      }
    }

    if (shareId) {
      fetchSharedSong()
    }
  }, [shareId])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleShare = async () => {
    if (!data) return
    
    try {
      await quickShare(data.song)
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading shared song..." />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Song not found</h2>
          <p className="text-muted-foreground mb-6">
            The shared song you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  const { sharedSong, song } = data

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              Shared Song
            </h1>
          </div>

          {canUseNativeShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Vinyl Player */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <VinylPlayer
                song={song}
                autoPlay={isPlaying}
                size="xl"
                className="w-80 h-80 md:w-96 md:h-96"
              />
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7" fill="currentColor" />
                  ) : (
                    <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Song Info (shown on mobile only) */}
            <div className="lg:hidden text-center space-y-2 max-w-sm">
              <h2 className="text-2xl font-bold line-clamp-2">{song.title}</h2>
              <p className="text-lg text-muted-foreground">{song.artist}</p>
              {song.album && (
                <p className="text-sm text-muted-foreground">{song.album}</p>
              )}
              {song.duration && (
                <p className="text-sm text-muted-foreground">
                  {formatDuration(song.duration)}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Song Details */}
          <div className="hidden lg:block space-y-6">
            {/* Song Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-4xl font-bold mb-2 line-clamp-3">
                  {song.title}
                </h2>
                <p className="text-xl text-muted-foreground mb-1">
                  {song.artist}
                </p>
                {song.album && (
                  <p className="text-lg text-muted-foreground/80">
                    {song.album}
                  </p>
                )}
              </div>

              {/* Duration */}
              {song.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Music className="w-4 h-4" />
                  <span>{formatDuration(song.duration)}</span>
                </div>
              )}
            </div>

            {/* Shared Message */}
            {sharedSong.title && sharedSong.title !== song.title && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Shared Message</h3>
                <p className="text-sm text-muted-foreground">
                  {sharedSong.title}
                </p>
              </div>
            )}

            {/* Description */}
            {sharedSong.description && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <div className="text-sm text-muted-foreground">
                  <p className={showFullDescription ? '' : 'line-clamp-3'}>
                    {sharedSong.description}
                  </p>
                  {sharedSong.description.length > 150 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 h-auto p-0 text-xs"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Share Date */}
            <div className="text-xs text-muted-foreground">
              Shared on {new Date(sharedSong.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Mobile Description */}
        <div className="lg:hidden mt-8 space-y-4">
          {/* Shared Message */}
          {sharedSong.title && sharedSong.title !== song.title && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Shared Message</h3>
              <p className="text-sm text-muted-foreground">
                {sharedSong.title}
              </p>
            </div>
          )}

          {/* Description */}
          {sharedSong.description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <div className="text-sm text-muted-foreground">
                <p className={showFullDescription ? '' : 'line-clamp-3'}>
                  {sharedSong.description}
                </p>
                {sharedSong.description.length > 150 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 h-auto p-0 text-xs"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Share Date */}
          <div className="text-center text-xs text-muted-foreground">
            Shared on {new Date(sharedSong.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}