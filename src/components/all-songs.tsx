import { useState } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MoreHorizontal,
  Clock,
  Music,
  Loader2,
} from "lucide-react"
import { formatDuration, formatPlays, getTotalDuration } from "@/lib/music-utils"
import { useMusicStore } from "@/lib/store"
import type { Song } from "@/types/music"

interface AllSongsProps {
  songs: Song[]
  onPlaySong: (song: Song) => void
}

export function AllSongs({ songs, onPlaySong }: AllSongsProps) {
  const [bookmarkingStates, setBookmarkingStates] = useState<Record<string, boolean>>({})
  
  const {
    isBookmarked,
    addBookmark,
    removeBookmark
  } = useMusicStore()

  const handleToggleBookmark = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (bookmarkingStates[songId]) return
    
    setBookmarkingStates(prev => ({ ...prev, [songId]: true }))
    
    try {
      if (isBookmarked(songId)) {
        await removeBookmark(songId)
        console.log('북마크에서 제거되었습니다.')
      } else {
        await addBookmark(songId)
        console.log('북마크에 추가되었습니다.')
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      
      if (errorMessage.includes('already bookmarked')) {
        console.warn('이미 북마크된 노래입니다.')
      } else {
        console.warn(`북마크 처리 중 오류: ${errorMessage}`)
      }
    } finally {
      setBookmarkingStates(prev => ({ ...prev, [songId]: false }))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground uppercase tracking-wider">ALL SONGS</h2>
        {songs.length > 0 && (
          <span className="text-xs text-muted-foreground/70">
            {songs.length} song{songs.length !== 1 ? 's' : ''} • {getTotalDuration(songs)}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {songs.map((song, index) => (
          <div 
            key={song.id} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-card/30 group cursor-pointer"
            onClick={() => onPlaySong(song)}
          >
            <span className="text-muted-foreground w-8 text-sm">#{index + 1}</span>
            <ImageWithFallback
              src={song.thumbnail || "/placeholder.svg"}
              alt={song.title}
              width={50}
              height={50}
              className="w-12 aspect-square rounded object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{song.title}</h3>
              <p className="text-sm text-muted-foreground">{song.artist}</p>
            </div>
            <div className="text-sm text-muted-foreground min-w-0 flex-1">{song.album || 'Unknown Album'}</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Music className="w-4 h-4" />
                <span className="text-sm">{formatPlays(song.plays)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatDuration(song.duration)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 ${isBookmarked(song.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
                onClick={(e) => handleToggleBookmark(song.id, e)}
                disabled={bookmarkingStates[song.id]}
              >
                {bookmarkingStates[song.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${isBookmarked(song.id) ? "fill-current" : ""}`} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}