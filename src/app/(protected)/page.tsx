"use client"

import { useEffect } from "react"
import { useMusicStore } from "@/lib/store"
import { MusicPlayer } from "@/components/songs/music-player"
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
    <div className="min-h-screen px-4 md:px-6 music-player-offset">
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
      
      <MusicPlayer />  
    </div>
  )
}
