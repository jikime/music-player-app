"use client"

import { Music } from "lucide-react"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { isGradientCover, isImageCover } from "@/lib/playlist-utils"
import { cn } from "@/lib/utils"

interface PlaylistCoverProps {
  coverImage?: string
  playlistName: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showHoverEffect?: boolean
  onClick?: () => void
  children?: React.ReactNode // For play button overlay
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-24 h-24',
  xl: 'w-full h-full'
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-8 h-8', 
  xl: 'w-16 h-16'
}

export function PlaylistCover({ 
  coverImage, 
  playlistName, 
  className,
  size = 'md',
  showHoverEffect = false,
  onClick,
  children
}: PlaylistCoverProps) {
  const baseClasses = cn(
    "rounded-lg overflow-hidden flex-shrink-0 relative",
    sizeClasses[size],
    showHoverEffect && "group/cover transition-transform duration-300 hover:scale-105",
    onClick && "cursor-pointer",
    className
  )

  // 그래디언트 색상인 경우
  if (isGradientCover(coverImage)) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <div className={`w-full h-full ${coverImage} flex items-center justify-center ${showHoverEffect ? 'transition-transform duration-300 group-hover/cover:scale-110' : ''}`}>
          <Music className={cn("text-white/80", iconSizes[size])} />
        </div>
        {children}
      </div>
    )
  }

  // Base64 이미지인 경우
  if (isImageCover(coverImage)) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <ImageWithFallback
          src={coverImage!}
          alt={`${playlistName} cover`}
          width={size === 'xl' ? 320 : size === 'lg' ? 96 : size === 'md' ? 48 : 32}
          height={size === 'xl' ? 320 : size === 'lg' ? 96 : size === 'md' ? 48 : 32}
          className={cn(
            "w-full h-full object-cover",
            showHoverEffect && "transition-transform duration-300 group-hover/cover:scale-110"
          )}
        />
        {children}
      </div>
    )
  }

  // 기본 상태 (이미지 없음)
  return (
    <div className={baseClasses} onClick={onClick}>
      <div className={`w-full h-full bg-muted flex items-center justify-center ${showHoverEffect ? 'transition-transform duration-300 group-hover/cover:scale-110' : ''}`}>
        <Music className={cn("text-muted-foreground/50", iconSizes[size])} />
      </div>
      {children}
    </div>
  )
}