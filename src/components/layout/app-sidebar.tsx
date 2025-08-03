"use client"

import * as React from "react"
import {
  Home,
  TrendingUp,
  Link,
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
      url: "#",
      icon: Home,
      isActive: true,
    },
    {
      title: "Trending",
      url: "#",
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