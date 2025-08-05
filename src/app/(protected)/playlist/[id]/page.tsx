"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { AddSongModal } from "@/components/playlist/add-song-modal"
import { CreatePlaylistModal } from "@/components/playlist/create-playlist-modal"
import { PlaylistCover } from "@/components/playlist/playlist-cover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  Check,
  Loader2
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
    removeSongFromPlaylist,
    initializeData,
    playPlaylist,
    shufflePlaylist
  } = useMusicStore()

  const [addSongModalOpen, setAddSongModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
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


  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deletePlaylist(playlistId)
      setShowDeleteDialog(false)
      // Navigate back to home
      window.history.back()
    } catch (error) {
      console.error("Failed to delete playlist:", error)
      alert("플레이리스트 삭제에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  const handleRemoveSong = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering play
    
    try {
      setDeletingSongId(songId)
      await removeSongFromPlaylist(playlistId, songId)
    } catch (error) {
      console.error("Failed to remove song from playlist:", error)
      alert("Failed to remove song. Please try again.")
    } finally {
      setDeletingSongId(null)
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
              {/* Cover Image with Play Button */}
              <PlaylistCover
                coverImage={playlist!.coverImage}
                playlistName={playlist!.name}
                size="xl"
                showHoverEffect={true}
                onClick={handlePlayAll}
                className="w-24 md:w-full aspect-square shadow-2xl md:mb-6"
              >
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/40 transition-colors duration-300" />
                
                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300">
                  {isPlaying ? (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Pause className="w-5 h-5 md:w-7 md:h-7 text-black" fill="currentColor" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 md:w-7 md:h-7 text-black ml-0.5" fill="currentColor" />
                    </div>
                  )}
                </div>
              </PlaylistCover>

              {/* Right Content for Mobile */}
              <div className="flex-1 md:w-full pl-1 md:pl-0 min-w-0">
                {/* Playlist Title */}
                <div className="text-left mb-2 md:mb-4">
                  <h1 className="text-base md:text-2xl font-bold line-clamp-2 leading-tight">{playlist!.name}</h1>
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
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Description - Hidden on mobile, shown on desktop */}
                <div className="text-left hidden md:block">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-4 leading-relaxed">
                    {playlist!.description || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Description - Below the horizontal layout */}
            <div className="text-left md:hidden mb-3">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {playlist!.description || ""}
              </p>
            </div>

            {/* Desktop Control Buttons Row */}
            <div className="hidden md:flex items-center justify-start gap-3 mb-6 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setAddSongModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {/* <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
              >
                <Share2 className="w-4 h-4" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={handleDeleteClick}
              >
                <Trash2 className="w-4 h-4" />
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
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0 bg-muted group/thumb relative">
                    <ImageWithFallback
                      src={song.thumbnail || ''}
                      alt={song.title}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors duration-300" />
                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                      <Play className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" />
                    </div>
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

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => handleRemoveSong(song.id, e)}
                    disabled={deletingSongId === song.id}
                  >
                    {deletingSongId === song.id ? (
                      <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                  </Button>
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

      
      <AddSongModal
        playlistId={playlistId}
        open={addSongModalOpen}
        onOpenChange={setAddSongModalOpen}
        existingSongIds={playlist?.songs || []}
      />

      <CreatePlaylistModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editMode={true}
        playlistToEdit={playlist ? {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          coverImage: playlist.coverImage
        } : undefined}
      />

      {/* Delete Playlist Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>플레이리스트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{playlist?.name}&quot; 플레이리스트를 정말 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}