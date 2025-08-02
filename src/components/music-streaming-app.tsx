"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  TrendingUp,
  Plus,
  Heart,
  MoreHorizontal,
  Clock,
  Music,
  ChevronRight,
  Link,
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { MusicPlayer } from "./music-player"
import { AddLinkModal } from "./add-link-modal"
import type { Song } from "@/types/music"

export default function Component() {
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false)
  
  const {
    songs,
    playlists,
    bookmarks,
    recentlyPlayed,
    setCurrentSong,
    setIsPlaying,
    isBookmarked,
    getSong,
    initializeData,
    isLoading
  } = useMusicStore()

  // Initialize data when component mounts
  useEffect(() => {
    initializeData()
  }, [])

  // Get recently played songs (last 4 from store)
  const recentSongs = recentlyPlayed.slice(0, 4)

  // Get bookmarked songs
  const bookmarkedSongs = bookmarks
    .map(bookmark => getSong(bookmark.songId))
    .filter(Boolean)
    .slice(0, 4)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPlays = (plays: number) => {
    return plays.toLocaleString()
  }

  // Calculate total playlist duration
  const getTotalDuration = () => {
    const totalSeconds = songs.reduce((total, song) => total + song.duration, 0)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4 text-lg">Loading music library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/10">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">MENU</p>
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
                Discover
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:bg-white/10">
                <TrendingUp className="w-4 h-4" />
                Trending
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-gray-400 hover:bg-white/10"
                onClick={() => setAddLinkModalOpen(true)}
              >
                <Link className="w-4 h-4" />
                Add YouTube Link
              </Button>
            </nav>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">PLAYLISTS</p>
            <div className="space-y-2">
              {playlists.map((playlist, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                  <Music className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{playlist.name}</span>
                  {playlist.hasNotification && <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto"></div>}
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 mt-4 text-gray-400 hover:bg-white/10">
              <Plus className="w-4 h-4" />
              ADD PLAYLIST
            </Button>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">BOOKMARKS</p>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {bookmarkedSongs.map((song) => song ? (
                  <div 
                    key={song.id} 
                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 rounded"
                    onClick={() => handlePlaySong(song)}
                  >
                    <Image
                      src={song.thumbnail || "/placeholder.svg?height=40&width=40"}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{song.title}</p>
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
            </ScrollArea>
            <Button variant="ghost" className="w-full justify-center mt-4 text-gray-400 hover:bg-white/10">
              LOAD MORE
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold">Discover</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6 pb-32">
          {/* Recently Played */}
          <div className="mb-8">
            <h2 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">RECENTLY PLAYED</h2>
            <div className="flex gap-4 mb-4">
              {recentSongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer rounded-xl border shadow-sm flex flex-col"
                  onClick={() => handlePlaySong(song)}
                >
                  <div className="p-0">
                    <div className="w-48 h-48 bg-gray-800 rounded-t overflow-hidden">
                      <Image
                        src={song.thumbnail || "/placeholder.svg?height=192&width=192"}
                        alt={song.title}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1">{song.title}</h3>
                      <p className="text-sm text-gray-400">{song.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center">
                <Button variant="ghost" className="flex items-center gap-2 text-gray-400 hover:text-white">
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* All Songs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-400 uppercase tracking-wider">ALL SONGS</h2>
              {songs.length > 0 && (
                <span className="text-xs text-gray-500">
                  {songs.length} song{songs.length !== 1 ? 's' : ''} • {getTotalDuration()}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div 
                  key={song.id} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="text-gray-400 w-8 text-sm">#{index + 1}</span>
                  <Image
                    src={song.thumbnail || "/placeholder.svg?height=50&width=50"}
                    alt={song.title}
                    width={50}
                    height={50}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{song.title}</h3>
                    <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
                  <div className="text-sm text-gray-400 min-w-0 flex-1">{song.album || 'Unknown Album'}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Music className="w-4 h-4" />
                      <span className="text-sm">{formatPlays(song.plays)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatDuration(song.duration)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 ${isBookmarked(song.id) ? "text-pink-500" : "text-gray-400"} hover:text-pink-500`}
                    >
                      <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-gray-400 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        
        {/* Fixed Bottom Music Player within main content */}
        <MusicPlayer />
      </div>
      
      {/* Add Link Modal */}
      <AddLinkModal open={addLinkModalOpen} onOpenChange={setAddLinkModalOpen} />
    </div>
  )
}
