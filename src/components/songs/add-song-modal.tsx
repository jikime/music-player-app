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
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Search,
  Music,
  Plus,
  Loader2
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { formatDuration } from "@/lib/music-utils"

interface AddSongModalProps {
  playlistId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingSongIds: string[]
}

export function AddSongModal({ playlistId, open, onOpenChange, existingSongIds }: AddSongModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [addingSongs, setAddingSongs] = useState<Set<string>>(new Set())
  const isMobile = useIsMobile()
  
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
      <DialogContent className={`flex flex-col bg-card border-border ${
        isMobile 
          ? 'max-w-[95vw] max-h-[85vh] w-full mx-2' 
          : 'sm:max-w-[600px] max-h-[80vh]'
      }`}>
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
            size={isMobile ? "sm" : "default"}
          />
        </div>

        {/* Songs List */}
        <ScrollArea className="flex-1 min-h-0">
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
              availableSongs.map((song) => (
                <div
                  key={song.id}
                  className={`flex items-center rounded-lg hover:bg-muted/50 transition-colors group ${
                    isMobile ? 'gap-2 p-2' : 'gap-3 p-3'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`rounded overflow-hidden flex-shrink-0 bg-muted ${
                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                  }`}>
                    <ImageWithFallback
                      src={song.thumbnail || ''}
                      alt={song.title}
                      width={isMobile ? 40 : 48}
                      height={isMobile ? 40 : 48}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      isMobile ? 'text-sm' : 'text-base'
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

                  {/* Add Button */}
                  <Button
                    size={isMobile ? "sm" : "sm"}
                    variant="ghost"
                    className={`flex-shrink-0 transition-opacity ${
                      isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={() => handleAddSong(song.id)}
                    disabled={addingSongs.has(song.id)}
                  >
                    {addingSongs.has(song.id) ? (
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
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={`flex justify-between items-center border-t border-border flex-shrink-0 ${
          isMobile ? 'pt-3' : 'pt-4'
        }`}>
          <p className={`text-muted-foreground ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            {availableSongs.length} songs available
          </p>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}