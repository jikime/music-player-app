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
} from "@/components/ui/sidebar"
import { CreatePlaylistModal } from "@/components/create-playlist-modal"
import type { Playlist } from "@/types/music"

export function NavPlaylists({ playlists }: { playlists: Playlist[] }) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const router = useRouter()
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>PLAYLISTS</SidebarGroupLabel>
      <SidebarMenu>
        {playlists.map((playlist, index) => (
          <SidebarMenuItem key={playlist.id || index}>
            <SidebarMenuButton 
              tooltip={playlist.name} 
              className="relative"
              onClick={() => router.push(`/playlist/${playlist.id}`)}
            >
              <Music className="w-4 h-4" />
              <span className="truncate">{playlist.name}</span>
              {playlist.hasNotification && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto" />
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