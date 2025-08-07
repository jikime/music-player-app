'use client'

import { useState } from 'react'
import { Song } from '@/types/music'
import { useIsMobile } from '@/hooks/use-mobile'
import { useShare } from '@/hooks/use-share'
import { useMusicStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AddToPlaylistPopover } from '@/components/songs/add-to-playlist-popover'
import {
  MoreHorizontal,
  Plus,
  Share2,
  Bookmark,
  BookmarkMinus,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaylistSongMoreMenuProps {
  song: Song
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onRemoveFromPlaylist: (song: Song) => void
  isRemoving?: boolean
}

export function PlaylistSongMoreMenu({ 
  song, 
  className, 
  size = 'icon',
  onRemoveFromPlaylist,
  isRemoving = false
}: PlaylistSongMoreMenuProps) {
  const isMobile = useIsMobile()
  const { 
    isBookmarked, 
    addBookmark, 
    removeBookmark 
  } = useMusicStore()
  const { 
    quickShare, 
    canUseNativeShare
  } = useShare()
  
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  
  // Bookmark handlers
  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (isBookmarked(song.id)) {
        await removeBookmark(song.id)
      } else {
        await addBookmark(song.id)
      }
      
      // Close mobile sheet if open
      if (isMobile) {
        setIsMobileSheetOpen(false)
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
    }
  }

  // Share handler
  const handleShare = async () => {
    await quickShare(song)
    setIsMobileSheetOpen(false)
  }

  // Remove from playlist handler
  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemoveFromPlaylist(song)
    setIsMobileSheetOpen(false)
  }

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size={size}
          className={cn("text-muted-foreground hover:text-foreground", className)}
          onClick={(e) => {
            e.stopPropagation()
            setIsMobileSheetOpen(true)
          }}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreHorizontal className="w-4 h-4" />
          )}
        </Button>

        {/* Mobile Bottom Sheet */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader className="text-left pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg">음악 옵션</SheetTitle>
              </div>
              
              {/* Song Preview */}
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.image_data || song.thumbnail || '/placeholder.svg'}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{song.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-2 pb-4">
              {/* Remove from Playlist */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleRemoveFromPlaylist}
                disabled={isRemoving}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {isRemoving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-red-500">플레이리스트에서 제거</p>
                    <p className="text-xs text-muted-foreground">
                      이 플레이리스트에서 곡을 제거합니다
                    </p>
                  </div>
                </div>
              </Button>

              {/* Add to Another Playlist */}
              <AddToPlaylistPopover song={song}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">다른 플레이리스트에 추가</p>
                      <p className="text-xs text-muted-foreground">
                        내 플레이리스트에 이 곡 추가
                      </p>
                    </div>
                  </div>
                </Button>
              </AddToPlaylistPopover>

              {/* Bookmark Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleToggleBookmark}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-muted flex items-center justify-center",
                    isBookmarked(song.id) && "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {isBookmarked(song.id) ? (
                      <BookmarkMinus className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {isBookmarked(song.id) ? '북마크에서 제거' : '북마크에 추가'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isBookmarked(song.id) ? '저장한 음악에서 제거' : '나중에 들을 수 있도록 저장'}
                    </p>
                  </div>
                </div>
              </Button>

              {/* Share */}
              {canUseNativeShare && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">공유하기</p>
                      <p className="text-xs text-muted-foreground">
                        시스템 공유 메뉴 사용
                      </p>
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop DropdownMenu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={cn(
              "text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
              className
            )}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>음악 옵션</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Remove from Playlist */}
          <DropdownMenuItem 
            onClick={handleRemoveFromPlaylist}
            disabled={isRemoving}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <X className="w-4 h-4 mr-3" />
            플레이리스트에서 제거
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Add to Another Playlist */}
          <AddToPlaylistPopover song={song}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="w-4 h-4 mr-3" />
              다른 플레이리스트에 추가
            </DropdownMenuItem>
          </AddToPlaylistPopover>
          
          {/* Bookmark Toggle */}
          <DropdownMenuItem onClick={handleToggleBookmark}>
            {isBookmarked(song.id) ? (
              <>
                <BookmarkMinus className="w-4 h-4 mr-3" />
                북마크에서 제거
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-3" />
                북마크에 추가
              </>
            )}
          </DropdownMenuItem>
          
          {/* Share */}
          {canUseNativeShare && (
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-3" />
              공유하기
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}