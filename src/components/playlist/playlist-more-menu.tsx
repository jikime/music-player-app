'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
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
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaylistMoreMenuProps {
  playlistName: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onAddSong: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PlaylistMoreMenu({ 
  playlistName,
  className, 
  size = 'icon',
  onAddSong,
  onEdit,
  onDelete
}: PlaylistMoreMenuProps) {
  const isMobile = useIsMobile()
  
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Add song handler
  const handleAddSong = () => {
    onAddSong()
    setIsMobileSheetOpen(false)
  }

  // Edit handler
  const handleEdit = () => {
    onEdit()
    setIsMobileSheetOpen(false)
  }

  // Delete handlers
  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
    setIsMobileSheetOpen(false)
  }

  const handleDeleteConfirm = () => {
    onDelete()
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
          <MoreHorizontal className="w-3 h-3" />
        </Button>

        {/* Mobile Bottom Sheet */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader className="text-left pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg">플레이리스트 옵션</SheetTitle>
              </div>
              
              {/* Playlist Preview */}
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {/* Music icon as placeholder */}
                  <div className="w-6 h-6 text-muted-foreground">♪</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{playlistName}</h3>
                  <p className="text-xs text-muted-foreground">플레이리스트</p>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-2 pb-4">
              {/* Add Songs */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleAddSong}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">곡 추가</p>
                    <p className="text-xs text-muted-foreground">
                      플레이리스트에 새 곡을 추가합니다
                    </p>
                  </div>
                </div>
              </Button>

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
                      플레이리스트 정보를 수정합니다
                    </p>
                  </div>
                </div>
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 text-left"
                onClick={handleDeleteClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-red-500">삭제하기</p>
                    <p className="text-xs text-muted-foreground">
                      플레이리스트를 영구적으로 삭제합니다
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>플레이리스트 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{playlistName}&quot; 플레이리스트를 정말 삭제하시겠습니까?
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
              "text-muted-foreground hover:text-foreground",
              className
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>플레이리스트 옵션</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Add Songs */}
          <DropdownMenuItem onClick={handleAddSong}>
            <Plus className="w-4 h-4 mr-3" />
            곡 추가
          </DropdownMenuItem>
          
          {/* Edit */}
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-3" />
            수정하기
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Delete */}
          <DropdownMenuItem 
            onClick={handleDeleteClick}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            삭제하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>플레이리스트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{playlistName}&quot; 플레이리스트를 정말 삭제하시겠습니까?
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