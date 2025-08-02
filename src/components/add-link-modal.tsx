"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Loader2
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { Song } from "@/types/music"

interface AddLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddLinkModal({ open, onOpenChange }: AddLinkModalProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [album, setAlbum] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [urlValid, setUrlValid] = useState<boolean | null>(null)

  const { addSong } = useMusicStore()

  const extractVideoId = (url: string): string | null => {
    // More comprehensive YouTube URL regex
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Validate URL
  useEffect(() => {
    if (!url.trim()) {
      setUrlValid(null)
      return
    }

    const videoId = extractVideoId(url)
    setUrlValid(videoId !== null)
  }, [url])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      setUrlValid(null)
      setIsLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !title || !artist) return

    setIsLoading(true)
    
    try {
      const videoId = extractVideoId(url)
      if (!videoId) {
        alert("Please enter a valid YouTube URL")
        return
      }

      const newSong: Song = {
        id: Date.now().toString(),
        title,
        artist,
        album,
        duration: 0, // Will be updated when playing
        url,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        uploadedAt: new Date(),
        plays: 0,
        liked: false
      }

      addSong(newSong)
      
      // Reset form
      setUrl("")
      setTitle("")
      setArtist("")
      setAlbum("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding song:", error)
      alert("Failed to add song. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 rounded-lg">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Add YouTube Music</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Add a YouTube video to your music collection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 text-sm">
              <Youtube className="w-4 h-4" />
              YouTube URL *
            </Label>
            <div className="relative">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                required
              />
              {url && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {urlValid === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {urlValid === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              )}
            </div>
            {urlValid === false && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please enter a valid YouTube URL
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 text-sm">
              <Music className="w-4 h-4" />
              Song Title *
            </Label>
            <Input
              placeholder="Enter song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Artist *
            </Label>
            <Input
              placeholder="Enter artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 text-sm">
              <Disc3 className="w-4 h-4" />
              Album (Optional)
            </Label>
            <Input
              placeholder="Enter album name (optional)"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !urlValid || !title.trim() || !artist.trim()}
              className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Song'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}