'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, Check, Loader2, Music } from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { toast } from "sonner"
import type { Song } from "@/types/music"

interface AddToPlaylistPopoverProps {
  song: Song
  children: React.ReactNode
}

export function AddToPlaylistPopover({ song, children }: AddToPlaylistPopoverProps) {
  const [open, setOpen] = useState(false)
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null)
  const { playlists, getPlaylists, addSongToPlaylist } = useMusicStore()

  // Load playlists when popover opens
  useEffect(() => {
    if (open && playlists.length === 0) {
      getPlaylists().catch(console.error)
    }
  }, [open, getPlaylists, playlists.length])

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    if (addingToPlaylist) return

    setAddingToPlaylist(playlistId)
    try {
      await addSongToPlaylist(playlistId, song.id)
      toast.success(`"${song.title}"을(를) "${playlistName}" 플레이리스트에 추가했습니다.`)
      setOpen(false)
    } catch (error) {
      console.error('Failed to add song to playlist:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      
      if (errorMessage.includes('already exists')) {
        toast.error('이미 해당 플레이리스트에 추가된 노래입니다.')
      } else {
        toast.error('플레이리스트에 노래 추가에 실패했습니다.')
      }
    } finally {
      setAddingToPlaylist(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">플레이리스트에 추가</h4>
          <p className="text-xs text-muted-foreground truncate">{song.title}</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="p-6 text-center">
              <Music className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                아직 생성된 플레이리스트가 없습니다
              </p>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                플레이리스트 만들기
              </Button>
            </div>
          ) : (
            <div className="py-1">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                  onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                  disabled={addingToPlaylist === playlist.id}
                >
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {playlist.songs?.length || 0}곡
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {addingToPlaylist === playlist.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}