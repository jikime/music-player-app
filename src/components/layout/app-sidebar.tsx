"use client"

import * as React from "react"
import {
  Home,
  TrendingUp,
  Music,
  User,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import Image from "next/image"

import { NavMain } from "@/components/layout/nav-main"
import { NavPlaylists } from "@/components/layout/nav-playlists"
import { NavBookmarks } from "@/components/layout/nav-bookmarks"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useMusicStore } from "@/lib/store"
import type { Song } from "@/types/music"


type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { data: session } = useSession()
  const { playlists, bookmarks, getSong, getPlaylists, getBookmarks, loadAllSongs } = useMusicStore()

  // Check if user is authenticated
  const isAuthenticated = !!session

  // Load sidebar data when session is available
  useEffect(() => {
    const loadSidebarData = async () => {
      if (!session) return
      
      console.log('Loading sidebar data...')
      try {
        // Load essential data for sidebar
        const promises = [
          loadAllSongs().catch(err => console.error('Failed to load songs for sidebar:', err)),
          getPlaylists().catch(err => console.error('Failed to load playlists for sidebar:', err)),
          getBookmarks().catch(err => console.error('Failed to load bookmarks for sidebar:', err))
        ]
        
        await Promise.allSettled(promises)
        console.log('Sidebar data loading completed')
      } catch (error) {
        console.error('Failed to load sidebar data:', error)
      }
    }
    
    loadSidebarData()
  }, [session, loadAllSongs, getPlaylists, getBookmarks])

  // Get bookmarked songs - safely handle when data is loading
  const bookmarkedSongs = React.useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return []
    
    return bookmarks
      .map(bookmark => getSong(bookmark.songId))
      .filter(Boolean)
      .slice(0, 6) // Show more bookmarks in sidebar
  }, [bookmarks, getSong])

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
    ...(isAuthenticated ? [
      {
        title: "My Songs",
        url: "/my-songs",
        icon: Music,
      }
    ] : [])
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[state=expanded]:px-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 flex-shrink-0">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground">VIBE Music</span>
            <span className="text-xs text-muted-foreground">Your music library</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        {isAuthenticated && <NavPlaylists playlists={playlists || []} />}
        {isAuthenticated && <NavBookmarks bookmarkedSongs={bookmarkedSongs as Song[]} onPlaySong={() => {}} />}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}