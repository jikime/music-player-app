"use client"

import React, { useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useMusicStore } from "@/lib/store"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { formatDuration } from "@/lib/music-utils"
import { useRouter } from "next/navigation"
import type { Song } from "@/types/music"

export default function RecentlyPlayedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const {
    recentlyPlayed,
    setCurrentSong,
    setIsPlaying,
    getRecentlyPlayed,
    isLoading,
  } = useMusicStore()

  // Initialize data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        try {
          await getRecentlyPlayed()
        } catch (error) {
          console.error('Failed to load recently played songs:', error)
        }
      }
    }
    
    loadData()
  }, [session, getRecentlyPlayed])

  // Memoized play handler to prevent unnecessary re-renders
  const handlePlaySong = useCallback((song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }, [setCurrentSong, setIsPlaying])

  // Remove duplicates and memoize songs
  const songs = useMemo(() => {
    const seenIds = new Set<string>()
    return recentlyPlayed.filter(song => {
      if (seenIds.has(song.id)) {
        return false
      }
      seenIds.add(song.id)
      return true
    })
  }, [recentlyPlayed])

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-32 md:pb-28">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="h-10 w-10 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Recently Played</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {songs.length} songs
          </p>
        </div>
      </div>

      {/* Songs Grid */}
      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No recently played songs</h3>
          <p className="text-muted-foreground">
            Start listening to music to see your recently played songs here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {songs.map((song) => (
            <div
              key={song.id}
              className="bg-card/50 border-border hover:bg-card/80 hover:scale-105 transition-all cursor-pointer rounded-xl border shadow-sm flex flex-col group"
              onClick={() => handlePlaySong(song)}
            >
              <div className="w-full aspect-square bg-muted rounded-t-xl overflow-hidden relative">
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
              <div className="p-3 md:p-4 flex flex-col flex-1">
                <h3 
                  className="font-semibold mb-1 line-clamp-2 leading-tight min-h-[2.5rem] text-sm md:text-base" 
                  title={song.title}
                >
                  {song.title}
                </h3>
                <p 
                  className="text-xs md:text-sm text-muted-foreground truncate mb-2" 
                  title={song.artist}
                >
                  {song.artist}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-auto">
                  {song.duration > 0 ? formatDuration(song.duration) : '0:00'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}