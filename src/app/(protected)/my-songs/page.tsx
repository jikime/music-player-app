"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { AddLinkModal } from "@/components/songs/add-link-modal"
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
  Plus,
  Edit,
  Trash2,
  Music,
  Search
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { formatDuration } from "@/lib/music-utils"
import { Input } from "@/components/ui/input"
import type { Song } from "@/types/music"

export default function MySongsPage() {
  const {
    mySongs,
    playerState,
    isLoading,
    setIsPlaying,
    getMySongs,
    deleteSong,
    playSong
  } = useMusicStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [songToDelete, setSongToDelete] = useState<Song | null>(null)

  const { currentSong, isPlaying } = playerState

  // Load my songs on mount
  useEffect(() => {
    getMySongs().catch(console.error)
  }, [getMySongs])

  // Filter songs based on search query
  const filteredSongs = mySongs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying)
    } else {
      playSong(song)
    }
  }

  const handleDeleteClick = (song: Song) => {
    setSongToDelete(song)
  }

  const handleDeleteConfirm = async () => {
    if (!songToDelete) return
    
    try {
      setDeletingSongId(songToDelete.id)
      await deleteSong(songToDelete.id)
      setSongToDelete(null)
    } catch (error) {
      console.error("Failed to delete song:", error)
      alert("노래 삭제에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setDeletingSongId(null)
    }
  }

  const handleDeleteCancel = () => {
    setSongToDelete(null)
  }

  const handleAddSong = () => {
    setEditingSong(null)
    setIsModalOpen(true)
  }

  const handleEditSong = (song: Song) => {
    setEditingSong(song)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingSong(null)
  }

  if (isLoading && mySongs.length === 0) {
    return <LoadingScreen message="내 음악을 불러오는 중..." />
  }

  return (
    <div className="min-h-screen pb-32 md:pb-28 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">My Songs</h1>
          <p className="text-muted-foreground">내가 추가한 노래들을 관리하세요</p>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="노래, 아티스트, 앨범 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="w-full sm:w-auto" onClick={handleAddSong}>
            <Plus className="w-4 h-4 mr-2" />
            노래 추가
          </Button>
        </div>

        {/* Songs List */}
        {filteredSongs.length > 0 ? (
          <div className="space-y-1">
            {/* Header Row - Desktop Only */}
            <div className="hidden md:grid md:grid-cols-[3rem_1fr_1fr_6rem_8rem] gap-4 items-center p-4 text-sm text-muted-foreground border-b">
              <div></div>
              <div>제목</div>
              <div>아티스트</div>
              <div>재생시간</div>
              <div>작업</div>
            </div>

            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="flex md:grid md:grid-cols-[3rem_1fr_1fr_6rem_8rem] gap-2 md:gap-4 items-center p-3 md:p-4 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                {/* Play Button / Thumbnail */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0 bg-muted group/thumb relative">
                  <ImageWithFallback
                    src={song.thumbnail || ''}
                    alt={song.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors duration-300" />
                  {/* Play Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                    {currentSong?.id === song.id && isPlaying ? (
                      <Pause className="w-4 h-4 text-white" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                    )}
                  </div>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0 md:min-w-0">
                  <h3 className="font-medium text-sm md:text-base line-clamp-1 leading-tight">
                    {song.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:hidden">
                    {song.artist}
                  </p>
                </div>

                {/* Artist - Desktop Only */}
                <div className="hidden md:block min-w-0">
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {song.artist}
                  </p>
                </div>

                {/* Duration */}
                <div className="text-xs md:text-sm text-muted-foreground flex-shrink-0">
                  {song.duration ? formatDuration(song.duration) : "--:--"}
                </div>

                {/* Actions */}
                <div 
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditSong(song)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog open={songToDelete?.id === song.id} onOpenChange={(open) => !open && handleDeleteCancel()}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(song)
                        }}
                        disabled={deletingSongId === song.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>노래 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{songToDelete?.title}"을(를) 정말 삭제하시겠습니까?
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-24">
            <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "아직 추가한 노래가 없습니다"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "다른 검색어로 시도해보세요" 
                : "첫 번째 노래를 추가해보세요"
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleAddSong}>
                <Plus className="w-4 h-4 mr-2" />
                노래 추가
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Song Modal */}
      <AddLinkModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editMode={!!editingSong}
        songToEdit={editingSong || undefined}
      />
    </div>
  )
}