'use client'

import { useState } from 'react'
import { Song } from '@/types/music'
import { useShare } from '@/hooks/use-share'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from './image-with-fallback'
import { 
  Share2,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileShareSheetProps {
  song: Song
  isOpen: boolean
  onClose: () => void
}

const shareOptions = [
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
  {
    id: 'kakao',
    label: '카카오톡',
    icon: MessageCircle,
    description: '카카오톡으로 공유',
    color: 'text-yellow-600',
  },
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
] as const

export function MobileShareSheet({ song, isOpen, onClose }: MobileShareSheetProps) {
  const isMobile = useIsMobile()
  const { 
    isSharing, 
    canUseNativeShare, 
    quickShare, 
    copyToClipboard, 
    createShareLink,
    shareNative,
    shareToPlatform 
  } = useShare()
  
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)

  // Quick share with native API or fallback
  const handleQuickShare = async () => {
    if (canUseNativeShare) {
      await quickShare(song)
      onClose()
    } else {
      // For desktop or browsers without native share, create link and copy
      const url = await createShareLink(song)
      if (url) {
        setSharedUrl(url)
        await copyToClipboard(url)
      }
    }
  }

  // Handle specific platform sharing
  const handlePlatformShare = async (platform: typeof shareOptions[number]['id']) => {
    if (platform === 'native') {
      return handleQuickShare()
    }

    if (platform === 'copy') {
      const url = sharedUrl || await createShareLink(song)
      if (url) {
        setSharedUrl(url)
        await copyToClipboard(url)
        onClose()
      }
      return
    }

    // For social platforms, ensure we have a URL first
    const url = sharedUrl || await createShareLink(song)
    if (url) {
      setSharedUrl(url)
      if (platform === 'kakao' || platform === 'twitter' || platform === 'facebook') {
        shareToPlatform(url, platform, song)
        onClose()
      }
    }
  }

  const handleClose = () => {
    setSharedUrl(null)
    onClose()
  }

  if (!isMobile) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">음악 공유</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Song Preview */}
          <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
              <ImageWithFallback
                src={song.image_data || song.thumbnail || '/placeholder.svg'}
                alt={song.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-1">{song.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2 pb-4">
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
                onClick={() => !isDisabled && handlePlatformShare(option.id)}
                disabled={isDisabled}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-muted flex items-center justify-center",
                    option.color && `bg-opacity-10 ${option.color}`
                  )}>
                    {isSharing && option.id === 'native' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className={cn("w-5 h-5", option.color)} />
                    )}
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

        {/* Quick Actions */}
        <div className="border-t pt-4 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (sharedUrl) {
                window.open(sharedUrl, '_blank')
              }
            }}
            disabled={!sharedUrl || isSharing}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            미리보기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}