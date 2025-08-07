'use client'

import { Button } from '@/components/ui/button'
import { useShare } from '@/hooks/use-share'
import { Song } from '@/types/music'
import { Share2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickShareButtonProps {
  song: Song
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function QuickShareButton({ 
  song, 
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false
}: QuickShareButtonProps) {
  const { isSharing, quickShare, canUseNativeShare } = useShare()

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await quickShare(song)
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={handleQuickShare}
      disabled={isSharing}
      title={canUseNativeShare ? "공유하기" : "링크 복사"}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {canUseNativeShare ? "공유" : "복사"}
        </span>
      )}
    </Button>
  )
}