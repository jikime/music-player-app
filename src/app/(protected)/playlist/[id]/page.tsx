"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { MusicPlayer } from "@/components/songs/music-player"
import { AddSongModal } from "@/components/songs/add-song-modal"
import {
  Play,
  Pause,
  Shuffle,
  MoreHorizontal,
  Music,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  X,
  Check
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { formatDuration } from "@/lib/music-utils"
import type { Song } from "@/types/music"

export default function PlaylistPage() {
  const params = useParams()
  const playlistId = params.id as string
  
  const {
    playlists,
    songs,
    playerState,
    isLoading,
    setIsPlaying,
    updatePlaylist,
    deletePlaylist,
    initializeData,
    playPlaylist,
    shufflePlaylist
  } = useMusicStore()

  const [isEditing, setIsEditing] = useState(false)
  const [playlistName, setPlaylistName] = useState("")
  const [playlistDescription, setPlaylistDescription] = useState("")
  const [addSongModalOpen, setAddSongModalOpen] = useState(false)
  
  // Find the playlist
  const playlist = playlists.find(p => p.id === playlistId)
  
  // Get songs in this playlist
  const playlistSongs = useMemo(() => {
    if (!playlist) return []
    return playlist.songs.map(songId => songs.find(s => s.id === songId)).filter(Boolean) as Song[]
  }, [playlist, songs])
  
  // Calculate total duration
  // const totalDuration = useMemo(() => {
  //   return playlistSongs.reduce((total, song) => total + (song.duration || 0), 0)
  // }, [playlistSongs])

  // Initialize data on mount if needed
  useEffect(() => {
    if (playlists.length === 0 && songs.length === 0 && !isLoading) {
      initializeData()
    }
  }, [playlists.length, songs.length, isLoading, initializeData])

  useEffect(() => {
    if (playlist) {
      setPlaylistName(playlist.name)
      setPlaylistDescription(playlist.description || "")
    }
  }, [playlist])

  // Show loading if data is being loaded or playlist not found yet
  if (isLoading || (!playlist && playlists.length === 0)) {
    return <LoadingScreen message="Loading playlist..." />
  }

  // If data is loaded but playlist not found, show error
  if (!playlist && playlists.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
          <p className="text-muted-foreground mb-6">The playlist you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const isPlaying = playerState.isPlaying && 
    playerState.currentPlaylist === playlistId && 
    playlistSongs.some(song => song.id === playerState.currentSong?.id)

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) return
    
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      playPlaylist(playlistId)
    }
  }

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return
    
    shufflePlaylist(playlistId)
  }

  const handleSaveEdit = async () => {
    try {
      await updatePlaylist(playlistId, {
        name: playlistName,
        description: playlistDescription
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update playlist:", error)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      try {
        await deletePlaylist(playlistId)
        // Navigate back to home
        window.history.back()
      } catch (error) {
        console.error("Failed to delete playlist:", error)
      }
    }
  }

  return (
    <div className="min-h-screen pb-32 md:pb-28">
      <div className="flex flex-col md:flex-row md:justify-center max-w-6xl w-full mx-auto">
        {/* Left Panel - Playlist Info */}
        <div className="w-full md:w-80 md:flex-shrink-0 p-2 md:p-8">
          <div className="md:sticky md:top-8">
            {/* Mobile Horizontal Layout */}
            <div className="flex md:block gap-3 mb-4 md:mb-0">
              {/* Cover Image */}
              <div className="w-24 md:w-full aspect-square rounded-lg shadow-2xl overflow-hidden md:mb-6 relative flex-shrink-0">
              {playlist!.coverImage ? (
                playlist!.coverImage.startsWith('bg-') ? (
                  // Gradient background
                  <div className={`w-full h-full ${playlist!.coverImage} flex items-center justify-center`}>
                    <Music className="w-16 h-16 text-white/80" />
                  </div>
                ) : (
                  // Image background
                  <ImageWithFallback
                    src={playlist!.coverImage}
                    alt={playlist!.name}
                    width={320}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                // Default background
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground/50" />
                </div>
              )}
              </div>

              {/* Right Content for Mobile */}
              <div className="flex-1 md:w-full pl-1 md:pl-0 min-w-0">
                {/* Playlist Title */}
                <div className="text-left mb-2 md:mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="text-base md:text-2xl font-bold bg-transparent border-b-2 border-primary outline-none w-full text-left"
                    />
                  ) : (
                    <h1 className="text-base md:text-2xl font-bold line-clamp-2 leading-tight">{playlist!.name}</h1>
                  )}
                </div>
                
                {/* Platform Label */}
                <div className="text-left mb-1 md:mb-4">
                  <p className="text-xs md:text-sm text-muted-foreground">YouTube Music</p>
                </div>
                
                {/* Artists */}
                <div className="text-left mb-2 md:mb-0">
                  {playlistSongs.length > 0 && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {Array.from(new Set(playlistSongs.slice(0, 3).map(song => song.artist))).join(', ')}
                      {playlistSongs.length > 3 && ' 등'}
                    </p>
                  )}
                </div>

                {/* Mobile Control Buttons - Right in horizontal layout */}
                <div className="flex md:hidden items-center justify-start gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => setAddSongModalOpen(true)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => setAddSongModalOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>

                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={handleSaveEdit}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Description - Hidden on mobile, shown on desktop */}
                <div className="text-left hidden md:block">
                  {isEditing ? (
                    <textarea
                      value={playlistDescription}
                      onChange={(e) => setPlaylistDescription(e.target.value)}
                      placeholder="곡없이 재즈하는 나만을 위한 릿음설성 음악입니다. 항상 시술에 업데이트합니다."
                      className="text-sm text-muted-foreground bg-transparent border rounded p-2 w-full resize-none mb-4"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-4 leading-relaxed">
                      {playlist!.description || "곡없이 재즈하는 나만을 위한 릿음설성 음악입니다. 항상 시술에 업데이트합니다."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Description - Below the horizontal layout */}
            <div className="text-left md:hidden mb-3">
              {isEditing ? (
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="곡없이 재즈하는 나만을 위한 릿음설성 음악입니다. 항상 시술에 업데이트합니다."
                  className="text-sm text-muted-foreground bg-transparent border rounded p-2 w-full resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {playlist!.description || "곡없이 재즈하는 나만을 위한 릿음설성 음악입니다. 항상 시술에 업데이트합니다."}
                </p>
              )}
            </div>

            {/* Desktop Control Buttons Row */}
            <div className="hidden md:flex items-center justify-start gap-3 mb-6 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setAddSongModalOpen(true)}
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setAddSongModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>

              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={handleSaveEdit}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Large Play Button */}
            <div className="relative mb-4 flex justify-start">
              <Button
                size="icon"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 md:w-8 md:h-8 ml-3 md:ml-4"
                onClick={handleShufflePlay}
                disabled={playlistSongs.length === 0}
              >
                <Shuffle className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Songs List */}
        <div className="flex-1 p-2 md:p-8 md:pl-0">
          {playlistSongs.length > 0 ? (
            <div className="space-y-1">
              {playlistSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => {
                    const songIndex = playlistSongs.findIndex(s => s.id === song.id)
                    playPlaylist(playlistId, songIndex)
                  }}
                >
                  {/* Thumbnail */}
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <ImageWithFallback
                      src={song.thumbnail || ''}
                      alt={song.title}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base line-clamp-1 leading-tight">{song.title}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                      {song.artist}{song.album && ` • ${song.album}`}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="text-xs md:text-sm text-muted-foreground flex-shrink-0 w-9 md:w-12 text-right">
                    {song.duration ? formatDuration(song.duration) : "--:--"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-24">
              <Music className="w-10 h-10 md:w-16 md:h-16 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-sm md:text-lg font-semibold mb-2">Start building your playlist</h3>
              <p className="text-xs md:text-base text-muted-foreground mb-4">Add songs to make this playlist yours</p>
              <Button 
                variant="outline" 
                className="rounded-full text-sm"
                onClick={() => setAddSongModalOpen(true)}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add Songs
              </Button>
            </div>
          )}
        </div>
      </div>

      <MusicPlayer />
      
      <AddSongModal
        playlistId={playlistId}
        open={addSongModalOpen}
        onOpenChange={setAddSongModalOpen}
        existingSongIds={playlist?.songs || []}
      />
    </div>
  )
}