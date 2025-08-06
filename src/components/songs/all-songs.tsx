import React, { useState, useMemo, useCallback } from "react"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { LoadingContent, Skeleton } from "@/components/ui/loading-bar"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Plus,
  Clock,
  Music,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play,
  Share2,
} from "lucide-react"
import { formatDuration, formatPlays } from "@/lib/music-utils"
import { useMusicStore } from "@/lib/store"
import { AddToPlaylistPopover } from "@/components/songs/add-to-playlist-popover"
import { ShareModal } from "@/components/songs/share-modal"
import type { Song } from "@/types/music"

interface AllSongsProps {
  songs: Song[]
  onPlaySong: (song: Song) => void
  isLoading?: boolean
}

// Memoized thumbnail component to prevent unnecessary re-renders
const MemoizedThumbnail = React.memo(({ song, size, showPlayButton = true }: { 
  song: Song; 
  size: { width: string; height: string; iconSize: string }; 
  showPlayButton?: boolean 
}) => (
  <div className={`${size.width} ${size.height} rounded-lg overflow-hidden relative flex-shrink-0 bg-muted group/thumb`}>
    <ImageWithFallback
      src={song.image_data || song.thumbnail || "/placeholder.svg"}
      alt={song.title}
      fill
      sizes={size.width === "w-9" ? "36px" : "48px"}
      className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
    />
    {showPlayButton && (
      <>
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors duration-300" />
        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
          <Play className={`${size.iconSize} text-white`} fill="currentColor" />
        </div>
      </>
    )}
  </div>
))
MemoizedThumbnail.displayName = "MemoizedThumbnail"

// Memoized song info component
const MemoizedSongInfo = React.memo(({ song, showAlbum = false, showStats = false }: { song: Song; showAlbum?: boolean; showStats?: boolean }) => (
  <div className="flex-1 min-w-0">
    <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-1 md:text-base md:truncate">
      {song.title}
    </h3>
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground line-clamp-1 md:text-sm md:truncate">
        {song.artist}{showAlbum && song.album && ` • ${song.album}`}
      </p>
      {showStats && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
          <span>{formatDuration(song.duration)}</span>
          <span>•</span>
          <span>{formatPlays(song.plays)}</span>
        </div>
      )}
    </div>
  </div>
))
MemoizedSongInfo.displayName = "MemoizedSongInfo"

