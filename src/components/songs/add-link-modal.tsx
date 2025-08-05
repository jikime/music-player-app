"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Youtube,
  Music,
  User,
  Disc3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Share2
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { extractVideoId, fetchYouTubeDuration, getYouTubeVideoInfo, getThumbnailUrl } from "@/lib/youtube"
import type { Song } from "@/types/music"

interface AddLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  songToEdit?: Song
}

const handleModalClose = (isLoading: boolean, onOpenChange: (open: boolean) => void) => {
  // 로딩 중이면 모달 닫기 방지
  if (isLoading) return
  onOpenChange(false)
}

export function AddLinkModal({ open, onOpenChange, editMode = false, songToEdit }: AddLinkModalProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [album, setAlbum] = useState("")
  const [shared, setShared] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [urlValid, setUrlValid] = useState<boolean | null>(null)
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const { addSong, updateSong, getMySongs } = useMusicStore()

  // Auto-fill video information when URL is valid
  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) return

    setIsFetchingInfo(true)
    setFetchError(null) // Clear previous errors
    
    try {
      const videoInfo = await getYouTubeVideoInfo(videoId)
      if (videoInfo) {
        // Only auto-fill if fields are empty
        if (!title.trim()) setTitle(videoInfo.title)
        if (!artist.trim()) setArtist(videoInfo.author)
        setFetchError(null) // Clear error on success
      } else {
        // Video info is null - could be private, deleted, or unavailable
        setFetchError('이 YouTube 동영상의 정보를 가져올 수 없습니다. 동영상이 비공개이거나 삭제되었을 수 있습니다.')
        setUrlValid(false)
      }
    } catch (error) {
      console.warn('Failed to fetch video info:', error)
      const errorMessage = error instanceof Error && error.message.includes('not found') 
        ? '동영상을 찾을 수 없습니다. URL을 다시 확인해주세요.'
        : '동영상 정보를 가져오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
      setFetchError(errorMessage)
      setUrlValid(false)
    } finally {
      setIsFetchingInfo(false)
    }
  }, [artist, title])

  // Validate URL and fetch video info
  useEffect(() => {
    if (!url.trim()) {
      setUrlValid(null)
      setFetchError(null)
      return
    }

    const videoId = extractVideoId(url)
    const isValid = videoId !== null
    
    if (isValid) {
      setUrlValid(true) // Initially valid format
      setFetchError(null)
      // Auto-fetch video info when URL becomes valid
      fetchVideoInfo(url)
    } else {
      setUrlValid(false)
      setFetchError('올바른 YouTube URL 형식이 아닙니다.')
    }
  }, [url, fetchVideoInfo])

  // Initialize form when editing or reset when modal opens/closes
  useEffect(() => {
    if (editMode && songToEdit && open) {
      setUrl(songToEdit.url)
      setTitle(songToEdit.title)
      setArtist(songToEdit.artist)
      setAlbum(songToEdit.album || "")
      setShared(songToEdit.shared)
      setUrlValid(true) // Assume existing URL is valid
    } else if (!open) {
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      setShared(false)
      setUrlValid(null)
      setFetchError(null)
      setIsLoading(false)
    }
  }, [editMode, songToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !title || !artist) return
    
    // 이미 로딩 중이면 중복 제출 방지
    if (isLoading) return

    // URL이 유효하지 않거나 fetch 에러가 있으면 제출 방지
    if (!urlValid || fetchError) {
      return
    }

    setIsLoading(true)
    
    try {
      const videoId = extractVideoId(url)
      if (!videoId) {
        alert("올바른 YouTube URL을 입력해주세요.")
        return
      }

      if (editMode && songToEdit) {
        // Update existing song
        const updates = {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || undefined,
          url: url.trim(),
          shared: shared
        }

        await updateSong(songToEdit.id, updates)
        
        // Refresh my songs list
        await getMySongs()
      } else {
        // Add new song
        // Fetch video duration for new songs
        let duration = 0
        try {
          duration = await fetchYouTubeDuration(url)
          console.log(`Fetched duration: ${duration} seconds`)
        } catch (durationError) {
          console.warn('Failed to fetch duration, using 0:', durationError)
          // Continue with duration 0 - it's not critical for saving the song
        }

        const songData = {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || undefined,
          duration,
          url: url.trim(),
          thumbnail: getThumbnailUrl(videoId, 'max'),
          lyrics: undefined,
          plays: 0,
          liked: false,
          shared: shared
        }

        await addSong(songData)
        
        // Refresh my songs list
        await getMySongs()
      }
      
      // Reset form and close modal
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      setShared(false)
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} song:`, error)
      alert(`Failed to ${editMode ? 'update' : 'add'} song: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => handleModalClose(isLoading, onOpenChange)}>
      <DialogContent className="max-w-[350px] bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 rounded-lg">
              <Youtube className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editMode ? 'Edit Song' : 'Add YouTube Music'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {editMode ? 'Edit song information' : 'Add a YouTube video to your music collection'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2 text-sm">
              <Youtube className="w-4 h-4" />
              YouTube URL *
              {isFetchingInfo && (
                <span className="text-xs text-blue-400">(자동 정보 가져오는 중...)</span>
              )}
            </Label>
            <div className="relative">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-input border-border text-foreground placeholder-muted-foreground pr-10"
                required
              />
              {url && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFetchingInfo && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {!isFetchingInfo && urlValid === true && !fetchError && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {!isFetchingInfo && (urlValid === false || fetchError) && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              )}
            </div>
            {(urlValid === false || fetchError) && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fetchError || 'Please enter a valid YouTube URL'}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2 text-sm">
              <Music className="w-4 h-4" />
              Song Title *
            </Label>
            <Input
              placeholder="Enter song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border text-foreground placeholder-muted-foreground"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Artist *
            </Label>
            <Input
              placeholder="Enter artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="bg-input border-border text-foreground placeholder-muted-foreground"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2 text-sm">
              <Disc3 className="w-4 h-4" />
              Album (Optional)
            </Label>
            <Input
              placeholder="Enter album name (optional)"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="bg-input border-border text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Share Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="shared"
              checked={shared}
              onCheckedChange={(checked) => setShared(checked as boolean)}
            />
            <Label 
              htmlFor="shared" 
              className="text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share with community
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Other users will be able to see and play this song
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalClose(isLoading, onOpenChange)}
              disabled={isLoading}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isFetchingInfo || !urlValid || fetchError !== null || !title.trim() || !artist.trim()}
              className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : isFetchingInfo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                editMode ? 'Update Song' : 'Add Song'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}