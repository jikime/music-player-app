"use client"

import { useEffect, useState } from 'react'
import { ImageWithFallback } from './image-with-fallback'
import { useMusicStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface VinylRecordProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
}

const centerSizeMap = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6', 
  xl: 'w-8 h-8'
}

export function VinylRecord({ size = 'md', className }: VinylRecordProps) {
  const { playerState } = useMusicStore()
  const { currentSong, isPlaying } = playerState
  const [isSpinning, setIsSpinning] = useState(false)

  // Control spinning animation based on play state
  useEffect(() => {
    if (isPlaying && currentSong) {
      // Small delay to create a more natural start
      const timer = setTimeout(() => setIsSpinning(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsSpinning(false)
    }
  }, [isPlaying, currentSong])

  if (!currentSong) {
    return (
      <div className={cn(
        "relative rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg border-2 border-gray-700/50 flex items-center justify-center",
        sizeMap[size],
        className
      )}>
        {/* Center hole */}
        <div className={cn(
          "rounded-full bg-gray-600",
          centerSizeMap[size]
        )} />
        
        {/* Concentric circles for vinyl effect */}
        <div className="absolute inset-2 rounded-full border border-gray-600/30" />
        <div className="absolute inset-4 rounded-full border border-gray-600/20" />
      </div>
    )
  }

  return (
    <div className={cn(
      "relative group",
      sizeMap[size],
      className
    )}>
      {/* Vinyl record container */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full shadow-lg transition-all duration-300 ease-out",
          "bg-gradient-to-br from-gray-800 to-black",
          "border-2 border-gray-700/50",
          isSpinning && "animate-spin",
          // Add a subtle glow effect when playing
          isPlaying && "shadow-xl shadow-primary/20"
        )}
        style={{
          animationDuration: isSpinning ? '3s' : '0s',
          animationTimingFunction: 'linear',
          animationIterationCount: isSpinning ? 'infinite' : 'initial'
        }}
      >
        {/* Album art */}
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <ImageWithFallback
            src={currentSong.thumbnail || "/placeholder.svg"}
            alt={currentSong.title}
            width={200}
            height={200}
            className="w-full h-full object-cover rounded-full opacity-90"
          />
        </div>

        {/* Center label/hole */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "rounded-full bg-gradient-to-br from-gray-700 to-gray-900",
          "border border-gray-600/50 shadow-inner",
          "flex items-center justify-center",
          centerSizeMap[size]
        )}>
          {/* Small center dot */}
          <div className="w-1 h-1 rounded-full bg-gray-500" />
        </div>

        {/* Vinyl grooves effect */}
        <div className="absolute inset-3 rounded-full border border-black/20 pointer-events-none" />
        <div className="absolute inset-4 rounded-full border border-black/15 pointer-events-none" />
        <div className="absolute inset-5 rounded-full border border-black/10 pointer-events-none" />
        
        {/* Subtle highlight for 3D effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Reflection/shine effect when playing */}
      {isPlaying && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full opacity-30 pointer-events-none",
            "bg-gradient-to-tr from-transparent via-white/10 to-transparent",
            isSpinning && "animate-spin"
          )}
          style={{
            animationDuration: '6s', // Half speed of main rotation
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        />
      )}
    </div>
  )
}