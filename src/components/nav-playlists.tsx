"use client"

import { Music, Plus } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface Playlist {
  name: string
  hasNotification?: boolean
}

export function NavPlaylists({ playlists }: { playlists: Playlist[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>PLAYLISTS</SidebarGroupLabel>
      <SidebarMenu>
        {playlists.map((playlist, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton tooltip={playlist.name} className="relative">
              <Music className="w-4 h-4" />
              <span className="truncate">{playlist.name}</span>
              {playlist.hasNotification && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-auto" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Add Playlist" className="text-muted-foreground">
            <Plus className="w-4 h-4" />
            <span>ADD PLAYLIST</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}