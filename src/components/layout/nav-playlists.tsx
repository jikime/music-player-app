"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Music, Plus } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CreatePlaylistModal } from "@/components/playlist/create-playlist-modal"
import { PlaylistCover } from "@/components/playlist/playlist-cover"
import type { Playlist } from "@/types/music"

export function NavPlaylists({ playlists }: { playlists: Playlist[] }) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const router = useRouter()
  const { setOpenMobile, isMobile } = useSidebar()
  
  const handlePlaylistClick = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`)
    // Close sidebar on mobile
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>PLAYLISTS</SidebarGroupLabel>
      <SidebarMenu>
        {playlists.map((playlist, index) => (
          <SidebarMenuItem key={playlist.id || index}>
            <SidebarMenuButton 
              tooltip={playlist.name} 
              className="relative flex items-center gap-2"
              onClick={() => handlePlaylistClick(playlist.id)}
            >
              <PlaylistCover
                coverImage={playlist.coverImage}
                playlistName={playlist.name}
                size="sm"
                className="flex-shrink-0"
              />
              <span className="truncate flex-1">{playlist.name}</span>
              {playlist.hasNotification && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton 
            tooltip="Add Playlist" 
            className="text-muted-foreground"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>ADD PLAYLIST</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreatePlaylistModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </SidebarGroup>
  )
}