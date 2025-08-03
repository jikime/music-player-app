"use client"

import { useState, useMemo } from "react"
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
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  Search,
  Music,
  Plus,
  Check,
  Loader2
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
  const [addingSongs, setAddingSongs] = useState<Set<string>>(new Set())
  
  const { songs, addSongToPlaylist } = useMusicStore()

  // Filter songs not already in playlist and by search query
  const availableSongs = useMemo(() => {
    return songs.filter(song => 
      !existingSongIds.includes(song.id) &&
      (searchQuery === "" || 
       song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
  }, [songs, existingSongIds, searchQuery])

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

  const handleClose = () => {
    setSearchQuery("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Songs to Playlist</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search and add songs to your playlist
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Songs List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {availableSongs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No songs found matching your search" : "No songs available to add"}
                </p>
              </div>
            ) : (
              availableSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <ImageWithFallback
                      src={song.thumbnail}
                      alt={song.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{song.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    {song.album && (
                      <p className="text-xs text-muted-foreground/70 truncate">{song.album}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-muted-foreground flex-shrink-0">
                    {song.duration ? formatDuration(song.duration) : "--:--"}
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddSong(song.id)}
                    disabled={addingSongs.has(song.id)}
                  >
                    {addingSongs.has(song.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {availableSongs.length} songs available
          </p>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}