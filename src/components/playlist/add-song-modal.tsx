"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Search,
  Music,
  Plus,
  Loader2,
  Check,
  X
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { formatDuration } from "@/lib/music-utils"
import type { Song } from "@/types/music"

interface AddSongModalProps {
  playlistId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingSongIds: string[]
}

export function AddSongModal({ playlistId, open, onOpenChange, existingSongIds }: AddSongModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [addingSongs, setAddingSongs] = useState<Set<string>>(new Set())
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingMultiple, setIsAddingMultiple] = useState(false)
  const isMobile = useIsMobile()
  
  const { songs, addSongToPlaylist, addMultipleSongsToPlaylist } = useMusicStore()

  // API 검색 함수
  const searchSongs = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/songs?q=${encodeURIComponent(query)}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        // 이미 플레이리스트에 있는 곡들 제외
        const filteredSongs = data.songs.filter((song: Song) => 
          !existingSongIds.includes(song.id)
        )
        setSearchResults(filteredSongs)
      }
    } catch (error) {
      console.error('검색 중 오류:', error)
    } finally {
      setIsSearching(false)
    }
  }, [existingSongIds])

  // 디바운스된 검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSongs(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchSongs])

  // 표시할 곡 목록 결정
  const availableSongs = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults
    }
    // 검색어가 없으면 기존 스토어의 곡들 표시
    return songs.filter(song => !existingSongIds.includes(song.id))
  }, [searchQuery, searchResults, songs, existingSongIds])

  // 단일 곡 추가
  const handleAddSong = async (songId: string) => {
    if (addingSongs.has(songId)) return

    setAddingSongs(prev => new Set([...prev, songId]))
    try {
      await addSongToPlaylist(playlistId, songId)
    } catch (error) {
      console.error("Failed to add song to playlist:", error)
      alert("Failed to add song. Please try again.")
    } finally {
      setAddingSongs(prev => {
        const newSet = new Set(prev)
        newSet.delete(songId)
        return newSet
      })
    }
  }

  // 곡 선택/해제
  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(songId)) {
        newSet.delete(songId)
      } else {
        newSet.add(songId)
      }
      return newSet
    })
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedSongs.size === availableSongs.length) {
      setSelectedSongs(new Set())
    } else {
      setSelectedSongs(new Set(availableSongs.map(song => song.id)))
    }
  }

  // 선택된 곡들 추가
  const handleAddSelectedSongs = async () => {
    if (selectedSongs.size === 0) return

    setIsAddingMultiple(true)
    try {
      if (addMultipleSongsToPlaylist) {
        await addMultipleSongsToPlaylist(playlistId, Array.from(selectedSongs))
      } else {
        // fallback: 하나씩 추가
        for (const songId of selectedSongs) {
          await addSongToPlaylist(playlistId, songId)
        }
      }
      setSelectedSongs(new Set())
    } catch (error) {
      console.error("Failed to add songs to playlist:", error)
      alert("Failed to add some songs. Please try again.")
    } finally {
      setIsAddingMultiple(false)
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setSelectedSongs(new Set())
    setSearchResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`flex flex-col bg-card border-border ${
        isMobile 
          ? 'max-w-[95vw] max-h-[85vh] w-full mx-2' 
          : 'sm:max-w-[600px] max-h-[80vh]'
      } overflow-hidden`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={`font-bold ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>Add Songs to Playlist</DialogTitle>
          <DialogDescription className={`text-muted-foreground ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            Search and add songs to your playlist
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
            isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
          }`} />
          <Input
            placeholder={isMobile ? "Search songs..." : "Search songs, artists, or albums..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-background ${
              isMobile ? 'pl-9 text-sm' : 'pl-10'
            }`}
          />
          {isSearching && (
            <Loader2 className={`absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-muted-foreground ${
              isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
            }`} />
          )}
        </div>

        {/* Selection Controls */}
        {availableSongs.length > 0 && (
          <div className={`flex items-center justify-between border-b border-border pb-3 flex-shrink-0 ${
            isMobile ? 'text-sm' : ''
          }`}>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedSongs.size === availableSongs.length && availableSongs.length > 0}
                onCheckedChange={toggleSelectAll}
                className="data-[state=checked]:bg-primary"
              />
              <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                Select all ({availableSongs.length})
              </label>
            </div>
            {selectedSongs.size > 0 && (
              <Button
                size={isMobile ? "sm" : "default"}
                onClick={handleAddSelectedSongs}
                disabled={isAddingMultiple}
                className="gap-2"
              >
                {isAddingMultiple ? (
                  <Loader2 className={`animate-spin ${
                    isMobile ? 'w-3 h-3' : 'w-4 h-4'
                  }`} />
                ) : (
                  <Plus className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                )}
                Add {selectedSongs.size} song{selectedSongs.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}

        {/* Songs List */}
        <ScrollArea className="flex-1 min-h-0 max-h-[400px] overflow-auto">
          <div className={`pb-4 ${
            isMobile ? 'space-y-1 pr-2' : 'space-y-2 pr-4'
          }`}>
            {availableSongs.length === 0 ? (
              <div className={`text-center ${
                isMobile ? 'py-8' : 'py-12'
              }`}>
                <Music className={`mx-auto text-muted-foreground/50 mb-4 ${
                  isMobile ? 'w-8 h-8' : 'w-12 h-12'
                }`} />
                <p className={`text-muted-foreground ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  {searchQuery ? "No songs found matching your search" : "No songs available to add"}
                </p>
              </div>
            ) : (
              availableSongs.map((song) => {
                const isSelected = selectedSongs.has(song.id)
                const isAdding = addingSongs.has(song.id)
                
                return (
                  <div
                    key={song.id}
                    className={`flex items-center rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer ${
                      isMobile ? 'gap-2 p-2' : 'gap-3 p-3'
                    } ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSongSelection(song.id)}
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Thumbnail */}
                    <div className={`rounded overflow-hidden flex-shrink-0 bg-muted relative ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <ImageWithFallback
                        src={song.image_data || song.thumbnail || ''}
                        alt={song.title}
                        width={isMobile ? 40 : 48}
                        height={isMobile ? 40 : 48}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${
                        isMobile ? 'text-sm' : 'text-base'
                      } ${
                        isSelected ? 'text-primary' : ''
                      }`}>{song.title}</h4>
                      <p className={`text-muted-foreground truncate ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>{song.artist}</p>
                      {song.album && !isMobile && (
                        <p className="text-xs text-muted-foreground/70 truncate">{song.album}</p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className={`text-muted-foreground flex-shrink-0 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {song.duration ? formatDuration(song.duration) : "--:--"}
                    </div>

                    {/* Quick Add Button */}
                    <Button
                      size={isMobile ? "sm" : "sm"}
                      variant="ghost"
                      className={`flex-shrink-0 transition-opacity ${
                        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddSong(song.id)
                      }}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className={`animate-spin ${
                          isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
                        }`} />
                      ) : (
                        <Plus className={`${
                          isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
                        }`} />
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={`flex justify-between items-center border-t border-border flex-shrink-0 ${
          isMobile ? 'pt-3' : 'pt-4'
        }`}>
          <div className="flex flex-col gap-1">
            <p className={`text-muted-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              {availableSongs.length} songs available
            </p>
            {selectedSongs.size > 0 && (
              <p className={`text-primary font-medium ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                {selectedSongs.size} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {selectedSongs.size > 0 && (
              <Button 
                variant="ghost"
                size={isMobile ? "sm" : "default"}
                onClick={() => setSelectedSongs(new Set())}
              >
                <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                Clear
              </Button>
            )}
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}