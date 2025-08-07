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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AddToPlaylistPopover } from './add-to-playlist-popover'
import {
  MoreHorizontal,
  Plus,
  Share2,
  Bookmark,
  BookmarkMinus,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MySongMoreMenuProps {
  song: Song
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onEdit: (song: Song) => void
  onDelete: (song: Song) => void
  isDeleting?: boolean
}

export function MySongMoreMenu({ 
  song, 
  className, 
  size = 'icon',
  onEdit,
  onDelete,
  isDeleting = false
}: MySongMoreMenuProps) {
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
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

  // Edit handler
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(song)
    setIsMobileSheetOpen(false)
  }

  // Delete handlers
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
    setIsMobileSheetOpen(false)
  }

  const handleDeleteConfirm = () => {
    onDelete(song)
    setShowDeleteDialog(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
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
        >
          <MoreHorizontal className="w-4 h-4" />
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
              {/* Edit */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleEdit}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">수정하기</p>
                    <p className="text-xs text-muted-foreground">
                      노래 정보를 수정합니다
                    </p>
                  </div>
                </div>
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-red-500">삭제하기</p>
                    <p className="text-xs text-muted-foreground">
                      노래를 영구적으로 삭제합니다
                    </p>
                  </div>
                </div>
              </Button>

              {/* Add to Playlist */}
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
                      <p className="font-medium text-sm">플레이리스트에 추가</p>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>노래 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{song.title}&quot;을(를) 정말 삭제하시겠습니까?
                <br />
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity",
              className
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>음악 옵션</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Edit */}
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-3" />
            수정하기
          </DropdownMenuItem>
          
          {/* Delete */}
          <DropdownMenuItem 
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            삭제하기
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Add to Playlist */}
          <AddToPlaylistPopover song={song}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="w-4 h-4 mr-3" />
              플레이리스트에 추가
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노래 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{song.title}&quot;을(를) 정말 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}