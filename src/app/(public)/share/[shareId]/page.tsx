"use client"

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VinylPlayer } from '@/components/songs/vinyl-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { shareApi } from '@/lib/api'
import { Song, SharedSong } from '@/types/music'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Music,
  Share2,
  ExternalLink,
  Clock,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface SharePageData {
  sharedSong: SharedSong
  song: Song
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  const shareId = params.shareId as string

  const [data, setData] = useState<SharePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSharedSong = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Loading shared song:', shareId)
      
      const result = await shareApi.getByShareId(shareId)
      console.log('✅ Share API response:', result)
      
      if (!result || !result.song || !result.sharedSong) {
        throw new Error('Invalid response structure')
      }
      
      setData(result)
    } catch (err: unknown) {
      console.error('Error loading shared song:', err)
      
      // Handle specific error status codes
      if (err instanceof Error && err.message?.includes('404')) {
        setError('This shared song could not be found. It may have been removed or the link is invalid.')
      } else if (err instanceof Error && err.message?.includes('410')) {
        setError('This share link has expired.')
      } else if (err instanceof Error && err.message?.includes('403')) {
        setError('This shared song is private and you don\'t have access to it.')
      } else {
        setError(`Failed to load shared song: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [shareId])

  useEffect(() => {
    if (!shareId) {
      setError('Invalid share link')
      setLoading(false)
      return
    }

    loadSharedSong()
  }, [shareId, loadSharedSong])

  const shareCurrentPage = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator && isMobile) {
        await navigator.share({
          title: data?.sharedSong.title || data?.song.title,
          text: `Check out "${data?.song.title}" by ${data?.song.artist}`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        // You could add a toast notification here
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Unknown'
    
    let dateObj: Date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  const formatDuration = (seconds: number | undefined | null) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <h2 className="text-xl font-semibold">Loading shared song...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the music</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Music className="w-12 h-12 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Oops!</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              variant="default"
              onClick={() => router.push('/')}
              className="flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            <Button
              variant="ghost"
              onClick={loadSharedSong}
              disabled={loading}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { sharedSong, song } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header - Empty for cleaner look */}
        <div className="mb-8">
          {/* Removed header buttons */}
        </div>

        {/* Main Content */}
        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
        )}>
          {/* Vinyl Player - Takes center stage */}
          <div className={cn(
            "flex justify-center",
            !isMobile && "lg:col-span-2"
          )}>
            <VinylPlayer
              song={song}
              autoPlay={true}
              showControls={true}
              size={isMobile ? 'md' : 'lg'}
              className="w-full max-w-lg"
            />
          </div>

          {/* Song Information Sidebar */}
          <div className="space-y-8">
            {/* Custom Share Title/Description */}
            {(sharedSong.title || sharedSong.description) && (
              <div className="bg-muted/20 border border-border/50 rounded-lg p-6 shadow-sm backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Shared Message</span>
                  </div>
                  
                  {sharedSong.title && (
                    <h3 className="text-xl font-bold text-foreground leading-tight">
                      {sharedSong.title}
                    </h3>
                  )}
                  
                  {sharedSong.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {sharedSong.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Song Details */}
            <div className="bg-muted/20 border border-border/50 rounded-lg p-6 shadow-sm backdrop-blur-sm">
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Song Details</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-foreground text-xl leading-tight">
                      {song.title}
                    </h3>
                    <p className="text-muted-foreground text-base mt-1">
                      by {song.artist}
                    </p>
                  </div>

                  {song.album && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Album: </span>
                      <span className="text-foreground font-medium">{song.album}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(song.duration)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{sharedSong.viewCount || 0} views</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Shared {formatDate(sharedSong.createdAt)}</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-3">
                    {sharedSong.isPublic ? (
                      <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                        Public
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                        Private
                      </div>
                    )}

                    {sharedSong.expiresAt && new Date(sharedSong.expiresAt) > new Date() && (
                      <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        Expires {formatDate(sharedSong.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-primary/8 border border-primary/30 rounded-lg p-6 shadow-sm backdrop-blur-sm text-center">
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-foreground text-lg">
                    Enjoying this music?
                  </h4>
                  <p className="text-muted-foreground mt-2">
                    Discover more great music and create your own playlists
                  </p>
                </div>
                
                <Button
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Explore More Music
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}