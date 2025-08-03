"use client"

import { useState, useEffect } from "react"
import { useMusicStore } from "@/lib/store"
import { MusicPlayer } from "@/components/music-player"
import { LoadingScreen } from "@/components/loading-screen"
import { RecentlyPlayed } from "@/components/recently-played"
import { AllSongs } from "@/components/all-songs"
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
  }, [])

  // Get recently played songs (last 4 from store)
  const recentSongs = recentlyPlayed.slice(0, 4)

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="mx-auto p-6">
      <RecentlyPlayed 
          songs={recentSongs}
          onPlaySong={handlePlaySong}
        />
        
        <AllSongs 
          songs={songs}
          onPlaySong={handlePlaySong}
        />
      
      <MusicPlayer />  
    </div>
  )
}
