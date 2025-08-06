"use client"

import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { useMusicStore } from "@/lib/store"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { formatDuration } from "@/lib/music-utils"
import type { Song } from "@/types/music"

interface NavBookmarksProps {
  bookmarkedSongs: Song[]
  onPlaySong: (song: Song) => void
}

export function NavBookmarks({ bookmarkedSongs, onPlaySong }: NavBookmarksProps) {
  const { playSong } = useMusicStore()
  const { setOpenMobile, isMobile } = useSidebar()
  
  const handleSongClick = (song: Song) => {
    playSong(song)
    // Close sidebar on mobile
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>BOOKMARKS</SidebarGroupLabel>
      <SidebarMenu>
        {bookmarkedSongs.map((song) => (
          <SidebarMenuItem key={song.id}>
            <SidebarMenuButton
              tooltip={`${song.title} - ${song.artist}`}
              className="h-auto p-2"
              onClick={() => handleSongClick(song)}
            >
              <div className="flex items-center gap-3 w-full">
                <ImageWithFallback
                  src={song.image_data || song.thumbnail || "/placeholder.svg"}
                  alt={song.title}
                  width={32}
                  height={32}
                  className="w-8 aspect-square rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                {song.duration > 0 && (
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDuration(song.duration)}
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}