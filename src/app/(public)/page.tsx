"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useMusicStore } from "@/lib/store"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { RecentlyPlayed } from "@/components/songs/recently-played"
import { AllSongs } from "@/components/songs/all-songs"
import type { Song } from "@/types/music"

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

  // Initialize data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadPromises = [loadAllSongs()] // 모든 노래 로드 (공용 + 공유된 노래 + 내 노래)
        
        // 인증된 사용자에게만 최근 재생 기록, 플레이리스트, 북마크 로드
        if (session) {
          loadPromises.push(
            getRecentlyPlayed(),
            getPlaylists(), // 플레이리스트 로드 추가
            getBookmarks() // 북마크 로드 추가
          )
        }
        
        await Promise.all(loadPromises)
      } catch (error) {
        console.error('Failed to load discover page data:', error)
      }
    }
    
    loadData()
  }, [loadAllSongs, getRecentlyPlayed, getPlaylists, getBookmarks, session])

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
      {/* 인증된 사용자에게만 Recently Played 표시 */}
      {session && (
        <RecentlyPlayed 
          songs={recentSongs}
          onPlaySong={handlePlaySong}
          isLoading={isLoading}
        />
      )}
      
      <AllSongs 
        songs={songs}
        onPlaySong={handlePlaySong}
        isLoading={isLoading}
      />
      
    </div>
  )
}
