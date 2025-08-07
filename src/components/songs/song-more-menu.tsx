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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShareModal } from './share-modal'
import { AddToPlaylistPopover } from './add-to-playlist-popover'
import {
  MoreHorizontal,
  Plus,
  Share2,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  ExternalLink,
  Music,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SongMoreMenuProps {
  song: Song
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

type ShareOption = {
  id: 'native' | 'copy' | 'kakao' | 'twitter' | 'facebook';
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  color?: string;
}

const shareOptions: ShareOption[] = [
  {
    id: 'native',
    label: '기본 공유',
    icon: Share2,
    description: '시스템 공유 메뉴 사용',
  },
  {
    id: 'copy',
    label: '링크 복사',
    icon: Copy,
    description: '클립보드에 복사',
  },
  // {
  //   id: 'kakao',
  //   label: '카카오톡',
  //   icon: MessageCircle,
  //   description: '카카오톡으로 공유',
  //   color: 'text-yellow-600',
  // },
  {
    id: 'twitter',
    label: '트위터',
    icon: Twitter,
    description: 'X(트위터)로 공유',
    color: 'text-blue-400',
  },
  {
    id: 'facebook',
    label: '페이스북',
    icon: Facebook,
    description: '페이스북으로 공유',
    color: 'text-blue-600',
  },
]

export function SongMoreMenu({ song, className, size = 'icon' }: SongMoreMenuProps) {
  const isMobile = useIsMobile()
  const { playlists } = useMusicStore()
  const { 
    isSharing, 
    canUseNativeShare, 
    quickShare, 
    copyToClipboard, 
    createShareLink,
    shareNative,
    shareToPlatform 
  } = useShare()
  
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)

  // Mobile sheet handlers
  const handleMobileShare = async (platform: typeof shareOptions[number]['id']) => {
    if (platform === 'native') {
      await quickShare(song)
      setIsMobileSheetOpen(false)
      return
    }

    if (platform === 'copy') {
      const url = sharedUrl || await createShareLink(song)
      if (url) {
        setSharedUrl(url)
        await copyToClipboard(url)
        setIsMobileSheetOpen(false)
      }
      return
    }

    // For social platforms
    const url = sharedUrl || await createShareLink(song)
    if (url) {
      setSharedUrl(url)
      if (platform === 'kakao' || platform === 'twitter' || platform === 'facebook') {
        shareToPlatform(url, platform, song)
        setIsMobileSheetOpen(false)
      }
    }
  }

  // Desktop handlers
  const handleQuickShare = async () => {
    await quickShare(song)
  }

  const handleAdvancedShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsShareModalOpen(true)
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

              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider px-4 pb-2">공유하기</p>
                {shareOptions.map((option) => {
                  // Hide native share option if not available
                  if (option.id === 'native' && !canUseNativeShare) {
                    return null
                  }

                  const Icon = option.icon
                  const isDisabled = isSharing
                  
                  return (
                    <Button
                      key={option.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-4 text-left",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isDisabled) handleMobileShare(option.id)
                      }}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn(
                          "w-10 h-10 rounded-full bg-muted flex items-center justify-center",
                          option.color && `bg-opacity-10 ${option.color}`
                        )}>
                          <Icon className={cn("w-5 h-5", option.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Temporary simple button to avoid Radix UI infinite loop
  return (
    <>
      <Button
        variant="ghost"
        size={size}
        className={cn(
          "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity",
          className
        )}
        onClick={handleAdvancedShare}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {/* Advanced Share Modal */}
      <ShareModal
        song={song}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  )
}