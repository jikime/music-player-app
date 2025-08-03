"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/loading-screen"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { AllSongs } from "@/components/all-songs"
import { MusicPlayer } from "@/components/music-player"
import { AddSongModal } from "@/components/add-song-modal"
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  MoreHorizontal,
  Clock,
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
import type { Song, Playlist } from "@/types/music"

export default function PlaylistPage() {
  const params = useParams()
  const playlistId = params.id as string
  
  const {
    playlists,
    songs,
    playerState,
    setCurrentSong,
    setIsPlaying,
    addSongToPlaylist,
    updatePlaylist,
    deletePlaylist
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
  const totalDuration = useMemo(() => {
    return playlistSongs.reduce((total, song) => total + (song.duration || 0), 0)
  }, [playlistSongs])

  useEffect(() => {
    if (playlist) {
      setPlaylistName(playlist.name)
      setPlaylistDescription(playlist.description || "")
    }
  }, [playlist])

  if (!playlist) {
    return <LoadingScreen message="Loading playlist..." />
  }

  const isPlaying = playerState.isPlaying && playlistSongs.some(song => song.id === playerState.currentSong?.id)

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) return
    
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setCurrentSong(playlistSongs[0])
      setIsPlaying(true)
    }
  }

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return
    
    const randomIndex = Math.floor(Math.random() * playlistSongs.length)
    setCurrentSong(playlistSongs[randomIndex])
    setIsPlaying(true)
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

  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600)
    const minutes = Math.floor((totalDuration % 3600) / 60)
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`
    }
    return `${minutes} min`
  }

  return (
    <div className="max-w-7xl mx-auto p-6" style={{ paddingBottom: 'var(--music-player-height)' }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className={`absolute inset-0 h-96 ${playlist.coverImage || 'bg-gradient-to-br from-purple-600 to-blue-600'} opacity-30 rounded-2xl`} />
        
        {/* Content */}
        <div className="relative px-8 pt-20 pb-12">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            {/* Cover Image */}
            <div className={`w-60 h-60 rounded-lg shadow-2xl overflow-hidden flex-shrink-0 ${
              playlist.coverImage?.startsWith('bg-') ? playlist.coverImage : 'bg-muted'
            }`}>
              {playlist.coverImage && !playlist.coverImage.startsWith('bg-') ? (
                <ImageWithFallback
                  src={playlist.coverImage}
                  alt={playlist.name}
                  width={240}
                  height={240}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-20 h-20 text-white/80" />
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase">Playlist</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="text-5xl sm:text-7xl font-bold bg-transparent border-b-2 border-primary outline-none"
                  />
                ) : (
                  <h1 className="text-5xl sm:text-7xl font-bold">{playlist.name}</h1>
                )}
              </div>
              
              {isEditing ? (
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Add a description"
                  className="text-sm text-muted-foreground bg-transparent border rounded p-2 w-full resize-none"
                  rows={2}
                />
              ) : (
                playlist.description && (
                  <p className="text-sm text-muted-foreground">{playlist.description}</p>
                )
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{playlistSongs.length} songs</span>
                <span>•</span>
                <span>{formatTotalDuration()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-6 mt-12">
            <Button
              size="lg"
              className="rounded-full"
              onClick={handlePlayAll}
              disabled={playlistSongs.length === 0}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full"
              onClick={handleShufflePlay}
              disabled={playlistSongs.length === 0}
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Shuffle
            </Button>

            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setAddSongModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Songs
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    onClick={handleSaveEdit}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="px-8 py-8">
        {playlistSongs.length > 0 ? (
          <AllSongs 
            songs={playlistSongs}
            onPlaySong={(song) => {
              setCurrentSong(song)
              setIsPlaying(true)
            }}
          />
        ) : (
          <div className="text-center py-24">
            <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start building your playlist</h3>
            <p className="text-muted-foreground mb-6">Add songs to make this playlist yours</p>
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => setAddSongModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Songs
            </Button>
          </div>
        )}
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