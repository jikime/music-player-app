"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { extractVideoId, fetchYouTubeDuration, getYouTubeVideoInfo, getThumbnailUrl, getYouTubeThumbnailAsBase64 } from "@/lib/youtube"
import { apiUtils } from "@/lib/api"
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
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    description: string
  }>({
    open: false,
    title: '',
    description: ''
  })

  const { addSong, updateSong, getMySongs, loadAllSongs } = useMusicStore()

  // Helper function to show alert dialog
  const showAlert = (title: string, description: string) => {
    setAlertDialog({
      open: true,
      title,
      description
    })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, open: false }))
  }

  // Auto-fill video information when URL is valid
  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) return

    setIsFetchingInfo(true)
    setFetchError(null) // Clear previous errors
    setThumbnailPreview(null)
    setThumbnailBase64(null)
    
    try {
      const videoInfo = await getYouTubeVideoInfo(videoId)
      if (videoInfo) {
        // Only auto-fill if fields are empty (check current values at time of fetch)
        setTitle(prevTitle => prevTitle.trim() ? prevTitle : videoInfo.title)
        setArtist(prevArtist => prevArtist.trim() ? prevArtist : videoInfo.author)
        
        // Fetch thumbnail as base64 for storage and preview
        try {
          const thumbnailUrl = getThumbnailUrl(videoId, 'max')
          setThumbnailPreview(thumbnailUrl) // Set preview URL first
          
          console.log('🖼️ Fetching thumbnail as base64 for video:', videoId)
          const base64Data = await getYouTubeThumbnailAsBase64(videoId)
          if (base64Data) {
            console.log('✅ Successfully converted thumbnail to base64:', {
              dataLength: base64Data.length,
              startsWithDataUrl: base64Data.startsWith('data:'),
              preview: base64Data.substring(0, 50) + '...'
            })
            setThumbnailBase64(base64Data)
          } else {
            console.warn('❌ Failed to get thumbnail as base64, using URL preview')
          }
        } catch (thumbnailError) {
          console.warn('❌ Failed to fetch thumbnail:', thumbnailError)
          // Continue without thumbnail - it's not critical
        }
        
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
  }, []) // Remove title and artist from dependencies

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
      
      // Set existing thumbnail and image_data if available
      if (songToEdit.image_data) {
        // Use base64 image data for both preview and storage
        setThumbnailPreview(songToEdit.image_data)
        setThumbnailBase64(songToEdit.image_data)
        console.log('🖼️ Loaded existing image_data for edit:', {
          hasImageData: true,
          dataLength: songToEdit.image_data.length
        })
      } else if (songToEdit.thumbnail) {
        // Fallback to thumbnail URL
        setThumbnailPreview(songToEdit.thumbnail)
        setThumbnailBase64(null)
        console.log('🖼️ Using thumbnail URL for edit (no image_data available)')
      } else {
        console.log('🖼️ No image data available for edit')
      }
    } else if (!open) {
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      setShared(false)
      setUrlValid(null)
      setFetchError(null)
      setThumbnailPreview(null)
      setThumbnailBase64(null)
      setIsLoading(false)
      closeAlert()
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
        showAlert("올바르지 않은 URL", "올바른 YouTube URL을 입력해주세요.")
        return
      }

      if (editMode && songToEdit) {
        // Update existing song
        const updates: Partial<Song> = {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || undefined,
          url: url.trim(),
          shared: shared
        }

        // Always update thumbnail image for editing
        console.log('🖼️ Updating thumbnail for song edit')
        try {
          const base64Data = thumbnailBase64 || await getYouTubeThumbnailAsBase64(videoId)
          
          if (base64Data) {
            updates.image_data = base64Data
            console.log('✅ Thumbnail updated for edit:', {
              hasImageData: true,
              dataLength: base64Data.length,
              startsWithDataUrl: base64Data.startsWith('data:'),
              preview: base64Data.substring(0, 50) + '...'
            })
          } else {
            console.warn('❌ No thumbnail data available for edit')
          }
        } catch (thumbnailError) {
          console.warn('❌ Error updating thumbnail:', thumbnailError)
        }

        // Debug log for update payload
        console.log('🔍 Updates object being sent to API:', {
          title: updates.title,
          hasImageData: !!updates.image_data,
          imageDataLength: updates.image_data?.length || 0,
          allFields: Object.keys(updates)
        })

        await updateSong(songToEdit.id, updates)
        
        // Clear all caches to ensure fresh data
        apiUtils.clearCache()
        
        // Refresh all songs lists to ensure changes are reflected
        await Promise.all([
          getMySongs(),
          loadAllSongs()
        ])
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
          image_data: thumbnailBase64 || undefined, // Store base64 image data or undefined
          lyrics: undefined,
          plays: 0,
          liked: false,
          shared: shared
        }

        // Debug log for new song creation
        console.log('🔍 Creating new song with thumbnail data')

        await addSong(songData)
        
        // Clear all caches to ensure fresh data
        apiUtils.clearCache()
        
        // Refresh both my songs and all songs lists to ensure new song appears at top
        await Promise.all([
          getMySongs(),
          loadAllSongs()
        ])
      }
      
      // Reset form and close modal
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      setShared(false)
      setThumbnailPreview(null)
      setThumbnailBase64(null)
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} song:`, error)
      const errorMessage = error instanceof Error ? error.message : '다시 시도해주세요.'
      showAlert(
        `노래 ${editMode ? '수정' : '추가'} 실패`, 
        `노래를 ${editMode ? '수정' : '추가'}하는 중 오류가 발생했습니다: ${errorMessage}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
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

          {/* Thumbnail Preview */}
          {thumbnailPreview && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm">
                Album Art Preview
              </Label>
              <div className="flex justify-center">
                <Image 
                  src={thumbnailBase64 || thumbnailPreview} 
                  alt="Album art preview"
                  width={128}
                  height={96}
                  className="w-32 h-24 object-cover rounded-lg border border-border"
                  onError={() => {
                    console.warn('Failed to load thumbnail preview')
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                이 이미지가 앨범 아트로 저장됩니다
              </p>
            </div>
          )}

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

      {/* Error Alert Dialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={closeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeAlert}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}