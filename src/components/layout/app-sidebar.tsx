"use client"

import * as React from "react"
import {
  Home,
  TrendingUp,
  Link,
  Music,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavPlaylists } from "@/components/nav-playlists"
import { NavBookmarks } from "@/components/nav-bookmarks"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useMusicStore } from "@/lib/store"
import type { Song } from "@/types/music"
import { AddLinkModal } from "@/components/add-link-modal"
import { useState } from "react"


interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { playlists, bookmarks, getSong } = useMusicStore()
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false)


  // Get bookmarked songs
  const bookmarkedSongs = bookmarks
    .map(bookmark => getSong(bookmark.songId))
    .filter(Boolean)
    .slice(0, 6) // Show more bookmarks in sidebar

  const navMainItems = [
    {
      title: "Discover",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Trending",
      url: "/trending",
      icon: TrendingUp,
    },
    {
      title: "Add YouTube Link",
      url: "#",
      icon: Link,
      onClick: () => setAddLinkModalOpen(true),
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[state=expanded]:px-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 flex-shrink-0">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground">Music Player</span>
            <span className="text-xs text-muted-foreground">Your music library</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavPlaylists playlists={playlists} />
        <NavBookmarks bookmarkedSongs={bookmarkedSongs as Song[]} onPlaySong={() => {}} />
        <AddLinkModal open={addLinkModalOpen} onOpenChange={setAddLinkModalOpen} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}