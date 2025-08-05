"use client"

import React, { useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useMusicStore } from "@/lib/store"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { RecentlyPlayed } from "@/components/songs/recently-played"
import { AllSongs } from "@/components/songs/all-songs"
import type { Song } from "@/types/music"

const MemoizedRecentlyPlayed = React.memo(RecentlyPlayed)
const MemoizedAllSongs = React.memo(AllSongs)

export default function Component() {
  const { data: session } = useSession()
  
  const {
    songs,
    recentlyPlayed,
    setCurrentSong,
    setIsPlaying,
    loadAllSongs,
    getRecentlyPlayed,
    getPlaylists,
    getBookmarks,
    isLoading,
  } = useMusicStore()

  // Memoize session-dependent data loading promises
  const dataLoadingPromises = useMemo(() => {
    const basePromises = [loadAllSongs()]
    
    if (session) {
      basePromises.push(
        getRecentlyPlayed(),
        getPlaylists(),
        getBookmarks()
      )
    }
    
    return basePromises
  }, [session, loadAllSongs, getRecentlyPlayed, getPlaylists, getBookmarks])

  // Initialize data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all(dataLoadingPromises)
      } catch (error) {
        console.error('Failed to load discover page data:', error)
      }
    }
    
    loadData()
  }, [dataLoadingPromises])

  // Memoized play handler to prevent unnecessary re-renders
  const handlePlaySong = useCallback((song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }, [setCurrentSong, setIsPlaying])

  // Memoize recent songs to prevent unnecessary processing
  const recentSongs = useMemo(() => recentlyPlayed, [recentlyPlayed])

  // Memoize conditional rendering logic
  const shouldShowRecentlyPlayed = useMemo(() => Boolean(session), [session])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen p-1 md:p-6 pb-32 md:pb-28">
      {/* 인증된 사용자에게만 Recently Played 표시 */}
      {shouldShowRecentlyPlayed && (
        <MemoizedRecentlyPlayed 
          songs={recentSongs}
          onPlaySong={handlePlaySong}
          isLoading={isLoading}
        />
      )}
      
      <MemoizedAllSongs 
        songs={songs}
        onPlaySong={handlePlaySong}
        isLoading={isLoading}
      />
      
    </div>
  )
}