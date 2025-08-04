"use client"

import { useEffect } from "react"
import { useMusicStore } from "@/lib/store"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { RecentlyPlayed } from "@/components/songs/recently-played"
import { AllSongs } from "@/components/songs/all-songs"
import type { Song } from "@/types/music"

export default function Component() {
  
  const {
    songs,
    recentlyPlayed,
    setCurrentSong,
    setIsPlaying,
    initializeData,
    isLoading,
  } = useMusicStore()

  // Initialize data when component mounts
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Get all recently played songs from store
  const recentSongs = recentlyPlayed

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen p-1 md:p-6 pb-32 md:pb-28">
      <RecentlyPlayed 
        songs={recentSongs}
        onPlaySong={handlePlaySong}
        isLoading={isLoading}
      />
      
      <AllSongs 
        songs={songs}
        onPlaySong={handlePlaySong}
        isLoading={isLoading}
      />
      
    </div>
  )
}
