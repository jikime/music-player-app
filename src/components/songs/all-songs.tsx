import { useState, useMemo } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { LoadingContent, Skeleton } from "@/components/ui/loading-bar"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MoreHorizontal,
  Clock,
  Music,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { formatDuration, formatPlays } from "@/lib/music-utils"
import { useMusicStore } from "@/lib/store"
import type { Song } from "@/types/music"

interface AllSongsProps {
  songs: Song[]
  onPlaySong: (song: Song) => void
  isLoading?: boolean
}

export function AllSongs({ songs, onPlaySong, isLoading = false }: AllSongsProps) {
  const [bookmarkingStates, setBookmarkingStates] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const ITEMS_PER_PAGE = 10 // All Songs는 더 많이 표시
  
  const {
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()
  
  // Calculate pagination
  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE)
  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < totalPages - 1
  
  // Get current page songs
  const currentSongs = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    return songs.slice(start, start + ITEMS_PER_PAGE)
  }, [songs, currentPage])
  
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage || isAnimating) return
    
    setIsAnimating(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    setCurrentPage(newPage)
    setIsAnimating(false)
  }
  
  const handlePrevious = () => {
    if (canGoPrev) {
      handlePageChange(currentPage - 1)
    }
  }
  
  const handleNext = () => {
    if (canGoNext) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleToggleBookmark = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (bookmarkingStates[songId]) return
    
    setBookmarkingStates(prev => ({ ...prev, [songId]: true }))
    
    try {
      if (isBookmarked(songId)) {
        await removeBookmark(songId)
        console.log('북마크에서 제거되었습니다.')
      } else {
        await addBookmark(songId)
        console.log('북마크에 추가되었습니다.')
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      
      if (errorMessage.includes('already bookmarked')) {
        console.warn('이미 북마크된 노래입니다.')
      } else {
        console.warn(`북마크 처리 중 오류: ${errorMessage}`)
      }
    } finally {
      setBookmarkingStates(prev => ({ ...prev, [songId]: false }))
    }
  }

  const skeletonRows = (
    <div className="space-y-2">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-3 rounded-lg">
          <Skeleton className="w-8 h-4" />
          <Skeleton className="w-12 h-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="py-4 md:py-6">
      <LoadingContent 
        isLoading={isLoading} 
        fallback={
          <div>
            <div className="flex items-center justify-between mb-4 px-4 md:px-6">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <div className="px-4 md:px-6">
              {skeletonRows}
            </div>
          </div>
        }
      >
        <div className="flex items-center justify-between mb-4 px-2 md:px-6">
          <h2 className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">ALL SONGS</h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handlePrevious}
                disabled={!canGoPrev || isAnimating}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handleNext}
                disabled={!canGoNext || isAnimating}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div 
          className={`px-2 md:px-6 space-y-2 transition-all duration-300 ease-in-out ${
            isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {currentSongs.map((song, index) => (
            <div key={song.id}>
              {/* Mobile Layout: Card Style */}
              <div 
                className="md:hidden bg-card rounded-lg p-3 border hover:bg-card/70 group cursor-pointer"
                onClick={() => onPlaySong(song)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-muted-foreground text-xs font-mono w-6 flex-shrink-0">
                      #{currentPage * ITEMS_PER_PAGE + index + 1}
                    </span>
                    <div className="w-10 h-10 rounded overflow-hidden relative flex-shrink-0 bg-muted">
                      <ImageWithFallback
                        src={song.thumbnail || "/placeholder.svg"}
                        alt={song.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-1">{song.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex-shrink-0">{formatDuration(song.duration)}</span>
                        <span className="flex-shrink-0">•</span>
                        <span className="flex-shrink-0">{formatPlays(song.plays)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 ${isBookmarked(song.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
                      onClick={(e) => handleToggleBookmark(song.id, e)}
                      disabled={bookmarkingStates[song.id]}
                    >
                      {bookmarkingStates[song.id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Heart className={`w-3 h-3 ${isBookmarked(song.id) ? "fill-current" : ""}`} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout: Table Row Style */}
              <div 
                className="hidden md:flex items-center gap-4 p-3 rounded-lg hover:bg-card/30 group cursor-pointer"
                onClick={() => onPlaySong(song)}
              >
                <span className="text-muted-foreground w-8 text-sm">#{currentPage * ITEMS_PER_PAGE + index + 1}</span>
                <div className="w-12 h-12 rounded overflow-hidden relative bg-muted">
                  <ImageWithFallback
                    src={song.thumbnail || "/placeholder.svg"}
                    alt={song.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.artist}{song.album && ` • ${song.album}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex items-center gap-1 text-muted-foreground w-20 justify-start">
                    <Music className="w-4 h-4" />
                    <span className="text-sm">{formatPlays(song.plays)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground w-16 justify-start">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatDuration(song.duration)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 ${isBookmarked(song.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
                    onClick={(e) => handleToggleBookmark(song.id, e)}
                    disabled={bookmarkingStates[song.id]}
                  >
                    {bookmarkingStates[song.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? "fill-current" : ""}`} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        
        {/* Page indicator */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 px-2 md:px-6">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentPage 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => handlePageChange(index)}
              />
            ))}
          </div>
        )}
      </div>
      </LoadingContent>
    </div>
  )
}