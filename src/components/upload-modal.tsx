"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Music, Image, FileText, X, Check } from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { musicDB } from "@/lib/db"
import { Song } from "@/types/music"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UploadForm {
  title: string
  artist: string
  album?: string
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [lyricsFile, setLyricsFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const addSong = useMusicStore((state) => state.addSong)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>()

  const onDropAudio = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setAudioFile(file)
      setAudioPreview(URL.createObjectURL(file))
    }
  }, [])

  const onDropCover = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }, [])

  const onDropLyrics = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setLyricsFile(file)
    }
  }, [])

  const audioDropzone = useDropzone({
    onDrop: onDropAudio,
    accept: {
      'audio/mp3': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      'audio/m4a': ['.m4a']
    },
    maxFiles: 1
  })

  const coverDropzone = useDropzone({
    onDrop: onDropCover,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1
  })

  const lyricsDropzone = useDropzone({
    onDrop: onDropLyrics,
    accept: {
      'text/plain': ['.txt'],
      'text/lrc': ['.lrc']
    },
    maxFiles: 1
  })

  const onSubmit = async (data: UploadForm) => {
    if (!audioFile) return

    setIsUploading(true)
    try {
      // Store files in IndexedDB
      const audioId = await musicDB.storeFile(audioFile, 'audio')
      let coverId: string | undefined
      let lyrics: string | undefined

      if (coverFile) {
        coverId = await musicDB.storeFile(coverFile, 'image')
      }

      if (lyricsFile) {
        await musicDB.storeFile(lyricsFile, 'lyrics')
        const text = await lyricsFile.text()
        lyrics = text
      }

      // Get audio duration with better error handling
      let audioDuration = 0
      try {
        const audio = new Audio(audioPreview!)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio metadata loading timeout'))
          }, 10000) // 10 second timeout

          audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout)
            audioDuration = audio.duration || 0
            resolve(undefined)
          }, { once: true })

          audio.addEventListener('error', (e) => {
            clearTimeout(timeout)
            console.error('Audio loading error:', e)
            reject(new Error('Failed to load audio metadata'))
          }, { once: true })

          // Start loading
          audio.load()
        })
      } catch (error) {
        console.warn('Could not load audio metadata:', error)
        // Use a default duration if metadata loading fails
        audioDuration = 180 // 3 minutes default
      }

      // Create song object
      const newSong: Song = {
        id: Date.now().toString(),
        title: data.title,
        artist: data.artist,
        album: data.album,
        duration: audioDuration,
        file: audioId,
        coverImage: coverId,
        lyrics,
        uploadedAt: new Date(),
        plays: 0,
        liked: false
      }

      // Add to store
      addSong(newSong)

      // Reset form
      reset()
      setAudioFile(null)
      setCoverFile(null)
      setLyricsFile(null)
      setAudioPreview(null)
      setCoverPreview(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = (type: 'audio' | 'cover' | 'lyrics') => {
    switch (type) {
      case 'audio':
        setAudioFile(null)
        if (audioPreview) URL.revokeObjectURL(audioPreview)
        setAudioPreview(null)
        break
      case 'cover':
        setCoverFile(null)
        if (coverPreview) URL.revokeObjectURL(coverPreview)
        setCoverPreview(null)
        break
      case 'lyrics':
        setLyricsFile(null)
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Upload Music</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload your music files, cover art, and lyrics
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Audio Upload */}
            <div className="col-span-1">
              <div
                {...audioDropzone.getRootProps()}
                className={`
                  relative aspect-square rounded-lg border-2 border-dashed
                  ${audioFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 hover:border-white/40'}
                  cursor-pointer transition-all flex flex-col items-center justify-center
                `}
              >
                <input {...audioDropzone.getInputProps()} />
                {audioFile ? (
                  <>
                    <Check className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-sm text-white text-center px-2">{audioFile.name}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile('audio')
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Music className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">Audio File</p>
                    <p className="text-xs text-gray-500">Required</p>
                  </>
                )}
              </div>
            </div>

            {/* Cover Upload */}
            <div className="col-span-1">
              <div
                {...coverDropzone.getRootProps()}
                className={`
                  relative aspect-square rounded-lg border-2 border-dashed
                  ${coverFile ? 'border-white/40' : 'border-white/20 hover:border-white/40'}
                  cursor-pointer transition-all overflow-hidden
                `}
              >
                <input {...coverDropzone.getInputProps()} />
                {coverFile && coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile('cover')
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">Cover Art</p>
                    <p className="text-xs text-gray-500">Optional</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lyrics Upload */}
            <div className="col-span-1">
              <div
                {...lyricsDropzone.getRootProps()}
                className={`
                  relative aspect-square rounded-lg border-2 border-dashed
                  ${lyricsFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 hover:border-white/40'}
                  cursor-pointer transition-all flex flex-col items-center justify-center
                `}
              >
                <input {...lyricsDropzone.getInputProps()} />
                {lyricsFile ? (
                  <>
                    <Check className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-sm text-white text-center px-2">{lyricsFile.name}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile('lyrics')
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">Lyrics</p>
                    <p className="text-xs text-gray-500">Optional</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Title *</label>
              <input
                {...register("title", { required: "Title is required" })}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                placeholder="Enter song title"
              />
              {errors.title && (
                <p className="text-sm text-red-400 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400">Artist *</label>
              <input
                {...register("artist", { required: "Artist is required" })}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                placeholder="Enter artist name"
              />
              {errors.artist && (
                <p className="text-sm text-red-400 mt-1">{errors.artist.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400">Album</label>
              <input
                {...register("album")}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                placeholder="Enter album name (optional)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!audioFile || isUploading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}