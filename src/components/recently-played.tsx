import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { formatDuration } from "@/lib/music-utils"
import type { Song } from "@/types/music"

interface RecentlyPlayedProps {
  songs: Song[]
  onPlaySong: (song: Song) => void
}

export function RecentlyPlayed({ songs, onPlaySong }: RecentlyPlayedProps) {
  return (
    <div className="mb-8">
      <h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">RECENTLY PLAYED</h2>
      <div className="flex gap-4 mb-4 items-stretch">
        {songs.map((song) => (
          <div
            key={song.id}
            className="bg-card/50 border-border hover:bg-card/80 transition-colors cursor-pointer rounded-xl border shadow-sm flex flex-col w-56 flex-shrink-0"
            onClick={() => onPlaySong(song)}
          >
            <div className="w-full aspect-square bg-muted rounded-t-xl overflow-hidden relative">
              <Image
                src={song.thumbnail || "/placeholder.svg?height=224&width=224"}
                alt={song.title}
                width={224}
                height={224}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold mb-1 line-clamp-2 leading-tight min-h-[2.5rem]" title={song.title}>{song.title}</h3>
              <p className="text-sm text-muted-foreground truncate mb-1" title={song.artist}>{song.artist}</p>
              <p className="text-xs text-muted-foreground/70 mt-auto">
                {song.duration > 0 ? formatDuration(song.duration) : '0:00'}
              </p>
            </div>
          </div>
        ))}
        <div className="flex items-center">
          <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            View all
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}