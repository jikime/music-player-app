import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { LoadingContent, Skeleton } from "@/components/ui/loading-bar"
import { ChevronRight, ChevronLeft, Play } from "lucide-react"
import { formatDuration } from "@/lib/music-utils"
import type { Song } from "@/types/music"

interface RecentlyPlayedProps {
  songs: Song[]
  onPlaySong: (song: Song) => void
  isLoading?: boolean
}

export function RecentlyPlayed({ songs, onPlaySong, isLoading = false }: RecentlyPlayedProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate items per page based on screen size and container width
  const calculateItemsPerPage = useCallback(() => {
    if (!containerRef.current) {
      // Default fallback based on screen width
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth
        if (screenWidth < 768) return 3 // Mobile/Tablet: 3 items maximum
        if (screenWidth < 1024) return 3 // Small desktop: 3 items
        return 5 // Large desktop: 5 items
      }
      return 5
    }
    
    const containerWidth = containerRef.current.offsetWidth
    const screenWidth = window.innerWidth
    
    // Responsive card width based on screen size
    let cardWidth: number
    if (screenWidth < 768) {
      cardWidth = screenWidth < 400 ? 110 : 140 // Even smaller for very small screens
    } else {
      cardWidth = 224 // Full size cards on desktop (w-56)
    }
    
    const gap = screenWidth < 768 ? 12 : 16 // Smaller gap on mobile
    
    // Calculate how many cards fit exactly
    let itemsToShow = 1
    let totalWidth = cardWidth
    
    const maxItems = screenWidth < 768 ? 3 : 6 // Limit to 3 items on mobile/tablet
    
    while (totalWidth + gap + cardWidth <= containerWidth && itemsToShow < maxItems) {
      totalWidth += gap + cardWidth
      itemsToShow++
    }
    
    // Ensure minimum items based on screen size
    const minItems = screenWidth < 768 ? 3 : 2
    
    return Math.max(minItems, Math.min(maxItems, itemsToShow))
  }, [])
  
  useEffect(() => {
    const updateItemsPerPage = () => {
      const newItemsPerPage = calculateItemsPerPage()
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage)
        // Reset to first page when items per page changes
        setCurrentPage(0)
      }
    }
    
    // Debounce resize events
    let timeoutId: NodeJS.Timeout
    const debouncedUpdateItemsPerPage = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateItemsPerPage, 150)
    }
    
    // Set initial value after component mount
    const initialTimeout = setTimeout(updateItemsPerPage, 100)
    
    // Add resize listener
    window.addEventListener('resize', debouncedUpdateItemsPerPage)
    
    return () => {
      window.removeEventListener('resize', debouncedUpdateItemsPerPage)
      clearTimeout(timeoutId)
      clearTimeout(initialTimeout)
    }
  }, [itemsPerPage, calculateItemsPerPage])
  
  // Additional effect to recalculate when container ref is set
  useEffect(() => {
    if (containerRef.current && !isLoading) {
      const newItemsPerPage = calculateItemsPerPage()
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(0)
      }
    }
  }, [isLoading, itemsPerPage, calculateItemsPerPage])
  
  // Calculate pagination
  const totalPages = Math.ceil(songs.length / itemsPerPage)
  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < totalPages - 1
  
  // Get current page songs
  const currentSongs = useMemo(() => {
    if (showAll) return songs
    const start = currentPage * itemsPerPage
    return songs.slice(start, start + itemsPerPage)
  }, [songs, currentPage, showAll, itemsPerPage])
  
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
  
  const handleViewAll = () => {
    setShowAll(!showAll)
  }
  const skeletonCards = (
    <div className="flex justify-center gap-3 sm:gap-4 overflow-x-auto mb-4">
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <div key={index} className="bg-card/50 border-border rounded-xl border shadow-sm flex flex-col w-36 sm:w-44 md:w-52 lg:w-56 flex-shrink-0">
          <Skeleton className="w-full aspect-square rounded-t-xl" />
          <div className="p-3 md:p-4 flex flex-col flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3 mt-auto" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="mb-8">
      <LoadingContent 
        isLoading={isLoading} 
        fallback={
          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-36" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
            {skeletonCards}
          </div>
        }
      >
        <div className="flex items-center justify-between mb-4 px-1 md:px-6">
          <h2 className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">RECENTLY PLAYED</h2>
          {songs.length > itemsPerPage && (
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs md:text-sm text-muted-foreground hover:text-foreground"
                onClick={handleViewAll}
              >
                {showAll ? "Show Less" : "View All"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handlePrevious}
                disabled={!canGoPrev || isAnimating || showAll}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handleNext}
                disabled={!canGoNext || isAnimating || showAll}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div 
          ref={containerRef}
          className={`px-1 md:px-6 transition-all duration-300 ease-in-out ${
            isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div className={`${showAll ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 lg:gap-5' : 'flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide justify-center'} mb-4`}>
            {currentSongs.map((song) => (
              <div
                key={song.id}
                className={`bg-card/50 border-border hover:bg-card/80 transition-colors cursor-pointer rounded-xl border shadow-sm flex flex-col ${showAll ? 'w-full' : 'w-28 sm:w-32 md:w-52 lg:w-56 flex-shrink-0'}`}
                onClick={() => onPlaySong(song)}
          >
            <div className="w-full aspect-square bg-muted rounded-t-xl overflow-hidden relative group">
              <ImageWithFallback
                src={song.thumbnail || "/placeholder.svg"}
                alt={song.title}
                fill
                sizes="(max-width: 640px) 145px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 224px"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
              {/* Play Button on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-1.5 md:p-4 flex flex-col flex-1">
              <h3 className="font-semibold mb-1 line-clamp-2 leading-tight min-h-[1.5rem] md:min-h-[2.5rem] text-xs md:text-base" title={song.title}>{song.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground truncate mb-1" title={song.artist}>{song.artist}</p>
              <p className="text-xs text-muted-foreground/70 mt-auto">
                {song.duration > 0 ? formatDuration(song.duration) : '0:00'}
              </p>
            </div>
              </div>
            ))}
          </div>
          
          {/* Page indicator */}
          {!showAll && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
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