// Memoized action buttons component
const MemoizedActionButtons = React.memo(({ 
  song, 
  isBookmarked, 
  isBookmarking, 
  onToggleBookmark,
  onShare, 
  isMobile = false 
}: { 
  song: Song; 
  isBookmarked: boolean; 
  isBookmarking: boolean; 
  onToggleBookmark: (songId: string, event: React.MouseEvent) => void;
  onShare?: (song: Song, event: React.MouseEvent) => void;
  isMobile?: boolean;
}) => {
  const buttonSize = isMobile ? "w-7 h-7" : "w-8 h-8"
  const iconSize = isMobile ? "w-3 h-3" : "w-4 h-4"
  
  return (
    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-0'} flex-shrink-0`}>
      <Button
        variant="ghost"
        size="icon"
        className={`${buttonSize} ${isBookmarked ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
        onClick={(e) => onToggleBookmark(song.id, e)}
        disabled={isBookmarking}
      >
        {isBookmarking ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <Heart className={`${iconSize} ${isBookmarked ? "fill-current" : ""}`} />
        )}
      </Button>
      <AddToPlaylistPopover song={song}>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} text-muted-foreground hover:text-primary ${
            isMobile ? '' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className={iconSize} />
        </Button>
      </AddToPlaylistPopover>
      {onShare && (
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} text-muted-foreground hover:text-primary ${
            isMobile ? '' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => onShare(song, e)}
        >
          <Share2 className={iconSize} />
        </Button>
      )}
    </div>
  )
})
MemoizedActionButtons.displayName = "MemoizedActionButtons"

// Memoized mobile song row
const MemoizedMobileSongRow = React.memo(({ 
  song, 
  index, 
  currentPage, 
  itemsPerPage, 
  onPlaySong, 
  isBookmarked, 
  isBookmarking, 
  onToggleBookmark,
  onShare 
}: {
  song: Song;
  index: number;
  currentPage: number;
  itemsPerPage: number;
  onPlaySong: (song: Song) => void;
  isBookmarked: boolean;
  isBookmarking: boolean;
  onToggleBookmark: (songId: string, event: React.MouseEvent) => void;
  onShare: (song: Song, event: React.MouseEvent) => void;
}) => (
  <div 
    className="md:hidden p-2 hover:scale-105 transition-transform group cursor-pointer"
    onClick={() => onPlaySong(song)}
  >
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-muted-foreground text-xs font-mono w-5 flex-shrink-0">
          #{currentPage * itemsPerPage + index + 1}
        </span>
        <MemoizedThumbnail 
          song={song} 
          size={{ width: "w-9", height: "h-9", iconSize: "w-3 h-3" }} 
        />
        <MemoizedSongInfo song={song} showStats={true} />
      </div>
      <MemoizedActionButtons
        song={song}
        isBookmarked={isBookmarked}
        isBookmarking={isBookmarking}
        onToggleBookmark={onToggleBookmark}
        onShare={onShare}
        isMobile={true}
      />
    </div>
  </div>
))
MemoizedMobileSongRow.displayName = "MemoizedMobileSongRow"

// Memoized desktop song row
const MemoizedDesktopSongRow = React.memo(({ 
  song, 
  index, 
  currentPage, 
  itemsPerPage, 
  onPlaySong, 
  isBookmarked, 
  isBookmarking, 
  onToggleBookmark,
  onShare 
}: {
  song: Song;
  index: number;
  currentPage: number;
  itemsPerPage: number;
  onPlaySong: (song: Song) => void;
  isBookmarked: boolean;
  isBookmarking: boolean;
  onToggleBookmark: (songId: string, event: React.MouseEvent) => void;
  onShare: (song: Song, event: React.MouseEvent) => void;
}) => (
  <div 
    className="hidden md:flex items-center gap-2 p-3 rounded-lg hover:bg-card/30 group cursor-pointer"
    onClick={() => onPlaySong(song)}
  >
    <span className="text-muted-foreground w-8 text-sm">
      #{currentPage * itemsPerPage + index + 1}
    </span>
    <MemoizedThumbnail 
      song={song} 
      size={{ width: "w-12", height: "h-12", iconSize: "w-4 h-4" }} 
    />
    <MemoizedSongInfo song={song} showAlbum={true} />
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-1 text-muted-foreground w-16 justify-start">
        <Music className="w-3 h-3" />
        <span className="text-xs">{formatPlays(song.plays)}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground w-14 justify-start">
        <Clock className="w-3 h-3" />
        <span className="text-xs">{formatDuration(song.duration)}</span>
      </div>
      <MemoizedActionButtons
        song={song}
        isBookmarked={isBookmarked}
        isBookmarking={isBookmarking}
        onToggleBookmark={onToggleBookmark}
        onShare={onShare}
        isMobile={false}
      />
    </div>
  </div>
))
MemoizedDesktopSongRow.displayName = "MemoizedDesktopSongRow"

export const AllSongs = React.memo(({ songs, onPlaySong, isLoading = false }: AllSongsProps) => {
  const [bookmarkingStates, setBookmarkingStates] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  
  const ITEMS_PER_PAGE = 10 // All Songs는 더 많이 표시
  
  const {
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()
  
  // Memoized calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE)
    const canGoPrev = currentPage > 0
    const canGoNext = currentPage < totalPages - 1
    const start = currentPage * ITEMS_PER_PAGE
    const currentSongs = songs.slice(start, start + ITEMS_PER_PAGE)
    
    return { totalPages, canGoPrev, canGoNext, currentSongs }
  }, [songs, currentPage, ITEMS_PER_PAGE])
  
  const handlePageChange = useCallback(async (newPage: number) => {
    if (newPage === currentPage || isAnimating) return
    
    setIsAnimating(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    setCurrentPage(newPage)
    setIsAnimating(false)
  }, [currentPage, isAnimating])
  
  const handlePrevious = useCallback(() => {
    if (paginationData.canGoPrev) {
      handlePageChange(currentPage - 1)
    }
  }, [paginationData.canGoPrev, currentPage, handlePageChange])
  
  const handleNext = useCallback(() => {
    if (paginationData.canGoNext) {
      handlePageChange(currentPage + 1)
    }
  }, [paginationData.canGoNext, currentPage, handlePageChange])

  const handleShare = useCallback((song: Song, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedSong(song)
    setShareModalOpen(true)
  }, [])

  const handleToggleBookmark = useCallback(async (songId: string, event: React.MouseEvent) => {
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
  }, [bookmarkingStates, isBookmarked, addBookmark, removeBookmark])

  const skeletonRows = useMemo(() => (
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
  ), [ITEMS_PER_PAGE])

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
        <div className="flex items-center justify-between mb-4 px-1 md:px-6">
          <h2 className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">전체 음악</h2>
          {paginationData.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handlePrevious}
                disabled={!paginationData.canGoPrev || isAnimating}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={handleNext}
                disabled={!paginationData.canGoNext || isAnimating}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div 
          className={`px-1 md:px-6 space-y-2 transition-all duration-300 ease-in-out ${
            isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {paginationData.currentSongs.map((song, index) => {
            const isBookmarkedSong = isBookmarked(song.id)
            const isBookmarkingSong = bookmarkingStates[song.id] || false
            
            return (
              <div key={song.id}>
                <MemoizedMobileSongRow
                  song={song}
                  index={index}
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPlaySong={onPlaySong}
                  isBookmarked={isBookmarkedSong}
                  isBookmarking={isBookmarkingSong}
                  onToggleBookmark={handleToggleBookmark}
                  onShare={handleShare}
                />
                <MemoizedDesktopSongRow
                  song={song}
                  index={index}
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPlaySong={onPlaySong}
                  isBookmarked={isBookmarkedSong}
                  isBookmarking={isBookmarkingSong}
                  onToggleBookmark={handleToggleBookmark}
                  onShare={handleShare}
                />
              </div>
            )
          })}
        
        {/* Page indicator */}
        {paginationData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 px-1 md:px-6">
            {Array.from({ length: paginationData.totalPages }).map((_, index) => (
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
      
      {/* Share Modal */}
      {selectedSong && (
        <ShareModal
          song={selectedSong}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedSong(null)
          }}
        />
      )}
    </div>
  )
})

AllSongs.displayName = "AllSongs"