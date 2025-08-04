"use client"

import { useState } from "react"
import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageWithFallback } from "@/components/songs/image-with-fallback"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Music,
  Camera,
  Sparkles,
  Loader2,
  X,
  AlertCircle
} from "lucide-react"
import { useMusicStore } from "@/lib/store"
import { validateImageFile, compressImageToBase64, formatFileSize, getBase64Size } from "@/lib/image-utils"

interface CreatePlaylistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  playlistToEdit?: {
    id: string
    name: string
    description?: string
    coverImage?: string
  }
}

// Predefined gradient options like Spotify
const gradientOptions = [
  "bg-gradient-to-br from-purple-600 to-blue-600",
  "bg-gradient-to-br from-green-600 to-teal-600",
  "bg-gradient-to-br from-red-600 to-pink-600",
  "bg-gradient-to-br from-yellow-600 to-orange-600",
  "bg-gradient-to-br from-indigo-600 to-purple-600",
  "bg-gradient-to-br from-pink-600 to-rose-600",
  "bg-gradient-to-br from-cyan-600 to-blue-600",
  "bg-gradient-to-br from-emerald-600 to-green-600",
]

export function CreatePlaylistModal({ open, onOpenChange, editMode = false, playlistToEdit }: CreatePlaylistModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [selectedGradient, setSelectedGradient] = useState(gradientOptions[0])
  const [isLoading, setIsLoading] = useState(false)
  const [useGradient, setUseGradient] = useState(true)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const isMobile = useIsMobile()
  
  const { addPlaylist, updatePlaylist } = useMusicStore()

  // Initialize form when editing
  React.useEffect(() => {
    if (editMode && playlistToEdit && open) {
      setName(playlistToEdit.name)
      setDescription(playlistToEdit.description || "")
      
      if (playlistToEdit.coverImage) {
        if (playlistToEdit.coverImage.startsWith('bg-')) {
          setSelectedGradient(playlistToEdit.coverImage)
          setUseGradient(true)
          setCoverImage(null)
        } else {
          setCoverImage(playlistToEdit.coverImage)
          setUseGradient(false)
        }
      }
    } else if (!open) {
      // Reset form when closing
      setName("")
      setDescription("")
      setCoverImage(null)
      setSelectedGradient(gradientOptions[0])
      setUseGradient(true)
      setImageError(null)
      setIsProcessingImage(false)
    }
  }, [editMode, playlistToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      if (editMode && playlistToEdit) {
        // Update existing playlist
        await updatePlaylist(playlistToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          coverImage: useGradient ? selectedGradient : (coverImage || selectedGradient)
        })
      } else {
        // Create new playlist
        await addPlaylist({
          name: name.trim(),
          description: description.trim(),
          coverImage: useGradient ? selectedGradient : (coverImage || selectedGradient)
        })
      }
      
      // Reset form
      setName("")
      setDescription("")
      setCoverImage(null)
      setSelectedGradient(gradientOptions[0])
      setUseGradient(true)
      setImageError(null)
      setIsProcessingImage(false)
      onOpenChange(false)
    } catch (error) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} playlist:`, error)
      alert(`Failed to ${editMode ? 'update' : 'create'} playlist. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 기존 에러 초기화
    setImageError(null)
    setIsProcessingImage(true)

    try {
      // 파일 검증
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        setImageError(validation.error || '유효하지 않은 이미지 파일입니다.')
        return
      }

      // 이미지 압축 및 base64 변환
      const compressedBase64 = await compressImageToBase64(file, 512, 512, 0.8)
      
      // 압축된 이미지 크기 확인
      const compressedSize = getBase64Size(compressedBase64)
      console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedSize)}`)

      // 1MB 이상이면 추가 압축
      if (compressedSize > 1024 * 1024) {
        const furtherCompressed = await compressImageToBase64(file, 400, 400, 0.6)
        setCoverImage(furtherCompressed)
        console.log(`Further compressed: ${formatFileSize(getBase64Size(furtherCompressed))}`)
      } else {
        setCoverImage(compressedBase64)
      }
      
      setUseGradient(false)
    } catch (error) {
      console.error('Image processing error:', error)
      setImageError('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.')
    } finally {
      setIsProcessingImage(false)
      // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setCoverImage(null)
    setUseGradient(true)
    setImageError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-card border-border ${
        isMobile 
          ? 'max-w-[95vw] w-full mx-2' 
          : 'sm:max-w-[500px]'
      }`}>
        <DialogHeader>
          <DialogTitle className={`font-bold ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>{editMode ? 'Edit Playlist' : 'Create Playlist'}</DialogTitle>
          <DialogDescription className={`text-muted-foreground ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {editMode ? 'Update the name and description for your playlist' : 'Add a name and description for your playlist'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={isMobile ? 'space-y-4' : 'space-y-6'}>
          {/* Cover Image Section */}
          <div className={`${
            isMobile ? 'flex flex-col space-y-4' : 'flex gap-6'
          }`}>
            <div className={`relative group ${
              isMobile ? 'self-center' : ''
            }`}>
              <div className={`rounded-lg overflow-hidden shadow-xl ${
                isMobile 
                  ? 'w-32 h-32' 
                  : 'w-44 h-44'
              } ${useGradient ? selectedGradient : 'bg-muted'}`}>
                {!useGradient && coverImage ? (
                  <ImageWithFallback
                    src={coverImage}
                    alt="Playlist cover"
                    width={isMobile ? 128 : 176}
                    height={isMobile ? 128 : 176}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className={`text-white/80 ${
                      isMobile ? 'w-12 h-12' : 'w-16 h-16'
                    }`} />
                  </div>
                )}
              </div>
              
              {/* Upload/Edit Button */}
              <div className={`absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center transition-opacity ${
                isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {isProcessingImage ? (
                  <div className="flex flex-col items-center text-white gap-2">
                    <Loader2 className={`animate-spin ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                    <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      처리 중...
                    </span>
                  </div>
                ) : (
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    <div className={`flex flex-col items-center text-white ${
                      isMobile ? 'gap-1' : 'gap-2'
                    }`}>
                      <Camera className={isMobile ? 'w-6 h-6' : 'w-8 h-8'} />
                      <span className={`font-medium ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>Choose photo</span>
                    </div>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isProcessingImage}
                    />
                  </label>
                )}
              </div>

              {/* Remove Image Button */}
              {!useGradient && coverImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className={`absolute p-1 bg-black/60 rounded-full text-white transition-opacity ${
                    isMobile 
                      ? 'top-1 right-1 opacity-100' 
                      : 'top-2 right-2 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <X className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className={`${
              isMobile ? 'w-full space-y-3' : 'flex-1 space-y-4'
            }`}>
              {/* Image Error Message */}
              {imageError && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>{imageError}</span>
                </div>
              )}

              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <Label htmlFor="name" className={isMobile ? 'text-sm' : ''}>
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isMobile ? "Playlist name" : "My Awesome Playlist"}
                  className={`bg-background ${isMobile ? "text-sm h-8 px-2" : ""}`}
                  required
                  maxLength={100}
                />
              </div>

              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <Label htmlFor="description" className={isMobile ? 'text-sm' : ''}>
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isMobile ? "Describe your playlist" : "Give your playlist a catchy description"}
                  className={`bg-background resize-none ${
                    isMobile ? 'text-sm' : ''
                  }`}
                  rows={isMobile ? 2 : 3}
                  maxLength={300}
                />
              </div>
            </div>
          </div>

          {/* Gradient Selection */}
          {useGradient && (
            <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
              <div className="flex items-center gap-2">
                <Sparkles className={`text-muted-foreground ${
                  isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
                }`} />
                <Label className={isMobile ? 'text-xs' : 'text-sm'}>
                  Choose a color
                </Label>
              </div>
              <div className={`grid gap-2 ${
                isMobile ? 'grid-cols-6' : 'grid-cols-8'
              }`}>
                {gradientOptions.map((gradient, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedGradient(gradient)}
                    className={`rounded ${gradient} ${
                      isMobile ? 'w-8 h-8' : 'w-10 h-10'
                    } ${
                      selectedGradient === gradient 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex justify-end gap-3 ${
            isMobile ? 'pt-2' : 'pt-2'
          }`}>
            <Button
              type="button"
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size={isMobile ? "sm" : "default"}
              disabled={!name.trim() || isLoading || isProcessingImage}
              className={isMobile ? 'min-w-[80px]' : 'min-w-[100px]'}
            >
              {isLoading ? (
                <>
                  <Loader2 className={`animate-spin mr-2 ${
                    isMobile ? 'w-3 h-3' : 'w-4 h-4'
                  }`} />
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : isProcessingImage ? (
                <>
                  <Loader2 className={`animate-spin mr-2 ${
                    isMobile ? 'w-3 h-3' : 'w-4 h-4'
                  }`} />
                  Processing...
                </>
              ) : (
                editMode ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}