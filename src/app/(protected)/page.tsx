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
    <div className="max-w-7xl mx-auto p-6" style={{ paddingBottom: 'var(--music-player-height)' }}>
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
